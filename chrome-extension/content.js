/**
 * VoiceRealty Funda Content Script v4
 * Gebaseerd op geïnspecteerde Funda HTML structuur.
 * Fixes: Verfijnde regex voor Type, Slaapkamers, Badkamers
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

    // Adres
    data.address = document.querySelector('h1')?.textContent?.trim() || 
                   listing?.address?.streetAddress || 
                   document.title.split('|')[0].trim();

    // Stad
    const cityEl = document.querySelector('[class*="object-header__subtitle"], [data-test-id="postal-code-city"]');
    if (cityEl) {
      const t = cityEl.textContent.trim();
      const m = t.match(/\d{4}\s*[A-Z]{2}\s+(.+)/);
      data.city = m ? m[1].trim() : t.replace(/\d{4}\s*[A-Z]{2}/, '').trim();
    }
    if (!data.city) data.city = listing?.address?.addressLocality || '';

    // Prijs
    const priceMatch = bodyText.match(/€\s*([\d.]+)\s*(?:kosten koper|k\.k\.|vrij op naam|v\.o\.n)/i);
    data.price = priceMatch ? parseInt(priceMatch[1].replace(/\./g, '')) : null;

    // Oppervlakte
    const oppRaw = kenmerken['woonoppervlakte'] || kenmerken['gebruiksoppervlakte wonen'] || findInText(bodyText, 'Woonoppervlakte');
    if (oppRaw) data.surface_area = parseInt(oppRaw.match(/(\d+)/)?.[1] || 0);

    // Slaapkamers (Cruciaal voor User)
    const kamersRaw = kenmerken['aantal kamers'] || findInText(bodyText, 'Aantal kamers');
    if (kamersRaw) {
      const slpkMatch = kamersRaw.match(/\((\d+)\s*slaapkamer/i) || kamersRaw.match(/(\d+)\s*slaapkamer/i);
      if (slpkMatch) data.bedrooms = parseInt(slpkMatch[1]);
    }
    if (!data.bedrooms) {
        const tMatch = bodyText.match(/(\d+)\s*slaapkamer/i);
        if (tMatch) data.bedrooms = parseInt(tMatch[1]);
    }

    // Badkamers
    const badkRaw = kenmerken['aantal badkamers'] || kenmerken['badkamers'] || findInText(bodyText, 'Aantal badkamers');
    if (badkRaw) {
      const m = badkRaw.match(/(\d+)\s*badkamer/i);
      if (m) data.bathrooms = parseInt(m[1]);
    }
    if (!data.bathrooms) {
        const tMatch = bodyText.match(/(\d+)\s*badkamer/i);
        if (tMatch) data.bathrooms = parseInt(tMatch[1]);
    }

    // Type
    data.propertyType = kenmerken['soort woonhuis'] || kenmerken['soort appartement'] || kenmerken['type woning'] || 
                        findInText(bodyText, 'Soort woonhuis', 'Soort appartement');

    // Features object
    data.features = {
      constructionYear: kenmerken['bouwjaar'] || findInText(bodyText, 'Bouwjaar') || listing?.buildYear,
      type: data.propertyType,
      energy_label: kenmerken['energielabel'] || findInText(bodyText, 'Energielabel'),
      layout: kamersRaw || '',
      maintenance: kenmerken['onderhoud'] || '',
      surroundings: kenmerken['ligging'] || findInText(bodyText, 'Ligging') || ''
    };

    // Images & Description
    data.images = extractImages();
    data.image_url = data.images[0] || null;
    data.description = document.querySelector('[data-test-id="description-text"], [class*="object-description__body"]')?.textContent?.trim() || '';

    // Source
    data.source_url = window.location.href;

    // Add top-level fields for API
    data.bedrooms = data.bedrooms || 0;
    data.bathrooms = data.bathrooms || 0;

    return data;
  }
})();
