/**
 * VoiceRealty Funda Content Script v6
 * Gebaseerd op geïnspecteerde Funda HTML structuur.
 * Fixes: Adres, Stad, Postcode en Woonoppervlakte direct uit JSON (NextData).
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

  function getBodyText() {
    return document.body.innerText || document.body.textContent || '';
  }

  function findInText(text, ...patterns) {
    for (const pattern of patterns) {
      const regex = new RegExp(pattern + '[:\\s]+([^\\n\\r]{1,80})', 'i');
      const m = text.match(regex);
      if (m && m[1].trim()) return m[1].trim();
    }
    return null;
  }

  function toTitleCase(str) {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  }

  function getNextListing() {
    try {
      const el = document.getElementById('__NEXT_DATA__');
      if (!el) return null;
      const json = JSON.parse(el.textContent);
      const pp = json?.props?.pageProps;
      return pp?.listing || pp?.property || pp?.object || null;
    } catch (e) { return null; }
  }

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

  function extractImages() {
    const images = new Set();
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg?.content) images.add(ogImg.content);
    ['img[src*="cloud.funda.nl"]', 'img[src*="images.funda.nl"]'].forEach(sel => {
      document.querySelectorAll(sel).forEach(img => {
        const src = img.src || img.getAttribute('data-src') || '';
        if (src.startsWith('http')) images.add(src);
      });
    });
    return Array.from(images).filter(Boolean).slice(0, 30);
  }

  function extractPropertyData() {
    const data = {};
    const bodyText = getBodyText();
    const kenmerken = getKenmerken();
    const listing = getNextListing();

    // 1. Adres, Stad, Postcode (Prioriteit voor JSON)
    if (listing) {
        data.address = toTitleCase(listing.address?.streetAddress || '');
        data.city = toTitleCase(listing.address?.addressLocality || '');
        data.postalCode = listing.address?.postalCode || '';
    }
    
    // Fallback voor Adres als JSON faalt
    if (!data.address) {
        const h1 = document.querySelector('h1');
        if (h1) {
            const mainSpan = h1.querySelector('span:first-child');
            let rawAddr = mainSpan ? mainSpan.textContent : h1.textContent;
            rawAddr = rawAddr.split(/\d{4}/)[0]; // Split op postcode start
            data.address = toTitleCase(rawAddr.trim());
        } else {
            data.address = toTitleCase(document.title.split('|')[0].trim());
        }
    }

    // Fallback voor Stad
    if (!data.city) {
      // Probeer "postal-code-city" of object-header__subtitle
      const cityEl = document.querySelector('[class*="object-header__subtitle"], [data-test-id="postal-code-city"], .object-header__subtitle');
      if (cityEl) {
        const t = cityEl.textContent.trim();
        // Zoek naar "1234 AB STAD" of gewoon "STAD"
        const m = t.match(/\d{4}\s*[A-Z]{2}\s+(.+)/i);
        data.city = toTitleCase(m ? m[1].trim() : t.replace(/\d{4}\s*[A-Z]{2}/, '').trim());
      }
      
      // Nog een poging via breadcrumbs of andere bekende velden
      if (!data.city) {
        const breadcrumbs = Array.from(document.querySelectorAll('.route-nav-list li, [class*="breadcrumb"]')).map(el => el.textContent.trim());
        if (breadcrumbs.length >= 3) {
            // Meestal: Home > Koop > AMSTERDAM > ...
            data.city = toTitleCase(breadcrumbs[2]);
        }
      }

      // Laatste strohalm: split de titel of h1 op de komma
      if (!data.city) {
        const fullTitle = document.querySelector('h1')?.textContent || document.title;
        if (fullTitle.includes(',')) {
          data.city = toTitleCase(fullTitle.split(',')[1].split('|')[0].trim());
        }
      }
    }

    // 2. Woonoppervlakte (Prioriteit voor JSON)
    data.surface_area = listing?.livingArea || listing?.livingSurface || listing?.surfaceArea || 0;
    
    if (!data.surface_area) {
        const oppRaw = kenmerken['woonoppervlakte'] || kenmerken['gebruiksoppervlakte wonen'] || kenmerken['wonen'] || findInText(bodyText, 'Woonoppervlakte', 'Gebruiksoppervlakte wonen');
        if (oppRaw) data.surface_area = parseInt(oppRaw.match(/(\d+)/)?.[1] || 0);
    }

    // 3. Kenmerken
    // Prijs
    const priceRaw = listing?.price?.value || listing?.price;
    if (priceRaw && typeof priceRaw === 'number') {
        data.price = priceRaw;
    } else {
        const priceMatch = bodyText.match(/€\s*([\d.]+)\s*(?:kosten koper|k\.k\.|vrij op naam|v\.o\.n)/i);
        data.price = priceMatch ? parseInt(priceMatch[1].replace(/\./g, '')) : null;
    }

    // Slaapkamers
    data.bedrooms = listing?.numberOfBedrooms || 0;
    if (!data.bedrooms) {
        const kamersRaw = kenmerken['aantal kamers'] || findInText(bodyText, 'Aantal kamers');
        if (kamersRaw) {
          const slpkMatch = kamersRaw.match(/\((\d+)\s*slaapkamer/i) || kamersRaw.match(/(\d+)\s*slaapkamer/i);
          if (slpkMatch) data.bedrooms = parseInt(slpkMatch[1]);
        }
        if (!data.bedrooms) {
            const tMatch = bodyText.match(/(\d+)\s*slaapkamer/i);
            if (tMatch) data.bedrooms = parseInt(tMatch[1]);
        }
    }

    // Badkamers
    data.bathrooms = listing?.numberOfBathrooms || 0;
    if (!data.bathrooms) {
        const badkRaw = kenmerken['aantal badkamers'] || kenmerken['badkamers'] || findInText(bodyText, 'Aantal badkamers');
        if (badkRaw) {
          const m = badkRaw.match(/(\d+)\s*badkamer/i);
          if (m) data.bathrooms = parseInt(m[1]);
        }
        if (!data.bathrooms) {
            const tMatch = bodyText.match(/(\d+)\s*badkamer/i);
            if (tMatch) data.bathrooms = parseInt(tMatch[1]);
        }
    }

    // Type
    data.propertyType = toTitleCase(listing?.propertyType || kenmerken['soort woonhuis'] || kenmerken['soort appartement'] || kenmerken['type woning'] || 
                        findInText(bodyText, 'Soort woonhuis', 'Soort appartement') || '');

    // 4. Features & Description
    data.features = {
      constructionYear: listing?.buildYear || kenmerken['bouwjaar'] || findInText(bodyText, 'Bouwjaar'),
      type: data.propertyType,
      energy_label: listing?.energyLabel || kenmerken['energielabel'] || findInText(bodyText, 'Energielabel'),
      layout: listing?.numberOfRooms ? `${listing.numberOfRooms} kamers` : (kenmerken['aantal kamers'] || ''),
      maintenance: kenmerken['onderhoud'] || '',
      surroundings: kenmerken['ligging'] || findInText(bodyText, 'Ligging') || '',
      city: data.city || ''
    };

    data.images = extractImages();
    data.image_url = data.images[0] || listing?.mainImage || null;
    data.description = document.querySelector('[data-test-id="description-text"], [class*="object-description__body"]')?.textContent?.trim() || 
                       listing?.description || '';

    data.source_url = window.location.href;

    return data;
  }
})();

