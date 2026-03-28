'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function deleteProperty(id: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error deleting property:', error)
        throw new Error('Failed to delete property')
    }

    redirect('/dashboard')
}

export async function updatePropertyStatus(id: string, status: 'active' | 'draft' | 'archived') {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const { error } = await supabase
        .from('properties')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('user_id', user.id)

    if (error) throw new Error('Kon status niet bijwerken')

    revalidatePath(`/properties/${id}`)
    revalidatePath('/dashboard')
    revalidatePath('/properties')
}
