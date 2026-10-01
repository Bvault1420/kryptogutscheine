import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const key = process.env.BITREFILL_API_KEY?.trim();
const headers = { Authorization: `Bearer ${key}`, Accept: 'application/json' };

const candidates = {
  DE: [
    'forzieri-germany', 'nelly_com-germany', 'idea-shopping-germany', 'canda-pin-germany',
    'hunkemoller-pin-germany', 'mydays-de', 'misterspex-germany', 'intersport-germany',
    'die-moderne-germany', 'dille-and-kamille-germany', 'eat-the-world-germany',
    'engbers-germany', 'fitnessraum_de-germany', 'spotify-germany', 'disney-plus-germany',
    'apple-germany', 'mango-germany', 'about-you-germany', 'notebooksbilliger-de',
  ],
  AT: [
    'zalando-austria', 'ticketmaster-austria', 'cyberport-at', 'handm-austria',
    'media-markt-austria', 'adidas-at', 'mango-gift-card-austria', 'apple-austria',
    'nintendo-austria', 'calzedonia-austria', 'jochen-schweizer-at', 'ikea-at',
    'sixt-austria', 'tk-maxx-austria', 'christ-austria', 'twitch-austria', 'nike-austria',
    'xbox-austria', 'douglas-austria', 'saturn-austria', 'rewe-austria', 'foot-locker-austria',
  ],
  CH: [
    'psn-switzerland', 'zalando-ch', 'handm-geschenkkarte-switzerland-chf', 'xbox-switzerland',
    'ticketcorner-switzerland', 'media-markt-switzerland', 'nintendo-switzerland', 'ikea-switzerland',
    'manor-switzerland', 'globus-switzerland', 'coop-switzerland', 'just-eat-switzerland',
    'mango-ch', 'apple-switzerland', 'decathlon_switzerland', 'adidas_switzerland',
    'orell-fussli-ch', 'foot-locker-switzerland', 'spotify-switzerland', 'playstation-ch',
  ],
  FR: [
    'nike-france', 'primark-fr', 'foot-locker-france', 'ikea-france', 'zalando-france',
    'la-redoute-france', 'marionnaud-fr', 'sephora-france', 'fnac-darty-fr', 'uber-eats-france',
  ],
  NL: [
    'zalando-netherlands', 'foot-locker-netherlands', 'ticketmaster-netherlands', 'primark-netherlands',
    'media-markt-netherlands', 'nike-netherlands', 'nintendo-netherlands', 'decathlon-netherlands',
    'coolblue-nl', 'wehkamp-cadeaukaart-nl', 'apple-netherlands', 'uber-eats-netherlands',
  ],
  ES: [
    'foot-locker-spain', 'ticketmaster-spain', 'primark-es', 'zalando-spain', 'nike-spain',
    'media-markt-spain', 'nintendo-spain', 'ikea-spain', 'decathlon-spain', 'apple-spain',
  ],
  IT: [
    'foot-locker-italy', 'primark-it', 'zalando-italy', 'carrefour-italy', 'nintendo-italy',
    'nike-it', 'decathlon-italy', 'apple-italy', 'media-world-italy', 'sephora-italy',
  ],
  GB: [
    'primark-uk', 'waterstones-uk', 'new-look-uk', 'foot-locker-uk', 'nike-uk',
    'decathlon-uk', 'uber-eats-united-kingdom', 'apple-united-kingdom', 'disney-plus-uk',
    'b-and-q-uk',
  ],
  US: [
    'foot-locker-usa', 'amc-theatres-usa', 'barnes-and-noble-usa', 'papa-john_s-usa',
    'williams-sonoma-usa', 'guitar-center-usa', 'chipotle-usa', 'panera-bread-usa',
    'nike-usa', 'sephora-usa',
  ],
};

const verified = {};

for (const [country, ids] of Object.entries(candidates)) {
  verified[country] = [];
  for (const id of ids) {
    const res = await fetch(`https://api-bitrefill.com/v2/products/${encodeURIComponent(id)}`, { headers });
    if (res.ok) {
      const body = await res.json();
      const p = body.data;
      if (p?.in_stock !== false) verified[country].push(id);
      else console.log('OUT OF STOCK', id);
    } else {
      console.log('NOT FOUND', id, res.status);
    }
    await new Promise((r) => setTimeout(r, 80));
  }
  console.log(country, verified[country].length, 'verified');
}

console.log('\n', JSON.stringify(verified, null, 2));
