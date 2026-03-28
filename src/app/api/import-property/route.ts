import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
    try {
        // 1. Validate extension token from Authorization header
        const authHeader = req.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Geen geldig token opgegeven.' }, { status: 401 })
        }
        const token = authHeader.replace('Bearer ', '').trim()

        // 2. Look up profile by extension_token
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name')
            .eq('extension_token', token)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Ongeldig token. Controleer je instellingen.' }, { status: 401 })
        }

        const userId = profile.id

        // 3. Parse incoming property data
        const body = await req.json()
        const {
            address,
            city,
            price,
            surface_area,
            description,
            image_url,
            images,
            features,
            video_url,
            floorplan_url,
            tour_360_url,
            source_url,
        } = body

        if (!address) {
            return NextResponse.json({ error: 'Adres is verplicht.' }, { status: 400 })
        }

        // 4. Insert property linked to the user
        const { data: property, error: insertError } = await supabaseAdmin
            .from('properties')
            .insert({
                user_id: userId,
                address: address || 'Onbekend adres',
                city: city || '',
                price: price ? Number(price) : null,
                surface_area: surface_area ? Number(surface_area) : null,
                description: description || '',
                image_url: image_url || null,
                images: images || [],
                features: features || {},
                video_url: video_url || null,
                floorplan_url: floorplan_url || null,
                tour_360_url: tour_360_url || null,
                source_url: source_url || null,
                status: 'active',
            })
            .select('id')
            .single()

        if (insertError) {
            console.error('Import error:', insertError)
            return NextResponse.json({ error: `Database fout: ${insertError.message}` }, { status: 500 })
        }

        // 5. Return the new property ID so the extension can redirect
        return NextResponse.json({
            success: true,
            propertyId: property.id,
            editUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://property-lite-mocha.vercel.app'}/properties/${property.id}/edit`,
        })

    } catch (err: any) {
        console.error('Import route crash:', err)
        return NextResponse.json({ error: err.message || 'Onbekende fout.' }, { status: 500 })
    }
}

// CORS preflight for browser extension
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}
