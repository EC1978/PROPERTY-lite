import { scrapeProperty } from './src/app/actions/scrape-property'

async function test() {
    try {
        console.log("Starting scrapeProperty...")
        const result = await scrapeProperty("https://www.funda.nl/detail/koop/amsterdam/appartement-hugo-de-grootkade-76-2/43702157/")
        console.log("Result:", JSON.stringify(result, null, 2))
    } catch (e) {
        console.error("Caught error:", e)
    }
}

test()
