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
        .eq('is_archived', false)
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
            shipping_cost: parseFloat(formData.shipping_cost) || 0,
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
            shipping_cost: parseFloat(formData.shipping_cost) || 0,
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
        .update({ is_archived: true })
        .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/products')
    revalidatePath('/shop')
    return { success: true }
}

export async function getAdminOrders() {
    if (!await verifyAdmin()) return { error: 'Geen toegang' }

    const supabaseAdmin = await createAdminClient()

    // Fetch orders first without the failing join
    const { data: orders, error: ordersError } = await supabaseAdmin
        .from('shop_orders')
        .select(`
            *,
            shop_order_items (
                *,
                shop_products (name, images)
            ),
            shop_complaints (*)
        `)
        .order('created_at', { ascending: false })

    if (ordersError) return { error: ordersError.message }
    if (!orders) return { success: true, data: [] }

    // Fetch all users to map them manually
    const { data: users, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, email, full_name')

    if (usersError) {
        console.error('Error fetching users for orders:', usersError)
    }

    // Join manually
    const joinedData = orders.map(order => ({
        ...order,
        users: users?.find(u => u.id === order.user_id) || { email: 'Onbekend', full_name: 'Verwijderde Gebruiker' }
    }))

    return { success: true, data: joinedData }
}

export async function updateOrderTracking(orderId: string, trackingNumber: string) {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) throw new Error('Unauthorized')

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('shop_orders')
        .update({ tracking_number: trackingNumber })
        .eq('id', orderId)

    if (error) throw error
    revalidatePath('/admin/orders')
    return { success: true }
}

export async function updateOrderDesignStatus(orderId: string, status: string, remarks?: string) {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) throw new Error('Unauthorized')

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('shop_orders')
        .update({
            design_status: status,
            design_remarks: remarks || null
        })
        .eq('id', orderId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/orders')
    return { success: true }
}

export async function updateOrderDesignUrl(orderId: string, url: string | null) {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) return { success: false, error: 'Unauthorized' }

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('shop_orders')
        .update({ design_url: url })
        .eq('id', orderId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/orders')
    return { success: true }
}

export async function updateOrderDeliveryDate(orderId: string, date: string) {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) return { success: false, error: 'Unauthorized' }

    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('shop_orders')
        .update({ delivery_date: date })
        .eq('id', orderId)

    if (error) return { success: false, error: error.message }
    revalidatePath('/admin/orders')
    return { success: true }
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

export async function updateOrderDesign(orderId: string, url: string) {
    // This action can be called by brokers to update their own design
    // We use admin client to bypass potential RLS issues with specific columns
    const supabaseAdmin = await createAdminClient()
    const { error } = await supabaseAdmin
        .from('shop_orders')
        .update({
            design_url: url,
            design_status: 'pending',
            updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

    if (error) return { success: false, error: error.message }
    revalidatePath(`/shop/account/orders/${orderId}`)
    revalidatePath('/admin/orders')
    return { success: true }
}
