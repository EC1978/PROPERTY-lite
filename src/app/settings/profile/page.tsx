import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Toaster } from 'react-hot-toast'
import ProfileHeader from './ProfileHeader'
import OfficeDetails from './OfficeDetails'
import SecuritySettings from './SecuritySettings'
import PreferencesSettings from './PreferencesSettings'
import LogoutButton from './LogoutButton'

export default async function ProfileSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto pb-24">
            <Toaster position="bottom-center" toastOptions={{
                style: { background: '#161616', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }
            }} />

            <header className="flex flex-col gap-1 mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-white">Profiel & Accountinstellingen</h1>
                <p className="text-sm text-gray-400">Beheer je persoonlijke gegevens, kantoor en voorkeuren.</p>
            </header>

            <div className="space-y-6">
                <ProfileHeader user={user} />
                <OfficeDetails />
                <SecuritySettings />
                <PreferencesSettings />
            </div>

            <div className="pt-8 mt-8 border-t border-white/5 flex flex-col items-center">
                <LogoutButton />
                <p className="mt-8 text-[11px] text-gray-600 font-bold uppercase tracking-[0.2em]">VoiceRealty AI v2.4.0</p>
            </div>
        </div>
    )
}
