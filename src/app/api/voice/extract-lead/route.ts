import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { rawText, propertyId } = body

        console.log("📥 Extract-lead called. Raw text length:", rawText?.length || 0)

        if (!rawText || rawText.trim().length < 10) {
            console.log("⚠️ Raw text too short, returning defaults")
            return NextResponse.json({
                name: null, phone: null, email: null,
                reason: null, budget: null, transcript: null, score: 10
            })
        }

        const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY
        if (!API_KEY) {
            console.error('❌ No Google API key for extraction')
            return NextResponse.json({ error: 'API key missing' }, { status: 500 })
        }
        console.log("🔑 API key found, length:", API_KEY.length)

        const extractionPrompt = `Je bent een data-extractie assistent. Hieronder staat een transcript van een gesprek tussen een AI vastgoed assistent en een bezoeker over een woning.

Analyseer dit transcript ZORGVULDIG en extraheer de volgende informatie:

1. naam: De volledige naam van de bezoeker (als die genoemd is)
2. telefoon: Het telefoonnummer van de bezoeker (kijk specifiek naar berichten van [BEZOEKER ZEGT])
3. email: Het e-mailadres van de bezoeker
4. reden: Waarom de bezoeker belde (bezichtiging, informatie, bod, etc.)
5. budget: Het budget of bod van de bezoeker (als dat genoemd is)
6. transcript: Een SCHONE samenvatting in het Nederlands van wat er besproken is, in maximaal 3-5 zinnen. Dit moet leesbaar zijn voor een makelaar.
7. score: Een lead score van 0-100:
   - 0-20: Geen interesse
   - 21-40: Vragen gesteld
   - 41-60: Interesse getoond
   - 61-80: Contactgegevens achtergelaten
   - 81-100: Bod geplaatst of bezichtiging ingepland

REGELS:
- Geef null terug als een veld niet gevonden kan worden
- Verzin NOOIT informatie
- Let op: [BEZOEKER ZEGT] bevat wat de bezoeker zei, [AI ZEGT] bevat het AI-antwoord

Antwoord in dit JSON formaat:
{"naam":null,"telefoon":null,"email":null,"reden":null,"budget":null,"transcript":"...","score":10}

--- TRANSCRIPT ---
${rawText}
--- EINDE ---`

        // Try multiple model names in order of preference
        const models = [
            'gemini-2.5-flash',
            'gemini-2.5-flash-preview-04-17',
            'gemini-2.0-flash-001'
        ]

        let lastError = ''

        for (const model of models) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`
            console.log(`🤖 Trying extraction with model: ${model}`)

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: extractionPrompt }]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            maxOutputTokens: 1024,
                            responseMimeType: "application/json"
                        }
                    })
                })

                if (!response.ok) {
                    const errText = await response.text()
                    console.error(`❌ Model ${model} failed (${response.status}):`, errText.substring(0, 500))
                    lastError = `${model}: ${response.status} - ${errText.substring(0, 200)}`
                    continue // Try next model
                }

                const result = await response.json()
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text

                if (!text) {
                    console.error(`❌ No text in ${model} response:`, JSON.stringify(result).substring(0, 500))
                    lastError = `${model}: No text in response`
                    continue
                }

                console.log(`✅ Got response from ${model}:`, text.substring(0, 300))

                // Parse the JSON response
                let extracted
                try {
                    extracted = JSON.parse(text)
                } catch (parseErr) {
                    console.error('❌ JSON parse failed, trying regex extraction:', text.substring(0, 300))
                    const jsonMatch = text.match(/\{[\s\S]*\}/)
                    if (jsonMatch) {
                        try {
                            extracted = JSON.parse(jsonMatch[0])
                        } catch {
                            extracted = { transcript: text, score: 10 }
                        }
                    } else {
                        extracted = { transcript: text, score: 10 }
                    }
                }

                console.log('✅ Extracted data:', JSON.stringify(extracted))

                return NextResponse.json({
                    name: extracted.naam || null,
                    phone: extracted.telefoon || null,
                    email: extracted.email || null,
                    reason: extracted.reden || null,
                    budget: extracted.budget || null,
                    transcript: extracted.transcript || null,
                    score: Math.min(100, Math.max(0, parseInt(extracted.score) || 10))
                })

            } catch (fetchErr: any) {
                console.error(`❌ Fetch error with ${model}:`, fetchErr.message)
                lastError = `${model}: ${fetchErr.message}`
                continue
            }
        }

        // All models failed - return error with details
        console.error('❌ All extraction models failed. Last error:', lastError)
        return NextResponse.json({
            error: 'All extraction models failed',
            details: lastError
        }, { status: 500 })

    } catch (err: any) {
        console.error('❌ Extract Lead API fatal error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
