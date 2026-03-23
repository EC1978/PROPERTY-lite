'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getUserOrders() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Niet ingelogd' }

    const { data, error } = await supabase
        .from('shop_orders')
        .select(`
            id,
            order_number,
            status,
            created_at,
            total_amount,
            shop_order_items (
                id,
                shop_products (name)
            )
        `)
        .eq('user_id', user.id)
        .in('status', ['paid', 'processing', 'production', 'awaiting_payment']) // Alleen actieve orders om aan te koppelen
        .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }
    return { success: true, orders: data }
}

export async function linkFileToOrder(orderId: string, fileName: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Niet ingelogd' }

    try {
        // 1. Download file from user's private design_uploads
        const { data: fileData, error: downloadError } = await supabase.storage
            .from('design_uploads')
            .download(`${user.id}/${fileName}`)

        if (downloadError || !fileData) {
            return { success: false, error: 'Fout bij ophalen van uw bestand' }
        }

        // 2. Upload file to shop-designs as a public url
        const fileExt = fileName.split('.').pop()
        const newFileName = `order-${orderId}-${Math.random().toString(36).substring(7)}.${fileExt}`
        const filePath = `design-uploads/${newFileName}`

        const { error: uploadError } = await supabase.storage
            .from('shop-designs')
            .upload(filePath, fileData)

        if (uploadError) {
            return { success: false, error: 'Fout bij kopiëren van bestand naar order' }
        }

        const { data: { publicUrl } } = supabase.storage
            .from('shop-designs')
            .getPublicUrl(filePath)

        // 3. Link it to the order via admin client to bypass RLS issues on order updates
        const adminClient = await createAdminClient()
        const { error: updateError } = await adminClient
            .from('shop_orders')
            .update({
                design_url: publicUrl,
                design_status: 'pending',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)
            .eq('user_id', user.id) // Ensure security

        if (updateError) {
            return { success: false, error: 'Fout bij koppelen van bestand aan order' }
        }

        revalidatePath('/shop/account/files')
        revalidatePath(`/shop/account/orders/${orderId}`)
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || 'Onbekende fout' }
    }
}
