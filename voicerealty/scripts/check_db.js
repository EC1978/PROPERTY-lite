const { createClient } = require('@supabase/supabase-js');

const URL = 'https://pvseyvtbchrspqadgxck.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2c2V5dnRiY2hyc3BxYWRneGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODk1MjQsImV4cCI6MjA4NjU2NTUyNH0.3ClbTcSPdWBcuWjnxGy4sQKCHeXBQ-4F_G2YEnwWCiA';

async function check() {
    const supabase = createClient(URL, KEY);
    const today = new Date('2026-02-18').toISOString().split('T')[0];

    console.log('Checking subscriptions from today:', today);
    const { data: subs, error } = await supabase
        .from('subscriptions')
        .select('*')
        .gte('created_at', today);

    if (error) console.error('Error:', error);
    else console.log('Subscriptions from today:', JSON.stringify(subs, null, 2));
}

check();
