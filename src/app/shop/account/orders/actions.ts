'use server'

import { createAdminClient } from '@/utils/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateOrderStatus(orderId: string, status: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('shop_orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single()

    if (error) {
        console.error('Error updating order status:', error)
        throw new Error(error.message)
    }

    revalidatePath('/shop/account/orders')
    revalidatePath(`/shop/account/orders/${orderId}`)

    return { success: true, data }
}
