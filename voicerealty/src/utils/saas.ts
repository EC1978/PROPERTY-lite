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

        if (error) {
            console.error('Error fetching plan:', error)
            return 'Essential'
        }

        return subscription?.plan || 'Essential'
    } catch (e) {
        console.error('Unexpected error fetching plan:', e)
        return 'Essential'
    }
}

export async function checkPropertyLimit(supabase: SupabaseClient, userId: string) {
    const plan = await getUserPlan(supabase, userId)
    const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS] || 3

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
