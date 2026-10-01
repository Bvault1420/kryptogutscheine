/**
 * Zentrale Platzhalter für rechtliche Angaben.
 * Vor dem Live-Gang alle [eckigen Klammern] durch echte Daten ersetzen
 * und die Texte ggf. anwaltlich prüfen lassen.
 */
export const LEGAL = {
  providerName: '[Vor- und Nachname des Betreibers]',
  addressLine1: '[Straße und Hausnummer]',
  addressLine2: '[PLZ Ort]',
  country: '[Land]',
  email: '[E-Mail-Adresse]',
  phone: '[Telefonnummer]',
  representative: '[Vor- und Nachname des Betreibers]',
  registerCourt: '[falls vorhanden: Amtsgericht / sonst: nicht eingetragen]',
  registerNumber: '[falls vorhanden: HRB/HRA-Nummer / sonst: nicht eingetragen]',
  vatId: '[falls vorhanden: USt-IdNr. / sonst: nicht vorhanden]',
  logRetentionDays: '14',
  supportEmail: '[support@deine-domain.de]',
};

export const LEGAL_LAST_UPDATED = '05.07.2026';

/** True wenn alle Platzhalter in legalConfig.js ersetzt wurden. */
export function isLegalConfigComplete() {
  return !Object.values(LEGAL).some((v) => String(v).includes('['));
}
