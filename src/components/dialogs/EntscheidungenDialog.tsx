/**
 * EntscheidungenDialog — pre-generated create/edit dialog for Entscheidungen.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * technischeAnforderungenList (full hook array — resolves the TechnischeAnforderungen applookup),
 * offenePunkteList (full hook array — resolves the OffenePunkte applookup),
 * beurteilungenList (full hook array — resolves the Beurteilungen applookup),
 * entscheidungenList (full hook array — resolves the Entscheidungen applookup),
 * kundenanfragenList (full hook array — resolves the Kundenanfragen applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * EntscheidungenDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Entscheidungen['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<EntscheidungenDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Entscheidungen, TechnischeAnforderungen, OffenePunkte, Beurteilungen, Kundenanfragen, LookupValue } from '@/types/app';
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
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Entscheidungen';
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
import { BeurteilungenDialog } from '@/components/dialogs/BeurteilungenDialog';
import { KundenanfragenDialog } from '@/components/dialogs/KundenanfragenDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for EntscheidungenDialog.defaultValues — see file header. */
export type EntscheidungenDialogDefaults = Omit<Entscheidungen['fields'], 'entscheidungstyp' | 'entscheidungsstatus'> & {
    entscheidungstyp?: LookupValue | string;
    entscheidungsstatus?: LookupValue | string;
  };

