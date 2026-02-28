'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { createClient } from '@/utils/supabase/client'

interface StorageFile {
    id: string;
    name: string;
    size: string;
    type: string;
    created_at: string;
    category: string;
}

export default function FilesPage() {
    const [files, setFiles] = useState<StorageFile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const fetchFiles = async () => {
        setIsLoading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
            // List files in the user's directory in the design_uploads bucket
            const { data, error } = await supabase
                .storage
                .from('design_uploads')
                .list(user.id, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'created_at', order: 'desc' },
                })

            if (data) {
                const formattedFiles: StorageFile[] = data.map(f => ({
                    id: f.id,
                    name: f.name,
                    size: formatBytes(f.metadata?.size || 0),
                    type: f.name.toLowerCase().endsWith('.pdf') ? 'PDF' : 'IMAGE',
                    created_at: f.created_at,
                    category: 'Ontwerp' // Default for this bucket
                }))
                setFiles(formattedFiles)
            }
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchFiles()
    }, [])

    const handleDownload = async (fileName: string) => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .storage
            .from('design_uploads')
            .createSignedUrl(`${user.id}/${fileName}`, 60)

        if (data?.signedUrl) {
            window.open(data.signedUrl, '_blank')
        } else {
            alert('Fout bij maken van download link.')
        }
    }

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Breadcrumbs */}
            <nav className="mb-2" data-purpose="breadcrumb">
                <div className="flex items-center text-[10px] uppercase tracking-[0.2em] text-gray-500 font-black gap-2">
                    <Link href="/dashboard" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Dashboard</Link>
                    <span className="text-gray-800">/</span>
                    <Link href="/shop" className="hover:text-[#0df2a2] transition-colors cursor-pointer">Shop</Link>
                    <span className="text-gray-800">/</span>
                    <span className="text-[#F8FAFC]">Bestanden</span>
                </div>
            </nav>

            {/* Page Title */}
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-white mb-2 underline decoration-[#0df2a2]/30 decoration-4 underline-offset-8">Mijn bestanden</h1>
            </div>

            {/* Search Header */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-gray-500 group-focus-within:text-[#0df2a2] transition-colors">search</span>
                </div>
                <input
                    type="text"
                    placeholder="Zoek in bestanden..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-full pl-16 pr-6 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#0df2a2]/20 focus:border-[#0df2a2]/30 transition-all placeholder:text-gray-600"
                    suppressHydrationWarning
                />
            </div>

            {/* Files Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-white/5 rounded-[32px] animate-pulse"></div>
                    ))}
                </div>
            ) : filteredFiles.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredFiles.map((file) => (
                        <div
                            key={file.id}
                            className="bg-[#1A1D1C]/20 border border-white/5 rounded-[32px] p-6 backdrop-blur-sm hover:border-[#0df2a2]/30 transition-all group relative overflow-hidden"
                        >
                            <div className="flex items-start justify-between mb-6">
                                <div className="size-14 bg-white/5 rounded-2xl flex items-center justify-center group-hover:bg-[#0df2a2]/10 transition-colors">
                                    <span className="material-symbols-outlined text-[#0df2a2] text-[32px]">
                                        {file.type === 'PDF' ? 'picture_as_pdf' : 'image'}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDownload(file.name)}
                                    className="text-gray-500 hover:text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined">download</span>
                                </button>
                            </div>

                            <div className="space-y-1">
                                <h3 className="font-bold text-white group-hover:text-[#0df2a2] transition-colors truncate">{file.name}</h3>
                                <div className="flex items-center gap-3 text-[10px] text-gray-500 font-black uppercase tracking-widest">
                                    <span>{file.category}</span>
                                    <span className="size-1 rounded-full bg-gray-800"></span>
                                    <span>{file.size}</span>
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-white/5 flex items-center justify-between">
                                <span className="text-[11px] text-gray-600 font-medium" suppressHydrationWarning>
                                    {format(new Date(file.created_at), 'd MMM yyyy', { locale: nl })}
                                </span>
                                <button
                                    onClick={() => handleDownload(file.name)}
                                    className="text-[10px] font-black uppercase tracking-widest text-[#0df2a2]/60 group-hover:text-[#0df2a2] transition-colors"
                                >
                                    Openen
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/5 rounded-[40px] border border-dashed border-white/10">
                    <span className="material-symbols-outlined text-6xl text-gray-800 mb-4 block">folder_open</span>
                    <p className="text-gray-500 font-bold">Geen bestanden gevonden.</p>
                </div>
            )}
        </div>
    )
}
