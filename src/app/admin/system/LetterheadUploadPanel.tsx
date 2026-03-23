'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/utils/supabase/client'
import { saveLetterheadUrl } from './actions'
import { FileText, Upload, Trash2, Check, ToggleLeft, ToggleRight, ExternalLink, Loader2, AlertCircle } from 'lucide-react'

interface LetterheadUploadPanelProps {
    initialUrl: string | null
    initialEnabled: boolean
}

export default function LetterheadUploadPanel({ initialUrl, initialEnabled }: LetterheadUploadPanelProps) {
    const [url, setUrl] = useState<string | null>(initialUrl)
    const [enabled, setEnabled] = useState(initialEnabled)
    const [isUploading, setIsUploading] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [status, setStatus] = useState<'idle' | 'saved' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')

    const supabase = createClient()

    const handleUpload = async (file: File) => {
        // Only accept PDF
        if (!file.type.includes('pdf')) {
            setErrorMsg('Alleen PDF-bestanden zijn toegestaan als briefpapier.')
            setStatus('error')
            return
        }

        setIsUploading(true)
        setStatus('idle')
        try {
            const fileName = `letterhead/${Date.now()}-${file.name}`
            const { data, error } = await supabase.storage
                .from('property-images')
                .upload(fileName, file, { upsert: true, contentType: 'application/pdf' })

            if (error) throw error

            const { data: { publicUrl } } = supabase.storage
                .from('property-images')
                .getPublicUrl(fileName)

            setUrl(publicUrl)
        } catch (err: any) {
            setErrorMsg('Upload mislukt: ' + (err.message || 'Onbekende fout'))
            setStatus('error')
        } finally {
            setIsUploading(false)
        }
    }

    const handleSave = () => {
        startTransition(async () => {
            const result = await saveLetterheadUrl(url, enabled)
            if ((result as any)?.error) {
                setErrorMsg((result as any).error)
                setStatus('error')
            } else {
                setStatus('saved')
                setTimeout(() => setStatus('idle'), 3000)
            }
        })
    }

    const handleDelete = () => {
        setUrl(null)
        setStatus('idle')
    }

    return (
        <div className="bg-[#1A1A1A] border border-white/5 rounded-3xl p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#0df2a2]/20 to-emerald-900/20 text-[#0df2a2]">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-white text-sm uppercase tracking-widest">Briefpapier</h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
                            PDF achtergrond voor facturen &amp; offertes
                        </p>
                    </div>
                </div>

                {/* Toggle enable/disable */}
                <button
                    type="button"
                    onClick={() => setEnabled(!enabled)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                        enabled
                            ? 'bg-[#0df2a2]/10 border-[#0df2a2]/30 text-[#0df2a2]'
                            : 'bg-white/5 border-white/10 text-zinc-500'
                    }`}
                >
                    {enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    {enabled ? 'Actief' : 'Inactief'}
                </button>
            </div>

            {/* Upload area */}
            {!url ? (
                <label
                    onDrop={(e) => {
                        e.preventDefault()
                        setIsDragging(false)
                        const file = e.dataTransfer.files?.[0]
                        if (file) handleUpload(file)
                    }}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    className={`block cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300 ${
                        isDragging
                            ? 'border-[#0df2a2] bg-[#0df2a2]/5 scale-[1.01]'
                            : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20'
                    }`}
                >
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        {isUploading ? (
                            <div className="flex flex-col items-center gap-3">
                                <Loader2 className="w-8 h-8 text-[#0df2a2] animate-spin" />
                                <p className="text-[10px] font-black text-[#0df2a2] uppercase tracking-widest animate-pulse">
                                    Uploaden...
                                </p>
                            </div>
                        ) : (
                            <>
                                <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Upload className="w-6 h-6 text-zinc-500" />
                                </div>
                                <p className="text-sm font-bold text-white mb-1">Sleep je briefpapier PDF hierheen</p>
                                <p className="text-[10px] text-zinc-500 font-medium mb-4">of klik om een bestand te kiezen</p>
                                <div className="px-4 py-2 bg-[#0df2a2]/10 border border-[#0df2a2]/20 rounded-xl text-[10px] font-black text-[#0df2a2] uppercase tracking-widest">
                                    PDF selecteren
                                </div>
                                <p className="text-[9px] text-zinc-600 mt-3 font-bold">Alleen PDF • Max 20MB • A4 formaat aanbevolen</p>
                            </>
                        )}
                    </div>
                    <input
                        type="file"
                        accept="application/pdf"
                        className="hidden"
                        onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                        disabled={isUploading}
                    />
                </label>
            ) : (
                /* PDF Preview Card */
                <div className="bg-[#111] border border-[#0df2a2]/20 rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-14 h-16 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-red-400" />
                        <span className="text-[7px] font-black text-red-400 uppercase tracking-widest mt-1">PDF</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white">Briefpapier geüpload</p>
                        <p className="text-[10px] text-zinc-500 font-mono mt-0.5 truncate">{url}</p>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#0df2a2]/10 rounded-lg border border-[#0df2a2]/20">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#0df2a2] animate-pulse" />
                                <span className="text-[9px] font-black text-[#0df2a2] uppercase tracking-widest">Klaar</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"
                            title="Bekijk PDF"
                        >
                            <ExternalLink className="w-4 h-4" />
                        </a>
                        <label className="p-2 rounded-xl bg-[#0df2a2]/10 hover:bg-[#0df2a2]/20 text-[#0df2a2] transition-all cursor-pointer" title="Vervang PDF">
                            <Upload className="w-4 h-4" />
                            <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                            />
                        </label>
                        <button
                            onClick={handleDelete}
                            className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-all"
                            title="Verwijder"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Info box */}
            <div className="bg-[#0df2a2]/5 border border-[#0df2a2]/10 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-4 h-4 text-[#0df2a2] shrink-0 mt-0.5" />
                <div className="text-[10px] text-zinc-400 space-y-1 font-medium">
                    <p><span className="text-[#0df2a2] font-black">Tip:</span> Upload je A4 briefpapier als PDF (met logo, adres, etc.). Dit wordt gebruikt als achtergrondlaag bij het genereren van facturen en offertes.</p>
                    <p>Zorg dat het briefpapier marges heeft voor de inhoud (bijv. 4cm links, 3cm rechts, 4cm boven/onder).</p>
                </div>
            </div>

            {/* Error message */}
            {status === 'error' && (
                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-xs font-bold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {errorMsg}
                </div>
            )}

            {/* Save button */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">
                    {enabled ? '✓ Actief op alle facturen & offertes' : '✗ Momenteel uitgeschakeld'}
                </p>
                <button
                    onClick={handleSave}
                    disabled={isPending}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        status === 'saved'
                            ? 'bg-[#0df2a2] text-black'
                            : 'bg-[#0df2a2] hover:bg-white text-black shadow-[0_0_20px_rgba(13,242,162,0.2)]'
                    } disabled:opacity-50`}
                >
                    {isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : status === 'saved' ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Check className="w-4 h-4" />
                    )}
                    {isPending ? 'Opslaan...' : status === 'saved' ? 'Opgeslagen!' : 'Opslaan'}
                </button>
            </div>
        </div>
    )
}
