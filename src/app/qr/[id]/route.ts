import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse, userAgent } from 'next/server'
import { createHash } from 'crypto'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(
    request: NextRequest,
    { params }: { params: any }
) {
    let materialId = 'unknown'
    try {
        // Next.js 15 robust params extraction
        const resolvedParams = await params
        materialId = resolvedParams?.id || 'id_not_found'

        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        console.log(`[VERIFIED-V3] QR Handler started for ID: ${materialId}`)

        // 1. Zoek het materiaal op
        const { data: material, error } = await supabase
            .from('agent_materials')
            .select('active_property_id, user_id')
            .eq('id', materialId)
            .single()

        if (error || !material) {
            console.error('QR Lookup Failed in DB:', { materialId, error })
            // Redirect naar unlinked ipv home om te zien of het werkt
            return NextResponse.redirect(new URL('/qr/unlinked?reason=not_found&id=' + materialId, request.url))
        }

        console.log('QR Material active property:', material.active_property_id)

        // 2. Log de scan voor analytics (vuur en vergeet)
        try {
            const { browser, device, os } = userAgent(request)
            const forwarded = request.headers.get('x-forwarded-for')
            const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
            const ipHash = createHash('sha256').update(ip + supabaseAnonKey).digest('hex').substring(0, 12)

            await supabase
                .from('scans')
                .insert({
                    material_id: materialId,
                    property_id: material.active_property_id,
                    user_id: material.user_id,
                    browser: browser?.name || 'Unknown',
                    device: device?.type || 'Desktop',
                    os: os?.name || 'Unknown',
                    ip_hash: ipHash
                })
        } catch (err) {
            console.error('Error logging scan:', err)
        }

        // 3. Als er geen woning gekoppeld is
        if (!material.active_property_id) {
            return NextResponse.redirect(new URL('/qr/unlinked?id=' + materialId, request.url))
        }

        // 4. Stuur door naar de woningpagina
        return NextResponse.redirect(new URL(`/woning/${material.active_property_id}`, request.url))

    } catch (criticalError: any) {
        console.error('CRITICAL ERROR in QR Route:', criticalError)
        return new NextResponse(JSON.stringify({
            error: 'Critical failure in QR route',
            message: criticalError.message,
            id: materialId
        }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    }
}


