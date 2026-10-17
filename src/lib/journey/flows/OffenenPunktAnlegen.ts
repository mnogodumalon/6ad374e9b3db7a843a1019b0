/**
 * useOffenenPunktAnlegenFlow — the plumbing of the flow « Offenen Punkt mit Aufgabe anlegen », generated from the plan.
 *
 * Writes `offene_punkte`: asks `anfrage`, `kurztitel`, `beschreibung`, `punktetyp`, `betroffene_anforderungen`, `betroffene_quellen`, `prioritaet`, `auswirkung`, `zustaendige_rolle`, `verantwortlicher_vorname`, `verantwortlicher_nachname`, `faellig_am`, `erledigungskriterium`; sets `status` itself.
Writes `aufgaben` (only when the person fills it): asks `anfrage`, `titel`, `beschreibung`, `aufgabentyp`, `verantwortlicher_vorname`, `verantwortlicher_nachname`, `prioritaet`, `faellig_am`; sets `status` itself; links `offener_punkt` ← the created `offene_punkte`.
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
 *   const flow = useOffenenPunktAnlegenFlow({
 *     steps: { anfrage: 4, betroffene_anforderungen: 2, betroffene_quellen: 3, kurztitel: 5, beschreibung: 5, punktetyp: 5, prioritaet: 5, auswirkung: 5, zustaendige_rolle: 5, verantwortlicher_vorname: 5, verantwortlicher_nachname: 5, faellig_am: 5, erledigungskriterium: 5, titel: 5, aufgabentyp: 5 },
 *     items: { anfrage: r => ({ id: r.id, title: fieldText(r, 'anfragenummer') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.anfrage.select} {...flow.pick('anfrage')} />
 *     <EntitySelectStep {...flow.picks.betroffene_anforderungen.select} {...flow.pickMany('betroffene_anforderungen')} />
 *     <EntitySelectStep {...flow.picks.betroffene_quellen.select} {...flow.pickMany('betroffene_quellen')} />
 *     <EntitySelectStep {...flow.picks.aufgaben_anfrage.select} {...flow.pick('anfrage')} />
 *     <Bound form={flow.forms.offene_punkte} name="kurztitel" />
 *     <Bound form={flow.forms.offene_punkte} name="beschreibung" />
 *     <Bound form={flow.forms.offene_punkte} name="punktetyp" />
 *     <Bound form={flow.forms.offene_punkte} name="prioritaet" />
 *     <Bound form={flow.forms.offene_punkte} name="auswirkung" />
 *     <Bound form={flow.forms.offene_punkte} name="zustaendige_rolle" />
 *     <Bound form={flow.forms.offene_punkte} name="verantwortlicher_vorname" />
 *     <Bound form={flow.forms.offene_punkte} name="verantwortlicher_nachname" />
 *     <Bound form={flow.forms.offene_punkte} name="faellig_am" />
 *     <Bound form={flow.forms.offene_punkte} name="erledigungskriterium" />
 *     <Bound form={flow.forms.aufgaben} name="titel" />
 *     <Bound form={flow.forms.aufgaben} name="beschreibung" />
 *     <Bound form={flow.forms.aufgaben} name="aufgabentyp" />
 *     <Bound form={flow.forms.aufgaben} name="verantwortlicher_vorname" />
 *     <Bound form={flow.forms.aufgaben} name="verantwortlicher_nachname" />
 *     <Bound form={flow.forms.aufgaben} name="prioritaet" />
 *     <Bound form={flow.forms.aufgaben} name="faellig_am" />
 *     <StepNav onNext={() => flow.validateStep(n)} />
 *     {!flow.submit.done && <SummaryStep forms={flow.formList} submit={flow.submit} />}
 *     {flow.submit.result && <SuccessStep result={flow.submit.result} forms={flow.formList} submit={flow.submit} />}
 *   </IntentWizardShell>
 */
