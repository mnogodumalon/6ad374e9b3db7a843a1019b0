// Auto-generated. Per-entity form-enhancements config for "Beurteilungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["beurteilungsgegenstand", "anfrage", {"row": ["beurteilungsart", "einschaetzung"], "cols": "1fr 1fr"}, "fachliche_begruendung", "pruefstatus", "betroffene_anforderungen", "betroffene_offene_punkte", "zugrunde_liegende_quellen", {"row": ["erstellt_von", "erstellt_am"], "cols": "1fr 1fr"}, {"row": ["geprueft_von", "geprueft_am"], "cols": "1fr 1fr"}, {"row": ["ist_ki_vorschlag", "erneute_pruefung"], "cols": "1fr 1fr"}, "annahmen", "unsicherheiten", "alternativen", "empfehlung"],
  defaults: {
    'erstellt_am': { kind: 'today', withTime: true },
    'pruefstatus': { kind: 'lookup', key: 'entwurf', label: 'Entwurf' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
