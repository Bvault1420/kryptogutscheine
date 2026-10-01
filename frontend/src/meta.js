const PAGES = {

  '/': { title: 'Kryptogutscheine – Gutscheine mit Crypto kaufen', desc: 'Digitale Gutscheine mit Bitcoin, Lightning, Ethereum & Solana kaufen.' },

  '/shop': { title: 'Gutschein-Shop – Kryptogutscheine', desc: 'Alle digitalen Gutscheine – Amazon, Steam, Google Play und mehr.' },

  '/cart': { title: 'Warenkorb – Kryptogutscheine', desc: 'Dein Warenkorb mit Gutscheinen.' },

  '/payment': { title: 'Zahlung – Kryptogutscheine', desc: 'QR-Code und Adresse für deine Krypto-Zahlung.' },

  '/orders': { title: 'Bestellhistorie – Kryptogutscheine', desc: 'Deine gespeicherten Bestellungen exportieren und verwalten.' },

  '/favorites': { title: 'Favoriten – Kryptogutscheine', desc: 'Deine gespeicherten Gutscheine.' },

  '/order-status': { title: 'Bestellstatus – Kryptogutscheine', desc: 'Verfolge deine Gutschein-Bestellung.' },

  '/agb': { title: 'AGB – Kryptogutscheine', desc: 'Allgemeine Geschäftsbedingungen von Kryptogutscheine.' },

  '/widerruf': { title: 'Widerrufsbelehrung – Kryptogutscheine', desc: 'Informationen zum Widerrufsrecht.' },

  '/impressum': { title: 'Impressum – Kryptogutscheine', desc: 'Anbieterkennzeichnung und Kontakt.' },

  '/datenschutz': { title: 'Datenschutz – Kryptogutscheine', desc: 'Datenschutzerklärung von Kryptogutscheine.' },

  '/faq': { title: 'FAQ – Kryptogutscheine', desc: 'Häufig gestellte Fragen zu Kryptogutscheine.' },

};



export function setPageMeta(path, extra = {}) {

  const base = PAGES[path] || PAGES['/'];

  const title = extra.title || base.title;

  const desc = extra.desc || base.desc;



  document.title = title;

  let meta = document.querySelector('meta[name="description"]');

  if (!meta) {

    meta = document.createElement('meta');

    meta.name = 'description';

    document.head.appendChild(meta);

  }

  meta.content = desc;



  let og = document.querySelector('meta[property="og:title"]');

  if (!og) {

    og = document.createElement('meta');

    og.setAttribute('property', 'og:title');

    document.head.appendChild(og);

  }

  og.content = title;

}

