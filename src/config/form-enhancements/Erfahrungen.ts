// Auto-generated. Per-entity form-enhancements config for "Erfahrungen".
// Written by the backend form polish (app/services/form_polish.py) from the
// generator's manifest; scripts/parse-formulas.mjs expands the formula strings.
// Schema: see ./types.ts.

import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ["titel", "ursprungsanfrage", {"row": ["erfahrungstyp", "bestaetigungsstatus"], "cols": "1fr 1fr"}, {"row": ["produktfamilie", "anforderungstyp"], "cols": "1fr 1fr"}, "schlagwoerter", {"row": ["bestaetigt_von", "bestaetigt_am"], "cols": "2fr 1fr"}, {"row": ["gueltig_ab", "gueltig_bis"], "cols": "1fr 1fr"}, {"row": ["risiko_uebertragung", "wiederverwendungsstatus"], "cols": "1fr 1fr"}, "belegabschluss", "belegquellen", "belegbeurteilungen", "belegentscheidungen", "sachverhalt", "urspruengliches_problem", "vorgehen", "beobachtetes_ergebnis", "erkenntnis", "gueltigkeitsbedingungen", "bekannte_grenzen", "kommentar_wiederverwendung"],
  defaults: {
    'bestaetigungsstatus': { kind: 'lookup', key: 'ungeprueft', label: 'Ungeprüft' },
    'wiederverwendungsstatus': { kind: 'lookup', key: 'nicht_geprueft', label: 'Nicht geprüft' },
    'gueltig_ab': { kind: 'today' },
  },
  computed: {},
};

export const computedDeps: Record<string, string[]> = {};
export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
