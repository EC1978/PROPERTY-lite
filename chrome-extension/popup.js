/**
 * VoiceRealty — Funda Importer Chrome Extension
 * Popup Script — handles all UI logic and API communication
 */

const DEFAULT_API_URL = 'https://property-lite-mocha.vercel.app';

// --- State ---
let currentData = null;
let currentToken = null;
let currentApiUrl = null;

// --- DOM Elements ---
const $ = id => document.getElementById(id);

const screens = {
  main: $('screen-main'),
  settings: $('screen-settings'),
};

const pages = {
  check: $('page-check'),
  ready: $('page-ready'),
  notFunda: $('page-not-funda'),
  noToken: $('page-no-token'),
  loading: $('page-loading'),
  success: $('page-success'),
  error: $('page-error'),
};

// --- Utility ---
function showPage(name) {
  Object.values(pages).forEach(p => p.classList.add('hidden'));
  if (pages[name]) pages[name].classList.remove('hidden');
}

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.add('hidden'));
  if (screens[name]) screens[name].classList.remove('hidden');
}

function formatPrice(price) {
  if (!price) return '';
  return '€ ' + Number(price).toLocaleString('nl-NL');
}

// --- Settings ---
async function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.local.get(['vrToken', 'vrApiUrl'], result => {
      resolve({
        token: result.vrToken || null,
        apiUrl: (result.vrApiUrl || DEFAULT_API_URL).replace(/\/$/, ''),
      });
    });
  });
}

async function saveSettings(token, apiUrl) {
  return new Promise(resolve => {
    chrome.storage.local.set({
      vrToken: token.trim(),
      vrApiUrl: (apiUrl || DEFAULT_API_URL).trim().replace(/\/$/, ''),
    }, resolve);
  });
}

// --- Main flow ---
async function init() {
  showScreen('main');
  showPage('check');

  const settings = await loadSettings();
  currentToken = settings.token;
  currentApiUrl = settings.apiUrl;

  // Fill settings form
  if (currentToken) $('input-token').value = currentToken;
  if (currentApiUrl !== DEFAULT_API_URL) $('input-url').value = currentApiUrl;

  // No token? Show setup screen
  if (!currentToken) {
    showPage('noToken');
    return;
  }

  // Check if we're on a Funda property page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || '';

  if (!url.includes('funda.nl')) {
    showPage('notFunda');
    return;
  }

  // Inject content script and check page
  try {
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkPage' });
    
    if (!response || !response.isFundaProperty) {
      showPage('notFunda');
      return;
    }

    // Extract data from the page
    const extractResponse = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });

    if (!extractResponse || !extractResponse.success) {
      showPage('notFunda');
      return;
    }

    currentData = extractResponse.data;
    renderPreview(currentData);
    showPage('ready');

  } catch (err) {
    // Content script might not be loaded yet (e.g. page just opened)
    // Try injecting it first
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js'],
      });
      // Retry
      const r1 = await chrome.tabs.sendMessage(tab.id, { action: 'checkPage' });
      if (!r1?.isFundaProperty) { showPage('notFunda'); return; }

      const r2 = await chrome.tabs.sendMessage(tab.id, { action: 'extractData' });
      if (!r2?.success) { showPage('notFunda'); return; }

      currentData = r2.data;
      renderPreview(currentData);
      showPage('ready');
    } catch (e) {
      showPage('notFunda');
    }
  }
}

function renderPreview(data) {
  const displayAddress = data.city ? `${data.address}, ${data.city}` : (data.address || 'Onbekend adres');
  $('preview-address').textContent = displayAddress;
  $('preview-price').textContent = data.price ? formatPrice(data.price) : 'Prijs onbekend';

  const metaParts = [];
  if (data.surface_area) metaParts.push(data.surface_area + ' m²');
  if (data.bedrooms) metaParts.push(data.bedrooms + ' slaapkamers');
  if (data.features?.energy_label) metaParts.push('Label ' + data.features.energy_label);
  $('preview-meta').textContent = metaParts.join(' · ') || 'Kenmerken laden...';

  // Image
  const imgContainer = $('preview-image');
  if (data.image_url) {
    const img = document.createElement('img');
    img.src = data.image_url;
    img.onerror = () => { /* keep placeholder */ };
    imgContainer.innerHTML = '';
    imgContainer.appendChild(img);
  }
}

async function importProperty() {
  if (!currentData || !currentToken) return;

  showPage('loading');

  try {
    const response = await fetch(`${currentApiUrl}/api/import-property`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`,
      },
      body: JSON.stringify(currentData),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || `Server fout (${response.status})`);
    }

    // Success!
    $('btn-open').href = result.editUrl;
    showPage('success');

    // Auto-open after 1.5s
    setTimeout(() => {
      chrome.tabs.create({ url: result.editUrl });
    }, 1500);

  } catch (err) {
    $('error-msg').textContent = err.message || 'Onbekende fout.';
    showPage('error');
  }
}

// --- Event Listeners ---
document.addEventListener('DOMContentLoaded', () => {
  init();

  // Import button
  $('btn-import').addEventListener('click', importProperty);

  // Retry button
  $('btn-retry').addEventListener('click', init);

  // Setup / no token button
  $('btn-setup').addEventListener('click', () => showScreen('settings'));

  // Settings button
  $('btn-settings').addEventListener('click', () => showScreen('settings'));

  // Back button
  $('btn-back').addEventListener('click', () => {
    showScreen('main');
    showPage('check');
    init();
  });

  // Toggle token visibility
  $('btn-toggle-token').addEventListener('click', () => {
    const input = $('input-token');
    const icon = $('toggle-icon');
    if (input.type === 'password') {
      input.type = 'text';
      icon.textContent = 'visibility_off';
    } else {
      input.type = 'password';
      icon.textContent = 'visibility';
    }
  });

  // Save settings
  $('btn-save').addEventListener('click', async () => {
    const token = $('input-token').value.trim();
    const url = $('input-url').value.trim() || DEFAULT_API_URL;

    if (!token) {
      $('input-token').focus();
      return;
    }

    await saveSettings(token, url);
    currentToken = token;
    currentApiUrl = url;

    const feedback = $('save-feedback');
    feedback.classList.remove('hidden');
    setTimeout(() => feedback.classList.add('hidden'), 2500);
  });
});
