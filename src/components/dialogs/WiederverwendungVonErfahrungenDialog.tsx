/**
 * WiederverwendungVonErfahrungenDialog — pre-generated create/edit dialog for WiederverwendungVonErfahrungen.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * erfahrungenList (full hook array — resolves the Erfahrungen applookup),
 * kundenanfragenList (full hook array — resolves the Kundenanfragen applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * WiederverwendungVonErfahrungenDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<WiederverwendungVonErfahrungen['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<WiederverwendungVonErfahrungenDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { WiederverwendungVonErfahrungen, Erfahrungen, Kundenanfragen, LookupValue } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, getUserProfile, LivingAppsService } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputedContext } from '@/config/form-enhancements/types';
import { applyFieldOrder, flattenFieldOrder, applyDefaults, evalComputed, numberInputProps, clampNumberValue, classifyComputed, extractApplookupRefs, mergeApplookupRefs, resolveApplookupRef } from '@/config/form-enhancements/types';
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/WiederverwendungVonErfahrungen';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import { Combobox } from '@/components/Combobox';
import { ErfahrungenDialog } from '@/components/dialogs/ErfahrungenDialog';
import { KundenanfragenDialog } from '@/components/dialogs/KundenanfragenDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for WiederverwendungVonErfahrungenDialog.defaultValues — see file header. */
export type WiederverwendungVonErfahrungenDialogDefaults = Omit<WiederverwendungVonErfahrungen['fields'], 'aehnlichkeit' | 'verwendungsergebnis'> & {
    aehnlichkeit?: LookupValue | string;
    verwendungsergebnis?: LookupValue | string;
  };

interface WiederverwendungVonErfahrungenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: WiederverwendungVonErfahrungen['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: WiederverwendungVonErfahrungenDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  erfahrungenList: Erfahrungen[];
  kundenanfragenList: Kundenanfragen[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  aehnlichkeit: LOOKUP_OPTIONS['wiederverwendung_von_erfahrungen']?.['aehnlichkeit'] ?? [],
  verwendungsergebnis: LOOKUP_OPTIONS['wiederverwendung_von_erfahrungen']?.['verwendungsergebnis'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  erfahrung: APP_IDS.ERFAHRUNGEN,
  ziel_anfrage: APP_IDS.KUNDENANFRAGEN,
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

export function WiederverwendungVonErfahrungenDialog({ open, onClose, onSubmit, defaultValues, recordId, erfahrungenList, kundenanfragenList, enablePhotoScan = true, enablePhotoLocation = true }: WiederverwendungVonErfahrungenDialogProps) {
  const [fields, setFields] = useState<Partial<WiederverwendungVonErfahrungen['fields']>>({});
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
  // Inline-Create state for "Erfahrungen" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraErfahrungen` list, and select it in
  // the originating Combobox via the captured `createErfahrungenField`.
  const [createErfahrungenOpen, setCreateErfahrungenOpen] = useState(false);
  const [createErfahrungenInitial, setCreateErfahrungenInitial] = useState('');
  const [createErfahrungenField, setCreateErfahrungenField] = useState<string>('');
  const [extraErfahrungen, setExtraErfahrungen] = useState< Erfahrungen[]>([]);
  const erfahrungenListAll = useMemo(
    () => [...erfahrungenList, ...extraErfahrungen],
    [erfahrungenList, extraErfahrungen],
  );
  function openCreateErfahrungen(fieldKey: string, q: string) {
    setCreateErfahrungenField(fieldKey);
    setCreateErfahrungenInitial(q);
    setCreateErfahrungenOpen(true);
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
  const REQUIRED_FIELDS = ['erfahrung', 'ziel_anfrage'] as const;
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
      'erfahrung': erfahrungenList,
      'ziel_anfrage': kundenanfragenList,
    },
  }), [erfahrungenList, kundenanfragenList, ]);
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
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<WiederverwendungVonErfahrungen['fields']>);
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
      const clean = cleanFieldsForApi(merged, 'wiederverwendung_von_erfahrungen');
      await onSubmit(clean as WiederverwendungVonErfahrungen['fields']);
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
      contextParts.push(`<available-records field="erfahrung" entity="Erfahrungen">\n${JSON.stringify(erfahrungenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="ziel_anfrage" entity="Kundenanfragen">\n${JSON.stringify(kundenanfragenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "erfahrung": string | null, // Display name from Erfahrungen (see <available-records>)\n  "ziel_anfrage": string | null, // Display name from Kundenanfragen (see <available-records>)\n  "abrufdatum": string | null, // YYYY-MM-DDTHH:MM\n  "abrufgrund": string | null, // Abrufgrund\n  "aehnlichkeit": LookupValue | null, // Ähnlichkeitseinschätzung (select one key: "hoch" | "mittel" | "niedrig" | "unklar") mapping: hoch=Hoch, mittel=Mittel, niedrig=Niedrig, unklar=Unklar\n  "kontextunterschiede": string | null, // Kontextunterschiede\n  "gueltigkeit_geprueft": boolean | null, // Gültigkeit fachlich geprüft\n  "geprueft_von": string | null, // Geprüft von\n  "verwendungsergebnis": LookupValue | null, // Verwendungsergebnis (select one key: "verwendet" | "teilweise_verwendet" | "nicht_verwendet" | "ungeeignet") mapping: verwendet=Verwendet, teilweise_verwendet=Teilweise verwendet, nicht_verwendet=Nicht verwendet, ungeeignet=Als ungeeignet erkannt\n  "begruendung": string | null, // Begründung\n  "beobachteter_nutzen": string | null, // Beobachteter Nutzen\n  "ersparnis_schaetzung_min": number | null, // Geschätzte Aufwandsersparnis (Minuten)\n  "ersparnis_tatsaechlich_min": number | null, // Tatsächlich beobachtete Aufwandsersparnis (Minuten)\n  "negative_folgen": string | null, // Negative Folgen oder Fehlübertragung\n  "bewertet_am": string | null, // YYYY-MM-DD\n}`;
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
        const applookupKeys = new Set<string>(["erfahrung", "ziel_anfrage"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const erfahrungName = raw['erfahrung'] as string | null;
        if (erfahrungName) {
          const erfahrungMatch = erfahrungenList.find(r => matchName(erfahrungName!, [String(r.fields.titel ?? '')]));
          if (erfahrungMatch) merged['erfahrung'] = createRecordUrl(APP_IDS.ERFAHRUNGEN, erfahrungMatch.record_id);
        }
        const ziel_anfrageName = raw['ziel_anfrage'] as string | null;
        if (ziel_anfrageName) {
          const ziel_anfrageMatch = kundenanfragenList.find(r => matchName(ziel_anfrageName!, [String(r.fields.anfragenummer ?? '')]));
          if (ziel_anfrageMatch) merged['ziel_anfrage'] = createRecordUrl(APP_IDS.KUNDENANFRAGEN, ziel_anfrageMatch.record_id);
        }
        return merged as Partial<WiederverwendungVonErfahrungen['fields']>;
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
    ? t('edit_entity', { entity: appLabel('wiederverwendung_von_erfahrungen') })
    : t('new_entity', { entity: appLabel('wiederverwendung_von_erfahrungen') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'erfahrung': (
      <div key="erfahrung" className="space-y-1.5">
        <Label htmlFor="erfahrung">{fieldLabel('wiederverwendung_von_erfahrungen', 'erfahrung')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="erfahrung"
          placeholder="Welche Erfahrung?"
          items={erfahrungenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.titel ?? r.record_id),
          }))}
          value={extractRecordId(fields.erfahrung)}
          onChange={id => setFields(f => ({ ...f, erfahrung: id ? createRecordUrl(APP_IDS.ERFAHRUNGEN, id) : undefined }))}
          onCreateNew={(q) => openCreateErfahrungen("erfahrung", q)}
          createLabel={t('create_in', { entity: appLabel('erfahrungen') })}
        />
        {showErrors && !fields.erfahrung && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('wiederverwendung_von_erfahrungen', 'erfahrung')}</p>
        )}
      </div>
    ),
    'ziel_anfrage': (
      <div key="ziel_anfrage" className="space-y-1.5">
        <Label htmlFor="ziel_anfrage">{fieldLabel('wiederverwendung_von_erfahrungen', 'ziel_anfrage')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Combobox
          id="ziel_anfrage"
          placeholder="Welche Anfrage?"
          items={kundenanfragenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.anfragenummer ?? r.record_id),
          }))}
          value={extractRecordId(fields.ziel_anfrage)}
          onChange={id => setFields(f => ({ ...f, ziel_anfrage: id ? createRecordUrl(APP_IDS.KUNDENANFRAGEN, id) : undefined }))}
          onCreateNew={(q) => openCreateKundenanfragen("ziel_anfrage", q)}
          createLabel={t('create_in', { entity: appLabel('kundenanfragen') })}
        />
        {showErrors && !fields.ziel_anfrage && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('wiederverwendung_von_erfahrungen', 'ziel_anfrage')}</p>
        )}
      </div>
    ),
    'abrufdatum': (
      <div key="abrufdatum" className="space-y-1.5">
        <Label htmlFor="abrufdatum">{fieldLabel('wiederverwendung_von_erfahrungen', 'abrufdatum')}</Label>
        <DatePicker
          id="abrufdatum"
          placeholder="Wann abgerufen?"
          mode="datetime"
          value={fields.abrufdatum ?? null}
          onChange={v => setFields(f => ({ ...f, abrufdatum: v ?? undefined }))}
        />
      </div>
    ),
    'abrufgrund': (
      <div key="abrufgrund" className="space-y-1.5">
        <Label htmlFor="abrufgrund">{fieldLabel('wiederverwendung_von_erfahrungen', 'abrufgrund')}</Label>
        <Textarea
          id="abrufgrund"
          placeholder="Warum wurde sie abgerufen?"
          value={fields.abrufgrund ?? ''}
          onChange={e => setFields(f => ({ ...f, abrufgrund: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'aehnlichkeit': (
      <div key="aehnlichkeit" className="space-y-1.5">
        <Label htmlFor="aehnlichkeit">{fieldLabel('wiederverwendung_von_erfahrungen', 'aehnlichkeit')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.aehnlichkeit) === 'hoch'}
            onClick={() => setFields(f => ({ ...f, aehnlichkeit: (lookupKey(f.aehnlichkeit) === 'hoch' ? undefined : 'hoch') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.aehnlichkeit) === 'hoch'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('wiederverwendung_von_erfahrungen', 'aehnlichkeit', 'hoch') ?? 'Hoch'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.aehnlichkeit) === 'mittel'}
            onClick={() => setFields(f => ({ ...f, aehnlichkeit: (lookupKey(f.aehnlichkeit) === 'mittel' ? undefined : 'mittel') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.aehnlichkeit) === 'mittel'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('wiederverwendung_von_erfahrungen', 'aehnlichkeit', 'mittel') ?? 'Mittel'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.aehnlichkeit) === 'niedrig'}
            onClick={() => setFields(f => ({ ...f, aehnlichkeit: (lookupKey(f.aehnlichkeit) === 'niedrig' ? undefined : 'niedrig') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.aehnlichkeit) === 'niedrig'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('wiederverwendung_von_erfahrungen', 'aehnlichkeit', 'niedrig') ?? 'Niedrig'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.aehnlichkeit) === 'unklar'}
            onClick={() => setFields(f => ({ ...f, aehnlichkeit: (lookupKey(f.aehnlichkeit) === 'unklar' ? undefined : 'unklar') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.aehnlichkeit) === 'unklar'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('wiederverwendung_von_erfahrungen', 'aehnlichkeit', 'unklar') ?? 'Unklar'}
          </button>
        </div>
      </div>
    ),
    'kontextunterschiede': (
      <div key="kontextunterschiede" className="space-y-1.5">
        <Label htmlFor="kontextunterschiede">{fieldLabel('wiederverwendung_von_erfahrungen', 'kontextunterschiede')}</Label>
        <Textarea
          id="kontextunterschiede"
          placeholder="Was war anders?"
          value={fields.kontextunterschiede ?? ''}
          onChange={e => setFields(f => ({ ...f, kontextunterschiede: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'gueltigkeit_geprueft': (
      <div key="gueltigkeit_geprueft" className="space-y-1.5">
        <Label htmlFor="gueltigkeit_geprueft">{fieldLabel('wiederverwendung_von_erfahrungen', 'gueltigkeit_geprueft')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="gueltigkeit_geprueft"
            checked={!!fields.gueltigkeit_geprueft}
            onCheckedChange={(v) => setFields(f => ({ ...f, gueltigkeit_geprueft: !!v }))}
          />
          <Label htmlFor="gueltigkeit_geprueft" className="font-normal">{fieldLabel('wiederverwendung_von_erfahrungen', 'gueltigkeit_geprueft')}</Label>
        </div>
      </div>
    ),
    'geprueft_von': (
      <div key="geprueft_von" className="space-y-1.5">
        <Label htmlFor="geprueft_von">{fieldLabel('wiederverwendung_von_erfahrungen', 'geprueft_von')}</Label>
        <Input
          id="geprueft_von"
          placeholder="z. B. Anna Schmidt"
          value={fields.geprueft_von ?? ''}
          onChange={e => setFields(f => ({ ...f, geprueft_von: e.target.value }))}
        />
      </div>
    ),
    'verwendungsergebnis': (
      <div key="verwendungsergebnis" className="space-y-1.5">
        <Label htmlFor="verwendungsergebnis">{fieldLabel('wiederverwendung_von_erfahrungen', 'verwendungsergebnis')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.verwendungsergebnis) === 'verwendet'}
            onClick={() => setFields(f => ({ ...f, verwendungsergebnis: (lookupKey(f.verwendungsergebnis) === 'verwendet' ? undefined : 'verwendet') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.verwendungsergebnis) === 'verwendet'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('wiederverwendung_von_erfahrungen', 'verwendungsergebnis', 'verwendet') ?? 'Verwendet'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.verwendungsergebnis) === 'teilweise_verwendet'}
            onClick={() => setFields(f => ({ ...f, verwendungsergebnis: (lookupKey(f.verwendungsergebnis) === 'teilweise_verwendet' ? undefined : 'teilweise_verwendet') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.verwendungsergebnis) === 'teilweise_verwendet'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('wiederverwendung_von_erfahrungen', 'verwendungsergebnis', 'teilweise_verwendet') ?? 'Teilweise verwendet'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.verwendungsergebnis) === 'nicht_verwendet'}
            onClick={() => setFields(f => ({ ...f, verwendungsergebnis: (lookupKey(f.verwendungsergebnis) === 'nicht_verwendet' ? undefined : 'nicht_verwendet') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.verwendungsergebnis) === 'nicht_verwendet'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('wiederverwendung_von_erfahrungen', 'verwendungsergebnis', 'nicht_verwendet') ?? 'Nicht verwendet'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.verwendungsergebnis) === 'ungeeignet'}
            onClick={() => setFields(f => ({ ...f, verwendungsergebnis: (lookupKey(f.verwendungsergebnis) === 'ungeeignet' ? undefined : 'ungeeignet') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.verwendungsergebnis) === 'ungeeignet'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('wiederverwendung_von_erfahrungen', 'verwendungsergebnis', 'ungeeignet') ?? 'Als ungeeignet erkannt'}
          </button>
        </div>
      </div>
    ),
    'begruendung': (
      <div key="begruendung" className="space-y-1.5">
        <Label htmlFor="begruendung">{fieldLabel('wiederverwendung_von_erfahrungen', 'begruendung')}</Label>
        <Textarea
          id="begruendung"
          placeholder="Warum so entschieden?"
          value={fields.begruendung ?? ''}
          onChange={e => setFields(f => ({ ...f, begruendung: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'beobachteter_nutzen': (
      <div key="beobachteter_nutzen" className="space-y-1.5">
        <Label htmlFor="beobachteter_nutzen">{fieldLabel('wiederverwendung_von_erfahrungen', 'beobachteter_nutzen')}</Label>
        <Textarea
          id="beobachteter_nutzen"
          placeholder="Was hat es gebracht?"
          value={fields.beobachteter_nutzen ?? ''}
          onChange={e => setFields(f => ({ ...f, beobachteter_nutzen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'ersparnis_schaetzung_min': (
      <div key="ersparnis_schaetzung_min" className="space-y-1.5">
        <Label htmlFor="ersparnis_schaetzung_min">{fieldLabel('wiederverwendung_von_erfahrungen', 'ersparnis_schaetzung_min')}</Label>
        <Input
          id="ersparnis_schaetzung_min"
          type="number"
          inputMode="decimal"
          step="any"
          {...numberInputProps(formEnhancements, 'ersparnis_schaetzung_min')}
          placeholder="z. B. 30"
          value={fields.ersparnis_schaetzung_min !== undefined ? fields.ersparnis_schaetzung_min : (computedValues['ersparnis_schaetzung_min'] ?? '')}
          onChange={e => setFields(f => ({ ...f, ersparnis_schaetzung_min: clampNumberValue(formEnhancements, 'ersparnis_schaetzung_min', e.target.value) }))}
        />
      </div>
    ),
    'ersparnis_tatsaechlich_min': (
      <div key="ersparnis_tatsaechlich_min" className="space-y-1.5">
        <Label htmlFor="ersparnis_tatsaechlich_min">{fieldLabel('wiederverwendung_von_erfahrungen', 'ersparnis_tatsaechlich_min')}</Label>
        <Input
          id="ersparnis_tatsaechlich_min"
          type="number"
          inputMode="decimal"
          step="any"
          {...numberInputProps(formEnhancements, 'ersparnis_tatsaechlich_min')}
          placeholder="z. B. 25"
          value={fields.ersparnis_tatsaechlich_min !== undefined ? fields.ersparnis_tatsaechlich_min : (computedValues['ersparnis_tatsaechlich_min'] ?? '')}
          onChange={e => setFields(f => ({ ...f, ersparnis_tatsaechlich_min: clampNumberValue(formEnhancements, 'ersparnis_tatsaechlich_min', e.target.value) }))}
        />
      </div>
    ),
    'negative_folgen': (
      <div key="negative_folgen" className="space-y-1.5">
        <Label htmlFor="negative_folgen">{fieldLabel('wiederverwendung_von_erfahrungen', 'negative_folgen')}</Label>
        <Textarea
          id="negative_folgen"
          placeholder="Was ging schief?"
          value={fields.negative_folgen ?? ''}
          onChange={e => setFields(f => ({ ...f, negative_folgen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'bewertet_am': (
      <div key="bewertet_am" className="space-y-1.5">
        <Label htmlFor="bewertet_am">{fieldLabel('wiederverwendung_von_erfahrungen', 'bewertet_am')}</Label>
        <DatePicker
          id="bewertet_am"
          placeholder="Wann bewertet?"
          mode="date"
          value={fields.bewertet_am ?? null}
          onChange={v => setFields(f => ({ ...f, bewertet_am: v ?? undefined }))}
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
  const FIELD_LABELS: Record<string, string> = {"erfahrung": "Erfahrung", "ziel_anfrage": "Spätere Anfrage", "abrufdatum": "Abrufdatum", "abrufgrund": "Abrufgrund", "aehnlichkeit": "Ähnlichkeitseinschätzung", "kontextunterschiede": "Kontextunterschiede", "gueltigkeit_geprueft": "Gültigkeit fachlich geprüft", "geprueft_von": "Geprüft von", "verwendungsergebnis": "Verwendungsergebnis", "begruendung": "Begründung", "beobachteter_nutzen": "Beobachteter Nutzen", "ersparnis_schaetzung_min": "Geschätzte Aufwandsersparnis (Minuten)", "ersparnis_tatsaechlich_min": "Tatsächlich beobachtete Aufwandsersparnis (Minuten)", "negative_folgen": "Negative Folgen oder Fehlübertragung", "bewertet_am": "Bewertet am"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"erfahrung": {"belegquellen": "Belegquellen", "belegbeurteilungen": "Belegbeurteilungen", "belegentscheidungen": "Belegentscheidungen", "ursprungsanfrage": "Ursprungsanfrage", "titel": "Titel", "sachverhalt": "Sachverhalt", "erfahrungstyp": "Erfahrungstyp", "produktfamilie": "Produkt oder Produktfamilie", "anforderungstyp": "Anforderungstyp", "schlagwoerter": "Schlagwörter", "urspruengliches_problem": "Ursprüngliches Problem", "vorgehen": "Vorgehen", "beobachtetes_ergebnis": "Beobachtetes Ergebnis", "erkenntnis": "Erkenntnis", "belegabschluss": "Beleg Prüfergebnis", "gueltigkeitsbedingungen": "Gültigkeitsbedingungen", "bekannte_grenzen": "Bekannte Grenzen", "risiko_uebertragung": "Risiko der Übertragung", "bestaetigungsstatus": "Bestätigungsstatus", "bestaetigt_von": "Bestätigt von", "bestaetigt_am": "Bestätigt am", "gueltig_ab": "Gültig ab", "gueltig_bis": "Gültig bis", "wiederverwendungsstatus": "Wiederverwendungsstatus", "kommentar_wiederverwendung": "Kommentar zur Wiederverwendung"}, "ziel_anfrage": {"anfragenummer": "Anfragenummer", "kunde": "Kunde", "eingangsdatum": "Eingangsdatum", "eingangskanal": "Eingangskanal", "kundenreferenz": "Kundenreferenz", "kontakt_vorname": "Ansprechpartner zur Anfrage Vorname", "kontakt_nachname": "Ansprechpartner zur Anfrage Nachname", "kontakt_email": "E-Mail zur Anfrage", "produktfamilie": "Produkt oder Produktfamilie", "produktvariante": "Produktvariante", "gewuenschte_menge": "Gewünschte Menge (größer als 0)", "gewuenschter_liefertermin": "Gewünschter Liefertermin", "anfragebeschreibung": "Anfragebeschreibung", "urspruengliche_kundenanforderungen": "Ursprüngliche Kundenanforderungen (unverändert)", "prioritaet": "Priorität", "verantwortlicher_vorname": "Verantwortlicher Vorname", "verantwortlicher_nachname": "Verantwortlicher Nachname", "status": "Status", "klaeraufwand": "Technischer Kläraufwand", "zieltermin_klaerung": "Zieltermin der Klärung", "vollstaendigkeit": "Vollständigkeit", "schaetzung_bearbeitung_min": "Geschätzte aktive Bearbeitungszeit (Minuten)", "gemessen_bearbeitung_min": "Gemessene aktive Bearbeitungszeit (Minuten)", "wartezeit_kunde_min": "Gemessene Wartezeit auf Kunde (Minuten)", "wartezeit_intern_min": "Gemessene interne Wartezeit (Minuten)", "geklaert_am": "Technisch geklärt am", "anzahl_nachtraegliche_aenderungen": "Anzahl nachträglicher Änderungen", "anzahl_nacharbeiten": "Anzahl erforderlicher Nacharbeiten"}};
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
                      <Label>{fieldLabel('wiederverwendung_von_erfahrungen', k)}</Label>
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
                <AttachmentsSection appId={APP_IDS.WIEDERVERWENDUNG_VON_ERFAHRUNGEN} recordId={recordId} />
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
    {createErfahrungenOpen && (
      <ErfahrungenDialog
        open={createErfahrungenOpen}
        onClose={() => setCreateErfahrungenOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createErfahrungenEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Erfahrungen;
            setExtraErfahrungen(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.ERFAHRUNGEN, result.id);
            setFields(prev => ({ ...prev, [createErfahrungenField]: url } as any));
          }
          setCreateErfahrungenOpen(false);
        }}
        defaultValues={createErfahrungenInitial
          ? ({ titel: createErfahrungenInitial } as any)
          : undefined}
        informationsquellenList={[]}
        beurteilungenList={[]}
        entscheidungenList={[]}
        kundenanfragenList={kundenanfragenList}
        technischerAbschlussList={[]}
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