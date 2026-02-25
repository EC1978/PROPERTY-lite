import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
    const supabase = await createClient();

    // Try to get from platform_settings
    const { data: settings } = await supabase
        .from('platform_settings')
        .select('microsoft_client_id')
        .eq('id', 1)
        .single();

    const clientId = settings?.microsoft_client_id || process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID || process.env.MICROSOFT_CLIENT_ID;

    if (!clientId) {
        console.warn("MICROSOFT_CLIENT_ID is missing. Redirecting to mock callback.");
        return NextResponse.redirect(new URL('/api/auth/microsoft/callback?code=mock_code', req.url));
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/microsoft/callback`;
    const scope = 'offline_access Calendars.Read Calendars.ReadWrite';
    const tenant = 'common'; // For multi-tenant apps

    const authUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUri)}&response_mode=query&scope=${encodeURIComponent(scope)}`;

    return NextResponse.redirect(authUrl);
}
