/**
 * OffenePunkteDialog — pre-generated create/edit dialog for OffenePunkte.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * technischeAnforderungenList (full hook array — resolves the TechnischeAnforderungen applookup),
 * informationsquellenList (full hook array — resolves the Informationsquellen applookup),
 * kundenanfragenList (full hook array — resolves the Kundenanfragen applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * OffenePunkteDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<OffenePunkte['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<OffenePunkteDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { OffenePunkte, TechnischeAnforderungen, Informationsquellen, Kundenanfragen, LookupValue } from '@/types/app';
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
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/OffenePunkte';
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
import { InformationsquellenDialog } from '@/components/dialogs/InformationsquellenDialog';
import { KundenanfragenDialog } from '@/components/dialogs/KundenanfragenDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for OffenePunkteDialog.defaultValues — see file header. */
export type OffenePunkteDialogDefaults = Omit<OffenePunkte['fields'], 'punktetyp' | 'prioritaet' | 'auswirkung' | 'status'> & {
    punktetyp?: LookupValue | string;
    prioritaet?: LookupValue | string;
    auswirkung?: LookupValue | string;
    status?: LookupValue | string;
  };

interface OffenePunkteDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: OffenePunkte['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: OffenePunkteDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  technischeAnforderungenList: TechnischeAnforderungen[];
  informationsquellenList: Informationsquellen[];
  kundenanfragenList: Kundenanfragen[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  punktetyp: LOOKUP_OPTIONS['offene_punkte']?.['punktetyp'] ?? [],
  prioritaet: LOOKUP_OPTIONS['offene_punkte']?.['prioritaet'] ?? [],
  auswirkung: LOOKUP_OPTIONS['offene_punkte']?.['auswirkung'] ?? [],
  status: LOOKUP_OPTIONS['offene_punkte']?.['status'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  betroffene_anforderungen: APP_IDS.TECHNISCHE_ANFORDERUNGEN,
  betroffene_quellen: APP_IDS.INFORMATIONSQUELLEN,
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

export function OffenePunkteDialog({ open, onClose, onSubmit, defaultValues, recordId, technischeAnforderungenList, informationsquellenList, kundenanfragenList, enablePhotoScan = true, enablePhotoLocation = true }: OffenePunkteDialogProps) {
  const [fields, setFields] = useState<Partial<OffenePunkte['fields']>>({});
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
  const REQUIRED_FIELDS = ['anfrage', 'kurztitel', 'beschreibung', 'prioritaet', 'status'] as const;
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
      'betroffene_quellen': informationsquellenList,
      'anfrage': kundenanfragenList,
    },
  }), [technischeAnforderungenList, informationsquellenList, kundenanfragenList, ]);
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
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<OffenePunkte['fields']>);
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
      const clean = cleanFieldsForApi(merged, 'offene_punkte');
      await onSubmit(clean as OffenePunkte['fields']);
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
      contextParts.push(`<available-records field="betroffene_quellen" entity="Informationsquellen">\n${JSON.stringify(informationsquellenList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
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
      const schema = `{\n  "betroffene_anforderungen": string[] | null, // Display names from Technische Anforderungen, one per referenced record (see <available-records>)\n  "betroffene_quellen": string[] | null, // Display names from Informationsquellen, one per referenced record (see <available-records>)\n  "anfrage": string | null, // Display name from Kundenanfragen (see <available-records>)\n  "kurztitel": string | null, // Kurztitel\n  "beschreibung": string | null, // Beschreibung und Grund\n  "punktetyp": LookupValue | null, // Punktetyp (select one key: "fehlende_information" | "widerspruch" | "technische_pruefung" | "normenpruefung" | "machbarkeit" | "risiko" | "rueckfrage" | "freigabe" | "sonstiges") mapping: fehlende_information=Fehlende Information, widerspruch=Widerspruch, technische_pruefung=Technische Prüfung, normenpruefung=Normenprüfung, machbarkeit=Machbarkeit, risiko=Risiko, rueckfrage=Rückfrage, freigabe=Freigabe, sonstiges=Sonstiges\n  "prioritaet": LookupValue | null, // Priorität (select one key: "niedrig" | "normal" | "hoch" | "kritisch") mapping: niedrig=Niedrig, normal=Normal, hoch=Hoch, kritisch=Kritisch\n  "auswirkung": LookupValue | null, // Auswirkung (select one key: "qualitaet" | "sicherheit" | "funktion" | "kosten" | "termin" | "herstellbarkeit" | "normenkonformitaet" | "sonstiges") mapping: qualitaet=Qualität, sicherheit=Sicherheit, funktion=Funktion, kosten=Kosten, termin=Termin, herstellbarkeit=Herstellbarkeit, normenkonformitaet=Normenkonformität, sonstiges=Sonstiges\n  "zustaendige_rolle": string | null, // Zuständige Rolle\n  "verantwortlicher_vorname": string | null, // Verantwortlicher Vorname\n  "verantwortlicher_nachname": string | null, // Verantwortlicher Nachname\n  "faellig_am": string | null, // YYYY-MM-DD\n  "status": LookupValue | null, // Status (select one key: "neu" | "zugewiesen" | "in_bearbeitung" | "wartet_auf_kunde" | "wartet_intern" | "zur_entscheidung" | "erledigt" | "entschieden_akzeptiert" | "nicht_mehr_relevant") mapping: neu=Neu, zugewiesen=Zugewiesen, in_bearbeitung=In Bearbeitung, wartet_auf_kunde=Wartet auf Kunde, wartet_intern=Wartet intern, zur_entscheidung=Zur Entscheidung, erledigt=Erledigt, entschieden_akzeptiert=Entschieden akzeptiert, nicht_mehr_relevant=Nicht mehr relevant\n  "erledigungskriterium": string | null, // Erledigungskriterium\n  "loesung_oder_ergebnis": string | null, // Lösung oder Ergebnis\n  "antwort_geprueft": boolean | null, // Eingegangene Antwort wurde fachlich geprüft\n  "abgeschlossen_am": string | null, // YYYY-MM-DDTHH:MM\n  "abschluss_durch": string | null, // Abgeschlossen durch\n  "erneute_pruefung": boolean | null, // Erneute Prüfung erforderlich\n}`;
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
        const applookupKeys = new Set<string>(["betroffene_anforderungen", "betroffene_quellen", "anfrage"]);
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
        const betroffene_quellenNames = raw['betroffene_quellen'];
        if (Array.isArray(betroffene_quellenNames) && betroffene_quellenNames.length > 0) {
          const betroffene_quellenUrls = (betroffene_quellenNames as unknown[])
            .map(n => informationsquellenList.find(r => matchName(String(n), [String(r.fields.titel ?? '')])))
            .filter((r): r is NonNullable<typeof r> => Boolean(r))
            .map(r => createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, r.record_id));
          if (betroffene_quellenUrls.length > 0) merged['betroffene_quellen'] = betroffene_quellenUrls;
        }
        const anfrageName = raw['anfrage'] as string | null;
        if (anfrageName) {
          const anfrageMatch = kundenanfragenList.find(r => matchName(anfrageName!, [String(r.fields.anfragenummer ?? '')]));
          if (anfrageMatch) merged['anfrage'] = createRecordUrl(APP_IDS.KUNDENANFRAGEN, anfrageMatch.record_id);
        }
        return merged as Partial<OffenePunkte['fields']>;
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
    ? t('edit_entity', { entity: appLabel('offene_punkte') })
    : t('new_entity', { entity: appLabel('offene_punkte') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'betroffene_anforderungen': (
      <div key="betroffene_anforderungen" className="space-y-1.5">
        <Label htmlFor="betroffene_anforderungen">{fieldLabel('offene_punkte', 'betroffene_anforderungen')}</Label>
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
    'betroffene_quellen': (
      <div key="betroffene_quellen" className="space-y-1.5">
        <Label htmlFor="betroffene_quellen">{fieldLabel('offene_punkte', 'betroffene_quellen')}</Label>
        <MultiCombobox
          id="betroffene_quellen"
          placeholder=""
          items={informationsquellenListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.titel ?? r.record_id),
          }))}
          values={extractRecordIds(fields.betroffene_quellen)}
          onChange={ids => setFields(f => ({ ...f, betroffene_quellen: ids.length ? ids.map(id => createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, id)) as any : undefined }))}
          onCreateNew={(q) => openCreateInformationsquellen("betroffene_quellen", q)}
          createLabel={t('create_in', { entity: appLabel('informationsquellen') })}
        />
      </div>
    ),
    'anfrage': (
      <div key="anfrage" className="space-y-1.5">
        <Label htmlFor="anfrage">{fieldLabel('offene_punkte', 'anfrage')} <span className="text-destructive" aria-hidden="true">*</span></Label>
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
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('offene_punkte', 'anfrage')}</p>
        )}
      </div>
    ),
    'kurztitel': (
      <div key="kurztitel" className="space-y-1.5">
        <Label htmlFor="kurztitel">{fieldLabel('offene_punkte', 'kurztitel')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="kurztitel"
          placeholder=""
          value={fields.kurztitel ?? ''}
          onChange={e => setFields(f => ({ ...f, kurztitel: e.target.value }))}
          required
        />
        {showErrors && !fields.kurztitel && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('offene_punkte', 'kurztitel')}</p>
        )}
      </div>
    ),
    'beschreibung': (
      <div key="beschreibung" className="space-y-1.5">
        <Label htmlFor="beschreibung">{fieldLabel('offene_punkte', 'beschreibung')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="beschreibung"
          placeholder=""
          value={fields.beschreibung ?? ''}
          onChange={e => setFields(f => ({ ...f, beschreibung: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.beschreibung && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('offene_punkte', 'beschreibung')}</p>
        )}
      </div>
    ),
    'punktetyp': (
      <div key="punktetyp" className="space-y-1.5">
        <Label htmlFor="punktetyp">{fieldLabel('offene_punkte', 'punktetyp')}</Label>
        <Select
          value={lookupKey(fields.punktetyp) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, punktetyp: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="punktetyp" className="max-sm:h-11"><SelectValue placeholder="" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="fehlende_information">{lookupLabel('offene_punkte', 'punktetyp', 'fehlende_information') ?? 'Fehlende Information'}</SelectItem>
            <SelectItem value="widerspruch">{lookupLabel('offene_punkte', 'punktetyp', 'widerspruch') ?? 'Widerspruch'}</SelectItem>
            <SelectItem value="technische_pruefung">{lookupLabel('offene_punkte', 'punktetyp', 'technische_pruefung') ?? 'Technische Prüfung'}</SelectItem>
            <SelectItem value="normenpruefung">{lookupLabel('offene_punkte', 'punktetyp', 'normenpruefung') ?? 'Normenprüfung'}</SelectItem>
            <SelectItem value="machbarkeit">{lookupLabel('offene_punkte', 'punktetyp', 'machbarkeit') ?? 'Machbarkeit'}</SelectItem>
            <SelectItem value="risiko">{lookupLabel('offene_punkte', 'punktetyp', 'risiko') ?? 'Risiko'}</SelectItem>
            <SelectItem value="rueckfrage">{lookupLabel('offene_punkte', 'punktetyp', 'rueckfrage') ?? 'Rückfrage'}</SelectItem>
            <SelectItem value="freigabe">{lookupLabel('offene_punkte', 'punktetyp', 'freigabe') ?? 'Freigabe'}</SelectItem>
            <SelectItem value="sonstiges">{lookupLabel('offene_punkte', 'punktetyp', 'sonstiges') ?? 'Sonstiges'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    'prioritaet': (
      <div key="prioritaet" className="space-y-1.5">
        <Label htmlFor="prioritaet">{fieldLabel('offene_punkte', 'prioritaet')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.prioritaet) === 'niedrig'}
            onClick={() => setFields(f => ({ ...f, prioritaet: (lookupKey(f.prioritaet) === 'niedrig' ? undefined : 'niedrig') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.prioritaet) === 'niedrig'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('offene_punkte', 'prioritaet', 'niedrig') ?? 'Niedrig'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.prioritaet) === 'normal'}
            onClick={() => setFields(f => ({ ...f, prioritaet: (lookupKey(f.prioritaet) === 'normal' ? undefined : 'normal') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.prioritaet) === 'normal'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('offene_punkte', 'prioritaet', 'normal') ?? 'Normal'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.prioritaet) === 'hoch'}
            onClick={() => setFields(f => ({ ...f, prioritaet: (lookupKey(f.prioritaet) === 'hoch' ? undefined : 'hoch') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.prioritaet) === 'hoch'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('offene_punkte', 'prioritaet', 'hoch') ?? 'Hoch'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.prioritaet) === 'kritisch'}
            onClick={() => setFields(f => ({ ...f, prioritaet: (lookupKey(f.prioritaet) === 'kritisch' ? undefined : 'kritisch') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.prioritaet) === 'kritisch'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('offene_punkte', 'prioritaet', 'kritisch') ?? 'Kritisch'}
          </button>
        </div>
        {showErrors && !fields.prioritaet && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('offene_punkte', 'prioritaet')}</p>
        )}
      </div>
    ),
    'auswirkung': (
      <div key="auswirkung" className="space-y-1.5">
        <Label htmlFor="auswirkung">{fieldLabel('offene_punkte', 'auswirkung')}</Label>
        <Select
          value={lookupKey(fields.auswirkung) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, auswirkung: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="auswirkung" className="max-sm:h-11"><SelectValue placeholder="" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="qualitaet">{lookupLabel('offene_punkte', 'auswirkung', 'qualitaet') ?? 'Qualität'}</SelectItem>
            <SelectItem value="sicherheit">{lookupLabel('offene_punkte', 'auswirkung', 'sicherheit') ?? 'Sicherheit'}</SelectItem>
            <SelectItem value="funktion">{lookupLabel('offene_punkte', 'auswirkung', 'funktion') ?? 'Funktion'}</SelectItem>
            <SelectItem value="kosten">{lookupLabel('offene_punkte', 'auswirkung', 'kosten') ?? 'Kosten'}</SelectItem>
            <SelectItem value="termin">{lookupLabel('offene_punkte', 'auswirkung', 'termin') ?? 'Termin'}</SelectItem>
            <SelectItem value="herstellbarkeit">{lookupLabel('offene_punkte', 'auswirkung', 'herstellbarkeit') ?? 'Herstellbarkeit'}</SelectItem>
            <SelectItem value="normenkonformitaet">{lookupLabel('offene_punkte', 'auswirkung', 'normenkonformitaet') ?? 'Normenkonformität'}</SelectItem>
            <SelectItem value="sonstiges">{lookupLabel('offene_punkte', 'auswirkung', 'sonstiges') ?? 'Sonstiges'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    'zustaendige_rolle': (
      <div key="zustaendige_rolle" className="space-y-1.5">
        <Label htmlFor="zustaendige_rolle">{fieldLabel('offene_punkte', 'zustaendige_rolle')}</Label>
        <Input
          id="zustaendige_rolle"
          placeholder=""
          value={fields.zustaendige_rolle ?? ''}
          onChange={e => setFields(f => ({ ...f, zustaendige_rolle: e.target.value }))}
        />
      </div>
    ),
    'verantwortlicher_vorname': (
      <div key="verantwortlicher_vorname" className="space-y-1.5">
        <Label htmlFor="verantwortlicher_vorname">{fieldLabel('offene_punkte', 'verantwortlicher_vorname')}</Label>
        <Input
          id="verantwortlicher_vorname"
          placeholder=""
          value={fields.verantwortlicher_vorname ?? ''}
          onChange={e => setFields(f => ({ ...f, verantwortlicher_vorname: e.target.value }))}
        />
      </div>
    ),
    'verantwortlicher_nachname': (
      <div key="verantwortlicher_nachname" className="space-y-1.5">
        <Label htmlFor="verantwortlicher_nachname">{fieldLabel('offene_punkte', 'verantwortlicher_nachname')}</Label>
        <Input
          id="verantwortlicher_nachname"
          placeholder=""
          value={fields.verantwortlicher_nachname ?? ''}
          onChange={e => setFields(f => ({ ...f, verantwortlicher_nachname: e.target.value }))}
        />
      </div>
    ),
    'faellig_am': (
      <div key="faellig_am" className="space-y-1.5">
        <Label htmlFor="faellig_am">{fieldLabel('offene_punkte', 'faellig_am')}</Label>
        <DatePicker
          id="faellig_am"
          placeholder=""
          mode="date"
          value={fields.faellig_am ?? null}
          onChange={v => setFields(f => ({ ...f, faellig_am: v ?? undefined }))}
        />
      </div>
    ),
    'status': (
      <div key="status" className="space-y-1.5">
        <Label htmlFor="status">{fieldLabel('offene_punkte', 'status')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Select
          value={lookupKey(fields.status) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, status: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="status" className="max-sm:h-11"><SelectValue placeholder="" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="neu">{lookupLabel('offene_punkte', 'status', 'neu') ?? 'Neu'}</SelectItem>
            <SelectItem value="zugewiesen">{lookupLabel('offene_punkte', 'status', 'zugewiesen') ?? 'Zugewiesen'}</SelectItem>
            <SelectItem value="in_bearbeitung">{lookupLabel('offene_punkte', 'status', 'in_bearbeitung') ?? 'In Bearbeitung'}</SelectItem>
            <SelectItem value="wartet_auf_kunde">{lookupLabel('offene_punkte', 'status', 'wartet_auf_kunde') ?? 'Wartet auf Kunde'}</SelectItem>
            <SelectItem value="wartet_intern">{lookupLabel('offene_punkte', 'status', 'wartet_intern') ?? 'Wartet intern'}</SelectItem>
            <SelectItem value="zur_entscheidung">{lookupLabel('offene_punkte', 'status', 'zur_entscheidung') ?? 'Zur Entscheidung'}</SelectItem>
            <SelectItem value="erledigt">{lookupLabel('offene_punkte', 'status', 'erledigt') ?? 'Erledigt'}</SelectItem>
            <SelectItem value="entschieden_akzeptiert">{lookupLabel('offene_punkte', 'status', 'entschieden_akzeptiert') ?? 'Entschieden akzeptiert'}</SelectItem>
            <SelectItem value="nicht_mehr_relevant">{lookupLabel('offene_punkte', 'status', 'nicht_mehr_relevant') ?? 'Nicht mehr relevant'}</SelectItem>
          </SelectContent>
        </Select>
        {showErrors && !fields.status && (
          <p className="text-xs text-destructive mt-1" role="alert">{requiredMessage('offene_punkte', 'status')}</p>
        )}
      </div>
    ),
    'erledigungskriterium': (
      <div key="erledigungskriterium" className="space-y-1.5">
        <Label htmlFor="erledigungskriterium">{fieldLabel('offene_punkte', 'erledigungskriterium')}</Label>
        <Textarea
          id="erledigungskriterium"
          placeholder=""
          value={fields.erledigungskriterium ?? ''}
          onChange={e => setFields(f => ({ ...f, erledigungskriterium: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'loesung_oder_ergebnis': (
      <div key="loesung_oder_ergebnis" className="space-y-1.5">
        <Label htmlFor="loesung_oder_ergebnis">{fieldLabel('offene_punkte', 'loesung_oder_ergebnis')}</Label>
        <Textarea
          id="loesung_oder_ergebnis"
          placeholder=""
          value={fields.loesung_oder_ergebnis ?? ''}
          onChange={e => setFields(f => ({ ...f, loesung_oder_ergebnis: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'antwort_geprueft': (
      <div key="antwort_geprueft" className="space-y-1.5">
        <Label htmlFor="antwort_geprueft">{fieldLabel('offene_punkte', 'antwort_geprueft')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="antwort_geprueft"
            checked={!!fields.antwort_geprueft}
            onCheckedChange={(v) => setFields(f => ({ ...f, antwort_geprueft: !!v }))}
          />
          <Label htmlFor="antwort_geprueft" className="font-normal">{fieldLabel('offene_punkte', 'antwort_geprueft')}</Label>
        </div>
      </div>
    ),
    'abgeschlossen_am': (
      <div key="abgeschlossen_am" className="space-y-1.5">
        <Label htmlFor="abgeschlossen_am">{fieldLabel('offene_punkte', 'abgeschlossen_am')}</Label>
        <DatePicker
          id="abgeschlossen_am"
          placeholder=""
          mode="datetime"
          value={fields.abgeschlossen_am ?? null}
          onChange={v => setFields(f => ({ ...f, abgeschlossen_am: v ?? undefined }))}
        />
      </div>
    ),
    'abschluss_durch': (
      <div key="abschluss_durch" className="space-y-1.5">
        <Label htmlFor="abschluss_durch">{fieldLabel('offene_punkte', 'abschluss_durch')}</Label>
        <Input
          id="abschluss_durch"
          placeholder=""
          value={fields.abschluss_durch ?? ''}
          onChange={e => setFields(f => ({ ...f, abschluss_durch: e.target.value }))}
        />
      </div>
    ),
    'erneute_pruefung': (
      <div key="erneute_pruefung" className="space-y-1.5">
        <Label htmlFor="erneute_pruefung">{fieldLabel('offene_punkte', 'erneute_pruefung')}</Label>
        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id="erneute_pruefung"
            checked={!!fields.erneute_pruefung}
            onCheckedChange={(v) => setFields(f => ({ ...f, erneute_pruefung: !!v }))}
          />
          <Label htmlFor="erneute_pruefung" className="font-normal">{fieldLabel('offene_punkte', 'erneute_pruefung')}</Label>
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
  const FIELD_LABELS: Record<string, string> = {"betroffene_anforderungen": "Betroffene Anforderungen", "betroffene_quellen": "Betroffene Quellen", "anfrage": "Anfrage", "kurztitel": "Kurztitel", "beschreibung": "Beschreibung und Grund", "punktetyp": "Punktetyp", "prioritaet": "Priorität", "auswirkung": "Auswirkung", "zustaendige_rolle": "Zuständige Rolle", "verantwortlicher_vorname": "Verantwortlicher Vorname", "verantwortlicher_nachname": "Verantwortlicher Nachname", "faellig_am": "Fällig am", "status": "Status", "erledigungskriterium": "Erledigungskriterium", "loesung_oder_ergebnis": "Lösung oder Ergebnis", "antwort_geprueft": "Eingegangene Antwort wurde fachlich geprüft", "abgeschlossen_am": "Abgeschlossen am", "abschluss_durch": "Abgeschlossen durch", "erneute_pruefung": "Erneute Prüfung erforderlich"};
  const CURRENCY_KEYS = new Set<string>([]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"betroffene_anforderungen": {"anfrage": "Anfrage", "bezeichnung": "Bezeichnung", "beschreibung": "Beschreibung", "anforderungstyp": "Anforderungstyp", "ursprung": "Ursprung", "sollwert": "Sollwert", "einheit": "Einheit", "vergleichsoperator": "Vergleichsoperator", "min_wert": "Mindestwert", "max_wert": "Höchstwert", "ist_pflichtanforderung": "Pflichtanforderung", "pruefstatus": "Prüfstatus", "begruendung_pruefstatus": "Begründung zum Prüfstatus", "verantwortlicher_vorname": "Verantwortlicher Vorname", "verantwortlicher_nachname": "Verantwortlicher Nachname", "gueltig_ab": "Gültig ab", "gueltig_bis": "Gültig bis", "erneute_pruefung": "Erneute Prüfung erforderlich", "quellen": "Quellen"}, "betroffene_quellen": {"eingangszeitpunkt": "Eingang", "versionskennung": "Versionskennung", "quellenstatus": "Quellenstatus", "zusammenfassung": "Inhaltliche Zusammenfassung", "extraktionsstatus": "Extraktionsstatus", "pruefung_durch": "Geprüft durch", "pruefung_am": "Geprüft am", "erneute_pruefung": "Erneute Prüfung der betroffenen Objekte erforderlich", "bemerkung": "Bemerkung", "ersetzt_quelle": "Ersetzt Quelle", "anfrage": "Anfrage", "quellentyp": "Quellentyp", "titel": "Titel", "datei": "Datei", "referenz_url": "Webadresse oder Referenz", "urheber": "Absender oder Urheber", "quellendatum": "Quellendatum"}, "anfrage": {"anfragenummer": "Anfragenummer", "kunde": "Kunde", "eingangsdatum": "Eingangsdatum", "eingangskanal": "Eingangskanal", "kundenreferenz": "Kundenreferenz", "kontakt_vorname": "Ansprechpartner zur Anfrage Vorname", "kontakt_nachname": "Ansprechpartner zur Anfrage Nachname", "kontakt_email": "E-Mail zur Anfrage", "produktfamilie": "Produkt oder Produktfamilie", "produktvariante": "Produktvariante", "gewuenschte_menge": "Gewünschte Menge (größer als 0)", "gewuenschter_liefertermin": "Gewünschter Liefertermin", "anfragebeschreibung": "Anfragebeschreibung", "urspruengliche_kundenanforderungen": "Ursprüngliche Kundenanforderungen (unverändert)", "prioritaet": "Priorität", "verantwortlicher_vorname": "Verantwortlicher Vorname", "verantwortlicher_nachname": "Verantwortlicher Nachname", "status": "Status", "klaeraufwand": "Technischer Kläraufwand", "zieltermin_klaerung": "Zieltermin der Klärung", "vollstaendigkeit": "Vollständigkeit", "schaetzung_bearbeitung_min": "Geschätzte aktive Bearbeitungszeit (Minuten)", "gemessen_bearbeitung_min": "Gemessene aktive Bearbeitungszeit (Minuten)", "wartezeit_kunde_min": "Gemessene Wartezeit auf Kunde (Minuten)", "wartezeit_intern_min": "Gemessene interne Wartezeit (Minuten)", "geklaert_am": "Technisch geklärt am", "anzahl_nachtraegliche_aenderungen": "Anzahl nachträglicher Änderungen", "anzahl_nacharbeiten": "Anzahl erforderlicher Nacharbeiten"}};
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
                      <Label>{fieldLabel('offene_punkte', k)}</Label>
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
                <AttachmentsSection appId={APP_IDS.OFFENE_PUNKTE} recordId={recordId} />
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