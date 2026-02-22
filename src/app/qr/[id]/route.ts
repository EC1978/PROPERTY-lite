import { createClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { NextRequest, userAgent } from 'next/server'
import { createHash } from 'crypto'

// We maken een directe client aan voor de QR lookup om session/cookie issues te vermijden
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const materialId = params.id
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    // 1. Zoek het materiaal op
    const { data: material, error } = await supabase
        .from('agent_materials')
        .select('active_property_id, user_id')
        .eq('id', materialId)
        .single()

    if (error || !material) {
        console.error('QR Lookup Failed:', { materialId, error })
        // Als we het niet vinden, redirect naar de home van de app
        return redirect('/')
    }

    // 2. Log de scan voor analytics (vuur en vergeet)
    try {
        const { browser, device, os } = userAgent(request)
        const forwarded = request.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
        const ipHash = createHash('sha256').update(ip + supabaseAnonKey).digest('hex').substring(0, 12)

        // Gebruik de admin client of anon client om de scan in te voegen
        await supabase
            .from('scans')
            .insert({
                material_id: materialId,
                property_id: material.active_property_id, // Kan null zijn als niet gekoppeld
                user_id: material.user_id,
                browser: browser?.name || 'Unknown',
                device: device?.type || 'Desktop',
                os: os?.name || 'Unknown',
                ip_hash: ipHash
            })
    } catch (err) {
        console.error('Error logging scan:', err)
    }

    // 3. Als er geen woning gekoppeld is, stuur naar de home of een specifieke "niet gekoppeld" pagina
    if (!material.active_property_id) {
        console.log('QR Material found but no property linked:', materialId)
        return redirect('/dashboard/materialen') // Of een andere pagina
    }

    // 4. Stuur door naar de unieke Voice AI pagina van de woning
    return redirect(`/woning/${material.active_property_id}`)
}


