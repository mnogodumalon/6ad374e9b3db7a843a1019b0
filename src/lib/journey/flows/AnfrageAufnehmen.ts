/**
 * useAnfrageAufnehmenFlow — the plumbing of the flow « Anfrage aufnehmen », generated from the plan.
 *
 * Writes `kundenanfragen`: asks `kunde`, `prioritaet`, `eingangskanal`, `kundenreferenz`, `produktfamilie`, `produktvariante`, `gewuenschte_menge`, `anfragebeschreibung`, `zieltermin_klaerung`, `verantwortlicher_vorname`, `gewuenschter_liefertermin`, `verantwortlicher_nachname`, `urspruengliche_kundenanforderungen`; sets `status`, `klaeraufwand`, `eingangsdatum`, `vollstaendigkeit` itself.
Writes `informationsquellen` (only when the person fills it): asks `datei`, `titel`, `urheber`, `quellentyp`, `quellendatum`, `referenz_url`; sets `quellenstatus`, `eingangszeitpunkt`, `extraktionsstatus` itself; links `anfrage` ← the created `kundenanfragen`.
 * The hook OWNS: the form(s) with exactly these fields and the plan's required
 * ingredients, one record search per picked field (columns and filter from
 * the plan), and the submit plan with its fixed and derived values. A page
 * that only calls `flow.submit.run()` cannot write a field the plan does not
 * know — there is no way to spell it.
 *
 * YOU decide what a person notices, through the options:
 *   steps     which wizard step asks which field (default: one step per pick,
 *             then one for the typed fields, then "Prüfen" = step 3)
 *   items     how a search hit is displayed per pick (title, subtitle, status …)
 *   initial   prefills for typed fields
 *   messages  the sentence for an empty required field, per field
 *
 *   const flow = useAnfrageAufnehmenFlow({
 *     steps: { kunde: 1, prioritaet: 2, eingangskanal: 2, kundenreferenz: 2, produktfamilie: 2, produktvariante: 2, gewuenschte_menge: 2, anfragebeschreibung: 2, zieltermin_klaerung: 2, verantwortlicher_vorname: 2, gewuenschter_liefertermin: 2, verantwortlicher_nachname: 2, urspruengliche_kundenanforderungen: 2, datei: 2, titel: 2, urheber: 2, quellentyp: 2, quellendatum: 2, referenz_url: 2 },
 *     items: { kunde: r => ({ id: r.id, title: fieldText(r, 'firmenname') }) },
 *   });
 *   <IntentWizardShell forms={flow.forms} draftKey={flow.draftKey} …>
 *     <EntitySelectStep {...flow.picks.kunde.select} {...flow.pick('kunde')} />
 *     <Bound form={flow.forms.kundenanfragen} name="prioritaet" />
 *     <Bound form={flow.forms.kundenanfragen} name="eingangskanal" />
 *     <Bound form={flow.forms.kundenanfragen} name="kundenreferenz" />
 *     <Bound form={flow.forms.kundenanfragen} name="produktfamilie" />
 *     <Bound form={flow.forms.kundenanfragen} name="produktvariante" />
 *     <Bound form={flow.forms.kundenanfragen} name="gewuenschte_menge" />
 *     <Bound form={flow.forms.kundenanfragen} name="anfragebeschreibung" />
 *     <Bound form={flow.forms.kundenanfragen} name="zieltermin_klaerung" />
 *     <Bound form={flow.forms.kundenanfragen} name="verantwortlicher_vorname" />
 *     <Bound form={flow.forms.kundenanfragen} name="gewuenschter_liefertermin" />
 *     <Bound form={flow.forms.kundenanfragen} name="verantwortlicher_nachname" />
 *     <Bound form={flow.forms.kundenanfragen} name="urspruengliche_kundenanforderungen" />
 *     <Bound form={flow.forms.informationsquellen} name="datei" />
 *     <Bound form={flow.forms.informationsquellen} name="titel" />
 *     <Bound form={flow.forms.informationsquellen} name="urheber" />
 *     <Bound form={flow.forms.informationsquellen} name="quellentyp" />
 *     <Bound form={flow.forms.informationsquellen} name="quellendatum" />
 *     <Bound form={flow.forms.informationsquellen} name="referenz_url" />
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
export type AnfrageAufnehmenFieldKey = 'anfragebeschreibung' | 'datei' | 'eingangskanal' | 'gewuenschte_menge' | 'gewuenschter_liefertermin' | 'kunde' | 'kundenreferenz' | 'prioritaet' | 'produktfamilie' | 'produktvariante' | 'quellendatum' | 'quellentyp' | 'referenz_url' | 'titel' | 'urheber' | 'urspruengliche_kundenanforderungen' | 'verantwortlicher_nachname' | 'verantwortlicher_vorname' | 'zieltermin_klaerung';

export interface AnfrageAufnehmenForms {
  kundenanfragen: StepForm<'kundenanfragen'>;
  informationsquellen: StepForm<'informationsquellen'>;
}

// Alias so the option generics stay readable.
type Key = AnfrageAufnehmenFieldKey;

export interface AnfrageAufnehmenFlowOptions {
  /** field → wizard step that asks it; drives „Ändern“ links and answer chips. */
  steps?: Partial<Record<Key, number>>;
  initial?: Partial<Record<Key, unknown>>;
  messages?: Partial<Record<Key, string>>;
  /** How a search hit reads — the card's title/subtitle/status per pick. */
  items?: {
    kunde?: (record: JourneyRecord, ctx: RefContext) => SelectItemLike;
  };
}

