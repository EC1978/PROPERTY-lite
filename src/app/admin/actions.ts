'use server'

import { createClient, createAdminClient } from '@/utils/supabase/server'
import { cookies, headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { isAdmin } from '@/utils/admin'

// This uses the service role to generate a session for another user
export async function impersonateUser(targetUserId: string) {
    const supabase = await createClient()

    // 1. Verify caller is superadmin
    if (!(await isAdmin())) {
        return { error: 'Geen toegang' }
    }

    // 2. We need the current admin's session to be saved so they can return
    const cookieStore = await cookies()
    // Find the sb-xxx-auth-token
    const allCookies = cookieStore.getAll()
    const authCookies = allCookies.filter(c => c.name.includes('-auth-token'))

    if (authCookies.length > 0) {
        // Save it in a return cookie
        cookieStore.set('admin_return_token', JSON.stringify(authCookies), { path: '/', maxAge: 60 * 60 * 24 })
        
        // Clear existing auth cookies to ensure magiclink takes over cleanly
        authCookies.forEach(c => cookieStore.delete(c.name))
    }

    // 3. Generate Link / impersonate via Admin API
    // The easiest way is to use the Supabase Admin API to generate a password reset link 
    // or just generate an access/refresh token pair. But we can't easily generate a token 
    // directly without a custom edge function or password. 
    // Actually, `supabaseAdmin.auth.admin.generateLink()` can generate a magiclink.

    // An alternative is using Service Role to just fetch the user's data, BUT that doesn't 
    // log them in on the client. To truly log them in on the client, we can use the 
    // supabase service_role client to create a custom session? No, Supabase doesn't support 
    // "sign in as" directly in the JS client without custom claims and careful RLS. 

    // Instead of full auth impersonation, a common pattern for Next.js is setting an 
    // `impersonated_user_id` cookie, and updating the local supabase client to pass it 
    // as a custom header, which is then picked up by RLS... but that's complex.

    const supabaseAdmin = await createAdminClient()

    const { getURL } = await import('@/app/auth/actions')
    const appUrl = await getURL()

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: (await supabaseAdmin.auth.admin.getUserById(targetUserId)).data.user?.email || '',
        options: {
            // Must go through /auth/callback so the code can be exchanged for a session
            // We add impersonate=true to distinguish this from a real password recovery
            redirectTo: `${appUrl}/auth/callback?next=/dashboard&impersonate=true`
        }
    })

    if (linkError || !linkData.properties?.action_link) {
        return { error: 'Kon geen impersonation link maken' }
    }

    // Return the action link so the client can redirect to it to complete the login
    return { success: true, url: linkData.properties.action_link }
}

export async function stopImpersonation() {
    const cookieStore = await cookies()
    const storedTokensStr = cookieStore.get('admin_return_token')?.value

    if (!storedTokensStr) return { redirect: '/login' }

    try {
        const storedTokens = JSON.stringify(storedTokensStr)
        // Note: A real implementation would restore the specific cookies here by parsing the JSON
        // For simplicity now, we just redirect to /login and clear the return token
        cookieStore.delete('admin_return_token')

        // Let the user re-login to ensure safety, or we could manually set the cookies
    } catch (e) {
        console.error(e)
    }

    return { redirect: '/login' }
}

