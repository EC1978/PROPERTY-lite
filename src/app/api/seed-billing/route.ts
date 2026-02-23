import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Seed endpoint for billing data.
 * GET /api/seed-billing — navigate here in browser while logged in.
 * Add ?force=true to re-seed (deletes existing data first).
 */
export async function GET(request: Request) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const force = searchParams.get('force') === 'true'

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated — please log in first at /login' }, { status: 401 })
    }

    // If force, delete existing data first
    if (force) {
        await supabase.from('invoices').delete().eq('user_id', user.id)
        await supabase.from('subscriptions').delete().eq('user_id', user.id)
    } else {
        // Check if subscription already exists
        const { data: existingSub } = await supabase
            .from('subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle()

        if (existingSub) {
            return NextResponse.json({
                message: 'Billing data already exists. Add ?force=true to re-seed.',
                user_id: user.id,
            })
        }
    }

    // Insert subscription
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)
    periodEnd.setDate(1)

    const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
            user_id: user.id,
            plan: 'Professional',
            status: 'active',
            period_end: periodEnd.toISOString(),
        })

    if (subError) {
        return NextResponse.json({ error: `Subscription insert failed: ${subError.message}` }, { status: 500 })
    }

    // Generate 6 months of invoices
    const now = new Date()
    const invoices = []

    for (let i = 0; i < 6; i++) {
        const invoiceDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const seqNum = String(100 - i * 11).padStart(3, '0')

        invoices.push({
            user_id: user.id,
            invoice_number: `INV-${invoiceDate.getFullYear()}-${seqNum}`,
            amount: 149.00,
            date: invoiceDate.toISOString().split('T')[0],
            status: i === 0 ? 'In behandeling' : 'Betaald',
            download_url: i === 0 ? null : `https://storage.example.com/invoices/INV-${invoiceDate.getFullYear()}-${seqNum}.pdf`,
            document_type: 'Factuur',
        })
    }

    const { error: invError } = await supabase
        .from('invoices')
        .insert(invoices)

    if (invError) {
        return NextResponse.json({ error: `Invoices insert failed: ${invError.message}` }, { status: 500 })
    }

    return NextResponse.json({
        success: true,
        message: 'Billing data seeded! Go to /settings/billing to see it.',
        user_id: user.id,
        subscription: 'Professional',
        invoices: invoices.length,
    })
}

export async function POST(request: Request) {
    return GET(request)
}
