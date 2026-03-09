'use client'

import React from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QRModalProps {
    isOpen: boolean
    onClose: () => void
    material: {
        id: string
        name: string
    }
}

export default function QRModal({ isOpen, onClose, material }: QRModalProps) {
    const [isCopied, setIsCopied] = React.useState(false)

    if (!isOpen) return null

    const qrUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/qr/${material.id}`
        : `/qr/${material.id}`

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();

        // Try native share first (only text/url)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `QR Code: ${material.name}`,
                    text: `Scan deze QR-code om de Voice AI van deze woning te bekijken:`,
                    url: qrUrl
                });
                return;
            } catch (error) {
                // If user cancels or share fails, we continue to clipboard
                console.log('Share canceled or failed, falling back to clipboard');
            }
        }

        // Fallback: Copy URL to clipboard
        try {
            await navigator.clipboard.writeText(qrUrl);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Clipboard error:', err);
            // Last resort: old school approach
            const textArea = document.createElement("textarea");
            textArea.value = qrUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100000] flex flex-col items-center justify-center p-4 md:p-8 animate-in fade-in duration-150"
            onClick={(e) => {
                e.stopPropagation();
                onClose();
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" />

            {/* Modal Content */}
            <div
                className="relative w-full max-w-lg bg-white dark:bg-[#111] rounded-[3rem] p-10 md:p-14 shadow-2xl border border-gray-200 dark:border-white/5 flex flex-col items-center animate-in zoom-in-95 slide-in-from-bottom-2 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 size-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all transform hover:rotate-90"
                >
                    <span className="material-symbols-outlined text-[24px]">close</span>
                </button>

                {/* Title */}
                <div className="text-center mb-10">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{material.name}</h3>
                    <p className="text-xs text-[#0df2a2] font-black uppercase tracking-[0.2em] mt-2 italic">QR-Code voor Locatie</p>
                </div>

                {/* QR Code */}
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-500/10 transform hover:scale-105 transition-transform duration-500 border border-gray-100 mb-10">
                    <QRCodeSVG
                        id={`qr-code-${material.id}`}
                        value={qrUrl}
                        size={240}
                        level="H"
                        includeMargin={false}
                    />
                </div>

                {/* Actions */}
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
                                reader.onload = () => { img.src = reader.result as string; };
                                reader.readAsDataURL(svgBlob);
                            }
                        }}
                        className="w-full bg-[#0df2a2] hover:bg-emerald-400 text-[#050505] py-5 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/10 active:scale-95 uppercase tracking-widest"
                    >
                        <span className="material-symbols-outlined text-[20px]">download</span>
                        Download PNG
                    </button>

                    <button
                        onClick={handleShare}
                        className={`w-full py-5 rounded-2xl text-sm font-black transition-all flex items-center justify-center gap-3 active:scale-95 uppercase tracking-widest ${isCopied
                            ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                            : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-900 dark:text-white'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">
                            {isCopied ? 'check_circle' : 'share'}
                        </span>
                        {isCopied ? 'Link Gekopieerd!' : 'Delen'}
                    </button>
                </div>
            </div>
        </div>
    )
}
