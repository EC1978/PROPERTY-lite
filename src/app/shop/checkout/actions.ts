'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { createMollieClient, PaymentMethod } from '@mollie/api-client'
import { headers } from 'next/headers'

export async function createCheckoutSession(orderData: any) {
    try {
        const supabase = await createAdminClient()

        // 1. Fetch Mollie Settings
        const { data: settings, error: settingsError } = await supabase
            .from('platform_settings')
            .select('mollie_test_api_key, mollie_live_api_key, mollie_is_test_mode')
            .eq('id', 1)
            .single()

        if (settingsError || !settings) {
            console.error('Failed to fetch Mollie settings:', settingsError)
            return { success: false, error: 'Betaalsysteem momenteel onbereikbaar. Probeer het later.' }
        }

        const apiKey = settings.mollie_is_test_mode ? settings.mollie_test_api_key : settings.mollie_live_api_key

        if (!apiKey) {
            return { success: false, error: 'Betaalsysteem nog niet volledig geconfigureerd.' }
        }

        // 2. Initialize Mollie
        const mollieClient = createMollieClient({ apiKey })

        // 3. Insert Order into Supabase (status: pending)
        const { data: order, error: orderError } = await supabase
            .from('shop_orders')
            .insert({
                user_id: orderData.userId,
                status: 'pending',
                total_amount: orderData.totalAmount,
                tax_amount: orderData.taxAmount,
                shipping_cost: orderData.shippingCost,
                payment_method: orderData.paymentMethod,
                billing_address: orderData.billingAddress,
                shipping_address: orderData.shippingAddress,
                design_url: orderData.designUrl
            })
            .select()
            .single()

        if (orderError || !order) {
            console.error('Failed to create order in DB:', orderError)
            return { success: false, error: 'Bestelling kon niet worden aangemaakt.' }
        }

        // 4. Insert Order Items
        const { error: itemsError } = await supabase
            .from('shop_order_items')
            .insert(orderData.items.map((item: any) => ({
                order_id: order.id,
                product_id: item.productId,
                quantity: item.quantity,
                unit_price: item.unitPrice,
                total_price: item.totalPrice,
                selected_options: item.selectedOptions
            })))

        if (itemsError) {
            console.error('Failed to create order items:', itemsError)
            return { success: false, error: 'Fout bij het opslaan van producten.' }
        }

        // 5. Create Mollie Payment
        const headersList = await headers()
        const host = headersList.get('host')
        const protocol = host?.includes('localhost') ? 'http' : 'https'
        const domain = `${protocol}://${host}`

        const payment = await (mollieClient.payments.create({
            amount: {
                value: orderData.totalAmount.toFixed(2),
                currency: 'EUR'
            },
            description: `Order #${order.id.slice(0, 8)} - VoiceRealty`,
            redirectUrl: `${domain}/shop/checkout/success?order_id=${order.id}`,
            webhookUrl: `${domain}/api/payments/webhook`,
            metadata: {
                order_id: order.id,
            },
            method: orderData.paymentMethod === 'ideal' ? PaymentMethod.ideal : undefined
        }) as Promise<any>);

        // 6. Update Order with Payment ID
        await supabase
            .from('shop_orders')
            .update({ payment_intent_id: payment.id })
            .eq('id', order.id)

        // 7. Return Checkout URL
        return {
            success: true,
            checkoutUrl: payment._links?.checkout?.href || payment.getCheckoutUrl(),
            orderId: order.id
        }

    } catch (error: any) {
        console.error('Error in createCheckoutSession:', error)
        return { success: false, error: error.message || 'Een onbekende fout is opgetreden' }
    }
}
