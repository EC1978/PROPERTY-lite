import { createClient } from '@/utils/supabase/server'
import PublicPropertyLiveView from '@/components/PublicPropertyLiveView'

export default async function VoiceInterfacePage({ params }: { params: Promise<{ id: string }> }) {
    const { id: propertyId } = await params

    const supabase = await createClient()

    let property = null;

    if (propertyId === '123') {
        property = {
            id: '123',
            user_id: 'demo-user',
            address: 'Keizersgracht 123',
            city: 'Amsterdam',
            price: 1250000,
            surface_area: 145,
            bedrooms: 3,
            bathrooms: 2,
            label: 'A+',
            image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2075&q=80',
            images: [
                'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2053&q=80',
                'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=2070&q=80'
            ],
            description: 'Prachtig afgewerkt grachtenpand in het hart van Amsterdam. Voorzien van alle moderne luxe en een riante binnentuin.',
            features: {
                constructionYear: '1890 (Gerenoveerd 2024)',
                type: 'Grachtenpand',
                energy: 'A+'
            }
        };
    } else {
        const { data } = await supabase
            .from('properties')
            .select('*')
            .eq('id', propertyId)
            .single()
        property = data;
    }

    if (!property) {
        return <div className="p-8 text-center text-white">Woning niet gevonden. Controleer de URL of probeer het later opnieuw.</div>
    }

    const { data: { user } } = await supabase.auth.getUser()
    const isAdmin = user && user.id === property.user_id

    return <PublicPropertyLiveView property={property} isAdmin={!!isAdmin} />
}
