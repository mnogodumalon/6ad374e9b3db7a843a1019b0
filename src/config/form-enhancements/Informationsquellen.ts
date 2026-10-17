// Auto-generated. Per-entity form-enhancements config for "Informationsquellen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "anfrage", {"row": ["quellentyp", "quellenstatus"], "cols": "1fr 1fr"}, "urheber", {"row": ["eingangszeitpunkt", "quellendatum"], "cols": "1fr 1fr"}, "versionskennung", "referenz_url", "extraktionsstatus", {"row": ["pruefung_durch", "pruefung_am"], "cols": "1fr 1fr"}, "erneute_pruefung", "ersetzt_quelle", "zusammenfassung", "bemerkung"],
  defaults: {
    'eingangszeitpunkt': { kind: 'today', withTime: true },
    'quellenstatus': { kind: 'lookup', key: 'ungeprueft', label: 'Ungeprüft' },
    'extraktionsstatus': { kind: 'lookup', key: 'nicht_verarbeitet', label: 'Nicht verarbeitet' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
