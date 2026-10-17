/**
 * useKlaerungAbschliessenFlow — the plumbing of the flow « Technische Klärung abschließen », generated from the plan.
 *
 * Writes `technischer_abschluss`: asks `anfrage`, `geprueft_von`, `anforderungen_geprueft`, `kritische_punkte_geklaert`, `entscheidungen_vorhanden`, `freigaben_vorhanden`, `verbleibende_abweichungen`, `verbleibende_risiken`, `offene_restpunkte`, `uebergabeempfaenger`, `zusammenfassung`; sets `pruefdatum`, `uebergabestatus`, `freigabestatus` itself.
Changes `kundenanfragen`: the record to change is picked (`flow.pick('kundenanfragen')`), the form is prefilled with its values; ; sets `status`, `geklaert_am`, `vollstaendigkeit` itself.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 4)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useKlaerungAbschliessenFlow({
 *     steps: { kundenanfragen: 1, anfrage: 2, geprueft_von: 3, anforderungen_geprueft: 3, kritische_punkte_geklaert: 3, entscheidungen_vorhanden: 3, freigaben_vorhanden: 3, verbleibende_abweichungen: 3, verbleibende_risiken: 3, offene_restpunkte: 3, uebergabeempfaenger: 3, zusammenfassung: 3 },
 *     items: { anfrage: r => ({ id: r.id, title: fieldText(r, 'anfragenummer') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.anfrage.select} {...flow.pick('anfrage')} />
 *     // the record this flow changes: <EntitySelectStep {...flow.picks.kundenanfragen.select} {...flow.pick('kundenanfragen')} />
 *     <Bound form={flow.forms.technischer_abschluss} name="geprueft_von" />
 *     <Bound form={flow.forms.technischer_abschluss} name="anforderungen_geprueft" />
 *     <Bound form={flow.forms.technischer_abschluss} name="kritische_punkte_geklaert" />
 *     <Bound form={flow.forms.technischer_abschluss} name="entscheidungen_vorhanden" />
 *     <Bound form={flow.forms.technischer_abschluss} name="freigaben_vorhanden" />
 *     <Bound form={flow.forms.technischer_abschluss} name="verbleibende_abweichungen" />
 *     <Bound form={flow.forms.technischer_abschluss} name="verbleibende_risiken" />
 *     <Bound form={flow.forms.technischer_abschluss} name="offene_restpunkte" />
 *     <Bound form={flow.forms.technischer_abschluss} name="uebergabeempfaenger" />
 *     <Bound form={flow.forms.technischer_abschluss} name="zusammenfassung" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import { useState } from 'react';
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
import { entityLabel } from '@/lib/journey/rules';
export type KlaerungAbschliessenFieldKey = 'anforderungen_geprueft' | 'anfrage' | 'entscheidungen_vorhanden' | 'freigaben_vorhanden' | 'geprueft_von' | 'kritische_punkte_geklaert' | 'kundenanfragen' | 'offene_restpunkte' | 'uebergabeempfaenger' | 'verbleibende_abweichungen' | 'verbleibende_risiken' | 'zusammenfassung';

export interface KlaerungAbschliessenForms {
  technischer_abschluss: StepForm<'technischer_abschluss'>;
  kundenanfragen: StepForm<'kundenanfragen'>;
}

// Alias so the option generics stay readable.
type Key = KlaerungAbschliessenFieldKey;

export interface KlaerungAbschliessenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    anfrage?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    kundenanfragen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"anforderungen_geprueft": 3, "anfrage": 2, "entscheidungen_vorhanden": 3, "freigaben_vorhanden": 3, "geprueft_von": 3, "kritische_punkte_geklaert": 3, "kundenanfragen": 1, "offene_restpunkte": 3, "uebergabeempfaenger": 3, "verbleibende_abweichungen": 3, "verbleibende_risiken": 3, "zusammenfassung": 3};
export const KLAERUNGABSCHLIESSEN_REVIEW_STEP = 4;

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

export function useKlaerungAbschliessenFlow(options: KlaerungAbschliessenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const [kundenanfragenTargetId, setKundenanfragenTargetId] = useState<string | null>(null);
  const technischer_abschluss = useStepForm('technischer_abschluss', {
    fields: ["anfrage", "geprueft_von", "anforderungen_geprueft", "kritische_punkte_geklaert", "entscheidungen_vorhanden", "freigaben_vorhanden", "verbleibende_abweichungen", "verbleibende_risiken", "offene_restpunkte", "uebergabeempfaenger", "zusammenfassung"],
    steps: only(steps, ["anfrage", "geprueft_von", "anforderungen_geprueft", "kritische_punkte_geklaert", "entscheidungen_vorhanden", "freigaben_vorhanden", "verbleibende_abweichungen", "verbleibende_risiken", "offene_restpunkte", "uebergabeempfaenger", "zusammenfassung"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["anfrage", "geprueft_von", "anforderungen_geprueft", "kritische_punkte_geklaert", "entscheidungen_vorhanden", "freigaben_vorhanden", "verbleibende_abweichungen", "verbleibende_risiken", "offene_restpunkte", "uebergabeempfaenger", "zusammenfassung"]),
    messages: only(options.messages as Record<string, string> | undefined, ["anfrage", "geprueft_von", "anforderungen_geprueft", "kritische_punkte_geklaert", "entscheidungen_vorhanden", "freigaben_vorhanden", "verbleibende_abweichungen", "verbleibende_risiken", "offene_restpunkte", "uebergabeempfaenger", "zusammenfassung"]),
  });
  const kundenanfragen = useStepForm('kundenanfragen', {
    fields: [],
    steps: only(steps, []) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, []),
    messages: only(options.messages as Record<string, string> | undefined, []),
  });
  const forms: KlaerungAbschliessenForms = { technischer_abschluss, kundenanfragen };
  const formList: StepForm[] = [technischer_abschluss, kundenanfragen];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    anfrage: useRecordSearch(servicePort, 'kundenanfragen', withPickPolicy('anfrage', {
      searchFields: ["anfragenummer"] as never,
      toItem: options.items?.anfrage as never,
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
    `#/verwaltung/anwendung?line=intent:klaerung-abschliessen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:klaerung-abschliessen:write:${entity}.${field}`,
  });
  const picks = {
    anfrage: { ...searches.anfrage, select: { ...searches.anfrage.select, create: false as boolean, hint: hintFor('anfrage', 'kundenanfragen', null as PickWhere | null) } },
    kundenanfragen: { ...searches.kundenanfragen, select: { ...searches.kundenanfragen.select, create: false as boolean, hint: hintFor('kundenanfragen', 'kundenanfragen', null as PickWhere | null) } },
  };

  const plan: PlanStep[] = [
    {
      key: 'technischer_abschluss', entity: 'technischer_abschluss', form: technischer_abschluss, primary: true,
      values: (): FormValues => ({
        pruefdatum: policyFixedValue('technischer_abschluss', 'pruefdatum') ?? nowIso(),
        uebergabestatus: policyFixedValue('technischer_abschluss', 'uebergabestatus') ?? "bereit",
        freigabestatus: policyFixedValue('technischer_abschluss', 'freigabestatus') ?? "nicht_freigegeben",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('technischer_abschluss', 'uebergabestatus', policyFixedValue('technischer_abschluss', 'uebergabestatus') ?? "bereit"), setting('technischer_abschluss', 'freigabestatus', policyFixedValue('technischer_abschluss', 'freigabestatus') ?? "nicht_freigegeben")],
    },
    {
      key: 'kundenanfragen', entity: 'kundenanfragen', form: kundenanfragen,
      updates: () => kundenanfragenTargetId ?? undefined,
      // the review names the record this step changes; "Ändern" leads back to its pick
      target: () => kundenanfragenTargetId
        ? { key: 'target:kundenanfragen', label: entityLabel('kundenanfragen'), value: picks.kundenanfragen.labelOf(kundenanfragenTargetId) ?? kundenanfragenTargetId, step: steps.kundenanfragen }
        : undefined,
      values: (): FormValues => ({
        status: policyFixedValue('kundenanfragen', 'status') ?? "technisch_geklaert",
        geklaert_am: policyFixedValue('kundenanfragen', 'geklaert_am') ?? nowIso(),
        vollstaendigkeit: policyFixedValue('kundenanfragen', 'vollstaendigkeit') ?? "vollstaendig_geprueft",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('kundenanfragen', 'status', policyFixedValue('kundenanfragen', 'status') ?? "technisch_geklaert"), setting('kundenanfragen', 'vollstaendigkeit', policyFixedValue('kundenanfragen', 'vollstaendigkeit') ?? "vollstaendig_geprueft")],
    },
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'klaerung-abschliessen' });

  /** The record(s) this flow CHANGES: picked through {...flow.picks.<entity>.select} {...flow.pick('<entity>')};
   *  picking prefills the form with the record's current values, and the plan step updates that record. */
  const targets = {
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
  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: KlaerungAbschliessenFieldKey) => {
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
  const pickMany = (field: KlaerungAbschliessenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)))    && Object.entries(targets).every(([k, t]) => steps[k] !== n || !!t.selectedId);
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); setKundenanfragenTargetId(null); };

  return {
    slug: 'klaerung-abschliessen' as const,
    draftKey: 'klaerung-abschliessen' as const,
    entity: 'technischer_abschluss' as const,
    form: technischer_abschluss,
    forms, formList, picks, submit, steps, targets,    reviewStep: KLAERUNGABSCHLIESSEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type KlaerungAbschliessenFlow = ReturnType<typeof useKlaerungAbschliessenFlow>;
