/**
 * useRueckfrageVorbereitenFlow — the plumbing of the flow « Rückfrage vorbereiten », generated from the plan.
 *
 * Writes `rueckfragen_und_kommunikation`: asks `kanal`, `inhalt`, `anfrage`, `betreff`, `absender`, `empfaenger`, `antwort_erwartet_bis`, `zugehoerige_offene_punkte`; sets `antwortstatus`, `versandstatus`, `kommunikationstyp` itself.
Changes `offene_punkte` (only when the person fills it): the record to change is picked (`flow.pick('offene_punkte')`), the form is prefilled with its values; ; sets `status` itself.
Changes `kundenanfragen` (only when the person fills it): the record to change is picked (`flow.pick('kundenanfragen')`), the form is prefilled with its values; ; sets `status` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 6)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useRueckfrageVorbereitenFlow({
 *     steps: { offene_punkte: 1, kundenanfragen: 2, anfrage: 3, zugehoerige_offene_punkte: 4, kanal: 5, inhalt: 5, betreff: 5, absender: 5, empfaenger: 5, antwort_erwartet_bis: 5 },
 *     items: { anfrage: r => ({ id: r.id, title: fieldText(r, 'anfragenummer') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.anfrage.select} {...flow.pick('anfrage')} />
 *     <EntitySelectStep {...flow.picks.zugehoerige_offene_punkte.select} {...flow.pickMany('zugehoerige_offene_punkte')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.offene_punkte.select} {...flow.pick('offene_punkte')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.kundenanfragen.select} {...flow.pick('kundenanfragen')} />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="kanal" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="inhalt" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="betreff" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="absender" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="empfaenger" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="antwort_erwartet_bis" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import { useEffect, useState } from 'react';
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
import { entityLabel } from '@/lib/journey/rules';
export type RueckfrageVorbereitenFieldKey = 'absender' | 'anfrage' | 'antwort_erwartet_bis' | 'betreff' | 'empfaenger' | 'inhalt' | 'kanal' | 'kundenanfragen' | 'offene_punkte' | 'zugehoerige_offene_punkte';

export interface RueckfrageVorbereitenForms {
  rueckfragen_und_kommunikation: StepForm<'rueckfragen_und_kommunikation'>;
  offene_punkte: StepForm<'offene_punkte'>;
  kundenanfragen: StepForm<'kundenanfragen'>;
}

// Alias so the option generics stay readable.
type Key = RueckfrageVorbereitenFieldKey;

export interface RueckfrageVorbereitenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    anfrage?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    zugehoerige_offene_punkte?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    offene_punkte?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    kundenanfragen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"absender": 5, "anfrage": 3, "antwort_erwartet_bis": 5, "betreff": 5, "empfaenger": 5, "inhalt": 5, "kanal": 5, "kundenanfragen": 2, "offene_punkte": 1, "zugehoerige_offene_punkte": 4};
export const RUECKFRAGEVORBEREITEN_REVIEW_STEP = 6;

function fromPick<T>(pick: { recordOf(id: string): JourneyRecord | undefined }, form: StepForm, field: string, read: (r: JourneyRecord) => T): T | undefined {
  const id = form.get(field);
  const rec = typeof id === 'string' && id ? pick.recordOf(id) : undefined;
  return rec ? read(rec) : undefined;
}
function isoDaysFromToday(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns T, not Partial<T>: a Record's index signature is already "maybe
// absent", and Partial<Record<string, string>> does not assign to the
// Record<string, string> useStepForm wants (tsc, live 23.09.2026 — eight
// errors, one per hook, caught only in the sandbox build).
function only<T extends Record<string, unknown>>(obj: T | undefined, keys: string[]): T | undefined {
  if (!obj) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in obj) out[k] = obj[k];
  return out as T;
}

function hasValues(form: StepForm): boolean {
  return form.keys.some(k => !isEmptyValue(form.values[k]));
}

export function useRueckfrageVorbereitenFlow(options: RueckfrageVorbereitenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [offene_punkteTargetId, setOffenePunkteTargetId] = useState<string | null>(null);
  const [kundenanfragenTargetId, setKundenanfragenTargetId] = useState<string | null>(null);
  const rueckfragen_und_kommunikation = useStepForm('rueckfragen_und_kommunikation', {
    fields: ["kanal", "inhalt", "anfrage", "betreff", "absender", "empfaenger", "antwort_erwartet_bis", "zugehoerige_offene_punkte"],
    steps: only(steps, ["kanal", "inhalt", "anfrage", "betreff", "absender", "empfaenger", "antwort_erwartet_bis", "zugehoerige_offene_punkte"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["kanal", "inhalt", "anfrage", "betreff", "absender", "empfaenger", "antwort_erwartet_bis", "zugehoerige_offene_punkte"]),
    messages: only(options.messages as Record<string, string> | undefined, ["kanal", "inhalt", "anfrage", "betreff", "absender", "empfaenger", "antwort_erwartet_bis", "zugehoerige_offene_punkte"]),
  });
  const offene_punkte = useStepForm('offene_punkte', {
    fields: [],
    steps: only(steps, []) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, []),
    messages: only(options.messages as Record<string, string> | undefined, []),
  });
  const kundenanfragen = useStepForm('kundenanfragen', {
    fields: [],
    steps: only(steps, []) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, []),
    messages: only(options.messages as Record<string, string> | undefined, []),
  });
  const forms: RueckfrageVorbereitenForms = { rueckfragen_und_kommunikation, offene_punkte, kundenanfragen };
  const formList: StepForm[] = [rueckfragen_und_kommunikation, offene_punkte, kundenanfragen];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    anfrage: useRecordSearch(servicePort, 'kundenanfragen', withPickPolicy('anfrage', {
      searchFields: ["anfragenummer"] as never,
      toItem: options.items?.anfrage as never,
    })),
    zugehoerige_offene_punkte: useRecordSearch(servicePort, 'offene_punkte', withPickPolicy('zugehoerige_offene_punkte', {
      searchFields: ["kurztitel"] as never,
      filter: "r.v_status in ['neu', 'zugewiesen', 'in_bearbeitung']",
      where: (r: JourneyRecord) => ["neu", "zugewiesen", "in_bearbeitung"].includes(fieldLookup(r, "status")?.key ?? ''),
      toItem: options.items?.zugehoerige_offene_punkte as never,
    })),
    offene_punkte: useRecordSearch(servicePort, 'offene_punkte', withPickPolicy('offene_punkte', {
      searchFields: ["kurztitel"] as never,
      filter: "r.v_status in ['neu', 'zugewiesen', 'in_bearbeitung']",
      where: (r: JourneyRecord) => ["neu", "zugewiesen", "in_bearbeitung"].includes(fieldLookup(r, "status")?.key ?? ''),
      toItem: options.items?.offene_punkte as never,
    })),
    kundenanfragen: useRecordSearch(servicePort, 'kundenanfragen', withPickPolicy('kundenanfragen', {
      searchFields: ["anfragenummer"] as never,
      toItem: options.items?.kundenanfragen as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:rueckfrage-vorbereiten:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:rueckfrage-vorbereiten:write:${entity}.${field}`,
  });
  const picks = {
    anfrage: { ...searches.anfrage, select: { ...searches.anfrage.select, create: false as boolean, hint: hintFor('anfrage', 'kundenanfragen', null as PickWhere | null) } },
    zugehoerige_offene_punkte: { ...searches.zugehoerige_offene_punkte, select: { ...searches.zugehoerige_offene_punkte.select, create: false as boolean, hint: hintFor('zugehoerige_offene_punkte', 'offene_punkte', {"conditions": [{"field": "status", "op": "in", "value": ["neu", "zugewiesen", "in_bearbeitung"]}], "mode": "all"} as PickWhere | null) } },
    offene_punkte: { ...searches.offene_punkte, select: { ...searches.offene_punkte.select, create: false as boolean, hint: hintFor('offene_punkte', 'offene_punkte', {"conditions": [{"field": "status", "op": "in", "value": ["neu", "zugewiesen", "in_bearbeitung"]}], "mode": "all"} as PickWhere | null) } },
    kundenanfragen: { ...searches.kundenanfragen, select: { ...searches.kundenanfragen.select, create: false as boolean, hint: hintFor('kundenanfragen', 'kundenanfragen', null as PickWhere | null) } },
  };

  const offene_punkteFilled = hasValues(offene_punkte);
  const kundenanfragenFilled = hasValues(kundenanfragen);
  const plan: PlanStep[] = [
    {
      key: 'rueckfragen_und_kommunikation', entity: 'rueckfragen_und_kommunikation', form: rueckfragen_und_kommunikation, primary: true,
      values: (): FormValues => ({
        antwortstatus: policyFixedValue('rueckfragen_und_kommunikation', 'antwortstatus') ?? "offen",
        versandstatus: policyFixedValue('rueckfragen_und_kommunikation', 'versandstatus') ?? "entwurf",
        kommunikationstyp: policyFixedValue('rueckfragen_und_kommunikation', 'kommunikationstyp') ?? "kundenrueckfrage",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('rueckfragen_und_kommunikation', 'antwortstatus', policyFixedValue('rueckfragen_und_kommunikation', 'antwortstatus') ?? "offen"), setting('rueckfragen_und_kommunikation', 'versandstatus', policyFixedValue('rueckfragen_und_kommunikation', 'versandstatus') ?? "entwurf"), setting('rueckfragen_und_kommunikation', 'kommunikationstyp', policyFixedValue('rueckfragen_und_kommunikation', 'kommunikationstyp') ?? "kundenrueckfrage")],
    },
    ...(offene_punkteFilled ? [{
      key: 'offene_punkte', entity: 'offene_punkte', form: offene_punkte,
      updates: () => offene_punkteTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => offene_punkteTargetId
        ? { key: 'target:offene_punkte', label: entityLabel('offene_punkte'), value: picks.offene_punkte.labelOf(offene_punkteTargetId) ?? offene_punkteTargetId, step: steps.offene_punkte }
        : undefined,
      values: (): FormValues => ({
        status: policyFixedValue('offene_punkte', 'status') ?? "wartet_auf_kunde",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('offene_punkte', 'status', policyFixedValue('offene_punkte', 'status') ?? "wartet_auf_kunde")],
    } as PlanStep] : []),
    ...(kundenanfragenFilled ? [{
      key: 'kundenanfragen', entity: 'kundenanfragen', form: kundenanfragen,
      updates: () => kundenanfragenTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => kundenanfragenTargetId
        ? { key: 'target:kundenanfragen', label: entityLabel('kundenanfragen'), value: picks.kundenanfragen.labelOf(kundenanfragenTargetId) ?? kundenanfragenTargetId, step: steps.kundenanfragen }
        : undefined,
      values: (): FormValues => ({
        status: policyFixedValue('kundenanfragen', 'status') ?? "rueckfragen_offen",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('kundenanfragen', 'status', policyFixedValue('kundenanfragen', 'status') ?? "rueckfragen_offen")],
    } as PlanStep] : []),
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'rueckfrage-vorbereiten' });

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
    offene_punkte: {
      selectedId: offene_punkteTargetId,
      onSelect: (id: string) => {
        setOffenePunkteTargetId(id);
        const rec = picks.offene_punkte.recordOf(id);
        if (rec) offene_punkte.reset({ });
      },
      get record(): JourneyRecord | undefined { return offene_punkteTargetId ? picks.offene_punkte.recordOf(offene_punkteTargetId) : undefined; },
    },
    kundenanfragen: {
      selectedId: kundenanfragenTargetId,
      onSelect: (id: string) => {
        setKundenanfragenTargetId(id);
        const rec = picks.kundenanfragen.recordOf(id);
        if (rec) kundenanfragen.reset({ });
      },
      get record(): JourneyRecord | undefined { return kundenanfragenTargetId ? picks.kundenanfragen.recordOf(kundenanfragenTargetId) : undefined; },
    },
  };
  // Opened for one record — `#/intents/rueckfrage-vorbereiten?record=<id>`, the dashboard's
  // flowActionFor(): that record is the one to change. Loaded, taken into the
  // pick and selected — when this flow may change it at all (the pick's rule).
  const [linkedId] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('record'));
  useEffect(() => {
    if (!linkedId) return;
    let on = true;
    void servicePort.get('offene_punkte', linkedId).then(rec => {
      if (!on || !rec || !((r: JourneyRecord) => ["neu", "zugewiesen", "in_bearbeitung"].includes(fieldLookup(r, "status")?.key ?? ''))(rec)) return;
      picks.offene_punkte.adopt(rec);
      targets.offene_punkte.onSelect(rec.id);
    }).catch(() => undefined);
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per link
  }, [linkedId]);
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: RueckfrageVorbereitenFieldKey) => {
    if (field in targets) {
      const t = targets[field as keyof typeof targets];
      return { selectedId: t.selectedId, onSelect: t.onSelect };
    }
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return {
      selectedId: (typeof owner.get(field) === 'string' ? (owner.get(field) as string) : null) || null,
      // `field as never` collapsed the conditional SetArgs<E, never> to never and
      // no argument was assignable any more (tsc, live 23.09.2026); widen `set`
      // itself instead — the label stays a required third argument.
      onSelect: (id: string) => (owner.set as (k: string, v: unknown, l?: string) => void)(field, id, search?.labelOf(id)),
    };
  };
  /** Props for a multi-record pick step: {...flow.picks.x.select} {...flow.pickMany('x')} */
  const pickMany = (field: RueckfrageVorbereitenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setOffenePunkteTargetId(null); setKundenanfragenTargetId(null); };

  return {
    slug: 'rueckfrage-vorbereiten' as const,
    draftKey: 'rueckfrage-vorbereiten' as const,
    entity: 'rueckfragen_und_kommunikation' as const,
    form: rueckfragen_und_kommunikation,
    forms, formList, picks, submit, steps, targets,    reviewStep: RUECKFRAGEVORBEREITEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type RueckfrageVorbereitenFlow = ReturnType<typeof useRueckfrageVorbereitenFlow>;
