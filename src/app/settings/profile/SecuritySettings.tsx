'use client'

import { useState } from 'react'
import { updatePassword } from './actions'
import toast from 'react-hot-toast'

export default function SecuritySettings() {
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    // 2FA state
    const [is2FAEnabled, setIs2FAEnabled] = useState(false)
    const [isSettingUp2FA, setIsSettingUp2FA] = useState(false)
    const [twoFACode, setTwoFACode] = useState('')

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

    const handleToggle2FA = (e: React.MouseEvent<HTMLLabelElement>) => {
        // Prevent default toggle until flow is complete
        e.preventDefault()
        if (is2FAEnabled) {
            // Flow to disable 2FA
            setIs2FAEnabled(false)
            toast.success('Twee-factor authenticatie uitgeschakeld')
        } else {
            // Start setup flow
            setIsSettingUp2FA(true)
        }
    }

    const handleConfirm2FA = () => {
        // Mock verification
        if (twoFACode.length === 6) {
            setIs2FAEnabled(true)
            setIsSettingUp2FA(false)
            setTwoFACode('')
            toast.success('Twee-factor authenticatie ingeschakeld')
        } else {
            toast.error('Geldige 6-cijferige code vereist')
        }
    }

    return (
        <div className="bg-[#161616]/60 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10 shadow-lg transition-all duration-300">
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#0df2a2]">shield</span>
                    Beveiliging
                </h3>
            </div>
            <div className="flex flex-col divide-y divide-white/5">

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
                                    placeholder="Minimaal 6 karakters..."
                                    className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] text-white text-sm rounded-xl py-2 px-3 pr-10 outline-none transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors flex items-center justify-center p-1 rounded-full hover:bg-white/5"
                                >
                                    <span className="material-symbols-outlined text-[18px]">{showPassword ? 'visibility_off' : 'visibility'}</span>
                                </button>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                            <button
                                onClick={() => { setIsChangingPassword(false); setNewPassword(''); setShowPassword(false); }}
                                disabled={isSaving}
                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all active:scale-95 shrink-0 disabled:opacity-50"
                            >
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Annuleren</span>
                            </button>
                            <button
                                onClick={handleSavePassword}
                                disabled={isSaving || newPassword.length < 6}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0df2a2]/10 hover:bg-[#0df2a2]/20 border border-[#0df2a2]/20 rounded-full transition-all active:scale-95 shrink-0 disabled:opacity-50 text-[#0df2a2]"
                            >
                                <span className="text-xs font-semibold uppercase tracking-wider">{isSaving ? 'Opslaan...' : 'Wachtwoord Opslaan'}</span>
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors relative">
                    <div className="flex flex-col gap-0.5 pr-4 cursor-default">
                        <span className="text-sm font-semibold text-white">Twee-factor authenticatie <span className="ml-2 px-1.5 py-0.5 bg-[#0df2a2]/10 text-[#0df2a2] text-[10px] uppercase font-bold rounded-md tracking-wider">Bèta</span></span>
                        <span className="text-xs text-gray-500">Activeer voor extra accountbeveiliging met Authenticator App</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none" onClick={handleToggle2FA}>
                        <input type="checkbox" checked={is2FAEnabled} onChange={() => { }} className="sr-only peer" />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0df2a2]"></div>
                    </label>
                </div>

                {/* 2FA Setup Modal/Inline Flow */}
                {isSettingUp2FA && (
                    <div className="p-5 flex flex-col gap-4 bg-[#0df2a2]/5 border-t border-[#0df2a2]/10 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex gap-4 items-start">
                            <div className="w-24 h-24 bg-white p-1 rounded-lg shrink-0 flex items-center justify-center">
                                {/* Dummy QR Code */}
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=otpauth://totp/VoiceRealty:Voicerealty?secret=JBSWY3DPEHPK3PXP&issuer=VoiceRealty`} alt="2FA QR Code" className="w-full h-full" />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-white mb-1">Scan de QR-code</h4>
                                <p className="text-xs text-gray-400 mb-3 leading-relaxed">Scan deze code met je Google Authenticator of Authy app. Typ daarna de 6-cijferige code in om te bevestigen.</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="000 000"
                                        maxLength={6}
                                        value={twoFACode}
                                        onChange={e => setTwoFACode(e.target.value.replace(/[^0-9]/g, ''))}
                                        className="w-full max-w-[120px] bg-[#0A0A0A] border border-white/10 focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] text-white text-sm rounded-xl py-2 px-3 outline-none transition-colors text-center tracking-widest font-mono"
                                    />
                                    <button
                                        onClick={handleConfirm2FA}
                                        disabled={twoFACode.length !== 6}
                                        className="px-4 py-2 bg-[#0df2a2] hover:bg-[#0df2a2]/90 text-[#0A0A0A] text-xs font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        Verifiëren
                                    </button>
                                    <button
                                        onClick={() => { setIsSettingUp2FA(false); setTwoFACode(''); }}
                                        className="px-3 py-2 text-gray-500 hover:text-white text-xs font-semibold"
                                    >
                                        Annuleren
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
