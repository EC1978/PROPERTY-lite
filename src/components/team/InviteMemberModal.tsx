'use client';

import { useState } from 'react';
import { inviteTeamMember, TeamRole } from '@/app/settings/team/actions';
import { X, Mail, Shield, Loader2, CheckCircle2 } from 'lucide-react';

interface InviteMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function InviteMemberModal({ isOpen, onClose }: InviteMemberModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccess(false);

        const formData = new FormData(e.currentTarget);
        const result = await inviteTeamMember(formData);

        if (!result.success) {
            setError(result.error || 'Er ging iets mis.');
            setIsLoading(false);
        } else {
            setSuccess(true);
            setIsLoading(false);
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 1500);
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="bg-[#1C1C1E] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h2 className="text-xl font-semibold text-white">Nieuw Teamlid Uitnodigen</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/5 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4 text-center animate-in zoom-in-50 duration-300">
                            <div className="w-16 h-16 bg-[#0df2a2]/20 text-[#0df2a2] rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-white mb-1">Uitnodiging Verstuurd!</h3>
                                <p className="text-sm text-gray-400">Het nieuwe lid kan nu inloggen.</p>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="p-3 text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg animate-in slide-in-from-top-2">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                                        E-mailadres
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            required
                                            className="block w-full pl-10 pr-3 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#0df2a2] focus:border-[#0df2a2] transition-colors"
                                            placeholder="collega@makelaar.nl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-300">
                                        Rol
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <Shield className="w-5 h-5" />
                                        </div>
                                        <select
                                            name="role"
                                            id="role"
                                            required
                                            className="block w-full pl-10 pr-10 py-2.5 bg-black/50 border border-white/10 rounded-xl text-white appearance-none focus:outline-none focus:ring-1 focus:ring-[#0df2a2] focus:border-[#0df2a2] transition-colors"
                                        >
                                            <option value="Makelaar">Makelaar (Standaard toegang)</option>
                                            <option value="Beheerder">Beheerder (Volledige toegang)</option>
                                        </select>
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Beheerders kunnen ook facturatie en integraties aanpassen.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-medium transition-colors"
                                >
                                    Annuleren
                                </button>
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="flex-1 py-2.5 px-4 bg-[#0df2a2] hover:bg-[#0df2a2]/90 text-black rounded-xl text-sm font-semibold transition-colors flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(13,242,162,0.3)] hover:shadow-[0_0_20px_rgba(13,242,162,0.5)]"
                                >
                                    {isLoading ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            Uitnodigen
                                            <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
