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

    // Fetch all landing page settings
    const { data: settings } = await supabase
        .from('app_settings')
        .select('key, value')
        .in('key', ['hero_image', 'landing_trusted_title', 'landing_trusted_logos'])

    const getSetting = (key: string) => settings?.find(s => s.key === key)?.value || null

    // Get hero image
    const heroImageRaw = getSetting('hero_image')
    let currentImage = null
    if (heroImageRaw) {
        if (typeof heroImageRaw === 'string') {
            currentImage = heroImageRaw
        } else if (typeof heroImageRaw === 'object') {
            currentImage = (heroImageRaw as any).url || (heroImageRaw as any).image_url || null
        }
    }

    // Get trusted by settings
    const trustedTitle = getSetting('landing_trusted_title') as string || 'VERTROUWD DOOR'
    const trustedLogosRaw = getSetting('landing_trusted_logos')
    let trustedLogos: string[] = ['REMAX', 'ERA', 'C21']
    if (trustedLogosRaw) {
        if (Array.isArray(trustedLogosRaw)) {
            trustedLogos = trustedLogosRaw
        } else if (typeof trustedLogosRaw === 'string') {
            trustedLogos = trustedLogosRaw.split(',').map(s => s.trim())
        }
    }

    async function updateLandingSettings(formData: FormData) {
        'use server'
        const imageUrl = formData.get('image_url') as string
        const trustedTitle = formData.get('trusted_title') as string
        const trustedLogosStr = formData.get('trusted_logos') as string
        const trustedLogos = trustedLogosStr.split(',').map(s => s.trim()).filter(Boolean)

        const supabase = await createClient()

        const settingsToUpdate = [
            { key: 'hero_image', value: imageUrl },
            { key: 'landing_trusted_title', value: trustedTitle },
            { key: 'landing_trusted_logos', value: trustedLogos }
        ]

        // Update each setting
        for (const item of settingsToUpdate) {
            const { error } = await supabase.from('app_settings').upsert(item, { onConflict: 'key' })
            if (error) {
                console.error(`FAILED to update ${item.key}:`, error)
                redirect(`/admin/landing?error=${encodeURIComponent(error.message)}`)
            }
        }

        revalidatePath('/')
        revalidatePath('/admin/landing')
        redirect('/admin/landing?success=true')
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
                <h1 className="text-2xl font-bold mb-1 text-white">Landingspagina Instellingen</h1>
                <p className="text-zinc-400 text-sm">Beheer de visuele uitstraling van de platform landingspagina.</p>
            </div>

            <div className="bg-[#111] rounded-3xl border border-white/5 p-8 shadow-sm mt-6">
                <LandingSettingsForm
                    currentImage={currentImage}
                    trustedTitle={trustedTitle}
                    trustedLogos={trustedLogos}
                    updateAction={updateLandingSettings}
                />
            </div>
        </div>
    )
}

