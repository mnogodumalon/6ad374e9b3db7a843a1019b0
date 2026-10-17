// The orchestrator's plan, as far as the running app needs it
// (docs/orchestrator/SPEC.md). Generated — do not edit; regenerated on every
// build and update from the stored plan. Without a plan every map is empty.
//
//   SYSTEM_ASSIGNED entity → fields a tool fills when a record is CREATED — the
//                   value does not exist before; dialogs hide these on create and
//                   the form-polish sets no default on them. A scheduled or
//                   update-triggered tool owns its field but is NOT in here.
//   PLAN_SENTENCES  slug → the plan in the owner's words (flows' field page)
//
// The runtime write guard (FLOW_WRITES/OWNERSHIP, planGuard.ts) left on
// 23.09.2026: a flow page composes against its generated hook, whose submit
// plan IS the Schreibliste — there is no way to spell a write outside it.

export const SYSTEM_ASSIGNED: Record<string, string[]> = {
  "kundenanfragen": [
    "anfragenummer"
  ]
};

export const PLAN_SENTENCES: Record<string, string[]> = {
  "anfrage-aufnehmen": [
    "Legt an: informationsquellen, kundenanfragen",
    "Automatisch: eingangsdatum (heutiges Datum, automatisch), status (fester Wert „neu“), vollstaendigkeit (fester Wert „ungeprueft“), klaeraufwand (fester Wert „unbekannt“), eingangszeitpunkt (aktueller Zeitpunkt, automatisch), quellenstatus (fester Wert „ungeprueft“), extraktionsstatus (fester Wert „nicht_verarbeitet“)"
  ],
  "anforderungen-erfassen": [
    "Legt an: technische_anforderungen",
    "Ändert: kundenanfragen",
    "Automatisch: pruefstatus (fester Wert „ungeprueft“), status (fester Wert „in_pruefung“)"
  ],
  "offenen-punkt-anlegen": [
    "Legt an: aufgaben, offene_punkte",
    "Automatisch: status (fester Wert „zugewiesen“), status (fester Wert „offen“)"
  ],
  "rueckfrage-vorbereiten": [
    "Legt an: rueckfragen_und_kommunikation",
    "Ändert: kundenanfragen, offene_punkte",
    "Automatisch: kommunikationstyp (fester Wert „kundenrueckfrage“), versandstatus (fester Wert „entwurf“), antwortstatus (fester Wert „offen“), status (fester Wert „wartet_auf_kunde“), status (fester Wert „rueckfragen_offen“)"
  ],
  "antwort-zuordnen": [
    "Legt an: rueckfragen_und_kommunikation",
    "Ändert: offene_punkte",
    "Automatisch: kommunikationstyp (fester Wert „antwort“), antwort_erhalten_am (aktueller Zeitpunkt, automatisch), versandstatus (fester Wert „nicht_erforderlich“), status (fester Wert „in_bearbeitung“), erneute_pruefung (fester Wert „true“)"
  ],
  "klaerung-abschliessen": [
    "Legt an: technischer_abschluss",
    "Ändert: kundenanfragen",
    "Automatisch: pruefdatum (aktueller Zeitpunkt, automatisch), uebergabestatus (fester Wert „bereit“), freigabestatus (fester Wert „nicht_freigegeben“), status (fester Wert „technisch_geklaert“), geklaert_am (aktueller Zeitpunkt, automatisch), vollstaendigkeit (fester Wert „vollstaendig_geprueft“)"
  ]
};

export const PLAN_SUMMARY = "Die Anwendung begleitet die technische Klärung einer Kundenanfrage vom Eingang bis zur dokumentierten Übergabe eines technisch geprüften Auftragsentwurfs. Sie hält Anforderungen, Quellen, offene Punkte, Aufgaben, Rückfragen, Beurteilungen und Entscheidungen zusammen und sichert Erfahrungen für spätere ähnliche Anfragen.";

/** slug → the lists a flow writes (the plan's Schreibliste). The nav leaves a
 *  flow out for a user who may not write one of them (lib/permissions.ts). */
export const FLOW_ENTITIES: Record<string, string[]> = {
  "anfrage-aufnehmen": [
    "informationsquellen",
    "kundenanfragen"
  ],
  "anforderungen-erfassen": [
    "kundenanfragen",
    "technische_anforderungen"
  ],
  "offenen-punkt-anlegen": [
    "aufgaben",
    "offene_punkte"
  ],
  "rueckfrage-vorbereiten": [
    "kundenanfragen",
    "offene_punkte",
    "rueckfragen_und_kommunikation"
  ],
  "antwort-zuordnen": [
    "offene_punkte",
    "rueckfragen_und_kommunikation"
  ],
  "klaerung-abschliessen": [
    "kundenanfragen",
    "technischer_abschluss"
  ]
};
