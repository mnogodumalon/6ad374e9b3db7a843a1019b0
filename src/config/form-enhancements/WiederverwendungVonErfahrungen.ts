// Auto-generated. Per-entity form-enhancements config for "Wiederverwendung von Erfahrungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: [{"row": ["erfahrung", "ziel_anfrage"], "cols": "1fr 1fr"}, {"row": ["abrufdatum", "aehnlichkeit"], "cols": "1fr 1fr"}, {"row": ["gueltigkeit_geprueft", "geprueft_von"], "cols": "1fr 1fr"}, "verwendungsergebnis", {"row": ["ersparnis_schaetzung_min", "ersparnis_tatsaechlich_min"], "cols": "1fr 1fr"}, "bewertet_am", "abrufgrund", "kontextunterschiede", "begruendung", "beobachteter_nutzen", "negative_folgen"],
  defaults: {
    'abrufdatum': { kind: 'today', withTime: true },
    'bewertet_am': { kind: 'today' },
  },
  computed: {},
  numberFields: {
    'ersparnis_schaetzung_min': { allowNegative: true },
    'ersparnis_tatsaechlich_min': { allowNegative: true },
  },
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
