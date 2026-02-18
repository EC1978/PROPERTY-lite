import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ProfileForm from '@/components/ProfileForm'

export default async function ProfileSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Profiel Instellingen</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Beheer je persoonlijke gegevens en account voorkeuren.</p>
            </div>

            <div className="bg-white dark:bg-slate-card rounded-2xl border border-gray-100 dark:border-white/5 p-8 shadow-sm">
                <ProfileForm userEmail={user.email} />
            </div>

            {/* Account Deletion */}
            <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-500/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h4 className="text-sm font-bold text-red-600 dark:text-red-400">Account Verwijderen</h4>
                    <p className="text-xs text-red-500/80 mt-1">Dit verwijdert permanent je account en alle data. Dit kan niet ongedaan worden gemaakt.</p>
                </div>
                <button className="text-red-600 dark:text-red-400 text-sm font-bold bg-white dark:bg-white/5 border border-red-200 dark:border-red-500/20 py-2 px-4 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    Verwijder Account
                </button>
            </div>
        </div>
    )
}
