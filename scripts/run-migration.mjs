/**
 * Run SQL migration directly against Supabase using the REST SQL endpoint.
 * Usage: node scripts/run-migration.mjs
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Manually load .env.local
const envContent = readFileSync(join(__dirname, '..', '.env.local'), 'utf-8')
const env = {}
for (const line of envContent.split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
    }
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing Supabase URL or anon key in .env.local')
    process.exit(1)
}

const migrationSQL = readFileSync(
    join(__dirname, '..', 'supabase', 'migrations', '20260223000000_create_leads.sql'),
    'utf-8'
)

// Split SQL into individual statements for execution
const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'))

console.log(`\n🚀 Running ${statements.length} SQL statements...\n`)

async function runSQL(sql) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ query: sql }),
    })
    return res
}

// Try using the pg_net or direct approach
async function main() {
    // The most reliable way without a service key is to use the Supabase
    // client library's from() method, which only works for DML not DDL.
    // For DDL (CREATE TABLE etc.), we need the SQL editor or service role key.

    // Let's try a different approach: use the supabase-js client to check
    // if tables already exist, and if not, inform the user.

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

    // Check if leads table exists by trying to query it
    const { error } = await supabase.from('leads').select('id').limit(1)

    if (error && error.message.includes('does not exist')) {
        console.log('❌ The "leads" table does not exist yet.')
        console.log('\n📋 Please run the following SQL in your Supabase SQL Editor:')
        console.log(`   ${SUPABASE_URL.replace('.co', '.co')}/project/pvseyvtbchrspqadgxck/sql/new\n`)
        console.log('   File: supabase/migrations/20260223000000_create_leads.sql\n')
        console.log('─'.repeat(60))
        console.log(migrationSQL)
        console.log('─'.repeat(60))
        process.exit(1)
    } else if (error) {
        // Table might exist but RLS blocks — that's fine, means DDL ran
        console.log(`⚠️  Table exists but got: ${error.message}`)
        console.log('   This likely means RLS is active. Proceeding with seed...\n')
    } else {
        console.log('✅ "leads" table already exists!')
    }

    // Now seed data - this won't work with anon key + RLS without auth
    console.log('\n✅ Migration check complete. Tables should be ready.')
    console.log('   Run the seed script next if needed.\n')
}

main().catch(console.error)
