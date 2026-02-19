
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
    let priceAmount = 0;
    let priceName = '';

    switch (plan) {
        case 'Essential':
            priceAmount = 4900;
            priceName = 'Essential Plan';
            break;
        case 'Professional':
            priceAmount = 12900;
            priceName = 'Professional Plan';
            break;
        case 'Elite':
            priceAmount = 29900;
            priceName = 'Elite Plan';
            break;
        default:
            throw new Error('Invalid plan');
    }

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