const DEFAULT_STEPS: Record<string, number> = {"anfragebeschreibung": 2, "datei": 2, "eingangskanal": 2, "gewuenschte_menge": 2, "gewuenschter_liefertermin": 2, "kunde": 1, "kundenreferenz": 2, "prioritaet": 2, "produktfamilie": 2, "produktvariante": 2, "quellendatum": 2, "quellentyp": 2, "referenz_url": 2, "titel": 2, "urheber": 2, "urspruengliche_kundenanforderungen": 2, "verantwortlicher_nachname": 2, "verantwortlicher_vorname": 2, "zieltermin_klaerung": 2};
export const ANFRAGEAUFNEHMEN_REVIEW_STEP = 3;

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

export function useAnfrageAufnehmenFlow(options: AnfrageAufnehmenFlowOptions = {}) {
  const steps = { ...DEFAULT_STEPS, ...(options.steps ?? {}) } as Record<string, number>;
  const kundenanfragen = useStepForm('kundenanfragen', {
    fields: ["kunde", "prioritaet", "eingangskanal", "kundenreferenz", "produktfamilie", "produktvariante", "gewuenschte_menge", "anfragebeschreibung", "zieltermin_klaerung", "verantwortlicher_vorname", "gewuenschter_liefertermin", "verantwortlicher_nachname", "urspruengliche_kundenanforderungen"],
    steps: only(steps, ["kunde", "prioritaet", "eingangskanal", "kundenreferenz", "produktfamilie", "produktvariante", "gewuenschte_menge", "anfragebeschreibung", "zieltermin_klaerung", "verantwortlicher_vorname", "gewuenschter_liefertermin", "verantwortlicher_nachname", "urspruengliche_kundenanforderungen"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["kunde", "prioritaet", "eingangskanal", "kundenreferenz", "produktfamilie", "produktvariante", "gewuenschte_menge", "anfragebeschreibung", "zieltermin_klaerung", "verantwortlicher_vorname", "gewuenschter_liefertermin", "verantwortlicher_nachname", "urspruengliche_kundenanforderungen"]),
    messages: only(options.messages as Record<string, string> | undefined, ["kunde", "prioritaet", "eingangskanal", "kundenreferenz", "produktfamilie", "produktvariante", "gewuenschte_menge", "anfragebeschreibung", "zieltermin_klaerung", "verantwortlicher_vorname", "gewuenschter_liefertermin", "verantwortlicher_nachname", "urspruengliche_kundenanforderungen"]),
  });
  const informationsquellen = useStepForm('informationsquellen', {
    fields: ["datei", "titel", "urheber", "quellentyp", "quellendatum", "referenz_url"],
    steps: only(steps, ["datei", "titel", "urheber", "quellentyp", "quellendatum", "referenz_url"]) as Record<string, number>,
    initial: only(options.initial as FormValues | undefined, ["datei", "titel", "urheber", "quellentyp", "quellendatum", "referenz_url"]),
    messages: only(options.messages as Record<string, string> | undefined, ["datei", "titel", "urheber", "quellentyp", "quellendatum", "referenz_url"]),
  });
  const forms: AnfrageAufnehmenForms = { kundenanfragen, informationsquellen };
  const formList: StepForm[] = [kundenanfragen, informationsquellen];

  // The owner's rules after the build (intent-policies.json): a fixed value
  // for a field this flow sets itself, a narrower or wider pick — read at
  // render time, so a change works on the running application.
  usePolicyVersion();
  const searches = {
    kunde: useRecordSearch(servicePort, 'kunden', withPickPolicy('kunde', {
      searchFields: ["firmenname", "ansprechpartner_nachname", "kundennummer"] as never,
      filter: "r.v_aktiv == True",
      where: (r: JourneyRecord) => r.fields["aktiv"] === true,
      toItem: options.items?.kunde as never,
    })),
  };
  // Whether a pick offers „Neu anlegen“ is the plan's call: off for the record
  // this flow changes, for multi picks, for a catalogue entity and for an
  // entity with its own flow. The page spreads `.select` and writes no `create=`.
  // what the person sees under the search field: the rule that narrows the
  // pick (the owner's, else the plan's) — and the link that changes it
  const hintFor = (key: string, entity: EntityKey, planned: PickWhere | null) => pickHint(key, planned,
    w => whereSentence(w, f => labelOf(entity, f), (f, v) => optionsOf(entity, f).find(o => o.key === String(v))?.label ?? String(v)),
    `#/verwaltung/anwendung?line=intent:anfrage-aufnehmen:read:${entity}`);
  // a fixed value the flow sets itself, as a review row with the link that changes it
  const setting = (entity: EntityKey, field: string, value: unknown): SummaryItem => ({
    key: `setting:${entity}.${field}`, label: labelOf(entity, field),
    value: optionsOf(entity, field).find(o => o.key === String(value))?.label ?? String(value ?? ''),
    href: `#/verwaltung/anwendung?line=intent:anfrage-aufnehmen:write:${entity}.${field}`,
  });
  const picks = {
    kunde: { ...searches.kunde, select: { ...searches.kunde.select, create: false as boolean, hint: hintFor('kunde', 'kunden', {"conditions": [{"field": "aktiv", "op": "eq", "value": "true"}], "mode": "all"} as PickWhere | null) } },
  };

  const informationsquellenFilled = hasValues(informationsquellen);
  const plan: PlanStep[] = [
    {
      key: 'kundenanfragen', entity: 'kundenanfragen', form: kundenanfragen, primary: true,
      values: (): FormValues => ({
        status: policyFixedValue('kundenanfragen', 'status') ?? "neu",
        klaeraufwand: policyFixedValue('kundenanfragen', 'klaeraufwand') ?? "unbekannt",
        eingangsdatum: policyFixedValue('kundenanfragen', 'eingangsdatum') ?? todayIso(),
        vollstaendigkeit: policyFixedValue('kundenanfragen', 'vollstaendigkeit') ?? "ungeprueft",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('kundenanfragen', 'status', policyFixedValue('kundenanfragen', 'status') ?? "neu"), setting('kundenanfragen', 'klaeraufwand', policyFixedValue('kundenanfragen', 'klaeraufwand') ?? "unbekannt"), setting('kundenanfragen', 'vollstaendigkeit', policyFixedValue('kundenanfragen', 'vollstaendigkeit') ?? "ungeprueft")],

      // the planner's assumptions that first act here — shown once with „Passt“ / „ändern“
      notices: () => [{"assumed": "Laufende Nummer 1, 2, 3 \u2026", "id": "anfragenummer-format", "question": "Welches Format soll die Anfragenummer haben?"}],
    },
    ...(informationsquellenFilled ? [{
      key: 'informationsquellen', entity: 'informationsquellen', form: informationsquellen,      needs: ['kundenanfragen'],
      link: { anfrage: 'kundenanfragen' },

      values: (): FormValues => ({
        quellenstatus: policyFixedValue('informationsquellen', 'quellenstatus') ?? "ungeprueft",
        eingangszeitpunkt: policyFixedValue('informationsquellen', 'eingangszeitpunkt') ?? nowIso(),
        extraktionsstatus: policyFixedValue('informationsquellen', 'extraktionsstatus') ?? "nicht_verarbeitet",
      }),

      // the review shows what this step sets itself — changeable on „Deine Anwendung“, not here
      settings: () => [setting('informationsquellen', 'quellenstatus', policyFixedValue('informationsquellen', 'quellenstatus') ?? "ungeprueft"), setting('informationsquellen', 'extraktionsstatus', policyFixedValue('informationsquellen', 'extraktionsstatus') ?? "nicht_verarbeitet")],
    } as PlanStep] : []),
  ];

  const submit = useJourneySubmit(servicePort, plan, { draftKey: 'anfrage-aufnehmen' });

  /** Props for a single-record pick step: {...flow.picks.x.select} {...flow.pick('x')} */
  const pick = (field: AnfrageAufnehmenFieldKey) => {
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
  const pickMany = (field: AnfrageAufnehmenFieldKey) => {
    const owner = formList.find(f => f.keys.includes(field)) ?? formList[0];
    const search = (picks as Record<string, { labelOf(id: string): string | undefined }>)[field];
    return owner.records(field, id => search?.labelOf(id));
  };
  /** Validate every field the wizard asks in step `n` — for StepNav.onNext. */
  const validateStep = (n: number): boolean =>
    formList.every(f => f.validate(f.keys.filter(k => steps[k] === n)));
  const reset = () => { submit.reset(); formList.forEach(f => f.reset()); };

  return {
    slug: 'anfrage-aufnehmen' as const,
    draftKey: 'anfrage-aufnehmen' as const,
    entity: 'kundenanfragen' as const,
    form: kundenanfragen,
    forms, formList, picks, submit, steps,    reviewStep: ANFRAGEAUFNEHMEN_REVIEW_STEP,
    pick, pickMany, validateStep, reset,
    // the door the hook reads through — for what it does not own: availability
    // (useOccupancy(flow.port, …)), a count (useRecordCount(flow.port, …)). A page
    // importing servicePort next to the hook fails gate 3 (fewo 05.10.2026: the
    // gate taught useOccupancy(servicePort, …) and forbade servicePort at once)
    port: servicePort,
  };
}

export type AnfrageAufnehmenFlow = ReturnType<typeof useAnfrageAufnehmenFlow>;
