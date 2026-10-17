/**
 * BeurteilungenDialog — pre-generated create/edit dialog for Beurteilungen.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * technischeAnforderungenList (full hook array — resolves the TechnischeAnforderungen applookup),
 * offenePunkteList (full hook array — resolves the OffenePunkte applookup),
 * informationsquellenList (full hook array — resolves the Informationsquellen applookup),
 * kundenanfragenList (full hook array — resolves the Kundenanfragen applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * BeurteilungenDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Beurteilungen['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<BeurteilungenDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Beurteilungen, TechnischeAnforderungen, OffenePunkte, Informationsquellen, Kundenanfragen, LookupValue } from '@/types/app';
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
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Beurteilungen';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Combobox, MultiCombobox } from '@/components/Combobox';
import { TechnischeAnforderungenDialog } from '@/components/dialogs/TechnischeAnforderungenDialog';
import { OffenePunkteDialog } from '@/components/dialogs/OffenePunkteDialog';
import { InformationsquellenDialog } from '@/components/dialogs/InformationsquellenDialog';
import { KundenanfragenDialog } from '@/components/dialogs/KundenanfragenDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for BeurteilungenDialog.defaultValues — see file header. */
export type BeurteilungenDialogDefaults = Omit<Beurteilungen['fields'], 'beurteilungsart' | 'einschaetzung' | 'pruefstatus'> & {
    beurteilungsart?: LookupValue | string;
    einschaetzung?: LookupValue | string;
    pruefstatus?: LookupValue | string;
  };

