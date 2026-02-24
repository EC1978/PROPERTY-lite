'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitReview(propertyId: string, rating: number, feedback: string, name: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('reviews')
            .insert([
                {
                    property_id: propertyId,
                    rating: rating,
                    feedback_text: feedback,
                    reviewer_name: name || null
                }
            ])

        if (error) {
            console.error('Error submitting review:', error)
            return { success: false, error: 'Kon review niet opslaan. Probeer het later opnieuw.' }
        }

        return { success: true }
    } catch (err: any) {
        console.error('Unexpected error in submitReview:', err)
        return { success: false, error: 'Er is een onverwachte fout opgetreden.' }
    }
}

export async function deleteReview(reviewId: string) {
    const supabase = await createClient()

    try {
        // Soft delete: move to trash
        const { error } = await supabase
            .from('reviews')
            .update({ is_deleted: true })
            .eq('id', reviewId)

        if (error) {
            console.error('Error deleting review:', error)
            return { success: false, error: 'Kon review niet verwijderen.' }
        }

        revalidatePath('/dashboard/reviews')
        revalidatePath('/properties/[id]', 'page')

        return { success: true }
    } catch (err: any) {
        console.error('Unexpected error in deleteReview:', err)
        return { success: false, error: 'Er is een onverwachte fout opgetreden.' }
    }
}

export async function permanentlyDeleteReview(reviewId: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId)

        if (error) {
            console.error('Error permanently deleting review:', error)
            return { success: false, error: 'Kon review niet permanent verwijderen.' }
        }

        revalidatePath('/dashboard/reviews')

        return { success: true }
    } catch (err: any) {
        console.error('Unexpected error in permanentlyDeleteReview:', err)
        return { success: false, error: 'Er is een onverwachte fout opgetreden.' }
    }
}

export async function restoreReview(reviewId: string) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('reviews')
            .update({ is_deleted: false })
            .eq('id', reviewId)

        if (error) {
            console.error('Error restoring review:', error)
            return { success: false, error: 'Kon review niet herstellen.' }
        }

        revalidatePath('/dashboard/reviews')
        revalidatePath('/properties/[id]', 'page')

        return { success: true }
    } catch (err: any) {
        console.error('Unexpected error in restoreReview:', err)
        return { success: false, error: 'Er is een onverwachte fout opgetreden.' }
    }
}

export async function toggleHideReview(reviewId: string, currentStatus: boolean) {
    const supabase = await createClient()

    try {
        const { error } = await supabase
            .from('reviews')
            .update({ is_hidden: !currentStatus })
            .eq('id', reviewId)

        if (error) {
            console.error('Error toggling hide status:', error)
            return { success: false, error: 'Kon status niet aanpassen.' }
        }

        revalidatePath('/dashboard/reviews')
        revalidatePath('/properties/[id]', 'page')

        return { success: true }
    } catch (err: any) {
        console.error('Unexpected error in toggleHideReview:', err)
        return { success: false, error: 'Er is een onverwachte fout opgetreden.' }
    }
}
