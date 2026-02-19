
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // OR SERVICE_ROLE if needed, but ANON should work for public read

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Env Vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getProperty() {
    const { data, error } = await supabase
        .from('properties')
        .select('id')
        .limit(1)
        .single();

    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Property ID:", data.id);
    }
}

getProperty();
