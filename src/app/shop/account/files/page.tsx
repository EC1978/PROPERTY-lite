'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { nl } from 'date-fns/locale'
import { createClient } from '@/utils/supabase/client'
import toast, { Toaster } from 'react-hot-toast'

interface StorageFile {
    id: string;
    name: string;
    size: string;
    type: 'PDF' | 'IMAGE';
    created_at: string;
    category: string;
    thumbnailUrl?: string;
}

export default function FilesPage() {
    const [files, setFiles] = useState<StorageFile[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Preview state
    const [previewFile, setPreviewFile] = useState<{ url: string, type: 'PDF' | 'IMAGE', name: string } | null>(null)
    const [isUploading, setIsUploading] = useState(false)

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

                const imageFiles = formattedFiles.filter(f => f.type === 'IMAGE')
                if (imageFiles.length > 0) {
                    const paths = imageFiles.map(f => `${user.id}/${f.name}`)
                    const { data: signedUrlsData } = await supabase
                        .storage
                        .from('design_uploads')
                        .createSignedUrls(paths, 3600)

                    if (signedUrlsData) {
                        signedUrlsData.forEach((item, index) => {
                            if (!item.error) {
                                imageFiles[index].thumbnailUrl = item.signedUrl
                            }
                        })
                    }
                }

                setFiles(formattedFiles)
            }
        }
        setIsLoading(false)
    }

    useEffect(() => {
        fetchFiles()
    }, [])

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const toastId = toast.loading('Bestand uploaden...')

        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Niet ingelogd')

            const cleanName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')
            
            const { error: uploadError } = await supabase.storage
                .from('design_uploads')
                .upload(`${user.id}/${cleanName}`, file, {
                    upsert: false
                })

            if (uploadError) {
                 if (uploadError.message.includes('already exists') || uploadError.message.includes('Duplicate')) {
                     throw new Error('Bestand met deze naam bestaat al.')
                 }
                 throw uploadError
            }

            toast.success('Bestand succesvol geüpload!', { id: toastId })
            fetchFiles() // Ververs de bestanden lijst
        } catch (error: any) {
            toast.error(error.message || 'Upload mislukt', { id: toastId })
        } finally {
            setIsUploading(false)
            e.target.value = ''
        }
    }

    const handleDelete = async (fileName: string) => {
        if (!confirm(`Weet je zeker dat je ${fileName} wilt verwijderen?`)) return;
        
        const toastId = toast.loading('Bestand verwijderen...');
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Niet ingelogd')

            const { error } = await supabase
                .storage
                .from('design_uploads')
                .remove([`${user.id}/${fileName}`])

            if (error) throw error;

            toast.success('Bestand succesvol verwijderd!', { id: toastId });
            fetchFiles(); // Ververs bestanden
        } catch (error: any) {
            toast.error(error.message || 'Fout bij verwijderen', { id: toastId });
        }
    }

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
            toast.error('Fout bij maken van download link.')
        }
    }

    const handlePreview = async (fileName: string, type: 'PDF' | 'IMAGE') => {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .storage
            .from('design_uploads')
            .createSignedUrl(`${user.id}/${fileName}`, 3600) // 1 uur geldig voor preview

        if (data?.signedUrl) {
            setPreviewFile({ url: data.signedUrl, type, name: fileName })
        } else {
            toast.error('Kan preview niet laden.')
        }
    }

    const filteredFiles = files.filter(file =>
        file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        file.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Toaster position="top-right" />
            
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-4xl font-black tracking-tighter text-white mb-2 underline decoration-[#0df2a2]/30 decoration-4 underline-offset-8">Mijn bestanden</h1>
                
                <label className={`cursor-pointer ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="flex items-center gap-2 bg-[#0df2a2] text-[#0A0A0A] px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(13,242,162,0.15)] active:scale-95">
                        <span className={`material-symbols-outlined text-[18px] ${isUploading ? 'animate-spin' : ''}`}>
                            {isUploading ? 'sync' : 'upload'}
                        </span>
                        {isUploading ? 'Uploaden...' : 'Bestand Uploaden'}
                    </div>
                    <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileUpload} 
                        disabled={isUploading}
                        accept=".pdf,.png,.jpg,.jpeg,.svg,.ai,.eps,.psd"
                    />
                </label>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-64 bg-white/5 rounded-[32px] animate-pulse"></div>
                    ))}
                </div>
            ) : filteredFiles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredFiles.map((file) => (
                        <div
                            key={file.id}
                            className="bg-[#1A1D1C]/20 border border-white/5 rounded-[32px] p-4 backdrop-blur-sm hover:border-[#0df2a2]/30 transition-all group overflow-hidden flex flex-col justify-between"
                        >
                            <div className="h-40 w-full mb-4 bg-white/5 rounded-2xl overflow-hidden relative group/image">
                                {file.type === 'IMAGE' && file.thumbnailUrl ? (
                                    <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover group-hover/image:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center">
                                        <span className="material-symbols-outlined text-[#0df2a2] text-5xl mb-2 opacity-50">
                                            {file.type === 'PDF' ? 'picture_as_pdf' : 'image'}
                                        </span>
                                        <span className="text-[10px] uppercase font-black tracking-widest text-[#0df2a2]/50">{file.type}</span>
                                    </div>
                                )}
                                
                                {/* Overlay acties */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 flex items-center justify-center gap-2 transition-opacity duration-300">
                                    <button onClick={() => handlePreview(file.name, file.type)} className="size-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#0df2a2] hover:text-black transition-colors" title="Bekijken">
                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                    </button>
                                    <button onClick={() => handleDownload(file.name)} className="size-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-[#0df2a2] hover:text-black transition-colors" title="Downloaden">
                                        <span className="material-symbols-outlined text-[18px]">download</span>
                                    </button>
                                    <button onClick={() => handleDelete(file.name)} className="size-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors" title="Verwijderen">
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h3 
                                    className="font-bold text-white group-hover:text-[#0df2a2] transition-colors truncate cursor-pointer text-sm"
                                    onClick={() => handlePreview(file.name, file.type)}
                                    title={file.name}
                                >
                                    {file.name}
                                </h3>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[9px] text-gray-500 font-black uppercase tracking-widest">
                                        <span className="truncate max-w-[80px]">{file.category}</span>
                                        <span className="size-1 rounded-full bg-gray-800"></span>
                                        <span>{file.size}</span>
                                    </div>
                                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-widest" suppressHydrationWarning>
                                        {format(new Date(file.created_at), 'dd/MM/yyyy')}
                                    </span>
                                </div>
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

            {/* Preview Modal */}
            {previewFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-[#1A1D1C] border border-white/10 rounded-[32px] w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
                        {/* Header */}
                        <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between shrink-0">
                            <h3 className="text-xl font-black text-white tracking-tight truncate pr-4">{previewFile.name}</h3>
                            <div className="flex items-center gap-2 shrink-0">
                                <button 
                                    onClick={() => window.open(previewFile.url, '_blank')}
                                    className="size-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                                    title="Download"
                                >
                                    <span className="material-symbols-outlined text-white text-sm">download</span>
                                </button>
                                <button 
                                    onClick={() => setPreviewFile(null)} 
                                    className="size-10 bg-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                                    title="Sluiten"
                                >
                                    <span className="material-symbols-outlined text-white">close</span>
                                </button>
                            </div>
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 overflow-hidden bg-black/50 p-4 flex justify-center items-center">
                            {previewFile.type === 'PDF' ? (
                                <iframe 
                                    src={`${previewFile.url}#toolbar=0`} 
                                    className="w-full h-full rounded-2xl bg-white" 
                                    title={previewFile.name}
                                />
                            ) : (
                                <img 
                                    src={previewFile.url} 
                                    alt={previewFile.name} 
                                    className="max-w-full max-h-full object-contain rounded-2xl"
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


