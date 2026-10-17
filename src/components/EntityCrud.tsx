/**
 * EntityCrud — pre-generated CRUD + overlay plumbing for the dashboard.
 * Compose it; NEVER re-roll dialog state, submit handlers, an overlay stack
 * or a RecordOverlayHost in the page — this file owns all of it.
 *
 * API at a glance:
 *   const data = useDashboardData();
 *   const crud = useEntityCrud(data, {
 *     // optional — the ONE semantic slot on the overlay: the record's next
 *     // workflow step. Return undefined for types without one.
 *     footer: (top) => top.type === 'kunden'
 *       ? { label: …, onClick: () => … }
 *       : undefined,
 *   });
 *
 *   `top.type` is the SAME camelCase key as `crud.<entity>` — one spelling
 *   per entity, everywhere in this API.
 *   …
 *   crud.kunden.openCreate({ …defaults })   // create dialog, prefilled — defaults are
 *                                       // shape-tolerant: bare lookup keys / record ids are fine
 *   crud.kunden.openEdit(record)            // edit dialog (recordId + defaults wired)
 *   crud.kunden.openDetail(record)          // record overlay — pass the RAW record,
 *                                       // enrichment is resolved inside
 *   crud.overlay                         // RecordOverlayStack<OverlayItem> for drills:
 *                                       // push / pop / replace / close
 *   crud.enriched.kunden              // the display-ready array for EVERY entity —
 *                                       // Enriched* where relations exist, the raw array
 *                                       // otherwise. Reuse these; never call enrich*()
 *                                       // in the page, and never guess which entity has
 *                                       // one: they all do.
 *   {crud.surfaces}                      // render ONCE at the end of the page JSX:
 *                                       // all entity dialogs + the overlay host
 *
 * Built in (do NOT re-implement): optimistic update + Rückgängig counter-write
 * on edit, fetchAll-on-error, edit-from-overlay, and per-entity overlay bodies
 * (RecordHeader + <{Entity}Details> with every relation reachable and the
 * contextual "+" prefilled; list-field back-references additionally get a
 * "choose existing" picker that links an EXISTING record — built in, do not
 * re-roll). Drag writes (onEventDrop/onCardMove) stay YOURS:
 * optimistic setter first, PATCH in background, undoToast with counter-write.
 *
 * Overlay content per entity (the host renders these — you never compose
 * Details blocks yourself):
 *   kunden: kundennummer, firmenname, ansprechpartner_vorname, ansprechpartner_nachname, e_mail, telefon, strasse, hausnummer, …  ·  ← kundenanfragen (list + contextual +)
 *   kundenanfragen: anfragenummer, kunde, eingangsdatum, eingangskanal, kundenreferenz, kontakt_vorname, kontakt_nachname, kontakt_email, …  ·  → kunden · ← technischer_abschluss (list + contextual +) · ← statusprotokoll (list + contextual +) · ← informationsquellen (list + contextual +) · ← technische_anforderungen (list + contextual +) · ← offene_punkte (list + contextual +) · ← aufgaben (list + contextual +) · ← beurteilungen (list + contextual +) · ← rueckfragen_und_kommunikation (list + contextual +) · ← entscheidungen (list + contextual +) · ← erfahrungen (list + contextual +) · ← wiederverwendung_von_erfahrungen (list + contextual +)
 *   technischer_abschluss: anfrage, pruefdatum, geprueft_von, anforderungen_geprueft, kritische_punkte_geklaert, entscheidungen_vorhanden, freigaben_vorhanden, verbleibende_abweichungen, …  ·  → kundenanfragen · ← erfahrungen (list + contextual +)
 *   statusprotokoll: anfrage, objekttyp, objektbezeichnung, alter_status, neuer_status, zeitpunkt, benutzer_vorname, benutzer_nachname, …  ·  → kundenanfragen
 *   informationsquellen: eingangszeitpunkt, versionskennung, quellenstatus, zusammenfassung, extraktionsstatus, pruefung_durch, pruefung_am, erneute_pruefung, …  ·  → informationsquellen · → kundenanfragen · ← technische_anforderungen (list + contextual + + choose existing) · ← offene_punkte (list + contextual + + choose existing) · ← beurteilungen (list + contextual + + choose existing) · ← rueckfragen_und_kommunikation (list + contextual +) · ← erfahrungen (list + contextual + + choose existing)
 *   technische_anforderungen: anfrage, bezeichnung, beschreibung, anforderungstyp, ursprung, sollwert, einheit, vergleichsoperator, …  ·  → kundenanfragen · → informationsquellen · ← offene_punkte (list + contextual + + choose existing) · ← beurteilungen (list + contextual + + choose existing) · ← entscheidungen (list + contextual + + choose existing)
 *   offene_punkte: betroffene_anforderungen, betroffene_quellen, anfrage, kurztitel, beschreibung, punktetyp, prioritaet, auswirkung, …  ·  → technische_anforderungen · → informationsquellen · → kundenanfragen · ← aufgaben (list + contextual +) · ← beurteilungen (list + contextual + + choose existing) · ← rueckfragen_und_kommunikation (list + contextual + + choose existing) · ← entscheidungen (list + contextual + + choose existing)
 *   aufgaben: anfrage, titel, beschreibung, aufgabentyp, verantwortlicher_vorname, verantwortlicher_nachname, mitwirkende, prioritaet, …  ·  → kundenanfragen · → offene_punkte · → aufgaben
 *   beurteilungen: betroffene_anforderungen, betroffene_offene_punkte, zugrunde_liegende_quellen, anfrage, beurteilungsgegenstand, beurteilungsart, einschaetzung, fachliche_begruendung, …  ·  → technische_anforderungen · → offene_punkte · → informationsquellen · → kundenanfragen · ← entscheidungen (list + contextual + + choose existing) · ← erfahrungen (list + contextual + + choose existing)
 *   rueckfragen_und_kommunikation: zugehoerige_offene_punkte, beantwortet_nachricht, quelle, anfrage, kommunikationstyp, kanal, absender, empfaenger, …  ·  → offene_punkte · → rueckfragen_und_kommunikation · → informationsquellen · → kundenanfragen
 *   entscheidungen: betroffene_anforderungen, betroffene_offene_punkte, zugrunde_liegende_beurteilungen, ersetzt_durch_entscheidung, anfrage, titel, entscheidungsgegenstand, entscheidungstyp, …  ·  → technische_anforderungen · → offene_punkte · → beurteilungen · → entscheidungen · → kundenanfragen · ← erfahrungen (list + contextual + + choose existing)
 *   erfahrungen: belegquellen, belegbeurteilungen, belegentscheidungen, ursprungsanfrage, titel, sachverhalt, erfahrungstyp, produktfamilie, …  ·  → informationsquellen · → beurteilungen · → entscheidungen · → kundenanfragen · → technischer_abschluss · ← wiederverwendung_von_erfahrungen (list + contextual +)
 *   wiederverwendung_von_erfahrungen: erfahrung, ziel_anfrage, abrufdatum, abrufgrund, aehnlichkeit, kontextunterschiede, gueltigkeit_geprueft, geprueft_von, …  ·  → erfahrungen · → kundenanfragen
 */
