/**
 * TechnischeAnforderungenDialog — pre-generated create/edit dialog for TechnischeAnforderungen.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * kundenanfragenList (full hook array — resolves the Kundenanfragen applookup),
 * informationsquellenList (full hook array — resolves the Informationsquellen applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * TechnischeAnforderungenDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<TechnischeAnforderungen['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<TechnischeAnforderungenDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { TechnischeAnforderungen, Kundenanfragen, Informationsquellen, LookupValue } from '@/types/app';
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
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/TechnischeAnforderungen';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { requiredMessage } from '@/lib/journey/messages';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Combobox, MultiCombobox } from '@/components/Combobox';
import { KundenanfragenDialog } from '@/components/dialogs/KundenanfragenDialog';
import { InformationsquellenDialog } from '@/components/dialogs/InformationsquellenDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for TechnischeAnforderungenDialog.defaultValues — see file header. */
export type TechnischeAnforderungenDialogDefaults = Omit<TechnischeAnforderungen['fields'], 'anforderungstyp' | 'ursprung' | 'vergleichsoperator' | 'pruefstatus'> & {
    anforderungstyp?: LookupValue | string;
    ursprung?: LookupValue | string;
    vergleichsoperator?: LookupValue | string;
    pruefstatus?: LookupValue | string;
  };

