import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import LandingSettingsForm from '@/components/settings/LandingSettingsForm'

export default async function LandingSettingsPage({
    searchParams
}: {
    searchParams: Promise<{ success?: string, error?: string }>
}) {
    const params = await searchParams
    const success = params.success === 'true'
    const errorParam = params.error
    const supabase = await createClient()

    // Fetch current hero image setting
    const { data: setting, error: fetchError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'hero_image')
        .maybeSingle()

    // Handle JSONB data types robustly
    let currentImage = null
    if (setting?.value) {
        if (typeof setting.value === 'string') {
            currentImage = setting.value
        } else if (typeof setting.value === 'object') {
            currentImage = (setting.value as any).url || (setting.value as any).image_url || null
        }
    }

    async function updateHeroImage(formData: FormData) {
        'use server'
        const imageUrl = formData.get('image_url') as string
        const supabase = await createClient()

        console.log('--- Landingspagina Update ---')
        console.log('Target URL:', imageUrl)

        // Attempt upsert
        const { error } = await supabase.from('app_settings').upsert({
            key: 'hero_image',
            value: imageUrl
        }, { onConflict: 'key' })

        if (error) {
            console.error('FAILED to update app_settings:', error)
            redirect(`/settings/landing?error=${encodeURIComponent(error.message)}`)
        }

        revalidatePath('/')
        revalidatePath('/settings/landing')
        redirect('/settings/landing?success=true')
    }

    return (
        <div className="space-y-6">
            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 px-4 py-3 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                    <span className="material-symbols-outlined">check_circle</span>
                    <span className="text-sm font-semibold">Instellingen succesvol bijgewerkt!</span>
                </div>
            )}
            {errorParam && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex flex-col gap-1 animate-in shake duration-300">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined">error</span>
                        <span className="text-sm font-bold">Fout bij opslaan</span>
                    </div>
                    <p className="text-xs opacity-80 ml-9">{errorParam}</p>
                </div>
            )}
            <div>
                <h1 className="text-2xl font-bold mb-1">Landingspagina Instellingen</h1>
                <p className="text-gray-500 text-sm">Beheer de visuele uitstraling van je publieke landingspagina.</p>
            </div>

            <div className="border-t border-gray-100 dark:border-white/5 pt-6">
                <LandingSettingsForm
                    currentImage={currentImage}
                    updateAction={updateHeroImage}
                />
            </div>
        </div>
    )
}
