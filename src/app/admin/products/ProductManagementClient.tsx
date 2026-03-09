'use client'

import { useState, useEffect } from 'react'
import {
    Plus, Search, Edit2, Trash2, Package,
    X, ChevronRight, Image as ImageIcon,
    AlertCircle, Check, Trash, GripVertical, Eye, EyeOff, Copy, CheckCircle2
} from 'lucide-react'
import { createProduct, updateProduct, deleteProduct } from './actions'
import toast from 'react-hot-toast'
import ImageUpload from '@/components/ImageUpload'
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core'
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { restrictToFirstScrollableAncestor, restrictToWindowEdges } from '@dnd-kit/modifiers'

// Sortable Image Component
// Sortable Image Component
function SortableImage({ url, index, onRemove, onUpload, isLarge = false }: { url: string; index: number; onRemove: () => void; onUpload: (url: string) => void; isLarge?: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: url || `empty-${index}` })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 0,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <div ref={setNodeRef} style={style} className={`relative group/sortable ${isLarge ? 'w-full aspect-square max-h-[400px]' : 'size-24'}`}>
            <div {...attributes} {...listeners} className="absolute top-2 left-2 z-10 p-2 bg-black/50 rounded-lg cursor-grab active:cursor-grabbing opacity-0 group-hover/sortable:opacity-100 transition-opacity">
                <GripVertical className="w-4 h-4 text-white" />
            </div>
            <button
                type="button"
                onClick={onRemove}
                className="absolute top-2 right-2 z-10 p-2 bg-red-500/80 rounded-lg opacity-0 group-hover/sortable:opacity-100 transition-opacity hover:bg-red-600 transition-all"
            >
                <X className="w-4 h-4 text-white" />
            </button>
            <ImageUpload
                compact={!isLarge}
                defaultValue={url}
                onUpload={onUpload}
            />
            {isLarge && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/60 backdrop-blur-md rounded-full border border-white/10 pointer-events-none">
                    <span className="text-[10px] font-black text-[#0df2a2] uppercase tracking-[0.2em]">Hoofdfoto</span>
                </div>
            )}
        </div>
    )
}

type ProductOption = {
    label: string
    price: number
    hidePrice?: boolean
    icon?: string
    desc?: string
    badge?: string
    deliveryTime?: string
    image?: string
    isDefault?: boolean
}

// New Structure: Array of categories with settings
type OptionCategory = {
    id: string
    name: string
    options: ProductOption[]
    condition?: {
        parentId: string
        showIfIndices: number[]
    }
}

type Product = {
    id: string
    name: string
    slug: string
    description: string | null
    base_price: number
    images: string[]
    category: string | null
    options: OptionCategory[] | Record<string, ProductOption[]>
    shipping_cost: number
}

