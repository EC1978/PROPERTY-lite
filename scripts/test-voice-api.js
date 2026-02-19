
const { createClient } = require('@supabase/supabase-js');

// Harcoded for testing
const supabaseUrl = 'https://pvseyvtbchrspqadgxck.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2c2V5dnRiY2hyc3BxYWRneGNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODk1MjQsImV4cCI6MjA4NjU2NTUyNH0.3ClbTcSPdWBcuWjnxGy4sQKCHeXBQ-4F_G2YEnwWCiA';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testVoiceAPI() {
    console.log("🔍 Fetching Property ID...");
    const { data, error } = await supabase
        .from('properties')
        .select('id')
        .limit(1)
        .single();

    if (error) {
        console.error("❌ DB Error:", error);
        return;
    }

    if (!data) {
        console.error("❌ No properties found");
        return;
    }

    const propertyId = data.id;
    console.log("✅ Found Property ID:", propertyId);

    console.log("🚀 Testing API Route...");
    try {
        const response = await fetch('http://localhost:3000/api/voice/session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ propertyId })
        });

        console.log(`📡 Status: ${response.status} ${response.statusText}`);

        const text = await response.text();
        try {
            const json = JSON.parse(text);
            console.log("📦 Response JSON:", JSON.stringify(json, null, 2));
        } catch (e) {
            console.log("📄 Response Text:", text);
        }

    } catch (e) {
        console.error("❌ Fetch Error:", e.message);
        console.log("Make sure localhost:3000 is running!");
    }
}

testVoiceAPI();
