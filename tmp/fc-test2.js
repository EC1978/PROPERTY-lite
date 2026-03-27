async function testFirecrawlHTML() {
  const FIRE_KEY = "fc-35244cae6774480a8a2cd6832f99f08e";
  // A definitely valid funda URL. We can just use the user's URL if they have one or search one on funda.
  // Actually, I can use https://www.funda.nl/detail/koop/amsterdam/appartement-hugo-de-grootkade-76-2/43702157/ if it expired it might 404.
  // Let me use a very generic funda URL or fetch the funda homepage.
  const url = "https://www.funda.nl/zoeken/koop/";

  console.log(`Starting Firecrawl for ${url}...`);
  try {
      const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${FIRE_KEY}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: url, formats: ['html'] })
      });
      
      console.log("Status:", fcResponse.status);
      const data = await fcResponse.json();
      console.log("Success flag:", data.success);
      if (data.success && data.data && data.data.html) {
          console.log("HTML length:", data.data.html.length);
          const fs = require('fs');
          fs.writeFileSync('tmp/firecrawl_output.html', data.data.html);
          console.log("Saved to tmp/firecrawl_output.html");
      } else {
          console.log("Response:", data);
      }
  } catch(e) {
      console.error(e);
  }
}
testFirecrawlHTML();
