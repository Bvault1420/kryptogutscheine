import { renderLegalPage } from '../components/LegalLayout.js';
import { LEGAL, LEGAL_LAST_UPDATED } from '../src/legalConfig.js';

export async function renderDatenschutz(container) {
  const L = LEGAL;
  container.innerHTML = renderLegalPage({
    title: 'Datenschutzerklärung',
    subtitle: `Stand: ${LEGAL_LAST_UPDATED}`,
    notice: `<strong>Transparenz:</strong> Kryptogutscheine erhebt nur die Daten, die für den Betrieb der Plattform technisch erforderlich sind. Es werden keine Nutzerkonten geführt und keine Zahlungsdaten gespeichert.`,
    sections: [
      {
        title: '1. Verantwortlicher',
        body: `<p><strong>${L.providerName}</strong><br>${L.addressLine1}<br>${L.addressLine2}<br>${L.country}<br>E-Mail: ${L.email}</p>`,
      },
      {
        title: '2. Grundsätze der Datenverarbeitung',
        body: `
          <p>Kryptogutscheine wurde nach dem Prinzip „Privacy by Design" entwickelt. Wir verarbeiten personenbezogene Daten nur, soweit dies zur Bereitstellung der Website, zur Abwicklung von Bestellungen über externe Partner oder aufgrund gesetzlicher Pflichten erforderlich ist.</p>
          <p class="mt-3">Kryptogutscheine erbringt <strong>keine Finanzdienstleistung</strong>, führt <strong>kein Nutzertracking</strong> zu Werbezwecken durch und speichert keine Wallet-Daten, Seeds oder private Schlüssel.</p>
          <p class="mt-3">Es werden <strong>keine Nutzerkonten</strong> geführt. Bestellungen können ohne Registrierung abgewickelt werden.</p>`,
      },
      {
        title: '3. Welche Daten wir verarbeiten',
        body: `
          <table class="mt-2 w-full text-left text-xs">
            <thead><tr class="border-b border-theme"><th class="py-2 pr-2">Datenart</th><th class="py-2 pr-2">Zweck</th><th class="py-2">Speicherort</th></tr></thead>
            <tbody class="divide-y divide-theme">
              <tr><td class="py-2 pr-2">Server-Logdaten (IP, Zeit, URL, User-Agent)</td><td class="py-2 pr-2">Sicherheit, Fehleranalyse</td><td class="py-2">Server (${L.logRetentionDays} Tage)</td></tr>
              <tr><td class="py-2 pr-2">CSRF-Token (Cookie)</td><td class="py-2 pr-2">Schutz vor Angriffen</td><td class="py-2">Session-Cookie</td></tr>
              <tr><td class="py-2 pr-2">Bestell-Snapshots (Invoice-ID, Produktname, Status)</td><td class="py-2 pr-2">Statusverfolgung, Support</td><td class="py-2">Server (JSON-Datei)</td></tr>
              <tr><td class="py-2 pr-2">Newsletter-E-Mail (optional, nur mit Einwilligung)</td><td class="py-2 pr-2">Deal-Benachrichtigungen</td><td class="py-2">Server (JSON-Datei)</td></tr>
              <tr><td class="py-2 pr-2">Anonyme Produkt-Statistiken</td><td class="py-2 pr-2">Beliebtheits-Ranking</td><td class="py-2">Server (ohne Personenbezug)</td></tr>
              <tr><td class="py-2 pr-2">Warenkorb, Favoriten, Theme</td><td class="py-2 pr-2">Nutzerkomfort</td><td class="py-2">Nur Ihr Browser (localStorage)</td></tr>
            </tbody>
          </table>`,
      },
      {
        title: '4. Rechtsgrundlagen (Art. 6 DSGVO)',
        body: `
          <ul class="list-inside list-disc space-y-1">
            <li><strong>Art. 6 Abs. 1 lit. b DSGVO</strong> – Vertragserfüllung und vorvertragliche Maßnahmen (Bestellabwicklung)</li>
            <li><strong>Art. 6 Abs. 1 lit. f DSGVO</strong> – Berechtigtes Interesse (IT-Sicherheit, Missbrauchsprävention, Server-Logs)</li>
            <li><strong>Art. 6 Abs. 1 lit. a DSGVO</strong> – Einwilligung (Newsletter, optionale Cookies)</li>
          </ul>`,
      },
      {
        title: '5. Externe Dienste und Auftragsverarbeitung',
        body: `
          <p><strong>Bitrefill</strong> – Für Beschaffung, Zahlung und Lieferung von Gutscheinen. Bei Bestellung werden Produkt- und Zahlungsdaten an Bitrefill übermittelt. Datenschutz: <a href="https://www.bitrefill.com/privacy" target="_blank" rel="noopener noreferrer" class="text-brand-600 hover:underline">bitrefill.com/privacy</a></p>
          <p class="mt-3"><strong>Hosting</strong> – Der Server, auf dem Kryptogutscheine betrieben wird, kann Logdaten verarbeiten. Bitte Hosting-Anbieter und AV-Vertrag separat dokumentieren.</p>
          <p class="mt-3"><strong>Schriften</strong> – Kryptogutscheine lädt keine Google Fonts oder sonstigen externen Webfonts von Drittanbietern. Schriften werden über Systemschriften bzw. lokal verfügbare Schriftarten dargestellt.</p>`,
      },
      {
        title: '6. Cookies und lokale Speicherung',
        body: `
          <p>Wir setzen ausschließlich <strong>technisch notwendige Cookies</strong> ein (CSRF-Schutz). Es werden keine Marketing- oder Tracking-Cookies von Drittanbietern verwendet.</p>
          <p class="mt-3">Zusätzlich speichert Ihr Browser lokal (localStorage/sessionStorage): Warenkorb, Favoriten, Theme, letzte Suchen, Bestellhistorie. Diese Daten verlassen Ihr Gerät nicht, außer Sie lösen eine Bestellung aus (dann werden technische Bestelldaten serverseitig gespeichert).</p>`,
      },
      {
        title: '6a. Newsletter und Widerruf der Einwilligung',
        body: `
          <p>Wenn Sie sich für Deal-Alerts anmelden, speichern wir Ihre E-Mail-Adresse ausschließlich für den Versand von Informationen zu Angeboten und Rabatten. Rechtsgrundlage ist Ihre Einwilligung gemäß Art. 6 Abs. 1 lit. a DSGVO.</p>
          <p class="mt-3">Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen, z.&nbsp;B. per E-Mail an ${L.email}. Nach Widerruf wird die E-Mail-Adresse aus dem Newsletter-Verteiler entfernt, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.</p>`,
      },
      {
        title: '7. Speicherdauer und Löschung',
        body: `
          <ul class="list-inside list-disc space-y-1">
            <li>Server-Logs: ${L.logRetentionDays} Tage, danach Löschung</li>
            <li>Bestell-Snapshots: bis zu 500 Einträge, für Support und Statusabfrage</li>
            <li>Newsletter: bis zur Abmeldung</li>
            <li>Browser-Daten: bis Sie diese im Browser löschen</li>
          </ul>`,
      },
      {
        title: '7a. Keine Weitergabe zu Werbezwecken',
        body: `
          <p>Wir verkaufen keine personenbezogenen Daten und geben keine personenbezogenen Daten zu Werbezwecken an Dritte weiter. Eine Weitergabe erfolgt nur, wenn sie zur Bestellabwicklung, zur technischen Bereitstellung, zur Erfüllung gesetzlicher Pflichten oder zur Wahrung berechtigter Interessen erforderlich ist.</p>`,
      },
      {
        title: '7b. Keine Profilbildung / kein Verkauf von Daten',
        body: `
          <p>Wir erstellen keine Nutzerprofile, führen kein verhaltensbasiertes Tracking durch und verkaufen keine personenbezogenen Daten. Server-Logs dienen ausschließlich dem Betrieb, der Sicherheit und der Missbrauchserkennung.</p>`,
      },
      {
        title: '8. Ihre Rechte',
        body: `
          <p>Sie haben folgende Rechte gegenüber dem Verantwortlichen:</p>
          <ul class="mt-2 list-inside list-disc space-y-1">
            <li>Auskunft (Art. 15 DSGVO)</li>
            <li>Berichtigung (Art. 16 DSGVO)</li>
            <li>Löschung (Art. 17 DSGVO)</li>
            <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
            <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
            <li>Widerspruch (Art. 21 DSGVO)</li>
            <li>Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)</li>
          </ul>
          <p class="mt-3">Anfragen richten Sie an: ${L.email}. Sie haben zudem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.</p>`,
      },
      {
        title: '9. Sicherheitsmaßnahmen',
        body: `
          <ul class="list-inside list-disc space-y-1">
            <li>HTTPS-Verschlüsselung (in Produktion)</li>
            <li>CSRF-Schutz für schreibende API-Anfragen</li>
            <li>XSS-Schutz via Output-Escaping und Content Security Policy</li>
            <li>Rate-Limiting gegen Missbrauch</li>
            <li>API-Schlüssel ausschließlich serverseitig in Umgebungsvariablen</li>
            <li>Keine Speicherung von Zahlungsdaten oder Wallet-Informationen</li>
          </ul>`,
      },
      {
        title: '10. Minderjährige',
        body: `<p>Kryptogutscheine richtet sich nicht an Personen unter 18 Jahren. Wir erheben wissentlich keine Daten von Minderjährigen.</p>`,
      },
      {
        title: '11. Änderungen dieser Datenschutzerklärung',
        body: `<p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen, wenn sich Rechtslage oder technische Umsetzung ändert. Die aktuelle Version ist stets auf dieser Seite abrufbar.</p>`,
      },
    ],
    footerNote:
      'Bitte passen Sie legalConfig.js an die tatsächlichen Betreiberangaben an und prüfen Sie die Datenschutzerklärung vor Live-Gang (insb. Hosting, Bitrefill, Newsletter).',
  });
}
