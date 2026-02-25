'use client'

import { useState } from 'react'
import { updateOfficeDetails } from './actions'
import toast from 'react-hot-toast'

export default function OfficeDetails({ user }: { user?: any }) {
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)

    const meta = user?.user_metadata || {}
    const defaultName = meta.office_name || 'De Vries Makelaardij B.V.'
    const defaultAddress = meta.office_address || 'Keizersgracht 123, Amsterdam'
    const defaultWebsite = meta.office_website || 'www.devries.nl'

    const [name, setName] = useState(defaultName)
    const [address, setAddress] = useState(defaultAddress)
    const [website, setWebsite] = useState(defaultWebsite)

    const handleSave = async () => {
        setIsSaving(true)
        const formData = new FormData()
        formData.append('name', name)
        formData.append('address', address)
        formData.append('website', website)

        const res = await updateOfficeDetails(formData)
        setIsSaving(false)

        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success('Kantoorgegevens bijgewerkt')
            setIsEditing(false)
        }
    }

    return (
        <div className="bg-[#161616]/60 backdrop-blur-md rounded-3xl overflow-hidden border border-white/10 shadow-lg transition-all duration-300">
            <div className="px-5 py-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#0df2a2]">apartment</span>
                    Kantoorgegevens
                </h3>
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="text-xs font-semibold text-[#0df2a2] hover:text-white transition-colors active:scale-95">Beheer</button>
                ) : (
                    <div className="flex gap-2">
                        <button onClick={() => setIsEditing(false)} disabled={isSaving} className="text-xs font-semibold text-gray-500 hover:text-gray-300 transition-colors active:scale-95">Annuleren</button>
                        <button onClick={handleSave} disabled={isSaving} className="text-xs font-semibold text-[#0df2a2] hover:text-white transition-colors active:scale-95 px-2 py-0.5 bg-[#0df2a2]/10 rounded-md">{isSaving ? 'Opslaan...' : 'Opslaan'}</button>
                    </div>
                )}
            </div>

            {!isEditing ? (
                <div className="p-5 flex items-center gap-4 hover:bg-white/[0.02] transition-colors cursor-default group">
                    <div className="w-14 h-14 bg-white/5 group-hover:bg-white/10 transition-colors rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                        <span className="material-symbols-outlined text-[28px] text-gray-400 group-hover:text-[#0df2a2] transition-colors">domain</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-white leading-tight truncate">{defaultName}</p>
                        <p className="text-xs text-gray-400 mt-1 truncate">{defaultAddress}</p>
                        {defaultWebsite && (
                            <a href={`https://${defaultWebsite.replace('https://', '')}`} target="_blank" rel="noreferrer" className="text-xs text-[#0df2a2] mt-1 inline-flex items-center gap-1 hover:underline transition-all">
                                {defaultWebsite}
                                <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                            </a>
                        )}
                    </div>
                </div>
            ) : (
                <div className="p-5 flex flex-col gap-4 bg-white/[0.01] animate-in fade-in slide-in-from-top-2 duration-300 border-t border-white/5">
                    <div>
                        <label className="text-xs text-gray-400 font-medium mb-1 block">Kantoornaam</label>
                        <input
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] text-white text-sm rounded-xl py-2 px-3 outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-medium mb-1 block">Adres</label>
                        <input
                            type="text"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="Straatnaam 1, Stad"
                            className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] text-white text-sm rounded-xl py-2 px-3 outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 font-medium mb-1 block">Website Link</label>
                        <input
                            type="text"
                            value={website}
                            onChange={e => setWebsite(e.target.value)}
                            placeholder="www.jouwwebsite.nl"
                            className="w-full bg-[#0A0A0A] border border-white/10 focus:border-[#0df2a2] focus:ring-1 focus:ring-[#0df2a2] text-white text-sm rounded-xl py-2 px-3 outline-none transition-colors"
                        />
                    </div>
                </div>
            )}
        </div>
    )
}
