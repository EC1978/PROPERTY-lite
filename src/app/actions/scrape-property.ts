'use server'

export async function scrapeProperty(url: string) {
    if (!url) {
        throw new Error('Geen URL opgegeven')
    }

    try {
        // 1. Fetch raw HTML with a timeout to prevent Vercel 504 Gateway Timeouts
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 seconds max for fetch

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
            next: { revalidate: 0 },
            signal: controller.signal
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            throw new Error(`Kan pagina niet ophalen (HTTP ${response.status})`)
        }

        let html = await response.text()

        // 1.5 Detect Cloudflare / Datadome Anti-Bot Blocks (HTTP 200 but CAPTCHA payload)
        if (
            html.includes('datadome') || 
            html.includes('Just a moment...') || 
            html.includes('cf-browser-verification') ||
            html.includes('Toegang geweigerd') ||
            html.includes('captcha-delivery') ||
            html.includes('veiligheidscontrole plaatsvindt') ||
            html.includes('Je bent er bijna') ||
            html.includes('beveiliging van het platform')
        ) {
            console.warn('Anti-bot block detected by Funda. Switching to Firecrawl API fallback...')
            
            const FIRECRAWL_KEY = process.env.FIRECRAWL_API_KEY
            if (!FIRECRAWL_KEY) {
                throw new Error('Funda blokkeert Vercel. Voeg FIRECRAWL_API_KEY toe in je omgeving om dit te omzeilen.')
            }

            const fcController = new AbortController()
            const fcTimeoutId = setTimeout(() => fcController.abort(), 20000) // 20s for Firecrawl

            const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${FIRECRAWL_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ url: url, formats: ['html'] }),
                signal: fcController.signal
            })
            clearTimeout(fcTimeoutId)

            if (!fcResponse.ok) {
                const err = await fcResponse.text()
                throw new Error(`Firecrawl proxy gefaald (HTTP ${fcResponse.status}): ${err}`)
            }

            const fcData = await fcResponse.json()
            if (!fcData.success || !fcData.data?.html) {
                throw new Error('Firecrawl fallback kon de pagina-HTML niet extraheren.')
            }

            html = fcData.data.html 
            console.log('Successfully extracted HTML via Firecrawl proxy.')

            // 1.6 Failsafe: Check if Firecrawl ALSO got intercepted by Datadome CAPTCHA.
            if (
                html.includes('datadome') || 
                html.includes('veiligheidscontrole plaatsvindt') ||
                html.includes('Je bent er bijna')
            ) {
                throw new Error('Funda blokkeert (via Datadome) helaas ook de geverifieerde Firecrawl API. Automatische URL import is onmogelijk gemaakt door Funda op live servers. Gebruik a.u.b. de PDF Brochure Upload functie!')
            }
        }

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

        // 4. Strip HTML for Gemini safely (preventing ReDoS catastrophic backtracking)
        const textContent = html
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()

        const truncatedText = textContent.slice(0, 40000)

        // 3. AI Extraction via Google Gemini
        const GEMINI_API_KEY = process.env.GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY
        if (!GEMINI_API_KEY) {
            throw new Error('Google AI API key niet geconfigureerd in GOOGLE_AI_API_KEY, NEXT_PUBLIC_GOOGLE_AI_API_KEY of NEXT_PUBLIC_GOOGLE_API_KEY')
        }

        const geminiController = new AbortController()
        const geminiTimeoutId = setTimeout(() => geminiController.abort(), 20000) // 20 seconds max for Gemini

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Je bent een expert vastgoed makelaar. Haal gestructureerde data uit de tekst.
                     
Retourneer ALLEEN de gevraagde JSON structuur. Geen tekst ervoor of erna.
{
    "address": "Straat Huisnummer, Stad",
    "city": "Stad",
    "price": 0,
    "surface_area": 0,
    "bedrooms": 0,
    "bathrooms": 0,
    "description": "Samenvatting (max 100 woorden)",
    "features": {
        "constructionYear": "Bouwjaar",
        "type": "Woningtype",
        "layout": "Indeling",
        "energy": "Volledige energie details en omschrijving",
        "energy_label": "Alleen de letter van het energielabel (bijv. A, B, C, A+++)",
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

        // Failsafe: Clean markdown backticks if Gemini adds them
        if (aiText.includes('```')) {
            aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim()
        }

        const aiResult = JSON.parse(aiText)

        // Merge AI results with DOM scraping results
        const finalMedia = {
            video_url: mediaLinks.video || aiResult.video_url,
            floorplan_url: mediaLinks.floorplan || aiResult.floorplan_url,
            tour_360_url: mediaLinks.tour360 || aiResult.tour_360_url
        }

        // Failsafe: Re-serialize explicitly to strip `undefined` properties which cause generic Server Component errors
        const safeData = JSON.parse(JSON.stringify({
            ...aiResult,
            ...finalMedia,
            scraped_images: validImages,
            image_url: validImages[0] || null
        }))

        return {
            success: true,
            data: safeData
        }

    } catch (error: any) {
        console.error('Error scraping property:', error)
        return { success: false, error: error.message || 'Kon de pagina niet scrapen.' }
    }
}
