import { createMollieClient } from '@mollie/api-client';
import { createAdminClient } from '@/utils/supabase/server';

export async function getMollie() {
    const supabaseAdmin = await createAdminClient();
    const { data } = await supabaseAdmin
        .from('platform_settings')
        .select('mollie_api_key, active_payment_methods')
        .eq('id', 1)
        .single();

    const apiKey = data?.mollie_api_key || process.env.MOLLIE_API_KEY || 'test_fallback_key';

    return createMollieClient({
        apiKey: apiKey,
    });
}


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

    const mollieClient = await getMollie();

    const payment = await mollieClient.payments.create({
        amount: {
            value: priceAmount,
            currency: 'EUR',
        },
        description: description,
        redirectUrl: `${origin}/api/checkout/callback?provider=mollie&userId=${userId}&plan=${plan}`,
        webhookUrl: `${origin}/api/mollie/webhook`,
        metadata: {
            userId: userId,
            plan: plan,
        },
    });

    return payment;
}
