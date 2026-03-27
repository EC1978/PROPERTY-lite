'use server'

import { createClient } from '@/utils/supabase/server'
import OpenAI from 'openai'

// Removing top-level pdf-parse import to prevent DOMMatrix Server Component crash on Vercel

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

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
        const PDFParse = (pdfParseModule as any).PDFParse || (pdfParseModule as any).default || pdfParseModule
        const instance = new PDFParse(uint8Array)
        const data = await instance.getText()
        const text = data.text

        // Limit text length to avoid token limits (approx 15k chars should be enough for a brochure)
        const truncatedText = text.slice(0, 15000)

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are a real estate assistant. Extract the following details from the brochure text in JSON format: address, price (number only), surface_area (number only), description (summary of max 50 words), city. If a field is missing, use null."
                },
                {
                    role: "user",
                    content: truncatedText
                }
            ],
            response_format: { type: "json_object" }
        })

        const result = JSON.parse(completion.choices[0].message.content || '{}')
        
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
