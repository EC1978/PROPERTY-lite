'use client'

import { useState } from 'react'

interface OAuthSimulationModalProps {
    isOpen: boolean;
    provider: 'google' | 'microsoft';
    onClose: () => void;
    onAuthorize: (provider: string) => Promise<void>;
    isLoading: boolean;
}

const PROVIDER_INFO = {
    google: {
        name: 'Google',
        icon: 'google', // we simulate a logo feeling
        color: 'bg-white',
        textColor: 'text-gray-800',
        brandColors: ['#4285F4', '#34A853', '#FBBC05', '#EA4335'],
        accountEmail: 'makelaar@gmail.com'
    },
    microsoft: {
        name: 'Microsoft',
        icon: 'window',
        color: 'bg-[#F2F2F2]',
        textColor: 'text-gray-900',
        brandColors: ['#F25022', '#7FBA00', '#00A4EF', '#FFB900'],
        accountEmail: 'contact@makelaardij.nl'
    }
}

export default function OAuthSimulationModal({ isOpen, provider, onClose, onAuthorize, isLoading }: OAuthSimulationModalProps) {
    const [step, setStep] = useState<1 | 2>(1) // 1: Select account, 2: Permissions

    if (!isOpen) return null

    const info = PROVIDER_INFO[provider]

    // Reset step when modal closes/opens
    const handleClose = () => {
        setStep(1)
        onClose()
    }

    const handleAccountSelect = () => {
        setStep(2)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
                onClick={handleClose}
            />

            {/* Modal: Styled like a real popup window from Google/Microsoft */}
            <div className={`relative w-full max-w-md ${info.color} rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col`}>

                {/* Simulated Browser/Popup Header */}
                <div className="bg-gray-100/50 border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-gray-500 text-sm">lock</span>
                        <span className="text-xs text-gray-500 font-medium">
                            {provider === 'google' ? 'accounts.google.com' : 'login.microsoftonline.com'}
                        </span>
                    </div>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-700">
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>

                <div className="p-8 md:p-10 flex flex-col items-center text-center">
                    {/* Brand Logo Sim */}
                    <div className="flex gap-1 mb-6">
                        {info.brandColors.map((c, i) => (
                            <div key={i} className="w-4 h-4 rounded-sm" style={{ backgroundColor: c }} />
                        ))}
                    </div>

                    <h2 className={`text-2xl font-normal mb-2 ${info.textColor}`}>
                        {step === 1 ? 'Kies een account' : 'VoiceRealty toegang geven'}
                    </h2>

                    {step === 1 ? (
                        <>
                            <p className="text-gray-600 mb-8 w-full max-w-[280px]">
                                om door te gaan naar <strong>VoiceRealty Agenda Sync</strong>
                            </p>

                            <button
                                onClick={handleAccountSelect}
                                className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors text-left"
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                    M
                                </div>
                                <div className="flex flex-col">
                                    <span className={`font-semibold ${info.textColor}`}>{info.accountEmail}</span>
                                    <span className="text-xs text-gray-500">Aangemeld in browser</span>
                                </div>
                            </button>

                            <div className="w-full h-px bg-gray-200 my-4"></div>

                            <button className="w-full flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors text-left">
                                <span className="material-symbols-outlined text-gray-400">account_circle</span>
                                <span className={`font-medium ${info.textColor}`}>Een ander account gebruiken</span>
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="text-gray-600 mb-6 text-sm">
                                VoiceRealty wil toegang tot uw <strong>{info.name} account</strong> ({info.accountEmail}).
                            </p>

                            <div className="w-full bg-white border border-gray-200 rounded-xl p-4 text-left mb-8 shadow-sm">
                                <h3 className={`font-semibold text-sm mb-3 ${info.textColor}`}>Hiermee kan VoiceRealty:</h3>
                                <ul className="space-y-3 pb-3">
                                    <li className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-blue-500 text-xl shrink-0">event</span>
                                        <span className="text-sm text-gray-600">Al uw agenda-afspraken bekijken, bewerken en verwijderen.</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <span className="material-symbols-outlined text-blue-500 text-xl shrink-0">contact_mail</span>
                                        <span className="text-sm text-gray-600">Uw primaire e-mailadres en profielgegevens bekijken.</span>
                                    </li>
                                </ul>
                            </div>

                            <div className="w-full flex gap-3">
                                <button
                                    onClick={handleClose}
                                    disabled={isLoading}
                                    className="flex-1 py-3 px-4 rounded-md font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                                >
                                    Annuleren
                                </button>
                                <button
                                    onClick={() => onAuthorize(provider)}
                                    disabled={isLoading}
                                    className="flex-1 py-3 px-4 rounded-md font-medium bg-[#1a73e8] hover:bg-[#1557b0] text-white shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="material-symbols-outlined animate-spin text-sm">sync</span>
                                    ) : (
                                        'Toestaan'
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
