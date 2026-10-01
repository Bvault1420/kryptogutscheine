# RedeemX – Gutschein-Vermittlungsplattform

RedeemX vermittelt digitale Gutscheine über die **Bitrefill API**. Zahlung per Lightning, Bitcoin, Ethereum, Solana oder Stablecoins.

> **Keine Finanzdienstleistung für Endkunden.** Keine Endkunden-Wallet. Zahlungen laufen über Bitrefill.

## Schnellstart

```bash
cp .env.example .env
# BITREFILL_API_KEY, CSRF_SECRET (≥32 Zeichen), ADMIN_API_KEY (≥32 Zeichen) setzen

npm run install:all
npm run dev
```

- Frontend: http://127.0.0.1:5320  
- Backend: http://127.0.0.1:3002  

## Sicherheit (wichtig)

| Variable | Pflicht | Zweck |
|----------|---------|--------|
| `CSRF_SECRET` | Production | CSRF-Tokens signieren (≥32 Zeichen) |
| `BITREFILL_WEBHOOK_SECRET` | Production | Webhook-Signatur prüfen |
| `ADMIN_API_KEY` | Für Admin-APIs | `GET /api/orders` und `GET /api/analytics` |

Admin-Aufruf:

```bash
curl -H "Authorization: Bearer $ADMIN_API_KEY" http://127.0.0.1:3002/api/analytics
```

Geschützt u. a.:

- CSRF auf Invoice- und Newsletter-POSTs
- Rate-Limits (inkl. Tracking & Webhooks)
- Webhook-Auth in Production Pflicht
- Order-Codes nur für lokal bekannte Bestellungen
- Öffentliche Health-Antwort ohne interne Metriken

## API (Auszug)

| Methode | Endpunkt | Auth |
|---------|----------|------|
| GET | `/api/products/curated` | öffentlich |
| POST | `/api/invoices` | CSRF |
| GET | `/api/invoices/:id` | UUID (Kenntnis der ID) |
| GET | `/api/orders/:id` | nur bekannte Order-IDs |
| GET | `/api/orders` | Admin Bearer |
| GET | `/api/analytics` | Admin Bearer |
| POST | `/api/webhook/bitrefill` | Webhook-Secret |
| GET | `/api/health` | öffentlich (`?deep=1` für Bitrefill-Check) |

## Projektstruktur

```
RedeemX/
├── shared/                 # Gemeinsame Regeln (Blocklist, Limits, Payment-IDs)
├── backend/
│   ├── controllers/
│   ├── middleware/         # CSRF, Admin-Auth, Rate-Limits, Helmet
│   ├── routes/
│   ├── services/           # Bitrefill
│   ├── storage/            # JSON-Dateien (lokal)
│   └── tests/
├── frontend/
│   ├── pages/
│   ├── components/
│   └── src/
├── scripts/dev.mjs
└── .github/workflows/ci.yml
```

## Scripts

| Befehl | Beschreibung |
|--------|--------------|
| `npm run dev` | Backend + Frontend (Dev) |
| `npm test` | Backend-Tests |
| `npm run build` | Frontend-Build |
| `npm run start:prod` | Build + Production-Server |

## CI

GitHub Actions (`.github/workflows/ci.yml`): Install → Tests → Frontend-Build → Dependency-Audit.
