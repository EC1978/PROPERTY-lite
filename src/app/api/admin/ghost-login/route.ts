import { createClient as createVanillaClient } from '@supabase/supabase-js'
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

        // 2. Initialiseer de Service Role Client
        const supabaseAdmin = createVanillaClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // 3. Controleer of de gebruiker een superadmin is
        const { data: profile, error: profileError } = await supabaseAdmin
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
        const { data: targetUserData, error: userError } = await supabaseAdmin.auth.admin.getUserById(targetUserId)
        if (userError || !targetUserData.user) {
            console.error('[Ghost Login API] Target user fetch error:', userError)
            return NextResponse.json({ error: 'Makelaar niet gevonden' }, { status: 404 })
        }

        const targetEmail = targetUserData.user.email!
        console.log('[Ghost Login API] Generating magiclink for:', targetEmail)

        // 5. Genereer een magiclink via admin API
        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: targetEmail,
        })

        if (linkError || !linkData) {
            console.error('[Ghost Login API] Link generation error:', linkError)
            return NextResponse.json({
                error: 'Kon geen login link genereren: ' + (linkError?.message || 'Onbekende fout')
            }, { status: 500 })
        }

        // generateLink geeft properties terug met hashed_token en verification_type
        const hashedToken = linkData.properties?.hashed_token
        const verificationType = linkData.properties?.verification_type || 'magiclink'

        console.log('[Ghost Login API] Link generated. hashed_token present:', !!hashedToken, 'type:', verificationType)

        if (!hashedToken) {
            console.error('[Ghost Login API] Geen hashed_token in generateLink response:', JSON.stringify(linkData.properties))
            return NextResponse.json({ error: 'Supabase heeft geen geldig token teruggegeven' }, { status: 500 })
        }

        // 6. Verifieer het token met een vanilla (niet-SSR) client om PKCE te omzeilen
        const authClient = createVanillaClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
        )

        console.log('[Ghost Login API] Calling verifyOtp with token_hash...')

        const { data: otpData, error: verifyError } = await authClient.auth.verifyOtp({
            type: verificationType as 'magiclink',
            token_hash: hashedToken,
        })

        if (verifyError) {
            console.error('[Ghost Login API] verifyOtp FAILED:', verifyError.message)
            return NextResponse.json({
                error: 'Token verificatie mislukt: ' + verifyError.message
            }, { status: 500 })
        }

        if (!otpData.session) {
            console.error('[Ghost Login API] verifyOtp returned no session')
            return NextResponse.json({ error: 'Geen sessie ontvangen na verificatie' }, { status: 500 })
        }

        console.log('[Ghost Login API] verifyOtp SUCCESS. User:', otpData.session.user.email)

        // 7. Zet de sessie in de SSR client (dit schrijft de cookies naar de browser)
        const supabaseSsr = await createClient()
        const { error: sessionError } = await supabaseSsr.auth.setSession({
            access_token: otpData.session.access_token,
            refresh_token: otpData.session.refresh_token,
        })

        if (sessionError) {
            console.error('[Ghost Login API] setSession FAILED:', sessionError.message)
            return NextResponse.json({ error: 'Kon sessie cookies niet instellen' }, { status: 500 })
        }

        console.log('[Ghost Login API] Session cookies set. Redirecting to dashboard.')

        return NextResponse.json({ url: '/dashboard' })

    } catch (error: any) {
        console.error('[Ghost Login API Critical Error]:', error)
        return NextResponse.json({ error: 'Interne fout: ' + error.message }, { status: 500 })
    }
}
