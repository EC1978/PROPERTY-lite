
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

import { createClient } from '@/utils/supabase/server'

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
            const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
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

    revalidatePath('/', 'layout')
    redirect('/dashboard')
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

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
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
            const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
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
    const supabase = await createClient()
    const email = formData.get('email') as string

    if (!email) {
        return { error: 'Voer een geldig e-mailadres in.' }
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
    })

    if (error) {
        return { error: 'Kon herstelmail niet verzenden. Probeer het opnieuw.' }
    }

    return { success: true }
}

// ─────────────────────────────────────────────
// RESET PASSWORD (after email callback)
// ─────────────────────────────────────────────
export async function resetPassword(formData: FormData) {
    const supabase = await createClient()
    const password = formData.get('password') as string

    if (!password || password.length < 8) {
        return { error: 'Wachtwoord moet minimaal 8 karakters bevatten.' }
    }

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
        return { error: 'Kon wachtwoord niet instellen. Sessie mogelijk verlopen, vraag een nieuwe herstelmail aan.' }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
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

        revalidatePath('/', 'layout')
        redirect('/dashboard')
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
