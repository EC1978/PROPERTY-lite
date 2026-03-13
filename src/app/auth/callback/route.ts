
import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type')
    const next = searchParams.get('next') ?? '/dashboard'

    console.log('[Auth Callback] Request received:', {
        url: request.url,
        code: code ? 'PRESENT' : 'MISSING',
        type,
        next
    })

    const { getURL } = await import('@/app/auth/actions')
    const safeOrigin = await getURL()

    if (code) {
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'

        // Check if this is an impersonation request
        const isImpersonate = searchParams.get('impersonate') === 'true'

        console.log('[Auth Callback] Attempting code exchange for code:', code.substring(0, 10) + '...', { isImpersonate })
        
        // When impersonating, the ghost login api (`admin.generateLink`) did not generate a client-side PKCE code verifier.
        // Therefore, we tell the auth client to ignore any existing code_verifier cookie from the admin's own session
        // to prevent 406 Not Acceptable (PKCE mismatch).
        const supabase = await createClient({ ignoreCodeVerifier: isImpersonate })
        
        const { data: exchangeData, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
            console.error('[Auth Callback] Code exchange failed:', {
                message: error.message,
                status: error.status,
                name: error.name
            })
            return NextResponse.redirect(`${safeOrigin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`)
        }

        console.log('[Auth Callback] Code exchange successful. User set:', exchangeData.user?.email)

        // If impersonating, always go to next. Otherwise, recovery goes to reset-password.
        const redirectPath = (type === 'recovery' && !isImpersonate) ? '/reset-password' : next

        if (isLocalEnv) {
            return NextResponse.redirect(`${safeOrigin}${redirectPath}`)
        } else if (forwardedHost) {
            return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`)
        } else {
            return NextResponse.redirect(`${safeOrigin}${redirectPath}`)
        }
    }

    return NextResponse.redirect(`${safeOrigin}/auth/auth-code-error`)
}
