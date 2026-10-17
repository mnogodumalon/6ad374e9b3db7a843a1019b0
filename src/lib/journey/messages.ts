/**
 * Required-field messages — WRITTEN BY THE BUILD AGENT, never by a heuristic.
 *
 * The layer knows two things about an empty required field: that it is
 * required and what its label is. Out of that it can only say „„Anreise" ist
 * ein Pflichtfeld". What the person should do instead („Bitte einen Gast
 * auswählen.") is meaning, and meaning is the agent's: the Phase-2 orchestrator
 * writes one short instruction per required field — what is needed, not why — to
 * `.intents-staging/messages.json`, the integration step validates it against
 * the app metadata and renders it into the block below. Scaffold updates keep
 * the block. Do not edit outside the markers.
 *
 * Every door reads this and nothing else: `useStepForm` (flows and public
 * pages), the generated {Entity}Dialog and the public form's server-error line.
 * A field without a sentence falls back to the label sentence — never to a
 * bare „Dieses Feld ist erforderlich".
 *
 * Required fields per entity (from the base view):
 *   - kunden: firmenname (Firmenname)
 *   - kundenanfragen: kunde (Kunde), eingangsdatum (Eingangsdatum), anfragebeschreibung (Anfragebeschreibung), urspruengliche_kundenanforderungen (Ursprüngliche Kundenanforderungen (unverändert)), status (Status)
 *   - technischer_abschluss: anfrage (Anfrage), pruefdatum (Prüfdatum), geprueft_von (Geprüft von)
 *   - statusprotokoll: anfrage (Anfrage), objekttyp (Objekttyp), objektbezeichnung (Objektbezeichnung), neuer_status (Neuer Status), zeitpunkt (Zeitpunkt), benutzer_vorname (Benutzer Vorname), benutzer_nachname (Benutzer Nachname)
 *   - informationsquellen: anfrage (Anfrage), quellentyp (Quellentyp), titel (Titel)
 *   - technische_anforderungen: anfrage (Anfrage), bezeichnung (Bezeichnung), beschreibung (Beschreibung), pruefstatus (Prüfstatus)
 *   - offene_punkte: anfrage (Anfrage), kurztitel (Kurztitel), beschreibung (Beschreibung und Grund), prioritaet (Priorität), status (Status)
 *   - aufgaben: anfrage (Anfrage), titel (Titel), verantwortlicher_vorname (Verantwortlicher Vorname), verantwortlicher_nachname (Verantwortlicher Nachname), status (Status)
 *   - beurteilungen: anfrage (Anfrage), beurteilungsgegenstand (Beurteilungsgegenstand), fachliche_begruendung (Fachliche Begründung)
 *   - rueckfragen_und_kommunikation: anfrage (Anfrage), kommunikationstyp (Kommunikationstyp), betreff (Betreff), inhalt (Inhalt (Entwürfe sind nicht versendet)), versandstatus (Versandstatus)
 *   - entscheidungen: anfrage (Anfrage), titel (Titel), entscheidungsgegenstand (Entscheidungsgegenstand), entscheidung (Entscheidung), begruendung (Begründung), verantwortlicher_vorname (Entscheidungsverantwortlicher Vorname), verantwortlicher_nachname (Entscheidungsverantwortlicher Nachname), entscheidungsstatus (Entscheidungsstatus)
 *   - erfahrungen: ursprungsanfrage (Ursprungsanfrage), titel (Titel), sachverhalt (Sachverhalt), bestaetigungsstatus (Bestätigungsstatus)
 *   - wiederverwendung_von_erfahrungen: erfahrung (Erfahrung), ziel_anfrage (Spätere Anfrage)
 */
import { t, tx } from '@/i18n';
import { labelOf, type EntityKey } from './rules';

