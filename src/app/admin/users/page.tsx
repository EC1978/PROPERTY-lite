import { createClient, createAdminClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { Users, ChevronRight, UserCircle2 } from 'lucide-react'

export default async function AdminUsersPage() {
    const supabaseAdmin = await createAdminClient()

    // Retrieve ALL users (makelaars), bypassing RLS
    const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6 max-w-6xl mx-auto">
            <header className="py-4 flex flex-col gap-4 sticky top-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-lg rounded-xl border-b border-[#222]">
                <div className="px-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-[#0df2a2] to-emerald-900 text-[#0A0A0A]">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold tracking-tight text-white">Makelaars Beheer</h1>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold">{users?.length || 0} Geregistreerd</p>
                        </div>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 px-5">
                {users?.map((user) => (
                    <Link href={`/admin/users/${user.id}`} key={user.id} className="block group">
                        <div className="bg-[#1A1A1A]/80 backdrop-blur-md border border-white/5 rounded-3xl p-6 transition-all duration-300 hover:border-[#0df2a2]/30 hover:shadow-[0_0_20px_rgba(13,242,162,0.1)] hover:-translate-y-1 h-full flex flex-col justify-between">

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#222] to-[#111] border border-zinc-800 flex items-center justify-center text-white font-bold text-xl uppercase group-hover:border-[#0df2a2]/50 transition-colors">
                                        {user.full_name?.substring(0, 2) || <UserCircle2 className="w-6 h-6 text-zinc-500" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-white group-hover:text-[#0df2a2] transition-colors">{user.full_name || 'Onbekend'}</h3>
                                        <p className="text-sm text-zinc-500 truncate max-w-[150px]">{user.email || user.id}</p>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${user.role === 'superadmin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/20' : 'bg-[#0df2a2]/10 text-[#0df2a2] border border-[#0df2a2]/20'}`}>
                                    {user.role || 'makelaar'}
                                </span>
                            </div>

                            <div className="flex items-center justify-between border-t border-zinc-800/50 pt-4 mt-auto">
                                <span className="text-xs text-zinc-500 font-medium">Aangemaakt: {new Date(user.created_at).toLocaleDateString('nl-NL')}</span>
                                <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center group-hover:bg-[#0df2a2] group-hover:text-black transition-colors text-zinc-400">
                                    <ChevronRight className="w-4 h-4 ml-0.5" />
                                </div>
                            </div>

                        </div>
                    </Link>
                ))}
            </div>

            {(!users || users.length === 0) && (
                <div className="px-5">
                    <div className="bg-[#1A1A1A]/80 border border-white/5 rounded-3xl p-12 text-center">
                        <UserCircle2 className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white mb-2">Geen makelaars gevonden</h3>
                        <p className="text-zinc-500">{error ? 'Er ging iets mis bij het ophalen van de data.' : 'Er hebben zich nog geen makelaars geregistreerd.'}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
