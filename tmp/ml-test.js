async function testMicrolink() {
  const url = "https://www.funda.nl/zoeken/koop/";
  console.log(`Testing Microlink for ${url}...`);
  try {
      const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&meta=false&prerender=true`);
      const data = await res.json();
      console.log("Success:", data.status);
      if (data.status === 'success' && data.data) {
          console.log("Response:", data.data);
      } else {
          console.log("Response:", data);
      }
  } catch(e) {
      console.error(e);
  }
}
testMicrolink();
