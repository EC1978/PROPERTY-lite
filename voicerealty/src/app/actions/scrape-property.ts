'use server'

import puppeteer from 'puppeteer'
import OpenAI from 'openai'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
})

export async function scrapeProperty(url: string) {
    if (!url) {
        throw new Error('Geen URL opgegeven')
    }

    let browser = null
    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        })

        const page = await browser.newPage()
        await page.setViewport({ width: 1920, height: 1080 })

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 60000
        })

        // 1. Extract Images (ALL high-res images)
        const imageUrls = await page.evaluate(() => {
            const images = Array.from(document.querySelectorAll('img'))
            return images
                .filter(img => {
                    const rect = img.getBoundingClientRect()
                    // Filter out small images, but keep reasonable size for gallery
                    return rect.width > 300 && rect.height > 200
                })
                .map(img => img.src)
                .filter(src => src.startsWith('http'))
                .filter((value, index, self) => self.indexOf(value) === index)
            // Remove limit to get ALL photos as requested
        })

        // 2. Extract Media Links (Video, Floorplan, 360) via DOM analysis
        const mediaLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a, iframe'))
            const result = {
                video: null as string | null,
                floorplan: null as string | null,
                tour360: null as string | null
            }

            links.forEach(el => {
                const src = (el as HTMLAnchorElement).href || (el as HTMLIFrameElement).src || ''
                const text = (el as HTMLElement).innerText?.toLowerCase() || ''
                const ariaLabel = (el as HTMLElement).getAttribute('aria-label')?.toLowerCase() || ''

                // Video
                if (!result.video && (src.includes('youtube') || src.includes('vimeo') || text.includes('video') || ariaLabel.includes('video'))) {
                    result.video = src
                }

                // Floorplan (Plattegrond)
                if (!result.floorplan && (text.includes('plattegrond') || ariaLabel.includes('plattegrond') || src.includes('floorplan'))) {
                    result.floorplan = src
                }

                // 360 Tour
                if (!result.tour360 && (text.includes('360') || text.includes('tour') || ariaLabel.includes('360') || src.includes('matterport') || src.includes('tour'))) {
                    result.tour360 = src
                }
            })
            return result
        })

        const pageText = await page.evaluate(() => document.body.innerText)

        await browser.close()
        browser = null

        const truncatedText = pageText.slice(0, 40000)

        // 3. AI Extraction
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `Je bent een expert vastgoed makelaar. Haal gestructureerde data uit de tekst.
                    
                    Retourneer JSON:
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
                        "video_url": "URL naar video indien in tekst gevonden (anders null)",
                        "floorplan_url": "URL naar plattegrond indien in tekst gevonden (anders null)",
                        "tour_360_url": "URL naar 360 tour indien in tekst gevonden (anders null)"
                    }
                    `
                },
                {
                    role: "user",
                    content: `URL: ${url}\n\nCONTENT:\n${truncatedText}`
                }
            ],
            response_format: { type: "json_object" }
        })

        const aiResult = JSON.parse(completion.choices[0].message.content || '{}')

        // Merge AI results with DOM scraping results (prefer DOM for media links if found, as AI might halluciante URLs from text)
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
                scraped_images: imageUrls,
                image_url: imageUrls[0] || null
            }
        }

    } catch (error: any) {
        console.error('Error scraping property:', error)
        if (browser) await browser.close()
        return { success: false, error: error.message || 'Kon de pagina niet scrapen.' }
    }
}
