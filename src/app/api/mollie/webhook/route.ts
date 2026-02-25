import { NextResponse } from 'next/server'
import { getMollie } from '@/utils/mollie'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get('content-type')
        let paymentId = ''

        if (contentType?.includes('application/x-www-form-urlencoded')) {
            const formData = await req.formData()
            paymentId = formData.get('id') as string
        } else if (contentType?.includes('application/json')) {
            const json = await req.json()
            paymentId = json.id
        }

        if (!paymentId) {
            return NextResponse.json({ error: 'Missing payment id' }, { status: 400 })
        }

        const mollieClient = await getMollie()
        const payment = await mollieClient.payments.get(paymentId)

        const metadata = payment.metadata as any
        const userId = metadata?.userId
        const plan = metadata?.plan

        if (!userId) {
            console.error('[Mollie Webhook] No userId found in payment metadata')
            return NextResponse.json({ success: true }) // Acknowledge to stop retries
        }

        if (payment.status === 'paid') {
            console.log(`[Mollie Webhook] Payment ${paymentId} is PAID for user ${userId}, plan ${plan}`)

            // 1. Update Subscription
            const nextMonth = new Date()
            nextMonth.setMonth(nextMonth.getMonth() + 1)

            await supabase
                .from('subscriptions')
                .upsert({
                    user_id: userId,
                    plan: plan || 'Elite', // fallback
                    status: 'active',
                    period_start: new Date().toISOString(),
                    period_end: nextMonth.toISOString(),
                })

            // 2. Create Invoice
            await supabase
                .from('invoices')
                .insert({
                    user_id: userId,
                    invoice_number: `INV-${Date.now()}`,
                    amount: `€ ${payment.amount.value}`,
                    status: 'Betaald',
                    date: new Date().toISOString(),
                    document: plan || 'Abonnement',
                })

        } else if (payment.status === 'canceled' || payment.status === 'expired' || payment.status === 'failed') {
            console.log(`[Mollie Webhook] Payment ${paymentId} failed/canceled for user ${userId}`)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('[Mollie Webhook] Error:', error)
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
    }
}
