'use server'

import { createAdminClient, createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/utils/admin'

export async function getUsersForOrder() {
    if (!await isAdmin()) return { error: 'Geen toegang' }

    const supabaseAdmin = await createAdminClient()
    const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('id, full_name, email, role')
        .order('full_name')

    if (error) {
        console.error('Error fetching users:', error)
        return { error: 'Kan gebruikers niet ophalen' }
    }

    return { success: true, data: users || [] }
}

export async function createManualOrder(orderData: any) {
    if (!await isAdmin()) return { error: 'Geen toegang' }

    if (!orderData.userId || !orderData.items || orderData.items.length === 0) {
        console.error('Manual order data missing:', { userId: !!orderData.userId, itemsCount: orderData.items?.length })
        return { error: 'Ontbrekende order gegevens' }
    }

    const supabaseAdmin = await createAdminClient()
    const orderNumber = `ORD-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(100 + Math.random() * 900)}`

    console.log('Creating manual order:', { orderNumber, userId: orderData.userId, itemCount: orderData.items.length })

    // 1. Calculate total amount
    const subtotal = orderData.items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const isGuarantee = orderData.paymentMode === 'guarantee'

    const shipping = orderData.shippingCost || 0
    const totalAmount = isGuarantee ? 0 : subtotal + shipping
    const taxAmount = isGuarantee ? 0 : (totalAmount * 0.21)
    const finalTotal = totalAmount + taxAmount

    console.log('Order totals calculated:', { subtotal, totalAmount, taxAmount, finalTotal, isGuarantee })

    // For Warranty / Replacement (Geen betaling nodig)
    const paymentStatus = isGuarantee ? 'paid' : 'awaiting_payment'

    // 2. Insert Order
    console.log('Inserting into shop_orders...')
    const { data: order, error: orderError } = await supabaseAdmin
        .from('shop_orders')
        .insert({
            user_id: orderData.userId,
            order_number: orderNumber,
            total_amount: finalTotal,
            tax_amount: taxAmount,
            shipping_cost: isGuarantee ? 0 : shipping,
            payment_method: isGuarantee ? 'guarantee' : 'ideal',
            billing_address: { name: 'Superadmin Manual Order', city: 'System' },
            shipping_address: { name: 'Superadmin Manual Order', city: 'System' },
            status: 'pending',
            payment_status: paymentStatus,
            design_status: orderData.designStatus || 'waiting',
            design_url: orderData.designUrl || null
        })
        .select()
        .single()

    if (orderError) {
        console.error('Detailed Order Insert Error:', orderError)
        return { error: `fout_order_insert: ${orderError.message}` }
    }

    console.log('Order created successfully:', order.id)

    // 3. Insert Order Items
    console.log('Inserting order items...', orderData.items.length)
    const orderItems = orderData.items.map((item: any) => ({
        order_id: order.id,
        product_id: item.productId,
        quantity: item.quantity,
        price_at_purchase: item.price,
        selected_options: item.options || []
    }))

    const { error: itemsError } = await supabaseAdmin
        .from('shop_order_items')
        .insert(orderItems)

    if (itemsError) {
        console.error('Detailed Items Insert Error:', itemsError)
        // Rollback
        await supabaseAdmin.from('shop_orders').delete().eq('id', order.id)
        return { error: `fout_items_insert: ${itemsError.message}` }
    }

    console.log('All steps completed. Revalidating path...')
    try {
        revalidatePath('/admin/orders')
    } catch (e) {
        console.error('RevalidatePath failed (non-fatal):', e)
    }

    return { success: true, data: order }
}
