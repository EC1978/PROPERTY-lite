'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { isAdmin } from '@/utils/admin'

// Removed redundant isAdmin and getServiceRoleSupabase

export async function logAdminAction(admin_email: string, action: string, details: Record<string, any> = {}) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Audit log will not be saved.');
        return { error: 'Service role key missing' };
    }

    try {
        const supabase = await createAdminClient();

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
        const supabase = await createAdminClient();

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
