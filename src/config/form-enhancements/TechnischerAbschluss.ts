// Auto-generated. Per-entity form-enhancements config for "Technischer Abschluss".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["anfrage", {"row": ["pruefdatum", "geprueft_von"], "cols": "1fr 1fr"}, "anforderungen_geprueft", "kritische_punkte_geklaert", "entscheidungen_vorhanden", "freigaben_vorhanden", {"row": ["freigabestatus", "uebergabestatus"], "cols": "1fr 1fr"}, {"row": ["uebergabeempfaenger", "uebergabedatum"], "cols": "1fr 1fr"}, "verbleibende_abweichungen", "verbleibende_risiken", "offene_restpunkte", "zusammenfassung"],
  defaults: {
    'pruefdatum': { kind: 'today', withTime: true },
    'uebergabestatus': { kind: 'lookup', key: 'nicht_vorbereitet', label: 'Nicht vorbereitet' },
    'freigabestatus': { kind: 'lookup', key: 'nicht_freigegeben', label: 'Nicht freigegeben' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