interface EntscheidungenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Entscheidungen['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: EntscheidungenDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  technischeAnforderungenList: TechnischeAnforderungen[];
  offenePunkteList: OffenePunkte[];
  beurteilungenList: Beurteilungen[];
  entscheidungenList: Entscheidungen[];
  kundenanfragenList: Kundenanfragen[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  entscheidungstyp: LOOKUP_OPTIONS['entscheidungen']?.['entscheidungstyp'] ?? [],
  entscheidungsstatus: LOOKUP_OPTIONS['entscheidungen']?.['entscheidungsstatus'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  betroffene_anforderungen: APP_IDS.TECHNISCHE_ANFORDERUNGEN,
  betroffene_offene_punkte: APP_IDS.OFFENE_PUNKTE,
  zugrunde_liegende_beurteilungen: APP_IDS.BEURTEILUNGEN,
  ersetzt_durch_entscheidung: APP_IDS.ENTSCHEIDUNGEN,
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

export function EntscheidungenDialog({ open, onClose, onSubmit, defaultValues, recordId, technischeAnforderungenList, offenePunkteList, beurteilungenList, entscheidungenList, kundenanfragenList, enablePhotoScan = true, enablePhotoLocation = true }: EntscheidungenDialogProps) {
  const [fields, setFields] = useState<Partial<Entscheidungen['fields']>>({});
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
  const REQUIRED_FIELDS = ['anfrage', 'titel', 'entscheidungsgegenstand', 'entscheidung', 'begruendung', 'verantwortlicher_vorname', 'verantwortlicher_nachname', 'entscheidungsstatus'] as const;
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
      'zugrunde_liegende_beurteilungen': beurteilungenList,
      'ersetzt_durch_entscheidung': entscheidungenList,
      'anfrage': kundenanfragenList,
    },
  }), [technischeAnforderungenList, offenePunkteList, beurteilungenList, entscheidungenList, kundenanfragenList, ]);
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
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<Entscheidungen['fields']>);
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
      const clean = cleanFieldsForApi(merged, 'entscheidungen');
      await onSubmit(clean as Entscheidungen['fields']);
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
      contextParts.push(`<available-records field="zugrunde_liegende_beurteilungen" entity="Beurteilungen">\n${JSON.stringify(beurteilungenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="ersetzt_durch_entscheidung" entity="Entscheidungen">\n${JSON.stringify(entscheidungenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
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
      const schema = `{\n  "betroffene_anforderungen": string[] | null, // Display names from Technische Anforderungen, one per referenced record (see <available-records>)\n  "betroffene_offene_punkte": string[] | null, // Display names from Offene Punkte, one per referenced record (see <available-records>)\n  "zugrunde_liegende_beurteilungen": string[] | null, // Display names from Beurteilungen, one per referenced record (see <available-records>)\n  "ersetzt_durch_entscheidung": string | null, // Display name from Entscheidungen (see <available-records>)\n  "anfrage": string | null, // Display name from Kundenanfragen (see <available-records>)\n  "titel": string | null, // Titel\n  "entscheidungsgegenstand": string | null, // Entscheidungsgegenstand\n  "entscheidungstyp": LookupValue | null, // Entscheidungstyp (select one key: "technische_freigabe" | "abweichung_akzeptieren" | "alternative_auswaehlen" | "anforderung_aendern" | "risiko_akzeptieren" | "rueckfrage_abschliessen" | "ablehnung" | "eskalation" | "sonstiges") mapping: technische_freigabe=Technische Freigabe, abweichung_akzeptieren=Abweichung akzeptieren, alternative_auswaehlen=Alternative auswählen, anforderung_aendern=Anforderung ändern, risiko_akzeptieren=Risiko akzeptieren, rueckfrage_abschliessen=Rückfrage abschließen, ablehnung=Ablehnung, eskalation=Eskalation, sonstiges=Sonstiges\n  "alternativen": string | null, // Alternativen\n  "entscheidung": string | null, // Entscheidung\n  "begruendung": string | null, // Begründung\n  "verantwortlicher_vorname": string | null, // Entscheidungsverantwortlicher Vorname\n  "verantwortlicher_nachname": string | null, // Entscheidungsverantwortlicher Nachname\n  "kompetenz_geprueft": boolean | null, // Entscheidungskompetenz geprüft\n  "entscheidungsstatus": LookupValue | null, // Entscheidungsstatus (select one key: "vorbereitung" | "zur_entscheidung" | "entschieden" | "zurueckgestellt" | "ersetzt") mapping: vorbereitung=Vorbereitung, zur_entscheidung=Zur Entscheidung, entschieden=Entschieden, zurueckgestellt=Zurückgestellt, ersetzt=Ersetzt\n  "entscheidungsdatum": string | null, // YYYY-MM-DDTHH:MM\n  "auflagen": string | null, // Auflagen\n  "gueltig_bis": string | null, // YYYY-MM-DD\n  "ergebnis": string | null, // Ergebnis\n  "erneute_pruefung": boolean | null, // Erneute Prüfung erforderlich\n}`;
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
        const applookupKeys = new Set<string>(["betroffene_anforderungen", "betroffene_offene_punkte", "zugrunde_liegende_beurteilungen", "ersetzt_durch_entscheidung", "anfrage"]);
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
        const zugrunde_liegende_beurteilungenNames = raw['zugrunde_liegende_beurteilungen'];
        if (Array.isArray(zugrunde_liegende_beurteilungenNames) && zugrunde_liegende_beurteilungenNames.length > 0) {
          const zugrunde_liegende_beurteilungenUrls = (zugrunde_liegende_beurteilungenNames as unknown[])
            .map(n => beurteilungenList.find(r => matchName(String(n), [String(r.fields.beurteilungsgegenstand ?? '')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.BEURTEILUNGEN, r.record_id));
          if (zugrunde_liegende_beurteilungenUrls.length > 0) merged['zugrunde_liegende_beurteilungen'] = zugrunde_liegende_beurteilungenUrls;
        }
        const ersetzt_durch_entscheidungName = raw['ersetzt_durch_entscheidung'] as string | null;
        if (ersetzt_durch_entscheidungName) {
          const ersetzt_durch_entscheidungMatch = entscheidungenList.find(r => matchName(ersetzt_durch_entscheidungName!, [String(r.fields.titel ?? '')]));
          if (ersetzt_durch_entscheidungMatch) merged['ersetzt_durch_entscheidung'] = createRecordUrl(APP_IDS.ENTSCHEIDUNGEN, ersetzt_durch_entscheidungMatch.record_id);
        }
        const anfrageName = raw['anfrage'] as string | null;
        if (anfrageName) {
          const anfrageMatch = kundenanfragenList.find(r => matchName(anfrageName!, [String(r.fields.anfragenummer ?? '')]));
          if (anfrageMatch) merged['anfrage'] = createRecordUrl(APP_IDS.KUNDENANFRAGEN, anfrageMatch.record_id);
        }
        return merged as Partial<Entscheidungen['fields']>;
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
    ? t('edit_entity', { entity: appLabel('entscheidungen') })
    : t('new_entity', { entity: appLabel('entscheidungen') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'betroffene_anforderungen': (
      <div key="betroffene_anforderungen" className="space-y-1.5">
        <Label htmlFor="betroffene_anforderungen">{fieldLabel('entscheidungen', 'betroffene_anforderungen')}</Label>
        <MultiCombobox
          id="betroffene_anforderungen"
          placeholder=""
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
        <Label htmlFor="betroffene_offene_punkte">{fieldLabel('entscheidungen', 'betroffene_offene_punkte')}</Label>
        <MultiCombobox
          id="betroffene_offene_punkte"
          placeholder=""
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
    'zugrunde_liegende_beurteilungen': (
      <div key="zugrunde_liegende_beurteilungen" className="space-y-1.5">
        <Label htmlFor="zugrunde_liegende_beurteilungen">{fieldLabel('entscheidungen', 'zugrunde_liegende_beurteilungen')}</Label>
        <MultiCombobox
          id="zugrunde_liegende_beurteilungen"
          placeholder=""
          items={beurteilungenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.beurteilungsgegenstand ?? r.record_id),
          }))}
          values={extractRecordIds(fields.zugrunde_liegende_beurteilungen)}
          onChange={ids => setFields(f => ({ ...f, zugrunde_liegende_beurteilungen: ids.length ? ids.map(id => createRecordUrl(APP_IDS.BEURTEILUNGEN, id)) as any : undefined }))}
          onCreateNew={(q) => openCreateBeurteilungen("zugrunde_liegende_beurteilungen", q)}
          createLabel={t('create_in', { entity: appLabel('beurteilungen') })}
        />
      </div>
    ),
    'ersetzt_durch_entscheidung': (
      <div key="ersetzt_durch_entscheidung" className="space-y-1.5">
        <Label htmlFor="ersetzt_durch_entscheidung">{fieldLabel('entscheidungen', 'ersetzt_durch_entscheidung')}</Label>
        <Combobox
          id="ersetzt_durch_entscheidung"
          placeholder=""
          items={entscheidungenList.map(r => ({
            id: r.record_id,
            label: String(r.fields.titel ?? r.record_id),
          }))}
          value={extractRecordId(fields.ersetzt_durch_entscheidung)}
          onChange={id => setFields(f => ({ ...f, ersetzt_durch_entscheidung: id ? createRecordUrl(APP_IDS.ENTSCHEIDUNGEN, id) : undefined }))}
        />
      </div>
    ),
    'anfrage': (
      <div key="anfrage" className="space-y-1.5">
        <Label htmlFor="anfrage">{fieldLabel('entscheidungen', 'anfrage')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="anfrage"
          placeholder=""
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
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'anfrage')}</p>
        )}
      </div>
    ),
    'titel': (
      <div key="titel" className="space-y-1.5">
        <Label htmlFor="titel">{fieldLabel('entscheidungen', 'titel')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="titel"
          placeholder=""
          value={fields.titel ?? ''}
          onChange={e => setFields(f => ({ ...f, titel: e.target.value }))}
          required
        />
        {showErrors && !fields.titel && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'titel')}</p>
        )}
      </div>
    ),
    'entscheidungsgegenstand': (
      <div key="entscheidungsgegenstand" className="space-y-1.5">
        <Label htmlFor="entscheidungsgegenstand">{fieldLabel('entscheidungen', 'entscheidungsgegenstand')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="entscheidungsgegenstand"
          placeholder=""
          value={fields.entscheidungsgegenstand ?? ''}
          onChange={e => setFields(f => ({ ...f, entscheidungsgegenstand: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.entscheidungsgegenstand && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'entscheidungsgegenstand')}</p>
        )}
      </div>
    ),
    'entscheidungstyp': (
      <div key="entscheidungstyp" className="space-y-1.5">
        <Label htmlFor="entscheidungstyp">{fieldLabel('entscheidungen', 'entscheidungstyp')}</Label>
        <Select
          value={lookupKey(fields.entscheidungstyp) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, entscheidungstyp: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="entscheidungstyp" className="max-sm:h-11"><SelectValue placeholder="" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="technische_freigabe">{lookupLabel('entscheidungen', 'entscheidungstyp', 'technische_freigabe') ?? 'Technische Freigabe'}</SelectItem>
            <SelectItem value="abweichung_akzeptieren">{lookupLabel('entscheidungen', 'entscheidungstyp', 'abweichung_akzeptieren') ?? 'Abweichung akzeptieren'}</SelectItem>
            <SelectItem value="alternative_auswaehlen">{lookupLabel('entscheidungen', 'entscheidungstyp', 'alternative_auswaehlen') ?? 'Alternative auswählen'}</SelectItem>
            <SelectItem value="anforderung_aendern">{lookupLabel('entscheidungen', 'entscheidungstyp', 'anforderung_aendern') ?? 'Anforderung ändern'}</SelectItem>
            <SelectItem value="risiko_akzeptieren">{lookupLabel('entscheidungen', 'entscheidungstyp', 'risiko_akzeptieren') ?? 'Risiko akzeptieren'}</SelectItem>
            <SelectItem value="rueckfrage_abschliessen">{lookupLabel('entscheidungen', 'entscheidungstyp', 'rueckfrage_abschliessen') ?? 'Rückfrage abschließen'}</SelectItem>
            <SelectItem value="ablehnung">{lookupLabel('entscheidungen', 'entscheidungstyp', 'ablehnung') ?? 'Ablehnung'}</SelectItem>
            <SelectItem value="eskalation">{lookupLabel('entscheidungen', 'entscheidungstyp', 'eskalation') ?? 'Eskalation'}</SelectItem>
            <SelectItem value="sonstiges">{lookupLabel('entscheidungen', 'entscheidungstyp', 'sonstiges') ?? 'Sonstiges'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    'alternativen': (
      <div key="alternativen" className="space-y-1.5">
        <Label htmlFor="alternativen">{fieldLabel('entscheidungen', 'alternativen')}</Label>
        <Textarea
          id="alternativen"
          placeholder=""
          value={fields.alternativen ?? ''}
          onChange={e => setFields(f => ({ ...f, alternativen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'entscheidung': (
      <div key="entscheidung" className="space-y-1.5">
        <Label htmlFor="entscheidung">{fieldLabel('entscheidungen', 'entscheidung')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="entscheidung"
          placeholder=""
          value={fields.entscheidung ?? ''}
          onChange={e => setFields(f => ({ ...f, entscheidung: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.entscheidung && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'entscheidung')}</p>
        )}
      </div>
    ),
    'begruendung': (
      <div key="begruendung" className="space-y-1.5">
        <Label htmlFor="begruendung">{fieldLabel('entscheidungen', 'begruendung')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="begruendung"
          placeholder=""
          value={fields.begruendung ?? ''}
          onChange={e => setFields(f => ({ ...f, begruendung: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.begruendung && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'begruendung')}</p>
        )}
      </div>
    ),
    'verantwortlicher_vorname': (
      <div key="verantwortlicher_vorname" className="space-y-1.5">
        <Label htmlFor="verantwortlicher_vorname">{fieldLabel('entscheidungen', 'verantwortlicher_vorname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="verantwortlicher_vorname"
          placeholder=""
          value={fields.verantwortlicher_vorname ?? ''}
          onChange={e => setFields(f => ({ ...f, verantwortlicher_vorname: e.target.value }))}
          required
        />
        {showErrors && !fields.verantwortlicher_vorname && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'verantwortlicher_vorname')}</p>
        )}
      </div>
    ),
    'verantwortlicher_nachname': (
      <div key="verantwortlicher_nachname" className="space-y-1.5">
        <Label htmlFor="verantwortlicher_nachname">{fieldLabel('entscheidungen', 'verantwortlicher_nachname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="verantwortlicher_nachname"
          placeholder=""
          value={fields.verantwortlicher_nachname ?? ''}
          onChange={e => setFields(f => ({ ...f, verantwortlicher_nachname: e.target.value }))}
          required
        />
        {showErrors && !fields.verantwortlicher_nachname && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'verantwortlicher_nachname')}</p>
        )}
      </div>
    ),
    'kompetenz_geprueft': (
      <div key="kompetenz_geprueft" className="space-y-1.5">
        <Label htmlFor="kompetenz_geprueft">{fieldLabel('entscheidungen', 'kompetenz_geprueft')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="kompetenz_geprueft"
            checked={!!fields.kompetenz_geprueft}
            onCheckedChange={(v) => setFields(f => ({ ...f, kompetenz_geprueft: !!v }))}
          />
          <Label htmlFor="kompetenz_geprueft" className="font-normal">{fieldLabel('entscheidungen', 'kompetenz_geprueft')}</Label>
        </div>
      </div>
    ),
    'entscheidungsstatus': (
      <div key="entscheidungsstatus" className="space-y-1.5">
        <Label htmlFor="entscheidungsstatus">{fieldLabel('entscheidungen', 'entscheidungsstatus')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.entscheidungsstatus) === 'vorbereitung'}
            onClick={() => setFields(f => ({ ...f, entscheidungsstatus: (lookupKey(f.entscheidungsstatus) === 'vorbereitung' ? undefined : 'vorbereitung') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.entscheidungsstatus) === 'vorbereitung'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'entscheidungsstatus', 'vorbereitung') ?? 'Vorbereitung'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.entscheidungsstatus) === 'zur_entscheidung'}
            onClick={() => setFields(f => ({ ...f, entscheidungsstatus: (lookupKey(f.entscheidungsstatus) === 'zur_entscheidung' ? undefined : 'zur_entscheidung') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.entscheidungsstatus) === 'zur_entscheidung'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'entscheidungsstatus', 'zur_entscheidung') ?? 'Zur Entscheidung'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.entscheidungsstatus) === 'entschieden'}
            onClick={() => setFields(f => ({ ...f, entscheidungsstatus: (lookupKey(f.entscheidungsstatus) === 'entschieden' ? undefined : 'entschieden') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.entscheidungsstatus) === 'entschieden'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'entscheidungsstatus', 'entschieden') ?? 'Entschieden'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.entscheidungsstatus) === 'zurueckgestellt'}
            onClick={() => setFields(f => ({ ...f, entscheidungsstatus: (lookupKey(f.entscheidungsstatus) === 'zurueckgestellt' ? undefined : 'zurueckgestellt') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.entscheidungsstatus) === 'zurueckgestellt'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'entscheidungsstatus', 'zurueckgestellt') ?? 'Zurückgestellt'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.entscheidungsstatus) === 'ersetzt'}
            onClick={() => setFields(f => ({ ...f, entscheidungsstatus: (lookupKey(f.entscheidungsstatus) === 'ersetzt' ? undefined : 'ersetzt') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.entscheidungsstatus) === 'ersetzt'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('entscheidungen', 'entscheidungsstatus', 'ersetzt') ?? 'Ersetzt'}
          </button>
        </div>
        {showErrors && !fields.entscheidungsstatus && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('entscheidungen', 'entscheidungsstatus')}</p>
        )}
      </div>
    ),
    'entscheidungsdatum': (
      <div key="entscheidungsdatum" className="space-y-1.5">
        <Label htmlFor="entscheidungsdatum">{fieldLabel('entscheidungen', 'entscheidungsdatum')}</Label>
        <DatePicker
          id="entscheidungsdatum"
          placeholder=""
          mode="datetime"
          value={fields.entscheidungsdatum ?? null}
          onChange={v => setFields(f => ({ ...f, entscheidungsdatum: v ?? undefined }))}
        />
      </div>
    ),
    'auflagen': (
      <div key="auflagen" className="space-y-1.5">
        <Label htmlFor="auflagen">{fieldLabel('entscheidungen', 'auflagen')}</Label>
        <Textarea
          id="auflagen"
          placeholder=""
          value={fields.auflagen ?? ''}
          onChange={e => setFields(f => ({ ...f, auflagen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'gueltig_bis': (
      <div key="gueltig_bis" className="space-y-1.5">
        <Label htmlFor="gueltig_bis">{fieldLabel('entscheidungen', 'gueltig_bis')}</Label>
        <DatePicker
          id="gueltig_bis"
          placeholder=""
          mode="date"
          value={fields.gueltig_bis ?? null}
          onChange={v => setFields(f => ({ ...f, gueltig_bis: v ?? undefined }))}
        />
      </div>
    ),
    'ergebnis': (
      <div key="ergebnis" className="space-y-1.5">
        <Label htmlFor="ergebnis">{fieldLabel('entscheidungen', 'ergebnis')}</Label>
        <Textarea
          id="ergebnis"
          placeholder=""
          value={fields.ergebnis ?? ''}
          onChange={e => setFields(f => ({ ...f, ergebnis: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'erneute_pruefung': (
      <div key="erneute_pruefung" className="space-y-1.5">
        <Label htmlFor="erneute_pruefung">{fieldLabel('entscheidungen', 'erneute_pruefung')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="erneute_pruefung"
            checked={!!fields.erneute_pruefung}
            onCheckedChange={(v) => setFields(f => ({ ...f, erneute_pruefung: !!v }))}
          />
          <Label htmlFor="erneute_pruefung" className="font-normal">{fieldLabel('entscheidungen', 'erneute_pruefung')}</Label>
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
  const FIELD_LABELS: Record<string, string> = {"betroffene_anforderungen": "Betroffene Anforderungen", "betroffene_offene_punkte": "Betroffene offene Punkte", "zugrunde_liegende_beurteilungen": "Zugrunde liegende Beurteilungen", "ersetzt_durch_entscheidung": "Ersetzt durch Entscheidung", "anfrage": "Anfrage", "titel": "Titel", "entscheidungsgegenstand": "Entscheidungsgegenstand", "entscheidungstyp": "Entscheidungstyp", "alternativen": "Alternativen", "entscheidung": "Entscheidung", "begruendung": "Begründung", "verantwortlicher_vorname": "Entscheidungsverantwortlicher Vorname", "verantwortlicher_nachname": "Entscheidungsverantwortlicher Nachname", "kompetenz_geprueft": "Entscheidungskompetenz geprüft", "entscheidungsstatus": "Entscheidungsstatus", "entscheidungsdatum": "Entscheidungsdatum", "auflagen": "Auflagen", "gueltig_bis": "Gültig bis", "ergebnis": "Ergebnis", "erneute_pruefung": "Erneute Prüfung erforderlich"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"betroffene_anforderungen": {"anfrage": "Anfrage", "bezeichnung": "Bezeichnung", "beschreibung": "Beschreibung", "anforderungstyp": "Anforderungstyp", "ursprung": "Ursprung", "sollwert": "Sollwert", "einheit": "Einheit", "vergleichsoperator": "Vergleichsoperator", "min_wert": "Mindestwert", "max_wert": "Höchstwert", "ist_pflichtanforderung": "Pflichtanforderung", "pruefstatus": "Prüfstatus", "begruendung_pruefstatus": "Begründung zum Prüfstatus", "verantwortlicher_vorname": "Verantwortlicher Vorname", "verantwortlicher_nachname": "Verantwortlicher Nachname", "gueltig_ab": "Gültig ab", "gueltig_bis": "Gültig bis", "erneute_pruefung": "Erneute Prüfung erforderlich", "quellen": "Quellen"}, "betroffene_offene_punkte": {"betroffene_anforderungen": "Betroffene Anforderungen", "betroffene_quellen": "Betroffene Quellen", "anfrage": "Anfrage", "kurztitel": "Kurztitel", "beschreibung": "Beschreibung und Grund", "punktetyp": "Punktetyp", "prioritaet": "Priorität", "auswirkung": "Auswirkung", "zustaendige_rolle": "Zuständige Rolle", "verantwortlicher_vorname": "Verantwortlicher Vorname", "verantwortlicher_nachname": "Verantwortlicher Nachname", "faellig_am": "Fällig am", "status": "Status", "erledigungskriterium": "Erledigungskriterium", "loesung_oder_ergebnis": "Lösung oder Ergebnis", "antwort_geprueft": "Eingegangene Antwort wurde fachlich geprüft", "abgeschlossen_am": "Abgeschlossen am", "abschluss_durch": "Abgeschlossen durch", "erneute_pruefung": "Erneute Prüfung erforderlich"}, "zugrunde_liegende_beurteilungen": {"betroffene_anforderungen": "Betroffene Anforderungen", "betroffene_offene_punkte": "Betroffene offene Punkte", "zugrunde_liegende_quellen": "Zugrunde liegende Quellen", "anfrage": "Anfrage", "beurteilungsgegenstand": "Beurteilungsgegenstand", "beurteilungsart": "Beurteilungsart", "einschaetzung": "Einschätzung", "fachliche_begruendung": "Fachliche Begründung", "annahmen": "Annahmen", "unsicherheiten": "Unsicherheiten", "alternativen": "Alternativen", "empfehlung": "Empfehlung", "ist_ki_vorschlag": "Inhalt ist ein KI-Vorschlag", "erstellt_von": "Erstellt von", "erstellt_am": "Erstellt am", "pruefstatus": "Prüfstatus", "geprueft_von": "Geprüft von", "geprueft_am": "Geprüft am", "erneute_pruefung": "Erneute Prüfung erforderlich"}, "ersetzt_durch_entscheidung": {"betroffene_anforderungen": "Betroffene Anforderungen", "betroffene_offene_punkte": "Betroffene offene Punkte", "zugrunde_liegende_beurteilungen": "Zugrunde liegende Beurteilungen", "ersetzt_durch_entscheidung": "Ersetzt durch Entscheidung", "anfrage": "Anfrage", "titel": "Titel", "entscheidungsgegenstand": "Entscheidungsgegenstand", "entscheidungstyp": "Entscheidungstyp", "alternativen": "Alternativen", "entscheidung": "Entscheidung", "begruendung": "Begründung", "verantwortlicher_vorname": "Entscheidungsverantwortlicher Vorname", "verantwortlicher_nachname": "Entscheidungsverantwortlicher Nachname", "kompetenz_geprueft": "Entscheidungskompetenz geprüft", "entscheidungsstatus": "Entscheidungsstatus", "entscheidungsdatum": "Entscheidungsdatum", "auflagen": "Auflagen", "gueltig_bis": "Gültig bis", "ergebnis": "Ergebnis", "erneute_pruefung": "Erneute Prüfung erforderlich"}, "anfrage": {"anfragenummer": "Anfragenummer", "kunde": "Kunde", "eingangsdatum": "Eingangsdatum", "eingangskanal": "Eingangskanal", "kundenreferenz": "Kundenreferenz", "kontakt_vorname": "Ansprechpartner zur Anfrage Vorname", "kontakt_nachname": "Ansprechpartner zur Anfrage Nachname", "kontakt_email": "E-Mail zur Anfrage", "produktfamilie": "Produkt oder Produktfamilie", "produktvariante": "Produktvariante", "gewuenschte_menge": "Gewünschte Menge (größer als 0)", "gewuenschter_liefertermin": "Gewünschter Liefertermin", "anfragebeschreibung": "Anfragebeschreibung", "urspruengliche_kundenanforderungen": "Ursprüngliche Kundenanforderungen (unverändert)", "prioritaet": "Priorität", "verantwortlicher_vorname": "Verantwortlicher Vorname", "verantwortlicher_nachname": "Verantwortlicher Nachname", "status": "Status", "klaeraufwand": "Technischer Kläraufwand", "zieltermin_klaerung": "Zieltermin der Klärung", "vollstaendigkeit": "Vollständigkeit", "schaetzung_bearbeitung_min": "Geschätzte aktive Bearbeitungszeit (Minuten)", "gemessen_bearbeitung_min": "Gemessene aktive Bearbeitungszeit (Minuten)", "wartezeit_kunde_min": "Gemessene Wartezeit auf Kunde (Minuten)", "wartezeit_intern_min": "Gemessene interne Wartezeit (Minuten)", "geklaert_am": "Technisch geklärt am", "anzahl_nachtraegliche_aenderungen": "Anzahl nachträglicher Änderungen", "anzahl_nacharbeiten": "Anzahl erforderlicher Nacharbeiten"}};
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
                      <Label>{fieldLabel('entscheidungen', k)}</Label>
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
                <AttachmentsSection appId={APP_IDS.ENTSCHEIDUNGEN} recordId={recordId} />
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
        informationsquellenList={[]}
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
        informationsquellenList={[]}
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
        technischeAnforderungenList={technischeAnforderungenList}
        offenePunkteList={offenePunkteList}
        informationsquellenList={[]}
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