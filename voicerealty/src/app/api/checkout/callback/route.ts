import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { getMollie } from '@/utils/mollie';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userIdArg = searchParams.get('userId');
    const planArg = searchParams.get('plan');

    // Fallback for Stripe legacy URL (if any existing links)
    const sessionId = searchParams.get('session_id');

    if (sessionId) {
        // Legacy Stripe handling or remove if not needed.
        // For strict "replace", we can ignore or return error.
        // Let's just focus on Mollie.
    }

    if (!userIdArg || !planArg) {
        // It might be that the user cancelled or just hit the URL?
        // Mollie redirects here.
        // If parameters are missing, redirect to pricing.
        return NextResponse.redirect(new URL('/pricing', request.url));
    }

    try {
        const mollie = getMollie();

        // Fetch recent payments to find the one for this user
        // Use page() instead of list()
        const payments = await mollie.payments.page({ limit: 20 });

        const validPayment = payments.find((p: any) =>
            p.metadata?.userId === userIdArg &&
            p.metadata?.plan === planArg &&
            p.status === 'paid'
        );

        if (validPayment) {
            const supabase = await createClient();

            // Update subscription
            const { error } = await supabase
                .from('subscriptions')
                .update({
                    plan: planArg,
                    status: 'active',
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Fake 30 days
                })
                .eq('user_id', userIdArg);

            if (error) {
                console.error('Supabase Update Error:', error);
            }

            return NextResponse.redirect(new URL('/dashboard?payment=success', request.url));
        } else {
            // Payment not found or not paid yet (open/pending/cancelled)
            // Redirect to dashboard with info? Or back to pricing?
            // If it's 'open', maybe they just clicked back.
            // Let's check if there is an 'open' payment?
            // For now, redirect to dashboard.
            return NextResponse.redirect(new URL('/dashboard?payment=pending_or_failed', request.url));
        }

    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
