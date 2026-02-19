const { createClient } = require('@supabase/supabase-js');

const URL = 'https://pvseyvtbchrspqadgxck.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2c2V5dnRiY2hyc3BxYWRneGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODk1MjQsImV4cCI6MjA4NjU2NTUyNH0.3ClbTcSPdWBcuWjnxGy4sQKCHeXBQ-4F_G2YEnwWCiA';

async function checkMedia() {
    const supabase = createClient(URL, KEY);

    console.log('Checking property media URLs...');
    const { data: props, error } = await supabase
        .from('properties')
        .select('id, address, video_url, floorplan_url, tour_360_url')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Found properties:');
        props.forEach(p => {
            console.log(`Address: ${p.address}`);
            console.log(`- Video: ${p.video_url}`);
            console.log(`- Floorplan: ${p.floorplan_url}`);
            console.log(`- 360 Tour: ${p.tour_360_url}`);
            console.log('---');
        });
    }
}

checkMedia();
