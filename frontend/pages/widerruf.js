import { renderLegalPage } from '../components/LegalLayout.js';

import { LEGAL, LEGAL_LAST_UPDATED } from '../src/legalConfig.js';



export async function renderWiderruf(container) {

  const L = LEGAL;

  container.innerHTML = renderLegalPage({

    title: 'Widerrufsbelehrung',

    subtitle: `Stand: ${LEGAL_LAST_UPDATED}`,

    notice: `<strong>Wichtig:</strong> Kryptogutscheine ist <strong>Vermittler</strong>, nicht Verkäufer. Zahlungen gehen <strong>direkt an Bitrefill</strong>. Kryptogutscheine erhält und verwahrt keine Kundenzahlungen. Erstattungen sind – soweit überhaupt möglich – ausschließlich über Bitrefill als Leistungserbringer abzuwickeln.`,

    sections: [

      {

        title: 'Widerrufsrecht',

        body: `

          <p>Verbrauchern steht grundsätzlich ein Widerrufsrecht zu, soweit gesetzlich nichts anderes bestimmt ist.</p>

          <p class="mt-3">Die Widerrufsfrist beträgt <strong>vierzehn Tage</strong> ab dem Tag des Vertragsschlusses, sofern ein Widerrufsrecht besteht.</p>

          <p class="mt-3">Um ein Widerrufsrecht geltend zu machen, können Sie uns kontaktieren:</p>

          <p class="mt-2"><strong>${L.providerName}</strong><br>${L.addressLine1}<br>${L.addressLine2}<br>${L.country}<br>E-Mail: ${L.email}</p>

          <p class="mt-3">Wir leiten berechtigte Anfragen nach Möglichkeit an Bitrefill weiter. Eine Erfolgsgarantie oder Erstattung aus eigener Tasche durch Kryptogutscheine wird nicht übernommen.</p>`,

      },

      {

        title: 'Folgen des Widerrufs – keine Erstattung durch Kryptogutscheine',

        body: `

          <p><strong>Kryptogutscheine ist nicht Zahlungsempfänger.</strong> Die Krypto-Zahlung erfolgt direkt an Bitrefill. Kryptogutscheine verwahrt keine Gelder und kann daher grundsätzlich <strong>keine Rückerstattung aus eigener Tasche</strong> vornehmen.</p>

          <p class="mt-3">Soweit ein Widerruf rechtlich wirksam ist und eine Erstattung geschuldet wird, erfolgt diese ausschließlich über Bitrefill bzw. den jeweiligen Leistungserbringer – nicht über Kryptogutscheine.</p>

          <p class="mt-3">Kontaktieren Sie uns bei Problemen unter ${L.supportEmail}. Wir unterstützen bei der Weiterleitung an Bitrefill, übernehmen aber keine Haftung für deren Entscheidungen oder Bearbeitungszeiten.</p>`,

      },

      {

        title: 'Erlöschen des Widerrufsrechts bei digitalen Inhalten',

        body: `

          <p>Das Widerrufsrecht erlischt bei digitalen Gutscheincodes vorzeitig, wenn</p>

          <ul class="mt-2 list-inside list-disc space-y-1">

            <li>mit der Ausführung (Bereitstellung des Codes) begonnen wurde,</li>

            <li>Sie vorab ausdrücklich zugestimmt haben, dass vor Ablauf der Widerrufsfrist begonnen wird, und</li>

            <li>Sie bestätigt haben, dass Sie Ihr Widerrufsrecht damit verlieren.</li>

          </ul>

          <p class="mt-3">Diese Zustimmung erteilen Sie im Checkout durch Aktivieren der entsprechenden Checkbox vor Zahlungsstart.</p>`,

      },

      {

        title: 'Ausschluss bei bereitgestellten Gutscheincodes',

        body: `

          <p>Nach Anzeige oder Bereitstellung eines digitalen Gutscheincodes ist eine Rückgabe in der Regel ausgeschlossen, da der Code sofort nutzbar, kopierbar und nicht zuverlässig „zurückgegeben" werden kann. Zwingende gesetzliche Rechte bleiben unberührt.</p>`,

      },

      {

        title: 'Muster-Widerrufsformular',

        body: `

          <p class="text-content">(Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden Sie es zurück.)</p>

          <div class="mt-4 rounded-xl border border-theme bg-surface p-4 text-xs leading-relaxed">

            <p>An ${L.providerName}, ${L.addressLine1}, ${L.addressLine2}, ${L.country}, E-Mail: ${L.email}</p>

            <p class="mt-3">Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)</p>

            <p class="mt-3">Bestellt am (*)/erhalten am (*)</p>

            <p class="mt-3">Rechnungs-ID / Bestellnummer (*)</p>

            <p class="mt-3">Name des/der Verbraucher(s)</p>

            <p class="mt-3">Anschrift des/der Verbraucher(s)</p>

            <p class="mt-3">E-Mail-Adresse</p>

            <p class="mt-3">Datum</p>

            <p class="mt-3">(*) Unzutreffendes streichen.</p>

          </div>`,

      },

      {

        title: 'Keine Erstattungsgarantie',

        body: `

          <p>Kryptogutscheine ist Vermittler und nicht Vertragspartner der Gutschein-Lieferung. Für Erstattungen, fehlgeschlagene Bestellungen oder technische Probleme nach Zahlungseingang ist primär Bitrefill zuständig. Kryptogutscheine übernimmt keine Haftung für abgelehnte Erstattungsanträge Dritter.</p>`,

      },

    ],

    footerNote:

      'Bitte Widerrufsbelehrung vor Live-Gang rechtlich prüfen lassen. Platzhalter in legalConfig.js ausfüllen.',

  });

}

