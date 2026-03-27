import { scrapeProperty } from '../src/app/actions/scrape-property'

// Force the test to simulate a Cloudflare block by passing an invalid URL that we intercept?
// Actually, I can just test if the whole scrape Property works.
async function run() {
  process.env.FIRECRAWL_API_KEY = "fc-35244cae6774480a8a2cd6832f99f08e";
  
  console.log("Starting scrape with Firecrawl key loaded...");
  try {
    const res = await scrapeProperty("https://www.funda.nl/detail/koop/amsterdam/appartement-hugo-de-grootkade-20-4/43702165/")
    console.log("Success:", res.success);
    if (!res.success) {
      console.log("Error:", res.error);
    } else {
      console.log("Address:", res.data?.address);
      console.log("Images count:", res.data?.scraped_images?.length);
    }
  } catch (e) {
    console.error("Crash:", e)
  }
}

run()
