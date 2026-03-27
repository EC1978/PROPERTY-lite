async function testUrl(name: string, url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log(`${name}: HTTP ${res.status}`);
    const text = await res.text();
    if (text.includes('Just a moment') || text.includes('captcha') || text.includes('datadome')) {
      console.log(`${name}: BLOCKED (Captcha/Datadome detected)`);
    } else if (text.length > 50000) {
      console.log(`${name}: SUCCESS (HTML length: ${text.length})`);
    } else {
      console.log(`${name}: UNKNOWN (${text.length} chars)`);
    }
  } catch (e: any) {
    console.error(`${name}: ERROR: ${e.message}`);
  }
}

async function runTest() {
  const fundaUrl = "https://www.funda.nl/detail/koop/amsterdam/appartement-hugo-de-grootkade-76-2/43702157/"
  const encodedUrl = encodeURIComponent(fundaUrl);
  
  await testUrl("Direct", fundaUrl);
  await testUrl("CorsProxy.io", `https://corsproxy.io/?url=${encodedUrl}`);
  await testUrl("AllOrigins", `https://api.allorigins.win/raw?url=${encodedUrl}`);
}

runTest();