/** The writable fields of each entity — the keys a message may address (generated). */
export interface MessageFields {
  "kunden": "kundennummer" | "firmenname" | "ansprechpartner_vorname" | "ansprechpartner_nachname" | "e_mail" | "telefon" | "strasse" | "hausnummer" | "plz" | "ort" | "branche" | "interne_bemerkung" | "aktiv";
  "kundenanfragen": "anfragenummer" | "kunde" | "eingangsdatum" | "eingangskanal" | "kundenreferenz" | "kontakt_vorname" | "kontakt_nachname" | "kontakt_email" | "produktfamilie" | "produktvariante" | "gewuenschte_menge" | "gewuenschter_liefertermin" | "anfragebeschreibung" | "urspruengliche_kundenanforderungen" | "prioritaet" | "verantwortlicher_vorname" | "verantwortlicher_nachname" | "status" | "klaeraufwand" | "zieltermin_klaerung" | "vollstaendigkeit" | "schaetzung_bearbeitung_min" | "gemessen_bearbeitung_min" | "wartezeit_kunde_min" | "wartezeit_intern_min" | "geklaert_am" | "anzahl_nachtraegliche_aenderungen" | "anzahl_nacharbeiten";
  "technischer_abschluss": "anfrage" | "pruefdatum" | "geprueft_von" | "anforderungen_geprueft" | "kritische_punkte_geklaert" | "entscheidungen_vorhanden" | "freigaben_vorhanden" | "verbleibende_abweichungen" | "verbleibende_risiken" | "offene_restpunkte" | "uebergabeempfaenger" | "uebergabestatus" | "uebergabedatum" | "zusammenfassung" | "freigabestatus";
  "statusprotokoll": "anfrage" | "objekttyp" | "objektbezeichnung" | "alter_status" | "neuer_status" | "zeitpunkt" | "benutzer_vorname" | "benutzer_nachname" | "begruendung";
  "informationsquellen": "eingangszeitpunkt" | "versionskennung" | "quellenstatus" | "zusammenfassung" | "extraktionsstatus" | "pruefung_durch" | "pruefung_am" | "erneute_pruefung" | "bemerkung" | "ersetzt_quelle" | "anfrage" | "quellentyp" | "titel" | "referenz_url" | "urheber" | "quellendatum";
  "technische_anforderungen": "anfrage" | "bezeichnung" | "beschreibung" | "anforderungstyp" | "ursprung" | "sollwert" | "einheit" | "vergleichsoperator" | "min_wert" | "max_wert" | "ist_pflichtanforderung" | "pruefstatus" | "begruendung_pruefstatus" | "verantwortlicher_vorname" | "verantwortlicher_nachname" | "gueltig_ab" | "gueltig_bis" | "erneute_pruefung" | "quellen";
  "offene_punkte": "betroffene_anforderungen" | "betroffene_quellen" | "anfrage" | "kurztitel" | "beschreibung" | "punktetyp" | "prioritaet" | "auswirkung" | "zustaendige_rolle" | "verantwortlicher_vorname" | "verantwortlicher_nachname" | "faellig_am" | "status" | "erledigungskriterium" | "loesung_oder_ergebnis" | "antwort_geprueft" | "abgeschlossen_am" | "abschluss_durch" | "erneute_pruefung";
  "aufgaben": "anfrage" | "titel" | "beschreibung" | "aufgabentyp" | "verantwortlicher_vorname" | "verantwortlicher_nachname" | "mitwirkende" | "prioritaet" | "status" | "faellig_am" | "blockierungsgrund" | "ergebnis" | "abgeschlossen_am" | "offener_punkt" | "abhaengige_aufgaben";
  "beurteilungen": "betroffene_anforderungen" | "betroffene_offene_punkte" | "zugrunde_liegende_quellen" | "anfrage" | "beurteilungsgegenstand" | "beurteilungsart" | "einschaetzung" | "fachliche_begruendung" | "annahmen" | "unsicherheiten" | "alternativen" | "empfehlung" | "ist_ki_vorschlag" | "erstellt_von" | "erstellt_am" | "pruefstatus" | "geprueft_von" | "geprueft_am" | "erneute_pruefung";
  "rueckfragen_und_kommunikation": "zugehoerige_offene_punkte" | "beantwortet_nachricht" | "quelle" | "anfrage" | "kommunikationstyp" | "kanal" | "absender" | "empfaenger" | "betreff" | "inhalt" | "versandstatus" | "versanddatum" | "antwort_erwartet_bis" | "antwort_erhalten_am" | "antwortstatus" | "folgeaufgabe_noetig" | "notizen";
  "entscheidungen": "betroffene_anforderungen" | "betroffene_offene_punkte" | "zugrunde_liegende_beurteilungen" | "ersetzt_durch_entscheidung" | "anfrage" | "titel" | "entscheidungsgegenstand" | "entscheidungstyp" | "alternativen" | "entscheidung" | "begruendung" | "verantwortlicher_vorname" | "verantwortlicher_nachname" | "kompetenz_geprueft" | "entscheidungsstatus" | "entscheidungsdatum" | "auflagen" | "gueltig_bis" | "ergebnis" | "erneute_pruefung";
  "erfahrungen": "belegquellen" | "belegbeurteilungen" | "belegentscheidungen" | "ursprungsanfrage" | "titel" | "sachverhalt" | "erfahrungstyp" | "produktfamilie" | "anforderungstyp" | "schlagwoerter" | "urspruengliches_problem" | "vorgehen" | "beobachtetes_ergebnis" | "erkenntnis" | "belegabschluss" | "gueltigkeitsbedingungen" | "bekannte_grenzen" | "risiko_uebertragung" | "bestaetigungsstatus" | "bestaetigt_von" | "bestaetigt_am" | "gueltig_ab" | "gueltig_bis" | "wiederverwendungsstatus" | "kommentar_wiederverwendung";
  "wiederverwendung_von_erfahrungen": "erfahrung" | "ziel_anfrage" | "abrufdatum" | "abrufgrund" | "aehnlichkeit" | "kontextunterschiede" | "gueltigkeit_geprueft" | "geprueft_von" | "verwendungsergebnis" | "begruendung" | "beobachteter_nutzen" | "ersparnis_schaetzung_min" | "ersparnis_tatsaechlich_min" | "negative_folgen" | "bewertet_am";
}
export type MessageFieldKey<E extends EntityKey> = E extends keyof MessageFields ? MessageFields[E] : never;

export const REQUIRED_MESSAGES: { [E in EntityKey]?: Partial<Record<MessageFieldKey<E>, string>> } = {
  // <custom:messages>
  // </custom:messages>
};

/** The sentence shown when `key` of `entity` is required and empty — the
 *  agent's own text (translated at runtime like every page string), else the
 *  label sentence. Call it while rendering, not at module scope. */
export function requiredMessage(entity: EntityKey, key: string): string {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  if (own && own.trim()) return tx(own);
  return t('v_required', { label: labelOf(entity, key) });
}

/** True when the agent wrote a sentence for the field. */
export function hasOwnMessage(entity: EntityKey, key: string): boolean {
  const own = (REQUIRED_MESSAGES as Record<string, Record<string, string | undefined> | undefined>)[entity]?.[key];
  return Boolean(own && own.trim());
}
