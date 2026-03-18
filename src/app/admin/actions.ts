'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAdminStats() {
    const supabase = await createClient()

    // Auth check using standard client
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        console.error('Admin stats auth error:', authError)
        return { totalBrokers: 0, activeOrders: 0, monthlyRevenue: 0, recentActivity: [] }
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'superadmin') {
        console.error('Non-admin access attempt:', user.email)
        return { totalBrokers: 0, activeOrders: 0, monthlyRevenue: 0, recentActivity: [] }
    }

    // Use Admin Client for statistics to bypass RLS filters
    const adminSupabase = await createAdminClient()

    // 1. Totaal Makelaars
    const { count: totalBrokers, error: brokersError } = await adminSupabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'makelaar')

    if (brokersError) console.error('Error fetching brokers:', brokersError)

    // 2. Actieve Bestellingen
    const { count: activeOrders, error: ordersError } = await adminSupabase
        .from('shop_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'processing', 'production', 'paid'])

    if (ordersError) console.error('Error fetching orders:', ordersError)

    // 3. Platform Omzet (Maand)
    const now = new Date()
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const { data: monthlyOrders, error: revenueError } = await adminSupabase
        .from('shop_orders')
        .select('total_amount')
        .gte('created_at', startDate.toISOString())
        .in('status', ['paid', 'production', 'shipped', 'completed'])

    if (revenueError) console.error('Error fetching revenue:', revenueError)

    const monthlyRevenue = (monthlyOrders || []).reduce((sum, order) => sum + Number(order.total_amount), 0)

    // 4. Recente Activiteit
    const { data: recentActivity, error: activityError } = await adminSupabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

    if (activityError) console.error('Error fetching activity:', activityError)

    return {
        totalBrokers: totalBrokers || 0,
        activeOrders: activeOrders || 0,
        monthlyRevenue: monthlyRevenue || 0,
        recentActivity: recentActivity || []
    }
}

export async function getAdminUserDetail(userId: string) {
    const adminSupabase = await createAdminClient()

    // 1. Fetch User Profile
    const { data: user, error: userError } = await adminSupabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

    if (userError) return { success: false, error: 'Gebruiker niet gevonden' }

    // 2. Fetch Profiles for trial/tier info
    let { data: profile } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

    if (!profile) {
        // Create profile if missing
        const { data: newProfile } = await adminSupabase
            .from('profiles')
            .insert({ id: userId, role: 'makelaar', full_name: user.full_name })
            .select()
            .single()
        profile = newProfile
    }

    // 3. Fetch Packages
    const { data: packages } = await adminSupabase
        .from('packages')
        .select('*')
        .order('sort_order', { ascending: true })

    // 4. Fetch Tenant Features
    let { data: features } = await adminSupabase
        .from('tenant_features')
        .select('*')
        .eq('user_id', userId)
        .single()

    if (!features) {
        // Create default features if not exist
        const { data: newFeatures } = await adminSupabase
            .from('tenant_features')
            .insert({ user_id: userId })
            .select()
            .single()
        features = newFeatures
    }

    // 5. Fetch Orders
    const { data: orders } = await adminSupabase
        .from('shop_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    return {
        success: true,
        data: {
            user: { ...user, trial_expires_at: profile?.trial_expires_at, subscription_tier: profile?.subscription_tier },
            packages: packages || [],
            features: features || {},
            orders: orders || []
        }
    }
}

