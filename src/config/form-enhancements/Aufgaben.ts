// Auto-generated. Per-entity form-enhancements config for "Aufgaben".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "anfrage", {"row": ["verantwortlicher_vorname", "verantwortlicher_nachname"]}, "status", {"row": ["aufgabentyp", "prioritaet"], "cols": "1fr 1fr"}, {"row": ["faellig_am", "abgeschlossen_am"], "cols": "1fr 1fr"}, "mitwirkende", "offener_punkt", "abhaengige_aufgaben", "beschreibung", "blockierungsgrund", "ergebnis"],
  defaults: {
    'status': { kind: 'lookup', key: 'offen', label: 'Offen' },
    'prioritaet': { kind: 'lookup', key: 'normal', label: 'Normal' },
    'faellig_am': { kind: 'todayOffset', days: 14 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
