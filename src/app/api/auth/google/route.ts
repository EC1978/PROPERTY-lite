import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: NextRequest) {
    const supabase = await createClient();

    // Try to get from platform_settings first
    const { data: settings } = await supabase
        .from('platform_settings')
        .select('google_client_id')
        .eq('id', 1)
        .single();

    const clientId = settings?.google_client_id || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
        console.warn("GOOGLE_CLIENT_ID is missing. Redirecting to mock callback.");
        return NextResponse.redirect(new URL('/api/auth/google/callback?code=mock_code', req.url));
    }

    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/auth/google/callback`;
    const scope = 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly';

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`;

    return NextResponse.redirect(authUrl);
}
