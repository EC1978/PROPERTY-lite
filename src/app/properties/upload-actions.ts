'use server'

import { createClient } from '@/utils/supabase/server'
// Removed OpenAI - switched to Gemini 1.5 Flash for PDF extraction
export async function extractPropertyFromPdf(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Unauthorized')
    }

    const file = formData.get('file') as File
    if (!file) {
        throw new Error('No file uploaded')
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer())
        const uint8Array = new Uint8Array(buffer)

        if (typeof global !== 'undefined' && !(global as any).DOMMatrix) {
            (global as any).DOMMatrix = class DOMMatrix {}
        }

        // Dynamically import pdf-parse to prevent ReferenceError: DOMMatrix is not defined on Vercel Node runtime
        const pdfParseModule = await import('pdf-parse')
        const pdfParse = (pdfParseModule as any).default || pdfParseModule
        const data = await pdfParse(buffer)
        const text = data.text

        // Limit text length to avoid token limits (approx 35k chars should be enough for a brochure)
        const truncatedText = text.slice(0, 35000)

        const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY
        if (!GEMINI_API_KEY) {
            throw new Error('Google AI API key niet geconfigureerd in GOOGLE_AI_API_KEY')
        }

        const geminiController = new AbortController()
        const geminiTimeoutId = setTimeout(() => geminiController.abort(), 20000)

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `You are a real estate assistant. Extract the following details from the brochure text in JSON format.
Return ONLY valid JSON.
{
  "address": "Straat Huisnummer, Stad",
  "city": "Stad",
  "price": 0,
  "surface_area": 0,
  "bedrooms": 0,
  "bathrooms": 0,
  "description": "Uitgebreide wervende tekst (zoveel mogelijk details)",
  "features": {
      "constructionYear": "Bouwjaar of null",
      "type": "Woningtype (bijv. Vrijstaande woning) of null",
      "layout": "Indeling of null",
      "energy": "Volledige energie details of null",
      "energy_label": "Alleen de letter (bijv. A, B, C, A+++) of null",
      "maintenance": "Onderhoudsstaat of null",
      "surroundings": "Omgeving of null"
  }
}

CONTENT:
${truncatedText}`
                        }]
                    }]
                }),
                signal: geminiController.signal
            }
        )
        clearTimeout(geminiTimeoutId)

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text()
            throw new Error(`Gemini API error: ${geminiResponse.status} ${errorBody}`)
        }

        const geminiData = await geminiResponse.json()
        let aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'

        // Clean markdown backticks if Gemini adds them
        if (aiText.includes('```')) {
            aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim()
        }

        const result = JSON.parse(aiText)
        
        // Strip out 'undefined' properties which cause Server Component serialization 500 errors
        const safeData = JSON.parse(JSON.stringify(result))

        return {
            success: true,
            data: safeData
        }

    } catch (error: any) {
        console.error('Error processing PDF:', error)
        let errorMsg = error.message || 'Failed to process PDF'
        if (error.response?.data?.error?.message) {
            errorMsg = `OpenAI Error: ${error.response.data.error.message}`
        }
        
        // Return structured error instead of throwing to prevent generic Next.js 500 boundary crashes
        return { success: false, error: errorMsg }
    }
}
