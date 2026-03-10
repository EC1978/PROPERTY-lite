import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { createMollieClient } from '@mollie/api-client'

export async function POST(req: Request) {
    try {
        const formData = await req.formData()
        const paymentId = formData.get('id') as string

        if (!paymentId) {
            return new Response('Missing payment ID', { status: 400 })
        }

        const supabase = await createAdminClient()

        // Debug Log
        await supabase.from('audit_logs').insert({
            admin_email: 'SYSTEM_WEBHOOK',
            action: 'MOLLIE_WEBHOOK_RECEIVED',
            details: { paymentId }
        })

        console.log(`Received Mollie webhook for payment: ${paymentId}`)

        // 1. Fetch Mollie Settings to get the correct API Key
        const { data: settings } = await supabase
            .from('platform_settings')
            .select('mollie_test_api_key, mollie_live_api_key, mollie_is_test_mode')
            .eq('id', 1)
            .single()

        if (!settings) throw new Error('Could not retrieve Mollie settings from database')

        const apiKey = settings.mollie_is_test_mode ? settings.mollie_test_api_key : settings.mollie_live_api_key

        if (!apiKey) throw new Error('No Mollie API key configured')

        // 2. Initialize Mollie
        const mollieClient = createMollieClient({ apiKey })

        // 3. Fetch current payment status from Mollie
        const payment = await mollieClient.payments.get(paymentId) as any // Bypass strict typings for ease of access

        const orderId = payment.metadata?.order_id
        if (!orderId) {
            console.error('Payment missing order_id metadata', paymentId)
            return NextResponse.json({ received: true }) // Don't block Mollie with 500 error for unlinked payments
        }

        // 4. Map Mollie status to our DB status
        let newStatus = 'pending'
        const mollieStatus = payment.status

        if (mollieStatus === 'paid') {
            newStatus = 'paid'
        } else if (mollieStatus === 'failed') {
            newStatus = 'failed'
        } else if (mollieStatus === 'canceled' || mollieStatus === 'cancelled') {
            newStatus = 'cancelled'
        } else if (mollieStatus === 'expired') {
            newStatus = 'expired'
        }

        console.log(`Updating order ${orderId} to status: ${newStatus} (Mollie status: ${mollieStatus})`)

        // 5. Update Order in DB
        // We update by orderId (from metadata) OR by payment_intent_id as fallback
        const { error: updateError } = await supabase
            .from('shop_orders')
            .update({
                status: newStatus,
                payment_intent_id: paymentId,
                updated_at: new Date().toISOString()
            })
            .or(`id.eq.${orderId},payment_intent_id.eq.${paymentId}`)

        if (updateError) {
            console.error('Database update error:', updateError)
            throw new Error(`DB Update failed: ${updateError.message}`)
        }

        // Log Success
        await supabase.from('audit_logs').insert({
            admin_email: 'SYSTEM_WEBHOOK',
            action: 'MOLLIE_WEBHOOK_SUCCESS',
            details: { orderId, paymentId, newStatus, mollieStatus }
        })

        return NextResponse.json({ received: true })

    } catch (error: any) {
        console.error('Webhook processing error:', error)

        // Error Log
        const supabase = await createAdminClient()
        await supabase.from('audit_logs').insert({
            admin_email: 'SYSTEM_WEBHOOK',
            action: 'MOLLIE_WEBHOOK_ERROR',
            details: { error: error.message, stack: error.stack }
        })

        return new Response('Webhook Error', { status: 500 })
    }
}
