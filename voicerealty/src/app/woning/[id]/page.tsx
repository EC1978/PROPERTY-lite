import { createClient } from '@/utils/supabase/server'
import PublicPropertyLiveView from '@/components/PublicPropertyLiveView'

export default async function VoiceInterfacePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: propertyId } = await params

    const supabase = await createClient()

    const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', propertyId)
        .single()

    const { data: { user } } = await supabase.auth.getUser()
    const isAdmin = user && user.id === property.user_id

    return <PublicPropertyLiveView property={property} isAdmin={!!isAdmin} />
}
