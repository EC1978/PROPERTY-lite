'use server'

export async function scrapeProperty(url: string) {
    if (!url) {
        throw new Error('Geen URL opgegeven')
    }

    try {
        // 1. Fetch raw HTML
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Upgrade-Insecure-Requests': '1'
            },
            next: { revalidate: 0 }
        })

        if (!response.ok) {
            throw new Error(`Kan pagina niet ophalen (HTTP ${response.status})`)
        }

        const html = await response.text()

        // 2. Extract Images via Regex
        const imageUrls = new Set<string>()

        // Look for typical image structures
        const imgRegex = /<img[^>]+src=["'](https?:\/\/[^"']+)["']/gi
        let match
        while ((match = imgRegex.exec(html)) !== null) {
            imageUrls.add(match[1])
        }

        // Look for property og:image
        const ogImageMatch = html.match(/<meta property="og:image" content=["'](https?:\/\/[^"']+)["']/)
        if (ogImageMatch) {
            imageUrls.add(ogImageMatch[1])
        }

        // Filter and clean images
        let validImages = Array.from(imageUrls).filter(src => {
            const lower = src.toLowerCase()
            return !lower.includes('logo') &&
                !lower.includes('icon') &&
                !lower.includes('avatar') &&
                !lower.includes('tracker') &&
                !lower.includes('.svg') &&
                !lower.includes('.gif')
        })

        // 3. Extract Media Links
        const mediaLinks = {
            video: html.match(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^"'\s]+/i)?.[0] || null,
            floorplan: null as string | null,
            tour360: html.match(/https?:\/\/(?:my\.)?matterport\.com\/show\/\?m=[a-zA-Z0-9]+/i)?.[0] || null
        }

        // 4. Strip HTML for Gemini
        const textContent = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()

        const truncatedText = textContent.slice(0, 40000)

        // 3. AI Extraction via Google Gemini
        const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY
        if (!GEMINI_API_KEY) {
            throw new Error('Google API key niet geconfigureerd in GOOGLE_AI_API_KEY')
        }

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Je bent een expert vastgoed makelaar. Haal gestructureerde data uit de tekst.
                     
Retourneer ALLEEN geldige JSON (geen markdown, geen backticks):
{
    "address": "Straat Huisnummer, Stad",
    "city": "Stad",
    "price": 0,
    "surface_area": 0,
    "bedrooms": 0,
    "bathrooms": 0,
    "description": "Samenvatting (max 100 woorden)",
    "label": "Energielabel",
    "features": {
        "constructionYear": "Bouwjaar",
        "type": "Woningtype",
        "layout": "Indeling",
        "energy": "Energie details",
        "maintenance": "Onderhoud",
        "surroundings": "Omgeving"
    },
    "video_url": null,
    "floorplan_url": null,
    "tour_360_url": null
}

URL: ${url}

CONTENT:
${truncatedText}`
                        }]
                    }],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                })
            }
        )

        if (!geminiResponse.ok) {
            const errorBody = await geminiResponse.text()
            throw new Error(`Gemini API error: ${geminiResponse.status} ${errorBody}`)
        }

        const geminiData = await geminiResponse.json()
        const aiText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '{}'
        const aiResult = JSON.parse(aiText)

        // Merge AI results with DOM scraping results
        const finalMedia = {
            video_url: mediaLinks.video || aiResult.video_url,
            floorplan_url: mediaLinks.floorplan || aiResult.floorplan_url,
            tour_360_url: mediaLinks.tour360 || aiResult.tour_360_url
        }

        return {
            success: true,
            data: {
                ...aiResult,
                ...finalMedia,
                scraped_images: validImages,
                image_url: validImages[0] || null
            }
        }

    } catch (error: any) {
        console.error('Error scraping property:', error)
        return { success: false, error: error.message || 'Kon de pagina niet scrapen.' }
    }
}
