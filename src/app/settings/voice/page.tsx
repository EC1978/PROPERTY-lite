import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getUserPlan, canCloneVoice } from '@/utils/saas'
import VoiceCloningSection from '@/components/VoiceCloningSection'

export default async function VoiceSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const plan = await getUserPlan(supabase, user.id)
    const canClone = canCloneVoice(plan)

    // Fetch user profile for clone ID
    const { data: userProfile } = await supabase
        .from('users')
        .select('cloned_voice_id')
        .eq('id', user.id)
        .maybeSingle()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Voice AI Configuratie</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Beheer je persoonlijke AI stem en voice cloning instellingen.</p>
            </div>

            {/* Voice Cloning Component */}
            <VoiceCloningSection canClone={canClone} currentVoiceId={userProfile && userProfile.cloned_voice_id ? userProfile.cloned_voice_id : null} />
        </div>
    )
}
