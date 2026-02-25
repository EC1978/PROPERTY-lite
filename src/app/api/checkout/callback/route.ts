import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userIdArg = searchParams.get('userId');
    const planArg = searchParams.get('plan');
    const baseUrl = request.url.split('/api/')[0];

    // Local testing fallback: 
    // Since ngrok is not used, Mollie cannot reach the webhook.
    // Therefore, in development mode, we simulate the webhook logic upon redirect.
    if (process.env.NODE_ENV === 'development' && userIdArg && planArg) {
        console.log('[Callback Fallback] Local development mode detected. Simulating webhook success...');

        // Use the supabase-js client to bypass RLS with service role key, just like the webhook.
        const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey);

        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        await supabaseAdmin
            .from('subscriptions')
            .upsert({
                user_id: userIdArg,
                plan: planArg,
                status: 'active',
                period_start: new Date().toISOString(),
                period_end: nextMonth.toISOString(),
            });

        await supabaseAdmin
            .from('invoices')
            .insert({
                user_id: userIdArg,
                invoice_number: `INV-LOCAL-${Date.now()}`,
                amount: '€ 0.00', // Mock amount for local simulation
                status: 'Betaald',
                date: new Date().toISOString(),
                document: planArg,
            });
    }

    // Redirect the user back to the billing dashboard where they can see their status.
    return NextResponse.redirect(`${baseUrl}/settings/billing?checkout=return`);
}
