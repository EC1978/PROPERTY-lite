// Test script: generateLink + verifyOtp met hashed_token
// Draait via: node --env-file=.env.local tmp/test-ghost.js
const { createClient } = require('@supabase/supabase-js')

async function test() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log('URL:', url ? 'OK' : 'MISSING')
    console.log('SERVICE_KEY:', serviceKey ? 'OK' : 'MISSING')
    console.log('ANON_KEY:', anonKey ? 'OK' : 'MISSING')

    if (!url || !serviceKey || !anonKey) {
        console.error('Missing env vars! Make sure to run with: node --env-file=.env.local tmp/test-ghost.js')
        return
    }

    // Admin client
    const admin = createClient(url, serviceKey, { auth: { persistSession: false } })

    // Generate link
    console.log('\n--- Generating magiclink ---')
    const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
        type: 'magiclink',
        email: 'demo@voicerealty.ai',
    })

    if (linkError) {
        console.error('generateLink ERROR:', linkError)
        return
    }

    console.log('action_link:', linkData.properties.action_link)
    console.log('hashed_token:', linkData.properties.hashed_token)
    console.log('verification_type:', linkData.properties.verification_type)
    console.log('expires_at:', linkData.properties.expires_at)

    // Vanilla client
    const authClient = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })

    // Verify OTP met hashed_token
    console.log('\n--- Calling verifyOtp ---')
    const { data: otpData, error: verifyError } = await authClient.auth.verifyOtp({
        type: linkData.properties.verification_type || 'magiclink',
        token_hash: linkData.properties.hashed_token,
    })

    if (verifyError) {
        console.error('verifyOtp ERROR:', verifyError.message, verifyError)
        return
    }

    console.log('verifyOtp SUCCESS!')
    console.log('Session present:', !!otpData.session)
    console.log('User email:', otpData.session?.user?.email)
    console.log('Access token (first 20):', otpData.session?.access_token?.substring(0, 20))
}

test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
