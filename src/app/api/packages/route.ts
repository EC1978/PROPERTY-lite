import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

// Public endpoint - no auth required, packages are publicly readable
export const revalidate = 0

export async function GET() {
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => [], setAll: () => { } } }
    )

    const { data, error } = await supabase
        .from('packages')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')

    if (error) {
        console.error('Packages API error:', error)
        return NextResponse.json({ error: 'Failed to load packages' }, { status: 500 })
    }

    return NextResponse.json(data ?? [])
}
