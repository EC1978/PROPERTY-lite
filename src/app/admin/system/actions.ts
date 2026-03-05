'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'
import { logAdminAction } from '../audit/actions'
import { isAdmin } from '@/utils/admin'

export async function getSystemSettings() {
    noStore();
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Returning default settings.')
        return { maintenance_mode: false, live_status_message: 'Service Role Key ontbreekt in .env.local' }
    }

    const supabase = await createAdminClient()

    // We expect the singleton row with id = 1
    const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single()

    if (error) {
        console.error('Error fetching system settings:', error)
        return { maintenance_mode: false, live_status_message: 'Alle systemen operationeel' }
    }

    return data
}

export async function updateSystemSettings(formData: FormData) {
    noStore();
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { error: 'Configuratiefout: Voeg SUPABASE_SERVICE_ROLE_KEY toe aan je .env.local om instellingen te wijzigen.' }
    }

    // Only allow admins to update these settings
    const adminCheck = await isAdmin()
    if (!adminCheck) {
        return { error: 'Unauthorized: You do not have permission to perform this action.' }
    }

    const maintenance_mode = formData.get('maintenance_mode') === 'on'
    const live_status_message = formData.get('live_status_message') as string

    if (!live_status_message) {
        return { error: 'Status message is required' }
    }

    const supabase = await createAdminClient()

    const { data: updatedData, error } = await supabase
        .from('system_settings')
        .upsert({
            id: 1,
            maintenance_mode,
            live_status_message,
            updated_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) {
        console.error('Error updating system settings:', error)
        return { error: 'Failed to update system settings' }
    }

    // Revalidate paths that might depend on these settings
    revalidatePath('/', 'layout')

    // Get current user email for logging
    const supabaseAuth = await createClient()
    const { data: { user } } = await supabaseAuth.auth.getUser()

    if (user && user.email) {
        await logAdminAction(
            user.email,
            'MAINTENANCE_TOGGLED',
            { maintenance_mode, live_status_message }
        );
    }

    return { success: true, settings: updatedData }
}
