import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugLinks() {
    console.log("Fetching all agent_materials...")
    const { data: materials, error } = await supabase
        .from('agent_materials')
        .select('id, name, active_property_id, user_id')

    if (error) {
        console.error("Error fetching materials:", error)
        return
    }

    console.log("Materials found:", materials.length)
    materials.forEach(m => {
        console.log(`- ID: ${m.id}, Name: ${m.name}, Linked Property: ${m.active_property_id || 'NULL'}`)
    })
}

debugLinks()
