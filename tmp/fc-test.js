async function testFirecrawl() {
  const FIRE_KEY = "fc-35244cae6774480a8a2cd6832f99f08e";
  const url = "https://www.funda.nl/detail/koop/amsterdam/appartement-hugo-de-grootkade-20-4/43702165/";

  console.log("Starting Firecrawl...");
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
          console.log("HTML slice:", data.data.html.slice(0, 500));
          console.log("HTML length:", data.data.html.length);
      } else {
          console.log("Response:", data);
      }
  } catch(e) {
      console.error(e);
  }
}
testFirecrawl();
