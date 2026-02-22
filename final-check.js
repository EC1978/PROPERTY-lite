const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

const envFile = fs.readFileSync('.env.local', 'utf8')
const env = {}
envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
        env[key.trim()] = value.trim()
    }
})

async function finalCheck() {
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

    console.log("Checking vlag1 linking status...")
    const { data: material, error } = await supabase
        .from('agent_materials')
        .select('id, active_property_id')
        .eq('id', 'vlag1')
        .single()

    if (error) {
        console.error("Error:", error)
    } else {
        console.log("Vlag1 Status:", material)
        if (!material.active_property_id) {
            console.log("WARNING: vlag1 is UNLINKED in the database.")
        } else {
            console.log("SUCCESS: vlag1 is LINKED in the database.")
        }
    }
}

finalCheck()