import { useState, useMemo, type ReactNode } from 'react';
import type { Kunden, Kundenanfragen, TechnischerAbschluss, Statusprotokoll, Informationsquellen, TechnischeAnforderungen, OffenePunkte, Aufgaben, Beurteilungen, RueckfragenUndKommunikation, Entscheidungen, Erfahrungen, WiederverwendungVonErfahrungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { LivingAppsService, createRecordUrl, extractRecordIds } from '@/services/livingAppsService';
import { enrichKundenanfragen, enrichTechnischerAbschluss, enrichStatusprotokoll, enrichInformationsquellen, enrichTechnischeAnforderungen, enrichOffenePunkte, enrichAufgaben, enrichBeurteilungen, enrichRueckfragenUndKommunikation, enrichEntscheidungen, enrichErfahrungen, enrichWiederverwendungVonErfahrungen } from '@/lib/enrich';
import type { EnrichedKundenanfragen, EnrichedTechnischerAbschluss, EnrichedStatusprotokoll, EnrichedInformationsquellen, EnrichedTechnischeAnforderungen, EnrichedOffenePunkte, EnrichedAufgaben, EnrichedBeurteilungen, EnrichedRueckfragenUndKommunikation, EnrichedEntscheidungen, EnrichedErfahrungen, EnrichedWiederverwendungVonErfahrungen } from '@/types/enriched';
import { useDashboardData } from '@/hooks/useDashboardData';
import {
  useRecordOverlayStack, RecordOverlayHost, RecordHeader,
  type RecordOverlayStack,
} from '@/components/widgets/RecordView';
import { KundenDialog, type KundenDialogDefaults } from '@/components/dialogs/KundenDialog';
import { KundenDetails } from '@/components/details/KundenDetails';
import { KundenanfragenDialog, type KundenanfragenDialogDefaults } from '@/components/dialogs/KundenanfragenDialog';
import { KundenanfragenDetails } from '@/components/details/KundenanfragenDetails';
import { TechnischerAbschlussDialog, type TechnischerAbschlussDialogDefaults } from '@/components/dialogs/TechnischerAbschlussDialog';
import { TechnischerAbschlussDetails } from '@/components/details/TechnischerAbschlussDetails';
import { StatusprotokollDialog, type StatusprotokollDialogDefaults } from '@/components/dialogs/StatusprotokollDialog';
import { StatusprotokollDetails } from '@/components/details/StatusprotokollDetails';
import { InformationsquellenDialog, type InformationsquellenDialogDefaults } from '@/components/dialogs/InformationsquellenDialog';
import { InformationsquellenDetails } from '@/components/details/InformationsquellenDetails';
import { TechnischeAnforderungenDialog, type TechnischeAnforderungenDialogDefaults } from '@/components/dialogs/TechnischeAnforderungenDialog';
import { TechnischeAnforderungenDetails } from '@/components/details/TechnischeAnforderungenDetails';
import { OffenePunkteDialog, type OffenePunkteDialogDefaults } from '@/components/dialogs/OffenePunkteDialog';
import { OffenePunkteDetails } from '@/components/details/OffenePunkteDetails';
import { AufgabenDialog, type AufgabenDialogDefaults } from '@/components/dialogs/AufgabenDialog';
import { AufgabenDetails } from '@/components/details/AufgabenDetails';
import { BeurteilungenDialog, type BeurteilungenDialogDefaults } from '@/components/dialogs/BeurteilungenDialog';
import { BeurteilungenDetails } from '@/components/details/BeurteilungenDetails';
import { RueckfragenUndKommunikationDialog, type RueckfragenUndKommunikationDialogDefaults } from '@/components/dialogs/RueckfragenUndKommunikationDialog';
import { RueckfragenUndKommunikationDetails } from '@/components/details/RueckfragenUndKommunikationDetails';
import { EntscheidungenDialog, type EntscheidungenDialogDefaults } from '@/components/dialogs/EntscheidungenDialog';
import { EntscheidungenDetails } from '@/components/details/EntscheidungenDetails';
import { ErfahrungenDialog, type ErfahrungenDialogDefaults } from '@/components/dialogs/ErfahrungenDialog';
import { ErfahrungenDetails } from '@/components/details/ErfahrungenDetails';
import { WiederverwendungVonErfahrungenDialog, type WiederverwendungVonErfahrungenDialogDefaults } from '@/components/dialogs/WiederverwendungVonErfahrungenDialog';
import { WiederverwendungVonErfahrungenDetails } from '@/components/details/WiederverwendungVonErfahrungenDetails';
import { PickExistingDialog } from '@/components/PickExistingDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { t, appLabel } from '@/i18n';
import { undoToast } from '@/lib/polish';
import { usePermissions } from '@/lib/permissions';
import { toast } from 'sonner';
import { formatDate } from '@/lib/formatters';

// The overlay union — one branch per entity, `record` typed the way the data
// flows: Enriched* where enrichment exists, the raw record type otherwise.
// The host resolves enrichment itself; pages pass raw records everywhere.
export type OverlayItem =
  | { type: 'kunden'; record: Kunden }
  | { type: 'kundenanfragen'; record: EnrichedKundenanfragen }
  | { type: 'technischerAbschluss'; record: EnrichedTechnischerAbschluss }
  | { type: 'statusprotokoll'; record: EnrichedStatusprotokoll }
  | { type: 'informationsquellen'; record: EnrichedInformationsquellen }
  | { type: 'technischeAnforderungen'; record: EnrichedTechnischeAnforderungen }
  | { type: 'offenePunkte'; record: EnrichedOffenePunkte }
  | { type: 'aufgaben'; record: EnrichedAufgaben }
  | { type: 'beurteilungen'; record: EnrichedBeurteilungen }
  | { type: 'rueckfragenUndKommunikation'; record: EnrichedRueckfragenUndKommunikation }
  | { type: 'entscheidungen'; record: EnrichedEntscheidungen }
  | { type: 'erfahrungen'; record: EnrichedErfahrungen }
  | { type: 'wiederverwendungVonErfahrungen'; record: EnrichedWiederverwendungVonErfahrungen };

/** The useDashboardData() return — pass it in, never re-fetch inside. */
export type EntityCrudData = ReturnType<typeof useDashboardData>;

export interface EntityCrudOptions {
  /** Per-type overlay footer — the record's next workflow step. */
  footer?: (top: OverlayItem) => ReactNode | { label: ReactNode; onClick: () => void } | undefined;
  placement?: 'side' | 'center';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface EntityCrudApi<TRecord, TDefaults> {
  /** Open the create dialog, optionally prefilled (shape-tolerant defaults). */
  openCreate: (defaults?: TDefaults) => void;
  /** Open the edit dialog for a record (recordId + defaults are wired). */
  openEdit: (record: TRecord) => void;
  /** Open the record overlay (raw record is fine — enrichment resolved inside). */
  openDetail: (record: TRecord) => void;
  /** May the signed-in user create/change records of this list? (the
   *  platform's rights — show a „+ Neu“ only when true; openCreate/openEdit
   *  refuse with a notice otherwise). */
  canWrite: boolean;
}

export interface EntityCrud {
  /** The overlay stack for drills: push / pop / replace / close. */
  overlay: RecordOverlayStack<OverlayItem>;
  /** Render ONCE at the end of the page JSX — all dialogs + the overlay host. */
  surfaces: ReactNode;
  kunden: EntityCrudApi<Kunden, KundenDialogDefaults>;
  kundenanfragen: EntityCrudApi<Kundenanfragen, KundenanfragenDialogDefaults>;
  technischerAbschluss: EntityCrudApi<TechnischerAbschluss, TechnischerAbschlussDialogDefaults>;
  statusprotokoll: EntityCrudApi<Statusprotokoll, StatusprotokollDialogDefaults>;
  informationsquellen: EntityCrudApi<Informationsquellen, InformationsquellenDialogDefaults>;
  technischeAnforderungen: EntityCrudApi<TechnischeAnforderungen, TechnischeAnforderungenDialogDefaults>;
  offenePunkte: EntityCrudApi<OffenePunkte, OffenePunkteDialogDefaults>;
  aufgaben: EntityCrudApi<Aufgaben, AufgabenDialogDefaults>;
  beurteilungen: EntityCrudApi<Beurteilungen, BeurteilungenDialogDefaults>;
  rueckfragenUndKommunikation: EntityCrudApi<RueckfragenUndKommunikation, RueckfragenUndKommunikationDialogDefaults>;
  entscheidungen: EntityCrudApi<Entscheidungen, EntscheidungenDialogDefaults>;
  erfahrungen: EntityCrudApi<Erfahrungen, ErfahrungenDialogDefaults>;
  wiederverwendungVonErfahrungen: EntityCrudApi<WiederverwendungVonErfahrungen, WiederverwendungVonErfahrungenDialogDefaults>;
  /** The display-ready array per entity: Enriched* where an enrich function
   *  exists, the raw array otherwise. One key per entity so no page has to
   *  know which is which. Reuse these; never re-enrich in the page. */
  enriched: { kunden: Kunden[]; kundenanfragen: EnrichedKundenanfragen[]; technischerAbschluss: EnrichedTechnischerAbschluss[]; statusprotokoll: EnrichedStatusprotokoll[]; informationsquellen: EnrichedInformationsquellen[]; technischeAnforderungen: EnrichedTechnischeAnforderungen[]; offenePunkte: EnrichedOffenePunkte[]; aufgaben: EnrichedAufgaben[]; beurteilungen: EnrichedBeurteilungen[]; rueckfragenUndKommunikation: EnrichedRueckfragenUndKommunikation[]; entscheidungen: EnrichedEntscheidungen[]; erfahrungen: EnrichedErfahrungen[]; wiederverwendungVonErfahrungen: EnrichedWiederverwendungVonErfahrungen[] };
}

export function useEntityCrud(data: EntityCrudData, options?: EntityCrudOptions): EntityCrud {
  const overlay = useRecordOverlayStack<OverlayItem>();
  // the platform's rights of the signed-in user (lib/permissions.ts) — unknown = allowed
  const perms = usePermissions();
  const refuse = () => { toast.error(t('perm_denied_title'), { description: t('perm_denied_desc') }); };
  const [kundenDialog, setKundenDialog] = useState<{ defaults?: KundenDialogDefaults; editing?: Kunden } | null>(null);
  const [kundenanfragenDialog, setKundenanfragenDialog] = useState<{ defaults?: KundenanfragenDialogDefaults; editing?: Kundenanfragen } | null>(null);
  const [technischerAbschlussDialog, setTechnischerAbschlussDialog] = useState<{ defaults?: TechnischerAbschlussDialogDefaults; editing?: TechnischerAbschluss } | null>(null);
  const [statusprotokollDialog, setStatusprotokollDialog] = useState<{ defaults?: StatusprotokollDialogDefaults; editing?: Statusprotokoll } | null>(null);
  const [informationsquellenDialog, setInformationsquellenDialog] = useState<{ defaults?: InformationsquellenDialogDefaults; editing?: Informationsquellen } | null>(null);
  const [technischeAnforderungenDialog, setTechnischeAnforderungenDialog] = useState<{ defaults?: TechnischeAnforderungenDialogDefaults; editing?: TechnischeAnforderungen } | null>(null);
  const [offenePunkteDialog, setOffenePunkteDialog] = useState<{ defaults?: OffenePunkteDialogDefaults; editing?: OffenePunkte } | null>(null);
  const [aufgabenDialog, setAufgabenDialog] = useState<{ defaults?: AufgabenDialogDefaults; editing?: Aufgaben } | null>(null);
  const [beurteilungenDialog, setBeurteilungenDialog] = useState<{ defaults?: BeurteilungenDialogDefaults; editing?: Beurteilungen } | null>(null);
  const [rueckfragenUndKommunikationDialog, setRueckfragenUndKommunikationDialog] = useState<{ defaults?: RueckfragenUndKommunikationDialogDefaults; editing?: RueckfragenUndKommunikation } | null>(null);
  const [entscheidungenDialog, setEntscheidungenDialog] = useState<{ defaults?: EntscheidungenDialogDefaults; editing?: Entscheidungen } | null>(null);
  const [erfahrungenDialog, setErfahrungenDialog] = useState<{ defaults?: ErfahrungenDialogDefaults; editing?: Erfahrungen } | null>(null);
  const [wiederverwendungVonErfahrungenDialog, setWiederverwendungVonErfahrungenDialog] = useState<{ defaults?: WiederverwendungVonErfahrungenDialogDefaults; editing?: WiederverwendungVonErfahrungen } | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug technische_anforderungen.quellen → informationsquellen: hält die Hub-record_id.
  const [pickInformationsquellenTechnischeAnforderungen, setPickInformationsquellenTechnischeAnforderungen] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug offene_punkte.betroffene_quellen → informationsquellen: hält die Hub-record_id.
  const [pickInformationsquellenOffenePunkte, setPickInformationsquellenOffenePunkte] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug beurteilungen.zugrunde_liegende_quellen → informationsquellen: hält die Hub-record_id.
  const [pickInformationsquellenBeurteilungen, setPickInformationsquellenBeurteilungen] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug erfahrungen.belegquellen → informationsquellen: hält die Hub-record_id.
  const [pickInformationsquellenErfahrungen, setPickInformationsquellenErfahrungen] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug offene_punkte.betroffene_anforderungen → technische_anforderungen: hält die Hub-record_id.
  const [pickTechnischeAnforderungenOffenePunkte, setPickTechnischeAnforderungenOffenePunkte] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug beurteilungen.betroffene_anforderungen → technische_anforderungen: hält die Hub-record_id.
  const [pickTechnischeAnforderungenBeurteilungen, setPickTechnischeAnforderungenBeurteilungen] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug entscheidungen.betroffene_anforderungen → technische_anforderungen: hält die Hub-record_id.
  const [pickTechnischeAnforderungenEntscheidungen, setPickTechnischeAnforderungenEntscheidungen] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug beurteilungen.betroffene_offene_punkte → offene_punkte: hält die Hub-record_id.
  const [pickOffenePunkteBeurteilungen, setPickOffenePunkteBeurteilungen] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug rueckfragen_und_kommunikation.zugehoerige_offene_punkte → offene_punkte: hält die Hub-record_id.
  const [pickOffenePunkteRueckfragenUndKommunikation, setPickOffenePunkteRueckfragenUndKommunikation] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug entscheidungen.betroffene_offene_punkte → offene_punkte: hält die Hub-record_id.
  const [pickOffenePunkteEntscheidungen, setPickOffenePunkteEntscheidungen] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug entscheidungen.zugrunde_liegende_beurteilungen → beurteilungen: hält die Hub-record_id.
  const [pickBeurteilungenEntscheidungen, setPickBeurteilungenEntscheidungen] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug erfahrungen.belegbeurteilungen → beurteilungen: hält die Hub-record_id.
  const [pickBeurteilungenErfahrungen, setPickBeurteilungenErfahrungen] = useState<string | null>(null);
  // „Vorhandene wählen" für den Listenfeld-Rückbezug erfahrungen.belegentscheidungen → entscheidungen: hält die Hub-record_id.
  const [pickEntscheidungenErfahrungen, setPickEntscheidungenErfahrungen] = useState<string | null>(null);
  const enrichedKundenanfragen = useMemo(() => enrichKundenanfragen(data.kundenanfragen, { kundenMap: data.kundenMap }), [data.kundenanfragen, data.kundenMap]);
  const enrichedTechnischerAbschluss = useMemo(() => enrichTechnischerAbschluss(data.technischerAbschluss, { kundenanfragenMap: data.kundenanfragenMap }), [data.technischerAbschluss, data.kundenanfragenMap]);
  const enrichedStatusprotokoll = useMemo(() => enrichStatusprotokoll(data.statusprotokoll, { kundenanfragenMap: data.kundenanfragenMap }), [data.statusprotokoll, data.kundenanfragenMap]);
  const enrichedInformationsquellen = useMemo(() => enrichInformationsquellen(data.informationsquellen, { informationsquellenMap: data.informationsquellenMap, kundenanfragenMap: data.kundenanfragenMap }), [data.informationsquellen, data.informationsquellenMap, data.kundenanfragenMap]);
  const enrichedTechnischeAnforderungen = useMemo(() => enrichTechnischeAnforderungen(data.technischeAnforderungen, { kundenanfragenMap: data.kundenanfragenMap, informationsquellenMap: data.informationsquellenMap }), [data.technischeAnforderungen, data.kundenanfragenMap, data.informationsquellenMap]);
  const enrichedOffenePunkte = useMemo(() => enrichOffenePunkte(data.offenePunkte, { technischeAnforderungenMap: data.technischeAnforderungenMap, informationsquellenMap: data.informationsquellenMap, kundenanfragenMap: data.kundenanfragenMap }), [data.offenePunkte, data.technischeAnforderungenMap, data.informationsquellenMap, data.kundenanfragenMap]);
  const enrichedAufgaben = useMemo(() => enrichAufgaben(data.aufgaben, { kundenanfragenMap: data.kundenanfragenMap, offenePunkteMap: data.offenePunkteMap, aufgabenMap: data.aufgabenMap }), [data.aufgaben, data.kundenanfragenMap, data.offenePunkteMap, data.aufgabenMap]);
  const enrichedBeurteilungen = useMemo(() => enrichBeurteilungen(data.beurteilungen, { technischeAnforderungenMap: data.technischeAnforderungenMap, offenePunkteMap: data.offenePunkteMap, informationsquellenMap: data.informationsquellenMap, kundenanfragenMap: data.kundenanfragenMap }), [data.beurteilungen, data.technischeAnforderungenMap, data.offenePunkteMap, data.informationsquellenMap, data.kundenanfragenMap]);
  const enrichedRueckfragenUndKommunikation = useMemo(() => enrichRueckfragenUndKommunikation(data.rueckfragenUndKommunikation, { offenePunkteMap: data.offenePunkteMap, rueckfragenUndKommunikationMap: data.rueckfragenUndKommunikationMap, informationsquellenMap: data.informationsquellenMap, kundenanfragenMap: data.kundenanfragenMap }), [data.rueckfragenUndKommunikation, data.offenePunkteMap, data.rueckfragenUndKommunikationMap, data.informationsquellenMap, data.kundenanfragenMap]);
  const enrichedEntscheidungen = useMemo(() => enrichEntscheidungen(data.entscheidungen, { technischeAnforderungenMap: data.technischeAnforderungenMap, offenePunkteMap: data.offenePunkteMap, beurteilungenMap: data.beurteilungenMap, entscheidungenMap: data.entscheidungenMap, kundenanfragenMap: data.kundenanfragenMap }), [data.entscheidungen, data.technischeAnforderungenMap, data.offenePunkteMap, data.beurteilungenMap, data.entscheidungenMap, data.kundenanfragenMap]);
  const enrichedErfahrungen = useMemo(() => enrichErfahrungen(data.erfahrungen, { informationsquellenMap: data.informationsquellenMap, beurteilungenMap: data.beurteilungenMap, entscheidungenMap: data.entscheidungenMap, kundenanfragenMap: data.kundenanfragenMap, technischerAbschlussMap: data.technischerAbschlussMap }), [data.erfahrungen, data.informationsquellenMap, data.beurteilungenMap, data.entscheidungenMap, data.kundenanfragenMap, data.technischerAbschlussMap]);
  const enrichedWiederverwendungVonErfahrungen = useMemo(() => enrichWiederverwendungVonErfahrungen(data.wiederverwendungVonErfahrungen, { erfahrungenMap: data.erfahrungenMap, kundenanfragenMap: data.kundenanfragenMap }), [data.wiederverwendungVonErfahrungen, data.erfahrungenMap, data.kundenanfragenMap]);

  function detailKunden(record: Kunden, push = false) {
    const item: OverlayItem = { type: 'kunden', record };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitKunden(fields: Kunden['fields']) {
    const editing = kundenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setKunden(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateKundenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('kunden')} — ${t('crud_updated')}`, async () => {
        data.setKunden(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateKundenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createKundenEntry(fields);
      undoToast(`${appLabel('kunden')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailKundenanfragen(record: Kundenanfragen, push = false) {
    const rec = enrichedKundenanfragen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'kundenanfragen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitKundenanfragen(fields: Kundenanfragen['fields']) {
    const editing = kundenanfragenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setKundenanfragen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateKundenanfragenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('kundenanfragen')} — ${t('crud_updated')}`, async () => {
        data.setKundenanfragen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateKundenanfragenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createKundenanfragenEntry(fields);
      undoToast(`${appLabel('kundenanfragen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailTechnischerAbschluss(record: TechnischerAbschluss, push = false) {
    const rec = enrichedTechnischerAbschluss.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'technischerAbschluss', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitTechnischerAbschluss(fields: TechnischerAbschluss['fields']) {
    const editing = technischerAbschlussDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setTechnischerAbschluss(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateTechnischerAbschlus(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('technischer_abschluss')} — ${t('crud_updated')}`, async () => {
        data.setTechnischerAbschluss(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateTechnischerAbschlus(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createTechnischerAbschlus(fields);
      undoToast(`${appLabel('technischer_abschluss')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailStatusprotokoll(record: Statusprotokoll, push = false) {
    const rec = enrichedStatusprotokoll.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'statusprotokoll', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitStatusprotokoll(fields: Statusprotokoll['fields']) {
    const editing = statusprotokollDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setStatusprotokoll(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateStatusprotokollEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('statusprotokoll')} — ${t('crud_updated')}`, async () => {
        data.setStatusprotokoll(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateStatusprotokollEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createStatusprotokollEntry(fields);
      undoToast(`${appLabel('statusprotokoll')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailInformationsquellen(record: Informationsquellen, push = false) {
    const rec = enrichedInformationsquellen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'informationsquellen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitInformationsquellen(fields: Informationsquellen['fields']) {
    const editing = informationsquellenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setInformationsquellen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateInformationsquellenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('informationsquellen')} — ${t('crud_updated')}`, async () => {
        data.setInformationsquellen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateInformationsquellenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createInformationsquellenEntry(fields);
      undoToast(`${appLabel('informationsquellen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING TechnischeAnforderungen to the Informationsquellen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkInformationsquellenTechnischeAnforderungen(sourceId: string) {
    const hub = pickInformationsquellenTechnischeAnforderungen;
    const src = data.technischeAnforderungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.quellen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, id));
    data.setTechnischeAnforderungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, quellen: next } } : r)));
    try {
      await LivingAppsService.updateTechnischeAnforderungenEntry(sourceId, { quellen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('technische_anforderungen')} — ${t('pick_linked')}`, async () => {
      data.setTechnischeAnforderungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateTechnischeAnforderungenEntry(sourceId, { quellen: src.fields.quellen }); } catch { data.fetchAll(); }
    });
  }

  // Link an EXISTING OffenePunkte to the Informationsquellen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkInformationsquellenOffenePunkte(sourceId: string) {
    const hub = pickInformationsquellenOffenePunkte;
    const src = data.offenePunkte.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.betroffene_quellen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, id));
    data.setOffenePunkte(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, betroffene_quellen: next } } : r)));
    try {
      await LivingAppsService.updateOffenePunkteEntry(sourceId, { betroffene_quellen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('offene_punkte')} — ${t('pick_linked')}`, async () => {
      data.setOffenePunkte(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateOffenePunkteEntry(sourceId, { betroffene_quellen: src.fields.betroffene_quellen }); } catch { data.fetchAll(); }
    });
  }

  // Link an EXISTING Beurteilungen to the Informationsquellen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkInformationsquellenBeurteilungen(sourceId: string) {
    const hub = pickInformationsquellenBeurteilungen;
    const src = data.beurteilungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.zugrunde_liegende_quellen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, id));
    data.setBeurteilungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, zugrunde_liegende_quellen: next } } : r)));
    try {
      await LivingAppsService.updateBeurteilungenEntry(sourceId, { zugrunde_liegende_quellen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('beurteilungen')} — ${t('pick_linked')}`, async () => {
      data.setBeurteilungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateBeurteilungenEntry(sourceId, { zugrunde_liegende_quellen: src.fields.zugrunde_liegende_quellen }); } catch { data.fetchAll(); }
    });
  }

  // Link an EXISTING Erfahrungen to the Informationsquellen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkInformationsquellenErfahrungen(sourceId: string) {
    const hub = pickInformationsquellenErfahrungen;
    const src = data.erfahrungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.belegquellen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, id));
    data.setErfahrungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, belegquellen: next } } : r)));
    try {
      await LivingAppsService.updateErfahrungenEntry(sourceId, { belegquellen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('erfahrungen')} — ${t('pick_linked')}`, async () => {
      data.setErfahrungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateErfahrungenEntry(sourceId, { belegquellen: src.fields.belegquellen }); } catch { data.fetchAll(); }
    });
  }

  function detailTechnischeAnforderungen(record: TechnischeAnforderungen, push = false) {
    const rec = enrichedTechnischeAnforderungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'technischeAnforderungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitTechnischeAnforderungen(fields: TechnischeAnforderungen['fields']) {
    const editing = technischeAnforderungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setTechnischeAnforderungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateTechnischeAnforderungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('technische_anforderungen')} — ${t('crud_updated')}`, async () => {
        data.setTechnischeAnforderungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateTechnischeAnforderungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createTechnischeAnforderungenEntry(fields);
      undoToast(`${appLabel('technische_anforderungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING OffenePunkte to the TechnischeAnforderungen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkTechnischeAnforderungenOffenePunkte(sourceId: string) {
    const hub = pickTechnischeAnforderungenOffenePunkte;
    const src = data.offenePunkte.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.betroffene_anforderungen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.TECHNISCHE_ANFORDERUNGEN, id));
    data.setOffenePunkte(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, betroffene_anforderungen: next } } : r)));
    try {
      await LivingAppsService.updateOffenePunkteEntry(sourceId, { betroffene_anforderungen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('offene_punkte')} — ${t('pick_linked')}`, async () => {
      data.setOffenePunkte(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateOffenePunkteEntry(sourceId, { betroffene_anforderungen: src.fields.betroffene_anforderungen }); } catch { data.fetchAll(); }
    });
  }

  // Link an EXISTING Beurteilungen to the TechnischeAnforderungen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkTechnischeAnforderungenBeurteilungen(sourceId: string) {
    const hub = pickTechnischeAnforderungenBeurteilungen;
    const src = data.beurteilungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.betroffene_anforderungen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.TECHNISCHE_ANFORDERUNGEN, id));
    data.setBeurteilungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, betroffene_anforderungen: next } } : r)));
    try {
      await LivingAppsService.updateBeurteilungenEntry(sourceId, { betroffene_anforderungen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('beurteilungen')} — ${t('pick_linked')}`, async () => {
      data.setBeurteilungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateBeurteilungenEntry(sourceId, { betroffene_anforderungen: src.fields.betroffene_anforderungen }); } catch { data.fetchAll(); }
    });
  }

  // Link an EXISTING Entscheidungen to the TechnischeAnforderungen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkTechnischeAnforderungenEntscheidungen(sourceId: string) {
    const hub = pickTechnischeAnforderungenEntscheidungen;
    const src = data.entscheidungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.betroffene_anforderungen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.TECHNISCHE_ANFORDERUNGEN, id));
    data.setEntscheidungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, betroffene_anforderungen: next } } : r)));
    try {
      await LivingAppsService.updateEntscheidungenEntry(sourceId, { betroffene_anforderungen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('entscheidungen')} — ${t('pick_linked')}`, async () => {
      data.setEntscheidungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateEntscheidungenEntry(sourceId, { betroffene_anforderungen: src.fields.betroffene_anforderungen }); } catch { data.fetchAll(); }
    });
  }

  function detailOffenePunkte(record: OffenePunkte, push = false) {
    const rec = enrichedOffenePunkte.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'offenePunkte', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitOffenePunkte(fields: OffenePunkte['fields']) {
    const editing = offenePunkteDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setOffenePunkte(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateOffenePunkteEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('offene_punkte')} — ${t('crud_updated')}`, async () => {
        data.setOffenePunkte(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateOffenePunkteEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createOffenePunkteEntry(fields);
      undoToast(`${appLabel('offene_punkte')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING Beurteilungen to the OffenePunkte hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkOffenePunkteBeurteilungen(sourceId: string) {
    const hub = pickOffenePunkteBeurteilungen;
    const src = data.beurteilungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.betroffene_offene_punkte);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.OFFENE_PUNKTE, id));
    data.setBeurteilungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, betroffene_offene_punkte: next } } : r)));
    try {
      await LivingAppsService.updateBeurteilungenEntry(sourceId, { betroffene_offene_punkte: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('beurteilungen')} — ${t('pick_linked')}`, async () => {
      data.setBeurteilungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateBeurteilungenEntry(sourceId, { betroffene_offene_punkte: src.fields.betroffene_offene_punkte }); } catch { data.fetchAll(); }
    });
  }

  // Link an EXISTING RueckfragenUndKommunikation to the OffenePunkte hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkOffenePunkteRueckfragenUndKommunikation(sourceId: string) {
    const hub = pickOffenePunkteRueckfragenUndKommunikation;
    const src = data.rueckfragenUndKommunikation.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.zugehoerige_offene_punkte);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.OFFENE_PUNKTE, id));
    data.setRueckfragenUndKommunikation(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, zugehoerige_offene_punkte: next } } : r)));
    try {
      await LivingAppsService.updateRueckfragenUndKommunikationEntry(sourceId, { zugehoerige_offene_punkte: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('rueckfragen_und_kommunikation')} — ${t('pick_linked')}`, async () => {
      data.setRueckfragenUndKommunikation(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateRueckfragenUndKommunikationEntry(sourceId, { zugehoerige_offene_punkte: src.fields.zugehoerige_offene_punkte }); } catch { data.fetchAll(); }
    });
  }

  // Link an EXISTING Entscheidungen to the OffenePunkte hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkOffenePunkteEntscheidungen(sourceId: string) {
    const hub = pickOffenePunkteEntscheidungen;
    const src = data.entscheidungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.betroffene_offene_punkte);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.OFFENE_PUNKTE, id));
    data.setEntscheidungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, betroffene_offene_punkte: next } } : r)));
    try {
      await LivingAppsService.updateEntscheidungenEntry(sourceId, { betroffene_offene_punkte: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('entscheidungen')} — ${t('pick_linked')}`, async () => {
      data.setEntscheidungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateEntscheidungenEntry(sourceId, { betroffene_offene_punkte: src.fields.betroffene_offene_punkte }); } catch { data.fetchAll(); }
    });
  }

  function detailAufgaben(record: Aufgaben, push = false) {
    const rec = enrichedAufgaben.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'aufgaben', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitAufgaben(fields: Aufgaben['fields']) {
    const editing = aufgabenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setAufgaben(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateAufgabenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('aufgaben')} — ${t('crud_updated')}`, async () => {
        data.setAufgaben(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateAufgabenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createAufgabenEntry(fields);
      undoToast(`${appLabel('aufgaben')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailBeurteilungen(record: Beurteilungen, push = false) {
    const rec = enrichedBeurteilungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'beurteilungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitBeurteilungen(fields: Beurteilungen['fields']) {
    const editing = beurteilungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setBeurteilungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateBeurteilungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('beurteilungen')} — ${t('crud_updated')}`, async () => {
        data.setBeurteilungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateBeurteilungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createBeurteilungenEntry(fields);
      undoToast(`${appLabel('beurteilungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING Entscheidungen to the Beurteilungen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkBeurteilungenEntscheidungen(sourceId: string) {
    const hub = pickBeurteilungenEntscheidungen;
    const src = data.entscheidungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.zugrunde_liegende_beurteilungen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.BEURTEILUNGEN, id));
    data.setEntscheidungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, zugrunde_liegende_beurteilungen: next } } : r)));
    try {
      await LivingAppsService.updateEntscheidungenEntry(sourceId, { zugrunde_liegende_beurteilungen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('entscheidungen')} — ${t('pick_linked')}`, async () => {
      data.setEntscheidungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateEntscheidungenEntry(sourceId, { zugrunde_liegende_beurteilungen: src.fields.zugrunde_liegende_beurteilungen }); } catch { data.fetchAll(); }
    });
  }

  // Link an EXISTING Erfahrungen to the Beurteilungen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkBeurteilungenErfahrungen(sourceId: string) {
    const hub = pickBeurteilungenErfahrungen;
    const src = data.erfahrungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.belegbeurteilungen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.BEURTEILUNGEN, id));
    data.setErfahrungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, belegbeurteilungen: next } } : r)));
    try {
      await LivingAppsService.updateErfahrungenEntry(sourceId, { belegbeurteilungen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('erfahrungen')} — ${t('pick_linked')}`, async () => {
      data.setErfahrungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateErfahrungenEntry(sourceId, { belegbeurteilungen: src.fields.belegbeurteilungen }); } catch { data.fetchAll(); }
    });
  }

  function detailRueckfragenUndKommunikation(record: RueckfragenUndKommunikation, push = false) {
    const rec = enrichedRueckfragenUndKommunikation.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'rueckfragenUndKommunikation', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitRueckfragenUndKommunikation(fields: RueckfragenUndKommunikation['fields']) {
    const editing = rueckfragenUndKommunikationDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setRueckfragenUndKommunikation(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateRueckfragenUndKommunikationEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('rueckfragen_und_kommunikation')} — ${t('crud_updated')}`, async () => {
        data.setRueckfragenUndKommunikation(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateRueckfragenUndKommunikationEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createRueckfragenUndKommunikationEntry(fields);
      undoToast(`${appLabel('rueckfragen_und_kommunikation')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailEntscheidungen(record: Entscheidungen, push = false) {
    const rec = enrichedEntscheidungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'entscheidungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitEntscheidungen(fields: Entscheidungen['fields']) {
    const editing = entscheidungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setEntscheidungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateEntscheidungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('entscheidungen')} — ${t('crud_updated')}`, async () => {
        data.setEntscheidungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateEntscheidungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createEntscheidungenEntry(fields);
      undoToast(`${appLabel('entscheidungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  // Link an EXISTING Erfahrungen to the Entscheidungen hub: append the hub URL to the
  // source's list field. Optimistic setter first, PATCH, undoToast counter-write.
  async function linkEntscheidungenErfahrungen(sourceId: string) {
    const hub = pickEntscheidungenErfahrungen;
    const src = data.erfahrungen.find(r => r.record_id === sourceId);
    if (!hub || !src) return;
    const ids = extractRecordIds(src.fields.belegentscheidungen);
    if (ids.includes(hub)) return;
    const next = [...ids, hub].map(id => createRecordUrl(APP_IDS.ENTSCHEIDUNGEN, id));
    data.setErfahrungen(list => list.map(r => (r.record_id === sourceId ? { ...r, fields: { ...r.fields, belegentscheidungen: next } } : r)));
    try {
      await LivingAppsService.updateErfahrungenEntry(sourceId, { belegentscheidungen: next });
    } catch (err) {
      data.fetchAll();
      throw err;
    }
    undoToast(`${appLabel('erfahrungen')} — ${t('pick_linked')}`, async () => {
      data.setErfahrungen(list => list.map(r => (r.record_id === sourceId ? src : r)));
      try { await LivingAppsService.updateErfahrungenEntry(sourceId, { belegentscheidungen: src.fields.belegentscheidungen }); } catch { data.fetchAll(); }
    });
  }

  function detailErfahrungen(record: Erfahrungen, push = false) {
    const rec = enrichedErfahrungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'erfahrungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitErfahrungen(fields: Erfahrungen['fields']) {
    const editing = erfahrungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setErfahrungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateErfahrungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('erfahrungen')} — ${t('crud_updated')}`, async () => {
        data.setErfahrungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateErfahrungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createErfahrungenEntry(fields);
      undoToast(`${appLabel('erfahrungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  function detailWiederverwendungVonErfahrungen(record: WiederverwendungVonErfahrungen, push = false) {
    const rec = enrichedWiederverwendungVonErfahrungen.find(r => r.record_id === record.record_id);
    if (!rec) return;
    const item: OverlayItem = { type: 'wiederverwendungVonErfahrungen', record: rec };
    if (push) overlay.push(item); else overlay.replace(item);
  }

  async function submitWiederverwendungVonErfahrungen(fields: WiederverwendungVonErfahrungen['fields']) {
    const editing = wiederverwendungVonErfahrungenDialog?.editing;
    if (editing) {
      const prev = editing;
      data.setWiederverwendungVonErfahrungen(list => list.map(r => (r.record_id === editing.record_id ? { ...r, fields } : r)));
      try {
        await LivingAppsService.updateWiederverwendungVonErfahrungenEntry(editing.record_id, fields);
      } catch (err) {
        data.fetchAll();
        throw err;
      }
      undoToast(`${appLabel('wiederverwendung_von_erfahrungen')} — ${t('crud_updated')}`, async () => {
        data.setWiederverwendungVonErfahrungen(list => list.map(r => (r.record_id === prev.record_id ? prev : r)));
        try { await LivingAppsService.updateWiederverwendungVonErfahrungenEntry(prev.record_id, prev.fields); } catch { data.fetchAll(); }
      });
    } else {
      await LivingAppsService.createWiederverwendungVonErfahrungenEntry(fields);
      undoToast(`${appLabel('wiederverwendung_von_erfahrungen')} — ${t('crud_created')}`);
      data.fetchAll();
    }
  }

  const surfaces = (
    <>
      <KundenDialog
        open={kundenDialog !== null}
        onClose={() => setKundenDialog(null)}
        onSubmit={submitKunden}
        defaultValues={kundenDialog?.defaults}
        recordId={kundenDialog?.editing?.record_id}
        enablePhotoScan={AI_PHOTO_SCAN['Kunden']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Kunden']}
      />
      <KundenanfragenDialog
        open={kundenanfragenDialog !== null}
        onClose={() => setKundenanfragenDialog(null)}
        onSubmit={submitKundenanfragen}
        defaultValues={kundenanfragenDialog?.defaults}
        recordId={kundenanfragenDialog?.editing?.record_id}
        kundenList={data.kunden}
        enablePhotoScan={AI_PHOTO_SCAN['Kundenanfragen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Kundenanfragen']}
      />
      <TechnischerAbschlussDialog
        open={technischerAbschlussDialog !== null}
        onClose={() => setTechnischerAbschlussDialog(null)}
        onSubmit={submitTechnischerAbschluss}
        defaultValues={technischerAbschlussDialog?.defaults}
        recordId={technischerAbschlussDialog?.editing?.record_id}
        kundenanfragenList={data.kundenanfragen}
        enablePhotoScan={AI_PHOTO_SCAN['TechnischerAbschluss']}
        enablePhotoLocation={AI_PHOTO_LOCATION['TechnischerAbschluss']}
      />
      <StatusprotokollDialog
        open={statusprotokollDialog !== null}
        onClose={() => setStatusprotokollDialog(null)}
        onSubmit={submitStatusprotokoll}
        defaultValues={statusprotokollDialog?.defaults}
        recordId={statusprotokollDialog?.editing?.record_id}
        kundenanfragenList={data.kundenanfragen}
        enablePhotoScan={AI_PHOTO_SCAN['Statusprotokoll']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Statusprotokoll']}
      />
      <InformationsquellenDialog
        open={informationsquellenDialog !== null}
        onClose={() => setInformationsquellenDialog(null)}
        onSubmit={submitInformationsquellen}
        defaultValues={informationsquellenDialog?.defaults}
        recordId={informationsquellenDialog?.editing?.record_id}
        informationsquellenList={data.informationsquellen}
        kundenanfragenList={data.kundenanfragen}
        enablePhotoScan={AI_PHOTO_SCAN['Informationsquellen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Informationsquellen']}
      />
      <TechnischeAnforderungenDialog
        open={technischeAnforderungenDialog !== null}
        onClose={() => setTechnischeAnforderungenDialog(null)}
        onSubmit={submitTechnischeAnforderungen}
        defaultValues={technischeAnforderungenDialog?.defaults}
        recordId={technischeAnforderungenDialog?.editing?.record_id}
        kundenanfragenList={data.kundenanfragen}
        informationsquellenList={data.informationsquellen}
        enablePhotoScan={AI_PHOTO_SCAN['TechnischeAnforderungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['TechnischeAnforderungen']}
      />
      <OffenePunkteDialog
        open={offenePunkteDialog !== null}
        onClose={() => setOffenePunkteDialog(null)}
        onSubmit={submitOffenePunkte}
        defaultValues={offenePunkteDialog?.defaults}
        recordId={offenePunkteDialog?.editing?.record_id}
        technischeAnforderungenList={data.technischeAnforderungen}
        informationsquellenList={data.informationsquellen}
        kundenanfragenList={data.kundenanfragen}
        enablePhotoScan={AI_PHOTO_SCAN['OffenePunkte']}
        enablePhotoLocation={AI_PHOTO_LOCATION['OffenePunkte']}
      />
      <AufgabenDialog
        open={aufgabenDialog !== null}
        onClose={() => setAufgabenDialog(null)}
        onSubmit={submitAufgaben}
        defaultValues={aufgabenDialog?.defaults}
        recordId={aufgabenDialog?.editing?.record_id}
        kundenanfragenList={data.kundenanfragen}
        offenePunkteList={data.offenePunkte}
        aufgabenList={data.aufgaben}
        enablePhotoScan={AI_PHOTO_SCAN['Aufgaben']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Aufgaben']}
      />
      <BeurteilungenDialog
        open={beurteilungenDialog !== null}
        onClose={() => setBeurteilungenDialog(null)}
        onSubmit={submitBeurteilungen}
        defaultValues={beurteilungenDialog?.defaults}
        recordId={beurteilungenDialog?.editing?.record_id}
        technischeAnforderungenList={data.technischeAnforderungen}
        offenePunkteList={data.offenePunkte}
        informationsquellenList={data.informationsquellen}
        kundenanfragenList={data.kundenanfragen}
        enablePhotoScan={AI_PHOTO_SCAN['Beurteilungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Beurteilungen']}
      />
      <RueckfragenUndKommunikationDialog
        open={rueckfragenUndKommunikationDialog !== null}
        onClose={() => setRueckfragenUndKommunikationDialog(null)}
        onSubmit={submitRueckfragenUndKommunikation}
        defaultValues={rueckfragenUndKommunikationDialog?.defaults}
        recordId={rueckfragenUndKommunikationDialog?.editing?.record_id}
        offenePunkteList={data.offenePunkte}
        rueckfragenUndKommunikationList={data.rueckfragenUndKommunikation}
        informationsquellenList={data.informationsquellen}
        kundenanfragenList={data.kundenanfragen}
        enablePhotoScan={AI_PHOTO_SCAN['RueckfragenUndKommunikation']}
        enablePhotoLocation={AI_PHOTO_LOCATION['RueckfragenUndKommunikation']}
      />
      <EntscheidungenDialog
        open={entscheidungenDialog !== null}
        onClose={() => setEntscheidungenDialog(null)}
        onSubmit={submitEntscheidungen}
        defaultValues={entscheidungenDialog?.defaults}
        recordId={entscheidungenDialog?.editing?.record_id}
        technischeAnforderungenList={data.technischeAnforderungen}
        offenePunkteList={data.offenePunkte}
        beurteilungenList={data.beurteilungen}
        entscheidungenList={data.entscheidungen}
        kundenanfragenList={data.kundenanfragen}
        enablePhotoScan={AI_PHOTO_SCAN['Entscheidungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Entscheidungen']}
      />
      <ErfahrungenDialog
        open={erfahrungenDialog !== null}
        onClose={() => setErfahrungenDialog(null)}
        onSubmit={submitErfahrungen}
        defaultValues={erfahrungenDialog?.defaults}
        recordId={erfahrungenDialog?.editing?.record_id}
        informationsquellenList={data.informationsquellen}
        beurteilungenList={data.beurteilungen}
        entscheidungenList={data.entscheidungen}
        kundenanfragenList={data.kundenanfragen}
        technischerAbschlussList={data.technischerAbschluss}
        enablePhotoScan={AI_PHOTO_SCAN['Erfahrungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Erfahrungen']}
      />
      <WiederverwendungVonErfahrungenDialog
        open={wiederverwendungVonErfahrungenDialog !== null}
        onClose={() => setWiederverwendungVonErfahrungenDialog(null)}
        onSubmit={submitWiederverwendungVonErfahrungen}
        defaultValues={wiederverwendungVonErfahrungenDialog?.defaults}
        recordId={wiederverwendungVonErfahrungenDialog?.editing?.record_id}
        erfahrungenList={data.erfahrungen}
        kundenanfragenList={data.kundenanfragen}
        enablePhotoScan={AI_PHOTO_SCAN['WiederverwendungVonErfahrungen']}
        enablePhotoLocation={AI_PHOTO_LOCATION['WiederverwendungVonErfahrungen']}
      />
      <PickExistingDialog
        open={pickInformationsquellenTechnischeAnforderungen !== null}
        onClose={() => setPickInformationsquellenTechnischeAnforderungen(null)}
        title={t('pick_title', { title: appLabel('technische_anforderungen') })}
        items={data.technischeAnforderungen
          .filter(r => !extractRecordIds(r.fields.quellen).includes(pickInformationsquellenTechnischeAnforderungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.bezeichnung ?? appLabel('technische_anforderungen')), hint: r.fields.gueltig_ab ? String(r.fields.gueltig_ab) : undefined }))}
        onPick={linkInformationsquellenTechnischeAnforderungen}
      />
      <PickExistingDialog
        open={pickInformationsquellenOffenePunkte !== null}
        onClose={() => setPickInformationsquellenOffenePunkte(null)}
        title={t('pick_title', { title: appLabel('offene_punkte') })}
        items={data.offenePunkte
          .filter(r => !extractRecordIds(r.fields.betroffene_quellen).includes(pickInformationsquellenOffenePunkte ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.kurztitel ?? appLabel('offene_punkte')), hint: r.fields.faellig_am ? String(r.fields.faellig_am) : undefined }))}
        onPick={linkInformationsquellenOffenePunkte}
      />
      <PickExistingDialog
        open={pickInformationsquellenBeurteilungen !== null}
        onClose={() => setPickInformationsquellenBeurteilungen(null)}
        title={t('pick_title', { title: appLabel('beurteilungen') })}
        items={data.beurteilungen
          .filter(r => !extractRecordIds(r.fields.zugrunde_liegende_quellen).includes(pickInformationsquellenBeurteilungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.beurteilungsgegenstand ?? appLabel('beurteilungen')), hint: r.fields.erstellt_am ? String(r.fields.erstellt_am) : undefined }))}
        onPick={linkInformationsquellenBeurteilungen}
      />
      <PickExistingDialog
        open={pickInformationsquellenErfahrungen !== null}
        onClose={() => setPickInformationsquellenErfahrungen(null)}
        title={t('pick_title', { title: appLabel('erfahrungen') })}
        items={data.erfahrungen
          .filter(r => !extractRecordIds(r.fields.belegquellen).includes(pickInformationsquellenErfahrungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.titel ?? appLabel('erfahrungen')), hint: r.fields.bestaetigt_am ? String(r.fields.bestaetigt_am) : undefined }))}
        onPick={linkInformationsquellenErfahrungen}
      />
      <PickExistingDialog
        open={pickTechnischeAnforderungenOffenePunkte !== null}
        onClose={() => setPickTechnischeAnforderungenOffenePunkte(null)}
        title={t('pick_title', { title: appLabel('offene_punkte') })}
        items={data.offenePunkte
          .filter(r => !extractRecordIds(r.fields.betroffene_anforderungen).includes(pickTechnischeAnforderungenOffenePunkte ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.kurztitel ?? appLabel('offene_punkte')), hint: r.fields.faellig_am ? String(r.fields.faellig_am) : undefined }))}
        onPick={linkTechnischeAnforderungenOffenePunkte}
      />
      <PickExistingDialog
        open={pickTechnischeAnforderungenBeurteilungen !== null}
        onClose={() => setPickTechnischeAnforderungenBeurteilungen(null)}
        title={t('pick_title', { title: appLabel('beurteilungen') })}
        items={data.beurteilungen
          .filter(r => !extractRecordIds(r.fields.betroffene_anforderungen).includes(pickTechnischeAnforderungenBeurteilungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.beurteilungsgegenstand ?? appLabel('beurteilungen')), hint: r.fields.erstellt_am ? String(r.fields.erstellt_am) : undefined }))}
        onPick={linkTechnischeAnforderungenBeurteilungen}
      />
      <PickExistingDialog
        open={pickTechnischeAnforderungenEntscheidungen !== null}
        onClose={() => setPickTechnischeAnforderungenEntscheidungen(null)}
        title={t('pick_title', { title: appLabel('entscheidungen') })}
        items={data.entscheidungen
          .filter(r => !extractRecordIds(r.fields.betroffene_anforderungen).includes(pickTechnischeAnforderungenEntscheidungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.titel ?? appLabel('entscheidungen')), hint: r.fields.entscheidungsdatum ? String(r.fields.entscheidungsdatum) : undefined }))}
        onPick={linkTechnischeAnforderungenEntscheidungen}
      />
      <PickExistingDialog
        open={pickOffenePunkteBeurteilungen !== null}
        onClose={() => setPickOffenePunkteBeurteilungen(null)}
        title={t('pick_title', { title: appLabel('beurteilungen') })}
        items={data.beurteilungen
          .filter(r => !extractRecordIds(r.fields.betroffene_offene_punkte).includes(pickOffenePunkteBeurteilungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.beurteilungsgegenstand ?? appLabel('beurteilungen')), hint: r.fields.erstellt_am ? String(r.fields.erstellt_am) : undefined }))}
        onPick={linkOffenePunkteBeurteilungen}
      />
      <PickExistingDialog
        open={pickOffenePunkteRueckfragenUndKommunikation !== null}
        onClose={() => setPickOffenePunkteRueckfragenUndKommunikation(null)}
        title={t('pick_title', { title: appLabel('rueckfragen_und_kommunikation') })}
        items={data.rueckfragenUndKommunikation
          .filter(r => !extractRecordIds(r.fields.zugehoerige_offene_punkte).includes(pickOffenePunkteRueckfragenUndKommunikation ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.absender ?? appLabel('rueckfragen_und_kommunikation')), hint: r.fields.versanddatum ? String(r.fields.versanddatum) : undefined }))}
        onPick={linkOffenePunkteRueckfragenUndKommunikation}
      />
      <PickExistingDialog
        open={pickOffenePunkteEntscheidungen !== null}
        onClose={() => setPickOffenePunkteEntscheidungen(null)}
        title={t('pick_title', { title: appLabel('entscheidungen') })}
        items={data.entscheidungen
          .filter(r => !extractRecordIds(r.fields.betroffene_offene_punkte).includes(pickOffenePunkteEntscheidungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.titel ?? appLabel('entscheidungen')), hint: r.fields.entscheidungsdatum ? String(r.fields.entscheidungsdatum) : undefined }))}
        onPick={linkOffenePunkteEntscheidungen}
      />
      <PickExistingDialog
        open={pickBeurteilungenEntscheidungen !== null}
        onClose={() => setPickBeurteilungenEntscheidungen(null)}
        title={t('pick_title', { title: appLabel('entscheidungen') })}
        items={data.entscheidungen
          .filter(r => !extractRecordIds(r.fields.zugrunde_liegende_beurteilungen).includes(pickBeurteilungenEntscheidungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.titel ?? appLabel('entscheidungen')), hint: r.fields.entscheidungsdatum ? String(r.fields.entscheidungsdatum) : undefined }))}
        onPick={linkBeurteilungenEntscheidungen}
      />
      <PickExistingDialog
        open={pickBeurteilungenErfahrungen !== null}
        onClose={() => setPickBeurteilungenErfahrungen(null)}
        title={t('pick_title', { title: appLabel('erfahrungen') })}
        items={data.erfahrungen
          .filter(r => !extractRecordIds(r.fields.belegbeurteilungen).includes(pickBeurteilungenErfahrungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.titel ?? appLabel('erfahrungen')), hint: r.fields.bestaetigt_am ? String(r.fields.bestaetigt_am) : undefined }))}
        onPick={linkBeurteilungenErfahrungen}
      />
      <PickExistingDialog
        open={pickEntscheidungenErfahrungen !== null}
        onClose={() => setPickEntscheidungenErfahrungen(null)}
        title={t('pick_title', { title: appLabel('erfahrungen') })}
        items={data.erfahrungen
          .filter(r => !extractRecordIds(r.fields.belegentscheidungen).includes(pickEntscheidungenErfahrungen ?? ''))
          .map(r => ({ id: r.record_id, label: String(r.fields.titel ?? appLabel('erfahrungen')), hint: r.fields.bestaetigt_am ? String(r.fields.bestaetigt_am) : undefined }))}
        onPick={linkEntscheidungenErfahrungen}
      />
      <RecordOverlayHost
        overlay={overlay}
        placement={options?.placement}
        size={options?.size}
        footer={options?.footer}
        render={(top) => {
          if (top.type === 'kunden') {
            return (
              <>
                <RecordHeader title={top.record.fields.kundennummer ?? appLabel('kunden')} subtitle={undefined} />
                <KundenDetails
                  record={top.record}
                  kundenanfragenList={data.kundenanfragen}
                  onOpenKundenanfragen={(r) => detailKundenanfragen(r, true)}
                  onAddKundenanfragen={perms.canWrite('kundenanfragen') ? () => setKundenanfragenDialog({ defaults: { kunde: createRecordUrl(APP_IDS.KUNDEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'kundenanfragen') {
            return (
              <>
                <RecordHeader title={top.record.fields.anfragenummer ?? appLabel('kundenanfragen')} subtitle={top.record.fields.eingangsdatum ? formatDate(top.record.fields.eingangsdatum) : undefined} />
                <KundenanfragenDetails
                  record={top.record}
                  kundenList={data.kunden}
                  onOpenKunden={(r) => detailKunden(r, true)}
                  technischerAbschlussList={data.technischerAbschluss}
                  onOpenTechnischerAbschluss={(r) => detailTechnischerAbschluss(r, true)}
                  onAddTechnischerAbschluss={perms.canWrite('technischer_abschluss') ? () => setTechnischerAbschlussDialog({ defaults: { anfrage: createRecordUrl(APP_IDS.KUNDENANFRAGEN, top.record.record_id) } }) : undefined}
                  statusprotokollList={data.statusprotokoll}
                  onOpenStatusprotokoll={(r) => detailStatusprotokoll(r, true)}
                  onAddStatusprotokoll={perms.canWrite('statusprotokoll') ? () => setStatusprotokollDialog({ defaults: { anfrage: createRecordUrl(APP_IDS.KUNDENANFRAGEN, top.record.record_id) } }) : undefined}
                  informationsquellenList={data.informationsquellen}
                  onOpenInformationsquellen={(r) => detailInformationsquellen(r, true)}
                  onAddInformationsquellen={perms.canWrite('informationsquellen') ? () => setInformationsquellenDialog({ defaults: { anfrage: createRecordUrl(APP_IDS.KUNDENANFRAGEN, top.record.record_id) } }) : undefined}
                  technischeAnforderungenList={data.technischeAnforderungen}
                  onOpenTechnischeAnforderungen={(r) => detailTechnischeAnforderungen(r, true)}
                  onAddTechnischeAnforderungen={perms.canWrite('technische_anforderungen') ? () => setTechnischeAnforderungenDialog({ defaults: { anfrage: createRecordUrl(APP_IDS.KUNDENANFRAGEN, top.record.record_id) } }) : undefined}
                  offenePunkteList={data.offenePunkte}
                  onOpenOffenePunkte={(r) => detailOffenePunkte(r, true)}
                  onAddOffenePunkte={perms.canWrite('offene_punkte') ? () => setOffenePunkteDialog({ defaults: { anfrage: createRecordUrl(APP_IDS.KUNDENANFRAGEN, top.record.record_id) } }) : undefined}
                  aufgabenList={data.aufgaben}
                  onOpenAufgaben={(r) => detailAufgaben(r, true)}
                  onAddAufgaben={perms.canWrite('aufgaben') ? () => setAufgabenDialog({ defaults: { anfrage: createRecordUrl(APP_IDS.KUNDENANFRAGEN, top.record.record_id) } }) : undefined}
                  beurteilungenList={data.beurteilungen}
                  onOpenBeurteilungen={(r) => detailBeurteilungen(r, true)}
                  onAddBeurteilungen={perms.canWrite('beurteilungen') ? () => setBeurteilungenDialog({ defaults: { anfrage: createRecordUrl(APP_IDS.KUNDENANFRAGEN, top.record.record_id) } }) : undefined}
                  rueckfragenUndKommunikationList={data.rueckfragenUndKommunikation}
                  onOpenRueckfragenUndKommunikation={(r) => detailRueckfragenUndKommunikation(r, true)}
                  onAddRueckfragenUndKommunikation={perms.canWrite('rueckfragen_und_kommunikation') ? () => setRueckfragenUndKommunikationDialog({ defaults: { anfrage: createRecordUrl(APP_IDS.KUNDENANFRAGEN, top.record.record_id) } }) : undefined}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { anfrage: createRecordUrl(APP_IDS.KUNDENANFRAGEN, top.record.record_id) } }) : undefined}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { ursprungsanfrage: createRecordUrl(APP_IDS.KUNDENANFRAGEN, top.record.record_id) } }) : undefined}
                  wiederverwendungVonErfahrungenList={data.wiederverwendungVonErfahrungen}
                  onOpenWiederverwendungVonErfahrungen={(r) => detailWiederverwendungVonErfahrungen(r, true)}
                  onAddWiederverwendungVonErfahrungen={perms.canWrite('wiederverwendung_von_erfahrungen') ? () => setWiederverwendungVonErfahrungenDialog({ defaults: { ziel_anfrage: createRecordUrl(APP_IDS.KUNDENANFRAGEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'technischerAbschluss') {
            return (
              <>
                <RecordHeader title={top.record.fields.geprueft_von ?? appLabel('technischer_abschluss')} subtitle={top.record.fields.pruefdatum ? formatDate(top.record.fields.pruefdatum) : undefined} />
                <TechnischerAbschlussDetails
                  record={top.record}
                  kundenanfragenList={data.kundenanfragen}
                  onOpenKundenanfragen={(r) => detailKundenanfragen(r, true)}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { belegabschluss: createRecordUrl(APP_IDS.TECHNISCHER_ABSCHLUSS, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'statusprotokoll') {
            return (
              <>
                <RecordHeader title={top.record.fields.objektbezeichnung ?? appLabel('statusprotokoll')} subtitle={top.record.fields.zeitpunkt ? formatDate(top.record.fields.zeitpunkt) : undefined} />
                <StatusprotokollDetails
                  record={top.record}
                  kundenanfragenList={data.kundenanfragen}
                  onOpenKundenanfragen={(r) => detailKundenanfragen(r, true)}
                />
              </>
            );
          }
          if (top.type === 'informationsquellen') {
            return (
              <>
                <RecordHeader title={top.record.fields.versionskennung ?? appLabel('informationsquellen')} subtitle={top.record.fields.eingangszeitpunkt ? formatDate(top.record.fields.eingangszeitpunkt) : undefined} />
                <InformationsquellenDetails
                  record={top.record}
                  informationsquellenList={data.informationsquellen}
                  onOpenInformationsquellen={(r) => detailInformationsquellen(r, true)}
                  kundenanfragenList={data.kundenanfragen}
                  onOpenKundenanfragen={(r) => detailKundenanfragen(r, true)}
                  technischeAnforderungenList={data.technischeAnforderungen}
                  onOpenTechnischeAnforderungen={(r) => detailTechnischeAnforderungen(r, true)}
                  onAddTechnischeAnforderungen={perms.canWrite('technische_anforderungen') ? () => setTechnischeAnforderungenDialog({ defaults: { quellen: [createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, top.record.record_id)] } }) : undefined}
                  onPickTechnischeAnforderungen={perms.canWrite('technische_anforderungen') ? () => setPickInformationsquellenTechnischeAnforderungen(top.record.record_id) : undefined}
                  offenePunkteList={data.offenePunkte}
                  onOpenOffenePunkte={(r) => detailOffenePunkte(r, true)}
                  onAddOffenePunkte={perms.canWrite('offene_punkte') ? () => setOffenePunkteDialog({ defaults: { betroffene_quellen: [createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, top.record.record_id)] } }) : undefined}
                  onPickOffenePunkte={perms.canWrite('offene_punkte') ? () => setPickInformationsquellenOffenePunkte(top.record.record_id) : undefined}
                  beurteilungenList={data.beurteilungen}
                  onOpenBeurteilungen={(r) => detailBeurteilungen(r, true)}
                  onAddBeurteilungen={perms.canWrite('beurteilungen') ? () => setBeurteilungenDialog({ defaults: { zugrunde_liegende_quellen: [createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, top.record.record_id)] } }) : undefined}
                  onPickBeurteilungen={perms.canWrite('beurteilungen') ? () => setPickInformationsquellenBeurteilungen(top.record.record_id) : undefined}
                  rueckfragenUndKommunikationList={data.rueckfragenUndKommunikation}
                  onOpenRueckfragenUndKommunikation={(r) => detailRueckfragenUndKommunikation(r, true)}
                  onAddRueckfragenUndKommunikation={perms.canWrite('rueckfragen_und_kommunikation') ? () => setRueckfragenUndKommunikationDialog({ defaults: { quelle: createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, top.record.record_id) } }) : undefined}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { belegquellen: [createRecordUrl(APP_IDS.INFORMATIONSQUELLEN, top.record.record_id)] } }) : undefined}
                  onPickErfahrungen={perms.canWrite('erfahrungen') ? () => setPickInformationsquellenErfahrungen(top.record.record_id) : undefined}
                />
              </>
            );
          }
          if (top.type === 'technischeAnforderungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.bezeichnung ?? appLabel('technische_anforderungen')} subtitle={top.record.fields.gueltig_ab ? formatDate(top.record.fields.gueltig_ab) : undefined} />
                <TechnischeAnforderungenDetails
                  record={top.record}
                  kundenanfragenList={data.kundenanfragen}
                  onOpenKundenanfragen={(r) => detailKundenanfragen(r, true)}
                  informationsquellenList={data.informationsquellen}
                  offenePunkteList={data.offenePunkte}
                  onOpenOffenePunkte={(r) => detailOffenePunkte(r, true)}
                  onAddOffenePunkte={perms.canWrite('offene_punkte') ? () => setOffenePunkteDialog({ defaults: { betroffene_anforderungen: [createRecordUrl(APP_IDS.TECHNISCHE_ANFORDERUNGEN, top.record.record_id)] } }) : undefined}
                  onPickOffenePunkte={perms.canWrite('offene_punkte') ? () => setPickTechnischeAnforderungenOffenePunkte(top.record.record_id) : undefined}
                  beurteilungenList={data.beurteilungen}
                  onOpenBeurteilungen={(r) => detailBeurteilungen(r, true)}
                  onAddBeurteilungen={perms.canWrite('beurteilungen') ? () => setBeurteilungenDialog({ defaults: { betroffene_anforderungen: [createRecordUrl(APP_IDS.TECHNISCHE_ANFORDERUNGEN, top.record.record_id)] } }) : undefined}
                  onPickBeurteilungen={perms.canWrite('beurteilungen') ? () => setPickTechnischeAnforderungenBeurteilungen(top.record.record_id) : undefined}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { betroffene_anforderungen: [createRecordUrl(APP_IDS.TECHNISCHE_ANFORDERUNGEN, top.record.record_id)] } }) : undefined}
                  onPickEntscheidungen={perms.canWrite('entscheidungen') ? () => setPickTechnischeAnforderungenEntscheidungen(top.record.record_id) : undefined}
                />
              </>
            );
          }
          if (top.type === 'offenePunkte') {
            return (
              <>
                <RecordHeader title={top.record.fields.kurztitel ?? appLabel('offene_punkte')} subtitle={top.record.fields.faellig_am ? formatDate(top.record.fields.faellig_am) : undefined} />
                <OffenePunkteDetails
                  record={top.record}
                  technischeAnforderungenList={data.technischeAnforderungen}
                  informationsquellenList={data.informationsquellen}
                  kundenanfragenList={data.kundenanfragen}
                  onOpenKundenanfragen={(r) => detailKundenanfragen(r, true)}
                  aufgabenList={data.aufgaben}
                  onOpenAufgaben={(r) => detailAufgaben(r, true)}
                  onAddAufgaben={perms.canWrite('aufgaben') ? () => setAufgabenDialog({ defaults: { offener_punkt: createRecordUrl(APP_IDS.OFFENE_PUNKTE, top.record.record_id) } }) : undefined}
                  beurteilungenList={data.beurteilungen}
                  onOpenBeurteilungen={(r) => detailBeurteilungen(r, true)}
                  onAddBeurteilungen={perms.canWrite('beurteilungen') ? () => setBeurteilungenDialog({ defaults: { betroffene_offene_punkte: [createRecordUrl(APP_IDS.OFFENE_PUNKTE, top.record.record_id)] } }) : undefined}
                  onPickBeurteilungen={perms.canWrite('beurteilungen') ? () => setPickOffenePunkteBeurteilungen(top.record.record_id) : undefined}
                  rueckfragenUndKommunikationList={data.rueckfragenUndKommunikation}
                  onOpenRueckfragenUndKommunikation={(r) => detailRueckfragenUndKommunikation(r, true)}
                  onAddRueckfragenUndKommunikation={perms.canWrite('rueckfragen_und_kommunikation') ? () => setRueckfragenUndKommunikationDialog({ defaults: { zugehoerige_offene_punkte: [createRecordUrl(APP_IDS.OFFENE_PUNKTE, top.record.record_id)] } }) : undefined}
                  onPickRueckfragenUndKommunikation={perms.canWrite('rueckfragen_und_kommunikation') ? () => setPickOffenePunkteRueckfragenUndKommunikation(top.record.record_id) : undefined}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { betroffene_offene_punkte: [createRecordUrl(APP_IDS.OFFENE_PUNKTE, top.record.record_id)] } }) : undefined}
                  onPickEntscheidungen={perms.canWrite('entscheidungen') ? () => setPickOffenePunkteEntscheidungen(top.record.record_id) : undefined}
                />
              </>
            );
          }
          if (top.type === 'aufgaben') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('aufgaben')} subtitle={top.record.fields.faellig_am ? formatDate(top.record.fields.faellig_am) : undefined} />
                <AufgabenDetails
                  record={top.record}
                  kundenanfragenList={data.kundenanfragen}
                  onOpenKundenanfragen={(r) => detailKundenanfragen(r, true)}
                  offenePunkteList={data.offenePunkte}
                  onOpenOffenePunkte={(r) => detailOffenePunkte(r, true)}
                  aufgabenList={data.aufgaben}
                />
              </>
            );
          }
          if (top.type === 'beurteilungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.beurteilungsgegenstand ?? appLabel('beurteilungen')} subtitle={top.record.fields.erstellt_am ? formatDate(top.record.fields.erstellt_am) : undefined} />
                <BeurteilungenDetails
                  record={top.record}
                  technischeAnforderungenList={data.technischeAnforderungen}
                  offenePunkteList={data.offenePunkte}
                  informationsquellenList={data.informationsquellen}
                  kundenanfragenList={data.kundenanfragen}
                  onOpenKundenanfragen={(r) => detailKundenanfragen(r, true)}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  onAddEntscheidungen={perms.canWrite('entscheidungen') ? () => setEntscheidungenDialog({ defaults: { zugrunde_liegende_beurteilungen: [createRecordUrl(APP_IDS.BEURTEILUNGEN, top.record.record_id)] } }) : undefined}
                  onPickEntscheidungen={perms.canWrite('entscheidungen') ? () => setPickBeurteilungenEntscheidungen(top.record.record_id) : undefined}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { belegbeurteilungen: [createRecordUrl(APP_IDS.BEURTEILUNGEN, top.record.record_id)] } }) : undefined}
                  onPickErfahrungen={perms.canWrite('erfahrungen') ? () => setPickBeurteilungenErfahrungen(top.record.record_id) : undefined}
                />
              </>
            );
          }
          if (top.type === 'rueckfragenUndKommunikation') {
            return (
              <>
                <RecordHeader title={top.record.fields.absender ?? appLabel('rueckfragen_und_kommunikation')} subtitle={top.record.fields.versanddatum ? formatDate(top.record.fields.versanddatum) : undefined} />
                <RueckfragenUndKommunikationDetails
                  record={top.record}
                  offenePunkteList={data.offenePunkte}
                  rueckfragenUndKommunikationList={data.rueckfragenUndKommunikation}
                  onOpenRueckfragenUndKommunikation={(r) => detailRueckfragenUndKommunikation(r, true)}
                  informationsquellenList={data.informationsquellen}
                  onOpenInformationsquellen={(r) => detailInformationsquellen(r, true)}
                  kundenanfragenList={data.kundenanfragen}
                  onOpenKundenanfragen={(r) => detailKundenanfragen(r, true)}
                />
              </>
            );
          }
          if (top.type === 'entscheidungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('entscheidungen')} subtitle={top.record.fields.entscheidungsdatum ? formatDate(top.record.fields.entscheidungsdatum) : undefined} />
                <EntscheidungenDetails
                  record={top.record}
                  technischeAnforderungenList={data.technischeAnforderungen}
                  offenePunkteList={data.offenePunkte}
                  beurteilungenList={data.beurteilungen}
                  entscheidungenList={data.entscheidungen}
                  onOpenEntscheidungen={(r) => detailEntscheidungen(r, true)}
                  kundenanfragenList={data.kundenanfragen}
                  onOpenKundenanfragen={(r) => detailKundenanfragen(r, true)}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  onAddErfahrungen={perms.canWrite('erfahrungen') ? () => setErfahrungenDialog({ defaults: { belegentscheidungen: [createRecordUrl(APP_IDS.ENTSCHEIDUNGEN, top.record.record_id)] } }) : undefined}
                  onPickErfahrungen={perms.canWrite('erfahrungen') ? () => setPickEntscheidungenErfahrungen(top.record.record_id) : undefined}
                />
              </>
            );
          }
          if (top.type === 'erfahrungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.titel ?? appLabel('erfahrungen')} subtitle={top.record.fields.bestaetigt_am ? formatDate(top.record.fields.bestaetigt_am) : undefined} />
                <ErfahrungenDetails
                  record={top.record}
                  informationsquellenList={data.informationsquellen}
                  beurteilungenList={data.beurteilungen}
                  entscheidungenList={data.entscheidungen}
                  kundenanfragenList={data.kundenanfragen}
                  onOpenKundenanfragen={(r) => detailKundenanfragen(r, true)}
                  technischerAbschlussList={data.technischerAbschluss}
                  onOpenTechnischerAbschluss={(r) => detailTechnischerAbschluss(r, true)}
                  wiederverwendungVonErfahrungenList={data.wiederverwendungVonErfahrungen}
                  onOpenWiederverwendungVonErfahrungen={(r) => detailWiederverwendungVonErfahrungen(r, true)}
                  onAddWiederverwendungVonErfahrungen={perms.canWrite('wiederverwendung_von_erfahrungen') ? () => setWiederverwendungVonErfahrungenDialog({ defaults: { erfahrung: createRecordUrl(APP_IDS.ERFAHRUNGEN, top.record.record_id) } }) : undefined}
                />
              </>
            );
          }
          if (top.type === 'wiederverwendungVonErfahrungen') {
            return (
              <>
                <RecordHeader title={top.record.fields.geprueft_von ?? appLabel('wiederverwendung_von_erfahrungen')} subtitle={top.record.fields.abrufdatum ? formatDate(top.record.fields.abrufdatum) : undefined} />
                <WiederverwendungVonErfahrungenDetails
                  record={top.record}
                  erfahrungenList={data.erfahrungen}
                  onOpenErfahrungen={(r) => detailErfahrungen(r, true)}
                  kundenanfragenList={data.kundenanfragen}
                  onOpenKundenanfragen={(r) => detailKundenanfragen(r, true)}
                />
              </>
            );
          }
          return null;
        }}
        canEdit={(top) => {
          if (top.type === 'kunden') return perms.canWrite('kunden');
          if (top.type === 'kundenanfragen') return perms.canWrite('kundenanfragen');
          if (top.type === 'technischerAbschluss') return perms.canWrite('technischer_abschluss');
          if (top.type === 'statusprotokoll') return perms.canWrite('statusprotokoll');
          if (top.type === 'informationsquellen') return perms.canWrite('informationsquellen');
          if (top.type === 'technischeAnforderungen') return perms.canWrite('technische_anforderungen');
          if (top.type === 'offenePunkte') return perms.canWrite('offene_punkte');
          if (top.type === 'aufgaben') return perms.canWrite('aufgaben');
          if (top.type === 'beurteilungen') return perms.canWrite('beurteilungen');
          if (top.type === 'rueckfragenUndKommunikation') return perms.canWrite('rueckfragen_und_kommunikation');
          if (top.type === 'entscheidungen') return perms.canWrite('entscheidungen');
          if (top.type === 'erfahrungen') return perms.canWrite('erfahrungen');
          if (top.type === 'wiederverwendungVonErfahrungen') return perms.canWrite('wiederverwendung_von_erfahrungen');
          return true;
        }}
        onEdit={(top) => {
          overlay.close();
          if (top.type === 'kunden') setKundenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'kundenanfragen') setKundenanfragenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'technischerAbschluss') setTechnischerAbschlussDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'statusprotokoll') setStatusprotokollDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'informationsquellen') setInformationsquellenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'technischeAnforderungen') setTechnischeAnforderungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'offenePunkte') setOffenePunkteDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'aufgaben') setAufgabenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'beurteilungen') setBeurteilungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'rueckfragenUndKommunikation') setRueckfragenUndKommunikationDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'entscheidungen') setEntscheidungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'erfahrungen') setErfahrungenDialog({ editing: top.record, defaults: top.record.fields });
          if (top.type === 'wiederverwendungVonErfahrungen') setWiederverwendungVonErfahrungenDialog({ editing: top.record, defaults: top.record.fields });
        }}
      />
    </>
  );

  return {
    overlay,
    surfaces,
    kunden: {
      openCreate: (defaults?: KundenDialogDefaults) => (perms.canWrite('kunden') ? setKundenDialog({ defaults }) : refuse()),
      openEdit: (record: Kunden) => (perms.canWrite('kunden') ? setKundenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Kunden) => detailKunden(record, false),
      canWrite: perms.canWrite('kunden'),
    },
    kundenanfragen: {
      openCreate: (defaults?: KundenanfragenDialogDefaults) => (perms.canWrite('kundenanfragen') ? setKundenanfragenDialog({ defaults }) : refuse()),
      openEdit: (record: Kundenanfragen) => (perms.canWrite('kundenanfragen') ? setKundenanfragenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Kundenanfragen) => detailKundenanfragen(record, false),
      canWrite: perms.canWrite('kundenanfragen'),
    },
    technischerAbschluss: {
      openCreate: (defaults?: TechnischerAbschlussDialogDefaults) => (perms.canWrite('technischer_abschluss') ? setTechnischerAbschlussDialog({ defaults }) : refuse()),
      openEdit: (record: TechnischerAbschluss) => (perms.canWrite('technischer_abschluss') ? setTechnischerAbschlussDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: TechnischerAbschluss) => detailTechnischerAbschluss(record, false),
      canWrite: perms.canWrite('technischer_abschluss'),
    },
    statusprotokoll: {
      openCreate: (defaults?: StatusprotokollDialogDefaults) => (perms.canWrite('statusprotokoll') ? setStatusprotokollDialog({ defaults }) : refuse()),
      openEdit: (record: Statusprotokoll) => (perms.canWrite('statusprotokoll') ? setStatusprotokollDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Statusprotokoll) => detailStatusprotokoll(record, false),
      canWrite: perms.canWrite('statusprotokoll'),
    },
    informationsquellen: {
      openCreate: (defaults?: InformationsquellenDialogDefaults) => (perms.canWrite('informationsquellen') ? setInformationsquellenDialog({ defaults }) : refuse()),
      openEdit: (record: Informationsquellen) => (perms.canWrite('informationsquellen') ? setInformationsquellenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Informationsquellen) => detailInformationsquellen(record, false),
      canWrite: perms.canWrite('informationsquellen'),
    },
    technischeAnforderungen: {
      openCreate: (defaults?: TechnischeAnforderungenDialogDefaults) => (perms.canWrite('technische_anforderungen') ? setTechnischeAnforderungenDialog({ defaults }) : refuse()),
      openEdit: (record: TechnischeAnforderungen) => (perms.canWrite('technische_anforderungen') ? setTechnischeAnforderungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: TechnischeAnforderungen) => detailTechnischeAnforderungen(record, false),
      canWrite: perms.canWrite('technische_anforderungen'),
    },
    offenePunkte: {
      openCreate: (defaults?: OffenePunkteDialogDefaults) => (perms.canWrite('offene_punkte') ? setOffenePunkteDialog({ defaults }) : refuse()),
      openEdit: (record: OffenePunkte) => (perms.canWrite('offene_punkte') ? setOffenePunkteDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: OffenePunkte) => detailOffenePunkte(record, false),
      canWrite: perms.canWrite('offene_punkte'),
    },
    aufgaben: {
      openCreate: (defaults?: AufgabenDialogDefaults) => (perms.canWrite('aufgaben') ? setAufgabenDialog({ defaults }) : refuse()),
      openEdit: (record: Aufgaben) => (perms.canWrite('aufgaben') ? setAufgabenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Aufgaben) => detailAufgaben(record, false),
      canWrite: perms.canWrite('aufgaben'),
    },
    beurteilungen: {
      openCreate: (defaults?: BeurteilungenDialogDefaults) => (perms.canWrite('beurteilungen') ? setBeurteilungenDialog({ defaults }) : refuse()),
      openEdit: (record: Beurteilungen) => (perms.canWrite('beurteilungen') ? setBeurteilungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Beurteilungen) => detailBeurteilungen(record, false),
      canWrite: perms.canWrite('beurteilungen'),
    },
    rueckfragenUndKommunikation: {
      openCreate: (defaults?: RueckfragenUndKommunikationDialogDefaults) => (perms.canWrite('rueckfragen_und_kommunikation') ? setRueckfragenUndKommunikationDialog({ defaults }) : refuse()),
      openEdit: (record: RueckfragenUndKommunikation) => (perms.canWrite('rueckfragen_und_kommunikation') ? setRueckfragenUndKommunikationDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: RueckfragenUndKommunikation) => detailRueckfragenUndKommunikation(record, false),
      canWrite: perms.canWrite('rueckfragen_und_kommunikation'),
    },
    entscheidungen: {
      openCreate: (defaults?: EntscheidungenDialogDefaults) => (perms.canWrite('entscheidungen') ? setEntscheidungenDialog({ defaults }) : refuse()),
      openEdit: (record: Entscheidungen) => (perms.canWrite('entscheidungen') ? setEntscheidungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Entscheidungen) => detailEntscheidungen(record, false),
      canWrite: perms.canWrite('entscheidungen'),
    },
    erfahrungen: {
      openCreate: (defaults?: ErfahrungenDialogDefaults) => (perms.canWrite('erfahrungen') ? setErfahrungenDialog({ defaults }) : refuse()),
      openEdit: (record: Erfahrungen) => (perms.canWrite('erfahrungen') ? setErfahrungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: Erfahrungen) => detailErfahrungen(record, false),
      canWrite: perms.canWrite('erfahrungen'),
    },
    wiederverwendungVonErfahrungen: {
      openCreate: (defaults?: WiederverwendungVonErfahrungenDialogDefaults) => (perms.canWrite('wiederverwendung_von_erfahrungen') ? setWiederverwendungVonErfahrungenDialog({ defaults }) : refuse()),
      openEdit: (record: WiederverwendungVonErfahrungen) => (perms.canWrite('wiederverwendung_von_erfahrungen') ? setWiederverwendungVonErfahrungenDialog({ editing: record, defaults: record.fields }) : refuse()),
      openDetail: (record: WiederverwendungVonErfahrungen) => detailWiederverwendungVonErfahrungen(record, false),
      canWrite: perms.canWrite('wiederverwendung_von_erfahrungen'),
    },
    enriched: { kunden: data.kunden, kundenanfragen: enrichedKundenanfragen, technischerAbschluss: enrichedTechnischerAbschluss, statusprotokoll: enrichedStatusprotokoll, informationsquellen: enrichedInformationsquellen, technischeAnforderungen: enrichedTechnischeAnforderungen, offenePunkte: enrichedOffenePunkte, aufgaben: enrichedAufgaben, beurteilungen: enrichedBeurteilungen, rueckfragenUndKommunikation: enrichedRueckfragenUndKommunikation, entscheidungen: enrichedEntscheidungen, erfahrungen: enrichedErfahrungen, wiederverwendungVonErfahrungen: enrichedWiederverwendungVonErfahrungen },
  };
}
