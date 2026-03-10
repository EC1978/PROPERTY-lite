'use client'

import { useState, useEffect } from 'react'
import { updatePaymentSettings } from './actions'
import { Eye, EyeOff, Save, ShieldCheck, Zap, AlertTriangle, Info, Copy, Check } from 'lucide-react'

interface PaymentSettingsFormProps {
    initialData: any
}

export default function PaymentSettingsForm({ initialData }: PaymentSettingsFormProps) {
    const [isTestMode, setIsTestMode] = useState(initialData?.mollie_is_test_mode ?? true)
    const [testKey, setTestKey] = useState(initialData?.mollie_test_api_key ?? '')
    const [liveKey, setLiveKey] = useState(initialData?.mollie_live_api_key ?? '')
    const [showTestKey, setShowTestKey] = useState(false)
    const [showLiveKey, setShowLiveKey] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [copied, setCopied] = useState(false)
    const [origin, setOrigin] = useState('')
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setOrigin(window.location.origin)
        setMounted(true)
    }, [])

    const handleCopy = () => {
        const url = `${origin}/api/payments/webhook`
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSave = async () => {
        setIsSaving(true)
        setMessage(null)

        const result = await updatePaymentSettings({
            mollie_test_api_key: testKey,
            mollie_live_api_key: liveKey,
            mollie_is_test_mode: isTestMode
        })

        if (result.success) {
            setMessage({ type: 'success', text: 'Instellingen succesvol bijgewerkt!' })
        } else {
            setMessage({ type: 'error', text: 'Er is een fout opgetreden bij het opslaan.' })
        }
        setIsSaving(false)
    }

    return (
        <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-3">
                        <CreditCard className="w-8 h-8 text-[#10b77f]" />
                        Betaal <span className="text-[#10b77f]">Methodes</span>
                    </h1>
                    <p className="text-zinc-500 text-sm mt-1 font-medium uppercase tracking-widest italic opacity-70">
                        Configureer uw Mollie API instellingen
                    </p>
                </div>
            </div>

            {/* Test Mode Banner */}
            <div className={`p-6 rounded-[2rem] border transition-all duration-500 ${isTestMode ? 'bg-[#10b77f]/5 border-[#10b77f]/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`size-12 rounded-2xl flex items-center justify-center shadow-lg ${isTestMode ? 'bg-[#10b77f] text-[#0A0A0A]' : 'bg-amber-500 text-[#0A0A0A]'}`}>
                            {isTestMode ? <Zap className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                        </div>
                        <div>
                            <p className="font-black uppercase tracking-tight italic text-lg">
                                {isTestMode ? 'Test Modus Actief' : 'Productie Modus Actief'}
                            </p>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest italic opacity-60">
                                {isTestMode ? 'Er worden alleen test-betalingen verwerkt.' : 'WAARSCHUWING: Er worden ECHTE betalingen verwerkt!'}
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer scale-125 mr-4">
                        <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={isTestMode}
                            onChange={(e) => setIsTestMode(e.target.checked)}
                        />
                        <div className="w-14 h-7 bg-white/5 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-[#0A0A0A] after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-zinc-800 after:rounded-full after:h-[20px] after:w-[20px] after:transition-all peer-checked:bg-[#10b77f] peer-checked:after:bg-[#0A0A0A] shadow-inner"></div>
                    </label>
                </div>
            </div>

            {/* Main Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Test API Key Card */}
                <div className={`glass-panel border-white/5 rounded-[2.5rem] p-8 space-y-6 transition-all duration-700 relative overflow-hidden group hover:border-[#10b77f]/30 ${isTestMode ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b77f]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-[#10b77f]/30 transition-all">
                            <Zap className="w-5 h-5 text-zinc-400 group-hover:text-[#10b77f]" />
                        </div>
                        <h3 className="font-black uppercase tracking-tight italic text-lg">Test API Key</h3>
                    </div>

                    <div className="relative">
                        <input
                            type={showTestKey ? 'text' : 'password'}
                            value={testKey}
                            onChange={(e) => setTestKey(e.target.value)}
                            placeholder="test_..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold tracking-widest focus:ring-2 focus:ring-[#10b77f]/30 focus:border-[#10b77f]/50 outline-none transition-all pr-14 placeholder:text-zinc-700"
                        />
                        <button
                            type="button"
                            onClick={() => setShowTestKey(!showTestKey)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                        >
                            {showTestKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] italic px-2">
                        Begint met <span className="text-[#10b77f]">test_</span>
                    </p>
                </div>

                {/* Live API Key Card */}
                <div className={`glass-panel border-white/5 rounded-[2.5rem] p-8 space-y-6 transition-all duration-700 relative overflow-hidden group hover:border-amber-500/30 ${!isTestMode ? 'opacity-100' : 'opacity-40 hover:opacity-100'}`}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-amber-500/30 transition-all">
                            <ShieldCheck className="w-5 h-5 text-zinc-400 group-hover:text-amber-500" />
                        </div>
                        <h3 className="font-black uppercase tracking-tight italic text-lg">Live API Key</h3>
                    </div>

                    <div className="relative">
                        <input
                            type={showLiveKey ? 'text' : 'password'}
                            value={liveKey}
                            onChange={(e) => setLiveKey(e.target.value)}
                            placeholder="live_..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold tracking-widest focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all pr-14 placeholder:text-zinc-700"
                        />
                        <button
                            type="button"
                            onClick={() => setShowLiveKey(!showLiveKey)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white transition-colors"
                        >
                            {showLiveKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.2em] italic px-2">
                        Begint met <span className="text-amber-500">live_</span>
                    </p>
                </div>
            </div>

            {/* Information Card */}
            <div className="glass-panel border-white/5 rounded-[2.5rem] p-10 space-y-6 relative overflow-hidden group">
                <div className="flex items-start gap-6">
                    <div className="size-14 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center shadow-inner">
                        <Info className="w-7 h-7 text-[#10b77f]" />
                    </div>
                    <div className="flex-1 space-y-4">
                        <h3 className="font-black uppercase tracking-tight italic text-xl">Webhook Configuratie</h3>
                        <p className="text-sm text-zinc-500 font-medium leading-relaxed opacity-80">
                            Zorg ervoor dat u de volgende webhook URL configureert in uw Mollie dashboard om betalingsstatussen automatisch bij te werken:
                        </p>
                        <div className="bg-black/40 rounded-2xl p-6 border border-white/5 flex items-center justify-between group/code select-none">
                            <code className="text-[#10b77f] font-mono text-sm break-all">
                                {mounted ? origin : '[jouw-domein]'}/api/payments/webhook
                            </code>
                            <button
                                onClick={handleCopy}
                                className={`transition-all p-2 rounded-lg flex items-center gap-2 ${copied ? 'text-[#10b77f] bg-[#10b77f]/10' : 'text-zinc-600 hover:text-white hover:bg-white/5'}`}
                            >
                                {copied ? (
                                    <>
                                        <span className="text-[10px] font-black uppercase tracking-widest italic">Gekopieerd!</span>
                                        <Check className="w-4 h-4" />
                                    </>
                                ) : (
                                    <Copy className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-white/5">
                <div className="flex items-center gap-3">
                    {message && (
                        <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest italic flex items-center gap-2 animate-in zoom-in duration-300 ${message.type === 'success' ? 'bg-[#10b77f]/10 text-[#10b77f] border border-[#10b77f]/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                            {message.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                            {message.text}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-[#10b77f] hover:bg-[#10b77f]/90 text-[#0A0A0A] font-black px-10 py-5 rounded-2xl shadow-[0_20px_40px_rgba(16,183,127,0.2)] flex items-center gap-4 transition-all uppercase tracking-widest text-xs group/btn italic disabled:opacity-50"
                >
                    {isSaving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
                    <Save className={`w-5 h-5 transition-transform ${isSaving ? 'animate-spin' : 'group-hover:scale-110'}`} />
                </button>
            </div>
        </div>
    )
}

function CreditCard(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
        </svg>
    )
}
