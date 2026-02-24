import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    const supabase = await createClient()

    try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get first property for the user
        const { data: properties, error: propError } = await supabase
            .from('properties')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)

        if (propError || !properties || properties.length === 0) {
            return NextResponse.json({ error: 'Geen woningen gevonden om reviews aan te koppelen.' }, { status: 404 })
        }

        const property = properties[0]

        // Check if reviews already exist
        const { data: existingReviews } = await supabase
            .from('reviews')
            .select('id')
            .eq('property_id', property.id)

        if (existingReviews && existingReviews.length > 0) {
            return NextResponse.json({ message: 'Er zijn al reviews voor deze woning.' })
        }

        // Insert mock reviews
        const mockReviews = [
            {
                property_id: property.id,
                reviewer_name: 'Familie de Boer',
                rating: 5,
                feedback_text: 'Geweldige ervaring! De AI stem klonk heel natuurlijk en we kregen direct antwoord op al onze vragen over de isolatie.',
            },
            {
                property_id: property.id,
                reviewer_name: 'Anoniem',
                rating: 4,
                feedback_text: 'Erg handig dat we de bezichtiging konden doen wanneer het ons uitkwam. De informatie was duidelijk.',
            },
            {
                property_id: property.id,
                reviewer_name: 'Sanne K.',
                rating: 5,
                feedback_text: 'Wat een innovatieve manier om een huis te bekijken! Het voelde alsof de makelaar er echt bij was.',
            }
        ]

        const { error } = await supabase
            .from('reviews')
            .insert(mockReviews)

        if (error) {
            console.error('Error inserting reviews:', error)
            return NextResponse.json({ error: 'Kon reviews niet toevoegen.' }, { status: 500 })
        }

        return NextResponse.json({ message: 'Succesvol 3 test reviews toegevoegd!' })

    } catch (error: any) {
        console.error('Seed error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
