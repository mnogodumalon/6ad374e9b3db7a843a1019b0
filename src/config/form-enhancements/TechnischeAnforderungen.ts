// Auto-generated. Per-entity form-enhancements config for "Technische Anforderungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["bezeichnung", "anfrage", "pruefstatus", {"row": ["anforderungstyp", "ursprung"], "cols": "1fr 1fr"}, {"row": ["sollwert", "einheit"], "cols": "2fr 1fr"}, "vergleichsoperator", {"row": ["min_wert", "max_wert"], "cols": "1fr 1fr"}, {"row": ["gueltig_ab", "gueltig_bis"], "cols": "1fr 1fr"}, {"row": ["verantwortlicher_vorname", "verantwortlicher_nachname"]}, "ist_pflichtanforderung", "erneute_pruefung", "quellen", "beschreibung", "begruendung_pruefstatus"],
  defaults: {
    'pruefstatus': { kind: 'lookup', key: 'ungeprueft', label: 'Ungeprüft' },
    'gueltig_ab': { kind: 'today' },
  },
  computed: {},
  numberFields: {
    'min_wert': { allowNegative: true },
    'max_wert': { allowNegative: true },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
