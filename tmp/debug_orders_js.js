
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://pvseyvtbchrspqadgxck.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2c2V5dnRiY2hyc3BxYWRneGNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk4OTUyNCwiZXhwIjoyMDg2NTY1NTI0fQ.Sqwodj609_LPDz7TyE_W0XAp4xoiYYRMBHFP_CWvK3Q"

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