export async function updateTenantFeature(userId: string, featureKey: string, newValue: boolean) {
    const supabase = await createClient()

    // 1. Verify caller is superadmin
    if (!(await isAdmin())) {
        return { error: 'Geen toegang' }
    }

    // 2. We use the service role client to bypass any potential RLS restrictions 
    // for updating another user's features, making it robust.
    const supabaseAdmin = await createAdminClient()

    // 3. Upsert the feature
    const { error } = await supabaseAdmin
        .from('tenant_features')
        .upsert({
            user_id: userId,
            [featureKey]: newValue,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

    if (error) {
        console.error('Feature update error:', error)
        return { error: 'Fout bij opslaan van module' }
    }

    console.log('SERVER [updateTenantFeature]: Success for user', userId, 'feature', featureKey)
    revalidatePath(`/admin/users/${userId}`)
    return { success: true }
}

export async function updateTenantPackage(userId: string, pkgId: string) {
    const supabase = await createClient()

    // 1. Verify caller is superadmin
    if (!(await isAdmin())) {
        return { error: 'Geen toegang' }
    }

    const supabaseAdmin = await createAdminClient()

    // 2. Fetch package details
    const { data: pkg, error: pkgError } = await supabaseAdmin
        .from('packages')
        .select('*')
        .eq('id', pkgId)
        .single()

    if (pkgError || !pkg) return { error: 'Pakket niet gevonden' }

    // 3. Update features
    const { error: featError } = await supabaseAdmin
        .from('tenant_features')
        .upsert({
            user_id: userId,
            has_properties: pkg.has_properties,
            has_agenda: pkg.has_agenda,
            has_materials: pkg.has_materials,
            has_archive: pkg.has_archive,
            has_leads: pkg.has_leads,
            has_statistics: pkg.has_statistics,
            has_reviews: pkg.has_reviews,
            has_webshop: pkg.has_webshop,
            has_billing: pkg.has_billing,
            has_voice: pkg.has_voice,
            property_limit: pkg.property_limit,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

    if (featError) return { error: 'Fout bij bijwerken modules' }

    // 4. Aggressive subscription reset
    await supabaseAdmin.from('subscriptions').delete().eq('user_id', userId)

    const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
            user_id: userId,
            plan: pkg.id,
            status: 'active',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })

    if (subError) {
        console.error('Subscription update error:', subError)
        return { error: 'Fout bij bijwerken abonnement' }
    }

    console.log('SERVER [updateTenantPackage]: Success for user', userId)
    revalidatePath(`/admin/users/${userId}`)
    revalidatePath('/')

    return { success: true }
}

export async function getAdminUserDetail(userId: string) {
    const supabase = await createClient()

    // 1. Verify caller is superadmin
    if (!(await isAdmin())) {
        return { error: 'Geen toegang' }
    }

    const supabaseAdmin = await createAdminClient()

    // 2. Fetch all data in parallel
    const [
        { data: targetUser, error: uErr },
        { data: packages, error: pErr },
        { data: featureData, error: fErr },
        { data: subData, error: sErr },
        { data: orders, error: oErr }
    ] = await Promise.all([
        supabaseAdmin.from('users').select('*').eq('id', userId).single(),
        supabaseAdmin.from('packages').select('*').order('sort_order'),
        supabaseAdmin.from('tenant_features').select('*').eq('user_id', userId).maybeSingle(),
        supabaseAdmin.from('subscriptions').select('plan').eq('user_id', userId).maybeSingle(),
        supabaseAdmin.from('shop_orders').select(`*, shop_order_items (*, shop_products (*))`).eq('user_id', userId).order('created_at', { ascending: false })
    ])

    if (uErr || pErr || fErr || sErr || oErr) {
        console.error('SERVER [getAdminUserDetail]: One or more fetch errors occurred', { uErr, pErr, fErr, sErr, oErr })
        return { error: `Fetch error: uErr=${uErr?.message}, fErr=${fErr?.message}, oErr=${oErr?.message}` }
    }

    // 3. Match package
    const planValue = subData?.plan
    console.log('SERVER [getAdminUserDetail]: Subscribed Plan Value:', planValue)
    const matchedPkg = packages?.find(p => p.id === planValue || p.name === planValue)
    let activePlanId = matchedPkg?.id || null

    // Fallback feature matching
    if (!activePlanId && featureData) {
        const fmPkg = packages?.find(p =>
            p.has_agenda === featureData.has_agenda &&
            p.has_leads === featureData.has_leads &&
            p.has_voice === featureData.has_voice
        )
        activePlanId = fmPkg?.id || null
        console.log('SERVER [getAdminUserDetail]: Fallback Feature Match ID:', activePlanId)
    }

    console.log('SERVER [getAdminUserDetail]: Returning data summary:', {
        userFound: !!targetUser,
        packageCount: packages?.length || 0,
        featurePlanId: activePlanId
    })

    return {
        success: true,
        data: {
            user: targetUser,
            packages: packages || [],
            features: {
                has_properties: featureData?.has_properties ?? true,
                has_agenda: featureData?.has_agenda ?? false,
                has_materials: featureData?.has_materials ?? false,
                has_archive: featureData?.has_archive ?? false,
                has_leads: featureData?.has_leads ?? false,
                has_statistics: featureData?.has_statistics ?? false,
                has_reviews: featureData?.has_reviews ?? false,
                has_webshop: featureData?.has_webshop ?? false,
                has_billing: featureData?.has_billing ?? false,
                has_voice: featureData?.has_voice ?? false,
                planId: activePlanId,
                trialExpiresAt: targetUser?.trial_expires_at || null
            },
            orders: orders || []
        }
    }
}

export async function updateTrialExpiration(userId: string, daysToAdd: number) {
    const supabase = await createClient()

    // 1. Verify caller is superadmin
    if (!(await isAdmin())) {
        return { error: 'Geen toegang' }
    }

    const supabaseAdmin = await createAdminClient()

    // 2. Fetch current trial date
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('trial_expires_at')
        .eq('id', userId)
        .single()

    const currentExpiry = profile?.trial_expires_at ? new Date(profile.trial_expires_at) : new Date()
    const newExpiry = new Date(currentExpiry.getTime() + (daysToAdd * 24 * 60 * 60 * 1000))

    // 3. Update profile
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({
            trial_expires_at: newExpiry.toISOString()
        })
        .eq('id', userId)

    if (error) {
        console.error('Trial update error:', error)
        return { error: 'Fout bij verlengen trial' }
    }

    revalidatePath(`/admin/users/${userId}`)
    return { success: true, newDate: newExpiry.toLocaleDateString('nl-NL') }
}
