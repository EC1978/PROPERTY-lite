import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import DashboardLiveView from '@/components/DashboardLiveView'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Mock Data for now as Supabase MCP is flaky
    // In production: Count from 'properties', 'leads', 'analytics'
    const { count: activeCount } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active')

    // Fetch properties
    const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(3) // Only show recent 3

    return (
        <DashboardLiveView
            userEmail={user.email || ''}
            userId={user.id}
            initialProperties={properties || []}
            initialActiveCount={activeCount || 0}
        />
    )
}
