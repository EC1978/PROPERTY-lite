async function testFirecrawlMarkdown() {
  const FIRE_KEY = "fc-35244cae6774480a8a2cd6832f99f08e";
  const url = "https://www.funda.nl/detail/koop/amsterdam/appartement-kinkerstraat-102-1/43702165/"; // Fake but fundamentally correct structure
  // Let's use a known funda property URL if possible, or just `funda.nl`
  const testUrl = "https://www.funda.nl/";
  
  try {
      const fcResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
              'Authorization': `Bearer ${FIRE_KEY}`,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ url: testUrl, formats: ['markdown'] })
      });
      
      const data = await fcResponse.json();
      if (data.success && data.data && data.data.markdown) {
          console.log("Markdown length:", data.data.markdown.length);
          console.log(data.data.markdown.slice(0, 1000));
      } else {
          console.log("Failed:", data);
      }
  } catch(e) {
      console.error(e);
  }
}
testFirecrawlMarkdown();
