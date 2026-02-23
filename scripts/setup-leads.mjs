/**
 * Script to run the leads migration and seed data against Supabase.
 * 
 * Usage: node scripts/setup-leads.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
    console.log('\n🚀 Running leads migration...\n')

    const migrationSQL = readFileSync(
        join(__dirname, '..', 'supabase', 'migrations', '20260223000000_create_leads.sql'),
        'utf-8'
    )

    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).maybeSingle()

    if (error) {
        // RPC might not exist — try running via the REST API alternative
        console.log('⚠️  rpc exec_sql not available. The migration SQL must be run manually in the Supabase SQL Editor.')
        console.log('📋 Migration file: supabase/migrations/20260223000000_create_leads.sql')
        console.log('\nCopy-paste the SQL from that file into the Supabase SQL Editor at:')
        console.log(`   ${supabaseUrl.replace('.co', '.co')}/project/default/sql\n`)
        return false
    }

    console.log('✅ Migration executed successfully!')
    return true
}

async function seedLeads() {
    console.log('\n🌱 Seeding leads data...\n')

    // First, get a user to assign leads to
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers()

    let userId
    if (userError || !userData?.users?.length) {
        console.log('⚠️  Could not list users via admin API. Will try to use the anon key approach.')
        // Fallback: we'll insert the user_id later from the frontend
        return false
    } else {
        userId = userData.users[0].id
        console.log(`📌 Using user: ${userData.users[0].email} (${userId})`)
    }

    // Seed leads
    const leads = [
        {
            name: 'Jasper de Vries',
            address: 'Grachtengracht 12, Amsterdam',
            status: 'new',
            score: 92,
            is_hot: true,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQpkG0hRxPqZw9uxp_LyIGDl5McEP-eTTidOPKVxFpqrG_ztlFQBI5jcInN0mdYNJP_jkRwA1DTJeLqjsBWBhKp_cuR82GVrIUHiTkwFCXWBX_SPQnSUL2BCe4hLaaUkSUvIMdEqkDq-neaGuX8LxmVySaF9MWW-Yo4S_m8kB7mvMfVDrVDbfr-pA2A51srt0ZqlZGergSSawv_QNTdn8OlQ_P3uArkhbONLxEPkVg8RcxEBbvKKdAB6f6s5do0tZWc0YiJKwX-f4',
            wensen: 'Zoekt 3-kamer app. in Centrum.',
            budget: '€1.2M',
            user_id: userId,
        },
        {
            name: 'Sophie Bakker',
            address: 'Keizersgracht 45, Amsterdam',
            status: 'contacted',
            score: 78,
            is_hot: false,
            message: '"Wil morgen de tuin bekijken..."',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5HF1g9nxGEAbsn7J22vFAnxk-fyc4vTe_5rYF4q6wjZ84cinKRIfx_7OMdkve3bNe-mCfIeantpJ4g4OohM5y-W8qhpeBSmuAScpcseZ9OKQad_xJASQeNgMJn93KRNvlM1MuxT22ghQNkb4AOkV4-dxahRUs0anIxCM9Cq5izWTqGUaapDfvHJsXyTqiDkKgMTHGOzOBPno7NaKU_Y00NF7SpC6qozRfu979RX_CLMxjxNUqQ1rl-5DJEjq3eqDU9o-WU1lhRZg',
            wensen: 'Tuin of ruim balkon...',
            budget: '€850k',
            user_id: userId,
        },
        {
            name: 'Mark van den Berg',
            address: 'Singel 102, Utrecht',
            status: 'negotiation',
            score: 88,
            is_hot: false,
            message: 'Hypotheek check ok',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUv33lMK3D9K5-nSsP-gmaidl7PTiXvv_NvTGwr_zyIjw1IhAv4m17HZwF7ptl_GcOkQloBc6lcSOvxxub2cvEEC31_s1dSHSjqcGFVfehq-GFrv9hZnnLdWWVF7z26IYTdwozHpeIkenFDgFwSuw_dxfL-Fh7eusYMwG2cyTsbq70xrPh0ByLS1hzHlH3Jewu2dfee3C3Y06Cq3K3ONPa3P47VBNYVVU2vTaEeihVd8vZ-u7SHcu5-JUGi-AUyQ_vUwORxIw2PfU',
            wensen: 'Kindvriendelijke buurt, basisschool in de buurt.',
            budget: '€650k',
            user_id: userId,
        },
    ]

    const { data: insertedLeads, error: insertError } = await supabase
        .from('leads')
        .insert(leads)
        .select('id, name')

    if (insertError) {
        console.error('❌ Error inserting leads:', insertError.message)
        return false
    }

    console.log(`✅ Inserted ${insertedLeads.length} leads`)

    // Seed chat messages
    const chatData = {
        'Jasper de Vries': [
            { sender: 'ai', message: 'Hallo Jasper, dit is VoiceRealty AI. Ik zag dat je naar de woning aan de Grachtengracht keek. Ben je nog steeds geïnteresseerd?', time: '10:42' },
            { sender: 'lead', message: 'Ja, precies. Ik wil eigenlijk binnen twee maanden verhuizen, dus ik probeer zo snel mogelijk bezichtigingen te plannen.', time: '10:43' },
            { sender: 'ai', message: 'Dat is een mooi tijdpad. Meteen een bezichtiging inplannen?', time: '10:43' },
        ],
        'Sophie Bakker': [
            { sender: 'ai', message: 'Hi Sophie, heb je de brochure ontvangen?', time: '09:00' },
            { sender: 'lead', message: 'Ja klopt. Wil morgen de tuin bekijken...', time: '09:12' },
        ],
        'Mark van den Berg': [
            { sender: 'ai', message: 'Heb je nog vragen over de woning in Utrecht?', time: '13:00' },
            { sender: 'lead', message: 'Ja, is er een garage bij inbegrepen?', time: '13:10' },
        ],
    }

    for (const lead of insertedLeads) {
        const messages = chatData[lead.name]
        if (messages) {
            const chatRows = messages.map(m => ({
                lead_id: lead.id,
                sender: m.sender,
                message: m.message,
                time: m.time,
            }))

            const { error: chatError } = await supabase
                .from('lead_chat_messages')
                .insert(chatRows)

            if (chatError) {
                console.error(`❌ Error inserting chat for ${lead.name}:`, chatError.message)
            } else {
                console.log(`   💬 ${messages.length} messages for ${lead.name}`)
            }
        }
    }

    console.log('\n✅ Seed data complete!\n')
    return true
}

async function main() {
    const migrationOk = await runMigration()
    if (!migrationOk) {
        console.log('\n⏭️  Skipping seed — please run the migration manually first, then re-run this script.\n')
    }
    await seedLeads()
}

main().catch(console.error)
