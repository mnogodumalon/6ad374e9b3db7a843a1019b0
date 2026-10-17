// Auto-generated. Per-entity form-enhancements config for "Rückfragen und Kommunikation".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["betreff", "anfrage", {"row": ["kommunikationstyp", "kanal"], "cols": "1fr 1fr"}, "versandstatus", {"row": ["absender", "empfaenger"], "cols": "1fr 1fr"}, {"row": ["versanddatum", "antwort_erwartet_bis"], "cols": "1fr 1fr"}, "antwort_erhalten_am", "antwortstatus", "quelle", "beantwortet_nachricht", "zugehoerige_offene_punkte", "folgeaufgabe_noetig", "inhalt", "notizen"],
  defaults: {
    'versandstatus': { kind: 'lookup', key: 'entwurf', label: 'Entwurf' },
    'antwortstatus': { kind: 'lookup', key: 'offen', label: 'Offen' },
    'antwort_erwartet_bis': { kind: 'todayOffset', days: 3 },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
