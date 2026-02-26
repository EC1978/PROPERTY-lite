'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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
                        // ignore
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

// Helper to get service role client
function getServiceRoleSupabase() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() { return [] },
                setAll() { }
            },
        }
    )
}

export async function logAdminAction(admin_email: string, action: string, details: Record<string, any> = {}) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Audit log will not be saved.');
        return { error: 'Service role key missing' };
    }

    try {
        const supabase = getServiceRoleSupabase();

        const { error } = await supabase
            .from('audit_logs')
            .insert({
                admin_email,
                action,
                details
            });

        if (error) {
            console.error('Failed to insert audit log:', error);
            return { error: 'Failed to save audit log' };
        }

        return { success: true };
    } catch (e) {
        console.error('Exception in logAdminAction:', e);
        return { error: 'Exception occurred' };
    }
}

export async function getAuditLogs() {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
        return { error: 'Unauthorized', logs: [] };
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Returning empty logs.');
        return { error: 'Service role key missing', logs: [] };
    }

    try {
        const supabase = getServiceRoleSupabase();

        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching audit logs:', error);
            return { error: 'Tabel audit_logs niet gevonden in database. Voer de migratie uit (011_audit_logs.sql).', logs: [] };
        }

        return { logs: data || [] };
    } catch (e) {
        console.error('Exception in getAuditLogs:', e);
        return { error: 'Exception occurred', logs: [] };
    }
}
