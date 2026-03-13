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

    // Fetch tenant features
    const { data: features } = await supabase
        .from('tenant_features')
        .select('has_agenda, has_leads, has_webshop')
        .eq('user_id', user.id)
        .single()

    // Fetch profile for trial expiration
    const { data: profile } = await supabase
        .from('profiles')
        .select('trial_expires_at')
        .eq('id', user.id)
        .single()

    return (
        <DashboardLiveView
            userEmail={user.email || ''}
            userId={user.id}
            initialProperties={properties || []}
            initialActiveCount={activeCount || 0}
            initialFeatures={features || { has_agenda: false, has_leads: false, has_webshop: false }}
            trialExpiresAt={profile?.trial_expires_at || null}
        />
    )
}
