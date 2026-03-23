'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function toggleFavorite(productId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Niet ingelogd' }

    // Check if already favorite
    const { data: existing } = await supabase
        .from('shop_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single()

    if (existing) {
        // Remove from favorites
        const { error } = await supabase
            .from('shop_favorites')
            .delete()
            .eq('id', existing.id)

        if (error) return { success: false, error: error.message }
        revalidatePath('/shop')
        revalidatePath('/shop/account/favorites')
        return { success: true, action: 'removed' }
    } else {
        // Add to favorites
        const { error } = await supabase
            .from('shop_favorites')
            .insert({
                user_id: user.id,
                product_id: productId
            })

        if (error) return { success: false, error: error.message }
        revalidatePath('/shop')
        revalidatePath('/shop/account/favorites')
        return { success: true, action: 'added' }
    }
}

export async function getFavorites() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { success: false, error: 'Niet ingelogd' }

    const { data, error } = await supabase
        .from('shop_favorites')
        .select(`
            id,
            product_id,
            shop_products (*)
        `)
        .eq('user_id', user.id)

    if (error) return { success: false, error: error.message }
    return { success: true, favorites: data }
}

export async function isProductFavorite(productId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return false

    const { data } = await supabase
        .from('shop_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single()

    return !!data
}
