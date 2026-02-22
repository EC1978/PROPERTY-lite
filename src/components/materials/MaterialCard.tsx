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
    onShowScans: (id: string) => void
}

export default function MaterialCard({ material, onLink, onShowScans }: MaterialCardProps) {
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
            </div>

            {/* QR Overlay (Full Card Overlay) */}
            {showQR && (
                <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
                    <div className="bg-white p-4 rounded-[2.5rem] shadow-[0_0_50px_rgba(13,242,162,0.2)] transform hover:scale-105 transition-transform duration-500">
                        <QRCodeSVG id={`qr-code-${material.id}`} value={qrUrl} size={160} />
                    </div>
                    <div className="mt-6 px-4 py-1.5 bg-[#0df2a2]/10 border border-[#0df2a2]/20 rounded-full">
                        <p className="text-[10px] font-black text-[#0df2a2] uppercase tracking-[0.2em] text-center">Scan voor Voice AI</p>
                    </div>

                    <div className="mt-10 flex flex-col gap-3 w-full max-w-[220px]">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                const svg = document.getElementById(`qr-code-${material.id}`);
                                if (svg) {
                                    // Ensure xmlns is present for standalone SVG use
                                    if (!svg.getAttribute('xmlns')) {
                                        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                                    }

                                    const svgData = new XMLSerializer().serializeToString(svg);
                                    const canvas = document.createElement("canvas");
                                    const ctx = canvas.getContext("2d");
                                    const img = new Image();

                                    img.onload = () => {
                                        canvas.width = 1200;
                                        canvas.height = 1200;
                                        if (ctx) {
                                            ctx.fillStyle = "white";
                                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                                            ctx.drawImage(img, 100, 100, 1000, 1000);

                                            canvas.toBlob((blob) => {
                                                if (blob) {
                                                    const url = URL.createObjectURL(blob);
                                                    const downloadLink = document.createElement("a");
                                                    downloadLink.download = `QR-${material.name}.png`;
                                                    downloadLink.href = url;
                                                    downloadLink.click();
                                                    // Cleanup
                                                    setTimeout(() => URL.revokeObjectURL(url), 100);
                                                }
                                            }, 'image/png');
                                        }
                                    };

                                    // Robust base64 encoding for SVG
                                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                                    const reader = new FileReader();
                                    reader.onload = () => {
                                        img.src = reader.result as string;
                                    };
                                    reader.readAsDataURL(svgBlob);
                                }
                            }}
                            className="w-full bg-[#0df2a2] hover:bg-emerald-400 text-[#050505] py-4 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/10 active:scale-95 uppercase tracking-wider"
                        >
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            Download PNG
                        </button>
                        <button
                            onClick={async (e) => {
                                e.stopPropagation();
                                const svg = document.getElementById(`qr-code-${material.id}`);
                                try {
                                    if (!svg) return;
                                    if (!svg.getAttribute('xmlns')) {
                                        svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                                    }
                                    const svgData = new XMLSerializer().serializeToString(svg);
                                    const canvas = document.createElement("canvas");
                                    const ctx = canvas.getContext("2d");
                                    const img = new Image();

                                    await new Promise((resolve, reject) => {
                                        img.onload = resolve;
                                        img.onerror = reject;
                                        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            img.src = reader.result as string;
                                        };
                                        reader.readAsDataURL(svgBlob);
                                    });

                                    canvas.width = 1200;
                                    canvas.height = 1200;
                                    if (ctx) {
                                        ctx.fillStyle = "white";
                                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                                        ctx.drawImage(img, 100, 100, 1000, 1000);

                                        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
                                        if (blob && navigator.share && navigator.canShare?.({ files: [new File([blob], 'qr.png', { type: 'image/png' })] })) {
                                            const file = new File([blob], `QR-${material.name}.png`, { type: 'image/png' });
                                            await navigator.share({
                                                files: [file],
                                                title: `QR Code: ${material.name}`,
                                                text: `Bekijk de Voice AI van ${material.name}`
                                            });
                                        } else {
                                            // Fallback: share the URL if file sharing is not supported
                                            await navigator.share({
                                                title: `QR Code: ${material.name}`,
                                                text: `Bekijk de Voice AI van ${material.name}`,
                                                url: qrUrl
                                            });
                                        }
                                    }
                                } catch (error) {
                                    console.error('Sharing failed:', error);
                                    // Final fallback: copy link
                                    navigator.clipboard.writeText(qrUrl);
                                    alert('Link gekopieerd naar klembord!');
                                }
                            }}
                            className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-2xl text-[11px] font-black transition-all flex items-center justify-center gap-2 active:scale-95 uppercase tracking-wider"
                        >
                            <span className="material-symbols-outlined text-[18px]">share</span>
                            Delen
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowQR(false)
                            }}
                            className="w-full bg-white/5 hover:bg-white/10 text-white/70 hover:text-white py-3 px-4 rounded-xl text-[10px] font-bold tracking-[0.1em] transition-all uppercase flex items-center justify-center"
                        >
                            Sluiten
                        </button>
                    </div>
                </div>
            )}

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

                <div className="mt-4 flex items-center justify-between">
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onShowScans(material.id)
                        }}
                        className="flex items-center gap-1.5 text-[11px] font-black text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-widest"
                    >
                        <span className="material-symbols-outlined text-[18px]">analytics</span>
                        Statistieken
                    </button>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors">
                        <span>Beheer</span>
                        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
