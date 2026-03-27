import { scrapeProperty } from '../src/app/actions/scrape-property'

async function run() {
  console.log("Starting scrape")
  const start = Date.now()
  try {
    const res = await scrapeProperty("https://www.funda.nl/detail/koop/amsterdam/appartement-hugo-de-grootkade-76-2/43702157/")
    const end = Date.now()
    console.log("Response:", JSON.stringify(res, null, 2))
    console.log(`\nDURATION: ${(end - start) / 1000} seconds`)
  } catch (e) {
    const end = Date.now()
    console.error("Crash:", e)
    console.log(`\nDURATION: ${(end - start) / 1000} seconds`)
  }
}

run()
