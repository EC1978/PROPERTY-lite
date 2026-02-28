'use client'

import React, { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import MobileMenu from '@/components/layout/MobileMenu'
import MaterialCard from '@/components/materials/MaterialCard'
import LinkPropertyModal from '@/components/materials/LinkPropertyModal'
import AddMaterialModal from '@/components/materials/AddMaterialModal'
import ScansPerPropertyModal from '@/components/materials/ScansPerPropertyModal'
import { createClient } from '@/utils/supabase/client'
import { getMaterials, getActiveProperties, linkMaterialToProperty, createMaterial, deleteMaterial, updateMaterialImage, updateMaterialName } from './actions'

interface Material {
    id: string
    name: string
    type: string
    image_url?: string
    active_property_id: string | null
    property_address?: string
}

interface Property {
    id: string
    address: string
}

export default function MaterialsPage() {
    const [materials, setMaterials] = useState<Material[]>([])
    const [properties, setProperties] = useState<Property[]>([])
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isScanModalOpen, setIsScanModalOpen] = useState(false)
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'linked' | 'storage'>('all')
    const [userEmail, setUserEmail] = useState<string>('')
    const supabase = createClient()

    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserEmail(user.email || '')
        }
        getUser()
        loadData()
    }, [])

    async function loadData() {
        setIsLoading(true)
        const [mats, props] = await Promise.all([
            getMaterials(),
            getActiveProperties()
        ])
        setMaterials(mats)
        setProperties(props)
        setIsLoading(false)
    }

    const filteredMaterials = materials.filter(m => {
        if (filter === 'linked') return !!m.active_property_id
        if (filter === 'storage') return !m.active_property_id
        return true
    })

    const handleLinkClick = (materialId: string) => {
        const mat = materials.find(m => m.id === materialId)
        if (mat) {
            setSelectedMaterial(mat)
            setIsLinkModalOpen(true)
        }
    }

    const handleConfirmLink = async (propertyId: string | null) => {
        if (!selectedMaterial) return

        try {
            await linkMaterialToProperty(selectedMaterial.id, propertyId)
            setIsLinkModalOpen(false)
            loadData()
        } catch (error) {
            alert('Fout bij het koppelen van materiaal.')
        }
    }

    const handleAddMaterial = async (data: { id: string, name: string, type: string, image_url: string }) => {
        try {
            await createMaterial(data)
            setIsAddModalOpen(false)
            loadData()
        } catch (error: any) {
            alert(`Fout bij het toevoegen: ${error.message || 'Onbekende fout'}`)
        }
    }

    const handleDeleteMaterial = async (materialId: string) => {
        try {
            await deleteMaterial(materialId)
            setIsLinkModalOpen(false)
            loadData()
        } catch (error: any) {
            alert(`Fout bij het verwijderen: ${error.message || 'Onbekende fout'}`)
        }
    }

    const handleUpdateImage = async (imageUrl: string) => {
        if (!selectedMaterial) return
        try {
            await updateMaterialImage(selectedMaterial.id, imageUrl)
            // Update local state to reflect change immediately in the modal preview
            setSelectedMaterial(prev => prev ? { ...prev, image_url: imageUrl } : null)
            loadData()
        } catch (error: any) {
            alert(`Fout bij het bijwerken van afbeelding: ${error.message || 'Onbekende fout'}`)
        }
    }

    const handleUpdateName = async (newName: string) => {
        if (!selectedMaterial) return
        try {
            await updateMaterialName(selectedMaterial.id, newName)
            setSelectedMaterial(prev => prev ? { ...prev, name: newName } : null)
            loadData()
        } catch (error: any) {
            alert(`Fout bij het bijwerken van naam: ${error.message || 'Onbekende fout'}`)
        }
    }

    const handleShowScans = (materialId: string) => {
        const mat = materials.find(m => m.id === materialId)
        if (mat) {
            setSelectedMaterial(mat)
            setIsScanModalOpen(true)
        }
    }

    return (
        <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-[#050505] text-slate-800 dark:text-slate-100 font-sans overflow-x-hidden">
            <Sidebar userEmail={userEmail} />

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-[50] bg-white dark:bg-[#050505] border-b border-gray-200 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MobileMenu userEmail={userEmail} />
                    <span className="font-bold text-lg tracking-tight">Materialen</span>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 ml-0 md:ml-72 p-4 pt-24 md:p-10 md:pt-12 pb-32 md:pb-12 w-full transition-all duration-300">
                <div className="max-w-[1400px] mx-auto">
                    {/* Header Section */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
                        <div className="space-y-2">
                            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">Mijn <span className="text-[#0df2a2]">Materialen</span></h1>
                            <p className="text-gray-500 dark:text-gray-400 font-bold text-xs md:text-sm uppercase tracking-[0.2em] opacity-80">Beheer je fysieke makelaarsborden en QR-codes.</p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                            {/* Filter Pills */}
                            <div className="flex p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/5">
                                <button
                                    onClick={() => setFilter('all')}
                                    className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filter === 'all'
                                        ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
                                        }`}
                                >
                                    Alles ({materials.length})
                                </button>
                                <button
                                    onClick={() => setFilter('linked')}
                                    className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filter === 'linked'
                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                        : 'text-gray-400 hover:text-emerald-500'
                                        }`}
                                >
                                    Locatie
                                </button>
                                <button
                                    onClick={() => setFilter('storage')}
                                    className={`px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${filter === 'storage'
                                        ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                        : 'text-gray-400 hover:text-amber-500'
                                        }`}
                                >
                                    Opslag
                                </button>
                            </div>

                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="bg-[#0df2a2] text-black hover:bg-emerald-400 px-8 py-4 rounded-2xl font-black shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 shrink-0"
                            >
                                <span className="material-symbols-outlined text-[22px]">add_circle</span>
                                <span className="hidden sm:inline">Materiaal Toevoegen</span>
                                <span className="sm:hidden">Toevoegen</span>
                            </button>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-96 bg-gray-200 dark:bg-white/5 rounded-[2.5rem]" />
                            ))}
                        </div>
                    ) : filteredMaterials.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8 transition-all">
                            {filteredMaterials.map(material => (
                                <MaterialCard
                                    key={material.id}
                                    material={material}
                                    onLink={handleLinkClick}
                                    onShowScans={handleShowScans}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-24 md:py-40 bg-white dark:bg-[#111] rounded-[3.5rem] border border-gray-200 dark:border-white/5 shadow-2xl relative overflow-hidden group">
                            {/* Decorative Background Icon */}
                            <span className="absolute -bottom-10 -right-10 material-symbols-outlined text-[300px] text-emerald-500/5 rotate-12 -z-10 select-none">
                                {filter === 'all' ? 'inventory' : filter === 'linked' ? 'home_work' : 'inventory_2'}
                            </span>

                            <div className="size-24 bg-[#0df2a2]/10 dark:bg-[#0df2a2]/5 rounded-[2rem] flex items-center justify-center mx-auto mb-8 transition-transform group-hover:scale-110 duration-500">
                                <span className="material-symbols-outlined text-[#0df2a2] text-[48px]">
                                    {filter === 'all' ? 'inventory' : filter === 'linked' ? 'home_work' : 'inventory_2'}
                                </span>
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">
                                {filter === 'linked' ? 'Niets gekoppeld' : filter === 'storage' ? 'Opslag is leeg' : 'Geen materialen'}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-10 font-medium px-6">
                                {filter === 'linked'
                                    ? 'Je hebt momenteel geen materialen op locatie staan.'
                                    : filter === 'storage'
                                        ? 'Al je materialen zijn momenteel in gebruik op locatie.'
                                        : 'Voeg je eerste bord of QR-code toe om te beginnen met meten.'}
                            </p>
                            {filter === 'all' && (
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="bg-gray-900 dark:bg-[#0df2a2] text-white dark:text-black px-12 py-5 rounded-2xl font-black hover:scale-105 transition-all active:scale-95 shadow-2xl shadow-emerald-500/10"
                                >
                                    Start je inventaris
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <MobileNav />

            {isLinkModalOpen && selectedMaterial && (
                <LinkPropertyModal
                    key={`link-modal-${selectedMaterial.id}-${isLinkModalOpen}`}
                    isOpen={isLinkModalOpen}
                    onClose={() => setIsLinkModalOpen(false)}
                    onConfirm={handleConfirmLink}
                    properties={properties}
                    materialName={selectedMaterial.name}
                    currentPropertyId={selectedMaterial.active_property_id}
                    currentImageUrl={selectedMaterial.image_url}
                    onDelete={() => handleDeleteMaterial(selectedMaterial.id)}
                    onUpdateImage={handleUpdateImage}
                    onUpdateName={handleUpdateName}
                    onShowScans={() => handleShowScans(selectedMaterial.id)}
                />
            )}

            <AddMaterialModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onConfirm={handleAddMaterial}
            />

            {isScanModalOpen && selectedMaterial && (
                <ScansPerPropertyModal
                    isOpen={isScanModalOpen}
                    onClose={() => setIsScanModalOpen(false)}
                    materialId={selectedMaterial.id}
                    materialName={selectedMaterial.name}
                />
            )}
        </div>
    )
}
