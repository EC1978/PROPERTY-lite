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
    const { createClient } = await import('@/utils/supabase/server');
    const supabase = await createClient();

    const { data: pkg, error: pkgErr } = await supabase
        .from('packages')
        .select('name, monthly_price')
        .eq('id', plan)
        .single();

    if (pkgErr || !pkg) {
        console.error('Mollie checkout error: Package not found in DB', { plan, pkgErr });
        throw new Error('Invalid plan');
    }

    const priceAmount = (pkg.monthly_price || 0).toFixed(2);
    const description = `${pkg.name} Plan - VoiceRealty AI`;

    console.log('Creating Mollie payment:', { plan, priceAmount, description });

    try {
        const mollieClient = await getMollie();

        const isLocalhost = origin.includes('localhost');

        const payment = await mollieClient.payments.create({
            amount: {
                value: priceAmount,
                currency: 'EUR',
            },
            description: description,
            redirectUrl: `${origin}/api/checkout/callback?provider=mollie&userId=${userId}&plan=${plan}`,
            webhookUrl: isLocalhost ? undefined : `${origin}/api/mollie/webhook`,
            metadata: {
                userId: userId,
                plan: plan,
            },
        });
        return payment;
    } catch (err: any) {
        console.error('Mollie API Error:', err.message || err);
        throw err;
    }
}
