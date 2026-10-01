import { renderLegalPage } from '../components/LegalLayout.js';
import { LEGAL, LEGAL_LAST_UPDATED } from '../src/legalConfig.js';

export async function renderImpressum(container) {
  const L = LEGAL;
  container.innerHTML = renderLegalPage({
    title: 'Impressum',
    subtitle: `Angaben gemäß § 5 TMG · Stand: ${LEGAL_LAST_UPDATED}`,
    sections: [
      {
        title: 'Anbieter',
        body: `<p><strong>${L.providerName}</strong><br>${L.addressLine1}<br>${L.addressLine2}<br>${L.country}</p>`,
      },
      {
        title: 'Kontakt',
        body: `<p>Telefon: ${L.phone}<br>E-Mail: ${L.email}<br>Support: ${L.supportEmail}</p>`,
      },
      {
        title: 'Betreiber / verantwortliche Person',
        body: `<p>${L.representative}</p>`,
      },
      {
        title: 'Register- und Steuerangaben',
        body: `<p>Registergericht: ${L.registerCourt}<br>Registernummer: ${L.registerNumber}<br>Umsatzsteuer-ID: ${L.vatId}</p><p class="mt-3">Falls kein Registereintrag oder keine Umsatzsteuer-ID besteht, ist dies entsprechend als „nicht vorhanden“ anzugeben.</p>`,
      },
      {
        title: 'Verantwortlich für den Inhalt (§ 55 Abs. 2 RStV)',
        body: `<p>${L.representative}<br>${L.addressLine1}, ${L.addressLine2}</p>`,
      },
      {
        title: 'Art der Dienstleistung',
        body: `
          <div class="legal-notice">
            Kryptogutscheine ist eine <strong>Gutschein-Vermittlungsplattform</strong>. Wir erbringen
            <strong>keine Finanzdienstleistung</strong> im Sinne des KWG, betreiben keine Wallet,
            verwahren keine Gelder und führen keine Zahlungsabwicklung durch. Zahlungen erfolgen
            ausschließlich über externe Zahlungsanbieter (Bitrefill).
          </div>`,
      },
      {
        title: 'Haftung für Inhalte und Links',
        body: `
          <p>Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.</p>
          <p class="mt-3">Trotz sorgfältiger Kontrolle übernehmen wir keine Haftung für Inhalte externer Links. Für den Inhalt verlinkter Seiten sind ausschließlich deren Betreiber verantwortlich.</p>
          <p class="mt-3">Produktverfügbarkeit, Preise und Lieferung von Gutscheinen werden durch den externen Anbieter Bitrefill bestimmt. Kryptogutscheine übernimmt keine Gewähr für deren Richtigkeit oder Verfügbarkeit.</p>`,
      },
      {
        title: 'Streitschlichtung',
        body: `
          <p>Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
          <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" class="text-brand-600 hover:underline">https://ec.europa.eu/consumers/odr/</a>.</p>
          <p class="mt-3">Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>`,
      },
    ],
    footerNote:
      'Bitte ersetzen Sie alle Platzhalter in frontend/src/legalConfig.js mit den tatsächlichen Angaben des Betreibers, bevor Sie die Plattform produktiv nutzen.',
  });
}
