
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

import { createClient } from '@/utils/supabase/server'

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
export async function getURL() {
    let url = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    // Try to get from headers for dynamic detection (local vs production)
    try {
        const headerList = await headers()
        let host = headerList.get('host')
        if (host) {
            // Fix for 0.0.0.0 or [::] which are invalid on Windows browsers
            if (host.includes('0.0.0.0')) {
                host = host.replace('0.0.0.0', 'localhost')
            } else if (host.includes('[::]')) {
                host = host.replace('[::]', 'localhost')
            }
            
            const protocol = host.includes('localhost') || host.includes('127.0.0.1') ? 'http' : 'https'
            url = `${protocol}://${host}`
            console.log('Dynamic URL detected:', url)
        }
    } catch (e) {
        console.warn('Could not detect dynamic URL, falling back to:', url)
    }

    // Make sure to remove trailing slash
    return url.replace(/\/$/, '')
}

// ─────────────────────────────────────────────
// LOGIN — MFA-aware
// ─────────────────────────────────────────────
export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error, data: authData } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: 'Ongeldig e-mailadres of wachtwoord.' }
    }

    // Check if the user has MFA factors enrolled
    const { data: mfaData } = await supabase.auth.mfa.listFactors()
    const totpFactors = mfaData?.totp ?? []
    const verifiedFactor = totpFactors.find(f => f.status === 'verified')

    if (verifiedFactor) {
        // User has 2FA — create a challenge and return the info to the client
        const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
            factorId: verifiedFactor.id,
        })

        if (challengeError || !challengeData) {
            return { error: 'Kon 2FA-uitdaging niet starten. Probeer het opnieuw.' }
        }

        return {
            requiresMfa: true,
            factorId: verifiedFactor.id,
            challengeId: challengeData.id,
        }
    }

    const user = authData?.user
    const plan = formData.get('plan') as string

    if (plan && user) {
        try {
            const { createCheckoutSession } = await import('@/utils/stripe')
            const origin = await getURL()
            const session = await createCheckoutSession({
                plan,
                userId: user.id,
                userEmail: user.email,
                origin,
            })
            if (session.url) {
                redirect(session.url)
            }
        } catch (e) {
            console.error('Failed to create checkout session during login:', e)
        }
    }

    // Haal role op voor juiste redirect
    let redirectPath = '/dashboard'
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()

        // Check DB role OR env variable fallback
        const adminEmailsConfig = process.env.ADMIN_EMAILS || ''
        const adminEmails = adminEmailsConfig.split(',').map(e => e.trim().toLowerCase())
        const isEmailAdmin = user.email ? adminEmails.includes(user.email.toLowerCase()) : false
        const isDbAdmin = profile?.role === 'superadmin'

        if (isDbAdmin || isEmailAdmin) {
            redirectPath = '/admin'
        }
    }

    revalidatePath('/', 'layout')
    redirect(redirectPath)
}

// ─────────────────────────────────────────────
// SIGNUP
// ─────────────────────────────────────────────
export async function signup(formData: FormData) {
    const supabase = await createClient()

    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const data = {
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            },
        },
    }

    const origin = await getURL()
    const { error, data: authData } = await supabase.auth.signUp({
        ...data,
        options: {
            ...data.options,
            emailRedirectTo: `${origin}/auth/callback`,
        }
    })
    const user = authData?.user

    if (error) {
        return { error: error.message }
    }

    const plan = formData.get('plan') as string

    if (plan && user) {
        try {
            const { createCheckoutSession } = await import('@/utils/stripe')
            const origin = await getURL()
            const session = await createCheckoutSession({
                plan,
                userId: user.id,
                userEmail: user.email,
                origin,
            })
            if (session.url) {
                redirect(session.url)
            }
        } catch (e) {
            console.error('Failed to create checkout session during signup:', e)
        }
    }

    // indicate email confirmation needed
    return { success: true, needsConfirmation: true }
}

// ─────────────────────────────────────────────
// SIGN OUT
// ─────────────────────────────────────────────
export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

