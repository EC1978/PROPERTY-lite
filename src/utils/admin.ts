import { createClient } from './supabase/server'

/**
 * Checks if the current user is an admin based on the ADMIN_EMAILS environment variable.
 */
export async function isAdmin() {
    try {
        const supabase = await createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user || !user.email) {
            console.error('isAdmin check failed: No user or email found', error)
            return false
        }

        const adminEmailsConfig = process.env.ADMIN_EMAILS || ''
        // Remove quotes if present and split by comma
        const adminEmails = adminEmailsConfig
            .replace(/^["']|["']$/g, '')
            .split(',')
            .map(e => e.trim().toLowerCase())

        const isUserAdmin = adminEmails.includes(user.email.toLowerCase())

        if (!isUserAdmin) {
            console.warn(`Access denied for user ${user.email}. Admin list:`, adminEmails)
        }

        return isUserAdmin
    } catch (e) {
        console.error('Exception in isAdmin check:', e)
        return false
    }
}