import {
  useStepForm, useJourneySubmit, useRecordSearch,
  fieldText, fieldLookup, fieldLookups, fieldNumber, fieldDate, fieldRef,
  todayIso, nowIso, isEmptyValue, policyFixedValue, withPickPolicy, usePolicyVersion,
  type StepForm, type JourneyRecord, type RefContext, type SelectItemLike, type FormValues, type PlanStep, type SummaryItem,} from '@/lib/journey';
import { servicePort } from '@/services/journeyPort';
import { pickHint, whereSentence, type PickWhere } from '@/lib/journey/policy';
import { labelOf, optionsOf, type EntityKey } from '@/lib/journey/rules';
export type OffenenPunktAnlegenFieldKey = 'anfrage' | 'aufgabentyp' | 'auswirkung' | 'beschreibung' | 'betroffene_anforderungen' | 'betroffene_quellen' | 'erledigungskriterium' | 'faellig_am' | 'kurztitel' | 'prioritaet' | 'punktetyp' | 'titel' | 'verantwortlicher_nachname' | 'verantwortlicher_vorname' | 'zustaendige_rolle';

export interface OffenenPunktAnlegenForms {
  offene_punkte: StepForm<'offene_punkte'>;
  aufgaben: StepForm<'aufgaben'>;
}

// Alias so the option generics stay readable.
type Key = OffenenPunktAnlegenFieldKey;

export interface OffenenPunktAnlegenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    anfrage?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    betroffene_anforderungen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    betroffene_quellen?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
    aufgaben_anfrage?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"anfrage": 4, "aufgabentyp": 5, "auswirkung": 5, "beschreibung": 5, "betroffene_anforderungen": 2, "betroffene_quellen": 3, "erledigungskriterium": 5, "faellig_am": 5, "kurztitel": 5, "prioritaet": 5, "punktetyp": 5, "titel": 5, "verantwortlicher_nachname": 5, "verantwortlicher_vorname": 5, "zustaendige_rolle": 5};
export const OFFENENPUNKTANLEGEN_REVIEW_STEP = 6;

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

