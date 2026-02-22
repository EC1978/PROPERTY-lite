'use client'

import React, { useEffect, useState } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import MobileMenu from '@/components/layout/MobileMenu'
import MaterialCard from '@/components/materials/MaterialCard'
import LinkPropertyModal from '@/components/materials/LinkPropertyModal'
import AddMaterialModal from '@/components/materials/AddMaterialModal'
import { getMaterials, getActiveProperties, linkMaterialToProperty, createMaterial, deleteMaterial } from './actions'

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
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState<'all' | 'linked' | 'storage'>('all')

    const userEmail = "demo@voicerealty.ai"

    useEffect(() => {
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
            <main className="flex-1 ml-0 md:ml-72 p-6 pt-28 md:p-10 md:pt-10 pb-32 md:pb-10 w-full">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-3">Mijn Materialen</h1>
                            <p className="text-gray-500 dark:text-gray-400 font-bold text-sm uppercase tracking-wider">Beheer je fysieke makelaarsborden en QR-codes.</p>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-[#0df2a2] text-black hover:bg-emerald-400 px-8 py-4 rounded-2xl font-black shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-3 shrink-0"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            Materiaal Toevoegen
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mb-10">
                        <button
                            onClick={() => setFilter('all')}
                            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${filter === 'all'
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-black shadow-lg shadow-black/10'
                                : 'bg-white dark:bg-white/5 text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-100 dark:border-white/5'
                                }`}
                        >
                            Alles ({materials.length})
                        </button>
                        <button
                            onClick={() => setFilter('linked')}
                            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${filter === 'linked'
                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                : 'bg-white dark:bg-white/5 text-gray-400 hover:text-emerald-500 border border-gray-100 dark:border-white/5'
                                }`}
                        >
                            Op Locatie ({materials.filter(m => !!m.active_property_id).length})
                        </button>
                        <button
                            onClick={() => setFilter('storage')}
                            className={`px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${filter === 'storage'
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                : 'bg-white dark:bg-white/5 text-gray-400 hover:text-amber-500 border border-gray-100 dark:border-white/5'
                                }`}
                        >
                            In Opslag ({materials.filter(m => !m.active_property_id).length})
                        </button>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-80 bg-gray-100 dark:bg-white/5 rounded-3xl" />
                            ))}
                        </div>
                    ) : filteredMaterials.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredMaterials.map(material => (
                                <MaterialCard
                                    key={material.id}
                                    material={material}
                                    onLink={handleLinkClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-32 bg-white dark:bg-[#111] rounded-[3rem] border border-gray-200 dark:border-white/5 shadow-sm border-dashed">
                            <div className="size-24 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-8 ring-1 ring-gray-100 dark:ring-white/10">
                                <span className="material-symbols-outlined text-gray-400 text-[48px]">
                                    {filter === 'all' ? 'inventory' : filter === 'linked' ? 'home_work' : 'inventory_2'}
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3">
                                {filter === 'linked' ? 'Geen gekoppelde materialen' : filter === 'storage' ? 'Geen materialen in opslag' : 'Inventaris is leeg'}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-10 font-bold">
                                {filter === 'linked'
                                    ? 'Er zijn momenteel geen materialen gekoppeld aan een actieve woning.'
                                    : filter === 'storage'
                                        ? 'Alle materialen zijn momenteel gekoppeld aan actieve woningen.'
                                        : 'Je hebt momenteel geen fysieke materialen geregistreerd. Voeg je eerste bord toe om te beginnen.'}
                            </p>
                            {filter === 'all' && (
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white px-10 py-4 rounded-2xl font-black hover:bg-gray-50 dark:hover:bg-white/10 transition-all active:scale-95"
                                >
                                    Eerste materiaal toevoegen
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </main>

            <MobileNav />

            {selectedMaterial && (
                <LinkPropertyModal
                    isOpen={isLinkModalOpen}
                    onClose={() => setIsLinkModalOpen(false)}
                    onConfirm={handleConfirmLink}
                    properties={properties}
                    materialName={selectedMaterial.name}
                    currentPropertyId={selectedMaterial.active_property_id}
                    onDelete={() => handleDeleteMaterial(selectedMaterial.id)}
                />
            )}

            <AddMaterialModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onConfirm={handleAddMaterial}
            />
        </div>
    )
}
