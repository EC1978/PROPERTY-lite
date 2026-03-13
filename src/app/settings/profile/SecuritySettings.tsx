'use client'

import { useState, useEffect, useTransition } from 'react'
import { updatePassword } from './actions'
import { enrollTotp, verifyTotp, unenrollTotp, getMfaFactors } from '@/app/auth/actions'
import toast from 'react-hot-toast'
import QRCode from 'qrcode'

export default function SecuritySettings() {
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // 2FA state
    const [is2FAEnabled, setIs2FAEnabled] = useState(false)
    const [factorId, setFactorId] = useState<string | null>(null)
    const [isSettingUp2FA, setIsSettingUp2FA] = useState(false)
    const [twoFACode, setTwoFACode] = useState('')
    const [qrCode, setQrCode] = useState<string | null>(null)
    const [secret, setSecret] = useState<string | null>(null)
    const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null)
    const [isLoadingFactors, setIsLoadingFactors] = useState(true)
    const [isPending2FA, startTransition2FA] = useTransition()

    // Load existing MFA factors on mount
    useEffect(() => {
        const loadFactors = async () => {
            setIsLoadingFactors(true)
            const { factors } = await getMfaFactors()
            const verified = factors.find((f: { status: string; id: string }) => f.status === 'verified')
            if (verified) {
                setIs2FAEnabled(true)
                setFactorId(verified.id)
            }
            setIsLoadingFactors(false)
        }
        loadFactors()
    }, [])

    const handleSavePassword = async () => {
        setIsSaving(true)
        const formData = new FormData()
        formData.append('newPassword', newPassword)

        const res = await updatePassword(formData)
        setIsSaving(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Wachtwoord succesvol gewijzigd')
            setIsChangingPassword(false)
            setNewPassword('')
        }
    }

    const handleToggle2FA = async (e: React.MouseEvent<HTMLLabelElement>) => {
        e.preventDefault()

        if (is2FAEnabled && factorId) {
            // Disable 2FA
            const res = await unenrollTotp(factorId)
            if (res.error) {
                toast.error(res.error)
            } else {
                setIs2FAEnabled(false)
                setFactorId(null)
                toast.success('Twee-factor authenticatie uitgeschakeld')
            }
            return
        }

        // Start 2FA enrollment
        setIsSettingUp2FA(true)
        setQrCode(null)
        setSecret(null)
        setEnrollFactorId(null)
        setTwoFACode('')

        const res = await enrollTotp()
        if (res.error) {
            toast.error(res.error)
            setIsSettingUp2FA(false)
            return
        }

        if (res.uri) {
            const qrDataUrl = await QRCode.toDataURL(res.uri)
            setQrCode(qrDataUrl)
        }
        setSecret(res.secret ?? null)
        setEnrollFactorId(res.factorId ?? null)
    }

    const handleConfirm2FA = () => {
        if (!enrollFactorId || twoFACode.length !== 6) {
            toast.error('Geldige 6-cijferige code vereist')
            return
        }

        const formData = new FormData()
        formData.append('factorId', enrollFactorId)
        formData.append('code', twoFACode)

        startTransition2FA(async () => {
            const res = await verifyTotp(formData)
            if (res?.error) {
                toast.error(res.error)
                setTwoFACode('')
            } else {
                setIs2FAEnabled(true)
                setFactorId(enrollFactorId)
                setIsSettingUp2FA(false)
                setTwoFACode('')
                setQrCode(null)
                setSecret(null)
                toast.success('Twee-factor authenticatie ingeschakeld!')
            }
        })
    }

    return (
        <div className="bg-[#0A0A0A] dark:bg-[#161616]/60 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10 shadow-lg transition-all duration-300">
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#0df2a2]">shield</span>
                    Beveiliging
                </h3>
            </div>
            <div className="flex flex-col divide-y divide-white/5">

                {/* Password section */}
                {!isChangingPassword ? (
                    <button
                        onClick={() => setIsChangingPassword(true)}
                        className="flex items-center justify-between p-5 hover:bg-white/[0.03] transition-colors group text-left w-full active:bg-white/5"
                    >
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-white group-hover:text-[#0df2a2] transition-colors">Wachtwoord wijzigen</span>
                            <span className="text-xs text-gray-500">Kies een sterk nieuw wachtwoord</span>
                        </div>
                        <span className="material-symbols-outlined text-gray-600 group-hover:text-white transition-colors">chevron_right</span>
                    </button>
                ) : (
                    <div className="p-5 flex flex-col gap-4 bg-white/[0.01] animate-in fade-in slide-in-from-top-2 duration-300">
                        <div>
                            <label className="text-xs text-gray-400 font-medium mb-1 block">Nieuw Wachtwoord</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    placeholder="Nieuw wachtwoord..."
                                    className={`w-full bg-[#0A0A0A] border ${newPassword && newPassword.length < 6 ? 'border-red-500/50' : 'border-white/10'} focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] text-white text-sm rounded-xl py-2 px-3 pr-10 outline-none transition-colors`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors flex items-center justify-center p-1 rounded-full hover:bg-white/5"
                                >
                                    <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                            {newPassword && newPassword.length < 6 && (
                                <p className="text-[10px] text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
                                    Minimaal 6 tekens vereist
                                </p>
                            )}
                        </div>
                        <div className="flex sm:flex-row flex-col-reverse justify-end gap-2 mt-4">
                            <button
                                onClick={() => { setIsChangingPassword(false); setNewPassword(''); setShowPassword(false); }}
                                disabled={isSaving}
                                className="px-3 py-2 sm:py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full sm:rounded-full rounded-xl transition-all active:scale-95 shrink-0 disabled:opacity-50 text-center"
                            >
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Annuleren</span>
                            </button>
                            <button
                                onClick={handleSavePassword}
                                disabled={isSaving || newPassword.length < 6}
                                className="flex justify-center items-center gap-1.5 px-3 py-2 sm:py-1.5 bg-[#0df2a2]/10 hover:bg-[#0df2a2]/20 border border-[#0df2a2]/20 rounded-full sm:rounded-full rounded-xl transition-all active:scale-95 shrink-0 disabled:opacity-50 text-[#0df2a2]"
                            >
                                <span className="text-xs font-semibold uppercase tracking-wider">{isSaving ? 'Opslaan...' : 'Wachtwoord Opslaan'}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* 2FA toggle */}
                <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors relative">
                    <div className="flex flex-col gap-0.5 pr-4 cursor-default">
                        <span className="text-sm font-semibold text-white">
                            Twee-factor authenticatie{' '}
                            <span className="ml-2 px-1.5 py-0.5 bg-[#0df2a2]/10 text-[#0df2a2] text-[10px] uppercase font-bold rounded-md tracking-wider">Bèta</span>
                        </span>
                        <span className="text-xs text-gray-500">
                            {isLoadingFactors ? 'Laden...' : is2FAEnabled ? '✓ Ingeschakeld via Authenticator App' : 'Activeer voor extra accountbeveiliging'}
                        </span>
                    </div>
                    <label
                        className={`relative inline-flex items-center select-none ${isLoadingFactors ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                        onClick={handleToggle2FA}
                        suppressHydrationWarning
                    >
                        <input type="checkbox" checked={is2FAEnabled} onChange={() => { }} className="sr-only peer" suppressHydrationWarning />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0df2a2]"></div>
                    </label>
                </div>

                {/* 2FA Setup Flow */}
                {isSettingUp2FA && (
                    <div className="p-5 flex flex-col gap-4 bg-[#0df2a2]/5 border-t border-[#0df2a2]/10 animate-in fade-in slide-in-from-top-2 duration-300">
                        {!qrCode ? (
                            <div className="flex items-center gap-3 text-gray-400 text-sm">
                                <span className="w-5 h-5 border-2 border-[#0df2a2]/30 border-t-[#0df2a2] rounded-full animate-spin shrink-0"></span>
                                QR-code wordt gegenereerd...
                            </div>
                        ) : (
                            <div className="flex gap-4 items-start">
                                <div className="w-28 h-28 bg-white p-1.5 rounded-lg shrink-0 flex items-center justify-center">
                                    <img src={qrCode} alt="2FA QR Code" className="w-full h-full" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-white mb-1">Scan de QR-code</h4>
                                    <p className="text-xs text-gray-400 mb-3 leading-relaxed">
                                        Open je Google Authenticator of Authy app, voeg een account toe en scan deze code.
                                    </p>
                                    {secret && (
                                        <p className="text-[10px] text-gray-600 mb-3 font-mono break-all">
                                            Of handmatig: <span className="text-gray-400">{secret}</span>
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="000000"
                                            maxLength={6}
                                            value={twoFACode}
                                            onChange={e => setTwoFACode(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="w-full max-w-[120px] bg-[#0A0A0A] border border-white/10 focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] text-white text-sm rounded-xl py-2 px-3 outline-none transition-colors text-center tracking-widest font-mono"
                                            disabled={isPending2FA}
                                        />
                                        <button
                                            onClick={handleConfirm2FA}
                                            disabled={twoFACode.length !== 6 || isPending2FA}
                                            className="px-4 py-2 bg-[#0df2a2] hover:bg-[#0df2a2]/90 text-[#0A0A0A] text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1"
                                        >
                                            {isPending2FA ? (
                                                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                            ) : 'Verifiëren'}
                                        </button>
                                        <button
                                            onClick={() => { setIsSettingUp2FA(false); setTwoFACode(''); setQrCode(null); }}
                                            className="px-3 py-2 text-gray-500 hover:text-white text-xs font-semibold"
                                            disabled={isPending2FA}
                                        >
                                            Annuleren
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
