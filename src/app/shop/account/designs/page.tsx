'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'

const DUMMY_DESIGNS = [
    {
        id: 'ds-1',
        title: 'Modern Villa - Gevel Concept',
        type: '3D Render',
        status: 'Concept',
        date: '2026-02-15T10:00:00Z',
        image: ''
    },
    {
        id: 'ds-2',
        title: 'Babacan DL Blokken - Lichtplan',
        type: 'Technisch Ontwerp',
        status: 'Definitief',
        date: '2024-11-05T10:00:00Z',
        image: ''
    }
]

export default function DesignsPage() {
    return (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="mb-2" data-purpose="breadcrumb">
                <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black gap-2">
                    <Link href="/dashboard" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Dashboard</Link>
                    <span className="text-gray-800">/</span>
                    <Link href="/shop" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Shop</Link>
                    <span className="text-gray-800">/</span>
                    <span className="text-[#F8FAFC]">Ontwerpen</span>
                </div>
            </nav>

            {/* Page Title */}
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-white mb-2 underline decoration-[#0df2a2]/30 decoration-4 underline-offset-8">Mijn ontwerpen</h1>
            </div>

            {/* Designs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {DUMMY_DESIGNS.map((design) => (
                    <div
                        key={design.id}
                        className="bg-[#1A1D1C]/20 border border-white/5 rounded-[40px] p-8 backdrop-blur-sm hover:border-[#0df2a2]/30 transition-all group overflow-hidden"
                    >
                        <div className="aspect-video w-full bg-white/5 rounded-3xl mb-8 flex items-center justify-center border border-white/5 overflow-hidden">
                            <span className="material-symbols-outlined text-gray-800 text-[64px] group-hover:scale-110 transition-transform duration-700">brush</span>
                        </div>

                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-black text-white mb-2 group-hover:text-[#0df2a2] transition-colors">{design.title}</h3>
                                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                    <span>{design.type}</span>
                                    <span className="size-1 rounded-full bg-gray-800"></span>
                                    <span>{format(new Date(design.date), 'd MMM yyyy', { locale: nl })}</span>
                                </div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${design.status === 'Definitief' ? 'border-[#0df2a2]/40 text-[#0df2a2] bg-[#0df2a2]/5' : 'border-blue-500/40 text-blue-400 bg-blue-500/5'}`}>
                                {design.status}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                            <button className="text-[11px] font-black uppercase tracking-[0.2em] text-white hover:text-[#0df2a2] transition-colors">Project inzien</button>
                            <span className="material-symbols-outlined text-gray-700 group-hover:text-[#0df2a2] group-hover:translate-x-1 transition-all">arrow_forward</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
