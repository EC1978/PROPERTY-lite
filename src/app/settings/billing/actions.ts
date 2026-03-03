'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { createMolliePayment } from '@/utils/mollie'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function getSubscription() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null
    }

    const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

    if (error) {
        console.error('Error fetching subscription:', error)
        return null
    }

    return data
}

export async function getInvoices(limit?: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return []
    }

    let query = supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })

    if (limit) {
        query = query.limit(limit)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching invoices:', error)
        return []
    }

    return data || []
}

export async function getInvoiceHistory() {
    return getInvoices()
}

export async function handlePaymentMethod(formData?: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return
    }

    try {
        const headersList = await headers()
        const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'

        const payment = await createMolliePayment({
            plan: 'Essential', // Default for adding a payment method/testing
            userId: user.id,
            origin: origin
        })

        if (payment.getCheckoutUrl()) {
            redirect(payment.getCheckoutUrl()!)
        }
    } catch (error) {
        console.error('Failed to prepare payment method:', error)
    }
}

export async function createCheckoutSession(planId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, message: 'Niet ingelogd' }
    }

    try {
        const headersList = await headers()
        const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
        const isLocalhost = origin.includes('localhost')

        try {
            const payment = await createMolliePayment({
                plan: planId,
                userId: user.id,
                origin: origin
            })

            const checkoutUrl = payment.getCheckoutUrl()
            if (checkoutUrl) {
                return { success: true, url: checkoutUrl }
            }
        } catch (mollieErr) {
            console.log('DEBUG: Mollie failed, entering bypass check. Localhost:', isLocalhost)
            console.error('Mollie failure, checking for demo bypass:', mollieErr)

            // If we're on localhost, we allow a "Demo Bypass"
            if (isLocalhost) {
                console.log('DEMO MODE: Activating package directly for user', user.id, 'Plan:', planId)
                const supabaseAdmin = await createAdminClient()

                // 1. Fetch package details to get features
                const { data: pkg, error: pkgError } = await supabaseAdmin
                    .from('packages')
                    .select('*')
                    .eq('id', planId)
                    .single()

                if (pkgError) console.error('DEBUG: Package fetch error:', pkgError)

                if (pkg) {
                    console.log('DEBUG: Package found, performing upserts...')
                    // 2. Update tenant_features
                    const { error: featError } = await supabaseAdmin.from('tenant_features').upsert({
                        user_id: user.id,
                        has_properties: pkg.has_properties,
                        has_agenda: pkg.has_agenda,
                        has_materials: pkg.has_materials,
                        has_archive: pkg.has_archive,
                        has_leads: pkg.has_leads,
                        has_statistics: pkg.has_statistics,
                        has_reviews: pkg.has_reviews,
                        has_webshop: pkg.has_webshop,
                        has_billing: pkg.has_billing,
                        has_voice: pkg.has_voice,
                        property_limit: pkg.property_limit,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id' })

                    if (featError) {
                        console.error('DEBUG: Feature upsert error:', featError)
                        return { success: false, message: 'Fout bij bijwerken modules' }
                    }

                    // 3. Update subscription (Aggressive reset)
                    console.log('DEBUG: Resetting subscriptions for user', user.id)
                    await supabaseAdmin.from('subscriptions').delete().eq('user_id', user.id)

                    const { error: subError } = await supabaseAdmin.from('subscriptions').insert({
                        user_id: user.id,
                        plan: pkg.id,
                        status: 'active',
                        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    })

                    if (subError) {
                        console.error('DEBUG: Subscription insert error:', subError)
                        return { success: false, message: 'Fout bij bijwerken abonnement' }
                    }

                    console.log('DEBUG: Demo activation complete, revalidating...')
                    // 4. Force revalidation of all related paths
                    revalidatePath('/settings/billing')
                    revalidatePath('/settings/billing/packages')
                    revalidatePath('/')

                    return {
                        success: true,
                        url: `${origin}/settings/billing?success=demo_activated`,
                        message: 'Demo Modus: Pakket direct geactiveerd!'
                    }
                }
            }
        }

        return { success: false, message: 'Fout bij het aanmaken van checkout sessie. Controleer of Mollie is gekoppeld.' }
    } catch (error) {
        console.error('Failed to create checkout session:', error)
        return { success: false, message: 'Fout bij het aanmaken van checkout sessie' }
    }
}

