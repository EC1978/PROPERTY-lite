
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars')
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkOrders() {
    const { data, error } = await supabase
        .from('shop_orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

    if (error) {
        console.error('Error fetching orders:', error)
        return
    }

    console.log('Recent Orders:')
    data.forEach(order => {
        console.log(`ID: ${order.id} | Status: ${order.status} | Total: ${order.total_amount} | Created: ${order.created_at}`)
    })
}

checkOrders()
