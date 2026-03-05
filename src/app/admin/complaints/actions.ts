'use server'

import { createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/utils/admin'

export async function getAdminComplaints() {
    if (!await isAdmin()) return { error: 'Geen toegang' }

    const supabaseAdmin = await createAdminClient()

    // 1. Haal alle klachten op met de bijbehorende order datum en tracking info
    const { data: complaints, error: complaintsError } = await supabaseAdmin
        .from('shop_complaints')
        .select(`
            *,
            shop_orders (*)
        `)
        .order('created_at', { ascending: false })

    if (complaintsError) {
        console.error('Error fetching admin complaints:', complaintsError)
        return { error: complaintsError.message }
    }

    if (!complaints) return { success: true, data: [] }

    // 2. Haal alle gebruikers op om de makelaar naam/email handmatig te joinen
    const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name, role')

    if (usersError) {
        console.error('Error fetching users for complaints:', usersError)
    }

    // 3. Handmatig joinen
    const joinedData = complaints.map(complaint => ({
        ...complaint,
        users: users?.find(u => u.id === complaint.user_id) || { email: 'Onbekend', full_name: 'Verwijderde Gebruiker', role: 'unknown' }
    }))

    return { success: true, data: joinedData }
}

export async function updateComplaint(id: string, status: string, adminResponse: string | null) {
    if (!await isAdmin()) return { error: 'Geen toegang' }

    const supabaseAdmin = await createAdminClient()

    // Update the complaint
    const { data: updatedComplaint, error } = await supabaseAdmin
        .from('shop_complaints')
        .update({
            status,
            admin_response: adminResponse
        })
        .eq('id', id)
        .select('order_id')
        .single()

    if (error) {
        console.error('Error updating complaint:', error)
        return { error: error.message }
    }

    // Revalidate relevant paths so the UI updates
    revalidatePath('/admin/complaints')
    revalidatePath('/admin/orders')
    revalidatePath('/shop/account/claims')

    // If we have an order_id, revalidate the specific order pages too
    if (updatedComplaint?.order_id) {
        revalidatePath(`/shop/account/orders/${updatedComplaint.order_id}`)
    }

    return { success: true }
}
