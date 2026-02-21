
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { generateQrCode } from '@/utils/qr'
import Link from 'next/link'
import Image from 'next/image'

export default async function PropertyReadyPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!property) {
        redirect('/dashboard')
    }

    const publicUrl = `https://voicerealty.ai/woning/${id}` // Mock public URL
    const qrCodeUrl = await generateQrCode(publicUrl)

    // Update property with QR code URL if not set (optional, good for caching)
    if (!property.qr_code_url) {
        await supabase.from('properties').update({ qr_code_url: qrCodeUrl }).eq('id', id)
    }

    return (
        <div className="min-h-screen bg-[#F8F9FB] dark:bg-[#050505] flex flex-col items-center justify-center p-4 font-sans text-slate-900 dark:text-white transition-colors duration-300">
            {/* Success Card */}
            <div className="max-w-md w-full glass-panel bg-white dark:bg-[#111] border border-gray-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10 p-8 md:p-10 text-center">
                    <div className="size-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,183,127,0.2)] animate-pulse">
                        <span className="material-symbols-outlined text-emerald-500 text-[40px]">check_circle</span>
                    </div>

                    <h1 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">AI Agent Gereed!</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Je woning staat online en is klaar voor bezoekers.</p>
                </div>

                <div className="relative z-10 p-8 md:p-10 pt-0 space-y-8">
                    {/* QR Code Section */}
                    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-3xl p-8 flex flex-col items-center shadow-inner relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl pointer-events-none"></div>
                        <div className="bg-white p-4 rounded-xl shadow-sm mb-4">
                            <img src={qrCodeUrl} alt="Property QR Code" className="size-40 object-contain mix-blend-multiply dark:mix-blend-normal" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-[#0df2a2] mb-3">Scan om direct te worden verbonden met onze ai agent.</p>
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 px-4 py-2 rounded-xl w-full">
                            <span className="material-symbols-outlined text-gray-400 text-sm">link</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate flex-1 font-mono">{publicUrl}</span>
                            <button className="text-emerald-500 hover:text-emerald-400 transition-colors">
                                <span className="material-symbols-outlined text-sm">content_copy</span>
                            </button>
                        </div>
                    </div>

                    {/* Property Details Preview */}
                    <Link href={`/woning/${id}`} target="_blank" className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 rounded-2xl group cursor-pointer hover:border-emerald-500/30 transition-all">
                        <div className="size-16 rounded-xl bg-gray-200 dark:bg-white/10 flex-shrink-0 bg-cover bg-center overflow-hidden relative">
                            {property.image_url ? (
                                <img src={property.image_url} alt={property.address} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="material-symbols-outlined text-gray-400">image</span>
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-gray-900 dark:text-white truncate group-hover:text-emerald-500 transition-colors">{property.address}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">€ {property.price?.toLocaleString()}</p>
                        </div>
                        <div className="size-8 rounded-full bg-white dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-emerald-500 transition-colors">
                            <span className="material-symbols-outlined text-lg">chevron_right</span>
                        </div>
                    </Link>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/dashboard" className="flex items-center justify-center px-6 py-4 rounded-2xl border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all">
                            Dashboard
                        </Link>
                        <a href={qrCodeUrl} download={`qr-${id}.png`} className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-4 px-6 rounded-2xl transition-all shadow-[0_10px_20px_rgba(16,183,127,0.2)] hover:shadow-[0_15px_30px_rgba(16,183,127,0.3)] hover:-translate-y-0.5">
                            <span className="material-symbols-outlined text-lg">download</span>
                            <span>Download QR</span>
                        </a>
                    </div>
                </div>
            </div>

            <p className="mt-8 text-xs text-gray-400 font-medium opacity-60">VoiceRealty AI © 2026</p>
        </div>
    )
}