// ─────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────
export async function forgotPassword(formData: FormData) {
    try {
        const supabase = await createClient()
        const email = formData.get('email') as string

        console.log('Forgot password request for:', email)

        if (!email) {
            return { error: 'Voer een geldig e-mailadres in.' }
        }

        const origin = await getURL()
        const redirectTo = `${origin}/auth/callback?next=/reset-password`

        console.log('Reset redirectTo:', redirectTo)

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectTo,
        })

        if (error) {
            console.error('Supabase resetPasswordForEmail error:', error.message)
            return { error: 'Kon herstelmail niet verzenden: ' + error.message }
        }

        console.log('Reset email sent successfully to:', email)
        return { success: true }
    } catch (e: any) {
        console.error('Unexpected error in forgotPassword action:', e)
        return { error: 'Er is een onverwachte fout opgetreden. Probeer het opnieuw.' }
    }
}

// ─────────────────────────────────────────────
// RESET PASSWORD (after email callback)
// ─────────────────────────────────────────────
export async function resetPassword(formData: FormData) {
    try {
        const supabase = await createClient()
        const password = formData.get('password') as string

        console.log('Resetting password...')

        if (!password || password.length < 8) {
            return { error: 'Wachtwoord moet minimaal 8 karakters bevatten.' }
        }

        const { error } = await supabase.auth.updateUser({ password })

        if (error) {
            console.error('Supabase updateUser password error:', error.message)
            return { error: 'Kon wachtwoord niet instellen: ' + error.message }
        }

        console.log('Password reset successful!')
        revalidatePath('/', 'layout')
        redirect('/dashboard')
    } catch (e: any) {
        if (e.message === 'NEXT_REDIRECT') throw e; // Let redirect bubbles up
        console.error('Unexpected error in resetPassword action:', e)
        return { error: 'Er is een onverwachte fout opgetreden. Probeer het opnieuw.' }
    }
}

// ─────────────────────────────────────────────
// MFA — ENROLL TOTP (returns QR code + secret)
// ─────────────────────────────────────────────
export async function enrollTotp() {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'VoiceRealty AI',
    })

    if (error || !data) {
        return { error: 'Kon 2FA niet starten. Probeer het opnieuw.' }
    }

    return {
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
    }
}

// ─────────────────────────────────────────────
// MFA — VERIFY TOTP (challenge + verify)
// ─────────────────────────────────────────────
export async function verifyTotp(formData: FormData) {
    const supabase = await createClient()

    const factorId = formData.get('factorId') as string
    const challengeId = formData.get('challengeId') as string
    const code = formData.get('code') as string

    if (!factorId || !code) {
        return { error: 'Ontbrekende gegevens. Probeer het opnieuw.' }
    }

    // If we have a challengeId (login flow), use it directly
    if (challengeId) {
        const { error } = await supabase.auth.mfa.verify({
            factorId,
            challengeId,
            code,
        })

        if (error) {
            return { error: 'Onjuiste code. Probeer het opnieuw.' }
        }

        // Haal role op voor juiste redirect na MFA
        const { data: { user: mfaUser } } = await supabase.auth.getUser()
        let mfaRedirectPath = '/dashboard'
        if (mfaUser) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', mfaUser.id)
                .single()
            
            // Check DB role OR env variable fallback
            const adminEmailsConfig = process.env.ADMIN_EMAILS || ''
            const adminEmails = adminEmailsConfig.split(',').map(e => e.trim().toLowerCase())
            const isEmailAdmin = mfaUser.email ? adminEmails.includes(mfaUser.email.toLowerCase()) : false
            const isDbAdmin = profile?.role === 'superadmin'

            if (isDbAdmin || isEmailAdmin) {
                mfaRedirectPath = '/admin'
            }
        }

        revalidatePath('/', 'layout')
        redirect(mfaRedirectPath)
    }

    // Enrollment flow: create a new challenge and verify
    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({ factorId })

    if (challengeError || !challengeData) {
        return { error: 'Kon uitdaging niet aanmaken. Probeer het opnieuw.' }
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
    })

    if (verifyError) {
        return { error: 'Onjuiste code. Scan de QR-code opnieuw.' }
    }

    return { success: true }
}

// ─────────────────────────────────────────────
// MFA — UNENROLL TOTP
// ─────────────────────────────────────────────
export async function unenrollTotp(factorId: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.mfa.unenroll({ factorId })

    if (error) {
        return { error: 'Kon 2FA niet uitschakelen.' }
    }

    return { success: true }
}

// ─────────────────────────────────────────────
// MFA — GET FACTORS (load existing 2FA state)
// ─────────────────────────────────────────────
export async function getMfaFactors() {
    const supabase = await createClient()

    const { data, error } = await supabase.auth.mfa.listFactors()

    if (error || !data) {
        return { factors: [] }
    }

    return { factors: data.totp ?? [] }
}
