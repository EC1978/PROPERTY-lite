
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { deleteProperty } from '../../actions'
import ImageUpload from '@/components/ImageUpload'

export default async function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: property } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

    if (!property) {
        redirect('/dashboard')
    }

    async function updateProperty(formData: FormData) {
        'use server'
        const supabase = await createClient()

        const address = formData.get('address') as string
        const price = formData.get('price') as string
        const surface_area = formData.get('surface_area') as string
        const description = formData.get('description') as string
        const image_url = formData.get('image_url') as string
        const video_url = formData.get('video_url') as string
        const floorplan_url = formData.get('floorplan_url') as string
        const tour_360_url = formData.get('tour_360_url') as string

        // Extract features
        const features = {
            constructionYear: formData.get('feature_constructionYear'),
            type: formData.get('feature_type'),
            layout: formData.get('feature_layout'),
            energy: formData.get('feature_energy'),
            maintenance: formData.get('feature_maintenance'),
            surroundings: formData.get('feature_surroundings'),
        }

        await supabase.from('properties').update({
            address,
            price: parseFloat(price),
            surface_area: parseInt(surface_area),
            description,
            image_url,
            video_url,
            floorplan_url,
            tour_360_url,
            features
        }).eq('id', id)

        redirect(`/properties/${id}/ready`)
    }

    // Helper to safely get feature values
    const getFeature = (key: string) => (property.features as any)?.[key] || ''

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl w-full bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="p-8 border-b border-gray-100">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Controleer Gegevens</h1>
                    <p className="text-gray-500">De WEB AGENT heeft de volgende gegevens gevonden.</p>
                </div>

                <form action={updateProperty} className="p-8 space-y-8">
                    {/* Basisgegevens */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b pb-2">Basisinfo</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Adres</label>
                            <input type="text" name="address" defaultValue={property.address} className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Hoofdafbeelding</label>
                                <ImageUpload defaultValue={property.image_url} />
                                {property.images && property.images.length > 0 && (
                                    <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                                        {property.images.map((img: string, i: number) => (
                                            <img key={i} src={img} className="h-16 w-16 object-cover rounded-lg border border-gray-200" title={`Scraped image ${i + 1}`} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Vraagprijs (€)</label>
                                <input type="number" name="price" defaultValue={property.price} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Woonoppervlakte (m²)</label>
                                <input type="number" name="surface_area" defaultValue={property.surface_area} className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* Media Links */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">perm_media</span>
                            Media Links
                        </h2>
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Video URL</label>
                                <input type="url" name="video_url" defaultValue={property.video_url} placeholder="https://youtube.com/..." className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Plattegrond URL</label>
                                <input type="url" name="floorplan_url" defaultValue={property.floorplan_url} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">360° Tour URL</label>
                                <input type="url" name="tour_360_url" defaultValue={property.tour_360_url} placeholder="https://..." className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white outline-none transition-colors" />
                            </div>
                        </div>
                    </div>

                    {/* Nieuwe Gedetailleerde Kenmerken */}
                    <div className="space-y-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b pb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">manage_search</span>
                            Gedetailleerde Kenmerken (AI Scraped)
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Bouwjaar</label>
                                <input type="text" name="feature_constructionYear" defaultValue={getFeature('constructionYear')} placeholder="Bijv. 1995" className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Woningtype</label>
                                <input type="text" name="feature_type" defaultValue={getFeature('type')} placeholder="Bijv. Vrijstaand" className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Energie & Isolatie</label>
                                <input type="text" name="feature_energy" defaultValue={getFeature('energy')} placeholder="Label A, Dubbel glas..." className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white outline-none transition-colors" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Onderhoud</label>
                                <input type="text" name="feature_maintenance" defaultValue={getFeature('maintenance')} placeholder="Bijv. Uitstekend" className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white outline-none transition-colors" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Indeling</label>
                                <input type="text" name="feature_layout" defaultValue={getFeature('layout')} placeholder="Bijv. 5 kamers, open keuken..." className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white outline-none transition-colors" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ligging / Omgeving</label>
                                <input type="text" name="feature_surroundings" defaultValue={getFeature('surroundings')} placeholder="Bijv. In centrum, nabij park..." className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white outline-none transition-colors" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Omschrijving</label>
                        <textarea name="description" rows={6} defaultValue={property.description} className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white outline-none"></textarea>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                        <Link href="/dashboard" className="px-6 py-3 rounded-xl text-gray-500 hover:bg-gray-50 font-medium transition-colors">
                            Annuleren
                        </Link>
                        <button type="submit" className="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all">
                            Opslaan & Genereren
                        </button>
                    </div>
                </form>

                <div className="bg-gray-50 p-6 border-t border-gray-100 text-center">
                    <form action={async () => {
                        'use server'
                        await deleteProperty(id)
                    }}>
                        <button type="submit" className="text-red-500 hover:text-red-700 text-sm font-medium inline-flex items-center gap-2 px-4 py-2 hover:bg-red-50 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-lg">delete</span>
                            Woning Verwijderen
                        </button>
                    </form>
                </div>
            </div >
        </div >
    )
}
