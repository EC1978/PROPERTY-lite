'use server'

import { createClient } from '@/utils/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function magicEditTemplate(templateId: string, currentHtml: string, prompt: string) {
    const supabase = await createClient()

    // Verify superadmin status
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Niet geauthenticeerd' }

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'superadmin') {
        return { success: false, error: 'Geen toegang. Alleen superadmins kunnen templates bewerken.' }
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Je bent een expert in e-mail templates en HTML. Je krijgt een e-mail template in HTML-formaat en een instructie van een gebruiker om deze aan te passen.

VOORWAARDEN:
1. Behoud de technische structuur (zoals <table>, <div>, styles, padding) zo veel mogelijk.
2. Pas de tekst, toon of inhoud aan op basis van het verzoek van de gebruiker.
3. BELANGRIJK: Behoud alle dynamische placeholders (zoals {{lead_name}}, {{property_address}}, {{agent_name}}, etc.) EXACT zoals ze zijn. Verwijder ze NOOIT, tenzij de gebruiker daar expliciet om vraagt.
4. Lever alleen de ruwe HTML-inhoud terug, zonder Markdown code blocks of andere uitleg.
5. Zorg dat de HTML nog steeds valide is en goed weergeeft.`
                },
                {
                    role: "user",
                    content: `Huidige HTML:\n${currentHtml}\n\nInstructie: ${prompt}`
                }
            ]
        })

        const newHtml = completion.choices[0].message.content?.trim() || ''
        
        // Remove markdown code blocks if the AI added them anyway
        const cleanHtml = newHtml.replace(/^```html\n?/, '').replace(/\n?```$/, '')

        return { success: true, newHtml: cleanHtml }
    } catch (error: any) {
        console.error('MagicEdit Error:', error)
        return { success: false, error: error.message || 'AI assistent kon de aanpassing niet uitvoeren.' }
    }
}
