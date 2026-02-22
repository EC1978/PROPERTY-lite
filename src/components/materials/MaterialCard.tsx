import React, { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface Material {
    id: string
    name: string
    type: string
    image_url?: string
    active_property_id: string | null
    property_address?: string
}

interface MaterialCardProps {
    material: Material
    onLink: (id: string) => void
}

export default function MaterialCard({ material, onLink }: MaterialCardProps) {
    const [showQR, setShowQR] = useState(false)
    const isLinked = !!material.active_property_id
    const qrUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/qr/${material.id}`
        : `/qr/${material.id}`

    return (
        <div className="group relative bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-500">
            {/* Image Header */}
            <div
                onClick={() => onLink(material.id)}
                className="h-48 relative bg-gray-100 dark:bg-white/5 overflow-hidden cursor-pointer"
            >
                {material.image_url ? (
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                        style={{ backgroundImage: `url("${material.image_url}")` }}
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <span className="material-symbols-outlined text-[64px]">image</span>
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border ${isLinked
                        ? 'bg-emerald-500/90 text-white border-emerald-400/30 shadow-lg shadow-emerald-500/20'
                        : 'bg-black/40 text-gray-200 border-white/10'
                        }`}>
                        {isLinked ? 'Gekoppeld' : 'In Opslag'}
                    </div>
                </div>

                {/* QR Toggle Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setShowQR(!showQR)
                    }}
                    className="absolute top-4 right-4 z-20 size-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-emerald-500 transition-colors"
                    title="Toon QR Code"
                >
                    <span className="material-symbols-outlined text-[20px]">qr_code_2</span>
                </button>

                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* QR Overlay */}
                {showQR && (
                    <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
                        <div className="bg-white p-3 rounded-2xl shadow-2xl">
                            <QRCodeSVG value={qrUrl} size={140} />
                        </div>
                        <p className="mt-4 text-[10px] font-black text-white uppercase tracking-[0.2em] text-center">Scan voor Voice AI</p>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowQR(false)
                            }}
                            className="mt-4 text-xs font-bold text-gray-400 hover:text-white transition-colors"
                        >
                            Sluiten
                        </button>
                    </div>
                )}
            </div>

            <div className="p-6 cursor-pointer" onClick={() => onLink(material.id)}>
                <div className="flex justify-between items-start mb-1">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">{material.name}</h3>
                    <div className={`p-2 rounded-xl border ${isLinked ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-gray-100 dark:bg-white/5 border-transparent text-gray-400'}`}>
                        <span className="material-symbols-outlined text-[20px]">
                            {material.type.toLowerCase().includes('bord') ? 'signpost' : 'label'}
                        </span>
                    </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-6">{material.type}</p>

                <div className={`mt-auto p-4 rounded-2xl border ${isLinked
                    ? 'bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/10'
                    : 'bg-gray-50 dark:bg-white/[0.02] border-gray-100 dark:border-white/5'
                    }`}>
                    <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-[20px] ${isLinked ? 'text-emerald-500' : 'text-gray-400'}`}>
                            {isLinked ? 'home_work' : 'inventory_2'}
                        </span>
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Status</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {isLinked ? material.property_address : 'In opslag'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-[11px] font-bold text-gray-400 group-hover:text-emerald-500 transition-colors">
                    <span>ID: {material.id}</span>
                    <div className="flex items-center gap-1">
                        <span>Beheer</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
