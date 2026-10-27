// The orchestrator's plan, as far as the running app needs it
// (docs/orchestrator/SPEC.md). Generated — do not edit; regenerated on every
// build and update from the stored plan. Without a plan every map is empty.
//
//   SYSTEM_ASSIGNED entity → fields a tool fills when a record is CREATED — the
//                   value does not exist before; dialogs hide these on create and
//                   the form-polish sets no default on them. A scheduled or
//                   update-triggered tool owns its field but is NOT in here.
//   PLAN_SENTENCES  slug → the plan in the owner's words (flows' field page)
//
// The runtime write guard (FLOW_WRITES/OWNERSHIP, planGuard.ts) left on
// 23.09.2026: a flow page composes against its generated hook, whose submit
// plan IS the Schreibliste — there is no way to spell a write outside it.

import { INTENTS } from '@/config/intents';

export const SYSTEM_ASSIGNED: Record<string, string[]> = {
  "kundenanfragen": [
    "anfragenummer"
  ]
};

export const PLAN_SENTENCES: Record<string, string[]> = {
  "anfrage-aufnehmen": [
    "Legt an: informationsquellen, kundenanfragen",
    "Automatisch: status (fester Wert „neu“), klaeraufwand (fester Wert „unbekannt“), eingangsdatum (heutiges Datum, automatisch), vollstaendigkeit (fester Wert „ungeprueft“), quellenstatus (fester Wert „ungeprueft“), eingangszeitpunkt (aktueller Zeitpunkt, automatisch), extraktionsstatus (fester Wert „nicht_verarbeitet“)"
  ],
  "anforderungen-erfassen": [
    "Legt an: technische_anforderungen",
    "Ändert: kundenanfragen",
    "Automatisch: pruefstatus (fester Wert „ungeprueft“), status (fester Wert „in_pruefung“)"
  ],
  "offenen-punkt-anlegen": [
    "Legt an: aufgaben, offene_punkte",
    "Automatisch: status (fester Wert „zugewiesen“), status (fester Wert „offen“)"
  ],
  "rueckfrage-vorbereiten": [
    "Legt an: rueckfragen_und_kommunikation",
    "Ändert: kundenanfragen, offene_punkte",
    "Automatisch: antwortstatus (fester Wert „offen“), versandstatus (fester Wert „entwurf“), kommunikationstyp (fester Wert „kundenrueckfrage“), status (fester Wert „wartet_auf_kunde“), status (fester Wert „rueckfragen_offen“)"
  ],
  "antwort-zuordnen": [
    "Legt an: rueckfragen_und_kommunikation",
    "Ändert: offene_punkte",
    "Automatisch: versandstatus (fester Wert „nicht_erforderlich“), kommunikationstyp (fester Wert „antwort“), antwort_erhalten_am (aktueller Zeitpunkt, automatisch), status (fester Wert „in_bearbeitung“), erneute_pruefung (fester Wert „true“)"
  ],
  "klaerung-abschliessen": [
    "Legt an: technischer_abschluss",
    "Ändert: kundenanfragen",
    "Automatisch: pruefdatum (aktueller Zeitpunkt, automatisch), freigabestatus (fester Wert „nicht_freigegeben“), uebergabestatus (fester Wert „bereit“), status (fester Wert „technisch_geklaert“), geklaert_am (aktueller Zeitpunkt, automatisch), vollstaendigkeit (fester Wert „vollstaendig_geprueft“)"
  ]
};

export const PLAN_SUMMARY = "Die Anwendung begleitet die technische Klärung einer Kundenanfrage vom Eingang bis zur dokumentierten Übergabe eines technisch geprüften Auftragsentwurfs. Sie hält Anforderungen, Quellen, offene Punkte, Aufgaben, Rückfragen, Beurteilungen und Entscheidungen zusammen und sichert Erfahrungen für spätere ähnliche Anfragen.";

/** slug → the lists a flow writes (the plan's Schreibliste). The nav leaves a
 *  flow out for a user who may not write one of them (lib/permissions.ts). */
export const FLOW_ENTITIES: Record<string, string[]> = {
  "anfrage-aufnehmen": [
    "informationsquellen",
    "kundenanfragen"
  ],
  "anforderungen-erfassen": [
    "kundenanfragen",
    "technische_anforderungen"
  ],
  "offenen-punkt-anlegen": [
    "aufgaben",
    "offene_punkte"
  ],
  "rueckfrage-vorbereiten": [
    "kundenanfragen",
    "offene_punkte",
    "rueckfragen_und_kommunikation"
  ],
  "antwort-zuordnen": [
    "offene_punkte",
    "rueckfragen_und_kommunikation"
  ],
  "klaerung-abschliessen": [
    "kundenanfragen",
    "technischer_abschluss"
  ]
};

/** A field an UPDATE flow writes, and the value it fixes (if it does). */
export interface FlowOwner { slug: string; value?: string }

/** entity → field → the update flows that change it. Such a change is the
 *  flow's job — it records who and when (a review, a decision) — so the
 *  dashboard never writes these fields itself; it opens the flow
 *  (check-dashboard gate 25). */
export const FLOW_OWNED: Record<string, Record<string, FlowOwner[]>> = {
  "kundenanfragen": {
    "status": [
      {
        "slug": "anforderungen-erfassen",
        "value": "in_pruefung"
      },
      {
        "slug": "rueckfrage-vorbereiten",
        "value": "rueckfragen_offen"
      },
      {
        "slug": "klaerung-abschliessen",
        "value": "technisch_geklaert"
      }
    ],
    "geklaert_am": [
      {
        "slug": "klaerung-abschliessen"
      }
    ],
    "vollstaendigkeit": [
      {
        "slug": "klaerung-abschliessen",
        "value": "vollstaendig_geprueft"
      }
    ]
  },
  "offene_punkte": {
    "status": [
      {
        "slug": "rueckfrage-vorbereiten",
        "value": "wartet_auf_kunde"
      },
      {
        "slug": "antwort-zuordnen",
        "value": "in_bearbeitung"
      }
    ],
    "erneute_pruefung": [
      {
        "slug": "antwort-zuordnen",
        "value": "true"
      }
    ]
  }
};

/** The link that opens the flow owning `entity.field` with `recordId` already
 *  picked — `toValue` chooses between flows that fix different values (the
 *  approve flow vs the execute flow). null when no LIVE flow owns it (not
 *  built yet, or removed): the caller then offers no shortcut. */
export function flowLinkFor(entity: string, field: string, recordId: string, toValue?: string): string | null {
  const owners = (FLOW_OWNED[entity]?.[field] ?? []).filter(o => INTENTS.some(i => i.path === `/intents/${o.slug}`));
  const owner = (toValue !== undefined ? owners.find(o => o.value === toValue) : undefined)
    ?? owners.find(o => o.value === undefined)
    ?? owners[0];
  return owner ? `#/intents/${owner.slug}?record=${encodeURIComponent(recordId)}` : null;
}

/** flowLinkFor as a click handler — `action: go ? { label, onClick: go } : undefined`. */
export function flowActionFor(entity: string, field: string, recordId: string, toValue?: string): (() => void) | null {
  const href = flowLinkFor(entity, field, recordId, toValue);
  return href ? () => { window.location.hash = href.slice(1); } : null;
}
