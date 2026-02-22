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
        throw new Error('Geen actieve sessie gevonden. Log opnieuw in.')
    }

    const file = fileData.get('file') as File
    if (!file || file.size === 0) {
        throw new Error('Geen geldig bestand ontvangen.')
    }

    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const path = `materials/${fileName}`

        const buffer = Buffer.from(await file.arrayBuffer())

        const { error: uploadError } = await supabase.storage
            .from('property-images')
            .upload(path, buffer, {
                contentType: file.type,
                upsert: true
            })

        if (uploadError) {
            console.error('Supabase Storage Error:', uploadError)
            throw new Error(`Opslag fout: ${uploadError.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
            .from('property-images')
            .getPublicUrl(path)

        return publicUrl
    } catch (err: any) {
        console.error('Critical upload error:', err)
        throw new Error(err.message || 'Onbekende upload fout')
    }
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

export async function updateMaterialImage(materialId: string, imageUrl: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Niet geautoriseerd')
    }

    const { error } = await supabase
        .from('agent_materials')
        .update({ image_url: imageUrl })
        .eq('id', materialId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating material image:', error)
        throw new Error('Update mislukt')
    }

    revalidatePath('/dashboard/materialen')
}

export async function updateMaterialName(materialId: string, name: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Niet geautoriseerd')
    }

    const { error } = await supabase
        .from('agent_materials')
        .update({ name })
        .eq('id', materialId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error updating material name:', error)
        throw new Error('Naam wijzigen mislukt')
    }

    revalidatePath('/dashboard/materialen')
}

export async function resetPropertyScans(propertyId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Niet geautoriseerd')
    }

    const { error } = await supabase
        .from('scans')
        .delete()
        .eq('property_id', propertyId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error resetting scans:', error)
        throw new Error('Resetten mislukt')
    }

    revalidatePath('/dashboard/materialen')
}

export async function resetAllMaterialScans(materialId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Niet geautoriseerd')
    }

    const { error } = await supabase
        .from('scans')
        .delete()
        .eq('material_id', materialId)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error resetting all scans:', error)
        throw new Error('Resetten mislukt')
    }

    revalidatePath('/dashboard/materialen')
}


export async function getScansByMaterial(materialId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Niet geautoriseerd')
    }

    const { data, error } = await supabase
        .from('scans')
        .select(`
            id,
            property_id,
            created_at,
            browser,
            device,
            os,
            ip_hash,
            properties (
                address
            )
        `)
        .eq('material_id', materialId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })


    if (error) {
        console.error('Error fetching scans:', error)
        return []
    }

    return data as any[]
}
