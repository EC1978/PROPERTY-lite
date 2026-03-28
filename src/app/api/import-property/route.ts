import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper: safe integer conversion (returns null if 0 and allowZero=false, or NaN)
function safeInt(val: any, allowZero = false): number | null {
    if (val === null || val === undefined || val === '') return null
    const n = parseInt(String(val).replace(/[^0-9-]/g, ''))
    if (isNaN(n)) return null
    if (!allowZero && n === 0) return null
    return n
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Geen geldig token opgegeven.' }, { status: 401 })
        }
        const token = authHeader.replace('Bearer ', '').trim()

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('extension_token', token)
            .single()

        if (profileError || !profile) {
            return NextResponse.json({ error: 'Ongeldig token.' }, { status: 401 })
        }

        const body = await req.json()
        const {
            address, city, price, surface_area, description, 
            image_url, images, features = {}, video_url, 
            floorplan_url, tour_360_url, source_url, propertyType
        } = body

        // Extract bedrooms/bathrooms with fallback to features.layout
        let bedrooms = safeInt(body.bedrooms)
        let bathrooms = safeInt(body.bathrooms)

        if (!bedrooms && features.layout) {
            const m = features.layout.match(/(\d+)\s*slaapkamer/i)
            if (m) bedrooms = parseInt(m[1])
        }
        if (!bathrooms && features.layout) {
            const m = features.layout.match(/(\d+)\s*badkamer/i)
            if (m) bathrooms = parseInt(m[1])
        }

        // Clean features
        const cleanFeatures: any = { ...features }
        if (propertyType) cleanFeatures.type = propertyType
        if (!cleanFeatures.type && features.type) cleanFeatures.type = features.type

        // Fail-safe city extraction if missing
        let finalCity = city || ''
        if (!finalCity && address && address.includes(',')) {
            finalCity = address.split(',')[1]?.trim()
        }

        const { data: property, error: insertError } = await supabaseAdmin
            .from('properties')
            .insert({
                user_id: profile.id,
                address: address || 'Geen adres',
                city: finalCity,
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

        if (insertError) throw insertError

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://property-lite-mocha.vercel.app'
        return NextResponse.json({
            success: true,
            propertyId: property.id,
            editUrl: `${baseUrl}/properties/${property.id}`, // Detail view as landing page
        })

    } catch (err: any) {
        console.error('Import error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

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
