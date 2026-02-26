'use client'

import { useState, useRef } from 'react'
import { updateProfile, uploadAvatar } from './actions'
import toast from 'react-hot-toast'

export default function ProfileHeader({ user }: { user: any }) {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isUploading, setIsUploading] = useState(false)

    // Fallbacks
    const meta = user?.user_metadata || {}
    const defaultName = meta.full_name || 'Gebruiker'
    const defaultPhone = meta.phone || ''
    const avatarUrl = meta.avatar_url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDeLpjY6-RVWywYpKg43pfaOu5ofnojxXaICaXUa7qRc8OAapLnpakpQftqOJfnQ9pv_F6WFFZ-Y8ug86N_zZz4gwHsGIPjEy4V1UApv2RVqejIOLU6FS8YgvmDyLrD-En3AhmDiK0J41OBOBQMCDnTOi4zzYZ9X3T8-SWqabpfRHaisoBFF7pBYoZEh6r4tB8m4wPP8NXzZBgMpiTJPfr5P3pJz9Au53J9iQe0YRrXM3XDUDtKaMiYd6BaIG7nYz8sbe_sLrn5dyE'

    const fileInputRef = useRef<HTMLInputElement>(null)

    const [name, setName] = useState(defaultName)
    const [phone, setPhone] = useState(defaultPhone)

    const handleSave = async () => {
        setIsSaving(true)
        const formData = new FormData()
        formData.append('name', name)
        formData.append('phone', phone)

        const res = await updateProfile(formData)
        setIsSaving(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Profiel succesvol bijgewerkt')
            setIsEditing(false)
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsUploading(true)
        const formData = new FormData()
        formData.append('avatar', file)

        const res = await uploadAvatar(formData)
        setIsUploading(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Profielfoto bijgewerkt')
        }
    }

    return (
        <div className="bg-[#0A0A0A] dark:bg-[#161616]/60 backdrop-blur-md rounded-3xl p-6 relative group border border-white/10 shadow-lg">
            <div className="flex justify-between items-start mb-6 w-full">
                <div className="relative">
                    <div className="w-24 h-24 rounded-full p-[2px] bg-gradient-to-tr from-[#0df2a2] to-transparent shrink-0">
                        <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-[#0A0A0A]">
                            <img
                                alt="Avatar"
                                className={`w-full h-full object-cover transition-opacity ${isUploading ? 'opacity-50' : 'opacity-100'}`}
                                src={avatarUrl}
                            />
                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="material-symbols-outlined animate-spin text-white">progress_activity</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-[#0df2a2] text-[#0A0A0A] rounded-full flex items-center justify-center shadow-lg border-2 border-[#0A0A0A] hover:scale-110 active:scale-95 transition-transform cursor-pointer disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                    />
                </div>
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all active:scale-95 shrink-0">
                        <span className="text-xs font-semibold text-[#0df2a2] uppercase tracking-wider hidden sm:inline">Bewerken</span>
                        <span className="material-symbols-outlined text-[14px] text-[#0df2a2]">edit</span>
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditing(false)} disabled={isSaving} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all active:scale-95 shrink-0 disabled:opacity-50">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Annuleren</span>
                        </button>
                        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0df2a2]/10 hover:bg-[#0df2a2]/20 border border-[#0df2a2]/20 rounded-full transition-all active:scale-95 shrink-0 disabled:opacity-50 text-[#0df2a2]">
                            <span className="text-xs font-semibold uppercase tracking-wider">{isSaving ? 'Opslaan...' : 'Opslaan'}</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="flex flex-col gap-1 w-full max-w-sm">
                {!isEditing ? (
                    <>
                        <h2 className="text-2xl font-bold text-white tracking-tight break-all">{defaultName}</h2>
                        <p className="text-gray-400 text-sm font-medium">Beheerder</p>
                        <div className="mt-4 flex flex-col gap-2">
                            <div className="flex items-center gap-3 text-gray-300 w-fit">
                                <span className="material-symbols-outlined text-[18px] text-gray-500">mail</span>
                                <span className="text-sm truncate">{user?.email}</span>
                            </div>
                            {defaultPhone && (
                                <div className="flex items-center gap-3 text-gray-300 w-fit">
                                    <span className="material-symbols-outlined text-[18px] text-gray-500">call</span>
                                    <span className="text-sm">{defaultPhone}</span>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="mt-2 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                        <div>
                            <label className="text-xs text-gray-400 font-medium mb-1 block">Volledige Naam</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] text-white text-sm rounded-xl py-2 px-3 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-medium mb-1 block">Telefoonnummer</label>
                            <input
                                type="text"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="+31 6 12345678"
                                className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] text-white text-sm rounded-xl py-2 px-3 outline-none transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-medium mb-1 block">E-mail (Voor login)</label>
                            <input
                                type="text"
                                disabled
                                value={user?.email || ''}
                                className="w-full bg-white/5 border border-transparent text-gray-400 text-sm rounded-xl py-2 px-3 outline-none cursor-not-allowed"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
