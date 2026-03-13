import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    console.log('[Ghost Login API] POST request received')
    try {
        const { targetUserId } = await request.json()
        console.log('[Ghost Login API] Target user:', targetUserId)

        if (!targetUserId) {
            return NextResponse.json({ error: 'Target User ID is verplicht' }, { status: 400 })
        }

        // 1. Controleer de huidige gebruiker (de admin) via de standaard server client
        const supabase = await createClient()
        const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !adminUser) {
            console.error('[Ghost Login API] Auth error:', authError)
            return NextResponse.json({ error: 'Niet ingelogd of sessie verlopen' }, { status: 401 })
        }

        console.log('[Ghost Login API] Detected Admin User ID:', adminUser.id)

        // 2. Initialiseer de Admin Client (beide voor rol-check en impersonatie)
        const supabaseServiceRole = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // 3. Controleer of de gebruiker een superadmin is (via Service Role om RLS te omzeilen)
        const { data: profile, error: profileError } = await supabaseServiceRole
            .from('profiles')
            .select('role')
            .eq('id', adminUser.id)
            .single()

        const isAdminEmail = process.env.ADMIN_EMAILS?.split(',').includes(adminUser.email || '')

        if (!isAdminEmail && (profileError || profile?.role !== 'superadmin')) {
            console.error('[Ghost Login API] Role check failed:', { profileError, profile, email: adminUser.email })
            return NextResponse.json({ error: 'Geen superadmin rechten' }, { status: 403 })
        }

        // 4. Haal email van target user op
        const { data: targetUserData, error: userError } = await supabaseServiceRole.auth.admin.getUserById(targetUserId)
        if (userError || !targetUserData.user) {
            console.error('[Ghost Login API] Target user fetch error:', userError)
            return NextResponse.json({ error: 'Makelaar niet gevonden' }, { status: 404 })
        }

        // 5. Genereer Link (we gebruiken 'recovery' omdat dit vaak stabieler is voor server-side validatie)
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        console.log('[Ghost Login API] Generating recovery link for:', targetUserData.user.email)

        const { data: linkData, error: linkError } = await supabaseServiceRole.auth.admin.generateLink({
            type: 'recovery',
            email: targetUserData.user.email || '',
            options: {
                redirectTo: `${siteUrl}/auth/callback?next=/dashboard&impersonate=true`
            }
        })

        if (linkError || !linkData?.properties?.action_link) {
            console.error('[Ghost Login API] Link generation error:', linkError)
            return NextResponse.json({ 
                error: 'Kon geen login link genereren: ' + (linkError?.message || 'Onbekende fout') 
            }, { status: 500 })
        }

        const actionLink = linkData.properties.action_link
        
        // Parse the link to extract either token or token_hash
        const urlObj = new URL(actionLink)
        const tokenHash = urlObj.searchParams.get('token_hash')
        const linkType = urlObj.searchParams.get('type') || 'recovery'
        
        console.log('[Ghost Login API] Attempting server-side verification:', { linkType, hasHash: !!tokenHash })

        // Exchange the token directly on the server to establish the session cookies
        // This avoids the PKCE mismatch that happens when sending the link to the browser
        const { error: verifyError } = await supabase.auth.verifyOtp({
            type: linkType as any,
            email: targetUserData.user.email,
            token_hash: tokenHash || undefined,
        } as any)

        if (verifyError) {
            console.error('[Ghost Login API] Verify OTP failed:', verifyError)
            return NextResponse.json({ error: 'Sessie token validatie mislukt: ' + verifyError.message }, { status: 500 })
        }

        console.log('[Ghost Login API] Session established successfully via verifyOtp')
        
        // The cookies are automatically set in the response headers by createClient() (setAll method).
        // Return the dashboard URL so the client can redirect.
        return NextResponse.json({ url: '/dashboard' })

    } catch (error: any) {
        console.error('[Ghost Login API Critical Error]:', error)
        return NextResponse.json({ error: 'Interne fout: ' + error.message }, { status: 500 })
    }
}
