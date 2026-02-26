'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { logAdminAction } from '../audit/actions'

// Helper to get service role client that bypasses RLS
function getServiceRoleSupabase() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() {
                    return []
                },
                setAll() { }
            },
        }
    )
}

// Helper to check if current user is an admin based on ADMIN_EMAILS env variable
export async function isAdmin() {
    const cookieStore = await cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !user.email) return false

    const adminEmailsConfig = process.env.ADMIN_EMAILS || ''
    const adminEmails = adminEmailsConfig.split(',').map(e => e.trim().toLowerCase())

    return adminEmails.includes(user.email.toLowerCase())
}

export async function getSystemSettings() {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Returning default settings.')
        return { maintenance_mode: false, live_status_message: 'Service Role Key ontbreekt in .env.local' }
    }

    const supabase = getServiceRoleSupabase()

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

    const supabase = getServiceRoleSupabase()

    const { error } = await supabase
        .from('system_settings')
        .upsert({
            id: 1,
            maintenance_mode,
            live_status_message,
            updated_at: new Date().toISOString()
        })

    if (error) {
        console.error('Error updating system settings:', error)
        return { error: 'Failed to update system settings' }
    }

    // Revalidate paths that might depend on these settings
    revalidatePath('/', 'layout')

    // Get current user email for logging
    const adminEmailsConfig = process.env.ADMIN_EMAILS || ''
    const adminEmails = adminEmailsConfig.split(',').map(e => e.trim().toLowerCase())

    // We already know they are admin from the isAdmin() check above, let's just use a generic 'Admin' if we can't extract email here
    // But since server actions don't pass 'user' directly here without another fetch, let's fetch it again quickly
    const supabaseClient = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => [],
                setAll: () => { },
            }
        }
    )
    // Wait, isAdmin() might be better if it returned the email, but for now we can just log a system action or try to fetch user

    // The easiest way to get user email in an action is:
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: () => { },
            }
        }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()

    if (user && user.email) {
        await logAdminAction(
            user.email,
            'MAINTENANCE_TOGGLED',
            { maintenance_mode, live_status_message }
        );
    }

    return { success: true }
}
