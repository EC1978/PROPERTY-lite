import { SupabaseClient } from '@supabase/supabase-js'

export const PLAN_LIMITS = {
    'Essential': 3,
    'Professional': 15,
    'Elite': Infinity,
    'Enterprise': Infinity
}

export async function getUserPlan(supabase: SupabaseClient, userId: string) {
    try {
        const { data: subscription, error } = await supabase
            .from('subscriptions')
            .select('plan')
            .eq('user_id', userId)
            .maybeSingle()

        if (error || !subscription?.plan) {
            return 'Essential'
        }

        // Check if plan is a hardcoded key
        if (PLAN_LIMITS.hasOwnProperty(subscription.plan)) {
            return subscription.plan
        }

        // If it's a UUID, try to fetch the package name
        const { data: pkg } = await supabase
            .from('packages')
            .select('name')
            .eq('id', subscription.plan)
            .maybeSingle()

        return pkg?.name || 'Essential'
    } catch (e) {
        console.error('Unexpected error fetching plan:', e)
        return 'Essential'
    }
}

export async function checkPropertyLimit(supabase: SupabaseClient, userId: string) {
    // 1. Get plan first as it might be needed for limit fallback
    const plan = await getUserPlan(supabase, userId)

    // 2. Check tenant_features for an explicit property_limit (Source of Truth set by Admin)
    const { data: features } = await supabase
        .from('tenant_features')
        .select('property_limit')
        .eq('user_id', userId)
        .maybeSingle()

    // 3. Determine limit: Feature limit -> Plan limit -> Default 3
    const limit = features?.property_limit ?? (PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || 3)

    const { count } = await supabase
        .from('properties')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'active')

    const currentCount = count || 0

    return {
        allowed: currentCount < limit,
        limit,
        count: currentCount,
        plan
    }
}

export function canCloneVoice(plan: string) {
    return plan === 'Elite' || plan === 'Enterprise';
}
