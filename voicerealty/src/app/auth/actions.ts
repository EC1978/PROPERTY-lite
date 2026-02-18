
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error, data: authData } = await supabase.auth.signInWithPassword(data)
    const user = authData?.user;

    if (error) {
        return { error: error.message }
    }

    const plan = formData.get('plan') as string;

    if (plan && user) {
        try {
            const { createCheckoutSession } = await import('@/utils/stripe');
            // We need an origin for the success/cancel URLs. 
            // For now, let's use process.env.NEXT_PUBLIC_APP_URL or fallback.
            const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

            const session = await createCheckoutSession({
                plan,
                userId: user.id,
                userEmail: user.email,
                origin,
            });

            if (session.url) {
                redirect(session.url);
            }
        } catch (e) {
            console.error('Failed to create checkout session during login:', e);
            // Fallback to dashboard if checkout fails
        }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    // Extract full name from form data
    const fullName = formData.get('fullName') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const data = {
        email,
        password,
        options: {
            data: {
                full_name: fullName,
            }
        }
    }

    const { error, data: authData } = await supabase.auth.signUp(data)
    // Destructure authData to get user
    const user = authData?.user;

    if (error) {
        return { error: error.message }
    }

    const plan = formData.get('plan') as string;

    if (plan && user) {
        try {
            const { createCheckoutSession } = await import('@/utils/stripe');
            // We need an origin for the success/cancel URLs. 
            // In server actions, we might rely on environment variables or hardcoded origin for now.
            // Or we can try to get it from headers() if we import it.
            // For now, let's use process.env.NEXT_PUBLIC_APP_URL or fallback.
            const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

            const session = await createCheckoutSession({
                plan,
                userId: user.id,
                userEmail: user.email,
                origin,
            });

            if (session.url) {
                redirect(session.url);
            }
        } catch (e) {
            console.error('Failed to create checkout session during signup:', e);
            // Fallback to onboarding if checkout fails
        }
    }

    revalidatePath('/', 'layout')
    redirect('/onboarding')
}