export function useOffenenPunktAnlegenFlow(options: OffenenPunktAnlegenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const offene_punkte = useStepForm('offene_punkte', {
    fields: ["anfrage", "kurztitel", "beschreibung", "punktetyp", "betroffene_anforderungen", "betroffene_quellen", "prioritaet", "auswirkung", "zustaendige_rolle", "verantwortlicher_vorname", "verantwortlicher_nachname", "faellig_am", "erledigungskriterium"],
    steps: only(steps, ["anfrage", "kurztitel", "beschreibung", "punktetyp", "betroffene_anforderungen", "betroffene_quellen", "prioritaet", "auswirkung", "zustaendige_rolle", "verantwortlicher_vorname", "verantwortlicher_nachname", "faellig_am", "erledigungskriterium"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["anfrage", "kurztitel", "beschreibung", "punktetyp", "betroffene_anforderungen", "betroffene_quellen", "prioritaet", "auswirkung", "zustaendige_rolle", "verantwortlicher_vorname", "verantwortlicher_nachname", "faellig_am", "erledigungskriterium"]),
    messages: only(options.messages as Record<string, string> | undefined, ["anfrage", "kurztitel", "beschreibung", "punktetyp", "betroffene_anforderungen", "betroffene_quellen", "prioritaet", "auswirkung", "zustaendige_rolle", "verantwortlicher_vorname", "verantwortlicher_nachname", "faellig_am", "erledigungskriterium"]),
  });
  const aufgaben = useStepForm('aufgaben', {
    fields: ["anfrage", "titel", "beschreibung", "aufgabentyp", "verantwortlicher_vorname", "verantwortlicher_nachname", "prioritaet", "faellig_am"],
    steps: only(steps, ["anfrage", "titel", "beschreibung", "aufgabentyp", "verantwortlicher_vorname", "verantwortlicher_nachname", "prioritaet", "faellig_am"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["anfrage", "titel", "beschreibung", "aufgabentyp", "verantwortlicher_vorname", "verantwortlicher_nachname", "prioritaet", "faellig_am"]),
    messages: only(options.messages as Record<string, string> | undefined, ["anfrage", "titel", "beschreibung", "aufgabentyp", "verantwortlicher_vorname", "verantwortlicher_nachname", "prioritaet", "faellig_am"]),
  });
  const forms: OffenenPunktAnlegenForms = { offene_punkte, aufgaben };
  const formList: StepForm[] = [offene_punkte, aufgaben];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    anfrage: useRecordSearch(servicePort, 'kundenanfragen', withPickPolicy('anfrage', {
      searchFields: ["anfragenummer"] as never,
      toItem: options.items?.anfrage as never,
    })),
    betroffene_anforderungen: useRecordSearch(servicePort, 'technische_anforderungen', withPickPolicy('betroffene_anforderungen', {
      searchFields: ["bezeichnung"] as never,
      toItem: options.items?.betroffene_anforderungen as never,
    })),
    betroffene_quellen: useRecordSearch(servicePort, 'informationsquellen', withPickPolicy('betroffene_quellen', {
      searchFields: ["titel"] as never,
      toItem: options.items?.betroffene_quellen as never,
    })),
    aufgaben_anfrage: useRecordSearch(servicePort, 'kundenanfragen', withPickPolicy('aufgaben_anfrage', {
      searchFields: ["anfragenummer"] as never,
      toItem: options.items?.aufgaben_anfrage as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:offenen-punkt-anlegen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:offenen-punkt-anlegen:write:${entity}.${field}`,
  });
  const picks = {
    anfrage: { ...searches.anfrage, select: { ...searches.anfrage.select, create: false as boolean, hint: hintFor('anfrage', 'kundenanfragen', null as PickWhere | null) } },
    betroffene_anforderungen: { ...searches.betroffene_anforderungen, select: { ...searches.betroffene_anforderungen.select, create: false as boolean, hint: hintFor('betroffene_anforderungen', 'technische_anforderungen', null as PickWhere | null) } },
    betroffene_quellen: { ...searches.betroffene_quellen, select: { ...searches.betroffene_quellen.select, create: false as boolean, hint: hintFor('betroffene_quellen', 'informationsquellen', null as PickWhere | null) } },
    aufgaben_anfrage: { ...searches.aufgaben_anfrage, select: { ...searches.aufgaben_anfrage.select, create: false as boolean, hint: hintFor('aufgaben_anfrage', 'kundenanfragen', null as PickWhere | null) } },
  };

  const aufgabenFilled = hasValues(aufgaben);
  const plan: PlanStep[] = [
    {
      key: 'offene_punkte', entity: 'offene_punkte', form: offene_punkte, primary: true,
      values: (): FormValues => ({
        status: policyFixedValue('offene_punkte', 'status') ?? "zugewiesen",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('offene_punkte', 'status', policyFixedValue('offene_punkte', 'status') ?? "zugewiesen")],
    },
    ...(aufgabenFilled ? [{
      key: 'aufgaben', entity: 'aufgaben', form: aufgaben,      needs: ['offene_punkte'],
      link: { offener_punkt: 'offene_punkte' },

      values: (): FormValues => ({
        status: policyFixedValue('aufgaben', 'status') ?? "offen",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('aufgaben', 'status', policyFixedValue('aufgaben', 'status') ?? "offen")],
    } as PlanStep] : []),
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'offenen-punkt-anlegen' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: OffenenPunktAnlegenFieldKey) => {
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
  const pickMany = (field: OffenenPunktAnlegenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'offenen-punkt-anlegen' as const,
    draftKey: 'offenen-punkt-anlegen' as const,
    entity: 'offene_punkte' as const,
    form: offene_punkte,
    forms, formList, picks, submit, steps,    reviewStep: OFFENENPUNKTANLEGEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type OffenenPunktAnlegenFlow = ReturnType<typeof useOffenenPunktAnlegenFlow>;
