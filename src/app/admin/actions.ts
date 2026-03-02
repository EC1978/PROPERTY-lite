'use server'

import { createClient } from '@/utils/supabase/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// This uses the service role to generate a session for another user
export async function impersonateUser(targetUserId: string) {
    const supabase = await createClient()

    // 1. Verify caller is superadmin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Niet ingelogd' }

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'superadmin') {
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

    // Another approach: Using `generateLink` type: 'magiclink'
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll() },
                setAll() { }
            }
        }
    )

    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: (await supabaseAdmin.auth.admin.getUserById(targetUserId)).data.user?.email || '',
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
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Niet ingelogd' }

    const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (userData?.role !== 'superadmin') {
        return { error: 'Geen toegang' }
    }

    // 2. We use the service role client to bypass any potential RLS restrictions 
    // for updating another user's features, making it robust.
    const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() { return [] },
                setAll() { }
            }
        }
    )

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

    return { success: true }
}
