import { t } from './i18n.js';

export const COUNTRIES = [
  { code: 'DE', name: 'Deutschland' },
  { code: 'US', name: 'USA' },
  { code: 'GB', name: 'Großbritannien' },
  { code: 'FR', name: 'Frankreich' },
  { code: 'AT', name: 'Österreich' },
  { code: 'CH', name: 'Schweiz' },
  { code: 'NL', name: 'Niederlande' },
  { code: 'ES', name: 'Spanien' },
  { code: 'IT', name: 'Italien' },
  { code: 'XI', name: 'International' },
];

const STORAGE_KEY = 'Kryptogutscheine_country';

export function detectCountry() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && COUNTRIES.some((c) => c.code === saved)) return saved;
    const lang = (navigator.language || 'de-DE').toUpperCase();
    if (lang.includes('DE') || lang.startsWith('DE')) return 'DE';
    if (lang.includes('US')) return 'US';
    if (lang.includes('GB') || lang.includes('UK')) return 'GB';
    if (lang.includes('FR')) return 'FR';
    if (lang.includes('AT')) return 'AT';
    if (lang.includes('CH')) return 'CH';
  } catch {
    /* ignore */
  }
  return 'DE';
}

export function getCountry() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && COUNTRIES.some((c) => c.code === saved)) return saved;
  } catch {
    /* ignore */
  }
  return detectCountry();
}

export function saveCountry(code) {
  try {
    localStorage.setItem(STORAGE_KEY, code);
    window.dispatchEvent(new CustomEvent('Kryptogutscheine:country-change', { detail: code }));
  } catch {
    /* ignore */
  }
}

export function getCountryName(code) {
  const key = `country.${code}`;
  const localized = t(key);
  if (localized !== key) return localized;
  return COUNTRIES.find((c) => c.code === code)?.name || code;
}

export function renderCountryOptions(selected) {
  return COUNTRIES.map(
    (c) => `<option value="${c.code}" ${c.code === selected ? 'selected' : ''}>${c.name}</option>`
  ).join('');
}
