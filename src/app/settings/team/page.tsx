import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function TeamSettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const members = [
        { id: user.id, name: 'Erdem (Jij)', email: user.email, role: 'Eigenaar' },
        { id: '2', name: 'Sarah Jansen', email: 'sarah@makelaardij.nl', role: 'Makelaar' },
        { id: '3', name: 'Mark de Vries', email: 'mark@makelaardij.nl', role: 'Beheerder' },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Team Beheer</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Beheer je teamleden en hun rollen.</p>
                </div>
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20">
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    <span>Lid Uitnodigen</span>
                </button>
            </div>

            <div className="bg-white dark:bg-slate-card rounded-2xl border border-gray-100 dark:border-white/5 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3 font-medium">Naam</th>
                            <th className="px-6 py-3 font-medium">Email</th>
                            <th className="px-6 py-3 font-medium">Rol</th>
                            <th className="px-6 py-3 font-medium text-right">Acties</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {members.map((member) => (
                            <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                                        {member.name.charAt(0)}
                                    </div>
                                    {member.name}
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{member.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${member.role === 'Eigenaar' ? 'bg-purple-500/10 text-purple-500' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400'}`}>
                                        {member.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    {member.role !== 'Eigenaar' && (
                                        <button className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors">
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-4 flex gap-4 border border-blue-100 dark:border-blue-500/20">
                <span className="material-symbols-outlined text-blue-500">info</span>
                <div className="text-sm">
                    <p className="font-bold text-blue-700 dark:text-blue-400">Team Samenwerking</p>
                    <p className="text-blue-600/80 dark:text-blue-400/80 mt-1">Upgrade naar Business voor onbeperkte teamleden en geavanceerde rollen.</p>
                </div>
            </div>
        </div>
    )
}
