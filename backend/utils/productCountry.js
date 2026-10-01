/** Welche Produkt-Regionen zu einem Shop-Land passen. */
const SHOP_COUNTRY_REGIONS = {
  DE: ['DE', 'EU'],
  AT: ['AT', 'DE', 'EU'],
  CH: ['CH', 'DE', 'EU'],
  FR: ['FR', 'EU'],
  NL: ['NL', 'EU'],
  ES: ['ES', 'EU'],
  IT: ['IT', 'EU'],
  US: ['US'],
  GB: ['GB', 'UK'],
  XI: ['XI', 'EU', 'US', 'GB', 'DE', 'FR', 'NL', 'ES', 'IT', 'AT', 'CH'],
};

const EU_SHOP_COUNTRIES = new Set(['DE', 'AT', 'CH', 'FR', 'NL', 'ES', 'IT']);

/** Region aus API-Feldern und Produkt-ID ableiten. */
export function inferProductRegions(product) {
  const regions = new Set();
  const id = String(product?.id || '').toLowerCase();
  const code = String(product?.country_code || '').toUpperCase();
  const name = String(product?.country_name || '').toLowerCase();

  if (code) regions.add(code);
  if (code === 'UK') regions.add('GB');

  if (id.includes('european-union') || id.includes('-eu') || id.includes('eur-international') || name.includes('europe')) {
    regions.add('EU');
  }
  if (id.includes('-germany') || id.endsWith('germany') || name.includes('germany')) regions.add('DE');
  if (id.includes('-usa') || id.includes('_usa') || id.endsWith('-usa') || name.includes('united states')) regions.add('US');
  if (id.includes('united-kingdom') || id.includes('-uk') || name.includes('united kingdom')) regions.add('GB');
  if (id.includes('-france') || name.includes('france')) regions.add('FR');
  if (id.includes('-netherlands') || name.includes('netherlands')) regions.add('NL');
  if (id.includes('-spain') || name.includes('spain')) regions.add('ES');
  if (id.includes('-italy') || name.includes('italy')) regions.add('IT');
  if (id.includes('-austria') || name.includes('austria')) regions.add('AT');
  if (id.includes('-switzerland') || name.includes('switzerland')) regions.add('CH');
  if (id.includes('international') || id.includes('global')) regions.add('XI');

  return regions;
}

/** Passt ein Gutschein zum gewählten Shop-Land? */
export function matchesProductCountry(product, selectedCountry) {
  const shop = String(selectedCountry || 'DE').toUpperCase();
  const allowed = SHOP_COUNTRY_REGIONS[shop] || [shop];
  const productRegions = inferProductRegions(product);
  const id = String(product?.id || '').toLowerCase();

  if (EU_SHOP_COUNTRIES.has(shop)) {
    if (id.includes('-usa') || id.includes('_usa') || product?.country_code === 'US') return false;
    if (id.includes('united-kingdom') || id.includes('-uk') || product?.country_code === 'GB') return false;
  }

  if (shop === 'US') {
    if (id.includes('-germany') || product?.country_code === 'DE') return false;
    if (id.includes('-france') || product?.country_code === 'FR') return false;
    if (id.includes('united-kingdom') || product?.country_code === 'GB') return false;
  }

  if (shop === 'GB') {
    if (id.includes('-usa') || product?.country_code === 'US') return false;
    if (id.includes('-germany') || product?.country_code === 'DE') return false;
  }

  if (!productRegions.size) return true;

  return [...productRegions].some((r) => allowed.includes(r));
}
