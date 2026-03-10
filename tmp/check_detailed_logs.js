
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://pvseyvtbchrspqadgxck.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2c2V5dnRiY2hyc3BxYWRneGNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk4OTUyNCwiZXhwIjoyMDg2NTY1NTI0fQ.Sqwodj609_LPDz7TyE_W0XAp4xoiYYRMBHFP_CWvK3Q"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDetailedLogs() {
    const { data: logs, error: logsError } = await supabase
        .from('audit_logs')
        .select('*')
        .or('action.eq.MOLLIE_WEBHOOK_RECEIVED,action.eq.MOLLIE_WEBHOOK_ERROR')
        .order('created_at', { ascending: false })
        .limit(5)

    if (logsError) {
        console.error('Error fetching logs:', logsError)
        return
    }

    console.log('--- Recent Webhook Logs ---')
    logs.forEach(log => {
        console.log(`[${log.created_at}] ACTION: ${log.action}`)
        console.log(`DETAILS: ${JSON.stringify(log.details, null, 2)}`)
        console.log('---------------------------')
    })

    const { data: orders, error: ordersError } = await supabase
        .from('shop_orders')
        .select('id, status, payment_intent_id')
        .order('created_at', { ascending: false })
        .limit(5)

    if (ordersError) {
        console.error('Error fetching orders:', ordersError)
        return
    }

    console.log('\n--- Recent Orders & Intent IDs ---')
    orders.forEach(order => {
        console.log(`Order: ${order.id} | Status: ${order.status} | Intent: ${order.payment_intent_id}`)
    })
}

checkDetailedLogs()
