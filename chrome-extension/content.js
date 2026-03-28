/**
 * VoiceRealty Funda Content Script v3
 * Gebaseerd op geïnspecteerde Funda HTML structuur.
 * Primaire strategie: innerText regex op bekende Funda patronen
 * Fallback: DL/DT/DD kenmerken + __NEXT_DATA__ JSON
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
    return (
      url.includes('funda.nl/detail/') ||
      (url.includes('funda.nl') && /\/(koop|huur)\/[^/]+\/[^/]+-\d+\/?/.test(url))
    );
  }

  // ─── Haal de volledige paginatekst op (innerText geeft zichtbare tekst) ──────
  function getBodyText() {
    return document.body.innerText || document.body.textContent || '';
  }

  // ─── Zoek waarde via "Label: Waarde" patroon in de tekst ──────────────────
  function findInText(text, ...patterns) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern + '[:\\s]+([^\\n\\r]{1,80})', 'i');
      const m = text.match(regex);
      if (m && m[1].trim()) return m[1].trim();
    }
    return null;
  }

  // ─── Haal __NEXT_DATA__ op (meest betrouwbare bron) ──────────────────────
  function getNextListing() {
    try {
      const el = document.getElementById('__NEXT_DATA__');
      if (!el) return null;
      const json = JSON.parse(el.textContent);
      // Funda slaat listing data op in pageProps.listing
      const pp = json?.props?.pageProps;
      return pp?.listing || pp?.property || pp?.object || null;
    } catch (e) {
      return null;
    }
  }

  // ─── DL/DT/DD kenmerken uitlezen ────────────────────────────────────────
  function getKenmerken() {
    const result = {};
    document.querySelectorAll('dl').forEach(dl => {
      const dts = dl.querySelectorAll('dt');
      const dds = dl.querySelectorAll('dd');
      dts.forEach((dt, i) => {
        const key = dt.textContent.trim().toLowerCase().replace(/\s+/g, ' ');
        const val = dds[i] ? dds[i].textContent.trim() : '';
        if (key && val) result[key] = val;
      });
    });
    return result;
  }

  // ─── Afbeeldingen extraheren ─────────────────────────────────────────────
  function extractImages() {
    const images = new Set();
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg?.content) images.add(ogImg.content);

    // Funda CDN
    ['img[src*="cloud.funda.nl"]', 'img[src*="images.funda.nl"]',
      'img[data-src*="cloud.funda.nl"]'].forEach(sel => {
      document.querySelectorAll(sel).forEach(img => {
        const src = img.src || img.getAttribute('data-src') || '';
        if (src.startsWith('http')) images.add(src);
      });
    });

    // Grote afbeeldingen via srcset
    document.querySelectorAll('img[srcset]').forEach(img => {
      const srcset = img.getAttribute('srcset') || '';
      srcset.split(',').forEach(part => {
        const url = part.trim().split(' ')[0];
        if (url.startsWith('http') && (url.includes('funda') || url.includes('cloud'))) {
          images.add(url);
        }
      });
    });

    // Fallback: bekijk alle grote plaatjes
    document.querySelectorAll('img[src]').forEach(img => {
      const src = img.src || '';
      if (!src.startsWith('http')) return;
      if (/logo|icon|avatar|placeholder|sprite|\.gif|\.svg/i.test(src)) return;
      if ((img.naturalWidth || img.width || 0) > 300) images.add(src);
    });

    return Array.from(images).filter(Boolean).slice(0, 20);
  }

  // ─── Omschrijving extraheren ──────────────────────────────────────────────
  function extractDescription() {
    const selectors = [
      '[data-test-id="description-text"]',
      '[class*="object-description__body"]',
      '[class*="Description"]',
      '.listing-description',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim().length > 80) return el.textContent.trim().slice(0, 2000);
    }
    // Zoek langste alinea
    let longest = '';
    document.querySelectorAll('p').forEach(p => {
      const t = p.textContent.trim();
      if (t.length > longest.length && t.length > 100) longest = t;
    });
    return longest.slice(0, 2000);
  }

  // ─── Hoofd extractie ─────────────────────────────────────────────────────
  function extractPropertyData() {
    const data = {};
    const bodyText = getBodyText();
    const kenmerken = getKenmerken();
    const listing = getNextListing(); // __NEXT_DATA__.props.pageProps.listing

    // ── Adres ──
    const adresSelectors = [
      '[data-test-id="street-name-house-number"]',
      '[data-testid="address"]',
      '[class*="object-header__title"]',
      '[class*="AddressTitle"]',
      'h1',
    ];
    for (const sel of adresSelectors) {
      const el = document.querySelector(sel);
      if (el?.textContent?.trim()) { data.address = el.textContent.trim(); break; }
    }
    if (!data.address) data.address = listing?.address?.streetAddress || document.title.split('|')[0].trim();

    // ── Stad ──
    const stadSelectors = [
      '[data-test-id="postal-code-city"]',
      '[data-testid="postcode-city"]',
      '[class*="object-header__subtitle"]',
    ];
    for (const sel of stadSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const t = el.textContent.trim();
        const m = t.match(/\d{4}\s*[A-Z]{2}\s+(.+)/);
        data.city = m ? m[1].trim() : t.replace(/\d{4}\s*[A-Z]{2}/, '').trim();
        break;
      }
    }
    if (!data.city && listing?.address?.addressLocality) data.city = listing.address.addressLocality;
    if (data.city && data.address && !data.address.toLowerCase().includes(data.city.toLowerCase())) {
      data.address = data.address + ', ' + data.city;
    }

    // ── Prijs ──
    // Funda patroon: "€ 399.000 kosten koper" of "€ 399.000 k.k."
    const priceMatch = bodyText.match(/€\s*([\d.]+)\s*(?:kosten koper|k\.k\.|vrij op naam|v\.o\.n)/i);
    if (priceMatch) {
      data.price = parseInt(priceMatch[1].replace(/\./g, ''));
    }
    if (!data.price) {
      // Probeer data-testid price
      const priceEl = document.querySelector('[data-testid="price"], [data-test-id="price"]');
      if (priceEl) {
        const m = priceEl.textContent.match(/[\d.]+/);
        if (m) data.price = parseInt(m[0].replace(/\./g, ''));
      }
    }
    if (!data.price && listing?.price?.purchasePrice) data.price = listing.price.purchasePrice;

    // ── Oppervlakte ──
    // Funda kenmerken: "Woonoppervlakte: 86 m²"
    const oppRaw = kenmerken['woonoppervlakte'] || kenmerken['gebruiksoppervlakte wonen'] || kenmerken['oppervlakte'];
    if (oppRaw) { const m = oppRaw.match(/(\d+)/); if (m) data.surface_area = parseInt(m[1]); }
    if (!data.surface_area) {
      const m = bodyText.match(/Woonoppervlakte[:\s]+(\d+)\s*m/i);
      if (m) data.surface_area = parseInt(m[1]);
    }
    if (!data.surface_area && listing?.livingArea) data.surface_area = parseInt(listing.livingArea);

    // ── Slaapkamers ──
    // Funda patroon: "Aantal kamers: 4 kamers (3 slaapkamers)"
    const kamersRaw = kenmerken['aantal kamers'] || findInText(bodyText, 'Aantal kamers');
    if (kamersRaw) {
      // Extract getal tussen haakjes: "(3 slaapkamers)"
      const slpkInHaakjes = kamersRaw.match(/\((\d+)\s*slaapkamer/i);
      if (slpkInHaakjes) data.bedrooms = parseInt(slpkInHaakjes[1]);
      // Of direct: "3 slaapkamers"
      if (!data.bedrooms) {
        const directMatch = kamersRaw.match(/(\d+)\s*slaapkamer/i);
        if (directMatch) data.bedrooms = parseInt(directMatch[1]);
      }
    }
    // Fallback: zoek "Aantal slaapkamers: X" apart
    if (!data.bedrooms) {
      const slpkRaw = kenmerken['aantal slaapkamers'] || kenmerken['slaapkamers'];
      if (slpkRaw) { const m = slpkRaw.match(/(\d+)/); if (m) data.bedrooms = parseInt(m[1]); }
    }
    if (!data.bedrooms) {
      const m = bodyText.match(/(\d+)\s*slaapkamer/i);
      if (m) data.bedrooms = parseInt(m[1]);
    }
    if (!data.bedrooms && listing?.bedroomCount) data.bedrooms = parseInt(listing.bedroomCount);

    // ── Badkamers ──
    // Funda patroon: "Aantal badkamers: 1 badkamer en 1 apart toilet"
    const badkRaw = kenmerken['aantal badkamers'] || kenmerken['badkamers'] || findInText(bodyText, 'Aantal badkamers');
    if (badkRaw) {
      const m = badkRaw.match(/(\d+)\s*badkamer/i);
      if (m) data.bathrooms = parseInt(m[1]);
    }
    if (!data.bathrooms) {
      const m = bodyText.match(/(\d+)\s*badkamer/i);
      if (m) data.bathrooms = parseInt(m[1]);
    }
    if (!data.bathrooms && listing?.bathroomCount) data.bathrooms = parseInt(listing.bathroomCount);

    // ── Woningtype ──
    // Funda velden: "Soort appartement", "Soort woonobject", etc.
    const typeKeys = ['soort appartement', 'soort woonobject', 'soort object', 'type woning', 'woningtype'];
    for (const k of typeKeys) {
      if (kenmerken[k]) { data.propertyType = kenmerken[k].split('\n')[0].trim(); break; }
    }
    if (!data.propertyType) {
      // Zoek in tekst: "Soort appartement: Benedenwoning"
      const typeMatch = bodyText.match(/Soort\s+(?:appartement|woonobject|object|woning)[:\s]+([^\n\r]+)/i);
      if (typeMatch) data.propertyType = typeMatch[1].trim().split(/\n/)[0];
    }
    if (!data.propertyType && listing?.propertyType) data.propertyType = listing.propertyType;

    // ── Energielabel ──
    const energyKeys = ['energielabel', 'energie'];
    let energyLabel = '';
    for (const k of energyKeys) {
      if (kenmerken[k]) {
        const m = kenmerken[k].match(/^([A-G]\+*)/);
        if (m) { energyLabel = m[1]; break; }
      }
    }
    if (!energyLabel) {
      const energyEl = document.querySelector('[class*="energy-label"], [data-test-id*="energy"]');
      if (energyEl) { const m = energyEl.textContent.match(/[A-G]\+*/); if (m) energyLabel = m[0]; }
    }
    if (!energyLabel) {
      const m = bodyText.match(/Energielabel[:\s]+([A-G]\+*)/i);
      if (m) energyLabel = m[1];
    }
    if (!energyLabel && listing?.energyLabel) energyLabel = listing.energyLabel;

    // ── Bouwjaar ──
    let bouwjaar = kenmerken['bouwjaar'] || findInText(bodyText, 'Bouwjaar') || '';
    if (bouwjaar) { const m = bouwjaar.match(/(\d{4})/); bouwjaar = m ? m[1] : ''; }
    if (!bouwjaar && listing?.buildYear) bouwjaar = String(listing.buildYear);

    // ── Overige features ──
    const ligging = kenmerken['ligging'] || findInText(bodyText, 'Ligging') || '';
    const onderhoud = kenmerken['onderhoud'] || '';
    let indeling = kenmerken['indeling'] || '';
    if (!indeling && (data.bedrooms || data.bathrooms)) {
      const parts = [];
      if (data.bedrooms) parts.push(`${data.bedrooms} slaapkamers`);
      if (data.bathrooms) parts.push(`${data.bathrooms} badkamers`);
      indeling = parts.join(', ');
    }

    // Features object
    data.features = {};
    if (bouwjaar) data.features.constructionYear = bouwjaar;
    if (data.propertyType) data.features.type = data.propertyType;
    if (indeling) data.features.layout = indeling;
    if (energyLabel) data.features.energy = `Energielabel ${energyLabel}`;
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
    const ytEl = document.querySelector('a[href*="youtube.com"], a[href*="youtu.be"], iframe[src*="youtube"]');
    data.video_url = ytEl ? (ytEl.href || ytEl.src) : null;
    const mtEl = document.querySelector('a[href*="matterport"], iframe[src*="matterport"]');
    data.tour_360_url = mtEl ? (mtEl.href || mtEl.src) : null;

    // ── Bron ──
    data.source_url = window.location.href;

    return data;
  }

})();
