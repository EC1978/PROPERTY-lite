import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { deleteProperty } from '../../actions'
import PropertyEditForm from '@/components/PropertyEditForm'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
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
        console.log('[updateProperty] all_images raw:', imagesRaw)
        console.log('[updateProperty] images parsed:', images)

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

        // Main update - all stable columns
        const { error: updateError } = await supabase.from('properties').update({
            address,
            price: parseFloat(price),
            surface_area: parseInt(surface_area),
            description,
            image_url: image_url || null,
            video_url,
            floorplan_url,
            tour_360_url,
            features,
            images: images && images.length > 0 ? images : [],
            custom_links,
        }).eq('id', id)

        if (updateError) {
            console.error('[updateProperty] Main update failed:', updateError)
            throw new Error(`Failed to update property: ${updateError.message}`)
        }

        // Try to update voice_id separately (column may not exist yet)
        if (voice_id !== undefined) {
            await supabase.from('properties').update({ voice_id }).eq('id', id)
        }

        revalidatePath(`/woning/${id}`)
        revalidatePath('/properties', 'layout')
        revalidatePath('/dashboard', 'page')
        redirect(`/properties/${id}/ready`)
    }

    async function deletePropertyAction() {
        'use server'
        await deleteProperty(id)
    }

    return (
        <div className="flex min-h-screen bg-[#f5f8f7] dark:bg-[#050505] text-gray-900 dark:text-white font-sans">
            <Sidebar userEmail={user.email} />

            {/* Mobile header */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-4 py-4 flex items-center justify-between">
                <Link href={`/properties/${id}`} className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Woning
                </Link>
                <span className="text-sm font-bold text-gray-900 dark:text-white">Bewerken</span>
            </div>

            <main className="flex-1 md:ml-72 pt-20 md:pt-0">

                {/* ── TOP HEADER BAR (same as detail page) ── */}
                <div className="flex items-center justify-between px-6 md:px-8 py-4 border-b border-gray-100 dark:border-white/5 bg-white dark:bg-[#0a0a0a]">
                    <Link
                        href={`/properties/${id}`}
                        className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        <span className="hidden sm:inline">Terug naar Woning</span>
                    </Link>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 py-1.5 bg-gray-100 dark:bg-white/5 rounded-full">
                            Bewerkmodus
                        </span>
                    </div>
                </div>

                {/* ── ADDRESS STRIP (same as detail page) ── */}
                <div className="px-6 md:px-8 py-5 border-b border-gray-100 dark:border-white/5">
                    <p className="text-[10px] uppercase text-gray-500 dark:text-gray-500 tracking-wider font-semibold mb-1">Woning Bewerken</p>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{property.address}</h1>
                </div>

                {/* ── FORM ── */}
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-8">
                    <PropertyEditForm
                        property={property}
                        voices={voices || []}
                        myVoices={myVoices || []}
                        updateAction={updateProperty}
                        deleteAction={deletePropertyAction}
                    />
                </div>
            </main>

            <MobileNav />
        </div>
    )
}
