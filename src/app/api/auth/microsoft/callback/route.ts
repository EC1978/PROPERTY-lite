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
        const { data: settings } = await supabase.from('platform_settings').select('microsoft_client_id, microsoft_client_secret').eq('id', 1).single();

        // Fallback to process.env if needed, though secret shouldn't be NEXT_PUBLIC
        const clientId = settings?.microsoft_client_id || process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;
        const clientSecret = settings?.microsoft_client_secret || process.env.MICROSOFT_CLIENT_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/microsoft/callback`;
        const tenant = 'common';

        if (!clientId || !clientSecret) {
            // Mock success
            await mockUpsertToken(supabase, userData.user.id, 'microsoft');
            return NextResponse.redirect(new URL('/settings/integrations?success=mocked_microsoft', req.url));
        }

        const tokenResponse = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
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
            console.error('Microsoft token exchange error:', tokenData);
            return NextResponse.redirect(new URL('/settings/integrations?error=token_exchange_failed', req.url));
        }

        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + tokenData.expires_in);

        await supabase.from('user_integrations').upsert({
            user_id: userData.user.id,
            provider: 'microsoft',
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
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
