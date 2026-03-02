'use server'

import { createServerClient } from '@supabase/ssr'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

function getAdminClient() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    )
}

async function assertSuperadmin() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Niet ingelogd')
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
    if (data?.role !== 'superadmin') throw new Error('Geen toegang')
}

export async function updatePackage(packageId: string, updates: {
    name?: string
    description?: string
    monthly_price?: number
    annual_price?: number
    property_limit?: number
    is_popular?: boolean
    is_active?: boolean
    sort_order?: number
    has_properties?: boolean
    has_agenda?: boolean
    has_leads?: boolean
    has_materials?: boolean
    has_archive?: boolean
    has_statistics?: boolean
    has_reviews?: boolean
    has_webshop?: boolean
    has_billing?: boolean
    has_voice?: boolean
    show_on_landing?: boolean
}) {
    await assertSuperadmin()
    const admin = getAdminClient()
    const { error } = await admin.from('packages').update({
        ...updates,
        updated_at: new Date().toISOString(),
    }).eq('id', packageId)

    if (error) {
        console.error('Package update error:', error)
        return { error: 'Fout bij opslaan van pakket' }
    }

    revalidatePath('/admin/packages')
    revalidatePath('/pricing')
    revalidatePath('/settings/billing/packages')
    return { success: true }
}

export async function createPackage(label: string) {
    await assertSuperadmin()
    const admin = getAdminClient()

    // Get current max sort_order
    const { data: existing } = await admin.from('packages').select('sort_order').order('sort_order', { ascending: false }).limit(1)
    const nextOrder = (existing?.[0]?.sort_order ?? 0) + 1

    const newId = `Custom_${Date.now()}`

    const { data, error } = await admin.from('packages').insert({
        id: newId,
        name: label,
        description: 'Nieuw pakket — bewerk de omschrijving.',
        monthly_price: 0,
        annual_price: 0,
        property_limit: 10,
        is_popular: false,
        is_active: true,
        sort_order: nextOrder,
        has_properties: true,
        has_agenda: false,
        has_leads: false,
        has_materials: false,
        has_archive: false,
        has_statistics: false,
        has_reviews: false,
        has_webshop: false,
        has_billing: false,
        has_voice: false,
        show_on_landing: false,
        updated_at: new Date().toISOString(),
    }).select().single()

    if (error) {
        console.error('Package create error:', error)
        return { error: 'Fout bij aanmaken van pakket' }
    }

    revalidatePath('/admin/packages')
    revalidatePath('/pricing')
    revalidatePath('/settings/billing/packages')
    return { success: true, package: data }
}

export async function reorderPackages(orders: { id: string, sort_order: number }[]) {
    await assertSuperadmin()
    const admin = getAdminClient()

    try {
        const updates = orders.map(async ({ id, sort_order }) => {
            return admin.from('packages').update({ sort_order }).eq('id', id)
        })

        const results = await Promise.all(updates)
        const firstError = results.find(r => r.error)
        if (firstError) throw firstError.error

        revalidatePath('/admin/packages')
        revalidatePath('/pricing')
        revalidatePath('/settings/billing/packages')
        return { success: true }
    } catch (err) {
        console.error('Reorder error:', err)
        return { error: 'Fout bij het herschikken van pakketten' }
    }
}

export async function deletePackage(packageId: string) {
    await assertSuperadmin()
    const admin = getAdminClient()
    const { error } = await admin.from('packages').delete().eq('id', packageId)
    if (error) return { error: 'Fout bij verwijderen van pakket' }
    revalidatePath('/admin/packages')
    revalidatePath('/pricing')
    revalidatePath('/settings/billing/packages')
    return { success: true }
}

export async function applyPackageToTenant(userId: string, packageId: string) {
    await assertSuperadmin()
    const admin = getAdminClient()

    const { data: pkg, error: pkgErr } = await admin
        .from('packages')
        .select('*')
        .eq('id', packageId)
        .single()

    if (pkgErr || !pkg) return { error: 'Pakket niet gevonden' }

    const { error } = await admin.from('tenant_features').upsert({
        user_id: userId,
        property_limit: pkg.property_limit,
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
        show_on_landing: pkg.show_on_landing,
        updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })

    if (error) return { error: 'Fout bij toepassen van pakket' }
    return { success: true }
}
