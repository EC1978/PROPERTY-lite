'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getExtensionToken() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Niet ingelogd' }

    const { data, error } = await supabase
        .from('profiles')
        .select('extension_token')
        .eq('id', user.id)
        .single()

    if (error) return { error: error.message }

    return { token: data?.extension_token || null }
}

export async function regenerateExtensionToken() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Niet ingelogd' }

    // Generate a secure token via the DB function
    const { data: newToken, error: fnError } = await supabase
        .rpc('generate_extension_token')

    if (fnError) return { error: fnError.message }

    const { error: updateError } = await supabase
        .from('profiles')
        .update({ extension_token: newToken })
        .eq('id', user.id)

    if (updateError) return { error: updateError.message }

    revalidatePath('/settings/extension')
    return { token: newToken as string }
}
