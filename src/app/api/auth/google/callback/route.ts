import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
    const code = req.nextUrl.searchParams.get('code');
    const errorParam = req.nextUrl.searchParams.get('error');

    if (errorParam || !code) {
        return NextResponse.redirect(new URL('/settings/integrations?error=oauth_failed', req.url));
    }

    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    try {
        // 1. Fetch Client ID and Secret
        const { data: settings } = await supabase.from('platform_settings').select('google_client_id, google_client_secret').eq('id', 1).single();

        const clientId = settings?.google_client_id || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
        const clientSecret = settings?.google_client_secret || process.env.GOOGLE_CLIENT_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/google/callback`;

        if (!clientId || !clientSecret) {
            // Mock success for UI demo if keys are missing but we got here somehow (e.g. testing)
            await mockUpsertToken(supabase, userData.user.id, 'google');
            return NextResponse.redirect(new URL('/settings/integrations?success=mocked', req.url));
        }

        // 2. Exchange code for token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code,
                grant_type: 'authorization_code',
                redirect_uri: redirectUri,
            }),
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('Google token exchange error:', tokenData);
            return NextResponse.redirect(new URL('/settings/integrations?error=token_exchange_failed', req.url));
        }

        // 3. Upsert into database
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

        await supabase.from('user_integrations').upsert({
            user_id: userData.user.id,
            provider: 'google',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null, // Refresh token might not always be returned
            expires_at: expiresAt.toISOString()
        }, { onConflict: 'user_id,provider' });

        return NextResponse.redirect(new URL('/settings/integrations?success=true', req.url));

    } catch (err) {
        console.error('OAuth Callback Exception:', err);
        return NextResponse.redirect(new URL('/settings/integrations?error=server_error', req.url));
    }
}

async function mockUpsertToken(supabase: any, userId: string, provider: string) {
    await supabase.from('user_integrations').upsert({
        user_id: userId,
        provider,
        access_token: 'mock_access_token_' + Date.now()
    }, { onConflict: 'user_id,provider' });
}
