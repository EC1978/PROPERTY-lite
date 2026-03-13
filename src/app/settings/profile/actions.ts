'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const phone = formData.get('phone') as string

    if (!name) {
        return { error: 'Naam is verplicht.' }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: 'Niet ingelogd.' }
    }

    // Update user metadata in Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
        data: {
            full_name: name,
            phone: phone
        }
    })

    if (updateError) {
        return { error: updateError.message }
    }

    revalidatePath('/settings/profile')
    return { success: true }
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient()
    const currentPassword = formData.get('currentPassword') as string
    const newPassword = formData.get('newPassword') as string

    if (!newPassword || newPassword.length < 6) {
        return { error: 'Nieuw wachtwoord moet minimaal 6 karakters zijn.' }
    }

    // Try to update password directly (Supabase handles security)
    const { error } = await supabase.auth.updateUser({
        password: newPassword
    })

    if (error) {
        console.error('Password update error:', error)
        if (error.message.includes('AuthApiError')) {
            return { error: 'Je moet recent ingelogd zijn om je wachtwoord te wijzigen. Log uit en opnieuw in.' }
        }
        return { error: `Kon wachtwoord niet wijzigen: ${error.message}` }
    }

    return { success: true }
}

export async function uploadAvatar(formData: FormData) {
    const supabase = await createClient()
    const file = formData.get('avatar') as File

    if (!file) {
        return { error: 'Geen bestand geupload.' }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
        return { error: 'Niet ingelogd.' }
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random()}.${fileExt}`
    const filePath = `${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file)

    if (uploadError) {
        return { error: 'Fout bij uploaden afbeelding.' }
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

    const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
    })

    if (updateError) {
        return { error: 'Fout bij koppelen profielfoto aan account.' }
    }

    revalidatePath('/settings/profile')
    return { success: true, avatarUrl: publicUrl }
}

export async function updateOfficeDetails(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const address = formData.get('address') as string
    const website = formData.get('website') as string

    if (!name) {
        return { error: 'Bedrijfsnaam is verplicht.' }
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: 'Niet ingelogd.' }
    }

    const { error: updateError } = await supabase.auth.updateUser({
        data: {
            office_name: name,
            office_address: address,
            office_website: website
        }
    })

    if (updateError) {
        return { error: updateError.message }
    }

    revalidatePath('/settings/profile')
    return { success: true }
}
