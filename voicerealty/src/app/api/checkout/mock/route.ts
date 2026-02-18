import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { plan } = body;

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            // Fake update subscription
            const { error } = await supabase
                .from('subscriptions')
                .update({
                    plan: plan,
                    status: 'active',
                    current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                })
                .eq('user_id', user.id);

            if (error) {
                console.error('Mock DB Update Error:', error);
                // Return success anyway for the simulation visual
            }
        }

        return NextResponse.json({ success: true });

    } catch (err: any) {
        console.error(err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
