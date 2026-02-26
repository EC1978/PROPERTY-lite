'use server'

import { createClient } from '@/utils/supabase/server'

export interface AnalyticsStats {
    totalAppointments: number
    upcomingAppointments: number
    completedAppointments: number
    totalProperties: number
    activeProperties: number
    teamMemberCount: number
    reviewCount: number
    // Month-by-month appointment counts (last 7 months)
    monthlyAppointments: { month: string; count: number }[]
    // Month-by-month properties added
    monthlyProperties: { month: string; count: number }[]
    // Top properties by views
    topProperties: {
        id: string
        address: string
        city: string
        price: number | null
        status: string
        views: number
    }[]
}

/**
 * Fetches all analytics metrics for the currently logged-in broker.
 */
export async function getAnalyticsStats(): Promise<{
    data: AnalyticsStats | null
    error: string | null
}> {
    try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return { data: null, error: 'Niet geautoriseerd.' }
        }

        // ── Afspraken (appointments) ──────────────────────────────────────────────
        const { data: appointments, error: apptErr } = await supabase
            .from('appointments')
            .select('id, status, appointment_date, created_at')
            .eq('user_id', user.id)

        if (apptErr) {
            console.error('Error fetching appointments:', apptErr)
        }

        const appts = appointments ?? []
        const now = new Date()

        const totalAppointments = appts.length
        const upcomingAppointments = appts.filter(
            (a) => a.status === 'gepland' && new Date(a.appointment_date) >= now
        ).length
        const completedAppointments = appts.filter(
            (a) => a.status === 'voltooid'
        ).length

        // Monthly appointments for last 7 months
        const monthlyAppointments = getLast7MonthsCounts(
            appts,
            (a) => a.appointment_date
        )

        // ── Woningen (properties) ─────────────────────────────────────────────────
        const { data: properties, error: propsErr } = await supabase
            .from('properties')
            .select('id, address, city, price, status, created_at')
            .eq('user_id', user.id)

        if (propsErr) {
            console.error('Error fetching properties:', propsErr)
        }

        const props = properties ?? []
        const totalProperties = props.length
        const activeProperties = props.filter(
            (p) => p.status?.toLowerCase() === 'actief' || p.status?.toLowerCase() === 'active'
        ).length

        // Monthly properties for last 7 months
        const monthlyProperties = getLast7MonthsCounts(props, (p) => p.created_at)

        // Top properties (we sort by price desc as proxy for "best performing")
        const topProperties = [...props]
            .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
            .slice(0, 5)
            .map((p) => ({
                id: p.id,
                address: p.address ?? 'Onbekend',
                city: p.city ?? '',
                price: p.price ?? null,
                status: p.status ?? 'Onbekend',
                views: 0, // no views table yet
            }))

        // ── Team ──────────────────────────────────────────────────────────────────
        const { data: teamData, error: teamErr } = await supabase
            .from('team_members')
            .select('id')
            .eq('broker_id', user.id)

        if (teamErr) {
            console.error('Error fetching team members:', teamErr)
        }

        const teamMemberCount = (teamData ?? []).length

        // ── Reviews ───────────────────────────────────────────────────────────────
        // Reviews zijn gekoppeld via property_id, niet via user_id.
        const propertyIds = props.map((p) => p.id)
        let reviewCount = 0

        if (propertyIds.length > 0) {
            const { count, error: reviewErr } = await supabase
                .from('reviews')
                .select('id', { count: 'exact', head: true })
                .in('property_id', propertyIds)
                .eq('is_deleted', false)

            if (reviewErr) {
                console.error('Error fetching review count:', reviewErr)
            } else {
                reviewCount = count ?? 0
            }
        }

        return {
            data: {
                totalAppointments,
                upcomingAppointments,
                completedAppointments,
                totalProperties,
                activeProperties,
                teamMemberCount,
                reviewCount,
                monthlyAppointments,
                monthlyProperties,
                topProperties,
            },
            error: null,
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Onverwachte fout.'
        console.error('getAnalyticsStats error:', err)
        return { data: null, error: msg }
    }
}

// ─── Helper ─────────────────────────────────────────────────────────────────

const NL_MONTHS = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec']

function getLast7MonthsCounts<T>(
    items: T[],
    dateGetter: (item: T) => string
): { month: string; count: number }[] {
    const result: { month: string; count: number }[] = []
    const now = new Date()

    for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const year = d.getFullYear()
        const month = d.getMonth()

        const count = items.filter((item) => {
            const date = new Date(dateGetter(item))
            return date.getFullYear() === year && date.getMonth() === month
        }).length

        result.push({ month: NL_MONTHS[month], count })
    }

    return result
}
