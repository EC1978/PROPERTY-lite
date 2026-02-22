import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const materialId = params.id
    const supabase = await createClient()

    // 1. Zoek het materiaal op en kijk welke woning gekoppeld is
    const { data: material, error } = await supabase
        .from('agent_materials')
        .select('active_property_id')
        .eq('id', materialId)
        .single()

    if (error || !material) {
        console.error('QR Redirection Error: Material not found', materialId)
        return redirect('/') // Stuur naar home als materiaal niet bestaat
    }

    // 2. Als er geen woning gekoppeld is, stuur naar een info pagina of home
    if (!material.active_property_id) {
        return redirect('/')
    }

    // 3. Stuur door naar de unieke Voice AI pagina van de woning
    return redirect(`/woning/${material.active_property_id}`)
}
