import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
        return new NextResponse('Missing URL', { status: 400 })
    }

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'nl-NL,nl;q=0.9,en-US;q=0.8,en;q=0.7',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
            cache: 'no-store'
        })

        if (!response.ok) throw new Error('Fetch failed')

        let html = await response.text()

        // 1. Inject Base Tag to fix relative assets
        const urlObj = new URL(url)
        const baseTag = `<base href="${urlObj.origin}${urlObj.pathname}">`
        html = html.replace('<head>', `<head>${baseTag}`)

        // 2. STRIP FRAME-BUSTING JS
        // Many sites use code like: if(top!=self) top.location=self.location
        html = html.replace(/if\s*\(top\s*!==\s*self\)/gi, 'if(false)')
        html = html.replace(/if\s*\(window\.top\s*!==\s*window\.self\)/gi, 'if(false)')
        html = html.replace(/top\.location\.href\s*=/gi, 'console.log=')
        html = html.replace(/window\.top\.location\s*=/gi, 'console.log=')
        html = html.replace(/location\.replace\(.*top.*\)/gi, 'console.log()')

        // 3. Optional: Add a small style fix to ensure it fills the iframe
        const styleFix = `<style>body { background: transparent !important; } .funda-header, .funda-footer { display: none !important; }</style>`
        html = html.replace('</head>', `${styleFix}</head>`)

        return new Response(html, {
            headers: {
                'Content-Type': 'text/html',
                'X-Frame-Options': 'ALLOWALL',
                'Content-Security-Policy': "frame-ancestors 'self' *",
            }
        })
    } catch (error) {
        return NextResponse.redirect(url)
    }
}
