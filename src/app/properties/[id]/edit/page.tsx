import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { deleteProperty } from '../../actions'
import PropertyEditForm from '@/components/PropertyEditForm'
import { revalidatePath } from 'next/cache'
import { getVoiceLibrary } from '@/lib/voice-library'

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!property) {
        redirect('/dashboard')
    }

    // Fetch Colleagues / Active Voices
    const { data: voices } = await supabase
        .from('users')
        .select('id, email, cloned_voice_id, full_name') // Added full_name if available
        .not('cloned_voice_id', 'is', null)
        .neq('id', user.id) // Exclude self from "colleagues" list to list separately

    // Fetch My Library
    const myVoices = await getVoiceLibrary(supabase, user.id)

    async function updateProperty(formData: FormData) {
        'use server'
        const supabase = await createClient()

        const address = formData.get('address') as string
        const price = formData.get('price') as string
        const surface_area = formData.get('surface_area') as string
        const description = formData.get('description') as string
        const image_url = formData.get('image_url') as string
        const video_url = formData.get('video_url') as string
        const floorplan_url = formData.get('floorplan_url') as string
        const tour_360_url = formData.get('tour_360_url') as string
        const voice_id = formData.get('voice_id') as string

        const imagesRaw = formData.get('all_images') as string
        const images = imagesRaw ? JSON.parse(imagesRaw) : []

        const customLinksRaw = formData.get('custom_links') as string
        const custom_links = customLinksRaw ? JSON.parse(customLinksRaw) : []

        const customFeaturesRaw = formData.get('custom_features') as string
        const customFeatures = customFeaturesRaw ? JSON.parse(customFeaturesRaw) : []

        // Extract features
        const features: any = {
            constructionYear: formData.get('feature_constructionYear'),
            type: formData.get('feature_type'),
            layout: formData.get('feature_layout'),
            energy: formData.get('feature_energy'),
            maintenance: formData.get('feature_maintenance'),
            surroundings: formData.get('feature_surroundings'),
        }

        // Merge custom features
        customFeatures.forEach((feat: { label: string, value: string }) => {
            if (feat.label) {
                features[feat.label] = feat.value
            }
        })

        await supabase.from('properties').update({
            address,
            price: parseFloat(price),
            surface_area: parseInt(surface_area),
            description,
            image_url,
            video_url,
            floorplan_url,
            tour_360_url,
            features,
            images,
            custom_links,
            voice_id // Save the selected voice ID
        }).eq('id', id)

        revalidatePath(`/properties/${id}`)
        revalidatePath(`/woning/${id}`)
        redirect(`/properties/${id}/ready`)
    }

    async function deletePropertyAction() {
        'use server'
        await deleteProperty(id)
    }

    return (
        // ... wrapper
        <PropertyEditForm
            property={property}
            voices={voices || []}
            myVoices={myVoices || []} // Pass library
            updateAction={updateProperty}
            deleteAction={deletePropertyAction}
        />
        // ...
    )
}
