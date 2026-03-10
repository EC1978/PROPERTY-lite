'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getPaymentSettings() {
    const supabase = await createAdminClient()

    const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .eq('id', 1)
        .single()

    if (error) {
        console.error('Error fetching payment settings:', error)
        return null
    }

    return data
}

export async function updatePaymentSettings(formData: {
    mollie_test_api_key?: string
    mollie_live_api_key?: string
    mollie_is_test_mode?: boolean
}) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('platform_settings')
        .update({
            ...formData,
            updated_at: new Date().toISOString()
        })
        .eq('id', 1)

    if (error) {
        console.error('Error updating payment settings:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/admin/payments')
    return { success: true }
}
