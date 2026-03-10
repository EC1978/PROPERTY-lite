
import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Routes that are public (no auth required)
const PUBLIC_ROUTES = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth',
    '/woning',
    '/qr',
    '/pricing',
    '/review',
    '/shop',
    '/api/voice',
    '/api/payments',
    '/maintenance',
]

function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route)) || pathname === '/'
}

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: any[]) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const { pathname } = request.nextUrl

    // --- MAINTENANCE MODE CHECK ---
    // Allow public routes (like /login) to be accessible even during maintenance
    // so that admins can log in to disable it.
    if (pathname !== '/maintenance' && !isPublicRoute(pathname) && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
        if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
            // Fetch maintenance mode state using service role client to bypass RLS
            const supabaseAdmin = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY,
                {
                    cookies: {
                        getAll() { return request.cookies.getAll() },
                        setAll() { }
                    }
                }
            )

            const { data: systemSettings } = await supabaseAdmin
                .from('system_settings')
                .select('maintenance_mode')
                .eq('id', 1)
                .single()

            if (systemSettings?.maintenance_mode) {
                let userIsAdmin = false
                if (user && user.email) {
                    const adminEmailsConfig = process.env.ADMIN_EMAILS || ''
                    const adminEmails = adminEmailsConfig.split(',').map(e => e.trim().toLowerCase())
                    userIsAdmin = adminEmails.includes(user.email.toLowerCase())
                }

                if (!userIsAdmin) {
                    const url = request.nextUrl.clone()
                    url.pathname = '/maintenance'
                    return NextResponse.redirect(url)
                }
            }
        } else {
            console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is missing in .env.local. Maintenance mode check skipped.')
        }
    }
    // ------------------------------

    // Redirect unauthenticated users trying to access protected routes
    if (!user && !isPublicRoute(pathname)) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        return NextResponse.redirect(url)
    }

    // --- ADMIN ROUTE SECURITY ---
    if (pathname.startsWith('/admin')) {
        if (!user) {
            const url = request.nextUrl.clone()
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }

        // Fetch user role
        const { data: userData } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single()

        if (userData?.role !== 'superadmin') {
            const url = request.nextUrl.clone()
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    }
    // ----------------------------

    // --- MODULE SECURITY ---
    if (user && !pathname.startsWith('/admin') && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/') && !isPublicRoute(pathname)) {
        // Fetch tenant features to enforce module access
        const { data: features } = await supabase
            .from('tenant_features')
            .select('*')
            .eq('user_id', user.id)
            .single()

        if (features) {
            const redirect = (path: string) => {
                const url = request.nextUrl.clone()
                url.pathname = path
                return NextResponse.redirect(url)
            }

            if (pathname.startsWith('/shop') && !features.has_webshop) return redirect('/dashboard')
            if (pathname.startsWith('/agenda') && !features.has_agenda) return redirect('/dashboard')
            if (pathname.startsWith('/leads') && !features.has_leads) return redirect('/dashboard')
            if (pathname.startsWith('/properties') && features.has_properties === false) return redirect('/dashboard')
            if (pathname.startsWith('/dashboard/reviews') && features.has_reviews === false) return redirect('/dashboard')
            if (pathname.startsWith('/dashboard/materialen') && features.has_materials === false) return redirect('/dashboard')
            if (pathname.startsWith('/archive') && features.has_archive === false) return redirect('/dashboard')
            if (pathname.startsWith('/analytics') && features.has_statistics === false) return redirect('/dashboard')
        }
    }
    // -----------------------

    // Redirect authenticated users away from auth pages (but NOT from reset-password or verify-2fa)
    if (
        user &&
        (pathname.startsWith('/login') || pathname.startsWith('/register') || pathname.startsWith('/forgot-password'))
    ) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
