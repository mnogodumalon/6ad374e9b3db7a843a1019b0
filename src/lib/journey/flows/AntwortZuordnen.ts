/**
 * useAntwortZuordnenFlow — the plumbing of the flow « Antwort zuordnen », generated from the plan.
 *
 * Writes `rueckfragen_und_kommunikation`: asks `kanal`, `inhalt`, `quelle`, `anfrage`, `betreff`, `absender`, `antwortstatus`, `folgeaufgabe_noetig`, `beantwortet_nachricht`, `zugehoerige_offene_punkte`; sets `versandstatus`, `kommunikationstyp`, `antwort_erhalten_am` itself.
Changes `offene_punkte`: the record to change is picked (`flow.pick('offene_punkte')`), the form is prefilled with its values; ; sets `status`, `erneute_pruefung` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 7)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useAntwortZuordnenFlow({
 *     steps: { offene_punkte: 1, quelle: 2, anfrage: 3, beantwortet_nachricht: 4, zugehoerige_offene_punkte: 5, kanal: 6, inhalt: 6, betreff: 6, absender: 6, antwortstatus: 6, folgeaufgabe_noetig: 6 },
 *     items: { quelle: r => ({ id: r.id, title: fieldText(r, 'titel') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.quelle.select} {...flow.pick('quelle')} />
 *     <EntitySelectStep {...flow.picks.anfrage.select} {...flow.pick('anfrage')} />
 *     <EntitySelectStep {...flow.picks.beantwortet_nachricht.select} {...flow.pick('beantwortet_nachricht')} />
 *     <EntitySelectStep {...flow.picks.zugehoerige_offene_punkte.select} {...flow.pickMany('zugehoerige_offene_punkte')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.offene_punkte.select} {...flow.pick('offene_punkte')} />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="kanal" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="inhalt" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="betreff" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="absender" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="antwortstatus" />
 *     <Bound form={flow.forms.rueckfragen_und_kommunikation} name="folgeaufgabe_noetig" />
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
export type AntwortZuordnenFieldKey = 'absender' | 'anfrage' | 'antwortstatus' | 'beantwortet_nachricht' | 'betreff' | 'folgeaufgabe_noetig' | 'inhalt' | 'kanal' | 'offene_punkte' | 'quelle' | 'zugehoerige_offene_punkte';

export interface AntwortZuordnenForms {
  rueckfragen_und_kommunikation: StepForm<'rueckfragen_und_kommunikation'>;
  offene_punkte: StepForm<'offene_punkte'>;
}

// Alias so the option generics stay readable.
type Key = AntwortZuordnenFieldKey;

export interface AntwortZuordnenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    quelle?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    anfrage?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    beantwortet_nachricht?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    zugehoerige_offene_punkte?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    offene_punkte?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"absender": 6, "anfrage": 3, "antwortstatus": 6, "beantwortet_nachricht": 4, "betreff": 6, "folgeaufgabe_noetig": 6, "inhalt": 6, "kanal": 6, "offene_punkte": 1, "quelle": 2, "zugehoerige_offene_punkte": 5};
export const ANTWORTZUORDNEN_REVIEW_STEP = 7;

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

export function useAntwortZuordnenFlow(options: AntwortZuordnenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [offene_punkteTargetId, setOffenePunkteTargetId] = useState<string | null>(null);
  const rueckfragen_und_kommunikation = useStepForm('rueckfragen_und_kommunikation', {
    fields: ["kanal", "inhalt", "quelle", "anfrage", "betreff", "absender", "antwortstatus", "folgeaufgabe_noetig", "beantwortet_nachricht", "zugehoerige_offene_punkte"],
    steps: only(steps, ["kanal", "inhalt", "quelle", "anfrage", "betreff", "absender", "antwortstatus", "folgeaufgabe_noetig", "beantwortet_nachricht", "zugehoerige_offene_punkte"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["kanal", "inhalt", "quelle", "anfrage", "betreff", "absender", "antwortstatus", "folgeaufgabe_noetig", "beantwortet_nachricht", "zugehoerige_offene_punkte"]),
    messages: only(options.messages as Record<string, string> | undefined, ["kanal", "inhalt", "quelle", "anfrage", "betreff", "absender", "antwortstatus", "folgeaufgabe_noetig", "beantwortet_nachricht", "zugehoerige_offene_punkte"]),
  });
  const offene_punkte = useStepForm('offene_punkte', {
    fields: [],
    steps: only(steps, []) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, []),
    messages: only(options.messages as Record<string, string> | undefined, []),
  });
  const forms: AntwortZuordnenForms = { rueckfragen_und_kommunikation, offene_punkte };
  const formList: StepForm[] = [rueckfragen_und_kommunikation, offene_punkte];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    quelle: useRecordSearch(servicePort, 'informationsquellen', withPickPolicy('quelle', {
      searchFields: ["titel"] as never,
      toItem: options.items?.quelle as never,
    })),
    anfrage: useRecordSearch(servicePort, 'kundenanfragen', withPickPolicy('anfrage', {
      searchFields: ["anfragenummer"] as never,
      toItem: options.items?.anfrage as never,
    })),
    beantwortet_nachricht: useRecordSearch(servicePort, 'rueckfragen_und_kommunikation', withPickPolicy('beantwortet_nachricht', {
      searchFields: ["betreff", "empfaenger"] as never,
      filter: "r.v_versandstatus == 'versendet' and r.v_antwortstatus == 'offen'",
      where: (r: JourneyRecord) => (fieldLookup(r, "versandstatus")?.key ?? null) === "versendet" && (fieldLookup(r, "antwortstatus")?.key ?? null) === "offen",
      toItem: options.items?.beantwortet_nachricht as never,
    })),
    zugehoerige_offene_punkte: useRecordSearch(servicePort, 'offene_punkte', withPickPolicy('zugehoerige_offene_punkte', {
      searchFields: ["kurztitel"] as never,
      toItem: options.items?.zugehoerige_offene_punkte as never,
    })),
    offene_punkte: useRecordSearch(servicePort, 'offene_punkte', withPickPolicy('offene_punkte', {
      searchFields: ["kurztitel"] as never,
      toItem: options.items?.offene_punkte as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:antwort-zuordnen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:antwort-zuordnen:write:${entity}.${field}`,
  });
  const picks = {
    quelle: { ...searches.quelle, select: { ...searches.quelle.select, create: false as boolean, hint: hintFor('quelle', 'informationsquellen', null as PickWhere | null) } },
    anfrage: { ...searches.anfrage, select: { ...searches.anfrage.select, create: false as boolean, hint: hintFor('anfrage', 'kundenanfragen', null as PickWhere | null) } },
    beantwortet_nachricht: { ...searches.beantwortet_nachricht, select: { ...searches.beantwortet_nachricht.select, create: false as boolean, hint: hintFor('beantwortet_nachricht', 'rueckfragen_und_kommunikation', {"conditions": [{"field": "versandstatus", "op": "eq", "value": "versendet"}, {"field": "antwortstatus", "op": "eq", "value": "offen"}], "mode": "all"} as PickWhere | null) } },
    zugehoerige_offene_punkte: { ...searches.zugehoerige_offene_punkte, select: { ...searches.zugehoerige_offene_punkte.select, create: false as boolean, hint: hintFor('zugehoerige_offene_punkte', 'offene_punkte', null as PickWhere | null) } },
    offene_punkte: { ...searches.offene_punkte, select: { ...searches.offene_punkte.select, create: false as boolean, hint: hintFor('offene_punkte', 'offene_punkte', null as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'rueckfragen_und_kommunikation', entity: 'rueckfragen_und_kommunikation', form: rueckfragen_und_kommunikation, primary: true,
      values: (): FormValues => ({
        versandstatus: policyFixedValue('rueckfragen_und_kommunikation', 'versandstatus') ?? "nicht_erforderlich",
        kommunikationstyp: policyFixedValue('rueckfragen_und_kommunikation', 'kommunikationstyp') ?? "antwort",
        antwort_erhalten_am: policyFixedValue('rueckfragen_und_kommunikation', 'antwort_erhalten_am') ?? nowIso(),
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('rueckfragen_und_kommunikation', 'versandstatus', policyFixedValue('rueckfragen_und_kommunikation', 'versandstatus') ?? "nicht_erforderlich"), setting('rueckfragen_und_kommunikation', 'kommunikationstyp', policyFixedValue('rueckfragen_und_kommunikation', 'kommunikationstyp') ?? "antwort")],
    },
    {
      key: 'offene_punkte', entity: 'offene_punkte', form: offene_punkte,
      updates: () => offene_punkteTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => offene_punkteTargetId
        ? { key: 'target:offene_punkte', label: entityLabel('offene_punkte'), value: picks.offene_punkte.labelOf(offene_punkteTargetId) ?? offene_punkteTargetId, step: steps.offene_punkte }
        : undefined,
      values: (): FormValues => ({
        status: policyFixedValue('offene_punkte', 'status') ?? "in_bearbeitung",
        erneute_pruefung: policyFixedValue('offene_punkte', 'erneute_pruefung') ?? true,
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('offene_punkte', 'status', policyFixedValue('offene_punkte', 'status') ?? "in_bearbeitung"), setting('offene_punkte', 'erneute_pruefung', policyFixedValue('offene_punkte', 'erneute_pruefung') ?? true)],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'antwort-zuordnen' });

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
  };
  // Opened for one record — `#/intents/antwort-zuordnen?record=<id>`, the dashboard's
  // flowActionFor(): that record is the one to change. Loaded, taken into the
  // pick and selected — when this flow may change it at all (the pick's rule).
  const [linkedId] = useState(() => new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('record'));
  useEffect(() => {
    if (!linkedId) return;
    let on = true;
    void servicePort.get('offene_punkte', linkedId).then(rec => {
      if (!on || !rec) return;
      picks.offene_punkte.adopt(rec);
      targets.offene_punkte.onSelect(rec.id);
    }).catch(() => undefined);
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once per link
  }, [linkedId]);
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: AntwortZuordnenFieldKey) => {
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
  const pickMany = (field: AntwortZuordnenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setOffenePunkteTargetId(null); };

  return {
    slug: 'antwort-zuordnen' as const,
    draftKey: 'antwort-zuordnen' as const,
    entity: 'rueckfragen_und_kommunikation' as const,
    form: rueckfragen_und_kommunikation,
    forms, formList, picks, submit, steps, targets,    reviewStep: ANTWORTZUORDNEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type AntwortZuordnenFlow = ReturnType<typeof useAntwortZuordnenFlow>;
