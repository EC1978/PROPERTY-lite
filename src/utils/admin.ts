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

        const rawAdminEmails = process.env.ADMIN_EMAILS

        if (!rawAdminEmails) {
            console.error('[ADMIN_CHECK] CRITICAL: process.env.ADMIN_EMAILS is undefined or empty in this environment.')
            return false
        }

        // Robust parsing: remove outer quotes, trim, split by comma, and lowercase everything
        const adminEmails = rawAdminEmails
            .replace(/^["']|["']$/g, '') // Remove start/end quotes
            .split(',')
            .map(email => email.trim().toLowerCase())
            .filter(email => email.length > 0)

        const userEmail = user.email.toLowerCase()
        const isUserAdmin = adminEmails.includes(userEmail)

        if (!isUserAdmin) {
            console.warn(`[ADMIN_CHECK] Denied: ${userEmail} is not in:`, adminEmails)
        } else {
            console.log(`[ADMIN_CHECK] Authorized: ${userEmail}`)
        }

        return isUserAdmin
    } catch (e) {
        console.error('[ADMIN_CHECK] Fatal exception:', e)
        return false
    }
}
