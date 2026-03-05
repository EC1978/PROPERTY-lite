import { createClient } from './supabase/server'

/**
 * Checks if the current user is an admin based on the ADMIN_EMAILS environment variable.
 */
export async function isAdmin() {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user || !user.email) {
            console.error('[ADMIN_CHECK] No authenticated user or email found.', error)
            return false
        }

        const userEmail = user.email.toLowerCase()

        // 1. Check environment variable first
        const rawAdminEmails = process.env.ADMIN_EMAILS
        if (rawAdminEmails) {
            const adminEmails = rawAdminEmails
                .replace(/^["']|["']$/g, '') // Remove start/end quotes
                .split(',')
                .map(email => email.trim().toLowerCase())
                .filter(email => email.length > 0)

            if (adminEmails.includes(userEmail)) {
                console.log(`[ADMIN_CHECK] Authorized via ENV: ${userEmail}`)
                return true
            }
        }

        // 2. Check database role as fallback
        const { data: userData, error: roleError } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (roleError) {
            console.warn(`[ADMIN_CHECK] Role check failed for ${userEmail}:`, roleError)
            return false
        }

        const isSuperadmin = userData?.role === 'superadmin'

        if (isSuperadmin) {
            console.log(`[ADMIN_CHECK] Authorized via DB Role: ${userEmail}`)
        } else {
            console.warn(`[ADMIN_CHECK] Denied: ${userEmail} is not an admin via ENV or DB.`)
        }

        return isSuperadmin
    } catch (e) {
        console.error('[ADMIN_CHECK] Fatal exception:', e)
        return false
    }
}
