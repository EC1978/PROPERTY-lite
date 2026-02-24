import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()

        // Haal alle properties op
        const { data: properties, error: propError } = await supabase
            .from('properties')
            .select('id, address, user_id')

        // Haal alle reviews op (die deze user mag zien via RLS)
        const { data: reviews, error: revError } = await supabase
            .from('reviews')
            .select('*')

        return NextResponse.json({
            user: user?.id || 'Geen ingelogde gebruiker',
            properties: properties || [],
            propError,
            reviews: reviews || [],
            revError
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
