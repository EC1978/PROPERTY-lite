
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { deleteProperty } from '../../actions'
import PropertyEditForm from '@/components/PropertyEditForm'
import ImageUpload from '@/components/ImageUpload'

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
            custom_links
        }).eq('id', id)

        redirect(`/properties/${id}/ready`)
    }

    // Helper to safely get feature values
    const getFeature = (key: string) => (property.features as any)?.[key] || ''

    async function deletePropertyAction() {
        'use server'
        await deleteProperty(id)
    }

    return (
        <div className="min-h-screen bg-[#050606] text-white flex flex-col font-sans antialiased overflow-x-hidden">
            {/* Background Orbs */}
            <div className="fixed top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-[#10b77f]/10 rounded-full blur-[120px] pointer-events-none z-0"></div>
            <div className="fixed bottom-[-5%] left-[-5%] w-[30vw] h-[30vw] bg-[#10b77f]/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

            <div className="relative z-10 max-w-4xl w-full mx-auto px-6 py-12">
                {/* Header Section */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-1 w-8 rounded-full bg-primary/40 shadow-[0_0_10px_rgba(16,183,127,0.3)]"></div>
                        <span className="text-[10px] font-bold tracking-[0.3em] text-gray-500 uppercase">Review</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight mb-2">Controleer Gegevens</h1>
                    <p className="text-gray-500 font-medium">De WEB AGENT heeft de volgende gegevens gevonden.</p>
                </div>

                <PropertyEditForm
                    property={property}
                    updateAction={updateProperty}
                    deleteAction={deletePropertyAction}
                />
            </div>
        </div>
    )
}
