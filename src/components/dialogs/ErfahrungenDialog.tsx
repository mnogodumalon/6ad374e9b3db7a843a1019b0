/**
 * ErfahrungenDialog — pre-generated create/edit dialog for Erfahrungen.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * informationsquellenList (full hook array — resolves the Informationsquellen applookup),
 * beurteilungenList (full hook array — resolves the Beurteilungen applookup),
 * entscheidungenList (full hook array — resolves the Entscheidungen applookup),
 * kundenanfragenList (full hook array — resolves the Kundenanfragen applookup),
 * technischerAbschlussList (full hook array — resolves the TechnischerAbschluss applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * ErfahrungenDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Erfahrungen['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<ErfahrungenDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Erfahrungen, Informationsquellen, Beurteilungen, Entscheidungen, Kundenanfragen, TechnischerAbschluss, LookupValue } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, extractRecordIds, getUserProfile, LivingAppsService } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputedContext } from '@/config/form-enhancements/types';
import { applyFieldOrder, flattenFieldOrder, applyDefaults, evalComputed, numberInputProps, clampNumberValue, classifyComputed, extractApplookupRefs, mergeApplookupRefs, resolveApplookupRef } from '@/config/form-enhancements/types';
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Erfahrungen';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Combobox, MultiCombobox } from '@/components/Combobox';
import { InformationsquellenDialog } from '@/components/dialogs/InformationsquellenDialog';
import { BeurteilungenDialog } from '@/components/dialogs/BeurteilungenDialog';
import { EntscheidungenDialog } from '@/components/dialogs/EntscheidungenDialog';
import { KundenanfragenDialog } from '@/components/dialogs/KundenanfragenDialog';
import { TechnischerAbschlussDialog } from '@/components/dialogs/TechnischerAbschlussDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for ErfahrungenDialog.defaultValues — see file header. */
export type ErfahrungenDialogDefaults = Omit<Erfahrungen['fields'], 'erfahrungstyp' | 'risiko_uebertragung' | 'bestaetigungsstatus' | 'wiederverwendungsstatus'> & {
    erfahrungstyp?: LookupValue | string;
    risiko_uebertragung?: LookupValue | string;
    bestaetigungsstatus?: LookupValue | string;
    wiederverwendungsstatus?: LookupValue | string;
  };

