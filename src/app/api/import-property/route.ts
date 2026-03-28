import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper: extract number from string, returns null if 0 or not found
function safeInt(val: any): number | null {
    if (val === null || val === undefined) return null
    const n = parseInt(String(val).replace(/[^0-9]/g, ''))
    return isNaN(n) || n === 0 ? null : n
}

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
            features = {},
            video_url,
            floorplan_url,
            tour_360_url,
            source_url,
            propertyType,
        } = body

        // Extract bedrooms/bathrooms from body (may be sent as top-level or 0)
        let bedrooms = safeInt(body.bedrooms)
        let bathrooms = safeInt(body.bathrooms)

        // Fallback: parse from features.layout if bedrooms/bathrooms are missing
        // e.g. layout = "4 kamers (3 slaapkamers)"
        if (!bedrooms && features.layout) {
            const slpkMatch = features.layout.match(/\((\d+)\s*slaapkamer/i) ||
                features.layout.match(/(\d+)\s*slaapkamer/i)
            if (slpkMatch) bedrooms = parseInt(slpkMatch[1]) || null
        }
        if (!bathrooms && features.layout) {
            const badkMatch = features.layout.match(/(\d+)\s*badkamer/i)
            if (badkMatch) bathrooms = parseInt(badkMatch[1]) || null
        }

        // Clean up features object
        const cleanFeatures: Record<string, any> = {}
        if (features.constructionYear) cleanFeatures.constructionYear = features.constructionYear
        // Prefer propertyType from body, or features.type
        const typeVal = propertyType || features.type || ''
        if (typeVal) cleanFeatures.type = typeVal
        if (features.layout) cleanFeatures.layout = features.layout
        if (features.energy || features.energy_label) {
            cleanFeatures.energy = features.energy || `Energielabel ${features.energy_label}`
            cleanFeatures.energy_label = features.energy_label || ''
        }
        if (features.maintenance) cleanFeatures.maintenance = features.maintenance
        if (features.surroundings) cleanFeatures.surroundings = features.surroundings

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
                price: price ? Number(String(price).replace(/[^0-9]/g, '')) : null,
                surface_area: safeInt(surface_area),
                bedrooms: bedrooms,
                bathrooms: bathrooms,
                description: description || '',
                image_url: image_url || null,
                images: images || [],
                features: cleanFeatures,
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

        // 5. Redirect to the beautiful detail view (not the edit form)
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://property-lite-mocha.vercel.app'
        return NextResponse.json({
            success: true,
            propertyId: property.id,
            editUrl: `${baseUrl}/properties/${property.id}`,
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
