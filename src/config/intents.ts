/**
 * intents.ts — registry of intent workflow pages (Phase 2).
 *
 * The intents orchestrator REGISTERS every page it creates here; the sidebar
 * section (IntentsNav) renders automatically from this list — no Layout edit
 * needed. Keep `path` identical to the route added in App.tsx's
 * `<custom:routes>` block.
 *
 * ONLY write inside the marker blocks — everything outside is scaffold and is
 * overwritten on the next /build/update.
 *
 *   <custom:intent-imports>
 *   import { IconCalendarPlus } from '@tabler/icons-react';
 *   </custom:intent-imports>
 *   …
 *   <custom:intents>
 *   { path: '/intents/neue-buchung', label: { de: 'Neue Buchung', en: 'New booking' }, icon: IconCalendarPlus, description: { de: 'Buchung in 3 Schritten anlegen', en: 'Create a booking in 3 steps' } },
 *   </custom:intents>
 */
import type { ComponentType } from 'react';

// <custom:intent-imports>
import { IconInbox, IconListCheck, IconAlertTriangle, IconMessageQuestion, IconMessageReply, IconCircleCheck } from '@tabler/icons-react';
// </custom:intent-imports>

export interface IntentLink {
  /** Route path as wired in App.tsx (HashRouter), e.g. '/intents/neue-buchung'. */
  path: string;
  /**
   * Short sidebar label (1–3 words). Preferred: both UI languages
   * ({ de, en } — the runtime switcher picks the active one; cs stays
   * readable for legacy entries). A plain string stays valid and renders as-is.
   */
  label: string | { de?: string; en?: string; cs?: string };
  /** Tabler icon COMPONENT reference (not rendered JSX), e.g. IconCalendarPlus. */
  icon?: ComponentType<{ size?: number | string; className?: string; stroke?: number | string }>;
  /**
   * One-line purpose. Same shape as `label`: prefer both UI languages so a
   * language switch reaches it; a plain string stays valid.
   */
  description?: string | { de?: string; en?: string; cs?: string };
}

export const INTENTS: IntentLink[] = [
  // <custom:intents>
  { path: '/intents/anfrage-aufnehmen', label: { de: 'Anfrage aufnehmen', en: 'Record inquiry' }, icon: IconInbox, description: { de: 'Kunde wählen, Anfrage erfassen, erste Quelle ablegen, Verantwortlichen und Priorität festlegen.', en: 'Select customer, record inquiry, file first source, assign owner and priority.' } },
  { path: '/intents/anforderungen-erfassen', label: { de: 'Anforderungen erfassen', en: 'Capture requirements' }, icon: IconListCheck, description: { de: 'Technische Anforderungen zu einer Anfrage anlegen, Quellen zuordnen, Anfrage in Prüfung setzen.', en: 'Create technical requirements for an inquiry, assign sources, set inquiry to under review.' } },
  { path: '/intents/offenen-punkt-anlegen', label: { de: 'Offenen Punkt mit Aufgabe anlegen', en: 'Create open item with task' }, icon: IconAlertTriangle, description: { de: 'Klärungsbedarf als offenen Punkt erfassen und direkt eine verantwortete Aufgabe anlegen.', en: 'Record clarification need as an open item and directly create an assigned task.' } },
  { path: '/intents/rueckfrage-vorbereiten', label: { de: 'Rückfrage vorbereiten', en: 'Prepare inquiry message' }, icon: IconMessageQuestion, description: { de: 'Aus offenen Punkten einen Nachrichtenentwurf bündeln (nicht versendet); Punkte warten danach auf den Kunden.', en: 'Bundle open items into a message draft (not sent); items then wait for the customer.' } },
  { path: '/intents/antwort-zuordnen', label: { de: 'Antwort zuordnen', en: 'Assign reply' }, icon: IconMessageReply, description: { de: 'Antwort erfassen, mit Nachricht und offenen Punkten verknüpfen und als vollständig, unklar oder widersprüchlich kennzeichnen.', en: 'Record reply, link it to message and open items, and mark it as complete, unclear, or contradictory.' } },
  { path: '/intents/klaerung-abschliessen', label: { de: 'Technische Klärung abschließen', en: 'Complete technical clarification' }, icon: IconCircleCheck, description: { de: 'Voraussetzungen prüfen, Abschluss mit Restrisiken und Übergabe dokumentieren, Anfrage auf technisch geklärt setzen. Keine automatische Freigabe.', en: 'Check prerequisites, document completion with residual risks and handover, set inquiry to technically clarified. No automatic approval.' } },
  // </custom:intents>
];

/**
 * True only in the Phase-1 deploy bundle (the service flips it): the sidebar
 * then shows ghost rows ("werden erstellt…") until Phase 2 registers the real
 * pages and sets this back to false. Lives OUTSIDE the custom markers on
 * purpose — a scaffold update resets it to false (self-healing if Phase 2
 * never ran).
 */
export const INTENTS_PENDING = false;

/**
 * When the Phase-1 bundle was deployed (ISO, set by the service together with
 * INTENTS_PENDING). The sidebar stops showing the ghost row PENDING_MAX_MINUTES
 * later on its own: a Phase 2 that ended red (or never ran) used to leave a
 * pulsing "werden erstellt …" in every deployed Phase-1 bundle forever — no
 * code path redeploys Phase 1 without the flag (live 03.09.2026).
 */
export const INTENTS_PENDING_SINCE: string | null = null;
export const PENDING_MAX_MINUTES = 30;