interface ErfahrungenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Erfahrungen['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: ErfahrungenDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  informationsquellenList: Informationsquellen[];
  beurteilungenList: Beurteilungen[];
  entscheidungenList: Entscheidungen[];
  kundenanfragenList: Kundenanfragen[];
  technischerAbschlussList: TechnischerAbschluss[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  erfahrungstyp: LOOKUP_OPTIONS['erfahrungen']?.['erfahrungstyp'] ?? [],
  risiko_uebertragung: LOOKUP_OPTIONS['erfahrungen']?.['risiko_uebertragung'] ?? [],
  bestaetigungsstatus: LOOKUP_OPTIONS['erfahrungen']?.['bestaetigungsstatus'] ?? [],
  wiederverwendungsstatus: LOOKUP_OPTIONS['erfahrungen']?.['wiederverwendungsstatus'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  belegquellen: APP_IDS.INFORMATIONSQUELLEN,
  belegbeurteilungen: APP_IDS.BEURTEILUNGEN,
  belegentscheidungen: APP_IDS.ENTSCHEIDUNGEN,
  ursprungsanfrage: APP_IDS.KUNDENANFRAGEN,
  belegabschluss: APP_IDS.TECHNISCHER_ABSCHLUSS,
};
function normalizeDefaults(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const [k, opts] of Object.entries(NORMALIZE_LOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string') out[k] = opts.find(o => o.key === v) ?? { key: v, label: v };
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' ? opts.find(o => o.key === x) ?? { key: x, label: x } : x));
  }
  for (const [k, appId] of Object.entries(NORMALIZE_APPLOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string' && v !== '' && !v.startsWith('http')) out[k] = createRecordUrl(appId, v);
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' && x !== '' && !x.startsWith('http') ? createRecordUrl(appId, x) : x));
  }
  return out;
}

export function ErfahrungenDialog({ open, onClose, onSubmit, defaultValues, recordId, informationsquellenList, beurteilungenList, entscheidungenList, kundenanfragenList, technischerAbschlussList, enablePhotoScan = true, enablePhotoLocation = true }: ErfahrungenDialogProps) {
  const [fields, setFields] = useState<Partial<Erfahrungen['fields']>>({});
  const [saving, setSaving] = useState(false);
  const normalizedDefaults = useMemo<Record<string, unknown> | undefined>(
    () => (defaultValues ? normalizeDefaults(defaultValues as Record<string, unknown>) : undefined),
    [defaultValues],
  );
  // Dirty-tracking: in edit-mode the Speichern button is disabled until the
  // user actually changes something. JSON.stringify is good enough for our
  // fields (plain values + LookupValue objects + string arrays).
  const isDirty = useMemo(() => {
    if (!normalizedDefaults) return true;  // create-mode: always allow submit
    try {
      return JSON.stringify(fields) !== JSON.stringify(normalizedDefaults);
    } catch {
      return true;
    }
  }, [fields, normalizedDefaults]);
  // Inline-Create state for "Informationsquellen" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraInformationsquellen` list, and select it in
  // the originating Combobox via the captured `createInformationsquellenField`.
  const [createInformationsquellenOpen, setCreateInformationsquellenOpen] = useState(false);
  const [createInformationsquellenInitial, setCreateInformationsquellenInitial] = useState('');
  const [createInformationsquellenField, setCreateInformationsquellenField] = useState<string>('');
  const [extraInformationsquellen, setExtraInformationsquellen] = useState< Informationsquellen[]>([]);
  const informationsquellenListAll = useMemo(
    () => [...informationsquellenList, ...extraInformationsquellen],
    [informationsquellenList, extraInformationsquellen],
  );
  function openCreateInformationsquellen(fieldKey: string, q: string) {
    setCreateInformationsquellenField(fieldKey);
    setCreateInformationsquellenInitial(q);
    setCreateInformationsquellenOpen(true);
  }
  // Inline-Create state for "Beurteilungen" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraBeurteilungen` list, and select it in
  // the originating Combobox via the captured `createBeurteilungenField`.
  const [createBeurteilungenOpen, setCreateBeurteilungenOpen] = useState(false);
  const [createBeurteilungenInitial, setCreateBeurteilungenInitial] = useState('');
  const [createBeurteilungenField, setCreateBeurteilungenField] = useState<string>('');
  const [extraBeurteilungen, setExtraBeurteilungen] = useState< Beurteilungen[]>([]);
  const beurteilungenListAll = useMemo(
    () => [...beurteilungenList, ...extraBeurteilungen],
    [beurteilungenList, extraBeurteilungen],
  );
  function openCreateBeurteilungen(fieldKey: string, q: string) {
    setCreateBeurteilungenField(fieldKey);
    setCreateBeurteilungenInitial(q);
    setCreateBeurteilungenOpen(true);
  }
  // Inline-Create state for "Entscheidungen" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraEntscheidungen` list, and select it in
  // the originating Combobox via the captured `createEntscheidungenField`.
  const [createEntscheidungenOpen, setCreateEntscheidungenOpen] = useState(false);
  const [createEntscheidungenInitial, setCreateEntscheidungenInitial] = useState('');
  const [createEntscheidungenField, setCreateEntscheidungenField] = useState<string>('');
  const [extraEntscheidungen, setExtraEntscheidungen] = useState< Entscheidungen[]>([]);
  const entscheidungenListAll = useMemo(
    () => [...entscheidungenList, ...extraEntscheidungen],
    [entscheidungenList, extraEntscheidungen],
  );
  function openCreateEntscheidungen(fieldKey: string, q: string) {
    setCreateEntscheidungenField(fieldKey);
    setCreateEntscheidungenInitial(q);
    setCreateEntscheidungenOpen(true);
  }
  // Inline-Create state for "Kundenanfragen" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraKundenanfragen` list, and select it in
  // the originating Combobox via the captured `createKundenanfragenField`.
  const [createKundenanfragenOpen, setCreateKundenanfragenOpen] = useState(false);
  const [createKundenanfragenInitial, setCreateKundenanfragenInitial] = useState('');
  const [createKundenanfragenField, setCreateKundenanfragenField] = useState<string>('');
  const [extraKundenanfragen, setExtraKundenanfragen] = useState< Kundenanfragen[]>([]);
  const kundenanfragenListAll = useMemo(
    () => [...kundenanfragenList, ...extraKundenanfragen],
    [kundenanfragenList, extraKundenanfragen],
  );
  function openCreateKundenanfragen(fieldKey: string, q: string) {
    setCreateKundenanfragenField(fieldKey);
    setCreateKundenanfragenInitial(q);
    setCreateKundenanfragenOpen(true);
  }
  // Inline-Create state for "TechnischerAbschluss" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraTechnischerAbschluss` list, and select it in
  // the originating Combobox via the captured `createTechnischerAbschlussField`.
  const [createTechnischerAbschlussOpen, setCreateTechnischerAbschlussOpen] = useState(false);
  const [createTechnischerAbschlussInitial, setCreateTechnischerAbschlussInitial] = useState('');
  const [createTechnischerAbschlussField, setCreateTechnischerAbschlussField] = useState<string>('');
  const [extraTechnischerAbschluss, setExtraTechnischerAbschluss] = useState< TechnischerAbschluss[]>([]);
  const technischerAbschlussListAll = useMemo(
    () => [...technischerAbschlussList, ...extraTechnischerAbschluss],
    [technischerAbschlussList, extraTechnischerAbschluss],
  );
  function openCreateTechnischerAbschluss(fieldKey: string, q: string) {
    setCreateTechnischerAbschlussField(fieldKey);
    setCreateTechnischerAbschlussInitial(q);
    setCreateTechnischerAbschlussOpen(true);
  }
  // Fields the plan assigns to a tool (empty without a plan).
  const SYSTEM_ASSIGNED: string[] = [];
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['ursprungsanfrage', 'titel', 'sachverhalt', 'bestaetigungsstatus'] as const;
  const missingRequired = REQUIRED_FIELDS.filter(k => {
    const v = (fields as Record<string, unknown>)[k];
    return v == null || v === '' || (Array.isArray(v) && v.length === 0);
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [usePersonalInfo, setUsePersonalInfo] = useState(() => {
    try { return localStorage.getItem('ai-use-personal-info') === 'true'; } catch { return false; }
  });
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiText, setAiText] = useState('');

  // Computed-field plumbing. Pure no-op when formEnhancements.computed is {}.
  // The number renderer uses computedValues only as a fallback when the user
  // hasn't typed anything — clearing the input always restores the computation.
  // computedContext exposes applookup list props so { kind: 'applookup', ... }
  // operands can resolve to numeric fields on the target record.
  const computedContext = useMemo<ComputedContext>(() => ({
    lookupLists: {
      'belegquellen': informationsquellenList,
      'belegbeurteilungen': beurteilungenList,
      'belegentscheidungen': entscheidungenList,
      'ursprungsanfrage': kundenanfragenList,
      'belegabschluss': technischerAbschlussList,
    },
  }), [informationsquellenList, beurteilungenList, entscheidungenList, kundenanfragenList, technischerAbschlussList, ]);
  const computedValues = useMemo<Record<string, number | null>>(() => {
    let out: Record<string, number | null> = {};
    const entries = Object.entries(formEnhancements.computed);
    for (let i = 0; i < 5; i++) {
      const merged: Record<string, unknown> = { ...(fields as Record<string, unknown>) };
      for (const [k, v] of Object.entries(out)) {
        if (v === null) continue;
        const cur = merged[k];
        if (cur === undefined || cur === null || cur === '') merged[k] = v;
      }
      const next: Record<string, number | null> = {};
      let changed = false;
      for (const [key, spec] of entries) {
        const v = evalComputed(spec, merged, computedContext);
        next[key] = v;
        if (v !== out[key]) changed = true;
      }
      out = next;
      if (!changed) break;
    }
    return out;
  }, [fields, computedContext]);

  useEffect(() => {
    if (open) {
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<Erfahrungen['fields']>);
      setPreview(null);
      setScanSuccess(false);
      setAiText('');
      setSubmitError(null);
    }
  }, [open, normalizedDefaults]);
  useEffect(() => {
    try { localStorage.setItem('ai-use-personal-info', String(usePersonalInfo)); } catch {}
  }, [usePersonalInfo]);
  async function handleShowProfileInfo() {
    if (showProfileInfo) { setShowProfileInfo(false); return; }
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      setProfileData(p);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
      setShowProfileInfo(true);
    }
  }

  // Submit errors surface IN the dialog (it is modal — a banner in the page
  // body would be hidden behind it). A consumer onSubmit that THROWS (the
  // documented "throw to prevent closing" validation pattern) lands here:
  // the dialog stays open, nothing is saved, the message is visible.
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingRequired.length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      // Fill empty number slots from computed values; user-typed values always win.
      // CRITICAL: only backend-mapped keys may be backfilled. Virtual computeds
      // (sub-agent invents `_netto`, `_bestellung_gesamtbetrag` etc. for the
      // "Berechnungen" display) have no backend counterpart — writing them
      // triggers a 422 from the Living-Apps API ("field does not exist").
      const merged = { ...fields };
      for (const [key, val] of Object.entries(computedValues)) {
        if (val === null) continue;
        if (!backendFieldSet.has(key)) continue;
        const cur = (merged as Record<string, unknown>)[key];
        if (cur === undefined || cur === null || cur === '') {
          (merged as Record<string, unknown>)[key] = val;
        }
      }
      const clean = cleanFieldsForApi(merged, 'erfahrungen');
      await onSubmit(clean as Erfahrungen['fields']);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error && err.message ? err.message : t('submit_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAiExtract(file?: File) {
    if (!file && !aiText.trim()) return;
    setScanning(true);
    setScanSuccess(false);
    try {
      let uri: string | undefined;
      let gps: { latitude: number; longitude: number } | null = null;
      let geoAddr = '';
      const parts: string[] = [];
      if (file) {
        const [dataUri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
        uri = dataUri;
        if (file.type.startsWith('image/')) setPreview(uri);
        gps = enablePhotoLocation ? meta?.gps ?? null : null;
        if (gps) {
          geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
          parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
          if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
        }
        if (meta?.dateTime) {
          parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
        }
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      contextParts.push(`<available-records field="belegquellen" entity="Informationsquellen">\n${JSON.stringify(informationsquellenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="belegbeurteilungen" entity="Beurteilungen">\n${JSON.stringify(beurteilungenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="belegentscheidungen" entity="Entscheidungen">\n${JSON.stringify(entscheidungenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="ursprungsanfrage" entity="Kundenanfragen">\n${JSON.stringify(kundenanfragenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="belegabschluss" entity="Technischer Abschluss">\n${JSON.stringify(technischerAbschlussList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "belegquellen": string[] | null, // Display names from Informationsquellen, one per referenced record (see <available-records>)\n  "belegbeurteilungen": string[] | null, // Display names from Beurteilungen, one per referenced record (see <available-records>)\n  "belegentscheidungen": string[] | null, // Display names from Entscheidungen, one per referenced record (see <available-records>)\n  "ursprungsanfrage": string | null, // Display name from Kundenanfragen (see <available-records>)\n  "titel": string | null, // Titel\n  "sachverhalt": string | null, // Sachverhalt\n  "erfahrungstyp": LookupValue | null, // Erfahrungstyp (select one key: "erfahrung" | "annahme" | "experiment" | "wirkung" | "beobachtung" | "bewaehrte_vorgehensweise") mapping: erfahrung=Erfahrung, annahme=Annahme, experiment=Experiment, wirkung=Wirkung, beobachtung=Beobachtung, bewaehrte_vorgehensweise=Bewährte Vorgehensweise\n  "produktfamilie": string | null, // Produkt oder Produktfamilie\n  "anforderungstyp": string | null, // Anforderungstyp\n  "schlagwoerter": string | null, // Schlagwörter\n  "urspruengliches_problem": string | null, // Ursprüngliches Problem\n  "vorgehen": string | null, // Vorgehen\n  "beobachtetes_ergebnis": string | null, // Beobachtetes Ergebnis\n  "erkenntnis": string | null, // Erkenntnis\n  "belegabschluss": string | null, // Display name from Technischer Abschluss (see <available-records>)\n  "gueltigkeitsbedingungen": string | null, // Gültigkeitsbedingungen\n  "bekannte_grenzen": string | null, // Bekannte Grenzen\n  "risiko_uebertragung": LookupValue | null, // Risiko der Übertragung (select one key: "niedrig" | "mittel" | "hoch" | "unbekannt") mapping: niedrig=Niedrig, mittel=Mittel, hoch=Hoch, unbekannt=Unbekannt\n  "bestaetigungsstatus": LookupValue | null, // Bestätigungsstatus (select one key: "ungeprueft" | "vorlaeufig" | "fachlich_bestaetigt" | "wiederholt_bestaetigt" | "widerlegt" | "ueberholt") mapping: ungeprueft=Ungeprüft, vorlaeufig=Vorläufig, fachlich_bestaetigt=Fachlich bestätigt, wiederholt_bestaetigt=Wiederholt bestätigt, widerlegt=Widerlegt, ueberholt=Überholt\n  "bestaetigt_von": string | null, // Bestätigt von\n  "bestaetigt_am": string | null, // YYYY-MM-DD\n  "gueltig_ab": string | null, // YYYY-MM-DD\n  "gueltig_bis": string | null, // YYYY-MM-DD\n  "wiederverwendungsstatus": LookupValue | null, // Wiederverwendungsstatus (select one key: "nicht_geprueft" | "verfuegbar" | "nur_hinweis" | "nicht_mehr_verwenden") mapping: nicht_geprueft=Nicht geprüft, verfuegbar=Für Wiederverwendung verfügbar, nur_hinweis=Nur als Hinweis verwenden, nicht_mehr_verwenden=Nicht mehr verwenden\n  "kommentar_wiederverwendung": string | null, // Kommentar zur Wiederverwendung\n}`;
      const raw = await extractFromInput<Record<string, unknown>>(schema, {
        dataUri: uri,
        userText: aiText.trim() || undefined,
        photoContext,
        intent: DIALOG_INTENT,
      });
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["belegquellen", "belegbeurteilungen", "belegentscheidungen", "ursprungsanfrage", "belegabschluss"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const belegquellenNames = raw['belegquellen'];
        if (Array.isArray(belegquellenNames) && belegquellenNames.length > 0) {
          const belegquellenUrls = (belegquellenNames as unknown[])
            .map(n => informationsquellenList.find(r => matchName(String(n), [String(r.fields.titel ?? '')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, r.record_id));
          if (belegquellenUrls.length > 0) merged['belegquellen'] = belegquellenUrls;
        }
        const belegbeurteilungenNames = raw['belegbeurteilungen'];
        if (Array.isArray(belegbeurteilungenNames) && belegbeurteilungenNames.length > 0) {
          const belegbeurteilungenUrls = (belegbeurteilungenNames as unknown[])
            .map(n => beurteilungenList.find(r => matchName(String(n), [String(r.fields.beurteilungsgegenstand ?? '')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.BEURTEILUNGEN, r.record_id));
          if (belegbeurteilungenUrls.length > 0) merged['belegbeurteilungen'] = belegbeurteilungenUrls;
        }
        const belegentscheidungenNames = raw['belegentscheidungen'];
        if (Array.isArray(belegentscheidungenNames) && belegentscheidungenNames.length > 0) {
          const belegentscheidungenUrls = (belegentscheidungenNames as unknown[])
            .map(n => entscheidungenList.find(r => matchName(String(n), [String(r.fields.titel ?? '')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.ENTSCHEIDUNGEN, r.record_id));
          if (belegentscheidungenUrls.length > 0) merged['belegentscheidungen'] = belegentscheidungenUrls;
        }
        const ursprungsanfrageName = raw['ursprungsanfrage'] as string | null;
        if (ursprungsanfrageName) {
          const ursprungsanfrageMatch = kundenanfragenList.find(r => matchName(ursprungsanfrageName!, [String(r.fields.anfragenummer ?? '')]));
          if (ursprungsanfrageMatch) merged['ursprungsanfrage'] = createRecordUrl(APP_IDS.KUNDENANFRAGEN, ursprungsanfrageMatch.record_id);
        }
        const belegabschlussName = raw['belegabschluss'] as string | null;
        if (belegabschlussName) {
          const belegabschlussMatch = technischerAbschlussList.find(r => matchName(belegabschlussName!, [String(r.fields.geprueft_von ?? '')]));
          if (belegabschlussMatch) merged['belegabschluss'] = createRecordUrl(APP_IDS.TECHNISCHER_ABSCHLUSS, belegabschlussMatch.record_id);
        }
        return merged as Partial<Erfahrungen['fields']>;
      });
      setAiText('');
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error(`${t('scan_error')}:`, err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setScanning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleAiExtract(f);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleAiExtract(file);
    }
  }, []);

  const DIALOG_INTENT = defaultValues
    ? t('edit_entity', { entity: appLabel('erfahrungen') })
    : t('new_entity', { entity: appLabel('erfahrungen') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'belegquellen': (
      <div key="belegquellen" className="space-y-1.5">
        <Label htmlFor="belegquellen">{fieldLabel('erfahrungen', 'belegquellen')}</Label>
        <MultiCombobox
          id="belegquellen"
          placeholder=""
          items={informationsquellenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.titel ?? r.record_id),
          }))}
          values={extractRecordIds(fields.belegquellen)}
          onChange={ids => setFields(f => ({ ...f, belegquellen: ids.length ? ids.map(id => createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, id)) as any : undefined }))}
          onCreateNew={(q) => openCreateInformationsquellen("belegquellen", q)}
          createLabel={t('create_in', { entity: appLabel('informationsquellen') })}
        />
      </div>
    ),
    'belegbeurteilungen': (
      <div key="belegbeurteilungen" className="space-y-1.5">
        <Label htmlFor="belegbeurteilungen">{fieldLabel('erfahrungen', 'belegbeurteilungen')}</Label>
        <MultiCombobox
          id="belegbeurteilungen"
          placeholder=""
          items={beurteilungenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.beurteilungsgegenstand ?? r.record_id),
          }))}
          values={extractRecordIds(fields.belegbeurteilungen)}
          onChange={ids => setFields(f => ({ ...f, belegbeurteilungen: ids.length ? ids.map(id => createRecordUrl(APP_IDS.BEURTEILUNGEN, id)) as any : undefined }))}
          onCreateNew={(q) => openCreateBeurteilungen("belegbeurteilungen", q)}
          createLabel={t('create_in', { entity: appLabel('beurteilungen') })}
        />
      </div>
    ),
    'belegentscheidungen': (
      <div key="belegentscheidungen" className="space-y-1.5">
        <Label htmlFor="belegentscheidungen">{fieldLabel('erfahrungen', 'belegentscheidungen')}</Label>
        <MultiCombobox
          id="belegentscheidungen"
          placeholder=""
          items={entscheidungenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.titel ?? r.record_id),
          }))}
          values={extractRecordIds(fields.belegentscheidungen)}
          onChange={ids => setFields(f => ({ ...f, belegentscheidungen: ids.length ? ids.map(id => createRecordUrl(APP_IDS.ENTSCHEIDUNGEN, id)) as any : undefined }))}
          onCreateNew={(q) => openCreateEntscheidungen("belegentscheidungen", q)}
          createLabel={t('create_in', { entity: appLabel('entscheidungen') })}
        />
      </div>
    ),
    'ursprungsanfrage': (
      <div key="ursprungsanfrage" className="space-y-1.5">
        <Label htmlFor="ursprungsanfrage">{fieldLabel('erfahrungen', 'ursprungsanfrage')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="ursprungsanfrage"
          placeholder=""
          items={kundenanfragenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.anfragenummer ?? r.record_id),
          }))}
          value={extractRecordId(fields.ursprungsanfrage)}
          onChange={id => setFields(f => ({ ...f, ursprungsanfrage: id ? createRecordUrl(APP_IDS.KUNDENANFRAGEN, id) : undefined }))}
          onCreateNew={(q) => openCreateKundenanfragen("ursprungsanfrage", q)}
          createLabel={t('create_in', { entity: appLabel('kundenanfragen') })}
        />
        {showErrors && !fields.ursprungsanfrage && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('erfahrungen', 'ursprungsanfrage')}</p>
        )}
      </div>
    ),
    'titel': (
      <div key="titel" className="space-y-1.5">
        <Label htmlFor="titel">{fieldLabel('erfahrungen', 'titel')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="titel"
          placeholder=""
          value={fields.titel ?? ''}
          onChange={e => setFields(f => ({ ...f, titel: e.target.value }))}
          required
        />
        {showErrors && !fields.titel && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('erfahrungen', 'titel')}</p>
        )}
      </div>
    ),
    'sachverhalt': (
      <div key="sachverhalt" className="space-y-1.5">
        <Label htmlFor="sachverhalt">{fieldLabel('erfahrungen', 'sachverhalt')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="sachverhalt"
          placeholder=""
          value={fields.sachverhalt ?? ''}
          onChange={e => setFields(f => ({ ...f, sachverhalt: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.sachverhalt && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('erfahrungen', 'sachverhalt')}</p>
        )}
      </div>
    ),
    'erfahrungstyp': (
      <div key="erfahrungstyp" className="space-y-1.5">
        <Label htmlFor="erfahrungstyp">{fieldLabel('erfahrungen', 'erfahrungstyp')}</Label>
        <Select
          value={lookupKey(fields.erfahrungstyp) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, erfahrungstyp: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="erfahrungstyp" className="max-sm:h-11"><SelectValue placeholder="" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="erfahrung">{lookupLabel('erfahrungen', 'erfahrungstyp', 'erfahrung') ?? 'Erfahrung'}</SelectItem>
            <SelectItem value="annahme">{lookupLabel('erfahrungen', 'erfahrungstyp', 'annahme') ?? 'Annahme'}</SelectItem>
            <SelectItem value="experiment">{lookupLabel('erfahrungen', 'erfahrungstyp', 'experiment') ?? 'Experiment'}</SelectItem>
            <SelectItem value="wirkung">{lookupLabel('erfahrungen', 'erfahrungstyp', 'wirkung') ?? 'Wirkung'}</SelectItem>
            <SelectItem value="beobachtung">{lookupLabel('erfahrungen', 'erfahrungstyp', 'beobachtung') ?? 'Beobachtung'}</SelectItem>
            <SelectItem value="bewaehrte_vorgehensweise">{lookupLabel('erfahrungen', 'erfahrungstyp', 'bewaehrte_vorgehensweise') ?? 'Bewährte Vorgehensweise'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    'produktfamilie': (
      <div key="produktfamilie" className="space-y-1.5">
        <Label htmlFor="produktfamilie">{fieldLabel('erfahrungen', 'produktfamilie')}</Label>
        <Input
          id="produktfamilie"
          placeholder=""
          value={fields.produktfamilie ?? ''}
          onChange={e => setFields(f => ({ ...f, produktfamilie: e.target.value }))}
        />
      </div>
    ),
    'anforderungstyp': (
      <div key="anforderungstyp" className="space-y-1.5">
        <Label htmlFor="anforderungstyp">{fieldLabel('erfahrungen', 'anforderungstyp')}</Label>
        <Input
          id="anforderungstyp"
          placeholder=""
          value={fields.anforderungstyp ?? ''}
          onChange={e => setFields(f => ({ ...f, anforderungstyp: e.target.value }))}
        />
      </div>
    ),
    'schlagwoerter': (
      <div key="schlagwoerter" className="space-y-1.5">
        <Label htmlFor="schlagwoerter">{fieldLabel('erfahrungen', 'schlagwoerter')}</Label>
        <Input
          id="schlagwoerter"
          placeholder=""
          value={fields.schlagwoerter ?? ''}
          onChange={e => setFields(f => ({ ...f, schlagwoerter: e.target.value }))}
        />
      </div>
    ),
    'urspruengliches_problem': (
      <div key="urspruengliches_problem" className="space-y-1.5">
        <Label htmlFor="urspruengliches_problem">{fieldLabel('erfahrungen', 'urspruengliches_problem')}</Label>
        <Textarea
          id="urspruengliches_problem"
          placeholder=""
          value={fields.urspruengliches_problem ?? ''}
          onChange={e => setFields(f => ({ ...f, urspruengliches_problem: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'vorgehen': (
      <div key="vorgehen" className="space-y-1.5">
        <Label htmlFor="vorgehen">{fieldLabel('erfahrungen', 'vorgehen')}</Label>
        <Textarea
          id="vorgehen"
          placeholder=""
          value={fields.vorgehen ?? ''}
          onChange={e => setFields(f => ({ ...f, vorgehen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'beobachtetes_ergebnis': (
      <div key="beobachtetes_ergebnis" className="space-y-1.5">
        <Label htmlFor="beobachtetes_ergebnis">{fieldLabel('erfahrungen', 'beobachtetes_ergebnis')}</Label>
        <Textarea
          id="beobachtetes_ergebnis"
          placeholder=""
          value={fields.beobachtetes_ergebnis ?? ''}
          onChange={e => setFields(f => ({ ...f, beobachtetes_ergebnis: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'erkenntnis': (
      <div key="erkenntnis" className="space-y-1.5">
        <Label htmlFor="erkenntnis">{fieldLabel('erfahrungen', 'erkenntnis')}</Label>
        <Textarea
          id="erkenntnis"
          placeholder=""
          value={fields.erkenntnis ?? ''}
          onChange={e => setFields(f => ({ ...f, erkenntnis: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'belegabschluss': (
      <div key="belegabschluss" className="space-y-1.5">
        <Label htmlFor="belegabschluss">{fieldLabel('erfahrungen', 'belegabschluss')}</Label>
        <Combobox
          id="belegabschluss"
          placeholder=""
          items={technischerAbschlussListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.geprueft_von ?? r.record_id),
          }))}
          value={extractRecordId(fields.belegabschluss)}
          onChange={id => setFields(f => ({ ...f, belegabschluss: id ? createRecordUrl(APP_IDS.TECHNISCHER_ABSCHLUSS, id) : undefined }))}
          onCreateNew={(q) => openCreateTechnischerAbschluss("belegabschluss", q)}
          createLabel={t('create_in', { entity: appLabel('technischer_abschluss') })}
        />
      </div>
    ),
    'gueltigkeitsbedingungen': (
      <div key="gueltigkeitsbedingungen" className="space-y-1.5">
        <Label htmlFor="gueltigkeitsbedingungen">{fieldLabel('erfahrungen', 'gueltigkeitsbedingungen')}</Label>
        <Textarea
          id="gueltigkeitsbedingungen"
          placeholder=""
          value={fields.gueltigkeitsbedingungen ?? ''}
          onChange={e => setFields(f => ({ ...f, gueltigkeitsbedingungen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'bekannte_grenzen': (
      <div key="bekannte_grenzen" className="space-y-1.5">
        <Label htmlFor="bekannte_grenzen">{fieldLabel('erfahrungen', 'bekannte_grenzen')}</Label>
        <Textarea
          id="bekannte_grenzen"
          placeholder=""
          value={fields.bekannte_grenzen ?? ''}
          onChange={e => setFields(f => ({ ...f, bekannte_grenzen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'risiko_uebertragung': (
      <div key="risiko_uebertragung" className="space-y-1.5">
        <Label htmlFor="risiko_uebertragung">{fieldLabel('erfahrungen', 'risiko_uebertragung')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.risiko_uebertragung) === 'niedrig'}
            onClick={() => setFields(f => ({ ...f, risiko_uebertragung: (lookupKey(f.risiko_uebertragung) === 'niedrig' ? undefined : 'niedrig') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.risiko_uebertragung) === 'niedrig'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('erfahrungen', 'risiko_uebertragung', 'niedrig') ?? 'Niedrig'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.risiko_uebertragung) === 'mittel'}
            onClick={() => setFields(f => ({ ...f, risiko_uebertragung: (lookupKey(f.risiko_uebertragung) === 'mittel' ? undefined : 'mittel') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.risiko_uebertragung) === 'mittel'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('erfahrungen', 'risiko_uebertragung', 'mittel') ?? 'Mittel'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.risiko_uebertragung) === 'hoch'}
            onClick={() => setFields(f => ({ ...f, risiko_uebertragung: (lookupKey(f.risiko_uebertragung) === 'hoch' ? undefined : 'hoch') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.risiko_uebertragung) === 'hoch'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('erfahrungen', 'risiko_uebertragung', 'hoch') ?? 'Hoch'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.risiko_uebertragung) === 'unbekannt'}
            onClick={() => setFields(f => ({ ...f, risiko_uebertragung: (lookupKey(f.risiko_uebertragung) === 'unbekannt' ? undefined : 'unbekannt') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.risiko_uebertragung) === 'unbekannt'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('erfahrungen', 'risiko_uebertragung', 'unbekannt') ?? 'Unbekannt'}
          </button>
        </div>
      </div>
    ),
    'bestaetigungsstatus': (
      <div key="bestaetigungsstatus" className="space-y-1.5">
        <Label htmlFor="bestaetigungsstatus">{fieldLabel('erfahrungen', 'bestaetigungsstatus')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Select
          value={lookupKey(fields.bestaetigungsstatus) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, bestaetigungsstatus: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="bestaetigungsstatus" className="max-sm:h-11"><SelectValue placeholder="" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="ungeprueft">{lookupLabel('erfahrungen', 'bestaetigungsstatus', 'ungeprueft') ?? 'Ungeprüft'}</SelectItem>
            <SelectItem value="vorlaeufig">{lookupLabel('erfahrungen', 'bestaetigungsstatus', 'vorlaeufig') ?? 'Vorläufig'}</SelectItem>
            <SelectItem value="fachlich_bestaetigt">{lookupLabel('erfahrungen', 'bestaetigungsstatus', 'fachlich_bestaetigt') ?? 'Fachlich bestätigt'}</SelectItem>
            <SelectItem value="wiederholt_bestaetigt">{lookupLabel('erfahrungen', 'bestaetigungsstatus', 'wiederholt_bestaetigt') ?? 'Wiederholt bestätigt'}</SelectItem>
            <SelectItem value="widerlegt">{lookupLabel('erfahrungen', 'bestaetigungsstatus', 'widerlegt') ?? 'Widerlegt'}</SelectItem>
            <SelectItem value="ueberholt">{lookupLabel('erfahrungen', 'bestaetigungsstatus', 'ueberholt') ?? 'Überholt'}</SelectItem>
          </SelectContent>
        </Select>
        {showErrors && !fields.bestaetigungsstatus && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('erfahrungen', 'bestaetigungsstatus')}</p>
        )}
      </div>
    ),
    'bestaetigt_von': (
      <div key="bestaetigt_von" className="space-y-1.5">
        <Label htmlFor="bestaetigt_von">{fieldLabel('erfahrungen', 'bestaetigt_von')}</Label>
        <Input
          id="bestaetigt_von"
          placeholder=""
          value={fields.bestaetigt_von ?? ''}
          onChange={e => setFields(f => ({ ...f, bestaetigt_von: e.target.value }))}
        />
      </div>
    ),
    'bestaetigt_am': (
      <div key="bestaetigt_am" className="space-y-1.5">
        <Label htmlFor="bestaetigt_am">{fieldLabel('erfahrungen', 'bestaetigt_am')}</Label>
        <DatePicker
          id="bestaetigt_am"
          placeholder=""
          mode="date"
          value={fields.bestaetigt_am ?? null}
          onChange={v => setFields(f => ({ ...f, bestaetigt_am: v ?? undefined }))}
        />
      </div>
    ),
    'gueltig_ab': (
      <div key="gueltig_ab" className="space-y-1.5">
        <Label htmlFor="gueltig_ab">{fieldLabel('erfahrungen', 'gueltig_ab')}</Label>
        <DatePicker
          id="gueltig_ab"
          placeholder=""
          mode="date"
          value={fields.gueltig_ab ?? null}
          onChange={v => setFields(f => ({ ...f, gueltig_ab: v ?? undefined }))}
        />
      </div>
    ),
    'gueltig_bis': (
      <div key="gueltig_bis" className="space-y-1.5">
        <Label htmlFor="gueltig_bis">{fieldLabel('erfahrungen', 'gueltig_bis')}</Label>
        <DatePicker
          id="gueltig_bis"
          placeholder=""
          mode="date"
          value={fields.gueltig_bis ?? null}
          onChange={v => setFields(f => ({ ...f, gueltig_bis: v ?? undefined }))}
        />
      </div>
    ),
    'wiederverwendungsstatus': (
      <div key="wiederverwendungsstatus" className="space-y-1.5">
        <Label htmlFor="wiederverwendungsstatus">{fieldLabel('erfahrungen', 'wiederverwendungsstatus')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.wiederverwendungsstatus) === 'nicht_geprueft'}
            onClick={() => setFields(f => ({ ...f, wiederverwendungsstatus: (lookupKey(f.wiederverwendungsstatus) === 'nicht_geprueft' ? undefined : 'nicht_geprueft') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.wiederverwendungsstatus) === 'nicht_geprueft'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('erfahrungen', 'wiederverwendungsstatus', 'nicht_geprueft') ?? 'Nicht geprüft'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.wiederverwendungsstatus) === 'verfuegbar'}
            onClick={() => setFields(f => ({ ...f, wiederverwendungsstatus: (lookupKey(f.wiederverwendungsstatus) === 'verfuegbar' ? undefined : 'verfuegbar') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.wiederverwendungsstatus) === 'verfuegbar'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('erfahrungen', 'wiederverwendungsstatus', 'verfuegbar') ?? 'Für Wiederverwendung verfügbar'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.wiederverwendungsstatus) === 'nur_hinweis'}
            onClick={() => setFields(f => ({ ...f, wiederverwendungsstatus: (lookupKey(f.wiederverwendungsstatus) === 'nur_hinweis' ? undefined : 'nur_hinweis') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.wiederverwendungsstatus) === 'nur_hinweis'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('erfahrungen', 'wiederverwendungsstatus', 'nur_hinweis') ?? 'Nur als Hinweis verwenden'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.wiederverwendungsstatus) === 'nicht_mehr_verwenden'}
            onClick={() => setFields(f => ({ ...f, wiederverwendungsstatus: (lookupKey(f.wiederverwendungsstatus) === 'nicht_mehr_verwenden' ? undefined : 'nicht_mehr_verwenden') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.wiederverwendungsstatus) === 'nicht_mehr_verwenden'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('erfahrungen', 'wiederverwendungsstatus', 'nicht_mehr_verwenden') ?? 'Nicht mehr verwenden'}
          </button>
        </div>
      </div>
    ),
    'kommentar_wiederverwendung': (
      <div key="kommentar_wiederverwendung" className="space-y-1.5">
        <Label htmlFor="kommentar_wiederverwendung">{fieldLabel('erfahrungen', 'kommentar_wiederverwendung')}</Label>
        <Textarea
          id="kommentar_wiederverwendung"
          placeholder=""
          value={fields.kommentar_wiederverwendung ?? ''}
          onChange={e => setFields(f => ({ ...f, kommentar_wiederverwendung: e.target.value }))}
          rows={3}
        />
      </div>
    ),
  };
  const orderedFields = applyFieldOrder(Object.keys(fieldBlocks), formEnhancements.fieldOrder);
  const orderedFieldsKey = orderedFields.map((it) => typeof it === 'string' ? it : it.row.join('+')).join(',');

  // Render-Modell für Computed-Felder:
  //
  //   • BACKEND-FELDER mit computed-Eintrag (z.B. gesamtpreis bei einer
  //     Katzenpension) bleiben als normales Eingabe-Feld stehen. Der Number-
  //     Input nutzt den computed-Wert als Vorschlag, der User kann jederzeit
  //     überschreiben (clearing → restore computed).
  //   • VIRTUELLE computed-Keys (Eintrag in formEnhancements.computed, ABER
  //     kein passendes Backend-Feld in orderedFields) erscheinen NICHT als
  //     Input, sondern unten als kompakte 'Berechnungen'-Übersicht oder als
  //     Inline-Hint unter dem letzten beitragenden Input.
  const FIELD_LABELS: Record<string, string> = {"belegquellen": "Belegquellen", "belegbeurteilungen": "Belegbeurteilungen", "belegentscheidungen": "Belegentscheidungen", "ursprungsanfrage": "Ursprungsanfrage", "titel": "Titel", "sachverhalt": "Sachverhalt", "erfahrungstyp": "Erfahrungstyp", "produktfamilie": "Produkt oder Produktfamilie", "anforderungstyp": "Anforderungstyp", "schlagwoerter": "Schlagwörter", "urspruengliches_problem": "Ursprüngliches Problem", "vorgehen": "Vorgehen", "beobachtetes_ergebnis": "Beobachtetes Ergebnis", "erkenntnis": "Erkenntnis", "belegabschluss": "Beleg Prüfergebnis", "gueltigkeitsbedingungen": "Gültigkeitsbedingungen", "bekannte_grenzen": "Bekannte Grenzen", "risiko_uebertragung": "Risiko der Übertragung", "bestaetigungsstatus": "Bestätigungsstatus", "bestaetigt_von": "Bestätigt von", "bestaetigt_am": "Bestätigt am", "gueltig_ab": "Gültig ab", "gueltig_bis": "Gültig bis", "wiederverwendungsstatus": "Wiederverwendungsstatus", "kommentar_wiederverwendung": "Kommentar zur Wiederverwendung"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"belegquellen": {"eingangszeitpunkt": "Eingang", "versionskennung": "Versionskennung", "quellenstatus": "Quellenstatus", "zusammenfassung": "Inhaltliche Zusammenfassung", "extraktionsstatus": "Extraktionsstatus", "pruefung_durch": "Geprüft durch", "pruefung_am": "Geprüft am", "erneute_pruefung": "Erneute Prüfung der betroffenen Objekte erforderlich", "bemerkung": "Bemerkung", "ersetzt_quelle": "Ersetzt Quelle", "anfrage": "Anfrage", "quellentyp": "Quellentyp", "titel": "Titel", "datei": "Datei", "referenz_url": "Webadresse oder Referenz", "urheber": "Absender oder Urheber", "quellendatum": "Quellendatum"}, "belegbeurteilungen": {"betroffene_anforderungen": "Betroffene Anforderungen", "betroffene_offene_punkte": "Betroffene offene Punkte", "zugrunde_liegende_quellen": "Zugrunde liegende Quellen", "anfrage": "Anfrage", "beurteilungsgegenstand": "Beurteilungsgegenstand", "beurteilungsart": "Beurteilungsart", "einschaetzung": "Einschätzung", "fachliche_begruendung": "Fachliche Begründung", "annahmen": "Annahmen", "unsicherheiten": "Unsicherheiten", "alternativen": "Alternativen", "empfehlung": "Empfehlung", "ist_ki_vorschlag": "Inhalt ist ein KI-Vorschlag", "erstellt_von": "Erstellt von", "erstellt_am": "Erstellt am", "pruefstatus": "Prüfstatus", "geprueft_von": "Geprüft von", "geprueft_am": "Geprüft am", "erneute_pruefung": "Erneute Prüfung erforderlich"}, "belegentscheidungen": {"betroffene_anforderungen": "Betroffene Anforderungen", "betroffene_offene_punkte": "Betroffene offene Punkte", "zugrunde_liegende_beurteilungen": "Zugrunde liegende Beurteilungen", "ersetzt_durch_entscheidung": "Ersetzt durch Entscheidung", "anfrage": "Anfrage", "titel": "Titel", "entscheidungsgegenstand": "Entscheidungsgegenstand", "entscheidungstyp": "Entscheidungstyp", "alternativen": "Alternativen", "entscheidung": "Entscheidung", "begruendung": "Begründung", "verantwortlicher_vorname": "Entscheidungsverantwortlicher Vorname", "verantwortlicher_nachname": "Entscheidungsverantwortlicher Nachname", "kompetenz_geprueft": "Entscheidungskompetenz geprüft", "entscheidungsstatus": "Entscheidungsstatus", "entscheidungsdatum": "Entscheidungsdatum", "auflagen": "Auflagen", "gueltig_bis": "Gültig bis", "ergebnis": "Ergebnis", "erneute_pruefung": "Erneute Prüfung erforderlich"}, "ursprungsanfrage": {"anfragenummer": "Anfragenummer", "kunde": "Kunde", "eingangsdatum": "Eingangsdatum", "eingangskanal": "Eingangskanal", "kundenreferenz": "Kundenreferenz", "kontakt_vorname": "Ansprechpartner zur Anfrage Vorname", "kontakt_nachname": "Ansprechpartner zur Anfrage Nachname", "kontakt_email": "E-Mail zur Anfrage", "produktfamilie": "Produkt oder Produktfamilie", "produktvariante": "Produktvariante", "gewuenschte_menge": "Gewünschte Menge (größer als 0)", "gewuenschter_liefertermin": "Gewünschter Liefertermin", "anfragebeschreibung": "Anfragebeschreibung", "urspruengliche_kundenanforderungen": "Ursprüngliche Kundenanforderungen (unverändert)", "prioritaet": "Priorität", "verantwortlicher_vorname": "Verantwortlicher Vorname", "verantwortlicher_nachname": "Verantwortlicher Nachname", "status": "Status", "klaeraufwand": "Technischer Kläraufwand", "zieltermin_klaerung": "Zieltermin der Klärung", "vollstaendigkeit": "Vollständigkeit", "schaetzung_bearbeitung_min": "Geschätzte aktive Bearbeitungszeit (Minuten)", "gemessen_bearbeitung_min": "Gemessene aktive Bearbeitungszeit (Minuten)", "wartezeit_kunde_min": "Gemessene Wartezeit auf Kunde (Minuten)", "wartezeit_intern_min": "Gemessene interne Wartezeit (Minuten)", "geklaert_am": "Technisch geklärt am", "anzahl_nachtraegliche_aenderungen": "Anzahl nachträglicher Änderungen", "anzahl_nacharbeiten": "Anzahl erforderlicher Nacharbeiten"}, "belegabschluss": {"anfrage": "Anfrage", "pruefdatum": "Prüfdatum", "geprueft_von": "Geprüft von", "anforderungen_geprueft": "Anforderungen geprüft", "kritische_punkte_geklaert": "Kritische Punkte geklärt oder ausdrücklich entschieden", "entscheidungen_vorhanden": "Erforderliche Entscheidungen vorhanden", "freigaben_vorhanden": "Erforderliche Freigaben vorhanden", "verbleibende_abweichungen": "Verbleibende Abweichungen", "verbleibende_risiken": "Verbleibende Risiken", "offene_restpunkte": "Offene Restpunkte", "uebergabeempfaenger": "Übergabeempfänger", "uebergabestatus": "Übergabestatus", "uebergabedatum": "Übergabedatum", "zusammenfassung": "Zusammenfassung", "freigabestatus": "Technischer Freigabestatus"}};
  const inputFields = useMemo(() => flattenFieldOrder(orderedFields), [orderedFieldsKey]);
  const backendFieldSet = useMemo(() => new Set(inputFields), [inputFields.join(',')]);
  const virtualComputed = useMemo(
    () => Object.fromEntries(
      Object.entries(formEnhancements.computed).filter(([k]) => !backendFieldSet.has(k)),
    ),
    [backendFieldSet],
  );
  const virtualFormEnhancements = useMemo(
    () => ({ ...formEnhancements, computed: virtualComputed }),
    [virtualComputed],
  );
  const computedLayout = useMemo(
    () => classifyComputed(virtualFormEnhancements, inputFields, computedDeps),
    [virtualFormEnhancements, inputFields.join(',')],
  );
  // Applookup-Referenzen: pro ownKey (Lookup-Feld im Form) die Liste der
  // lookupKeys, die in irgendeiner computed-Formel referenziert werden.
  // MODUS-1: aus dem Spec-Tree extrahiert. MODUS-2: aus dem Build-Time-
  // Export computedApplookupRefs (parse-formulas hat Regex-Pairs gesammelt).
  // Pro (ownKey, lookupKey)-Paar nur einmal; pro ownKey können aber mehrere
  // lookupKeys gleichzeitig auftauchen (z.B. einzelpreis UND karten10_preis
  // beim Yoga-Kurs), und alle werden separat als Inline-Hint gerendert.
  const applookupRefs = useMemo(
    () => mergeApplookupRefs(
      extractApplookupRefs(formEnhancements.computed),
      computedApplookupRefs,
    ),
    [],
  );
  function summaryLabel(k: string): string {
    if (FIELD_LABELS[k]) return FIELD_LABELS[k];
    // Leading underscore(s) als Virtual-Marker abstreifen; Unterstriche zu
    // Leerzeichen, jedes Wort kapitalisieren. Umlaute kommen vom Sub-Agent
    // direkt im Key (z. B. `_buchung_dauer_nächte`) — JS/TS/Vite unterstützen
    // Unicode-Identifier nativ, daher keine ASCII-Transliteration nötig.
    return k.replace(/^_+/, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  function formatSummaryValue(k: string, v: unknown): string {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return String(v);
    // Backend-Feld mit €-Label ODER virtueller Computed-Key, dessen Name nach Geld aussieht.
    const looksLikeCurrency = CURRENCY_KEYS.has(k) || /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k);
    if (looksLikeCurrency) {
      return n.toLocaleString(localeTag(), { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(localeTag(), { maximumFractionDigits: 2 });
  }

  return (
    <>
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] flex flex-col overflow-hidden p-0 gap-0 max-sm:[&>button]:size-10 max-sm:[&>button]:grid max-sm:[&>button]:place-items-center max-sm:[&>button]:rounded-full max-sm:[&>button]:border max-sm:[&>button]:border-input max-sm:[&>button]:bg-background max-sm:[&>button]:opacity-100 max-sm:[&>button>svg]:size-5">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex flex-row items-center gap-3 space-y-0">
          <DialogTitle className="flex-1 truncate text-left">{DIALOG_INTENT}</DialogTitle>
          {enablePhotoScan && (
            <button
              type="button"
              onClick={() => setAiOpen(o => !o)}
              aria-expanded={aiOpen}
              aria-controls="ai-fill-panel"
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 max-sm:py-2.5 max-sm:px-4 text-xs font-semibold transition-all mr-7 max-sm:mr-12 shadow-sm ${
                aiOpen
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 hover:border-primary/50'
              }`}
            >
              <IconSparkles className={`h-3.5 w-3.5 ${aiOpen ? '' : 'text-primary'}`} />
              <span className="hidden sm:inline">{t('smart_fill')}</span>
              <IconChevronDown className={`h-3 w-3 transition-transform ${aiOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </DialogHeader>
        {enablePhotoScan && aiOpen && (
          <div id="ai-fill-panel" className="border-b bg-muted/20 px-6 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">{t('scan_header_sub')}</p>
            <div className="flex items-start gap-2 pl-0.5">
              <Checkbox
                id="ai-use-personal-info"
                checked={usePersonalInfo}
                onCheckedChange={(v) => setUsePersonalInfo(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <Label htmlFor="ai-use-personal-info" className="text-xs font-normal text-muted-foreground cursor-pointer inline">
                  {t('useinfo_label')}
                </Label>
                {' '}
                <button type="button" onClick={handleShowProfileInfo} className="text-xs text-primary hover:underline whitespace-nowrap">
                  {profileLoading ? t('useinfo_loading') : `(${t('useinfo_more')})`}
                </button>
              </span>
            </div>
            {showProfileInfo && (
              <div className="rounded-md border bg-muted/50 p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">{t('profile_preamble')}</p>
                {profileData ? Object.values(profileData).map((v, i) => (
                  <span key={i}>{i > 0 && ", "}{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                )) : (
                  <span className="text-muted-foreground">{t('useinfo_error')}</span>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${scanning
                  ? 'border-primary/40 bg-primary/5'
                  : scanSuccess
                    ? 'border-green-500/40 bg-green-50/50 dark:bg-green-950/20'
                    : dragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconLoader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_analyzing')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_analyzing_sub')}</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconCircleCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('scan_success')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_success_sub')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <IconPhotoPlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_upload')}</p>
                  </div>
                </div>
              )}

              {preview && !scanning && (
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <img src={preview} alt="" className="h-10 w-10 rounded-md object-cover border shadow-sm" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center"
                    >
                      <IconX className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <IconCamera className="h-3.5 w-3.5 mr-1" />{t('scan_camera_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <IconUpload className="h-3.5 w-3.5 mr-1" />{t('scan_file_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <IconFileText className="h-3.5 w-3.5 mr-1" />{t('scan_doc_btn')}
              </Button>
            </div>

            <div className="relative">
              <Textarea
                placeholder={t('scan_text_placeholder')}
                value={aiText}
                onChange={e => {
                  setAiText(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.min(Math.max(el.scrollHeight, 56), 96) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && aiText.trim() && !scanning) {
                    e.preventDefault();
                    handleAiExtract();
                  }
                }}
                disabled={scanning}
                rows={2}
                className="pr-12 resize-none text-sm overflow-y-auto"
              />
              <button
                type="button"
                className="absolute right-2 top-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                disabled={scanning}
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setAiText(prev => prev ? prev + '\n' + text : text);
                  } catch {}
                }}
                title={t('paste')}
              >
                <IconClipboard className="h-4 w-4" />
              </button>
            </div>
            {aiText.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                disabled={scanning}
                onClick={() => handleAiExtract()}
              >
                <IconSparkles className="h-3.5 w-3.5 mr-1.5" />{t('scan_text_analyze')}
              </Button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0 min-w-0 max-sm:[&_input]:h-11">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-4 min-w-0">
            {(() => {
              const renderField = (k: string) => {
                const inlineHints = computedLayout.anchors[k] ?? [];
                const refs = applookupRefs[k] ?? [];
                // A field the plan gives to a TOOL. On CREATE it is not shown
                // at all — the value does not exist yet and typing one only
                // gets overwritten. On EDIT it stays a normal input with a
                // note: when a tool could not compose its value (a missing
                // ingredient), this is the only place to repair the record.
                if (SYSTEM_ASSIGNED.includes(k) && !recordId) {
                  return (
                    <div key={k} className="space-y-1.5 min-w-0">
                      <Label>{fieldLabel('erfahrungen', k)}</Label>
                      <p className="text-sm text-muted-foreground">{t('assigned_by_system')}</p>
                    </div>
                  );
                }
                return (
                  <div key={k} className="space-y-1.5 min-w-0">
                    {fieldBlocks[k]}
                    {SYSTEM_ASSIGNED.includes(k) && (
                      <p className="text-xs text-muted-foreground">{t('assigned_by_system')}</p>
                    )}
                    {refs.map(({ lookupKey }) => {
                      // Show the live numeric value the formula will pull from
                      // the selected lookup target (e.g. "Monatspreis: 34,90 €"
                      // under the Tarif combobox). Hidden while no lookup is
                      // selected or the target field is non-numeric.
                      const v = resolveApplookupRef(k, lookupKey, fields as Record<string, unknown>, computedContext);
                      if (v === null) return null;
                      const lbl = APPLOOKUP_LABELS[k]?.[lookupKey] ?? lookupKey;
                      const text = formatSummaryValue(lookupKey, v);
                      return (
                        <div key={`alh-${k}-${lookupKey}`} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{lbl}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                    {inlineHints.map((cKey) => {
                      const v = computedValues[cKey];
                      const text = formatSummaryValue(cKey, v);
                      if (text === '—') return null;
                      return (
                        <div key={cKey} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{summaryLabel(cKey)}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              };
              return orderedFields.map((item, idx) => {
                if (typeof item === 'string') return renderField(item);
                const cols = item.cols ?? `repeat(${item.row.length}, minmax(0, 1fr))`;
                return (
                  <div key={`row-${idx}`} className="grid gap-3" style={{ gridTemplateColumns: cols }}>
                    {item.row.map(renderField)}
                  </div>
                );
              });
            })()}
            {(computedLayout.aggregates.length > 0 || computedLayout.finalTotal) && (
              <div className="mt-6 pt-4 border-t border-border space-y-1.5">
                {computedLayout.aggregates.length > 0 && (
                  <dl className="space-y-1.5 pb-2">
                    {computedLayout.aggregates.map((k) => {
                      const userVal = (fields as Record<string, unknown>)[k];
                      const computed = computedValues[k];
                      const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                      return (
                        <div key={k} className="flex justify-between items-baseline gap-3">
                          <dt className="text-sm text-muted-foreground truncate">{summaryLabel(k)}</dt>
                          <dd className="text-sm font-medium tabular-nums whitespace-nowrap">{formatSummaryValue(k, v)}</dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
                {computedLayout.finalTotal && (() => {
                  const k = computedLayout.finalTotal;
                  const userVal = (fields as Record<string, unknown>)[k];
                  const computed = computedValues[k];
                  const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                  // Innere Border nur wenn aggregates existieren — sonst hätten wir
                  // zwei direkt aufeinanderfolgende Striche (Outer + Inner) mit nur
                  // einer Aggregat-Zeile dazwischen → zu viel visuelles Rauschen.
                  const sep = computedLayout.aggregates.length > 0 ? 'pt-3 border-t border-border' : 'pt-1';
                  return (
                    <div className={`flex justify-between items-baseline gap-3 ${sep}`}>
                      <span className="text-base font-semibold text-foreground">{summaryLabel(k)}</span>
                      <span className="text-lg font-bold tabular-nums whitespace-nowrap text-foreground">{formatSummaryValue(k, v)}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            {showErrors && missingRequired.length > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1.5" role="alert">
                <IconAlertCircle className="h-3.5 w-3.5 shrink-0" />
                {t('missing_required')}
              </p>
            )}
            {recordId && (
              <div className="pt-2 border-t border-border">
                <AttachmentsSection appId={APP_IDS.ERFAHRUNGEN} recordId={recordId} />
              </div>
            )}
          </div>
          {submitError && (
            <div className="flex items-start gap-2 border-t border-destructive/20 bg-destructive/10 px-6 py-2.5 text-sm text-destructive" role="alert">
              <IconAlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="min-w-0 break-words">{submitError}</span>
            </div>
          )}
          <DialogFooter className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-6 py-3 gap-2 max-sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} className="max-sm:h-12 max-sm:flex-1 max-sm:text-base">{t('cancel')}</Button>
            <Button
              type="submit"
              className="max-sm:h-12 max-sm:flex-1 max-sm:text-base"
              disabled={saving || !isDirty || (showErrors && missingRequired.length > 0)}
            >
              {saving ? t('saving') : defaultValues ? t('save') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {createInformationsquellenOpen && (
      <InformationsquellenDialog
        open={createInformationsquellenOpen}
        onClose={() => setCreateInformationsquellenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createInformationsquellenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Informationsquellen;
            setExtraInformationsquellen(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, result.id);
            setFields(prev => ({ ...prev, [createInformationsquellenField]: url } as any));
          }
          setCreateInformationsquellenOpen(false);
        }}
        defaultValues={createInformationsquellenInitial
          ? ({ titel: createInformationsquellenInitial } as any)
          : undefined}
        informationsquellenList={informationsquellenList}
        kundenanfragenList={kundenanfragenList}
      />
    )}
    {createBeurteilungenOpen && (
      <BeurteilungenDialog
        open={createBeurteilungenOpen}
        onClose={() => setCreateBeurteilungenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createBeurteilungenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Beurteilungen;
            setExtraBeurteilungen(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.BEURTEILUNGEN, result.id);
            setFields(prev => ({ ...prev, [createBeurteilungenField]: url } as any));
          }
          setCreateBeurteilungenOpen(false);
        }}
        defaultValues={createBeurteilungenInitial
          ? ({ beurteilungsgegenstand: createBeurteilungenInitial } as any)
          : undefined}
        technischeAnforderungenList={[]}
        offenePunkteList={[]}
        informationsquellenList={informationsquellenList}
        kundenanfragenList={kundenanfragenList}
      />
    )}
    {createEntscheidungenOpen && (
      <EntscheidungenDialog
        open={createEntscheidungenOpen}
        onClose={() => setCreateEntscheidungenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createEntscheidungenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Entscheidungen;
            setExtraEntscheidungen(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.ENTSCHEIDUNGEN, result.id);
            setFields(prev => ({ ...prev, [createEntscheidungenField]: url } as any));
          }
          setCreateEntscheidungenOpen(false);
        }}
        defaultValues={createEntscheidungenInitial
          ? ({ titel: createEntscheidungenInitial } as any)
          : undefined}
        technischeAnforderungenList={[]}
        offenePunkteList={[]}
        beurteilungenList={beurteilungenList}
        entscheidungenList={entscheidungenList}
        kundenanfragenList={kundenanfragenList}
      />
    )}
    {createKundenanfragenOpen && (
      <KundenanfragenDialog
        open={createKundenanfragenOpen}
        onClose={() => setCreateKundenanfragenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createKundenanfragenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Kundenanfragen;
            setExtraKundenanfragen(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.KUNDENANFRAGEN, result.id);
            setFields(prev => ({ ...prev, [createKundenanfragenField]: url } as any));
          }
          setCreateKundenanfragenOpen(false);
        }}
        defaultValues={createKundenanfragenInitial
          ? ({ anfragenummer: createKundenanfragenInitial } as any)
          : undefined}
        kundenList={[]}
      />
    )}
    {createTechnischerAbschlussOpen && (
      <TechnischerAbschlussDialog
        open={createTechnischerAbschlussOpen}
        onClose={() => setCreateTechnischerAbschlussOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createTechnischerAbschlus(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as TechnischerAbschluss;
            setExtraTechnischerAbschluss(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.TECHNISCHER_ABSCHLUSS, result.id);
            setFields(prev => ({ ...prev, [createTechnischerAbschlussField]: url } as any));
          }
          setCreateTechnischerAbschlussOpen(false);
        }}
        defaultValues={createTechnischerAbschlussInitial
          ? ({ geprueft_von: createTechnischerAbschlussInitial } as any)
          : undefined}
        kundenanfragenList={kundenanfragenList}
      />
    )}
    </>
  );
}