
import { SupabaseClient } from '@supabase/supabase-js'

export interface VoiceEntry {
    id: string;
    name: string;
    url: string; // Public URL of audio
    photoUrl?: string | null; // Public URL of photo
    createdAt: string;
    vibe?: string; // e.g. 'professional'
}

const BUCKET = 'property-images'
const LIBRARY_FILE = 'library.json'

export async function getVoiceLibrary(supabase: SupabaseClient, userId: string): Promise<VoiceEntry[]> {
    try {
        const { data, error } = await supabase.storage
            .from(BUCKET)
            .download(`voice-clones/${userId}/${LIBRARY_FILE}`)

        if (error) {
            // If file not found, return empty list
            if (error.message.includes('Object not found')) return []
            throw error
        }

        const text = await data.text()
        return JSON.parse(text) as VoiceEntry[]
    } catch (error) {
        console.warn('Error fetching voice library:', error)
        return []
    }
}

export async function saveVoiceToLibrary(
    supabase: SupabaseClient,
    userId: string,
    voiceBlob: Blob,
    metadata: { name: string; vibe?: string; photoBlob?: Blob | null }
): Promise<VoiceEntry> {
    const library = await getVoiceLibrary(supabase, userId)

    const voiceId = `${Date.now()}`
    const voicePath = `voice-clones/${userId}/${voiceId}.webm`

    // 1. Upload Audio
    const { error: audioError } = await supabase.storage
        .from(BUCKET)
        .upload(voicePath, voiceBlob, { contentType: 'audio/webm', upsert: true })

    if (audioError) throw audioError

    const { data: { publicUrl: audioUrl } } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(voicePath)

    // 2. Upload Photo (Optional)
    let photoUrl = null
    if (metadata.photoBlob) {
        const photoPath = `voice-clones/${userId}/${voiceId}_photo`
        const { error: photoError } = await supabase.storage
            .from(BUCKET)
            .upload(photoPath, metadata.photoBlob, { contentType: metadata.photoBlob.type, upsert: true })

        if (!photoError) {
            const { data: { publicUrl } } = supabase.storage
                .from(BUCKET)
                .getPublicUrl(photoPath)
            photoUrl = publicUrl
        }
    }

    // 3. Update Library JSON
    const newEntry: VoiceEntry = {
        id: voiceId,
        name: metadata.name,
        url: audioUrl,
        photoUrl,
        createdAt: new Date().toISOString(),
        vibe: metadata.vibe
    }

    const updatedLibrary = [newEntry, ...library] // Add to top

    const { error: jsonError } = await supabase.storage
        .from(BUCKET)
        .upload(`voice-clones/${userId}/${LIBRARY_FILE}`, JSON.stringify(updatedLibrary), {
            contentType: 'application/json',
            upsert: true
        })

    if (jsonError) throw jsonError

    return newEntry
}

export async function deleteVoiceFromLibrary(supabase: SupabaseClient, userId: string, voiceId: string): Promise<void> {
    let library = await getVoiceLibrary(supabase, userId)
    const voice = library.find(v => v.id === voiceId)

    if (!voice) return

    // 1. Remove files
    const filesToRemove = [`voice-clones/${userId}/${voiceId}.webm`]
    if (voice.photoUrl) {
        filesToRemove.push(`voice-clones/${userId}/${voiceId}_photo`)
    }

    await supabase.storage.from(BUCKET).remove(filesToRemove)

    // 2. Update JSON
    library = library.filter(v => v.id !== voiceId)

    await supabase.storage
        .from(BUCKET)
        .upload(`voice-clones/${userId}/${LIBRARY_FILE}`, JSON.stringify(library), {
            contentType: 'application/json',
            upsert: true
        })
}
