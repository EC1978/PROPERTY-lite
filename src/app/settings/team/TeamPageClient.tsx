'use client';

import { useState } from 'react';
import { Users, UserPlus, Mail, Shield, CheckCircle2, Clock, Trash2, Loader2 } from 'lucide-react';
import { TeamMember, deleteTeamMember } from './actions';
import InviteMemberModal from '@/components/team/InviteMemberModal';
import { useRouter } from 'next/navigation';

export default function TeamPageClient({ initialMembers, error }: { initialMembers: TeamMember[], error?: string }) {
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const router = useRouter();

    const handleDelete = async (id: string) => {
        if (!confirm('Weet u zeker dat u dit teamlid wilt verwijderen?')) return;

        setDeletingId(id);
        await deleteTeamMember(id);
        setDeletingId(null);
        router.refresh();
    };

    return (
        <div className="w-full max-w-5xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500 pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white m-0 leading-tight flex items-center gap-3">
                        <Users className="w-8 h-8 text-[#0df2a2]" />
                        Teambeheer
                    </h1>
                    <p className="text-slate-500 dark:text-gray-400 text-[15px] mt-2 max-w-2xl">
                        Beheer uw teamleden, wijs rollen toe en nodig nieuwe makelaars uit om samen te werken in VoiceRealty.
                    </p>
                </div>

                <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-2 bg-[#0df2a2] hover:bg-[#0df2a2]/90 text-black px-5 py-2.5 rounded-xl font-medium transition-all shadow-[0_0_15px_rgba(13,242,162,0.2)] hover:shadow-[0_0_25px_rgba(13,242,162,0.4)] hover:-translate-y-0.5 whitespace-nowrap"
                >
                    <UserPlus className="w-5 h-5" />
                    Uitnodigen
                </button>
            </div>

            {error ? (
                <div className="p-4 bg-red-400/10 border border-red-400/20 text-red-400 rounded-xl">
                    {error}
                </div>
            ) : (
                <div className="-mx-4 sm:mx-0 bg-white dark:bg-[#1C1C1E]/50 border-y sm:border border-gray-200 dark:border-white/5 sm:rounded-2xl overflow-hidden shadow-sm dark:shadow-none backdrop-blur-xl">
                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-white/5 bg-slate-50 dark:bg-black/20">
                                    <th className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-gray-400">Gebruiker</th>
                                    <th className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-gray-400">Rol</th>
                                    <th className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-gray-400">Status</th>
                                    <th className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-gray-400 text-right">Acties</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/5 bg-white dark:bg-transparent">
                                {initialMembers.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-gray-500">
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center">
                                                    <Users className="w-8 h-8 text-gray-600" />
                                                </div>
                                                <p>U heeft nog geen teamleden toegevoegd.</p>
                                                <button
                                                    onClick={() => setIsInviteModalOpen(true)}
                                                    className="text-[#0df2a2] hover:underline mt-1 text-sm font-medium"
                                                >
                                                    Nodig uw eerste lid uit
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    initialMembers.map((member) => (
                                        <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-gray-400 font-bold shrink-0">
                                                        {member.email.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-2 truncate">
                                                            {member.email.split('@')[0]}
                                                        </div>
                                                        <div className="text-xs text-slate-500 dark:text-gray-500 flex items-center gap-1 mt-0.5 truncate">
                                                            <Mail className="w-3 h-3 shrink-0" />
                                                            <span className="truncate">{member.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-white/5 text-sm text-slate-700 dark:text-gray-300 border border-gray-200 dark:border-white/5">
                                                    <Shield className="w-3.5 h-3.5" />
                                                    {member.role}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {member.status === 'Active' ? (
                                                    <span className="inline-flex items-center gap-1.5 text-sm text-[#0df2a2] bg-[#0df2a2]/10 px-2.5 py-1 rounded-full border border-[#0df2a2]/20">
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Actief
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-sm text-amber-400 bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Uitgenodigd
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleDelete(member.id)}
                                                    disabled={deletingId === member.id}
                                                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
                                                    title="Verwijderen"
                                                >
                                                    {deletingId === member.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <InviteMemberModal
                isOpen={isInviteModalOpen}
                onClose={() => setIsInviteModalOpen(false)}
            />
        </div>
    );
}
