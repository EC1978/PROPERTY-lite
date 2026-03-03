'use server'

import { createAdminClient, createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Verify if the current user is a superadmin
 */
async function verifyAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    return userData?.role === 'superadmin'
}

export async function getAdminProducts() {
    if (!await verifyAdmin()) return { error: 'Geen toegang' }

    const supabaseAdmin = await createAdminClient()
    const { data, error } = await supabaseAdmin
        .from('shop_products')
        .select('*')
        .order('name')

    if (error) return { error: error.message }
    return { success: true, data }
}

export async function createProduct(formData: any) {
    if (!await verifyAdmin()) return { error: 'Geen toegang' }

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('shop_products')
        .insert({
            name: formData.name,
            slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
            description: formData.description,
            base_price: parseFloat(formData.base_price),
            category: formData.category,
            images: formData.images || [],
            options: formData.options || {},
            updated_at: new Date().toISOString()
        })

    if (error) return { error: error.message }

    revalidatePath('/admin/products')
    revalidatePath('/shop')
    return { success: true }
}

export async function updateProduct(id: string, formData: any) {
    if (!await verifyAdmin()) return { error: 'Geen toegang' }

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('shop_products')
        .update({
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            base_price: parseFloat(formData.base_price),
            category: formData.category,
            images: formData.images || [],
            options: formData.options || {},
            updated_at: new Date().toISOString()
        })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/products')
    revalidatePath('/shop')
    revalidatePath(`/shop/product/${formData.slug}`)
    return { success: true }
}

export async function deleteProduct(id: string) {
    if (!await verifyAdmin()) return { error: 'Geen toegang' }

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('shop_products')
        .delete()
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/products')
    revalidatePath('/shop')
    return { success: true }
}

export async function getAdminOrders() {
    if (!await verifyAdmin()) return { error: 'Geen toegang' }

    const supabaseAdmin = await createAdminClient()
    const { data, error } = await supabaseAdmin
        .from('shop_orders')
        .select(`
            *,
            users (email, full_name),
            shop_order_items (
                *,
                shop_products (name)
            )
        `)
        .order('created_at', { ascending: false })

    if (error) return { error: error.message }
    return { success: true, data }
}

export async function updateOrderStatus(id: string, status: string) {
    if (!await verifyAdmin()) return { error: 'Geen toegang' }

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('shop_orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/orders')
    return { success: true }
}
