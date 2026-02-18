import { createMollieClient } from '@mollie/api-client';

const mollieClient = createMollieClient({
    apiKey: process.env.MOLLIE_API_KEY || 'test_fallback_key',
});

export const getMollie = () => mollieClient;

export async function createMolliePayment({
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
    let priceAmount = '0.00';
    let description = '';

    switch (plan) {
        case 'Essential':
            priceAmount = '49.00';
            description = 'Essential Plan - VoiceRealty AI';
            break;
        case 'Professional':
            priceAmount = '129.00';
            description = 'Professional Plan - VoiceRealty AI';
            break;
        case 'Elite':
            priceAmount = '299.00';
            description = 'Elite Plan - VoiceRealty AI';
            break;
        default:
            throw new Error('Invalid plan');
    }

    const payment = await mollieClient.payments.create({
        amount: {
            value: priceAmount,
            currency: 'EUR',
        },
        description: description,
        redirectUrl: `${origin}/api/checkout/callback?provider=mollie&userId=${userId}&plan=${plan}`,
        metadata: {
            userId: userId,
            plan: plan,
        },
    });

    return payment;
}
