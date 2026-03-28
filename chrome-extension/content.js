/**
 * VoiceRealty Funda Content Script
 * Runs on funda.nl pages and extracts property data from the DOM.
 * The popup.js calls this via chrome.tabs.sendMessage().
 */

(function() {
  'use strict';

  // Listen for messages from the popup
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
    // Check URL pattern for funda detail pages
    const url = window.location.href;
    return url.includes('/detail/') || url.includes('/koop/') && document.querySelector('[data-test-id="street-name-house-number"]') !== null;
  }

  function getText(selector, fallback = '') {
    const el = document.querySelector(selector);
    return el ? el.textContent.trim() : fallback;
  }

  function extractPropertyData() {
    const data = {};

    // --- Address ---
    const streetEl = document.querySelector('[data-test-id="street-name-house-number"]');
    const cityEl = document.querySelector('[data-test-id="postal-code-city"]');

    if (streetEl) {
      data.address = streetEl.textContent.trim();
    } else {
      // Fallback: try og:title or h1
      const h1 = document.querySelector('h1');
      data.address = h1 ? h1.textContent.trim() : document.title.split('|')[0].trim();
    }

    if (cityEl) {
      const cityText = cityEl.textContent.trim();
      // Extract city from "1234 AB Amsterdam"
      const cityMatch = cityText.match(/\d{4}\s*[A-Z]{2}\s+(.+)/);
      data.city = cityMatch ? cityMatch[1].trim() : cityText;
      data.address = data.address + ', ' + (cityMatch ? cityMatch[1].trim() : cityText);
    }

    // --- Price ---
    const priceEl = document.querySelector('[data-test-id="price-sold"]') ||
                    document.querySelector('[class*="price"]') ||
                    document.querySelector('.object-header__price');
    if (priceEl) {
      const priceText = priceEl.textContent.trim();
      const priceMatch = priceText.match(/[\d.,]+/);
      if (priceMatch) {
        const cleaned = priceMatch[0].replace('.', '').replace(',', '.');
        data.price = Math.round(parseFloat(cleaned));
      }
    }

    // Fallback: og:price or structured data
    if (!data.price) {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]');
      for (const script of scripts) {
        try {
          const json = JSON.parse(script.textContent);
          if (json.offers && json.offers.price) {
            data.price = parseInt(json.offers.price);
            break;
          }
        } catch(e) {}
      }
    }

    // --- Surface Area ---
    const allDts = document.querySelectorAll('dt, [class*="kenmerken"] dt, .fd-feature-item__name');
    const allDds = document.querySelectorAll('dd, [class*="kenmerken"] dd, .fd-feature-item__value');

    const features = {};
    allDts.forEach((dt, i) => {
      const key = dt.textContent.trim().toLowerCase();
      const val = allDds[i] ? allDds[i].textContent.trim() : '';
      if (key && val) features[key] = val;
    });

    // Try to find woonoppervlakte
    const woonOpp = features['woonoppervlakte'] || features['gebruiksoppervlakte wonen'] || features['wonen'];
    if (woonOpp) {
      const match = woonOpp.match(/(\d+)/);
      if (match) data.surface_area = parseInt(match[1]);
    }

    // Try structured data for surface
    if (!data.surface_area) {
      try {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        for (const script of scripts) {
          const json = JSON.parse(script.textContent);
          if (json.floorSize) {
            data.surface_area = parseInt(json.floorSize.value || json.floorSize);
            break;
          }
        }
      } catch(e) {}
    }

    // --- Bedrooms ---
    const slaapEl = features['slaapkamers'] || features['aantal slaapkamers'];
    if (slaapEl) {
      const match = slaapEl.match(/(\d+)/);
      if (match) data.bedrooms = parseInt(match[1]);
    }

    // --- Energy Label ---
    const energyEl = document.querySelector('[class*="energy-label"]') ||
                     document.querySelector('[data-test-id="energy-label"]');
    const energyLabel = energyEl ? energyEl.textContent.trim().match(/[A-G]\+*/)?.[0] : null;

    // --- Build Features object ---
    data.features = {
      constructionYear: features['bouwjaar'] || features['jaar van bouw'] || '',
      type: features['soort woonobject'] || features['soort object'] || features['type woning'] || '',
      layout: features['indeling'] || features['aantal kamers'] || '',
      energy: features['energielabel'] || features['energie'] || (energyLabel ? `Energielabel ${energyLabel}` : ''),
      energy_label: energyLabel || (features['energielabel'] || '').match(/[A-G]\+*/)?.[0] || '',
      maintenance: features['onderhoud'] || '',
      surroundings: features['ligging'] || '',
    };

    // Remove empty feature values
    Object.keys(data.features).forEach(k => {
      if (!data.features[k]) delete data.features[k];
    });

    // --- Description ---
    const descEl = document.querySelector('.object-description__body') ||
                   document.querySelector('[class*="description"]') ||
                   document.querySelector('[data-test-id="description"]');
    if (descEl) {
      data.description = descEl.textContent.trim().slice(0, 2000);
    }

    // --- Images ---
    const images = new Set();

    // og:image first
    const ogImg = document.querySelector('meta[property="og:image"]');
    if (ogImg) images.add(ogImg.getAttribute('content'));

    // All gallery images
    document.querySelectorAll('img[src*="cdn.funda"], img[src*="images.funda"], img[src*="photo"]').forEach(img => {
      const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      if (src && src.startsWith('http') && !src.includes('.gif') && !src.includes('logo')) {
        // Get the largest version by removing size suffixes
        const cleanSrc = src.replace(/-\d+x\d+(\.\w+)$/, '$1');
        images.add(cleanSrc);
      }
    });

    // Also check srcset for high-res
    document.querySelectorAll('img[srcset]').forEach(img => {
      const srcset = img.getAttribute('srcset');
      if (srcset && srcset.includes('funda')) {
        const parts = srcset.split(',');
        const lastPart = parts[parts.length - 1].trim().split(' ')[0];
        if (lastPart.startsWith('http')) images.add(lastPart);
      }
    });

    const imageArray = Array.from(images).filter(Boolean);
    data.images = imageArray;
    data.image_url = imageArray[0] || null;

    // --- Media links ---
    // YouTube
    const youtubeLink = document.querySelector('a[href*="youtube.com"], a[href*="youtu.be"]');
    data.video_url = youtubeLink ? youtubeLink.href : null;

    // 360 tour / Matterport
    const matterportLink = document.querySelector('a[href*="matterport.com"]');
    data.tour_360_url = matterportLink ? matterportLink.href : null;

    // Source URL
    data.source_url = window.location.href;

    return data;
  }

})();
