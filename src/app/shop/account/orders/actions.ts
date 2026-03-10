'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createMollieClient, PaymentMethod } from '@mollie/api-client'
import { headers } from 'next/headers'

export async function updateOrderStatus(orderId: string, status: string) {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
        .from('shop_orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single()

    if (error) {
        console.error('Error updating order status:', error)
        throw new Error(error.message)
    }

    revalidatePath('/shop/account/orders')
    revalidatePath(`/shop/account/orders/${orderId}`)

    return { success: true, data }
}

export async function getOrderPaymentUrl(orderId: string) {
    try {
        const supabase = await createAdminClient()

        // 1. Fetch Order & Settings
        const [orderResult, settingsResult] = await Promise.all([
            supabase.from('shop_orders').select('*').eq('id', orderId).single(),
            supabase.from('platform_settings').select('*').eq('id', 1).single()
        ])

        if (orderResult.error || !orderResult.data) throw new Error('Order niet gevonden')
        if (settingsResult.error || !settingsResult.data) throw new Error('Betaalinstellingen niet gevonden')

        const order = orderResult.data
        const settings = settingsResult.data
        const apiKey = settings.mollie_is_test_mode ? settings.mollie_test_api_key : settings.mollie_live_api_key

        if (!apiKey) throw new Error('Geen Mollie API key geconfigureerd')

        // 2. Initialize Mollie
        const mollieClient = createMollieClient({ apiKey })

        // 3. Domain setup
        const headersList = await headers()
        const host = headersList.get('host')
        const protocol = host?.includes('localhost') ? 'http' : 'https'
        const domain = `${protocol}://${host}`

        const webhookUrl = `${domain}/api/payments/webhook`

        // Log for debugging
        await supabase.from('audit_logs').insert({
            admin_email: 'SYSTEM_PAYMENT_RECOVERY',
            action: 'MOLLIE_URL_GENERATED',
            details: { orderId: order.id, webhookUrl, domain }
        })

        // 4. Create Mollie Payment
        const payment = await (mollieClient.payments.create({
            amount: {
                value: Number(order.total_amount).toFixed(2),
                currency: 'EUR'
            },
            description: `Order #${order.order_number || order.id.slice(0, 8)} - VoiceRealty`,
            redirectUrl: `${domain}/shop/checkout/success?order_id=${order.id}`,
            webhookUrl: webhookUrl,
            metadata: {
                order_id: order.id,
            },
            method: order.payment_method === 'ideal' ? PaymentMethod.ideal : undefined
        }) as Promise<any>)

        // 5. Update Order with Intent ID
        await supabase
            .from('shop_orders')
            .update({ payment_intent_id: payment.id })
            .eq('id', order.id)

        return {
            success: true,
            checkoutUrl: payment._links?.checkout?.href || payment.getCheckoutUrl()
        }

    } catch (error: any) {
        console.error('Error generating payment link:', error)
        return { success: false, error: error.message }
    }
}
