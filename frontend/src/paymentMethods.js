import { ALLOWED_PAYMENT_METHODS } from '@shared/constants.js';

/** Asset-Gruppen mit Netzwerk-Auswahl – IDs entsprechen Bitrefill payment_method. */
export const PAYMENT_FAMILIES = [
  {
    id: 'bitcoin',
    label: 'Bitcoin',
    icon: '₿',
    color: '#f7931a',
    summary: 'BTC · etabliert & sicher',
    options: [
      {
        id: 'lightning',
        network: 'Lightning',
        tag: 'Empfohlen',
        speed: 'Sofort',
        description: 'Schnellste Option · geringe Gebühren',
        addressLabel: 'Lightning-Rechnung (BOLT11)',
        hint: 'Keine On-Chain-Adresse – Lightning-Rechnung (lnbc…) scannen oder in der Wallet einfügen.',
      },
      {
        id: 'bitcoin',
        network: 'On-Chain',
        tag: 'Klassisch',
        speed: '~10–60 Min.',
        description: 'Maximale Sicherheit · Bitcoin Mainnet',
        addressLabel: 'Bitcoin-Adresse',
        hint: 'Exakten Betrag an diese On-Chain-Adresse senden (bc1…, 1… oder 3…).',
      },
    ],
  },
  {
    id: 'ethereum',
    label: 'Ethereum',
    icon: 'Ξ',
    color: '#627eea',
    summary: 'ETH · Mainnet',
    options: [
      {
        id: 'ethereum',
        network: 'Mainnet',
        tag: 'Etabliert',
        speed: '~1–5 Min.',
        description: 'Ethereum Layer 1',
        addressLabel: 'Ethereum-Adresse',
        hint: 'Exakten ETH-Betrag an diese Adresse (0x…) auf Ethereum Mainnet senden.',
      },
    ],
  },
  {
    id: 'solana',
    label: 'Solana',
    icon: '◎',
    color: '#9945ff',
    summary: 'SOL · schnell & günstig',
    options: [
      {
        id: 'solana',
        network: 'Mainnet',
        tag: 'Schnell',
        speed: 'Sekunden',
        description: 'Niedrige Gebühren',
        addressLabel: 'Solana-Adresse',
        hint: 'Nur SOL an diese Adresse senden – keine SPL-Token.',
      },
    ],
  },
  {
    id: 'usdc',
    label: 'USDC',
    icon: '$',
    color: '#2775ca',
    summary: 'USD-Stablecoin · 1:1 USD',
    options: [
      {
        id: 'usdc_erc20',
        network: 'Ethereum',
        tag: 'Etabliert',
        speed: '~1–5 Min.',
        description: 'ERC-20 auf Mainnet',
        addressLabel: 'USDC Empfangsadresse',
        hint: 'Netzwerk: Ethereum Mainnet. Token: USDC (ERC-20).',
      },
      {
        id: 'usdc_polygon',
        network: 'Polygon',
        tag: 'Günstig',
        speed: '~1 Min.',
        description: 'Niedrige Gebühren',
        addressLabel: 'USDC Empfangsadresse',
        hint: 'Netzwerk: Polygon. Nur USDC auf Polygon – nicht Ethereum!',
      },
      {
        id: 'usdc_base',
        network: 'Base',
        tag: 'L2',
        speed: '~1 Min.',
        description: 'Coinbase Layer 2',
        addressLabel: 'USDC Empfangsadresse',
        hint: 'Netzwerk: Base (L2). Nur USDC auf Base.',
      },
      {
        id: 'usdc_arbitrum',
        network: 'Arbitrum',
        tag: 'L2',
        speed: '~1 Min.',
        description: 'Ethereum Rollup',
        addressLabel: 'USDC Empfangsadresse',
        hint: 'Netzwerk: Arbitrum. Nur USDC auf Arbitrum.',
      },
      {
        id: 'usdc_solana',
        network: 'Solana',
        tag: 'Schnell',
        speed: 'Sekunden',
        description: 'SPL-Token auf Solana',
        addressLabel: 'USDC Empfangsadresse',
        hint: 'Netzwerk: Solana. Nur USDC (SPL) – nicht Ethereum oder Polygon!',
      },
    ],
  },
  {
    id: 'usdt',
    label: 'USDT',
    icon: '₮',
    color: '#26a17b',
    summary: 'USD-Stablecoin · 1:1 USD',
    options: [
      {
        id: 'usdt_trc20',
        network: 'Tron',
        tag: 'Empfohlen',
        speed: 'Sekunden',
        description: 'TRC-20 · weit verbreitet',
        addressLabel: 'USDT Empfangsadresse',
        hint: 'Netzwerk: Tron (TRC-20). Nicht ERC-20 oder BEP-20 verwenden!',
      },
      {
        id: 'usdt_erc20',
        network: 'Ethereum',
        tag: 'Etabliert',
        speed: '~1–5 Min.',
        description: 'ERC-20 auf Mainnet',
        addressLabel: 'USDT Empfangsadresse',
        hint: 'Netzwerk: Ethereum Mainnet. Token: USDT (ERC-20).',
      },
      {
        id: 'usdt_polygon',
        network: 'Polygon',
        tag: 'Günstig',
        speed: '~1 Min.',
        description: 'Niedrige Gebühren',
        addressLabel: 'USDT Empfangsadresse',
        hint: 'Netzwerk: Polygon. Nur USDT auf Polygon.',
      },
    ],
  },
];

/** Flache Liste für Abwärtskompatibilität. */
export const PAYMENT_METHODS = PAYMENT_FAMILIES.flatMap((family) =>
  family.options.map((opt) => ({
    id: opt.id,
    familyId: family.id,
    group: family.label,
    label: family.options.length > 1 ? `${family.label} · ${opt.network}` : family.label,
    checkoutLabel:
      family.options.length > 1 ? `${family.label} (${opt.network})` : `${family.label}${opt.network !== 'Mainnet' ? ` (${opt.network})` : ''}`,
    network: opt.network,
    icon: family.icon,
    color: family.color,
    description: opt.description,
    speed: opt.speed,
    tag: opt.tag,
    addressLabel: opt.addressLabel,
    hint: opt.hint,
    stablecoin: family.id === 'usdc' || family.id === 'usdt',
  }))
);

export const ALLOWED_PAYMENT_METHOD_IDS = ALLOWED_PAYMENT_METHODS;

const STORAGE_KEY = 'Kryptogutscheine_payment_method';

export function getPaymentMethod(id) {
  return PAYMENT_METHODS.find((m) => m.id === id) || PAYMENT_METHODS[0];
}

export function getFamilyForMethod(id) {
  const method = getPaymentMethod(id);
  return PAYMENT_FAMILIES.find((f) => f.id === method.familyId) || PAYMENT_FAMILIES[0];
}

export function normalizePaymentMethod(id) {
  return ALLOWED_PAYMENT_METHOD_IDS.includes(id) ? id : 'lightning';
}

export function getSavedPaymentMethod() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizePaymentMethod(saved);
  } catch {
    /* ignore */
  }
  return 'lightning';
}

export function savePaymentMethod(id) {
  try {
    localStorage.setItem(STORAGE_KEY, normalizePaymentMethod(id));
  } catch {
    /* ignore */
  }
}

