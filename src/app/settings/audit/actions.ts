'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { isAdmin } from '@/utils/admin'
import { unstable_noStore as noStore } from 'next/cache'

export async function logAdminAction(admin_email: string, action: string, details: Record<string, any> = {}) {
    noStore();
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
    noStore();
    try {
        const supabaseAuth = await createClient()
        const { data: { user } } = await supabaseAuth.auth.getUser()
        const userEmail = user?.email || 'geen_email_gevonden'

        const adminCheck = await isAdmin();

        if (!adminCheck) {
            const adminEmails = process.env.ADMIN_EMAILS || 'NIET_GECONFIGUREERD_IN_PROC_ENV'
            const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
            const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL

            return {
                error: `Unauthorized (Systeem ziet jou als: ${userEmail}. Toegestane admins in config: ${adminEmails}. Debug: URL=${hasUrl}, ServiceKey=${hasServiceKey})`,
                logs: []
            };
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing. Returning empty logs.');
            return { error: 'Service role key missing', logs: [] };
        }

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
