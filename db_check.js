const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkProperties() {
    const { data, error } = await supabase
        .from('properties')
        .select('id, address, image_url, images')
        .ilike('address', '%Spaarwaterstraat%')
        .limit(3);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log("DB DATA:", JSON.stringify(data, null, 2));
}

checkProperties();
