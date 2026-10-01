import { renderLegalPage } from '../components/LegalLayout.js';
import { LEGAL, LEGAL_LAST_UPDATED } from '../src/legalConfig.js';

export async function renderAgb(container) {
  const L = LEGAL;
  container.innerHTML = renderLegalPage({
    title: 'Allgemeine Geschäftsbedingungen (AGB)',
    subtitle: `Stand: ${LEGAL_LAST_UPDATED}`,
    notice: `<strong>Wichtig:</strong> Kryptogutscheine ist eine reine <strong>Gutschein-Vermittlungsplattform</strong>. Wir erbringen <strong>keine Finanzdienstleistung</strong>, betreiben keine Wallet, verwahren keine Gelder und sind nicht Zahlungsdienstleister. Vertrag über Gutschein und Zahlung kommt mit dem externen Anbieter (Bitrefill) zustande.`,
    sections: [
      {
        title: '§ 1 Geltungsbereich und Vertragspartner',
        body: `
          <p>(1) Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung der Website und Plattform Kryptogutscheine unter der Domain <strong>kryptogutscheine.com</strong>.</p>
          <p class="mt-3">(2) Anbieter und Betreiber ist:</p>
          <p class="mt-2"><strong>${L.providerName}</strong><br>${L.addressLine1}<br>${L.addressLine2}<br>${L.country}<br>E-Mail: ${L.email}</p>
          <p class="mt-3">(3) Kryptogutscheine richtet sich an Verbraucher und Unternehmer, sofern nicht ausdrücklich anders gekennzeichnet.</p>`,
      },
      {
        title: '§ 2 Art der Leistung – reine Vermittlung',
        body: `
          <p>(1) Kryptogutscheine stellt eine technische Oberfläche zur Verfügung, über die Nutzer digitale Gutscheine auswählen und Bestellungen anstoßen können.</p>
          <p class="mt-3">(2) Kryptogutscheine <strong>verkauft keine Gutscheine im eigenen Namen</strong>, sondern vermittelt den Zugang zu Produkten und Zahlungsabwicklung des externen Partners <strong>Bitrefill</strong> (Bitrefill Pte. Ltd. bzw. jeweiliger Rechtsträger).</p>
          <p class="mt-3">(3) Kryptogutscheine erbringt <strong>keine Finanzdienstleistung</strong> im Sinne des Kreditwesengesetzes (KWG), keine Zahlungsdienste im Sinne des Zahlungsdiensteaufsichtsgesetzes (ZAG), keine Kryptoverwahrung und keine Anlageberatung.</p>
          <p class="mt-3">(4) Kryptowährungs-Zahlungen werden <strong>direkt an Bitrefill</strong> bzw. dessen Zahlungsinfrastruktur geleistet. Kryptogutscheine erhält, speichert oder kontrolliert keine privaten Schlüssel, Seeds oder Wallet-Guthaben der Nutzer.</p>
          <p class="mt-3">(5) Kryptogutscheine ist nicht Herausgeber, Verkäufer oder Garantiegeber der angezeigten Gutscheine. Herausgeber und Einlösestellen sind die jeweiligen Marken bzw. Händler.</p>`,
      },
      {
        title: '§ 3 Vertragsschluss und Bestellablauf',
        body: `
          <p>(1) Die Darstellung von Produkten auf Kryptogutscheine stellt kein rechtlich bindendes Angebot dar, sondern eine unverbindliche Aufforderung zur Bestellung.</p>
          <p class="mt-3">(2) Mit Klick auf „Zahlung starten“ und Bestätigung im Checkout gibt der Nutzer eine verbindliche Bestellung ab. Die Annahme und Erfüllung erfolgt durch Bitrefill als Leistungserbringer.</p>
          <p class="mt-3">(3) Der Nutzer bestätigt vor Abschluss, die <a href="#/agb" data-nav="/agb" class="text-brand-600 hover:underline">AGB</a>, die <a href="#/datenschutz" data-nav="/datenschutz" class="text-brand-600 hover:underline">Datenschutzerklärung</a> und die <a href="#/widerruf" data-nav="/widerruf" class="text-brand-600 hover:underline">Widerrufsbelehrung</a> gelesen zu haben und akzeptiert diese.</p>
          <p class="mt-3">(4) Kryptogutscheine kann Bestellungen technisch ablehnen, wenn API-Dienste nicht verfügbar sind, Sicherheitsprüfungen fehlschlagen oder Missbrauch vorliegt.</p>`,
      },
      {
        title: '§ 4 Produktangebot – kuratierter Katalog',
        body: `
          <p>(1) Kryptogutscheine bietet ausschließlich einen <strong>manuell kuratierten Katalog</strong> digitaler Marken-Gutscheine an (z.&nbsp;B. Shopping, Gaming, Streaming, Gastronomie). Es werden bewusst <strong>keine</strong> eSIMs, Handy-Aufladungen, Prepaid-Zahlungskarten, Glücksspiel-, Dating-, Adult-, Geldtransfer- oder vergleichbar heikle Produkte angeboten.</p>
          <p class="mt-3">(2) Der Katalog wird regelmäßig geprüft. Produkte können jederzeit ohne Vorankündigung entfernt oder ergänzt werden, wenn rechtliche, technische oder sicherheitsrelevante Gründe dies erfordern.</p>
          <p class="mt-3">(3) Die Darstellung eines Produkts begründet keine Garantie für dauerhafte Verfügbarkeit, Einlösbarkeit in allen Regionen oder bestimmte Krypto-Zahlungsmethoden.</p>
          <p class="mt-3">(4) Der Nutzer ist verpflichtet, vor Bestellung Produktwert, Land, Währung, Einlösebedingungen, Ablaufdatum, regionale Beschränkungen und sonstige Bedingungen des Gutschein-Herausgebers selbst zu prüfen.</p>
          <p class="mt-3">(5) Produktbilder, Logos und Markennamen dienen ausschließlich der Identifikation. Alle Markenrechte liegen bei den jeweiligen Rechteinhabern.</p>`,
      },
      {
        title: '§ 5 Preise, Verfügbarkeit und Produktinformationen',
        body: `
          <p>(1) Alle Preise, Verfügbarkeiten und Produktbeschreibungen stammen vom externen Anbieter Bitrefill und können sich jederzeit ändern.</p>
          <p class="mt-3">(2) Kryptogutscheine übernimmt keine Gewähr dafür, dass ein angezeigtes Produkt zum Zeitpunkt der Bestellung verfügbar, in einem bestimmten Land einlösbar oder zu einem bestimmten Kurs erhältlich ist.</p>
          <p class="mt-3">(3) Krypto-Beträge vor Rechnungserstellung sind Schätzungen. Der verbindliche Zahlungsbetrag ergibt sich aus der von Bitrefill erstellten Rechnung.</p>`,
      },
      {
        title: '§ 6 Kryptowährungen – besondere Risiken',
        body: `
          <p>(1) Zahlungen mit Kryptowährungen sind in der Regel <strong>unwiderruflich</strong>. Fehlüberweisungen (falsches Netzwerk, falscher Token, falscher Betrag, falsche Adresse) können zum <strong>vollständigen Verlust</strong> des eingesetzten Betrags führen.</p>
          <p class="mt-3">(2) Der Nutzer ist allein dafür verantwortlich, die richtige Kryptowährung, das richtige Netzwerk (z.&nbsp;B. Polygon, Ethereum, Tron) und den exakten Betrag zu verwenden.</p>
          <p class="mt-3">(3) Kryptogutscheine haftet nicht für Kursschwankungen, Netzwerkgebühren, Verzögerungen der Blockchain, Wallet-Fehler oder Nutzerfehler bei der Zahlung.</p>
          <p class="mt-3">(4) Nach Ablauf der Zahlungsfrist muss eine neue Rechnung erstellt werden. Bereits gesendete Zahlungen an abgelaufene Rechnungen können nicht garantiert zugeordnet werden.</p>
          <p class="mt-3">(5) Kryptogutscheine schuldet keine Rückabwicklung von Blockchain-Transaktionen und kann verlorene, falsch gesendete oder an Dritte gezahlte Kryptowährungen nicht wiederbeschaffen.</p>`,
      },
      {
        title: '§ 7 Lieferung digitaler Gutscheine',
        body: `
          <p>(1) Digitale Gutscheincodes werden nach Zahlungsbestätigung durch Bitrefill bereitgestellt und auf der Bestellstatus-Seite angezeigt.</p>
          <p class="mt-3">(2) Der Nutzer ist verpflichtet, Gutscheincodes sicher zu speichern. Kryptogutscheine speichert keine dauerhaften Nutzerkonten; verlorene Codes können nach Browser-Löschung ggf. nicht wiederhergestellt werden.</p>
          <p class="mt-3">(3) Einlösungsbedingungen, Gültigkeitsdauer und regionale Beschränkungen richten sich nach dem jeweiligen Gutschein-Anbieter (z.&nbsp;B. Amazon, Steam).</p>
          <p class="mt-3">(4) Gutscheincodes gelten nach Bereitstellung grundsätzlich als geliefert. Eine Rücknahme ist in der Regel ausgeschlossen, sofern nicht zwingendes Recht etwas anderes bestimmt.</p>`,
      },
      {
        title: '§ 8 Fehlgeschlagene Bestellungen – Haftungsausschluss',
        body: `
          <p>(1) Kryptogutscheine haftet <strong>nicht</strong> für Störungen, Ausfälle oder Fehler des externen Anbieters Bitrefill, von Blockchain-Netzwerken, Wallet-Software oder Drittanbieter-Infrastruktur.</p>
          <p class="mt-3">(2) Insbesondere übernimmt Kryptogutscheine keine Verantwortung bei:</p>
          <ul class="mt-2 list-inside list-disc space-y-1">
            <li>fehlgeschlagener oder verspäteter Gutschein-Lieferung durch Bitrefill,</li>
            <li>abgelehnten oder nicht verfügbaren Produkten,</li>
            <li>fehlerhaften Gutscheincodes,</li>
            <li>nicht akzeptierten Krypto-Zahlungen,</li>
            <li>technischen API-Fehlern oder Wartungsarbeiten,</li>
            <li>Missbrauch oder Sperrung durch den Gutschein-Herausgeber.</li>
          </ul>
          <p class="mt-3">(3) Ansprüche aus dem Kaufvertrag über den Gutschein sind gegenüber dem Leistungserbringer Bitrefill geltend zu machen. Kryptogutscheine unterstützt nach Möglichkeit bei der Kommunikation, ist aber nicht verpflichtet und nicht haftbar für deren Entscheidungen.</p>
          <p class="mt-3">(4) Kryptogutscheine kann freiwillig Support leisten, ohne dadurch Vertragspartner der Gutschein-Lieferung oder Erstattungsschuldner zu werden.</p>
          <p class="mt-3">(5) Support-Anfragen können an ${L.supportEmail} gerichtet werden. Eine Erfolgsgarantie wird nicht gegeben.</p>`,
      },
      {
        title: '§ 9 Gewährleistung und Haftungsbeschränkung',
        body: `
          <p>(1) Kryptogutscheine haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit.</p>
          <p class="mt-3">(2) Bei leichter Fahrlässigkeit haftet Kryptogutscheine nur bei Verletzung wesentlicher Vertragspflichten (Kardinalpflichten), beschränkt auf den vorhersehbaren, vertragstypischen Schaden.</p>
          <p class="mt-3">(3) Im Übrigen ist die Haftung von Kryptogutscheine – soweit gesetzlich zulässig – <strong>ausgeschlossen</strong>. Dies gilt insbesondere für mittelbare Schäden, entgangenen Gewinn, Datenverlust und Folgeschäden aus Krypto-Transaktionen.</p>
          <p class="mt-3">(4) Die Haftung für Inhalte, Dienste, Produkte, Verfügbarkeiten und Entscheidungen Dritter ist ausgeschlossen, soweit Kryptogutscheine diese nicht selbst zu vertreten hat.</p>
          <p class="mt-3">(5) Zwingende gesetzliche Haftungsansprüche (z.&nbsp;B. nach dem Produkthaftungsgesetz) bleiben unberührt.</p>`,
      },
      {
        title: '§ 10 Nutzungsrechte und Pflichten des Nutzers',
        body: `
          <p>(1) Der Nutzer darf Kryptogutscheine nur rechtmäßig und im Rahmen dieser AGB nutzen.</p>
          <p class="mt-3">(2) Missbrauch (z.&nbsp;B. automatisierte Angriffe, Umgehung von Sicherheitsmechanismen, betrügerische Bestellungen) kann zur Sperrung des Zugangs führen.</p>
          <p class="mt-3">(3) Der Nutzer versichert, berechtigt zu sein, die gewählte Zahlungsmethode zu nutzen und geltendes Recht einzuhalten.</p>
          <p class="mt-3">(4) Die Nutzung von Kryptogutscheine für rechtswidrige Zwecke, Geldwäsche, Sanktionsumgehung, Betrug, Terrorismusfinanzierung oder sonstige missbräuchliche Zwecke ist untersagt.</p>
          <p class="mt-3">(5) Kryptogutscheine kann Bestellungen ablehnen, abbrechen oder den Zugang beschränken, wenn der Verdacht auf Missbrauch, Rechtsverstöße, technische Angriffe oder ungewöhnliche Nutzung besteht.</p>
          <p class="mt-3">(6) Der Nutzer ist selbst dafür verantwortlich, ob Erwerb, Besitz, Einlösung oder Weitergabe eines Gutscheins in seinem Land zulässig ist.</p>`,
      },
      {
        title: '§ 11 Altersbeschränkung',
        body: `
          <p>(1) Kryptogutscheine richtet sich ausschließlich an Personen ab 18 Jahren.</p>
          <p class="mt-3">(2) Minderjährige dürfen Kryptogutscheine nicht nutzen. Mit Nutzung der Plattform bestätigt der Nutzer, volljährig und unbeschränkt geschäftsfähig zu sein.</p>`,
      },
      {
        title: '§ 12 Streitbeilegung und anwendbares Recht',
        body: `
          <p>(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts, soweit dem keine zwingenden Verbraucherschutzvorschriften des Wohnsitzstaates des Verbrauchers entgegenstehen.</p>
          <p class="mt-3">(2) Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit: <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" class="text-brand-600 hover:underline">https://ec.europa.eu/consumers/odr/</a>. Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>`,
      },
      {
        title: '§ 13 Salvatorische Klausel und Änderungen',
        body: `
          <p>(1) Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.</p>
          <p class="mt-3">(2) Kryptogutscheine kann diese AGB mit Wirkung für die Zukunft anpassen. Die jeweils aktuelle Version ist auf der Website abrufbar.</p>`,
      },
    ],
    footerNote:
      'Diese AGB sind eine Vorlage und ersetzen keine individuelle Rechtsberatung. Bitte vor Veröffentlichung prüfen lassen und alle Platzhalter in legalConfig.js mit den echten Betreiberangaben ausfüllen.',
  });
}
