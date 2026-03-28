/**
 * VoiceRealty Funda Content Script v2
 * Betere selectors voor Funda's React-rendered HTML.
 * Primaire bron: JSON-LD structured data (meest betrouwbaar)
 * Fallback: DOM selectors + tekst-herkenning
 */

(function () {
  'use strict';

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkPage') {
      sendResponse({ isFundaProperty: isFundaPropertyPage() });
      return true;
    }
    if (request.action === 'extractData') {
      try {
        const data = extractPropertyData();
        sendResponse({ success: true, data });
      } catch (e) {
        sendResponse({ success: false, error: e.message });
      }
      return true;
    }
  });

  function isFundaPropertyPage() {
    const url = window.location.href;
    // Funda detail pages: /detail/ of /koop|huur/stad/adres/id/
    return (
      url.includes('funda.nl/detail/') ||
      (url.includes('funda.nl') && /\/(koop|huur)\/[^/]+\/[^/]+-\d+\/?/.test(url))
    );
  }

  // ─── JSON-LD Structured Data (meest betrouwbaar) ───────────────────
  function getJsonLd() {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    let merged = {};
    for (const s of scripts) {
      try {
        const obj = JSON.parse(s.textContent);
        if (obj['@type'] === 'Residence' || obj['@type'] === 'House' ||
          obj['@type'] === 'Apartment' || obj.address || obj.name) {
          merged = { ...merged, ...obj };
        }
      } catch (e) {}
    }
    return merged;
  }

  // ─── Kenmerken tabel uitlezen (dt/dd pairs) ────────────────────────
  function getKenmerken() {
    const result = {};
    // Funda gebruikt <dl> met <dt> keys en <dd> values
    const dls = document.querySelectorAll('dl');
    dls.forEach(dl => {
      const dts = dl.querySelectorAll('dt');
      const dds = dl.querySelectorAll('dd');
      dts.forEach((dt, i) => {
        const key = dt.textContent.trim().toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/:$/, '');
        const val = dds[i] ? dds[i].textContent.trim() : '';
        if (key && val) result[key] = val;
      });
    });

    // Fallback: zoek ook spans/divs met kenmerk-achtige structuur
    // Funda 2024 gebruikt soms data-test-id op specifieke elementen
    const possible = [
      '[data-test-id="object-kenmerken-list"]',
      '.object-kenmerken',
      '[class*="kenmerken"]',
      '[class*="ObjectDetails"]',
      '[class*="object-details"]',
    ];
    for (const sel of possible) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const items = el.querySelectorAll('li, div[class*="item"], div[class*="row"]');
      items.forEach(item => {
        const parts = item.textContent.trim().split(/\n|\t|:{2,}/).map(s => s.trim()).filter(Boolean);
        if (parts.length >= 2) {
          result[parts[0].toLowerCase()] = parts[1];
        }
      });
    }
    return result;
  }

  // ─── Specifieke header-statistieken (kamers, slaapkamers, opp) ────
  function getHeaderStats() {
    const result = {};
    // Funda toont stats als: "4 kamers" "3 slpk." "112 m²" in de header
    const stats = document.querySelectorAll(
      '[data-test-id*="stat"], [class*="object-header__stats"] li, ' +
      '[class*="header-stats"] li, [class*="listing-stats"] li, ' +
      '.object-header__item, [class*="ObjectHeaderStats"] li'
    );
    stats.forEach(el => {
      const text = el.textContent.trim().toLowerCase();
      if (/\d+\s*(slpk|slaapkamer)/.test(text)) {
        const m = text.match(/(\d+)/);
        if (m) result.bedrooms = parseInt(m[1]);
      }
      if (/\d+\s*(badkamer|badk)/.test(text)) {
        const m = text.match(/(\d+)/);
        if (m) result.bathrooms = parseInt(m[1]);
      }
      if (/\d+\s*m[²2]/.test(text)) {
        const m = text.match(/(\d+)/);
        if (m) result.surface_area = parseInt(m[1]);
      }
      if (/\d+\s*kamer/.test(text) && !result.rooms) {
        const m = text.match(/(\d+)/);
        if (m) result.rooms = parseInt(m[1]);
      }
    });
    return result;
  }

  // ─── Structured data Funda soms in __NEXT_DATA__ ──────────────────
  function getNextData() {
    try {
      const el = document.getElementById('__NEXT_DATA__');
      if (!el) return null;
      const json = JSON.parse(el.textContent);
      // Zoek de property data diep in de Next.js page props
      const props = json?.props?.pageProps;
      if (!props) return null;
      // Kan op verschillende plekken zitten
      return props.listing || props.property || props.object || props.data || null;
    } catch (e) {
      return null;
    }
  }

  // ─── Prijs extractor ───────────────────────────────────────────────
  function extractPrice(html) {
    // Probeer meerdere selectors voor prijs
    const priceSelectors = [
      '[class*="price-sale"]',
      '[class*="Price"]',
      '[data-test-id*="price"]',
      '.object-header__price',
      '[class*="asking-price"]',
      'span[class*="price"]',
    ];
    for (const sel of priceSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent.trim();
        // Match: € 399.000 of 399000 of 399,000
        const m = text.match(/[\d.,]{3,}/);
        if (m) {
          const clean = m[0].replace(/\./g, '').replace(',', '.');
          const num = Math.round(parseFloat(clean));
          if (num > 10000) return num;
        }
      }
    }
    return null;
  }

  // ─── Adres extractor ──────────────────────────────────────────────
  function extractAddress() {
    const selectors = [
      '[data-test-id="street-name-house-number"]',
      '[class*="object-header__title"]',
      '[class*="AddressTitle"]',
      'h1[class*="address"]',
      '.object-header h1',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el.textContent.trim();
    }
    // Fallback: h1
    const h1 = document.querySelector('h1');
    return h1 ? h1.textContent.trim() : document.title.split('|')[0].trim();
  }

  function extractCity() {
    const selectors = [
      '[data-test-id="postal-code-city"]',
      '[class*="object-header__subtitle"]',
      '[class*="AddressSubtitle"]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const text = el.textContent.trim();
        const m = text.match(/\d{4}\s*[A-Z]{2}\s+(.+)/);
        return m ? m[1].trim() : text.replace(/\d{4}\s*[A-Z]{2}/, '').trim();
      }
    }
    // Probeer URL: funda.nl/detail/koop/den-haag/...
    const urlMatch = window.location.pathname.match(/\/(?:koop|huur)\/([^/]+)\//);
    if (urlMatch) return urlMatch[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    return '';
  }

  // ─── Foto's extractor ─────────────────────────────────────────────
  function extractImages() {
    const images = new Set();

    // og:image altijd eerst
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg?.content) images.add(ogImg.content);

    // Funda CDN foto's
    const patterns = [
      'img[src*="cloud.funda.nl"]',
      'img[src*="images.funda.nl"]',
      'img[data-src*="cloud.funda.nl"]',
      'img[data-lazy*="cloud.funda.nl"]',
      'source[srcset*="cloud.funda.nl"]',
    ];
    for (const pat of patterns) {
      document.querySelectorAll(pat).forEach(el => {
        const src = el.src || el.getAttribute('data-src') || el.getAttribute('data-lazy');
        if (src && src.startsWith('http')) images.add(src);
        // srcset: neem de grootste
        const srcset = el.srcset || el.getAttribute('srcset') || '';
        if (srcset) {
          const parts = srcset.split(',').map(p => p.trim().split(' ')[0]);
          parts.forEach(p => { if (p.startsWith('http')) images.add(p); });
        }
      });
    }

    // Alle jpg/png/webp afbeeldingen filteren
    document.querySelectorAll('img[src]').forEach(img => {
      const src = img.src;
      if (!src || !src.startsWith('http')) return;
      if (src.includes('.gif') || src.includes('logo') || src.includes('icon') ||
        src.includes('avatar') || src.includes('placeholder') || src.includes('sprite')) return;
      if (img.naturalWidth > 200 || img.width > 200) images.add(src);
    });

    return Array.from(images).filter(Boolean).slice(0, 30);
  }

  // ─── Omschrijving ─────────────────────────────────────────────────
  function extractDescription() {
    const selectors = [
      '[data-test-id="description-text"]',
      '[class*="object-description__body"]',
      '[class*="Description-body"]',
      '[class*="listing-description"]',
      'div[class*="description"] p',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 50) {
        return el.textContent.trim().slice(0, 2000);
      }
    }
    // Fallback: zoek de langste <p>
    let longest = '';
    document.querySelectorAll('p').forEach(p => {
      const t = p.textContent.trim();
      if (t.length > longest.length && t.length > 100) longest = t;
    });
    return longest.slice(0, 2000);
  }

  // ─── Hoofd extractie functie ──────────────────────────────────────
  function extractPropertyData() {
    const data = {};

    // 1. Probeer __NEXT_DATA__ (meest compleet als aanwezig)
    const nextData = getNextData();

    // 2. JSON-LD
    const jsonLd = getJsonLd();

    // 3. Kenmerken tabel
    const kenmerken = getKenmerken();

    // 4. Header stats
    const headerStats = getHeaderStats();

    // ── Adres & Stad ──
    data.address = extractAddress();
    const city = extractCity();
    data.city = city;
    if (city && !data.address.toLowerCase().includes(city.toLowerCase())) {
      data.address = data.address + ', ' + city;
    }

    // JSON-LD adres als fallback
    if (jsonLd.address && !data.address) {
      const a = jsonLd.address;
      data.address = [a.streetAddress, a.addressLocality].filter(Boolean).join(', ');
      data.city = a.addressLocality || city;
    }

    // ── Prijs ──
    data.price = extractPrice() ||
      (nextData?.price || nextData?.askingPrice || nextData?.koopprijs) ||
      (jsonLd.offers?.price) ||
      null;
    if (data.price) data.price = parseInt(String(data.price).replace(/[^0-9]/g, ''));

    // ── Oppervlakte ──
    const oppKeys = ['woonoppervlakte', 'gebruiksoppervlakte wonen', 'wonen', 'oppervlakte', 'living area', 'woonoppervlak'];
    for (const k of oppKeys) {
      if (kenmerken[k]) {
        const m = kenmerken[k].match(/(\d+)/);
        if (m) { data.surface_area = parseInt(m[1]); break; }
      }
    }
    if (!data.surface_area && headerStats.surface_area) data.surface_area = headerStats.surface_area;
    if (!data.surface_area && jsonLd.floorSize) data.surface_area = parseInt(jsonLd.floorSize.value || jsonLd.floorSize);
    if (!data.surface_area && nextData?.surfaceArea) data.surface_area = parseInt(nextData.surfaceArea);

    // ── Slaapkamers ──
    const slpkKeys = ['slaapkamers', 'aantal slaapkamers', 'bedrooms', 'number of bedrooms', 'slaapkamer'];
    for (const k of slpkKeys) {
      if (kenmerken[k]) {
        const m = kenmerken[k].match(/(\d+)/);
        if (m) { data.bedrooms = parseInt(m[1]); break; }
      }
    }
    if (!data.bedrooms && headerStats.bedrooms) data.bedrooms = headerStats.bedrooms;
    if (!data.bedrooms && jsonLd.numberOfRooms) {
      // Soms geeft JSON-LD het totaal aantal kamers, niet slaapkamers
    }
    if (!data.bedrooms && nextData?.numberOfBedrooms) data.bedrooms = parseInt(nextData.numberOfBedrooms);
    // Extra: zoek in paginatekst naar patroon "X slaapkamers"
    if (!data.bedrooms) {
      const bodyText = document.body.innerText;
      const m = bodyText.match(/(\d+)\s*slaapkamer/i);
      if (m) data.bedrooms = parseInt(m[1]);
    }

    // ── Badkamers ──
    const badkKeys = ['badkamers', 'aantal badkamers', 'bathrooms', 'badkamer'];
    for (const k of badkKeys) {
      if (kenmerken[k]) {
        const m = kenmerken[k].match(/(\d+)/);
        if (m) { data.bathrooms = parseInt(m[1]); break; }
      }
    }
    if (!data.bathrooms && headerStats.bathrooms) data.bathrooms = headerStats.bathrooms;
    if (!data.bathrooms && nextData?.numberOfBathrooms) data.bathrooms = parseInt(nextData.numberOfBathrooms);
    if (!data.bathrooms) {
      const bodyText = document.body.innerText;
      const m = bodyText.match(/(\d+)\s*badkamer/i);
      if (m) data.bathrooms = parseInt(m[1]);
    }

    // ── Woningtype ──
    const typeKeys = ['soort woonobject', 'soort object', 'type woning', 'woningtype', 'type', 'soort', 'object type'];
    for (const k of typeKeys) {
      if (kenmerken[k]) { data.propertyType = kenmerken[k]; break; }
    }
    if (!data.propertyType && nextData?.type) data.propertyType = nextData.type;
    if (!data.propertyType && jsonLd['@type']) {
      const typeMap = { 'Residence': 'Woning', 'House': 'Huis', 'Apartment': 'Appartement' };
      data.propertyType = typeMap[jsonLd['@type']] || jsonLd['@type'];
    }

    // ── Bouwjaar ──
    const bouwjaarKeys = ['bouwjaar', 'jaar van bouw', 'construction year', 'built'];
    let bouwjaar = '';
    for (const k of bouwjaarKeys) {
      if (kenmerken[k]) { bouwjaar = kenmerken[k].match(/(\d{4})/)?.[0] || ''; break; }
    }
    if (!bouwjaar && nextData?.buildYear) bouwjaar = String(nextData.buildYear);

    // ── Energielabel ──
    const energyKeys = ['energielabel', 'energy label', 'energie'];
    let energyLabel = '';
    let energyFull = '';
    for (const k of energyKeys) {
      if (kenmerken[k]) {
        energyFull = kenmerken[k];
        const m = kenmerken[k].match(/^([A-G]\+*)/);
        if (m) energyLabel = m[1];
        break;
      }
    }
    // Fallback: DOM element
    if (!energyLabel) {
      const energyEl = document.querySelector('[class*="energy-label"], [data-test-id*="energy"]');
      if (energyEl) {
        const m = energyEl.textContent.match(/[A-G]\+*/);
        if (m) energyLabel = m[0];
      }
    }
    if (!energyLabel && nextData?.energyLabel) energyLabel = nextData.energyLabel;

    // ── Ligging / Omgeving ──
    const liggingKeys = ['ligging', 'locatie', 'omgeving', 'location'];
    let ligging = '';
    for (const k of liggingKeys) {
      if (kenmerken[k]) { ligging = kenmerken[k]; break; }
    }

    // ── Onderhoud ──
    let onderhoud = kenmerken['onderhoud'] || kenmerken['maintenance'] || '';

    // ── Indeling ──
    let indeling = kenmerken['indeling'] || kenmerken['layout'] || '';
    if (!indeling && data.bedrooms) {
      const parts = [];
      if (data.bedrooms) parts.push(`${data.bedrooms} slaapkamers`);
      if (data.bathrooms) parts.push(`${data.bathrooms} badkamers`);
      indeling = parts.join(', ');
    }

    // Features object samenstellen
    data.features = {};
    if (bouwjaar) data.features.constructionYear = bouwjaar;
    if (data.propertyType) data.features.type = data.propertyType;
    if (indeling) data.features.layout = indeling;
    if (energyFull || energyLabel) data.features.energy = energyFull || `Energielabel ${energyLabel}`;
    if (energyLabel) data.features.energy_label = energyLabel;
    if (onderhoud) data.features.maintenance = onderhoud;
    if (ligging) data.features.surroundings = ligging;

    // ── Afbeeldingen ──
    const imageArray = extractImages();
    data.images = imageArray;
    data.image_url = imageArray[0] || null;

    // ── Omschrijving ──
    data.description = extractDescription();

    // ── Media Links ──
    const youtubeLink = document.querySelector('a[href*="youtube.com"], a[href*="youtu.be"], iframe[src*="youtube"]');
    data.video_url = youtubeLink ? (youtubeLink.href || youtubeLink.src) : null;
    const matterLink = document.querySelector('a[href*="matterport"], iframe[src*="matterport"]');
    data.tour_360_url = matterLink ? (matterLink.href || matterLink.src) : null;

    // ── Bron URL ──
    data.source_url = window.location.href;

    return data;
  }

})();
