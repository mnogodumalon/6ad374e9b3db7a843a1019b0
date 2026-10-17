// Auto-generated. Per-entity form-enhancements config for "Kundenanfragen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["anfragenummer", "kunde", {"row": ["eingangsdatum", "eingangskanal"], "cols": "1fr 1fr"}, "status", "prioritaet", {"row": ["kontakt_vorname", "kontakt_nachname"]}, "kontakt_email", "kundenreferenz", {"row": ["produktfamilie", "produktvariante"], "cols": "1fr 1fr"}, {"row": ["gewuenschte_menge", "gewuenschter_liefertermin"], "cols": "1fr 1fr"}, {"row": ["verantwortlicher_vorname", "verantwortlicher_nachname"]}, "klaeraufwand", "vollstaendigkeit", {"row": ["zieltermin_klaerung", "geklaert_am"], "cols": "1fr 1fr"}, {"row": ["schaetzung_bearbeitung_min", "gemessen_bearbeitung_min"], "cols": "1fr 1fr"}, {"row": ["wartezeit_kunde_min", "wartezeit_intern_min"], "cols": "1fr 1fr"}, {"row": ["anzahl_nachtraegliche_aenderungen", "anzahl_nacharbeiten"], "cols": "1fr 1fr"}, "anfragebeschreibung", "urspruengliche_kundenanforderungen"],
  defaults: {
    'eingangsdatum': { kind: 'today' },
    'status': { kind: 'lookup', key: 'neu', label: 'Neu' },
    'zieltermin_klaerung': { kind: 'todayOffset', days: 14 },
  },
  computed: {
    '_gesamtzeit_min': { op: 'add', left: { op: 'add', left: { kind: 'field', key: 'gemessen_bearbeitung_min' }, right: { kind: 'field', key: 'wartezeit_kunde_min' } }, right: { kind: 'field', key: 'wartezeit_intern_min' } },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