interface TechnischeAnforderungenDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: TechnischeAnforderungen['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: TechnischeAnforderungenDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  kundenanfragenList: Kundenanfragen[];
  informationsquellenList: Informationsquellen[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  anforderungstyp: LOOKUP_OPTIONS['technische_anforderungen']?.['anforderungstyp'] ?? [],
  ursprung: LOOKUP_OPTIONS['technische_anforderungen']?.['ursprung'] ?? [],
  vergleichsoperator: LOOKUP_OPTIONS['technische_anforderungen']?.['vergleichsoperator'] ?? [],
  pruefstatus: LOOKUP_OPTIONS['technische_anforderungen']?.['pruefstatus'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  anfrage: APP_IDS.KUNDENANFRAGEN,
  quellen: APP_IDS.INFORMATIONSQUELLEN,
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

export function TechnischeAnforderungenDialog({ open, onClose, onSubmit, defaultValues, recordId, kundenanfragenList, informationsquellenList, enablePhotoScan = true, enablePhotoLocation = true }: TechnischeAnforderungenDialogProps) {
  const [fields, setFields] = useState<Partial<TechnischeAnforderungen['fields']>>({});
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
  // Fields the plan assigns to a tool (empty without a plan).
  const SYSTEM_ASSIGNED: string[] = [];
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['anfrage', 'bezeichnung', 'beschreibung', 'pruefstatus'] as const;
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
      'anfrage': kundenanfragenList,
      'quellen': informationsquellenList,
    },
  }), [kundenanfragenList, informationsquellenList, ]);
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
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<TechnischeAnforderungen['fields']>);
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
      const clean = cleanFieldsForApi(merged, 'technische_anforderungen');
      await onSubmit(clean as TechnischeAnforderungen['fields']);
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
      contextParts.push(`<available-records field="anfrage" entity="Kundenanfragen">\n${JSON.stringify(kundenanfragenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      contextParts.push(`<available-records field="quellen" entity="Informationsquellen">\n${JSON.stringify(informationsquellenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "anfrage": string | null, // Display name from Kundenanfragen (see <available-records>)\n  "bezeichnung": string | null, // Bezeichnung\n  "beschreibung": string | null, // Beschreibung\n  "anforderungstyp": LookupValue | null, // Anforderungstyp (select one key: "abmessung" | "material" | "leistung" | "funktion" | "schnittstelle" | "norm" | "sicherheit" | "umweltbedingung" | "qualitaet" | "liefertermin" | "dokumentation" | "sonstiges") mapping: abmessung=Abmessung, material=Material, leistung=Leistung, funktion=Funktion, schnittstelle=Schnittstelle, norm=Norm, sicherheit=Sicherheit, umweltbedingung=Umweltbedingung, qualitaet=Qualität, liefertermin=Liefertermin, dokumentation=Dokumentation, sonstiges=Sonstiges\n  "ursprung": LookupValue | null, // Ursprung (select one key: "kundenangabe" | "kundenunterlage" | "interne_vorgabe" | "technische_ableitung" | "erfahrungswissen" | "ki_vorschlag") mapping: kundenangabe=Explizite Kundenangabe, kundenunterlage=Kundenunterlage, interne_vorgabe=Interne Vorgabe, technische_ableitung=Technische Ableitung, erfahrungswissen=Erfahrungswissen, ki_vorschlag=KI-Vorschlag\n  "sollwert": string | null, // Sollwert\n  "einheit": string | null, // Einheit\n  "vergleichsoperator": LookupValue | null, // Vergleichsoperator (select one key: "gleich" | "groesser" | "groesser_gleich" | "kleiner" | "kleiner_gleich" | "zwischen") mapping: gleich=Gleich, groesser=Größer als, groesser_gleich=Größer oder gleich, kleiner=Kleiner als, kleiner_gleich=Kleiner oder gleich, zwischen=Zwischen\n  "min_wert": number | null, // Mindestwert\n  "max_wert": number | null, // Höchstwert\n  "ist_pflichtanforderung": boolean | null, // Pflichtanforderung\n  "pruefstatus": LookupValue | null, // Prüfstatus (select one key: "ungeprueft" | "zu_pruefen" | "bestaetigt" | "unklar" | "widerspruechlich" | "nicht_erfuellt" | "nicht_anwendbar") mapping: ungeprueft=Ungeprüft, zu_pruefen=Zu prüfen, bestaetigt=Bestätigt, unklar=Unklar, widerspruechlich=Widersprüchlich, nicht_erfuellt=Nicht erfüllt, nicht_anwendbar=Nicht anwendbar\n  "begruendung_pruefstatus": string | null, // Begründung zum Prüfstatus\n  "verantwortlicher_vorname": string | null, // Verantwortlicher Vorname\n  "verantwortlicher_nachname": string | null, // Verantwortlicher Nachname\n  "gueltig_ab": string | null, // YYYY-MM-DD\n  "gueltig_bis": string | null, // YYYY-MM-DD\n  "erneute_pruefung": boolean | null, // Erneute Prüfung erforderlich\n  "quellen": string[] | null, // Display names from Informationsquellen, one per referenced record (see <available-records>)\n}`;
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
        const applookupKeys = new Set<string>(["anfrage", "quellen"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const anfrageName = raw['anfrage'] as string | null;
        if (anfrageName) {
          const anfrageMatch = kundenanfragenList.find(r => matchName(anfrageName!, [String(r.fields.anfragenummer ?? '')]));
          if (anfrageMatch) merged['anfrage'] = createRecordUrl(APP_IDS.KUNDENANFRAGEN, anfrageMatch.record_id);
        }
        const quellenNames = raw['quellen'];
        if (Array.isArray(quellenNames) && quellenNames.length > 0) {
          const quellenUrls = (quellenNames as unknown[])
            .map(n => informationsquellenList.find(r => matchName(String(n), [String(r.fields.titel ?? '')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, r.record_id));
          if (quellenUrls.length > 0) merged['quellen'] = quellenUrls;
        }
        return merged as Partial<TechnischeAnforderungen['fields']>;
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
    ? t('edit_entity', { entity: appLabel('technische_anforderungen') })
    : t('new_entity', { entity: appLabel('technische_anforderungen') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'anfrage': (
      <div key="anfrage" className="space-y-1.5">
        <Label htmlFor="anfrage">{fieldLabel('technische_anforderungen', 'anfrage')} <span className="text-destructive" aria-hidden="true">*</span></Label>
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
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('technische_anforderungen', 'anfrage')}</p>
        )}
      </div>
    ),
    'bezeichnung': (
      <div key="bezeichnung" className="space-y-1.5">
        <Label htmlFor="bezeichnung">{fieldLabel('technische_anforderungen', 'bezeichnung')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="bezeichnung"
          placeholder="z. B. Wellendurchmesser"
          value={fields.bezeichnung ?? ''}
          onChange={e => setFields(f => ({ ...f, bezeichnung: e.target.value }))}
          required
        />
        {showErrors && !fields.bezeichnung && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('technische_anforderungen', 'bezeichnung')}</p>
        )}
      </div>
    ),
    'beschreibung': (
      <div key="beschreibung" className="space-y-1.5">
        <Label htmlFor="beschreibung">{fieldLabel('technische_anforderungen', 'beschreibung')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="beschreibung"
          placeholder="Was wird gefordert?"
          value={fields.beschreibung ?? ''}
          onChange={e => setFields(f => ({ ...f, beschreibung: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.beschreibung && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('technische_anforderungen', 'beschreibung')}</p>
        )}
      </div>
    ),
    'anforderungstyp': (
      <div key="anforderungstyp" className="space-y-1.5">
        <Label htmlFor="anforderungstyp">{fieldLabel('technische_anforderungen', 'anforderungstyp')}</Label>
        <Select
          value={lookupKey(fields.anforderungstyp) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, anforderungstyp: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="anforderungstyp" className="max-sm:h-11"><SelectValue placeholder="z. B. Material, Norm" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="abmessung">{lookupLabel('technische_anforderungen', 'anforderungstyp', 'abmessung') ?? 'Abmessung'}</SelectItem>
            <SelectItem value="material">{lookupLabel('technische_anforderungen', 'anforderungstyp', 'material') ?? 'Material'}</SelectItem>
            <SelectItem value="leistung">{lookupLabel('technische_anforderungen', 'anforderungstyp', 'leistung') ?? 'Leistung'}</SelectItem>
            <SelectItem value="funktion">{lookupLabel('technische_anforderungen', 'anforderungstyp', 'funktion') ?? 'Funktion'}</SelectItem>
            <SelectItem value="schnittstelle">{lookupLabel('technische_anforderungen', 'anforderungstyp', 'schnittstelle') ?? 'Schnittstelle'}</SelectItem>
            <SelectItem value="norm">{lookupLabel('technische_anforderungen', 'anforderungstyp', 'norm') ?? 'Norm'}</SelectItem>
            <SelectItem value="sicherheit">{lookupLabel('technische_anforderungen', 'anforderungstyp', 'sicherheit') ?? 'Sicherheit'}</SelectItem>
            <SelectItem value="umweltbedingung">{lookupLabel('technische_anforderungen', 'anforderungstyp', 'umweltbedingung') ?? 'Umweltbedingung'}</SelectItem>
            <SelectItem value="qualitaet">{lookupLabel('technische_anforderungen', 'anforderungstyp', 'qualitaet') ?? 'Qualität'}</SelectItem>
            <SelectItem value="liefertermin">{lookupLabel('technische_anforderungen', 'anforderungstyp', 'liefertermin') ?? 'Liefertermin'}</SelectItem>
            <SelectItem value="dokumentation">{lookupLabel('technische_anforderungen', 'anforderungstyp', 'dokumentation') ?? 'Dokumentation'}</SelectItem>
            <SelectItem value="sonstiges">{lookupLabel('technische_anforderungen', 'anforderungstyp', 'sonstiges') ?? 'Sonstiges'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    'ursprung': (
      <div key="ursprung" className="space-y-1.5">
        <Label htmlFor="ursprung">{fieldLabel('technische_anforderungen', 'ursprung')}</Label>
        <Select
          value={lookupKey(fields.ursprung) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, ursprung: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="ursprung" className="max-sm:h-11"><SelectValue placeholder="z. B. Kundenunterlage, Interne Vorgabe" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="kundenangabe">{lookupLabel('technische_anforderungen', 'ursprung', 'kundenangabe') ?? 'Explizite Kundenangabe'}</SelectItem>
            <SelectItem value="kundenunterlage">{lookupLabel('technische_anforderungen', 'ursprung', 'kundenunterlage') ?? 'Kundenunterlage'}</SelectItem>
            <SelectItem value="interne_vorgabe">{lookupLabel('technische_anforderungen', 'ursprung', 'interne_vorgabe') ?? 'Interne Vorgabe'}</SelectItem>
            <SelectItem value="technische_ableitung">{lookupLabel('technische_anforderungen', 'ursprung', 'technische_ableitung') ?? 'Technische Ableitung'}</SelectItem>
            <SelectItem value="erfahrungswissen">{lookupLabel('technische_anforderungen', 'ursprung', 'erfahrungswissen') ?? 'Erfahrungswissen'}</SelectItem>
            <SelectItem value="ki_vorschlag">{lookupLabel('technische_anforderungen', 'ursprung', 'ki_vorschlag') ?? 'KI-Vorschlag'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    'sollwert': (
      <div key="sollwert" className="space-y-1.5">
        <Label htmlFor="sollwert">{fieldLabel('technische_anforderungen', 'sollwert')}</Label>
        <Input
          id="sollwert"
          placeholder="z. B. 25"
          value={fields.sollwert ?? ''}
          onChange={e => setFields(f => ({ ...f, sollwert: e.target.value }))}
        />
      </div>
    ),
    'einheit': (
      <div key="einheit" className="space-y-1.5">
        <Label htmlFor="einheit">{fieldLabel('technische_anforderungen', 'einheit')}</Label>
        <Input
          id="einheit"
          placeholder="z. B. mm"
          value={fields.einheit ?? ''}
          onChange={e => setFields(f => ({ ...f, einheit: e.target.value }))}
        />
      </div>
    ),
    'vergleichsoperator': (
      <div key="vergleichsoperator" className="space-y-1.5">
        <Label htmlFor="vergleichsoperator">{fieldLabel('technische_anforderungen', 'vergleichsoperator')}</Label>
        <Select
          value={lookupKey(fields.vergleichsoperator) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, vergleichsoperator: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="vergleichsoperator" className="max-sm:h-11"><SelectValue placeholder="z. B. Gleich, Zwischen" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="gleich">{lookupLabel('technische_anforderungen', 'vergleichsoperator', 'gleich') ?? 'Gleich'}</SelectItem>
            <SelectItem value="groesser">{lookupLabel('technische_anforderungen', 'vergleichsoperator', 'groesser') ?? 'Größer als'}</SelectItem>
            <SelectItem value="groesser_gleich">{lookupLabel('technische_anforderungen', 'vergleichsoperator', 'groesser_gleich') ?? 'Größer oder gleich'}</SelectItem>
            <SelectItem value="kleiner">{lookupLabel('technische_anforderungen', 'vergleichsoperator', 'kleiner') ?? 'Kleiner als'}</SelectItem>
            <SelectItem value="kleiner_gleich">{lookupLabel('technische_anforderungen', 'vergleichsoperator', 'kleiner_gleich') ?? 'Kleiner oder gleich'}</SelectItem>
            <SelectItem value="zwischen">{lookupLabel('technische_anforderungen', 'vergleichsoperator', 'zwischen') ?? 'Zwischen'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    'min_wert': (
      <div key="min_wert" className="space-y-1.5">
        <Label htmlFor="min_wert">{fieldLabel('technische_anforderungen', 'min_wert')}</Label>
        <Input
          id="min_wert"
          type="number"
          inputMode="decimal"
          step="any"
          {...numberInputProps(formEnhancements, 'min_wert')}
          placeholder="z. B. 24,9"
          value={fields.min_wert !== undefined ? fields.min_wert : (computedValues['min_wert'] ?? '')}
          onChange={e => setFields(f => ({ ...f, min_wert: clampNumberValue(formEnhancements, 'min_wert', e.target.value) }))}
        />
      </div>
    ),
    'max_wert': (
      <div key="max_wert" className="space-y-1.5">
        <Label htmlFor="max_wert">{fieldLabel('technische_anforderungen', 'max_wert')}</Label>
        <Input
          id="max_wert"
          type="number"
          inputMode="decimal"
          step="any"
          {...numberInputProps(formEnhancements, 'max_wert')}
          placeholder="z. B. 25,1"
          value={fields.max_wert !== undefined ? fields.max_wert : (computedValues['max_wert'] ?? '')}
          onChange={e => setFields(f => ({ ...f, max_wert: clampNumberValue(formEnhancements, 'max_wert', e.target.value) }))}
        />
      </div>
    ),
    'ist_pflichtanforderung': (
      <div key="ist_pflichtanforderung" className="space-y-1.5">
        <Label htmlFor="ist_pflichtanforderung">{fieldLabel('technische_anforderungen', 'ist_pflichtanforderung')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="ist_pflichtanforderung"
            checked={!!fields.ist_pflichtanforderung}
            onCheckedChange={(v) => setFields(f => ({ ...f, ist_pflichtanforderung: !!v }))}
          />
          <Label htmlFor="ist_pflichtanforderung" className="font-normal">{fieldLabel('technische_anforderungen', 'ist_pflichtanforderung')}</Label>
        </div>
      </div>
    ),
    'pruefstatus': (
      <div key="pruefstatus" className="space-y-1.5">
        <Label htmlFor="pruefstatus">{fieldLabel('technische_anforderungen', 'pruefstatus')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Select
          value={lookupKey(fields.pruefstatus) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, pruefstatus: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="pruefstatus" className="max-sm:h-11"><SelectValue placeholder="z. B. Ungeprüft, Bestätigt" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="ungeprueft">{lookupLabel('technische_anforderungen', 'pruefstatus', 'ungeprueft') ?? 'Ungeprüft'}</SelectItem>
            <SelectItem value="zu_pruefen">{lookupLabel('technische_anforderungen', 'pruefstatus', 'zu_pruefen') ?? 'Zu prüfen'}</SelectItem>
            <SelectItem value="bestaetigt">{lookupLabel('technische_anforderungen', 'pruefstatus', 'bestaetigt') ?? 'Bestätigt'}</SelectItem>
            <SelectItem value="unklar">{lookupLabel('technische_anforderungen', 'pruefstatus', 'unklar') ?? 'Unklar'}</SelectItem>
            <SelectItem value="widerspruechlich">{lookupLabel('technische_anforderungen', 'pruefstatus', 'widerspruechlich') ?? 'Widersprüchlich'}</SelectItem>
            <SelectItem value="nicht_erfuellt">{lookupLabel('technische_anforderungen', 'pruefstatus', 'nicht_erfuellt') ?? 'Nicht erfüllt'}</SelectItem>
            <SelectItem value="nicht_anwendbar">{lookupLabel('technische_anforderungen', 'pruefstatus', 'nicht_anwendbar') ?? 'Nicht anwendbar'}</SelectItem>
          </SelectContent>
        </Select>
        {showErrors && !fields.pruefstatus && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('technische_anforderungen', 'pruefstatus')}</p>
        )}
      </div>
    ),
    'begruendung_pruefstatus': (
      <div key="begruendung_pruefstatus" className="space-y-1.5">
        <Label htmlFor="begruendung_pruefstatus">{fieldLabel('technische_anforderungen', 'begruendung_pruefstatus')}</Label>
        <Textarea
          id="begruendung_pruefstatus"
          placeholder="Warum dieser Status?"
          value={fields.begruendung_pruefstatus ?? ''}
          onChange={e => setFields(f => ({ ...f, begruendung_pruefstatus: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'verantwortlicher_vorname': (
      <div key="verantwortlicher_vorname" className="space-y-1.5">
        <Label htmlFor="verantwortlicher_vorname">{fieldLabel('technische_anforderungen', 'verantwortlicher_vorname')}</Label>
        <Input
          id="verantwortlicher_vorname"
          placeholder="z. B. Anna"
          value={fields.verantwortlicher_vorname ?? ''}
          onChange={e => setFields(f => ({ ...f, verantwortlicher_vorname: e.target.value }))}
        />
      </div>
    ),
    'verantwortlicher_nachname': (
      <div key="verantwortlicher_nachname" className="space-y-1.5">
        <Label htmlFor="verantwortlicher_nachname">{fieldLabel('technische_anforderungen', 'verantwortlicher_nachname')}</Label>
        <Input
          id="verantwortlicher_nachname"
          placeholder="z. B. Müller"
          value={fields.verantwortlicher_nachname ?? ''}
          onChange={e => setFields(f => ({ ...f, verantwortlicher_nachname: e.target.value }))}
        />
      </div>
    ),
    'gueltig_ab': (
      <div key="gueltig_ab" className="space-y-1.5">
        <Label htmlFor="gueltig_ab">{fieldLabel('technische_anforderungen', 'gueltig_ab')}</Label>
        <DatePicker
          id="gueltig_ab"
          placeholder="Ab wann gilt es?"
          mode="date"
          value={fields.gueltig_ab ?? null}
          onChange={v => setFields(f => ({ ...f, gueltig_ab: v ?? undefined }))}
        />
      </div>
    ),
    'gueltig_bis': (
      <div key="gueltig_bis" className="space-y-1.5">
        <Label htmlFor="gueltig_bis">{fieldLabel('technische_anforderungen', 'gueltig_bis')}</Label>
        <DatePicker
          id="gueltig_bis"
          placeholder="Bis wann gilt es?"
          mode="date"
          value={fields.gueltig_bis ?? null}
          onChange={v => setFields(f => ({ ...f, gueltig_bis: v ?? undefined }))}
        />
      </div>
    ),
    'erneute_pruefung': (
      <div key="erneute_pruefung" className="space-y-1.5">
        <Label htmlFor="erneute_pruefung">{fieldLabel('technische_anforderungen', 'erneute_pruefung')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="erneute_pruefung"
            checked={!!fields.erneute_pruefung}
            onCheckedChange={(v) => setFields(f => ({ ...f, erneute_pruefung: !!v }))}
          />
          <Label htmlFor="erneute_pruefung" className="font-normal">{fieldLabel('technische_anforderungen', 'erneute_pruefung')}</Label>
        </div>
      </div>
    ),
    'quellen': (
      <div key="quellen" className="space-y-1.5">
        <Label htmlFor="quellen">{fieldLabel('technische_anforderungen', 'quellen')}</Label>
        <MultiCombobox
          id="quellen"
          placeholder="Welche Quellen?"
          items={informationsquellenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.titel ?? r.record_id),
          }))}
          values={extractRecordIds(fields.quellen)}
          onChange={ids => setFields(f => ({ ...f, quellen: ids.length ? ids.map(id => createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, id)) as any : undefined }))}
          onCreateNew={(q) => openCreateInformationsquellen("quellen", q)}
          createLabel={t('create_in', { entity: appLabel('informationsquellen') })}
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
  const FIELD_LABELS: Record<string, string> = {"anfrage": "Anfrage", "bezeichnung": "Bezeichnung", "beschreibung": "Beschreibung", "anforderungstyp": "Anforderungstyp", "ursprung": "Ursprung", "sollwert": "Sollwert", "einheit": "Einheit", "vergleichsoperator": "Vergleichsoperator", "min_wert": "Mindestwert", "max_wert": "Höchstwert", "ist_pflichtanforderung": "Pflichtanforderung", "pruefstatus": "Prüfstatus", "begruendung_pruefstatus": "Begründung zum Prüfstatus", "verantwortlicher_vorname": "Verantwortlicher Vorname", "verantwortlicher_nachname": "Verantwortlicher Nachname", "gueltig_ab": "Gültig ab", "gueltig_bis": "Gültig bis", "erneute_pruefung": "Erneute Prüfung erforderlich", "quellen": "Quellen"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"anfrage": {"anfragenummer": "Anfragenummer", "kunde": "Kunde", "eingangsdatum": "Eingangsdatum", "eingangskanal": "Eingangskanal", "kundenreferenz": "Kundenreferenz", "kontakt_vorname": "Ansprechpartner zur Anfrage Vorname", "kontakt_nachname": "Ansprechpartner zur Anfrage Nachname", "kontakt_email": "E-Mail zur Anfrage", "produktfamilie": "Produkt oder Produktfamilie", "produktvariante": "Produktvariante", "gewuenschte_menge": "Gewünschte Menge (größer als 0)", "gewuenschter_liefertermin": "Gewünschter Liefertermin", "anfragebeschreibung": "Anfragebeschreibung", "urspruengliche_kundenanforderungen": "Ursprüngliche Kundenanforderungen (unverändert)", "prioritaet": "Priorität", "verantwortlicher_vorname": "Verantwortlicher Vorname", "verantwortlicher_nachname": "Verantwortlicher Nachname", "status": "Status", "klaeraufwand": "Technischer Kläraufwand", "zieltermin_klaerung": "Zieltermin der Klärung", "vollstaendigkeit": "Vollständigkeit", "schaetzung_bearbeitung_min": "Geschätzte aktive Bearbeitungszeit (Minuten)", "gemessen_bearbeitung_min": "Gemessene aktive Bearbeitungszeit (Minuten)", "wartezeit_kunde_min": "Gemessene Wartezeit auf Kunde (Minuten)", "wartezeit_intern_min": "Gemessene interne Wartezeit (Minuten)", "geklaert_am": "Technisch geklärt am", "anzahl_nachtraegliche_aenderungen": "Anzahl nachträglicher Änderungen", "anzahl_nacharbeiten": "Anzahl erforderlicher Nacharbeiten"}, "quellen": {"eingangszeitpunkt": "Eingang", "versionskennung": "Versionskennung", "quellenstatus": "Quellenstatus", "zusammenfassung": "Inhaltliche Zusammenfassung", "extraktionsstatus": "Extraktionsstatus", "pruefung_durch": "Geprüft durch", "pruefung_am": "Geprüft am", "erneute_pruefung": "Erneute Prüfung der betroffenen Objekte erforderlich", "bemerkung": "Bemerkung", "ersetzt_quelle": "Ersetzt Quelle", "anfrage": "Anfrage", "quellentyp": "Quellentyp", "titel": "Titel", "datei": "Datei", "referenz_url": "Webadresse oder Referenz", "urheber": "Absender oder Urheber", "quellendatum": "Quellendatum"}};
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
                      <Label>{fieldLabel('technische_anforderungen', k)}</Label>
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
                <AttachmentsSection appId={APP_IDS.TECHNISCHE_ANFORDERUNGEN} recordId={recordId} />
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
    </>
  );
}