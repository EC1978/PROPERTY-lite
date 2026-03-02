
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fallback', {
    typescript: true,
});

export const getStripe = () => stripe;

export async function createCheckoutSession({
    plan,
    userId,
    userEmail,
    origin,
}: {
    plan: string;
    userId: string;
    userEmail?: string;
    origin: string;
}) {
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    const { data: pkg, error: pkgErr } = await supabase
        .from('packages')
        .select('name, monthly_price')
        .eq('id', plan)
        .single();

    if (pkgErr || !pkg) {
        console.error('Stripe checkout error: Package not found', plan, pkgErr);
        throw new Error('Invalid plan');
    }

    const priceAmount = (pkg.monthly_price || 0) * 100; // Cents
    const priceName = `${pkg.name} Plan`;

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'ideal'],
        line_items: [
            {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: priceName,
                        metadata: {
                            plan_id: plan,
                        },
                    },
                    unit_amount: priceAmount,
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: `${origin}/api/checkout/callback?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing`,
        client_reference_id: userId,
        customer_email: userEmail,
        metadata: {
            userId: userId,
            plan: plan,
        },
    });

    return session;
}
