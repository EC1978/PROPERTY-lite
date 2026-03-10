
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = "https://pvseyvtbchrspqadgxck.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2c2V5dnRiY2hyc3BxYWRneGNrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk4OTUyNCwiZXhwIjoyMDg2NTY1NTI0fQ.Sqwodj609_LPDz7TyE_W0XAp4xoiYYRMBHFP_CWvK3Q"

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkLogs() {
    const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .or('action.eq.MOLLIE_WEBHOOK_RECEIVED,action.eq.MOLLIE_WEBHOOK_ERROR')
        .order('created_at', { ascending: false })
        .limit(10)

    if (error) {
        console.error('Error fetching logs:', error)
        return
    }

    console.log('Recent Webhook Logs:')
    data.forEach(log => {
        console.log(`Action: ${log.action} | Details: ${JSON.stringify(log.details)} | Time: ${log.created_at}`)
    })
}

checkLogs()
