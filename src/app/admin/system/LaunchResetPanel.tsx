'use client'

import { useState } from 'react'
import { Rocket, AlertTriangle, Trash2, ShieldAlert } from 'lucide-react'
import toast from 'react-hot-toast'
import { resetPlatformData } from './actions'

export default function LaunchResetPanel() {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [confirmText, setConfirmText] = useState('')

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (confirmText !== 'NU LANCEREN') {
            toast.error("Typ 'NU LANCEREN' om te bevestigen.")
            return
        }

        setIsResetting(true)
        const toastId = toast.loading('Platform bestellingen wissen en resetten...')
        
        const result = await resetPlatformData()
        
        if (result.success) {
            toast.success('Platform succesvol gereset! Facturen starten weer op FACT-202X-0001.', { id: toastId })
            setIsModalOpen(false)
            setConfirmText('')
        } else {
            toast.error(result.error || 'Er ging iets fout. Probeer het opnieuw.', { id: toastId })
        }
        
        setIsResetting(false)
    }

    return (
        <>
            <section className="bg-red-500/5 border border-red-500/10 rounded-[32px] p-8 mt-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                            <Rocket className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tight">Go-Live Hard Reset</h2>
                            <p className="text-xs text-zinc-400 font-medium mt-1 leading-relaxed max-w-xl">
                                Wis alle proefbestellingen, test-offertes, en klachten die tijdens development zijn gemaakt. 
                                <strong className="text-red-400 block mt-1">De nummeringreeksen (FACT- en OFF-) worden permanent gereset naar 1.</strong>
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setIsModalOpen(true)}
                        className="w-full md:w-auto px-8 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3 shrink-0"
                    >
                        <Trash2 className="w-4 h-4" />
                        Platform Resetten
                    </button>
                </div>
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-8 text-center space-y-6">
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mx-auto animate-pulse">
                                <ShieldAlert className="w-10 h-10" />
                            </div>
                            
                            <div className="space-y-3">
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight">Eensysteem Reset</h3>
                                <p className="text-sm text-zinc-400 font-medium">
                                    Je staat op het punt om <strong>álla shop orders, items, offertes en klachten</strong> definitief te verwijderen. 
                                </p>
                                <p className="text-[10px] font-black uppercase tracking-widest text-red-400 p-2 bg-red-500/10 rounded-lg">
                                    Dit kan niet ongedaan worden gemaakt.
                                </p>
                            </div>

                            <form onSubmit={handleReset} className="space-y-4 pt-4 border-t border-white/5">
                                <div>
                                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest block mb-2">
                                        Typ <span className="text-white">NU LANCEREN</span> ter bevestiging
                                    </label>
                                    <input 
                                        type="text" 
                                        required
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-center text-white font-black tracking-widest focus:outline-none focus:border-red-500 transition-colors"
                                        placeholder="NU LANCEREN"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button 
                                        type="button"
                                        disabled={isResetting}
                                        onClick={() => { setIsModalOpen(false); setConfirmText(''); }}
                                        className="px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-50"
                                    >
                                        Annuleren
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isResetting || confirmText !== 'NU LANCEREN'}
                                        className="px-4 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isResetting ? 'Bezig...' : 'Bevestig Reset'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