interface BeurteilungenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Beurteilungen['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: BeurteilungenDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  technischeAnforderungenList: TechnischeAnforderungen[];
  offenePunkteList: OffenePunkte[];
  informationsquellenList: Informationsquellen[];
  kundenanfragenList: Kundenanfragen[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  beurteilungsart: LOOKUP_OPTIONS['beurteilungen']?.['beurteilungsart'] ?? [],
  einschaetzung: LOOKUP_OPTIONS['beurteilungen']?.['einschaetzung'] ?? [],
  pruefstatus: LOOKUP_OPTIONS['beurteilungen']?.['pruefstatus'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  betroffene_anforderungen: APP_IDS.TECHNISCHE_ANFORDERUNGEN,
  betroffene_offene_punkte: APP_IDS.OFFENE_PUNKTE,
  zugrunde_liegende_quellen: APP_IDS.INFORMATIONSQUELLEN,
  anfrage: APP_IDS.KUNDENANFRAGEN,
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

export function BeurteilungenDialog({ open, onClose, onSubmit, defaultValues, recordId, technischeAnforderungenList, offenePunkteList, informationsquellenList, kundenanfragenList, enablePhotoScan = true, enablePhotoLocation = true }: BeurteilungenDialogProps) {
  const [fields, setFields] = useState<Partial<Beurteilungen['fields']>>({});
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
  // Inline-Create state for "TechnischeAnforderungen" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraTechnischeAnforderungen` list, and select it in
  // the originating Combobox via the captured `createTechnischeAnforderungenField`.
  const [createTechnischeAnforderungenOpen, setCreateTechnischeAnforderungenOpen] = useState(false);
  const [createTechnischeAnforderungenInitial, setCreateTechnischeAnforderungenInitial] = useState('');
  const [createTechnischeAnforderungenField, setCreateTechnischeAnforderungenField] = useState<string>('');
  const [extraTechnischeAnforderungen, setExtraTechnischeAnforderungen] = useState< TechnischeAnforderungen[]>([]);
  const technischeAnforderungenListAll = useMemo(
    () => [...technischeAnforderungenList, ...extraTechnischeAnforderungen],
    [technischeAnforderungenList, extraTechnischeAnforderungen],
  );
  function openCreateTechnischeAnforderungen(fieldKey: string, q: string) {
    setCreateTechnischeAnforderungenField(fieldKey);
    setCreateTechnischeAnforderungenInitial(q);
    setCreateTechnischeAnforderungenOpen(true);
  }
  // Inline-Create state for "OffenePunkte" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraOffenePunkte` list, and select it in
  // the originating Combobox via the captured `createOffenePunkteField`.
  const [createOffenePunkteOpen, setCreateOffenePunkteOpen] = useState(false);
  const [createOffenePunkteInitial, setCreateOffenePunkteInitial] = useState('');
  const [createOffenePunkteField, setCreateOffenePunkteField] = useState<string>('');
  const [extraOffenePunkte, setExtraOffenePunkte] = useState< OffenePunkte[]>([]);
  const offenePunkteListAll = useMemo(
    () => [...offenePunkteList, ...extraOffenePunkte],
    [offenePunkteList, extraOffenePunkte],
  );
  function openCreateOffenePunkte(fieldKey: string, q: string) {
    setCreateOffenePunkteField(fieldKey);
    setCreateOffenePunkteInitial(q);
    setCreateOffenePunkteOpen(true);
  }
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
  // Fields the plan assigns to a tool (empty without a plan).
  const SYSTEM_ASSIGNED: string[] = [];
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['anfrage', 'beurteilungsgegenstand', 'fachliche_begruendung'] as const;
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
      'betroffene_anforderungen': technischeAnforderungenList,
      'betroffene_offene_punkte': offenePunkteList,
      'zugrunde_liegende_quellen': informationsquellenList,
      'anfrage': kundenanfragenList,
    },
  }), [technischeAnforderungenList, offenePunkteList, informationsquellenList, kundenanfragenList, ]);
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
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<Beurteilungen['fields']>);
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
      const clean = cleanFieldsForApi(merged, 'beurteilungen');
      await onSubmit(clean as Beurteilungen['fields']);
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
      contextParts.push(`<available-records field="betroffene_anforderungen" entity="Technische Anforderungen">\n${JSON.stringify(technischeAnforderungenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="betroffene_offene_punkte" entity="Offene Punkte">\n${JSON.stringify(offenePunkteList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="zugrunde_liegende_quellen" entity="Informationsquellen">\n${JSON.stringify(informationsquellenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="anfrage" entity="Kundenanfragen">\n${JSON.stringify(kundenanfragenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "betroffene_anforderungen": string[] | null, // Display names from Technische Anforderungen, one per referenced record (see <available-records>)\n  "betroffene_offene_punkte": string[] | null, // Display names from Offene Punkte, one per referenced record (see <available-records>)\n  "zugrunde_liegende_quellen": string[] | null, // Display names from Informationsquellen, one per referenced record (see <available-records>)\n  "anfrage": string | null, // Display name from Kundenanfragen (see <available-records>)\n  "beurteilungsgegenstand": string | null, // Beurteilungsgegenstand\n  "beurteilungsart": LookupValue | null, // Beurteilungsart (select one key: "machbarkeit" | "vollstaendigkeit" | "risiko" | "qualitaet" | "normenkonformitaet" | "termin" | "kostenwirkung" | "herstellbarkeit" | "sonstiges") mapping: machbarkeit=Technische Machbarkeit, vollstaendigkeit=Vollständigkeit, risiko=Risiko, qualitaet=Qualität, normenkonformitaet=Normenkonformität, termin=Termin, kostenwirkung=Kostenwirkung, herstellbarkeit=Herstellbarkeit, sonstiges=Sonstiges\n  "einschaetzung": LookupValue | null, // Einschätzung (select one key: "positiv" | "bedingt_positiv" | "negativ" | "unklar" | "nicht_anwendbar") mapping: positiv=Positiv, bedingt_positiv=Bedingt positiv, negativ=Negativ, unklar=Unklar, nicht_anwendbar=Nicht anwendbar\n  "fachliche_begruendung": string | null, // Fachliche Begründung\n  "annahmen": string | null, // Annahmen\n  "unsicherheiten": string | null, // Unsicherheiten\n  "alternativen": string | null, // Alternativen\n  "empfehlung": string | null, // Empfehlung\n  "ist_ki_vorschlag": boolean | null, // Inhalt ist ein KI-Vorschlag\n  "erstellt_von": string | null, // Erstellt von\n  "erstellt_am": string | null, // YYYY-MM-DDTHH:MM\n  "pruefstatus": LookupValue | null, // Prüfstatus (select one key: "entwurf" | "fachlich_geprueft" | "bestaetigt" | "ueberholt") mapping: entwurf=Entwurf, fachlich_geprueft=Fachlich geprüft, bestaetigt=Bestätigt, ueberholt=Überholt\n  "geprueft_von": string | null, // Geprüft von\n  "geprueft_am": string | null, // YYYY-MM-DDTHH:MM\n  "erneute_pruefung": boolean | null, // Erneute Prüfung erforderlich\n}`;
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
        const applookupKeys = new Set<string>(["betroffene_anforderungen", "betroffene_offene_punkte", "zugrunde_liegende_quellen", "anfrage"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const betroffene_anforderungenNames = raw['betroffene_anforderungen'];
        if (Array.isArray(betroffene_anforderungenNames) && betroffene_anforderungenNames.length > 0) {
          const betroffene_anforderungenUrls = (betroffene_anforderungenNames as unknown[])
            .map(n => technischeAnforderungenList.find(r => matchName(String(n), [String(r.fields.bezeichnung ?? '')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.TECHNISCHE_ANFORDERUNGEN, r.record_id));
          if (betroffene_anforderungenUrls.length > 0) merged['betroffene_anforderungen'] = betroffene_anforderungenUrls;
        }
        const betroffene_offene_punkteNames = raw['betroffene_offene_punkte'];
        if (Array.isArray(betroffene_offene_punkteNames) && betroffene_offene_punkteNames.length > 0) {
          const betroffene_offene_punkteUrls = (betroffene_offene_punkteNames as unknown[])
            .map(n => offenePunkteList.find(r => matchName(String(n), [String(r.fields.kurztitel ?? '')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.OFFENE_PUNKTE, r.record_id));
          if (betroffene_offene_punkteUrls.length > 0) merged['betroffene_offene_punkte'] = betroffene_offene_punkteUrls;
        }
        const zugrunde_liegende_quellenNames = raw['zugrunde_liegende_quellen'];
        if (Array.isArray(zugrunde_liegende_quellenNames) && zugrunde_liegende_quellenNames.length > 0) {
          const zugrunde_liegende_quellenUrls = (zugrunde_liegende_quellenNames as unknown[])
            .map(n => informationsquellenList.find(r => matchName(String(n), [String(r.fields.titel ?? '')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, r.record_id));
          if (zugrunde_liegende_quellenUrls.length > 0) merged['zugrunde_liegende_quellen'] = zugrunde_liegende_quellenUrls;
        }
        const anfrageName = raw['anfrage'] as string | null;
        if (anfrageName) {
          const anfrageMatch = kundenanfragenList.find(r => matchName(anfrageName!, [String(r.fields.anfragenummer ?? '')]));
          if (anfrageMatch) merged['anfrage'] = createRecordUrl(APP_IDS.KUNDENANFRAGEN, anfrageMatch.record_id);
        }
        return merged as Partial<Beurteilungen['fields']>;
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
    ? t('edit_entity', { entity: appLabel('beurteilungen') })
    : t('new_entity', { entity: appLabel('beurteilungen') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'betroffene_anforderungen': (
      <div key="betroffene_anforderungen" className="space-y-1.5">
        <Label htmlFor="betroffene_anforderungen">{fieldLabel('beurteilungen', 'betroffene_anforderungen')}</Label>
        <MultiCombobox
          id="betroffene_anforderungen"
          placeholder="Welche Anforderungen?"
          items={technischeAnforderungenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.bezeichnung ?? r.record_id),
          }))}
          values={extractRecordIds(fields.betroffene_anforderungen)}
          onChange={ids => setFields(f => ({ ...f, betroffene_anforderungen: ids.length ? ids.map(id => createRecordUrl(APP_IDS.TECHNISCHE_ANFORDERUNGEN, id)) as any : undefined }))}
          onCreateNew={(q) => openCreateTechnischeAnforderungen("betroffene_anforderungen", q)}
          createLabel={t('create_in', { entity: appLabel('technische_anforderungen') })}
        />
      </div>
    ),
    'betroffene_offene_punkte': (
      <div key="betroffene_offene_punkte" className="space-y-1.5">
        <Label htmlFor="betroffene_offene_punkte">{fieldLabel('beurteilungen', 'betroffene_offene_punkte')}</Label>
        <MultiCombobox
          id="betroffene_offene_punkte"
          placeholder="Welche offenen Punkte?"
          items={offenePunkteListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.kurztitel ?? r.record_id),
          }))}
          values={extractRecordIds(fields.betroffene_offene_punkte)}
          onChange={ids => setFields(f => ({ ...f, betroffene_offene_punkte: ids.length ? ids.map(id => createRecordUrl(APP_IDS.OFFENE_PUNKTE, id)) as any : undefined }))}
          onCreateNew={(q) => openCreateOffenePunkte("betroffene_offene_punkte", q)}
          createLabel={t('create_in', { entity: appLabel('offene_punkte') })}
        />
      </div>
    ),
    'zugrunde_liegende_quellen': (
      <div key="zugrunde_liegende_quellen" className="space-y-1.5">
        <Label htmlFor="zugrunde_liegende_quellen">{fieldLabel('beurteilungen', 'zugrunde_liegende_quellen')}</Label>
        <MultiCombobox
          id="zugrunde_liegende_quellen"
          placeholder="Welche Quellen?"
          items={informationsquellenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.titel ?? r.record_id),
          }))}
          values={extractRecordIds(fields.zugrunde_liegende_quellen)}
          onChange={ids => setFields(f => ({ ...f, zugrunde_liegende_quellen: ids.length ? ids.map(id => createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, id)) as any : undefined }))}
          onCreateNew={(q) => openCreateInformationsquellen("zugrunde_liegende_quellen", q)}
          createLabel={t('create_in', { entity: appLabel('informationsquellen') })}
        />
      </div>
    ),
    'anfrage': (
      <div key="anfrage" className="space-y-1.5">
        <Label htmlFor="anfrage">{fieldLabel('beurteilungen', 'anfrage')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="anfrage"
          placeholder="Welche Anfrage?"
          items={kundenanfragenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.anfragenummer ?? r.record_id),
          }))}
          value={extractRecordId(fields.anfrage)}
          onChange={id => setFields(f => ({ ...f, anfrage: id ? createRecordUrl(APP_IDS.KUNDENANFRAGEN, id) : undefined }))}
          onCreateNew={(q) => openCreateKundenanfragen("anfrage", q)}
          createLabel={t('create_in', { entity: appLabel('kundenanfragen') })}
        />
        {showErrors && !fields.anfrage && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('beurteilungen', 'anfrage')}</p>
        )}
      </div>
    ),
    'beurteilungsgegenstand': (
      <div key="beurteilungsgegenstand" className="space-y-1.5">
        <Label htmlFor="beurteilungsgegenstand">{fieldLabel('beurteilungen', 'beurteilungsgegenstand')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="beurteilungsgegenstand"
          placeholder="z. B. Fräsen der Gehäuseteile"
          value={fields.beurteilungsgegenstand ?? ''}
          onChange={e => setFields(f => ({ ...f, beurteilungsgegenstand: e.target.value }))}
          required
        />
        {showErrors && !fields.beurteilungsgegenstand && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('beurteilungen', 'beurteilungsgegenstand')}</p>
        )}
      </div>
    ),
    'beurteilungsart': (
      <div key="beurteilungsart" className="space-y-1.5">
        <Label htmlFor="beurteilungsart">{fieldLabel('beurteilungen', 'beurteilungsart')}</Label>
        <Select
          value={lookupKey(fields.beurteilungsart) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, beurteilungsart: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="beurteilungsart" className="max-sm:h-11"><SelectValue placeholder="z. B. Risiko, Qualität" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="machbarkeit">{lookupLabel('beurteilungen', 'beurteilungsart', 'machbarkeit') ?? 'Technische Machbarkeit'}</SelectItem>
            <SelectItem value="vollstaendigkeit">{lookupLabel('beurteilungen', 'beurteilungsart', 'vollstaendigkeit') ?? 'Vollständigkeit'}</SelectItem>
            <SelectItem value="risiko">{lookupLabel('beurteilungen', 'beurteilungsart', 'risiko') ?? 'Risiko'}</SelectItem>
            <SelectItem value="qualitaet">{lookupLabel('beurteilungen', 'beurteilungsart', 'qualitaet') ?? 'Qualität'}</SelectItem>
            <SelectItem value="normenkonformitaet">{lookupLabel('beurteilungen', 'beurteilungsart', 'normenkonformitaet') ?? 'Normenkonformität'}</SelectItem>
            <SelectItem value="termin">{lookupLabel('beurteilungen', 'beurteilungsart', 'termin') ?? 'Termin'}</SelectItem>
            <SelectItem value="kostenwirkung">{lookupLabel('beurteilungen', 'beurteilungsart', 'kostenwirkung') ?? 'Kostenwirkung'}</SelectItem>
            <SelectItem value="herstellbarkeit">{lookupLabel('beurteilungen', 'beurteilungsart', 'herstellbarkeit') ?? 'Herstellbarkeit'}</SelectItem>
            <SelectItem value="sonstiges">{lookupLabel('beurteilungen', 'beurteilungsart', 'sonstiges') ?? 'Sonstiges'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    'einschaetzung': (
      <div key="einschaetzung" className="space-y-1.5">
        <Label htmlFor="einschaetzung">{fieldLabel('beurteilungen', 'einschaetzung')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.einschaetzung) === 'positiv'}
            onClick={() => setFields(f => ({ ...f, einschaetzung: (lookupKey(f.einschaetzung) === 'positiv' ? undefined : 'positiv') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.einschaetzung) === 'positiv'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('beurteilungen', 'einschaetzung', 'positiv') ?? 'Positiv'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.einschaetzung) === 'bedingt_positiv'}
            onClick={() => setFields(f => ({ ...f, einschaetzung: (lookupKey(f.einschaetzung) === 'bedingt_positiv' ? undefined : 'bedingt_positiv') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.einschaetzung) === 'bedingt_positiv'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('beurteilungen', 'einschaetzung', 'bedingt_positiv') ?? 'Bedingt positiv'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.einschaetzung) === 'negativ'}
            onClick={() => setFields(f => ({ ...f, einschaetzung: (lookupKey(f.einschaetzung) === 'negativ' ? undefined : 'negativ') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.einschaetzung) === 'negativ'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('beurteilungen', 'einschaetzung', 'negativ') ?? 'Negativ'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.einschaetzung) === 'unklar'}
            onClick={() => setFields(f => ({ ...f, einschaetzung: (lookupKey(f.einschaetzung) === 'unklar' ? undefined : 'unklar') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.einschaetzung) === 'unklar'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('beurteilungen', 'einschaetzung', 'unklar') ?? 'Unklar'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.einschaetzung) === 'nicht_anwendbar'}
            onClick={() => setFields(f => ({ ...f, einschaetzung: (lookupKey(f.einschaetzung) === 'nicht_anwendbar' ? undefined : 'nicht_anwendbar') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.einschaetzung) === 'nicht_anwendbar'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('beurteilungen', 'einschaetzung', 'nicht_anwendbar') ?? 'Nicht anwendbar'}
          </button>
        </div>
      </div>
    ),
    'fachliche_begruendung': (
      <div key="fachliche_begruendung" className="space-y-1.5">
        <Label htmlFor="fachliche_begruendung">{fieldLabel('beurteilungen', 'fachliche_begruendung')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="fachliche_begruendung"
          placeholder="Was spricht dafür oder dagegen?"
          value={fields.fachliche_begruendung ?? ''}
          onChange={e => setFields(f => ({ ...f, fachliche_begruendung: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.fachliche_begruendung && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('beurteilungen', 'fachliche_begruendung')}</p>
        )}
      </div>
    ),
    'annahmen': (
      <div key="annahmen" className="space-y-1.5">
        <Label htmlFor="annahmen">{fieldLabel('beurteilungen', 'annahmen')}</Label>
        <Textarea
          id="annahmen"
          placeholder="Eine Annahme pro Zeile"
          value={fields.annahmen ?? ''}
          onChange={e => setFields(f => ({ ...f, annahmen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'unsicherheiten': (
      <div key="unsicherheiten" className="space-y-1.5">
        <Label htmlFor="unsicherheiten">{fieldLabel('beurteilungen', 'unsicherheiten')}</Label>
        <Textarea
          id="unsicherheiten"
          placeholder="Eine Unsicherheit pro Zeile"
          value={fields.unsicherheiten ?? ''}
          onChange={e => setFields(f => ({ ...f, unsicherheiten: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'alternativen': (
      <div key="alternativen" className="space-y-1.5">
        <Label htmlFor="alternativen">{fieldLabel('beurteilungen', 'alternativen')}</Label>
        <Textarea
          id="alternativen"
          placeholder="Eine Alternative pro Zeile"
          value={fields.alternativen ?? ''}
          onChange={e => setFields(f => ({ ...f, alternativen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'empfehlung': (
      <div key="empfehlung" className="space-y-1.5">
        <Label htmlFor="empfehlung">{fieldLabel('beurteilungen', 'empfehlung')}</Label>
        <Textarea
          id="empfehlung"
          placeholder="Was wird empfohlen?"
          value={fields.empfehlung ?? ''}
          onChange={e => setFields(f => ({ ...f, empfehlung: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'ist_ki_vorschlag': (
      <div key="ist_ki_vorschlag" className="space-y-1.5">
        <Label htmlFor="ist_ki_vorschlag">{fieldLabel('beurteilungen', 'ist_ki_vorschlag')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="ist_ki_vorschlag"
            checked={!!fields.ist_ki_vorschlag}
            onCheckedChange={(v) => setFields(f => ({ ...f, ist_ki_vorschlag: !!v }))}
          />
          <Label htmlFor="ist_ki_vorschlag" className="font-normal">{fieldLabel('beurteilungen', 'ist_ki_vorschlag')}</Label>
        </div>
      </div>
    ),
    'erstellt_von': (
      <div key="erstellt_von" className="space-y-1.5">
        <Label htmlFor="erstellt_von">{fieldLabel('beurteilungen', 'erstellt_von')}</Label>
        <Input
          id="erstellt_von"
          placeholder="z. B. Anna Schmidt"
          value={fields.erstellt_von ?? ''}
          onChange={e => setFields(f => ({ ...f, erstellt_von: e.target.value }))}
        />
      </div>
    ),
    'erstellt_am': (
      <div key="erstellt_am" className="space-y-1.5">
        <Label htmlFor="erstellt_am">{fieldLabel('beurteilungen', 'erstellt_am')}</Label>
        <DatePicker
          id="erstellt_am"
          placeholder="Wann wurde sie erstellt?"
          mode="datetime"
          value={fields.erstellt_am ?? null}
          onChange={v => setFields(f => ({ ...f, erstellt_am: v ?? undefined }))}
        />
      </div>
    ),
    'pruefstatus': (
      <div key="pruefstatus" className="space-y-1.5">
        <Label htmlFor="pruefstatus">{fieldLabel('beurteilungen', 'pruefstatus')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.pruefstatus) === 'entwurf'}
            onClick={() => setFields(f => ({ ...f, pruefstatus: (lookupKey(f.pruefstatus) === 'entwurf' ? undefined : 'entwurf') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.pruefstatus) === 'entwurf'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('beurteilungen', 'pruefstatus', 'entwurf') ?? 'Entwurf'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.pruefstatus) === 'fachlich_geprueft'}
            onClick={() => setFields(f => ({ ...f, pruefstatus: (lookupKey(f.pruefstatus) === 'fachlich_geprueft' ? undefined : 'fachlich_geprueft') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.pruefstatus) === 'fachlich_geprueft'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('beurteilungen', 'pruefstatus', 'fachlich_geprueft') ?? 'Fachlich geprüft'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.pruefstatus) === 'bestaetigt'}
            onClick={() => setFields(f => ({ ...f, pruefstatus: (lookupKey(f.pruefstatus) === 'bestaetigt' ? undefined : 'bestaetigt') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.pruefstatus) === 'bestaetigt'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('beurteilungen', 'pruefstatus', 'bestaetigt') ?? 'Bestätigt'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.pruefstatus) === 'ueberholt'}
            onClick={() => setFields(f => ({ ...f, pruefstatus: (lookupKey(f.pruefstatus) === 'ueberholt' ? undefined : 'ueberholt') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.pruefstatus) === 'ueberholt'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('beurteilungen', 'pruefstatus', 'ueberholt') ?? 'Überholt'}
          </button>
        </div>
      </div>
    ),
    'geprueft_von': (
      <div key="geprueft_von" className="space-y-1.5">
        <Label htmlFor="geprueft_von">{fieldLabel('beurteilungen', 'geprueft_von')}</Label>
        <Input
          id="geprueft_von"
          placeholder="z. B. Max Weber"
          value={fields.geprueft_von ?? ''}
          onChange={e => setFields(f => ({ ...f, geprueft_von: e.target.value }))}
        />
      </div>
    ),
    'geprueft_am': (
      <div key="geprueft_am" className="space-y-1.5">
        <Label htmlFor="geprueft_am">{fieldLabel('beurteilungen', 'geprueft_am')}</Label>
        <DatePicker
          id="geprueft_am"
          placeholder="Wann wurde geprüft?"
          mode="datetime"
          value={fields.geprueft_am ?? null}
          onChange={v => setFields(f => ({ ...f, geprueft_am: v ?? undefined }))}
        />
      </div>
    ),
    'erneute_pruefung': (
      <div key="erneute_pruefung" className="space-y-1.5">
        <Label htmlFor="erneute_pruefung">{fieldLabel('beurteilungen', 'erneute_pruefung')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="erneute_pruefung"
            checked={!!fields.erneute_pruefung}
            onCheckedChange={(v) => setFields(f => ({ ...f, erneute_pruefung: !!v }))}
          />
          <Label htmlFor="erneute_pruefung" className="font-normal">{fieldLabel('beurteilungen', 'erneute_pruefung')}</Label>
        </div>
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
  const FIELD_LABELS: Record<string, string> = {"betroffene_anforderungen": "Betroffene Anforderungen", "betroffene_offene_punkte": "Betroffene offene Punkte", "zugrunde_liegende_quellen": "Zugrunde liegende Quellen", "anfrage": "Anfrage", "beurteilungsgegenstand": "Beurteilungsgegenstand", "beurteilungsart": "Beurteilungsart", "einschaetzung": "Einschätzung", "fachliche_begruendung": "Fachliche Begründung", "annahmen": "Annahmen", "unsicherheiten": "Unsicherheiten", "alternativen": "Alternativen", "empfehlung": "Empfehlung", "ist_ki_vorschlag": "Inhalt ist ein KI-Vorschlag", "erstellt_von": "Erstellt von", "erstellt_am": "Erstellt am", "pruefstatus": "Prüfstatus", "geprueft_von": "Geprüft von", "geprueft_am": "Geprüft am", "erneute_pruefung": "Erneute Prüfung erforderlich"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"betroffene_anforderungen": {"anfrage": "Anfrage", "bezeichnung": "Bezeichnung", "beschreibung": "Beschreibung", "anforderungstyp": "Anforderungstyp", "ursprung": "Ursprung", "sollwert": "Sollwert", "einheit": "Einheit", "vergleichsoperator": "Vergleichsoperator", "min_wert": "Mindestwert", "max_wert": "Höchstwert", "ist_pflichtanforderung": "Pflichtanforderung", "pruefstatus": "Prüfstatus", "begruendung_pruefstatus": "Begründung zum Prüfstatus", "verantwortlicher_vorname": "Verantwortlicher Vorname", "verantwortlicher_nachname": "Verantwortlicher Nachname", "gueltig_ab": "Gültig ab", "gueltig_bis": "Gültig bis", "erneute_pruefung": "Erneute Prüfung erforderlich", "quellen": "Quellen"}, "betroffene_offene_punkte": {"betroffene_anforderungen": "Betroffene Anforderungen", "betroffene_quellen": "Betroffene Quellen", "anfrage": "Anfrage", "kurztitel": "Kurztitel", "beschreibung": "Beschreibung und Grund", "punktetyp": "Punktetyp", "prioritaet": "Priorität", "auswirkung": "Auswirkung", "zustaendige_rolle": "Zuständige Rolle", "verantwortlicher_vorname": "Verantwortlicher Vorname", "verantwortlicher_nachname": "Verantwortlicher Nachname", "faellig_am": "Fällig am", "status": "Status", "erledigungskriterium": "Erledigungskriterium", "loesung_oder_ergebnis": "Lösung oder Ergebnis", "antwort_geprueft": "Eingegangene Antwort wurde fachlich geprüft", "abgeschlossen_am": "Abgeschlossen am", "abschluss_durch": "Abgeschlossen durch", "erneute_pruefung": "Erneute Prüfung erforderlich"}, "zugrunde_liegende_quellen": {"eingangszeitpunkt": "Eingang", "versionskennung": "Versionskennung", "quellenstatus": "Quellenstatus", "zusammenfassung": "Inhaltliche Zusammenfassung", "extraktionsstatus": "Extraktionsstatus", "pruefung_durch": "Geprüft durch", "pruefung_am": "Geprüft am", "erneute_pruefung": "Erneute Prüfung der betroffenen Objekte erforderlich", "bemerkung": "Bemerkung", "ersetzt_quelle": "Ersetzt Quelle", "anfrage": "Anfrage", "quellentyp": "Quellentyp", "titel": "Titel", "datei": "Datei", "referenz_url": "Webadresse oder Referenz", "urheber": "Absender oder Urheber", "quellendatum": "Quellendatum"}, "anfrage": {"anfragenummer": "Anfragenummer", "kunde": "Kunde", "eingangsdatum": "Eingangsdatum", "eingangskanal": "Eingangskanal", "kundenreferenz": "Kundenreferenz", "kontakt_vorname": "Ansprechpartner zur Anfrage Vorname", "kontakt_nachname": "Ansprechpartner zur Anfrage Nachname", "kontakt_email": "E-Mail zur Anfrage", "produktfamilie": "Produkt oder Produktfamilie", "produktvariante": "Produktvariante", "gewuenschte_menge": "Gewünschte Menge (größer als 0)", "gewuenschter_liefertermin": "Gewünschter Liefertermin", "anfragebeschreibung": "Anfragebeschreibung", "urspruengliche_kundenanforderungen": "Ursprüngliche Kundenanforderungen (unverändert)", "prioritaet": "Priorität", "verantwortlicher_vorname": "Verantwortlicher Vorname", "verantwortlicher_nachname": "Verantwortlicher Nachname", "status": "Status", "klaeraufwand": "Technischer Kläraufwand", "zieltermin_klaerung": "Zieltermin der Klärung", "vollstaendigkeit": "Vollständigkeit", "schaetzung_bearbeitung_min": "Geschätzte aktive Bearbeitungszeit (Minuten)", "gemessen_bearbeitung_min": "Gemessene aktive Bearbeitungszeit (Minuten)", "wartezeit_kunde_min": "Gemessene Wartezeit auf Kunde (Minuten)", "wartezeit_intern_min": "Gemessene interne Wartezeit (Minuten)", "geklaert_am": "Technisch geklärt am", "anzahl_nachtraegliche_aenderungen": "Anzahl nachträglicher Änderungen", "anzahl_nacharbeiten": "Anzahl erforderlicher Nacharbeiten"}};
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
                      <Label>{fieldLabel('beurteilungen', k)}</Label>
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
                <AttachmentsSection appId={APP_IDS.BEURTEILUNGEN} recordId={recordId} />
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
    {createTechnischeAnforderungenOpen && (
      <TechnischeAnforderungenDialog
        open={createTechnischeAnforderungenOpen}
        onClose={() => setCreateTechnischeAnforderungenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createTechnischeAnforderungenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as TechnischeAnforderungen;
            setExtraTechnischeAnforderungen(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.TECHNISCHE_ANFORDERUNGEN, result.id);
            setFields(prev => ({ ...prev, [createTechnischeAnforderungenField]: url } as any));
          }
          setCreateTechnischeAnforderungenOpen(false);
        }}
        defaultValues={createTechnischeAnforderungenInitial
          ? ({ bezeichnung: createTechnischeAnforderungenInitial } as any)
          : undefined}
        kundenanfragenList={kundenanfragenList}
        informationsquellenList={informationsquellenList}
      />
    )}
    {createOffenePunkteOpen && (
      <OffenePunkteDialog
        open={createOffenePunkteOpen}
        onClose={() => setCreateOffenePunkteOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createOffenePunkteEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as OffenePunkte;
            setExtraOffenePunkte(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.OFFENE_PUNKTE, result.id);
            setFields(prev => ({ ...prev, [createOffenePunkteField]: url } as any));
          }
          setCreateOffenePunkteOpen(false);
        }}
        defaultValues={createOffenePunkteInitial
          ? ({ kurztitel: createOffenePunkteInitial } as any)
          : undefined}
        technischeAnforderungenList={technischeAnforderungenList}
        informationsquellenList={informationsquellenList}
        kundenanfragenList={kundenanfragenList}
      />
    )}
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
    </>
  );
}