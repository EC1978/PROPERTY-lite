'use server'

import { createClient } from '@/utils/supabase/server'
import { createMolliePayment } from '@/utils/mollie'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

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

        const payment = await createMolliePayment({
            plan: planId,
            userId: user.id,
            origin: origin
        })

        const checkoutUrl = payment.getCheckoutUrl()
        if (checkoutUrl) {
            return { success: true, url: checkoutUrl }
        }
        return { success: false, message: 'Geen checkout URL ontvangen van Mollie' }
    } catch (error) {
        console.error('Failed to create checkout session:', error)
        return { success: false, message: 'Fout bij het aanmaken van checkout sessie' }
    }
}

