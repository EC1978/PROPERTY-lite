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
        <div className={`group relative bg-white dark:bg-[#111] rounded-3xl border border-gray-200 dark:border-white/5 overflow-hidden transition-all duration-500 ${!showQR ? 'hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1' : ''}`}>
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

            {/* QR Overlay (Full Screen Modal) */}
            {showQR && (
                <div
                    className="fixed inset-0 z-[100000] flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-300"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowQR(false);
                        }}
                    />

                    {/* Modal Content */}
                    <div
                        className="relative w-full max-w-lg bg-white dark:bg-[#111] rounded-[3rem] p-10 md:p-14 shadow-2xl border border-gray-200 dark:border-white/5 flex flex-col items-center animate-in zoom-in slide-in-from-bottom-8 duration-500"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close Button Top Right */}
                        <button
                            onClick={() => setShowQR(false)}
                            className="absolute top-6 right-6 size-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all transform hover:rotate-90"
                        >
                            <span className="material-symbols-outlined text-[24px]">close</span>
                        </button>

                        {/* Title */}
                        <div className="text-center mb-10">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{material.name}</h3>
                            <p className="text-xs text-emerald-500 font-black uppercase tracking-[0.2em] mt-2">QR-Code voor Locatie</p>
                        </div>

                        {/* QR Code Container */}
                        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-500/10 transform hover:scale-105 transition-transform duration-500 border border-gray-100 mb-10">
                            <QRCodeSVG
                                id={`qr-code-${material.id}`}
                                value={qrUrl}
                                size={240}
                                level="H"
                                includeMargin={false}
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-4 w-full max-w-sm">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const svg = document.getElementById(`qr-code-${material.id}`);
                                    if (svg) {
                                        if (!svg.getAttribute('xmlns')) {
                                            svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
                                        }

                                        const svgData = new XMLSerializer().serializeToString(svg);
                                        const canvas = document.createElement("canvas");
                                        const ctx = canvas.getContext("2d");
                                        const img = new Image();

                                        img.onload = () => {
                                            canvas.width = 1500;
                                            canvas.height = 1500;
                                            if (ctx) {
                                                ctx.fillStyle = "white";
                                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                                ctx.drawImage(img, 150, 150, 1200, 1200);

                                                canvas.toBlob((blob) => {
                                                    if (blob) {
                                                        const url = URL.createObjectURL(blob);
                                                        const downloadLink = document.createElement("a");
                                                        downloadLink.download = `QR-${material.name}.png`;
                                                        downloadLink.href = url;
                                                        downloadLink.click();
                                                        setTimeout(() => URL.revokeObjectURL(url), 100);
                                                    }
                                                }, 'image/png');
                                            }
                                        };

                                        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                                        const reader = new FileReader();
                                        reader.onload = () => {
                                            img.src = reader.result as string;
                                        };
                                        reader.readAsDataURL(svgBlob);
                                    }
                                }}
                                className="w-full bg-[#0df2a2] hover:bg-emerald-400 text-[#050505] py-5 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/10 active:scale-95 uppercase tracking-widest"
                            >
                                <span className="material-symbols-outlined text-[20px]">download</span>
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
                                            if (blob && navigator.share) {
                                                const file = new File([blob], `QR-${material.name}.png`, { type: 'image/png' });
                                                await navigator.share({
                                                    files: [file],
                                                    title: `QR Code: ${material.name}`,
                                                    text: `Scan de QR voor Voice AI van ${material.name}`
                                                });
                                            } else {
                                                navigator.clipboard.writeText(qrUrl);
                                                alert('Link gekopieerd!');
                                            }
                                        }
                                    } catch (error) {
                                        navigator.clipboard.writeText(qrUrl);
                                        alert('Link gekopieerd!');
                                    }
                                }}
                                className="w-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white py-5 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 active:scale-95 uppercase tracking-widest"
                            >
                                <span className="material-symbols-outlined text-[20px]">share</span>
                                Delen
                            </button>
                        </div>
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
