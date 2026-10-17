// Auto-generated. Per-entity form-enhancements config for "Offene Punkte".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["kurztitel", "anfrage", {"row": ["status", "prioritaet"], "cols": "1fr 1fr"}, {"row": ["punktetyp", "auswirkung"], "cols": "1fr 1fr"}, "beschreibung", "betroffene_anforderungen", "betroffene_quellen", "zustaendige_rolle", {"row": ["verantwortlicher_vorname", "verantwortlicher_nachname"]}, "faellig_am", "erledigungskriterium", "loesung_oder_ergebnis", {"row": ["antwort_geprueft", "erneute_pruefung"], "cols": "1fr 1fr"}, {"row": ["abgeschlossen_am", "abschluss_durch"], "cols": "1fr 1fr"}],
  defaults: {
    'status': { kind: 'lookup', key: 'neu', label: 'Neu' },
    'prioritaet': { kind: 'lookup', key: 'normal', label: 'Normal' },
    'faellig_am': { kind: 'todayOffset', days: 14 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
