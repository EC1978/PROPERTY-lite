'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function linkMaterialToProperty(materialId: string, propertyId: string | null) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Niet geautoriseerd')
    }

    const { error } = await supabase
        .from('agent_materials')
        .update({ active_property_id: propertyId })
        .eq('id', materialId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error linking material:', error)
        throw new Error('Koppelen mislukt')
    }

    revalidatePath('/dashboard/materialen')
}

export async function createMaterial(data: { id: string, name: string, type: string, image_url: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Niet geautoriseerd')
    }

    const { error } = await supabase
        .from('agent_materials')
        .insert({
            ...data,
            user_id: user.id,
            makelaar_id: user.id
        })

    if (error) {
        console.error('Error creating material:', error)
        throw new Error(error.message || 'Toevoegen mislukt')
    }

    revalidatePath('/dashboard/materialen')
}

export async function uploadMaterialImage(fileData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Niet geautoriseerd')
    }

    const file = fileData.get('file') as File
    if (!file) {
        throw new Error('Geen bestand geselecteerd')
    }

    const fileExt = file.name.split('.').pop()
    const path = `materials/${user.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
        .from('property-images')
        .upload(path, file, {
            contentType: file.type,
            upsert: true
        })

    if (uploadError) {
        console.error('Upload error:', uploadError)
        throw new Error('Upload mislukt')
    }

    const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(path)

    return publicUrl
}

export async function getMaterials() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('agent_materials')
        .select(`
            *,
            properties:active_property_id (
                id,
                address
            )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching materials:', error)
        return []
    }

    return data.map((item: any) => ({
        ...item,
        property_address: item.properties?.address
    }))
}

export async function getActiveProperties() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    const { data, error } = await supabase
        .from('properties')
        .select('id, address')
        .eq('user_id', user.id)
        .eq('status', 'active')

    if (error) {
        console.error('Error fetching properties:', error)
        return []
    }

    return data
}

export async function deleteMaterial(materialId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Niet geautoriseerd')
    }

    const { error } = await supabase
        .from('agent_materials')
        .delete()
        .eq('id', materialId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting material:', error)
        throw new Error('Verwijderen mislukt')
    }

    revalidatePath('/dashboard/materialen')
}
