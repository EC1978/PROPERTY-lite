import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { createMolliePayment } from '@/utils/mollie';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    try {
        const { plan } = await request.json();
        const supabase = await createClient();

        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // MOCK MODE: Redirect to confirmation page
        const confirmationUrl = `${request.headers.get('origin')}/checkout/confirmation?plan=${plan}`;
        return NextResponse.json({ url: confirmationUrl });

        /* 
        // Real Mollie Payment (Disabled for Simulation)
        const payment = await createMolliePayment({
            plan,
            userId: user.id,
            userEmail: user.email,
            origin: request.headers.get('origin') || '',
        });

        return NextResponse.json({ url: payment.getCheckoutUrl() });
        */

    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
