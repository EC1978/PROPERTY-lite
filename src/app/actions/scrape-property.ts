'use server'

import puppeteer from 'puppeteer'

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

        // 1. Extract Images — Multi-strategy approach
        // Helper: extract all possible image URLs from a page
        const extractAllImages = async () => {
            return await page.evaluate(() => {
                const urls = new Set<string>()

                // Strategy A: All <img> src attributes
                document.querySelectorAll('img').forEach(img => {
                    if (img.src && img.src.startsWith('http')) urls.add(img.src)
                    // Also check data-lazy-src, data-src (lazy loading)
                    const lazySrc = img.getAttribute('data-lazy-src') || img.getAttribute('data-src') || img.getAttribute('data-lazy')
                    if (lazySrc && lazySrc.startsWith('http')) urls.add(lazySrc)
                    // srcset: pick the largest variant
                    const srcset = img.getAttribute('srcset')
                    if (srcset) {
                        const parts = srcset.split(',').map(s => s.trim().split(/\s+/))
                        // Sort by width descriptor (e.g. "800w") descending, take the largest
                        const sorted = parts.sort((a, b) => {
                            const wA = parseInt(a[1]) || 0
                            const wB = parseInt(b[1]) || 0
                            return wB - wA
                        })
                        if (sorted[0] && sorted[0][0].startsWith('http')) urls.add(sorted[0][0])
                    }
                })

                // Strategy B: <source> elements inside <picture>
                document.querySelectorAll('source').forEach(source => {
                    const srcset = source.getAttribute('srcset')
                    if (srcset) {
                        const parts = srcset.split(',').map(s => s.trim().split(/\s+/))
                        const sorted = parts.sort((a, b) => (parseInt(b[1]) || 0) - (parseInt(a[1]) || 0))
                        if (sorted[0] && sorted[0][0].startsWith('http')) urls.add(sorted[0][0])
                    }
                })

                // Strategy C: background-image in inline styles
                document.querySelectorAll('[style*="background"]').forEach(el => {
                    const style = (el as HTMLElement).style.backgroundImage
                    const match = style?.match(/url\(["']?(https?:\/\/[^"')]+)["']?\)/)
                    if (match) urls.add(match[1])
                })

                // Strategy D: <a> links to image files
                document.querySelectorAll('a[href]').forEach(a => {
                    const href = (a as HTMLAnchorElement).href
                    if (href && /\.(jpg|jpeg|png|webp)/i.test(href) && href.startsWith('http')) {
                        urls.add(href)
                    }
                })

                return Array.from(urls)
            })
        }

        // Get images from main property page
        let imageUrls = await extractAllImages()

        // Special handling for Funda: navigate to the /media/ gallery page for ALL photos
        const isFunda = url.toLowerCase().includes('funda.nl')
        if (isFunda) {
            try {
                // Funda's media gallery URL pattern
                const mediaUrl = url.replace(/\/$/, '') + (url.includes('/media') ? '' : '/#media')

                // Try clicking the photo gallery button first (more reliable)
                const clicked = await page.evaluate(() => {
                    // Look for the "Foto's" or media button on Funda
                    const buttons = Array.from(document.querySelectorAll('a, button'))
                    const mediaBtn = buttons.find(el => {
                        const text = (el as HTMLElement).innerText?.toLowerCase() || ''
                        const href = (el as HTMLAnchorElement).href || ''
                        return text.includes('foto') || text.includes('media') || href.includes('/media')
                    })
                    if (mediaBtn) {
                        (mediaBtn as HTMLElement).click()
                        return true
                    }
                    return false
                })

                if (clicked) {
                    await page.waitForTimeout(2000)
                } else {
                    // Fallback: navigate to media page directly
                    await page.goto(mediaUrl, { waitUntil: 'networkidle2', timeout: 30000 })
                }

                // Scroll down the gallery page to trigger lazy loading of all images
                await page.evaluate(async () => {
                    await new Promise<void>((resolve) => {
                        let totalHeight = 0
                        const distance = 400
                        const timer = setInterval(() => {
                            window.scrollBy(0, distance)
                            totalHeight += distance
                            if (totalHeight >= document.body.scrollHeight) {
                                clearInterval(timer)
                                resolve()
                            }
                        }, 150)
                        // Safety: stop after 10 seconds
                        setTimeout(() => { clearInterval(timer); resolve() }, 10000)
                    })
                })
                await page.waitForTimeout(1500)

                // Grab all images from the gallery page
                const galleryImages = await extractAllImages()
                imageUrls = [...new Set([...imageUrls, ...galleryImages])]
            } catch (fundaErr) {
                console.warn('Funda gallery extraction failed, continuing with main page images:', fundaErr)
            }
        } else {
            // For non-Funda sites: scroll the main page to trigger lazy loading
            await page.evaluate(async () => {
                await new Promise<void>((resolve) => {
                    let totalHeight = 0
                    const distance = 400
                    const timer = setInterval(() => {
                        window.scrollBy(0, distance)
                        totalHeight += distance
                        if (totalHeight >= document.body.scrollHeight) {
                            clearInterval(timer)
                            resolve()
                        }
                    }, 200)
                    setTimeout(() => { clearInterval(timer); resolve() }, 8000)
                })
            })
            await page.waitForTimeout(1000)
            const afterScrollImages = await extractAllImages()
            imageUrls = [...new Set([...imageUrls, ...afterScrollImages])]
        }

        // Filter: only keep likely property photos (not icons, logos, tiny assets)
        imageUrls = imageUrls.filter(src => {
            const lower = src.toLowerCase()
            // Exclude common non-photo patterns
            if (lower.includes('logo') || lower.includes('icon') || lower.includes('favicon')) return false
            if (lower.includes('sprite') || lower.includes('pixel') || lower.includes('tracker')) return false
            if (lower.includes('avatar') || lower.includes('badge') || lower.includes('button')) return false
            if (lower.includes('.svg') || lower.includes('.gif')) return false
            // Keep images that look like property photos
            return true
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

                if (!result.video && (src.includes('youtube') || src.includes('vimeo') || text.includes('video') || ariaLabel.includes('video'))) {
                    result.video = src
                }
                if (!result.floorplan && (text.includes('plattegrond') || ariaLabel.includes('plattegrond') || src.includes('floorplan'))) {
                    result.floorplan = src
                }
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

        // 3. AI Extraction via Google Gemini
        const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY
        if (!GEMINI_API_KEY) {
            throw new Error('Google API key niet geconfigureerd')
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
