import { createClient as createAdminClient } from '@supabase/supabase-js'

/* Load env manually for test */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const supabaseClient = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function testImpersonate() {
    const targetEmail = 'demo@voicerealty.ai'; // of een ander account

    // 1. Generate link
    console.log('Generating link for', targetEmail);
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: targetEmail
    });

    if (linkError) {
        console.error('Link generation error:', linkError);
        return;
    }

    const actionLink = linkData.properties.action_link;
    console.log('Action Link:', actionLink);
    
    // Parse link
    const urlObj = new URL(actionLink);
    const tokenHash = urlObj.searchParams.get('token_hash');
    console.log('Token Hash:', tokenHash);

    // 2. Try to verify it
    console.log('Verifying OTP with token_hash...');
    const { data: sessionData, error: verifyError } = await supabaseClient.auth.verifyOtp({
        type: 'magiclink',
        email: targetEmail,
        token_hash: tokenHash!
    });

    if (verifyError) {
        console.error('Verify error:', verifyError);
    } else {
        console.log('Session success!', sessionData.session?.access_token.substring(0, 20) + '...');
    }
}

testImpersonate();
