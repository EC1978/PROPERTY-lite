'use client'

// Latest update: Archiving, Deletion and Inline Editing

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface PropertyDetailViewProps {
    property: any
    userEmail: string
}

interface EditableFieldProps {
    label: string
    value: any
    field: string
    type?: string
    isEditing: boolean
    isEditMode: boolean
    isSaving: boolean
    editValue: any
    setEditValue: (val: any) => void
    onStart: (field: string, val: any) => void
    onCancel: () => void
    onSave: () => void
    children: React.ReactNode
}

function EditableField({
    label,
    value,
    field,
    type = 'text',
    isEditing,
    isEditMode,
    isSaving,
    editValue,
    setEditValue,
    onStart,
    onCancel,
    onSave,
    children
}: EditableFieldProps) {
    if (isEditing) {
        return (
            <div className="flex flex-col gap-2 w-full p-2 bg-white/5 rounded-xl border border-[#0df2a2]/30">
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">{label}</span>
                {type === 'textarea' ? (
                    <textarea
                        className="bg-transparent border-none focus:ring-0 text-white w-full p-0 min-h-[100px]"
                        value={editValue || ''}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                    />
                ) : (
                    <input
                        type={type}
                        className="bg-transparent border-none focus:ring-0 text-white w-full p-0"
                        value={editValue || ''}
                        onChange={(e) => setEditValue(type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && onSave()}
                    />
                )}
                <div className="flex gap-2 justify-end mt-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); onCancel(); }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
                    >
                        Annuleren
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onSave(); }}
                        disabled={isSaving}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[#0df2a2] hover:bg-emerald-400 text-black font-bold transition-colors disabled:opacity-50"
                    >
                        {isSaving ? 'Opslaan...' : 'Opslaan'}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div
            className={`group relative transition-all rounded-xl -mx-2 px-2 py-1 flex flex-col items-start gap-1 ${isEditMode ? 'cursor-pointer hover:bg-white/[0.03] ring-1 ring-[#0df2a2]/20 bg-[#0df2a2]/5' : ''}`}
            onClick={() => isEditMode && onStart(field, value)}
        >
            {children}
            {isEditMode && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0df2a2] text-black rounded-full p-1 shadow-lg">
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                </div>
            )}
        </div>
    )
}

interface BrandedModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (val?: string) => void
    title: string
    message: string
    type?: 'confirm' | 'alert' | 'prompt'
    isDanger?: boolean
    confirmLabel?: string
    cancelLabel?: string
    defaultValue?: string
}

function BrandedModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'confirm',
    isDanger = false,
    confirmLabel,
    cancelLabel = 'Annuleren',
    defaultValue = ''
}: BrandedModalProps) {
    const [promptValue, setPromptValue] = useState(defaultValue)

    useEffect(() => {
        if (isOpen) setPromptValue(defaultValue)
    }, [isOpen, defaultValue])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[1000000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={onClose} />
            <div className="relative bg-[#111] border border-white/5 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 fade-in duration-300">
                <div className="flex flex-col items-center text-center">
                    <div className={`size-16 rounded-2xl flex items-center justify-center mb-6 ${isDanger ? 'bg-red-500/10' : 'bg-[#0df2a2]/10'}`}>
                        <span className={`material-symbols-outlined text-[32px] ${isDanger ? 'text-red-500' : 'text-[#0df2a2]'}`}>
                            {isDanger ? 'report' : (type === 'prompt' ? 'edit_note' : 'info')}
                        </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8">{message}</p>

                    {type === 'prompt' && (
                        <div className="w-full mb-8">
                            <input
                                type="text"
                                className="w-full bg-white/5 border border-white/10 focus:border-[#0df2a2]/50 rounded-2xl px-5 py-4 text-white font-bold transition-all outline-none"
                                value={promptValue}
                                onChange={(e) => setPromptValue(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && onConfirm(promptValue)}
                            />
                        </div>
                    )}

                    <div className="flex flex-col w-full gap-3">
                        <button
                            onClick={() => onConfirm(type === 'prompt' ? promptValue : undefined)}
                            className={`w-full py-4 rounded-2xl font-black transition-all active:scale-[0.98] ${isDanger
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-[#0df2a2] hover:bg-emerald-400 text-black'
                                }`}
                        >
                            {confirmLabel || (type === 'alert' ? 'Begrepen' : (isDanger ? 'Verwijderen' : 'Bevestigen'))}
                        </button>
                        {type !== 'alert' && (
                            <button
                                onClick={onClose}
                                className="w-full py-2 text-gray-500 hover:text-white font-bold text-sm transition-colors"
                            >
                                {cancelLabel}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function PropertyDetailView({ property: initialProperty, userEmail }: PropertyDetailViewProps) {
    const router = useRouter()
    const isAdmin = !!userEmail
    const supabase = createClient()
    const [property, setProperty] = useState(initialProperty)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editingField, setEditingField] = useState<string | null>(null)
    const [editValue, setEditValue] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [newFeature, setNewFeature] = useState({ label: '', value: '' })
    const [isAddingFeature, setIsAddingFeature] = useState(false)
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean
        title: string
        message: string
        onConfirm: (val?: string) => void
        type: 'confirm' | 'alert' | 'prompt'
        isDanger?: boolean
        confirmLabel?: string
        defaultValue?: string
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'confirm'
    })

    const allImages: string[] = property.images?.length
        ? property.images
        : property.image_url
            ? [property.image_url]
            : []

    const [activeIndex, setActiveIndex] = useState(0)
    const [showGallery, setShowGallery] = useState(false)

    const features = property.features || {}

    const [displayOrder, setDisplayOrder] = useState<string[]>([])
    const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null)

    // Initialize display order
    useEffect(() => {
        const defaultOrder = [
            'address', 'city', 'price', 'surface_area', 'bedrooms', 'bathrooms',
            'energy_label', 'energy', 'constructionYear', 'type', 'layout', 'maintenance', 'surroundings'
        ]
        const savedOrder = features.feature_order || []

        const currentKeys = [
            'address', 'city', 'price', 'surface_area', 'bedrooms', 'bathrooms',
            ...Object.keys(features).filter(k => k !== 'feature_order')
        ]

        // Ensure all current keys are in the order, starting with saved ones
        const mergedOrder = [
            ...savedOrder.filter((k: string) => currentKeys.includes(k)),
            ...currentKeys.filter(k => !savedOrder.includes(k))
        ]

        // If it's a new property or empty, use a sensible default
        if (mergedOrder.length === 0) {
            setDisplayOrder(defaultOrder.filter(k => currentKeys.includes(k)))
        } else {
            setDisplayOrder([...new Set(mergedOrder)])
        }
    }, [property, features])

    const onDragStart = (e: React.DragEvent, index: number) => {
        setDraggedItemIndex(index)
        e.dataTransfer.effectAllowed = 'move'
    }

    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
        if (draggedItemIndex === null || draggedItemIndex === index) return

        const newList = [...displayOrder]
        const item = newList[draggedItemIndex]
        newList.splice(draggedItemIndex, 1)
        newList.splice(index, 0, item)

        setDraggedItemIndex(index)
        setDisplayOrder(newList)
    }

    const onDragEnd = async () => {
        setDraggedItemIndex(null)
        const updatedFeatures = {
            ...property.features,
            feature_order: displayOrder
        }
        await saveField(updatedFeatures, 'features')
    }

    const featureLabels: Record<string, string> = {
        constructionYear: 'Bouwjaar',
        type: 'Woningtype',
        layout: 'Indeling',
        energy: 'Energie & Isolatie',
        energy_label: 'Energielabel',
        maintenance: 'Onderhoud',
        surroundings: 'Omgeving',
    }

    const extractEnergyLabel = (text: string | null): string => {
        if (!text) return '?'
        const match = text.match(/(?:label|energielabel)?\s?([A-G](\+{1,3})?)/i)
        if (match) return match[1].toUpperCase()
        const firstChar = text.trim().charAt(0).toUpperCase()
        if (['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(firstChar)) return firstChar
        return '?'
    }

    const statCards = [
        { key: 'surface_area', label: 'Woonoppervlak', value: property.surface_area ? `${property.surface_area} m²` : 'Onbekend' },
        { key: 'bedrooms', label: 'Slaapkamers', value: property.bedrooms || 'Onbekend' },
        { key: 'bathrooms', label: 'Badkamers', value: property.bathrooms || 'Onbekend' },
        { key: 'energy_label', label: 'Energielabel', value: features.energy_label || extractEnergyLabel(features.energy) },
        { key: 'constructionYear', label: 'Bouwjaar', value: features.constructionYear || 'Onbekend' },
        { key: 'type', label: 'Woningtype', value: features.type || 'Onbekend' },
    ]

    const mediaLinks = [
        { icon: 'smart_display', label: 'Video', value: property.video_url },
        { icon: 'architecture', label: 'Plattegrond', value: property.floorplan_url },
        { icon: 'view_in_ar', label: '360° Tour', value: property.tour_360_url },
        ...(property.custom_links || []).map((l: any) => ({ icon: 'link', label: l.label, value: l.url })),
    ].filter(m => m.value)

    const addressParts = property.address?.split(',') || []
    const streetName = addressParts[0]?.trim() || property.address

    const startEditing = (field: string, value: any) => {
        setEditingField(field)
        setEditValue(value)
    }

    const cancelEditing = () => {
        setEditingField(null)
        setEditValue(null)
    }

    const saveField = async (customValue?: any, customField?: string) => {
        const fieldToSave = customField || editingField
        const valueToSave = customValue !== undefined ? customValue : editValue

        if (!fieldToSave) return
        setIsSaving(true)

        try {
            let updateData: any = {}

            // Handle nested features
            if (['energy', 'energy_label', 'constructionYear', 'type', 'layout', 'maintenance', 'surroundings'].includes(fieldToSave) || (customField && (customField === 'features' || !property.hasOwnProperty(customField)))) {
                if (customField === 'features') {
                    updateData = { features: valueToSave }
                } else {
                    updateData = {
                        features: {
                            ...property.features,
                            [fieldToSave]: valueToSave
                        }
                    }
                }
            } else {
                updateData = { [fieldToSave]: valueToSave }
            }

            const { error } = await supabase
                .from('properties')
                .update(updateData)
                .eq('id', property.id)

            if (error) throw error

            setProperty({ ...property, ...updateData })
            setEditingField(null)
            setEditValue(null)
        } catch (error) {
            console.error('Error saving field:', error)
            setModalConfig({
                isOpen: true,
                title: 'Fout bij opslaan',
                message: 'Er is iets misgegaan bij het opslaan van de gegevens. Probeer het opnieuw.',
                type: 'alert',
                onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
            })
        } finally {
            setIsSaving(false)
        }
    }

    const deleteProperty = async () => {
        setModalConfig({
            isOpen: true,
            title: 'Woning verwijderen',
            message: 'Weet je zeker dat je deze woning definitief wilt verwijderen? Dit kan niet ongedaan worden gemaakt.',
            type: 'confirm',
            isDanger: true,
            confirmLabel: 'Definitief verwijderen',
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }))
                setIsSaving(true)
                try {
                    const { error } = await supabase
                        .from('properties')
                        .delete()
                        .eq('id', property.id)

                    if (error) throw error
                    router.push('/properties')
                } catch (error) {
                    console.error('Error deleting property:', error)
                    setModalConfig({
                        isOpen: true,
                        title: 'Fout bij verwijderen',
                        message: 'Er is een fout opgetreden bij het verwijderen van de woning.',
                        type: 'alert',
                        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                    })
                } finally {
                    setIsSaving(false)
                }
            }
        })
    }

    const toggleArchive = async () => {
        const newStatus = property.status === 'archived' ? 'active' : 'archived'
        const label = newStatus === 'archived' ? 'archiveren' : 'activeren'

        setModalConfig({
            isOpen: true,
            title: `Woning ${label}`,
            message: `Weet je zeker dat je deze woning wilt ${label}?`,
            type: 'confirm',
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }))
                setIsSaving(true)
                try {
                    const { error } = await supabase
                        .from('properties')
                        .update({ status: newStatus })
                        .eq('id', property.id)

                    if (error) throw error
                    setProperty({ ...property, status: newStatus })
                } catch (error) {
                    console.error('Error updating status:', error)
                    setModalConfig({
                        isOpen: true,
                        title: 'Fout bij bijwerken',
                        message: 'Er is een fout opgetreden bij het bijwerken van de status.',
                        type: 'alert',
                        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
                    })
                } finally {
                    setIsSaving(false)
                }
            }
        })
    }

    const addImage = async () => {
        setModalConfig({
            isOpen: true,
            title: 'Foto toevoegen',
            message: 'Voer de URL van de nieuwe foto in:',
            type: 'prompt',
            defaultValue: '',
            onConfirm: async (url) => {
                setModalConfig(prev => ({ ...prev, isOpen: false }))
                if (!url) return
                const newImages = [...allImages, url]
                await saveField(newImages, 'images')
            }
        })
    }

    const removeImage = async (index: number) => {
        setModalConfig({
            isOpen: true,
            title: 'Foto verwijderen',
            message: 'Weet je zeker dat je deze foto wilt verwijderen?',
            type: 'confirm',
            isDanger: true,
            onConfirm: async () => {
                setModalConfig(prev => ({ ...prev, isOpen: false }))
                const newImages = allImages.filter((_, i) => i !== index)
                if (activeIndex >= newImages.length && newImages.length > 0) {
                    setActiveIndex(newImages.length - 1)
                }
                await saveField(newImages, 'images')
            }
        })
    }

    const addFeature = async () => {
        if (!newFeature.label || !newFeature.value) return

        const updatedFeatures = {
            ...property.features,
            [newFeature.label]: newFeature.value
        }

        await saveField(updatedFeatures, 'features')
        setNewFeature({ label: '', value: '' })
        setIsAddingFeature(false)
    }

    return (
        <div className="flex min-h-screen bg-[#0a0a0a] text-white font-sans">
            <Sidebar userEmail={userEmail} />

            {/* Mobile header - Visible only on mobile */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 px-4 py-4 flex items-center justify-between">
                <Link href="/properties" className="flex items-center gap-2 text-sm font-bold text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                    Woningen
                </Link>
                <button
                    onClick={() => setIsEditMode(!isEditMode)}
                    className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all ${isEditMode ? 'bg-[#0df2a2] text-black ring-4 ring-[#0df2a2]/20' : 'bg-white/5 text-white border border-white/10'}`}
                >
                    <span className="material-symbols-outlined text-[18px]">{isEditMode ? 'check' : 'edit'}</span>
                    {isEditMode ? 'Klaar' : 'Bewerken'}
                </button>
            </div>

            <main className="flex-1 md:ml-72 pt-20 md:pt-0">

                {/* ── TOP HEADER BAR ── hidden on mobile to avoid duplication */}
                <div className="hidden md:flex items-center justify-between px-6 md:px-8 py-4 border-b border-white/5 bg-[#0a0a0a]">
                    <Link href="/properties" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                        <span className="hidden sm:inline">Alle Woningen</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-[#0df2a2]/10 border border-[#0df2a2]/30 px-3 py-1.5 rounded-full">
                            <span className="material-symbols-outlined text-[#0df2a2] text-[10px] animate-pulse">fiber_manual_record</span>
                            <span className="text-xs font-bold text-[#0df2a2] uppercase tracking-wider">Actief</span>
                        </div>
                        <button
                            onClick={() => setIsEditMode(!isEditMode)}
                            className={`flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl shadow-[0_0_20px_rgba(13,242,162,0.2)] transition-all ${isEditMode ? 'bg-white text-black hover:bg-gray-200' : 'bg-[#0df2a2] hover:bg-emerald-400 text-black'}`}
                        >
                            <span className="material-symbols-outlined text-[18px]">{isEditMode ? 'check' : 'edit'}</span>
                            {isEditMode ? 'Klaar met bewerken' : 'Bewerk Modus'}
                        </button>
                        {!isEditMode && (
                            <Link href={`/properties/${property.id}/ready`} className="hidden sm:flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white text-sm font-bold px-4 py-2 rounded-xl border border-white/10 transition-all">
                                <span className="material-symbols-outlined text-[18px] text-[#0df2a2]">qr_code_2</span>
                                QR-code
                            </Link>
                        )}
                    </div>
                </div>

                {/* ── PAGE CONTENT ── */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10">

                    {isEditMode && (
                        <div className="mb-8 p-4 bg-[#0df2a2]/10 border border-[#0df2a2]/30 rounded-2xl flex items-center gap-4">
                            <div className="size-10 bg-[#0df2a2] text-black rounded-full flex items-center justify-center">
                                <span className="material-symbols-outlined">info</span>
                            </div>
                            <p className="text-sm font-medium text-[#0df2a2]">
                                **Je bent in Bewerk Modus.** Klik op een tekst of icoon om deze direct aan te passen. Alle wijzigingen worden direct opgeslagen.
                            </p>
                        </div>
                    )}

                    {/* ── HERO: TWO-COLUMN ── */}
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

                        {/* LEFT: GALLERY */}
                        <div className="flex-1 lg:max-w-[58%]">
                            <div
                                className="relative rounded-3xl overflow-hidden bg-[#111] aspect-[4/3] cursor-pointer group"
                                onClick={() => !isEditMode && allImages.length > 0 && setShowGallery(true)}
                            >
                                {allImages.length > 0 ? (
                                    <>
                                        <img
                                            src={allImages[activeIndex]}
                                            alt={property.address}
                                            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.02]"
                                        />
                                        {isEditMode && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); removeImage(activeIndex); }}
                                                className="absolute top-5 right-5 size-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        )}
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                        <span className="material-symbols-outlined text-gray-600 text-[80px]">image</span>
                                        <p className="text-gray-600 text-sm">Nog geen foto&apos;s</p>
                                    </div>
                                )}
                                <div className="absolute top-5 left-5">
                                    <span className="bg-[#0df2a2] text-black text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-full">
                                        {property.status === 'active' ? 'Actief Aanbod' : property.status || 'Beschikbaar'}
                                    </span>
                                </div>
                                {!isEditMode && allImages.length > 1 && (
                                    <div className="absolute bottom-5 right-5 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 group-hover:bg-[#0df2a2] group-hover:text-black transition-all">
                                        <span className="material-symbols-outlined text-[14px]">photo_library</span>
                                        {allImages.length} foto&apos;s
                                    </div>
                                )}
                            </div>

                            {/* Thumbnails — better distribution on mobile */}
                            <div className="grid grid-cols-4 sm:flex sm:flex-wrap gap-2 mt-4">
                                {allImages.map((img, i) => (
                                    <div key={i} className="relative group/thumb">
                                        <button
                                            onClick={() => setActiveIndex(i)}
                                            className={`rounded-xl overflow-hidden transition-all border-2 h-14 w-20 flex-shrink-0 ${i === activeIndex
                                                ? 'border-[#0df2a2] ring-2 ring-[#0df2a2]/20'
                                                : 'border-transparent opacity-50 hover:opacity-80'
                                                }`}
                                        >
                                            <img src={img} alt="" className="w-full h-full object-cover" />
                                        </button>
                                        {isEditMode && (
                                            <button
                                                onClick={() => removeImage(i)}
                                                className="absolute -top-1.5 -right-1.5 size-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity"
                                            >
                                                <span className="material-symbols-outlined text-[12px]">close</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {isEditMode && (
                                    <button
                                        onClick={addImage}
                                        className="h-14 w-20 rounded-xl border-2 border-dashed border-white/20 hover:border-[#0df2a2] hover:bg-[#0df2a2]/5 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#0df2a2] transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add_a_photo</span>
                                        <span className="text-[9px] font-bold">ADD</span>
                                    </button>
                                )}
                            </div>

                            {/* Media links */}
                            {mediaLinks.length > 0 && (
                                <div className="flex flex-wrap gap-3 mt-5">
                                    {mediaLinks.map((m, i) => (
                                        <a
                                            key={i}
                                            href={m.value}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#0df2a2]/40 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[#0df2a2] text-[18px]">{m.icon}</span>
                                            {m.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* RIGHT: INFO */}
                        <div className="lg:w-[42%] flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <EditableField
                                    label="Woningtype"
                                    value={features.type}
                                    field="type"
                                    isEditing={editingField === 'type'}
                                    isEditMode={isEditMode}
                                    isSaving={isSaving}
                                    editValue={editValue}
                                    setEditValue={setEditValue}
                                    onStart={startEditing}
                                    onCancel={cancelEditing}
                                    onSave={saveField}
                                >
                                    <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-gray-500 mb-1 block italic opacity-70">
                                        {features.type || 'Woning'}
                                    </span>
                                </EditableField>

                                <EditableField
                                    label="Adres"
                                    value={property.address}
                                    field="address"
                                    isEditing={editingField === 'address'}
                                    isEditMode={isEditMode}
                                    isSaving={isSaving}
                                    editValue={editValue}
                                    setEditValue={setEditValue}
                                    onStart={startEditing}
                                    onCancel={cancelEditing}
                                    onSave={saveField}
                                >
                                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-black leading-[1.1] tracking-tighter text-[#0df2a2] uppercase italic drop-shadow-[0_0_20px_rgba(13,242,162,0.15)] break-words">
                                        {streetName || 'Woning'}
                                    </h1>
                                    <div className="flex items-center gap-2 text-zinc-600 text-[10px] md:text-xs mt-2 font-bold uppercase tracking-widest">
                                        <span className="material-symbols-outlined text-[#0df2a2] text-[16px]">location_on</span>
                                        {property.address}{property.city ? `, ${property.city}` : ''}
                                    </div>
                                </EditableField>

                                <EditableField
                                    label="Prijs"
                                    value={property.price}
                                    field="price"
                                    type="number"
                                    isEditing={editingField === 'price'}
                                    isEditMode={isEditMode}
                                    isSaving={isSaving}
                                    editValue={editValue}
                                    setEditValue={setEditValue}
                                    onStart={startEditing}
                                    onCancel={cancelEditing}
                                    onSave={saveField}
                                >
                                    <div className="mt-6 flex items-baseline gap-3">
                                        <span className="text-4xl md:text-5xl font-black text-[#0df2a2] tracking-tighter">
                                            € {property.price?.toLocaleString() || '0'}
                                        </span>
                                    </div>
                                </EditableField>
                            </div>

                            {/* Stat cards */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {statCards.map((stat, i) => (
                                    <EditableField
                                        key={i}
                                        label={stat.label}
                                        value={['surface_area', 'bedrooms', 'bathrooms'].includes(stat.key) ? property[stat.key] : features[stat.key]}
                                        field={stat.key}
                                        type={['surface_area', 'bedrooms', 'bathrooms'].includes(stat.key) ? 'number' : 'text'}
                                        isEditing={editingField === stat.key}
                                        isEditMode={isEditMode}
                                        isSaving={isSaving}
                                        editValue={editValue}
                                        setEditValue={setEditValue}
                                        onStart={startEditing}
                                        onCancel={cancelEditing}
                                        onSave={saveField}
                                    >
                                        <div className="bg-white/[0.05] border border-white/10 rounded-2xl p-4 flex flex-col gap-1 w-full text-left h-full min-h-[90px] justify-between overflow-hidden">
                                            <span className="text-[10px] uppercase text-gray-500 font-semibold tracking-widest leading-tight">{stat.label}</span>
                                            <span className={`font-bold text-white mt-1 break-words leading-tight ${stat.value.toString().length > 10 ? 'text-sm' : 'text-xl'
                                                }`}>
                                                {stat.value}
                                            </span>
                                        </div>
                                    </EditableField>
                                ))}
                            </div>

                            {/* Quick actions */}
                            <div className="bg-[#111] border border-white/10 rounded-3xl p-6 flex flex-col gap-3">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Snelle Acties</h3>
                                <button
                                    onClick={() => setIsEditMode(!isEditMode)}
                                    className={`flex items-center gap-3 font-bold px-5 py-3.5 rounded-2xl transition-all ${isEditMode ? 'bg-white text-black' : 'bg-[#0df2a2] hover:bg-emerald-400 text-black'}`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">{isEditMode ? 'check' : 'edit'}</span>
                                    {isEditMode ? 'Klaar met bewerken' : 'Alles Direct Bewerken'}
                                </button>
                                <Link href={`/woning/${property.id}`} target="_blank" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-5 py-3.5 rounded-2xl transition-all">
                                    <span className="material-symbols-outlined text-[20px] text-[#0df2a2]">open_in_new</span>
                                    Publieke Pagina Bekijken
                                </Link>
                                <Link href={`/properties/${property.id}/ready`} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-5 py-3.5 rounded-2xl transition-all">
                                    <span className="material-symbols-outlined text-[20px] text-[#0df2a2]">qr_code_2</span>
                                    QR-code & Marketing
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* ── ALL INFO BELOW ── */}
                    <div className="mt-12 space-y-6">

                        {/* Description */}
                        <EditableField
                            label="Omschrijving"
                            value={property.description}
                            field="description"
                            type="textarea"
                            isEditing={editingField === 'description'}
                            isEditMode={isEditMode}
                            isSaving={isSaving}
                            editValue={editValue}
                            setEditValue={setEditValue}
                            onStart={startEditing}
                            onCancel={cancelEditing}
                            onSave={saveField}
                        >
                            <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8 w-full text-left">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="size-8 bg-[#0df2a2]/10 rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[#0df2a2] text-[18px]">notes</span>
                                    </div>
                                    <h3 className="text-base font-bold text-white">Omschrijving</h3>
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed whitespace-pre-line">
                                    {property.description || 'Geen omschrijving beschikbaar.'}
                                </p>
                            </div>
                        </EditableField>

                        {/* Details table */}
                        <div className="bg-[#111] border border-white/5 rounded-3xl overflow-hidden">
                            <div className="flex items-center justify-between p-6 pb-4 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 bg-[#0df2a2]/10 rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[#0df2a2] text-[18px]">home</span>
                                    </div>
                                    <h3 className="text-base font-bold text-white">Woningdetails</h3>
                                </div>
                                {isEditMode && !isAddingFeature && (
                                    <button
                                        onClick={() => setIsAddingFeature(true)}
                                        className="flex items-center gap-2 text-xs font-bold text-[#0df2a2] bg-[#0df2a2]/10 px-3 py-1.5 rounded-lg hover:bg-[#0df2a2]/20 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">add</span>
                                        Kenmerk Toevoegen
                                    </button>
                                )}
                            </div>
                            <div className="divide-y divide-white/5">
                                {isAddingFeature && (
                                    <div className="p-4 bg-[#0df2a2]/5 border-b border-[#0df2a2]/20 flex flex-col sm:flex-row gap-3">
                                        <input
                                            placeholder="Label (bijv. Tuin)"
                                            className="bg-black/40 border border-[#0df2a2]/30 rounded-lg px-3 py-2 text-white text-sm flex-1 outline-none"
                                            value={newFeature.label}
                                            onChange={e => setNewFeature({ ...newFeature, label: e.target.value })}
                                        />
                                        <input
                                            placeholder="Waarde (bijv. 50 m2 op het zuiden)"
                                            className="bg-black/40 border border-[#0df2a2]/30 rounded-lg px-3 py-2 text-white text-sm flex-2 outline-none sm:min-w-[300px]"
                                            value={newFeature.value}
                                            onChange={e => setNewFeature({ ...newFeature, value: e.target.value })}
                                        />
                                        <div className="flex gap-2">
                                            <button onClick={() => setIsAddingFeature(false)} className="px-3 py-2 bg-white/5 rounded-lg text-sm font-bold">Annuleren</button>
                                            <button onClick={addFeature} className="px-5 py-2 bg-[#0df2a2] text-black rounded-lg text-sm font-bold">Toevoegen</button>
                                        </div>
                                    </div>
                                )}

                                {displayOrder.map((key, i) => {
                                    const isHardcoded = ['address', 'city', 'price', 'surface_area', 'bedrooms', 'bathrooms'].includes(key)
                                    let row: any

                                    if (isHardcoded) {
                                        const labelMap: any = { address: 'Adres', city: 'Stad', price: 'Vraagprijs', surface_area: 'Oppervlakte', bedrooms: 'Slaapkamers', bathrooms: 'Badkamers' }
                                        const valueMap: any = {
                                            address: property.address,
                                            city: property.city,
                                            price: property.price ? `€ ${property.price.toLocaleString()}` : null,
                                            surface_area: property.surface_area ? `${property.surface_area} m²` : null,
                                            bedrooms: property.bedrooms,
                                            bathrooms: property.bathrooms
                                        }
                                        row = { key, label: labelMap[key], value: valueMap[key], type: ['price', 'surface_area', 'bedrooms', 'bathrooms'].includes(key) ? 'number' : 'text' }
                                    } else {
                                        row = {
                                            key,
                                            label: featureLabels[key] || key,
                                            value: features[key] as string,
                                            isEnergyLabel: key === 'energy_label',
                                        }
                                    }

                                    if (!row.label && !row.value) return null

                                    return (
                                        <div
                                            key={row.key}
                                            draggable={isEditMode && !editingField}
                                            onDragStart={(e) => onDragStart(e, i)}
                                            onDragOver={(e) => onDragOver(e, i)}
                                            onDragEnd={onDragEnd}
                                            className={`group hover:bg-white/[0.02] transition-colors relative flex items-center ${draggedItemIndex === i ? 'opacity-20' : ''}`}
                                        >
                                            {isEditMode && (
                                                <div className="pl-4 text-gray-600 cursor-grab active:cursor-grabbing">
                                                    <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                                                </div>
                                            )}

                                            <div className="flex-1">
                                                {editingField === row.key ? (
                                                    <div className="px-6 py-2 border-l-2 border-[#0df2a2] bg-[#0df2a2]/5 flex items-center gap-4">
                                                        <span className="text-xs text-gray-500 font-bold w-24 shrink-0 uppercase tracking-wider">{row.label}</span>
                                                        <input
                                                            type={row.type || 'text'}
                                                            className="bg-white/5 border border-[#0df2a2]/30 rounded-lg px-3 py-2 text-white flex-1 focus:ring-1 focus:ring-[#0df2a2] outline-none"
                                                            value={editValue || ''}
                                                            onChange={(e) => setEditValue(row.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                                                            autoFocus
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') saveField()
                                                                if (e.key === 'Escape') cancelEditing()
                                                            }}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={cancelEditing} className="p-2 text-gray-400 hover:text-white"><span className="material-symbols-outlined text-[20px]">close</span></button>
                                                            <button onClick={() => saveField()} className="p-2 text-[#0df2a2] hover:text-emerald-400" disabled={isSaving}><span className="material-symbols-outlined text-[20px]">check</span></button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className={`flex flex-col sm:grid sm:grid-cols-2 px-6 py-5 gap-1 sm:gap-0 ${isEditMode ? 'cursor-pointer bg-[#0df2a2]/5' : ''}`}
                                                        onClick={() => isEditMode && startEditing(row.key, row.type === 'number' ? property[row.key] : row.value)}
                                                    >
                                                        <span className="text-xs sm:text-sm text-gray-500 font-bold sm:font-medium uppercase sm:normal-case tracking-wider sm:tracking-normal">{row.label}</span>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm text-white font-semibold">
                                                                {row.isEnergyLabel ? (
                                                                    <span className="inline-block bg-[#0df2a2]/10 text-[#0df2a2] border border-[#0df2a2]/30 px-3 py-1 rounded-lg text-sm font-bold shadow-[0_0_10px_rgba(13,242,162,0.1)]">
                                                                        {row.value || '?'}
                                                                    </span>
                                                                ) : row.value}
                                                            </span>
                                                            {isEditMode && (
                                                                <span className="material-symbols-outlined text-[14px] text-[#0df2a2] opacity-0 group-hover:opacity-100 transition-opacity">edit</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Dates */}
                        {(property.created_at || property.updated_at) && (
                            <div className="bg-[#111] border border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row gap-6">
                                {property.created_at && (
                                    <div>
                                        <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Aangemaakt op</p>
                                        <p className="text-sm font-bold text-white">{new Date(property.created_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                )}
                                {property.updated_at && (
                                    <div>
                                        <p className="text-[10px] uppercase text-gray-500 font-semibold tracking-wider mb-1">Bijgewerkt op</p>
                                        <p className="text-sm font-bold text-white">{new Date(property.updated_at).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Customer Reviews Section */}
                        {property.reviews && property.reviews.length > 0 && (
                            <div className="bg-[#111] border border-white/5 rounded-3xl p-6 md:p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="size-8 bg-[#0df2a2]/10 rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined text-[#0df2a2] text-[18px]">star</span>
                                    </div>
                                    <h3 className="text-base font-bold text-white">Klantbeoordelingen</h3>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {property.reviews.map((review: any) => (
                                        <div key={review.id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 flex flex-col gap-3 relative overflow-hidden">
                                            {/* Decorative top border */}
                                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#0df2a2]/30 to-transparent"></div>

                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-1">
                                                    {[...Array(5)].map((_, i) => (
                                                        <span key={i} className={`material-symbols-outlined text-[16px] ${i < review.rating ? 'text-[#0df2a2]' : 'text-white/20'}`} style={{ fontVariationSettings: i < review.rating ? "'FILL' 1" : "'FILL' 0" }}>
                                                            star
                                                        </span>
                                                    ))}
                                                </div>
                                                <span className="text-[10px] text-white/40 font-medium">
                                                    {new Date(review.created_at).toLocaleDateString('nl-NL')}
                                                </span>
                                            </div>

                                            {review.feedback_text ? (
                                                <p className="text-sm text-white/80 italic line-clamp-4">"{review.feedback_text}"</p>
                                            ) : (
                                                <p className="text-sm text-white/40 italic">Geen toelichting geschreven.</p>
                                            )}

                                            <div className="pt-3 border-t border-white/10 mt-auto">
                                                <span className="text-xs font-bold text-[#0df2a2]">
                                                    {review.reviewer_name || 'Anoniem'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Admin Beheer Section */}
                        {isAdmin && (
                            <div className="bg-red-500/5 border border-red-500/10 rounded-3xl p-8 mb-12">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="size-8 bg-red-500/10 rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined text-red-500 text-[18px]">settings</span>
                                    </div>
                                    <h3 className="text-base font-bold text-white">Woningbeheer</h3>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={toggleArchive}
                                        disabled={isSaving}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-sm font-bold text-white transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[20px] text-orange-500">
                                            {property.status === 'archived' ? 'unarchive' : 'archive'}
                                        </span>
                                        {property.status === 'archived' ? 'Woning Activeren' : 'Woning Archiveren'}
                                    </button>
                                    <button
                                        onClick={deleteProperty}
                                        disabled={isSaving}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-2xl text-sm font-bold text-red-500 transition-all"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">delete</span>
                                        Woning Verwijderen
                                    </button>
                                </div>
                                <p className="mt-4 text-center text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                                    {property.status === 'archived' ? 'Deze woning is momenteel gearchiveerd' : 'Pas op: verwijderen is definitief'}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Fullscreen Lightbox Gallery */}
            {!isEditMode && showGallery && (
                <div className="fixed inset-0 z-[100] flex bg-black/95 backdrop-blur-sm">
                    {/* Left: vertical thumbnail strip */}
                    <div className="hidden md:flex flex-col gap-2 p-4 overflow-y-auto w-28 bg-black/60 border-r border-white/5 shrink-0">
                        {allImages.map((img, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveIndex(i)}
                                className={`rounded-xl overflow-hidden border-2 aspect-[4/3] w-full shrink-0 transition-all ${i === activeIndex ? 'border-[#0df2a2] ring-2 ring-[#0df2a2]/20' : 'border-transparent opacity-40 hover:opacity-80'
                                    }`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>

                    {/* Right: main image area */}
                    <div className="flex-1 flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
                            <span className="text-sm font-bold text-white">{activeIndex + 1} / {allImages.length}</span>
                            <span className="text-sm text-gray-400 hidden sm:block">{property.address}</span>
                            <button onClick={() => setShowGallery(false)} className="size-10 rounded-full bg-white/5 hover:bg-white/15 flex items-center justify-center text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Image + arrows */}
                        <div className="flex-1 relative flex items-center justify-center p-4">
                            <img
                                src={allImages[activeIndex]}
                                alt={`Foto ${activeIndex + 1}`}
                                className="max-h-full max-w-full object-contain rounded-2xl"
                            />
                            {/* Prev */}
                            {activeIndex > 0 && (
                                <button
                                    onClick={() => setActiveIndex(i => i - 1)}
                                    className="absolute left-6 size-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 flex items-center justify-center text-white transition-all"
                                >
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>
                            )}
                            {/* Next */}
                            {activeIndex < allImages.length - 1 && (
                                <button
                                    onClick={() => setActiveIndex(i => i + 1)}
                                    className="absolute right-6 size-12 rounded-full bg-black/60 hover:bg-black/90 border border-white/10 flex items-center justify-center text-white transition-all"
                                >
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            )}
                        </div>

                        {/* Mobile thumbnails */}
                        <div className="md:hidden flex gap-2 p-3 overflow-x-auto bg-black/40 border-t border-white/5">
                            {allImages.map((img, i) => (
                                <button key={i} onClick={() => setActiveIndex(i)} className={`shrink-0 h-12 w-16 rounded-lg overflow-hidden border-2 transition-all ${i === activeIndex ? 'border-[#0df2a2]' : 'border-transparent opacity-50'}`}>
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <MobileNav />

            {/* Branded Modal Manager */}
            <BrandedModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
                onConfirm={modalConfig.onConfirm}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                isDanger={modalConfig.isDanger}
                confirmLabel={modalConfig.confirmLabel}
                defaultValue={modalConfig.defaultValue}
            />
        </div>
    )
}