export default function ProductManagementClient({ initialProducts }: { initialProducts: Product[] }) {
    const [products, setProducts] = useState(initialProducts)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('Alle')

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState<string | null>(null)
    const [editingProduct, setEditingProduct] = useState<Product | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        base_price: '',
        category: '',
        images: [] as string[],
        options: [] as OptionCategory[],
        shipping_cost: '0'
    })

    const [editingCategoryName, setEditingCategoryName] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    // Helper to migrate legacy object options to array options
    const migrateOptions = (options: Product['options']): OptionCategory[] => {
        if (!options) return []
        if (Array.isArray(options)) {
            return options.map(cat => ({
                ...cat,
                options: cat.options.map(opt => ({
                    ...opt,
                    hidePrice: opt.hidePrice ?? false
                }))
            }))
        }

        // Convert Record<string, ProductOption[]> to OptionCategory[]
        return Object.entries(options).map(([name, opts]) => ({
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name: name,
            options: (opts as any[]).map(opt => ({ ...opt, hidePrice: false }))
        }))
    }

    const categories = ['Alle', ...Array.from(new Set(products.map(p => p.category).filter(Boolean)))] as string[]

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.slug.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory = selectedCategory === 'Alle' || p.category === selectedCategory
        return matchesSearch && matchesCategory
    })

    const resetForm = () => {
        setFormData({
            name: '',
            slug: '',
            description: '',
            base_price: '',
            category: '',
            images: [],
            options: [],
            shipping_cost: '0'
        })
        setEditingProduct(null)
    }

    const handleOpenCreate = () => {
        resetForm()
        setIsModalOpen(true)
    }

    const handleOpenEdit = (product: Product) => {
        setEditingProduct(product)
        setFormData({
            name: product.name,
            slug: product.slug,
            description: product.description || '',
            base_price: product.base_price.toString(),
            category: product.category || '',
            images: product.images || [],
            options: migrateOptions(product.options),
            shipping_cost: (product.shipping_cost || 0).toString()
        })
        setIsModalOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const loadingToast = toast.loading(editingProduct ? 'Product bijwerken...' : 'Product aanmaken...')

        try {
            const data = {
                ...formData,
                base_price: parseFloat(formData.base_price) || 0,
                images: formData.images.filter(img => img.trim() !== ''),
                options: formData.options,
                shipping_cost: parseFloat(formData.shipping_cost) || 0
            }

            const result = editingProduct
                ? await updateProduct(editingProduct.id, data)
                : await createProduct(data)

            if (result.success) {
                toast.success(editingProduct ? 'Product bijgewerkt!' : 'Product aangemaakt!', { id: loadingToast })
                setIsModalOpen(false)
                window.location.reload()
            } else {
                toast.error(result.error || 'Er is iets misgegaan', { id: loadingToast })
            }
        } catch (error) {
            toast.error('Netwerkfout', { id: loadingToast })
        }
    }

    const handleOpenDuplicate = (product: Product) => {
        setEditingProduct(null)
        setFormData({
            name: `${product.name} (Kopie)`,
            slug: `${product.slug}-kopie`,
            description: product.description || '',
            base_price: product.base_price.toString(),
            category: product.category || '',
            images: product.images || [],
            options: migrateOptions(product.options),
            shipping_cost: (product.shipping_cost || 0).toString()
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        const loadingToast = toast.loading('Product verwijderen...')
        try {
            const result = await deleteProduct(id)
            if (result.success) {
                toast.success('Product verwijderd!', { id: loadingToast })
                setIsDeleting(null)
                window.location.reload()
            } else {
                toast.error(result.error || 'Kon niet verwijderen', { id: loadingToast })
            }
        } catch (error) {
            toast.error('Netwerkfout', { id: loadingToast })
        }
    }

    // Options Management Logic (Array-based)
    const addCategory = () => {
        const categoryName = prompt('Naam voor nieuwe categorie (bijv. Formaat):')
        if (categoryName) {
            const newCat: OptionCategory = {
                id: Math.random().toString(36).substr(2, 9),
                name: categoryName,
                options: [{ label: 'Standaard', price: 0, hidePrice: false, image: '' }]
            }
            setFormData({
                ...formData,
                options: [...formData.options, newCat]
            })
        }
    }

    const removeCategory = (id: string) => {
        setFormData({
            ...formData,
            options: formData.options.filter(c => c.id !== id)
        })
    }

    const toggleHidePrice = (catId: string, optIdx: number) => {
        setFormData({
            ...formData,
            options: formData.options.map(c => {
                if (c.id === catId) {
                    const newOpts = [...c.options]
                    newOpts[optIdx] = { ...newOpts[optIdx], hidePrice: !newOpts[optIdx].hidePrice }
                    return { ...c, options: newOpts }
                }
                return c
            })
        })
    }

    const addOptionToCategory = (catId: string) => {
        setFormData({
            ...formData,
            options: formData.options.map(c =>
                c.id === catId ? { ...c, options: [...c.options, { label: 'Nieuwe Optie', price: 0, hidePrice: false, image: '' }] } : c
            )
        })
    }

    const removeOptionFromCategory = (catId: string, index: number) => {
        setFormData({
            ...formData,
            options: formData.options.map(c => {
                if (c.id === catId) {
                    const newOpts = [...c.options]
                    newOpts.splice(index, 1)
                    return { ...c, options: newOpts }
                }
                return c
            })
        })
    }

    const updateOption = (catId: string, index: number, field: keyof ProductOption, value: any) => {
        setFormData({
            ...formData,
            options: formData.options.map(c => {
                if (c.id === catId) {
                    const newOpts = c.options.map((o, i) => {
                        if (field === 'isDefault' && value === true) {
                            return { ...o, isDefault: i === index }
                        }
                        if (i === index) {
                            return { ...o, [field]: value }
                        }
                        return o
                    })
                    return { ...c, options: newOpts }
                }
                return c
            })
        })
    }

    // Drag and Drop Logic
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null)


    // Category Drag and Drop Logic
    const handleDragStart = (index: number) => {
        setDraggedIndex(index)
    }

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault()
    }

    const handleDrop = (index: number) => {
        if (draggedIndex === null) return

        const newOptions = [...formData.options]
        const draggedItem = newOptions[draggedIndex]
        newOptions.splice(draggedIndex, 1)
        newOptions.splice(index, 0, draggedItem)

        setFormData({ ...formData, options: newOptions })
        setDraggedIndex(null)
    }

    const handleImageDragEnd = (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = formData.images.indexOf(active.id as string)
            const newIndex = formData.images.indexOf(over.id as string)

            if (oldIndex !== -1 && newIndex !== -1) {
                const newImages = arrayMove(formData.images, oldIndex, newIndex)
                setFormData({ ...formData, images: newImages })
            }
        }
    }

    const updateCategoryName = (id: string, newName: string) => {
        setFormData({
            ...formData,
            options: formData.options.map(c => c.id === id ? { ...c, name: newName } : c)
        })
        setEditingCategoryName(null)
    }

    const updateCategoryCondition = (id: string, condition: OptionCategory['condition']) => {
        setFormData({
            ...formData,
            options: formData.options.map(c => c.id === id ? { ...c, condition } : c)
        })
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-black text-white flex items-center gap-3">
                        <Package className="w-8 h-8 text-[#0df2a2]" />
                        Shop Producten
                    </h2>
                    <p className="text-zinc-500 text-sm mt-1 uppercase tracking-widest font-bold font-mono">Beheer je assortiment en configuraties</p>
                </div>
                <button
                    onClick={handleOpenCreate}
                    className="flex items-center justify-center gap-2 bg-[#0df2a2] hover:bg-[#0bc081] text-black font-black py-3 px-6 rounded-xl transition-all shadow-[0_0_20px_rgba(13,242,162,0.3)] active:scale-95 text-sm uppercase tracking-widest"
                >
                    <Plus className="w-5 h-5" />
                    NIEUW PRODUCT
                </button>
            </div>

            {/* Filters & Search */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                    <input
                        type="text"
                        placeholder="Zoek op naam of slug..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        suppressHydrationWarning
                        className="w-full bg-[#1A1A1A] border border-white/5 rounded-xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-[#0df2a2]/50 transition-all font-medium placeholder:text-zinc-600"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide bg-[#1A1A1A] border border-white/5 rounded-xl p-2 items-center">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2 border-r border-white/5 mr-2">Filters</span>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCategory === cat
                                ? 'bg-[#0df2a2]/10 border-[#0df2a2] text-[#0df2a2]'
                                : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products Table */}
            <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/2">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Product details</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Categorie</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Basisprijs</th>
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">Beheer</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredProducts.map(product => (
                                <tr key={product.id} className="group hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-xl bg-zinc-900 border border-white/5 overflow-hidden flex-shrink-0 relative group-hover:scale-105 transition-transform duration-500">
                                                {product.images?.[0] ? (
                                                    <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                                                        <ImageIcon className="w-6 h-6" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                                            </div>
                                            <div>
                                                <div className="font-bold text-white group-hover:text-[#0df2a2] transition-colors text-base">{product.name}</div>
                                                <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter mt-0.5">{product.slug}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="px-3 py-1.5 rounded-full border border-white/5 bg-white/2 text-zinc-400 text-[9px] font-black uppercase tracking-widest w-fit">
                                            {product.category || 'Geen'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-black text-[#0df2a2] text-lg">€{product.base_price.toFixed(2)}</div>
                                        <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">Vanaf prijs</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleOpenEdit(product)}
                                                className="p-3 rounded-xl bg-[#1A1A1A] border border-white/5 hover:border-[#0df2a2]/30 text-zinc-400 hover:text-[#0df2a2] transition-all flex items-center gap-2 group/btn"
                                            >
                                                <Edit2 className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                                                <span className="text-[10px] font-black uppercase tracking-widest pr-1">Bewerk</span>
                                            </button>
                                            <button
                                                onClick={() => handleOpenDuplicate(product)}
                                                className="p-3 rounded-xl bg-[#1A1A1A] border border-white/5 hover:border-[#0df2a2]/30 text-zinc-400 hover:text-[#0df2a2] transition-all flex items-center gap-2 group/btn"
                                                title="Product dupliceren"
                                            >
                                                <Copy className="w-4 h-4 transition-transform group-hover/btn:scale-110" />
                                                <span className="text-[10px] font-black uppercase tracking-widest pr-1">Dupliceer</span>
                                            </button>
                                            <button
                                                onClick={() => setIsDeleting(product.id)}
                                                className="p-3 rounded-xl bg-[#1A1A1A] border border-white/5 hover:border-red-500/30 text-zinc-500 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-24 text-center">
                                        <div className="w-20 h-20 bg-zinc-900 border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-6 text-zinc-700">
                                            <Package className="w-10 h-10" />
                                        </div>
                                        <div className="text-white font-black text-xl uppercase tracking-tight">Geen resultaten</div>
                                        <div className="text-zinc-600 text-xs mt-2 font-medium">Zoek op een andere term of voeg een product toe</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#0A0A0A] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-[0_0_100px_rgba(13,242,162,0.1)] custom-scrollbar">
                        <div className="p-8 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0A0A0A]/80 backdrop-blur-xl z-20">
                            <div>
                                <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                                    <div className="p-2 bg-[#0df2a2]/10 rounded-lg">
                                        {editingProduct ? <Edit2 className="w-6 h-6 text-[#0df2a2]" /> : <Plus className="w-6 h-6 text-[#0df2a2]" />}
                                    </div>
                                    {editingProduct ? 'Product Bewerken' : 'Nieuw Product'}
                                </h3>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1 ml-11">Stel je product details en variaties in</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all ring-1 ring-white/5">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-10">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                                {/* Left Side: Media */}
                                <div className="space-y-4 order-2 lg:order-1">
                                    <div className="flex items-center justify-between ml-1">
                                        <label className="text-[10px] font-black text-[#0df2a2] uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-4 h-px bg-[#0df2a2]"></div>
                                            Product Media
                                        </label>
                                        <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-tighter">Sleep om te sorteren</span>
                                    </div>
                                    <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-6">
                                        <DndContext
                                            sensors={sensors}
                                            collisionDetection={closestCenter}
                                            onDragEnd={handleImageDragEnd}
                                            modifiers={[restrictToFirstScrollableAncestor]}
                                        >
                                            <SortableContext
                                                items={formData.images.filter(img => img.trim() !== '')}
                                                strategy={horizontalListSortingStrategy}
                                            >
                                                <div className="space-y-6">
                                                    {/* Main Photo (Always first in array) */}
                                                    <div className="flex justify-center w-full">
                                                        <SortableImage
                                                            isLarge
                                                            url={formData.images[0] || ''}
                                                            index={0}
                                                            onRemove={() => {
                                                                const newImages = [...formData.images]
                                                                newImages.splice(0, 1)
                                                                setFormData({ ...formData, images: newImages })
                                                            }}
                                                            onUpload={(url) => {
                                                                const newImages = [...formData.images]
                                                                newImages[0] = url
                                                                setFormData({ ...formData, images: newImages })
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Thumbnails */}
                                                    <div className="flex flex-wrap gap-3">
                                                        {formData.images.slice(1).map((img, idx) => (
                                                            <SortableImage
                                                                key={img || `empty-${idx + 1}`}
                                                                url={img}
                                                                index={idx + 1}
                                                                onRemove={() => {
                                                                    const newImages = [...formData.images]
                                                                    newImages.splice(idx + 1, 1)
                                                                    setFormData({ ...formData, images: newImages })
                                                                }}
                                                                onUpload={(url) => {
                                                                    const newImages = [...formData.images]
                                                                    newImages[idx + 1] = url
                                                                    setFormData({ ...formData, images: newImages })
                                                                }}
                                                            />
                                                        ))}
                                                        <button
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, images: [...formData.images, ''] })}
                                                            className="size-24 border border-dashed border-white/10 rounded-2xl text-zinc-500 hover:text-[#0df2a2] hover:border-[#0df2a2]/30 transition-all flex flex-col items-center justify-center gap-1 group bg-white/[0.02]"
                                                        >
                                                            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                                            <span className="text-[8px] font-black uppercase tracking-tighter">Voeg Foto</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </SortableContext>
                                        </DndContext>
                                        <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest text-center">De eerste foto is de hoofdfoto</p>
                                    </div>
                                </div>

                                {/* Right Side: Basic Info */}
                                <div className="space-y-6 order-1 lg:order-2">
                                    <h4 className="text-[10px] font-black text-[#0df2a2] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-4 h-px bg-[#0df2a2]"></div>
                                        Basis Informatie
                                    </h4>
                                    <div className="space-y-6 bg-[#111] p-6 rounded-3xl border border-white/5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Product Naam</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => {
                                                    const name = e.target.value
                                                    const slug = name.toLowerCase().replace(/\s+/g, '-')
                                                    setFormData({ ...formData, name, slug })
                                                }}
                                                placeholder="Bijv. Modern Te Koop Bord"
                                                suppressHydrationWarning
                                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-[#0df2a2]/50 outline-none transition-all font-bold placeholder:text-zinc-700"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Slug (URL pad)</label>
                                            <input
                                                required
                                                type="text"
                                                value={formData.slug}
                                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                                suppressHydrationWarning
                                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-3 px-5 text-zinc-500 focus:border-[#0df2a2]/30 outline-none transition-all font-mono text-[10px]"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Basisprijs (€)</label>
                                                <input
                                                    required
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.base_price}
                                                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                                                    placeholder="0.00"
                                                    suppressHydrationWarning
                                                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-5 text-[#0df2a2] font-black focus:border-[#0df2a2]/50 outline-none transition-all text-xl [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Categorie</label>
                                                <input
                                                    type="text"
                                                    value={formData.category}
                                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                    placeholder="Bijv. Marketing"
                                                    suppressHydrationWarning
                                                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-[#0df2a2]/50 outline-none transition-all font-bold"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1 flex items-center justify-between">
                                                <span>Verzendkosten (€)</span>
                                                <span className="text-[8px] text-[#0df2a2] normal-case font-bold opacity-60">Vul 0 in voor gratis verzending</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.shipping_cost}
                                                    onChange={(e) => setFormData({ ...formData, shipping_cost: e.target.value })}
                                                    placeholder="0.00"
                                                    suppressHydrationWarning
                                                    className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-black focus:border-[#0df2a2]/50 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                />
                                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                                                    {parseFloat(formData.shipping_cost) === 0 ? (
                                                        <span className="text-[10px] font-black bg-[#0df2a2]/10 text-[#0df2a2] px-3 py-1.5 rounded-lg border border-[#0df2a2]/20 uppercase tracking-widest italic animate-in fade-in zoom-in duration-500">GRATIS</span>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest italic">Vast bedrag</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Beschrijving</label>
                                            <textarea
                                                rows={3}
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                placeholder="Korte omschrijving voor de shop..."
                                                className="w-full bg-zinc-900 border border-white/5 rounded-2xl py-4 px-5 text-white focus:border-[#0df2a2]/50 outline-none transition-all resize-none font-medium placeholder:text-zinc-700 text-xs"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Visual Options Builder */}
                            <section className="space-y-6 pt-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-[10px] font-black text-[#0df2a2] uppercase tracking-[0.2em] flex items-center gap-2">
                                        <div className="w-4 h-px bg-[#0df2a2]"></div>
                                        Product Opties & Variaties
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={addCategory}
                                        className="text-[10px] font-black uppercase tracking-widest text-[#0df2a2] hover:text-white px-4 py-2 rounded-lg border border-[#0df2a2]/30 hover:bg-[#0df2a2]/10 transition-all flex items-center gap-2"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Categorie Toevoegen
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {formData.options.map((cat, catIdx) => (
                                        <div
                                            key={cat.id}
                                            draggable
                                            onDragStart={() => handleDragStart(catIdx)}
                                            onDragOver={(e) => handleDragOver(e, catIdx)}
                                            onDrop={() => handleDrop(catIdx)}
                                            className={`bg-[#111] border border-white/5 rounded-3xl p-6 relative group/cat transition-all ${draggedIndex === catIdx ? 'opacity-50 scale-95 border-[#0df2a2]' : 'hover:border-white/10'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 cursor-grab active:cursor-grabbing">
                                                        <GripVertical className="w-4 h-4" />
                                                    </div>
                                                    {editingCategoryName === cat.id ? (
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            defaultValue={cat.name}
                                                            onBlur={(e) => updateCategoryName(cat.id, e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter') updateCategoryName(cat.id, e.currentTarget.value)
                                                                if (e.key === 'Escape') setEditingCategoryName(null)
                                                            }}
                                                            className="bg-zinc-800 border-none rounded-lg px-2 py-1 text-white text-sm font-black uppercase tracking-widest focus:ring-1 focus:ring-[#0df2a2]/50 outline-none w-48"
                                                        />
                                                    ) : (
                                                        <h5
                                                            onClick={() => setEditingCategoryName(cat.id)}
                                                            className="font-black text-white uppercase tracking-widest text-sm cursor-pointer hover:text-[#0df2a2] transition-colors flex items-center gap-2 group/title"
                                                        >
                                                            {cat.name}
                                                            <Edit2 className="w-3 h-3 opacity-0 group-hover/title:opacity-100 transition-opacity" />
                                                        </h5>
                                                    )}
                                                    <span className="text-[10px] font-bold text-zinc-600 uppercase italic">({cat.options.length} opties)</span>
                                                </div>

                                                {/* Conditional Logic UI */}
                                                {catIdx > 0 && (
                                                    <div className="flex items-center gap-4 bg-zinc-900/50 px-4 py-2 rounded-2xl border border-white/5">
                                                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Toon als:</span>
                                                        <select
                                                            value={cat.condition?.parentId || ''}
                                                            onChange={(e) => {
                                                                const parentId = e.target.value
                                                                if (!parentId) {
                                                                    updateCategoryCondition(cat.id, undefined)
                                                                } else {
                                                                    updateCategoryCondition(cat.id, { parentId, showIfIndices: [] })
                                                                }
                                                            }}
                                                            className="bg-transparent border-none text-white text-[10px] font-black uppercase tracking-tight focus:ring-0 cursor-pointer"
                                                        >
                                                            <option value="" className="bg-zinc-900">Altijd tonen</option>
                                                            {formData.options.slice(0, catIdx).map(fixedParent => (
                                                                <option key={fixedParent.id} value={fixedParent.id} className="bg-zinc-900">
                                                                    {fixedParent.name}...
                                                                </option>
                                                            ))}
                                                        </select>

                                                        {cat.condition?.parentId && (
                                                            <div className="flex flex-wrap gap-2 items-center border-l border-white/10 pl-4">
                                                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">...is gelijk aan:</span>
                                                                {formData.options.find(p => p.id === cat.condition?.parentId)?.options.map((opt, optIdx) => (
                                                                    <button
                                                                        key={optIdx}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const current = cat.condition?.showIfIndices || []
                                                                            const next = current.includes(optIdx)
                                                                                ? current.filter(i => i !== optIdx)
                                                                                : [...current, optIdx]
                                                                            updateCategoryCondition(cat.id, { ...cat.condition!, showIfIndices: next })
                                                                        }}
                                                                        className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${cat.condition?.showIfIndices.includes(optIdx)
                                                                            ? 'bg-[#0df2a2] text-[#0A0A0A]'
                                                                            : 'bg-zinc-800 text-zinc-500 hover:text-white'
                                                                            }`}
                                                                    >
                                                                        {opt.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCategory(cat.id)}
                                                        className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                {cat.options.map((opt: ProductOption, idx: number) => (
                                                    <div key={idx} className="flex flex-col md:flex-row gap-4 items-start bg-zinc-900/50 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all group/opt">
                                                        {/* Option Image */}
                                                        <div className="size-24 flex-shrink-0">
                                                            <ImageUpload
                                                                compact
                                                                defaultValue={opt.image}
                                                                onUpload={(url) => updateOption(cat.id, idx, 'image', url)}
                                                            />
                                                        </div>
                                                        <div className="flex-1 w-full space-y-4">
                                                            <div className="flex flex-col md:flex-row gap-4">
                                                                <div className="flex-1 space-y-1">
                                                                    <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Label</label>
                                                                    <input
                                                                        type="text"
                                                                        value={opt.label}
                                                                        onChange={(e) => updateOption(cat.id, idx, 'label', e.target.value)}
                                                                        placeholder="Bijv. 100x200cm"
                                                                        suppressHydrationWarning
                                                                        className="w-full bg-zinc-800 border-none rounded-xl py-3 px-4 text-white text-xs font-bold focus:ring-1 focus:ring-[#0df2a2]/30 outline-none transition-all"
                                                                    />
                                                                </div>
                                                                <div className="w-full md:w-48 space-y-1">
                                                                    <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Meerprijs (€)</label>
                                                                    <div className="relative group/price">
                                                                        <input
                                                                            type="number"
                                                                            step="0.01"
                                                                            value={opt.price}
                                                                            onChange={(e) => updateOption(cat.id, idx, 'price', parseFloat(e.target.value) || 0)}
                                                                            placeholder="0.00"
                                                                            suppressHydrationWarning
                                                                            className="w-full bg-zinc-800 border-none rounded-xl py-3 px-4 text-[#0df2a2] text-xs font-black focus:ring-1 focus:ring-[#0df2a2]/30 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                        />
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleHidePrice(cat.id, idx)}
                                                                            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${opt.hidePrice
                                                                                ? 'text-amber-500 hover:bg-amber-500/10'
                                                                                : 'text-zinc-500 hover:text-[#0df2a2] hover:bg-[#0df2a2]/10'
                                                                                }`}
                                                                            title={opt.hidePrice ? 'Prijs is verborgen' : 'Prijs is zichtbaar'}
                                                                        >
                                                                            {opt.hidePrice ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                <div className="space-y-1">
                                                                    <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Beschrijving</label>
                                                                    <input
                                                                        type="text"
                                                                        value={opt.desc || ''}
                                                                        onChange={(e) => updateOption(cat.id, idx, 'desc', e.target.value)}
                                                                        placeholder="Korte omschrijving..."
                                                                        className="w-full bg-zinc-800 border-none rounded-xl py-2 px-4 text-white text-[10px] focus:ring-1 focus:ring-[#0df2a2]/30 outline-none transition-all"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Badge</label>
                                                                    <input
                                                                        type="text"
                                                                        value={opt.badge || ''}
                                                                        onChange={(e) => updateOption(cat.id, idx, 'badge', e.target.value)}
                                                                        placeholder="Bijv: NIEUW"
                                                                        className="w-full bg-zinc-800 border-none rounded-xl py-2 px-4 text-white text-[10px] focus:ring-1 focus:ring-[#0df2a2]/30 outline-none transition-all"
                                                                    />
                                                                </div>
                                                                <div className="space-y-1">
                                                                    <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest ml-1">Levertijd</label>
                                                                    <input
                                                                        type="text"
                                                                        value={opt.deliveryTime || ''}
                                                                        onChange={(e) => updateOption(cat.id, idx, 'deliveryTime', e.target.value)}
                                                                        placeholder="Bijv: 1 dag"
                                                                        className="w-full bg-zinc-800 border-none rounded-xl py-2 px-4 text-white text-[10px] focus:ring-1 focus:ring-[#0df2a2]/30 outline-none transition-all"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-2 pt-4">
                                                            <button
                                                                type="button"
                                                                onClick={() => removeOptionFromCategory(cat.id, idx)}
                                                                className="p-2 text-zinc-700 hover:text-red-400 opacity-0 group-hover/opt:opacity-100 transition-all"
                                                                title="Verwijder optie"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => updateOption(cat.id, idx, 'isDefault', !opt.isDefault)}
                                                                className={`p-2 rounded-lg transition-all ${opt.isDefault ? 'text-[#0df2a2] bg-[#0df2a2]/10' : 'text-zinc-700 hover:text-zinc-400'}`}
                                                                title={opt.isDefault ? 'Standaard gekozen' : 'Maak standaard'}
                                                            >
                                                                <CheckCircle2 className={`w-5 h-5 ${opt.isDefault ? 'fill-[#0df2a2]/20' : ''}`} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={() => addOptionToCategory(cat.id)}
                                                    className="w-full py-3 border border-dashed border-zinc-800 hover:border-[#0df2a2]/30 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 hover:text-[#0df2a2] transition-all flex items-center justify-center gap-2 mt-4 hover:bg-[#0df2a2]/5"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                    Optie Toevoegen aan {cat.name}
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {formData.options.length === 0 && (
                                        <div className="py-12 text-center border-2 border-dashed border-zinc-900 rounded-3xl bg-zinc-900/20">
                                            <AlertCircle className="w-10 h-10 text-zinc-800 mx-auto mb-4" />
                                            <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px]">Geen opties geconfigureerd</p>
                                            <button
                                                type="button"
                                                onClick={addCategory}
                                                className="mt-4 text-[10px] font-black uppercase text-[#0df2a2] hover:underline"
                                            >
                                                Start met het toevoegen van een categorie
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Footer / Submit */}
                            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row gap-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 font-black rounded-2xl transition-all uppercase tracking-[0.2em] text-[10px] ring-1 ring-white/5"
                                >
                                    Annuleren
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] py-5 bg-[#0df2a2] hover:bg-[#0bc081] text-black font-black rounded-2xl transition-all shadow-[0_0_40px_rgba(13,242,162,0.2)] uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 active:scale-[0.98]"
                                >
                                    <Check className="w-5 h-5" />
                                    {editingProduct ? 'WIJZIGINGEN OPSLAAN' : 'PRODUCT PUBLICEREN'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {isDeleting && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in zoom-in-95 duration-200">
                    <div className="bg-[#111] border border-red-500/20 rounded-[2.5rem] p-10 max-w-md text-center space-y-8 shadow-[0_0_100px_rgba(239,68,68,0.1)]">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mx-auto animate-pulse">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Definitief verwijderen?</h3>
                            <p className="text-zinc-500 text-base mt-3 font-medium px-4 leading-relaxed">Dit product wordt permanent gewist uit de database en de shop. Deze actie kan niet ongedaan worden gemaakt.</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => handleDelete(isDeleting)}
                                className="w-full py-5 bg-red-500 text-white font-black rounded-2xl hover:bg-red-600 transition-all shadow-[0_0_30px_rgba(239,68,68,0.3)] text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                JA, VERWIJDER PRODUCT
                            </button>
                            <button
                                onClick={() => setIsDeleting(null)}
                                className="w-full py-5 bg-zinc-900 text-zinc-500 font-black rounded-2xl hover:bg-zinc-800 transition-all text-xs uppercase tracking-widest ring-1 ring-white/5"
                            >
                                NEE, GA TERUG
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(13, 242, 162, 0.2);
                }
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    )
}
