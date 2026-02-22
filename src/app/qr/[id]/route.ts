import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { NextRequest, userAgent } from 'next/server'
import { createHash } from 'crypto'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const materialId = params.id
    const supabase = await createClient()

    // 1. Zoek het materiaal op en kijk welke woning gekoppeld is
    const { data: material, error } = await supabase
        .from('agent_materials')
        .select('active_property_id, user_id')
        .eq('id', materialId)
        .single()

    console.log('QR Lookup:', { materialId, material, error })

    if (error || !material) {
        console.error('QR Redirection Error: Material not found', materialId, error)
        return redirect('/') // Stuur naar home als materiaal niet bestaat
    }

    // 2. Als er geen woning gekoppeld is, stuur naar een info pagina of home
    if (!material.active_property_id) {
        console.log('QR Lookup: No active property linked', materialId)
        return redirect('/')
    }

    // 3. Log de scan voor analytics (historisch gekoppeld aan deze property)
    // We leggen nu ook browser/device info vast voor betere analytics
    try {
        const { browser, device, os } = userAgent(request)

        // Simpele IP hash voor unieke scans (zonder volledige IP op te slaan ivm privacy)
        const forwarded = request.headers.get('x-forwarded-for')
        const ip = forwarded ? forwarded.split(',')[0] : 'unknown'
        const salt = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'qr-salt-2024'
        const ipHash = createHash('sha256').update(ip + salt).digest('hex').substring(0, 12)


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

    // 4. Stuur door naar de unieke Voice AI pagina van de woning
    return redirect(`/woning/${material.active_property_id}`)
}