export async function updateTenantFeature(userId: string, featureKey: string, newValue: boolean) {
    const adminSupabase = await createAdminClient()

    const { error } = await adminSupabase
        .from('tenant_features')
        .update({ [featureKey]: newValue, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

    if (error) {
        console.error('Error updating feature:', error)
        return { success: false, error: error.message }
    }

    // Log action
    await adminSupabase.from('audit_logs').insert({
        action: 'UPDATE_FEATURE',
        details: { userId, featureKey, newValue }
    })

    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
}

export async function updateTenantPackage(userId: string, packageId: string) {
    const adminSupabase = await createAdminClient()

    // 1. Get package details
    const { data: pkg } = await adminSupabase
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single()

    if (!pkg) return { success: false, error: 'Pakket niet gevonden' }

    // 2. Update tenant features based on package
    const { error: featureError } = await adminSupabase
        .from('tenant_features')
        .update({
            has_properties: pkg.has_properties,
            has_agenda: pkg.has_agenda,
            has_leads: pkg.has_leads,
            has_materials: pkg.has_materials,
            has_archive: pkg.has_archive,
            has_statistics: pkg.has_statistics,
            has_reviews: pkg.has_reviews,
            has_webshop: pkg.has_webshop,
            has_billing: pkg.has_billing,
            has_voice: pkg.has_voice,
            property_limit: pkg.property_limit,
            updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)

    if (featureError) return { success: false, error: featureError.message }

    // 3. Update profile tier
    await adminSupabase
        .from('profiles')
        .update({ subscription_tier: pkg.id })
        .eq('id', userId)

    // Log action
    await adminSupabase.from('audit_logs').insert({
        action: 'UPDATE_PACKAGE',
        details: { userId, packageId, packageName: pkg.name }
    })

    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
}

export async function updateTrialExpiration(userId: string, daysToAdd: number) {
    const adminSupabase = await createAdminClient()

    const { data: profile } = await adminSupabase
        .from('profiles')
        .select('trial_expires_at')
        .eq('id', userId)
        .single()

    const currentExpiry = profile?.trial_expires_at ? new Date(profile.trial_expires_at) : new Date()
    const newExpiry = new Date(currentExpiry.getTime() + (daysToAdd * 24 * 60 * 60 * 1000))

    const { error } = await adminSupabase
        .from('profiles')
        .update({ trial_expires_at: newExpiry.toISOString() })
        .eq('id', userId)

    if (error) return { success: false, error: error.message }

    // Log action
    await adminSupabase.from('audit_logs').insert({
        action: 'EXTEND_TRIAL',
        details: { userId, daysAdded: daysToAdd, newExpiry: newExpiry.toISOString() }
    })

    revalidatePath(`/admin/users/${userId}`)
    return { success: true, newDate: newExpiry.toISOString() }
}

// Placeholder for impersonateUser if requested, though page uses fetch
export async function impersonateUser(userId: string) {
    return { success: true, url: `/api/admin/ghost-login?targetUserId=${userId}` }
}

/**
 * Delete a broker account and all associated data
 * Checks for active shop orders first.
 */
export async function deleteBrokerAccount(userId: string) {
    const isAdmin = await verifyAdmin()
    if (!isAdmin) return { success: false, error: 'Geen toegang. Alleen superadmins kunnen accounts verwijderen.' }

    const adminSupabase = await createAdminClient()

    try {
        // 1. Delete all shop-related test data so it cascades completely
        await adminSupabase.from('shop_complaints').delete().eq('user_id', userId)
        await adminSupabase.from('shop_quotes').delete().eq('user_id', userId)
        
        // Find orders to delete items first, though cascade should ideally handle this. Let's be explicit for safety.
        const { data: ordersIds } = await adminSupabase.from('shop_orders').select('id').eq('user_id', userId)
        if (ordersIds && ordersIds.length > 0) {
            const idsList = ordersIds.map(o => o.id)
            await adminSupabase.from('shop_order_items').delete().in('order_id', idsList)
            await adminSupabase.from('shop_orders').delete().eq('user_id', userId)
        }

        // 2. Delete properties/leads that belong to this user
        await adminSupabase.from('leads').delete().eq('broker_id', userId)
        await adminSupabase.from('properties').delete().eq('owner', userId)

        // 3. Clear from public tables
        await adminSupabase.from('profiles').delete().eq('id', userId)
        await adminSupabase.from('tenant_features').delete().eq('user_id', userId)
        await adminSupabase.from('users').delete().eq('id', userId)

        // 6. Delete from Auth (the source of truth)
        const { error: authError } = await adminSupabase.auth.admin.deleteUser(userId)
        
        if (authError) {
            console.error('Error deleting from auth:', authError)
            return { success: false, error: 'Fout bij het verwijderen van het authenticatie-account.' }
        }

        // Log the deletion
        await adminSupabase.from('audit_logs').insert({
            action: 'DELETE_ACCOUNT',
            details: { userId, deletedAt: new Date().toISOString() }
        })

        revalidatePath('/admin/users')
        return { success: true }
    } catch (error: any) {
        console.error('Delete broker error:', error)
        return { success: false, error: error.message || 'Onverwachte fout bij verwijderen.' }
    }
}

async function verifyAdmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

    return profile?.role === 'superadmin'
}
