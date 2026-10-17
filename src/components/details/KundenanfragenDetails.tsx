import type { Kundenanfragen, Kunden, TechnischerAbschluss, Statusprotokoll, Informationsquellen, TechnischeAnforderungen, OffenePunkte, Aufgaben, Beurteilungen, RueckfragenUndKommunikation, Entscheidungen, Erfahrungen, WiederverwendungVonErfahrungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface KundenanfragenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Kundenanfragen;
  /** N:1-Ziel „Kunden": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenList: Kunden[];
  /** Klick auf die Kunden-Relation → overlay.push auf dessen Detail. */
  onOpenKunden?: (record: Kunden) => void;
  /** 1:N „Technischer Abschluss" (anfrage): VOLLE Liste — der Block filtert auf diesen Record. */
  technischerAbschlussList: TechnischerAbschluss[];
  /** Zeilen-Klick → overlay.push auf das TechnischerAbschluss-Detail (nie der Edit-Dialog). */
  onOpenTechnischerAbschluss: (record: TechnischerAbschluss) => void;
  /** Kontextuelles „+": öffnet den TechnischerAbschluss-Dialog mit diesem Record vorgesetzt. */
  onAddTechnischerAbschluss?: () => void;
  /** 1:N „Statusprotokoll" (anfrage): VOLLE Liste — der Block filtert auf diesen Record. */
  statusprotokollList: Statusprotokoll[];
  /** Zeilen-Klick → overlay.push auf das Statusprotokoll-Detail (nie der Edit-Dialog). */
  onOpenStatusprotokoll: (record: Statusprotokoll) => void;
  /** Kontextuelles „+": öffnet den Statusprotokoll-Dialog mit diesem Record vorgesetzt. */
  onAddStatusprotokoll?: () => void;
  /** 1:N „Informationsquellen" (anfrage): VOLLE Liste — der Block filtert auf diesen Record. */
  informationsquellenList: Informationsquellen[];
  /** Zeilen-Klick → overlay.push auf das Informationsquellen-Detail (nie der Edit-Dialog). */
  onOpenInformationsquellen: (record: Informationsquellen) => void;
  /** Kontextuelles „+": öffnet den Informationsquellen-Dialog mit diesem Record vorgesetzt. */
  onAddInformationsquellen?: () => void;
  /** 1:N „Technische Anforderungen" (anfrage): VOLLE Liste — der Block filtert auf diesen Record. */
  technischeAnforderungenList: TechnischeAnforderungen[];
  /** Zeilen-Klick → overlay.push auf das TechnischeAnforderungen-Detail (nie der Edit-Dialog). */
  onOpenTechnischeAnforderungen: (record: TechnischeAnforderungen) => void;
  /** Kontextuelles „+": öffnet den TechnischeAnforderungen-Dialog mit diesem Record vorgesetzt. */
  onAddTechnischeAnforderungen?: () => void;
  /** 1:N „Offene Punkte" (anfrage): VOLLE Liste — der Block filtert auf diesen Record. */
  offenePunkteList: OffenePunkte[];
  /** Zeilen-Klick → overlay.push auf das OffenePunkte-Detail (nie der Edit-Dialog). */
  onOpenOffenePunkte: (record: OffenePunkte) => void;
  /** Kontextuelles „+": öffnet den OffenePunkte-Dialog mit diesem Record vorgesetzt. */
  onAddOffenePunkte?: () => void;
  /** 1:N „Aufgaben" (anfrage): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabenList: Aufgaben[];
  /** Zeilen-Klick → overlay.push auf das Aufgaben-Detail (nie der Edit-Dialog). */
  onOpenAufgaben: (record: Aufgaben) => void;
  /** Kontextuelles „+": öffnet den Aufgaben-Dialog mit diesem Record vorgesetzt. */
  onAddAufgaben?: () => void;
  /** 1:N „Beurteilungen" (anfrage): VOLLE Liste — der Block filtert auf diesen Record. */
  beurteilungenList: Beurteilungen[];
  /** Zeilen-Klick → overlay.push auf das Beurteilungen-Detail (nie der Edit-Dialog). */
  onOpenBeurteilungen: (record: Beurteilungen) => void;
  /** Kontextuelles „+": öffnet den Beurteilungen-Dialog mit diesem Record vorgesetzt. */
  onAddBeurteilungen?: () => void;
  /** 1:N „Rückfragen und Kommunikation" (anfrage): VOLLE Liste — der Block filtert auf diesen Record. */
  rueckfragenUndKommunikationList: RueckfragenUndKommunikation[];
  /** Zeilen-Klick → overlay.push auf das RueckfragenUndKommunikation-Detail (nie der Edit-Dialog). */
  onOpenRueckfragenUndKommunikation: (record: RueckfragenUndKommunikation) => void;
  /** Kontextuelles „+": öffnet den RueckfragenUndKommunikation-Dialog mit diesem Record vorgesetzt. */
  onAddRueckfragenUndKommunikation?: () => void;
  /** 1:N „Entscheidungen" (anfrage): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
  /** 1:N „Erfahrungen" (ursprungsanfrage): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
  /** 1:N „Wiederverwendung von Erfahrungen" (ziel_anfrage): VOLLE Liste — der Block filtert auf diesen Record. */
  wiederverwendungVonErfahrungenList: WiederverwendungVonErfahrungen[];
  /** Zeilen-Klick → overlay.push auf das WiederverwendungVonErfahrungen-Detail (nie der Edit-Dialog). */
  onOpenWiederverwendungVonErfahrungen: (record: WiederverwendungVonErfahrungen) => void;
  /** Kontextuelles „+": öffnet den WiederverwendungVonErfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddWiederverwendungVonErfahrungen?: () => void;
}

export function KundenanfragenDetails({
  record,
  kundenList,
  onOpenKunden,
  technischerAbschlussList,
  onOpenTechnischerAbschluss,
  onAddTechnischerAbschluss,
  statusprotokollList,
  onOpenStatusprotokoll,
  onAddStatusprotokoll,
  informationsquellenList,
  onOpenInformationsquellen,
  onAddInformationsquellen,
  technischeAnforderungenList,
  onOpenTechnischeAnforderungen,
  onAddTechnischeAnforderungen,
  offenePunkteList,
  onOpenOffenePunkte,
  onAddOffenePunkte,
  aufgabenList,
  onOpenAufgaben,
  onAddAufgaben,
  beurteilungenList,
  onOpenBeurteilungen,
  onAddBeurteilungen,
  rueckfragenUndKommunikationList,
  onOpenRueckfragenUndKommunikation,
  onAddRueckfragenUndKommunikation,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
  wiederverwendungVonErfahrungenList,
  onOpenWiederverwendungVonErfahrungen,
  onAddWiederverwendungVonErfahrungen,
}: KundenanfragenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const kundeTarget = kundenList.find(r => r.record_id === extractRecordId(record.fields.kunde));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('kundenanfragen', 'anfragenummer')} value={record.fields.anfragenummer} format="text" />
        <RecordField label={fieldLabel('kundenanfragen', 'eingangsdatum')} value={record.fields.eingangsdatum} format="date" />
        <RecordField label={fieldLabel('kundenanfragen', 'eingangskanal')} value={record.fields.eingangskanal} format="pill" />
        <RecordField label={fieldLabel('kundenanfragen', 'kundenreferenz')} value={record.fields.kundenreferenz} format="text" />
        <RecordField label={fieldLabel('kundenanfragen', 'kontakt_vorname')} value={record.fields.kontakt_vorname} format="text" />
        <RecordField label={fieldLabel('kundenanfragen', 'kontakt_nachname')} value={record.fields.kontakt_nachname} format="text" />
        <RecordField label={fieldLabel('kundenanfragen', 'kontakt_email')} value={record.fields.kontakt_email} format="email" />
        <RecordField label={fieldLabel('kundenanfragen', 'produktfamilie')} value={record.fields.produktfamilie} format="text" />
        <RecordField label={fieldLabel('kundenanfragen', 'produktvariante')} value={record.fields.produktvariante} format="text" />
        <RecordField label={fieldLabel('kundenanfragen', 'gewuenschte_menge')} value={record.fields.gewuenschte_menge} format="text" />
        <RecordField label={fieldLabel('kundenanfragen', 'gewuenschter_liefertermin')} value={record.fields.gewuenschter_liefertermin} format="date" />
        <RecordField label={fieldLabel('kundenanfragen', 'anfragebeschreibung')} value={record.fields.anfragebeschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('kundenanfragen', 'urspruengliche_kundenanforderungen')} value={record.fields.urspruengliche_kundenanforderungen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('kundenanfragen', 'prioritaet')} value={record.fields.prioritaet} format="pill" />
        <RecordField label={fieldLabel('kundenanfragen', 'verantwortlicher_vorname')} value={record.fields.verantwortlicher_vorname} format="text" />
        <RecordField label={fieldLabel('kundenanfragen', 'verantwortlicher_nachname')} value={record.fields.verantwortlicher_nachname} format="text" />
        <RecordField label={fieldLabel('kundenanfragen', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('kundenanfragen', 'klaeraufwand')} value={record.fields.klaeraufwand} format="pill" />
        <RecordField label={fieldLabel('kundenanfragen', 'zieltermin_klaerung')} value={record.fields.zieltermin_klaerung} format="date" />
        <RecordField label={fieldLabel('kundenanfragen', 'vollstaendigkeit')} value={record.fields.vollstaendigkeit} format="pill" />
        <RecordField label={fieldLabel('kundenanfragen', 'schaetzung_bearbeitung_min')} value={record.fields.schaetzung_bearbeitung_min} format="text" />
        <RecordField label={fieldLabel('kundenanfragen', 'gemessen_bearbeitung_min')} value={record.fields.gemessen_bearbeitung_min} format="text" />
        <RecordField label={fieldLabel('kundenanfragen', 'wartezeit_kunde_min')} value={record.fields.wartezeit_kunde_min} format="text" />
        <RecordField label={fieldLabel('kundenanfragen', 'wartezeit_intern_min')} value={record.fields.wartezeit_intern_min} format="text" />
        <RecordField label={fieldLabel('kundenanfragen', 'geklaert_am')} value={record.fields.geklaert_am} format="datetime" />
        <RecordField label={fieldLabel('kundenanfragen', 'anzahl_nachtraegliche_aenderungen')} value={record.fields.anzahl_nachtraegliche_aenderungen} format="text" />
        <RecordField label={fieldLabel('kundenanfragen', 'anzahl_nacharbeiten')} value={record.fields.anzahl_nacharbeiten} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('kundenanfragen', 'kunde')}
          name={kundeTarget?.fields.kundennummer ?? '—'}
          meta={[kundeTarget?.fields.e_mail, kundeTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={kundeTarget && onOpenKunden ? () => onOpenKunden!(kundeTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('technischer_abschluss')}
        items={technischerAbschlussList.filter(r => extractRecordId(r.fields.anfrage) === record.record_id)}
        map={r => ({ name: r.fields.geprueft_von ?? appLabel('technischer_abschluss'), meta: r.fields.pruefdatum })}
        onOpen={onOpenTechnischerAbschluss}
        onAdd={onAddTechnischerAbschluss}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('statusprotokoll')}
        items={statusprotokollList.filter(r => extractRecordId(r.fields.anfrage) === record.record_id)}
        map={r => ({ name: r.fields.objektbezeichnung ?? appLabel('statusprotokoll'), meta: r.fields.zeitpunkt })}
        onOpen={onOpenStatusprotokoll}
        onAdd={onAddStatusprotokoll}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('informationsquellen')}
        items={informationsquellenList.filter(r => extractRecordId(r.fields.anfrage) === record.record_id)}
        map={r => ({ name: r.fields.versionskennung ?? appLabel('informationsquellen'), meta: r.fields.eingangszeitpunkt })}
        onOpen={onOpenInformationsquellen}
        onAdd={onAddInformationsquellen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('technische_anforderungen')}
        items={technischeAnforderungenList.filter(r => extractRecordId(r.fields.anfrage) === record.record_id)}
        map={r => ({ name: r.fields.bezeichnung ?? appLabel('technische_anforderungen'), meta: r.fields.gueltig_ab })}
        onOpen={onOpenTechnischeAnforderungen}
        onAdd={onAddTechnischeAnforderungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('offene_punkte')}
        items={offenePunkteList.filter(r => extractRecordId(r.fields.anfrage) === record.record_id)}
        map={r => ({ name: r.fields.kurztitel ?? appLabel('offene_punkte'), meta: r.fields.faellig_am })}
        onOpen={onOpenOffenePunkte}
        onAdd={onAddOffenePunkte}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('aufgaben')}
        items={aufgabenList.filter(r => extractRecordId(r.fields.anfrage) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('aufgaben'), meta: r.fields.faellig_am })}
        onOpen={onOpenAufgaben}
        onAdd={onAddAufgaben}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('beurteilungen')}
        items={beurteilungenList.filter(r => extractRecordId(r.fields.anfrage) === record.record_id)}
        map={r => ({ name: r.fields.beurteilungsgegenstand ?? appLabel('beurteilungen'), meta: r.fields.erstellt_am })}
        onOpen={onOpenBeurteilungen}
        onAdd={onAddBeurteilungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('rueckfragen_und_kommunikation')}
        items={rueckfragenUndKommunikationList.filter(r => extractRecordId(r.fields.anfrage) === record.record_id)}
        map={r => ({ name: r.fields.absender ?? appLabel('rueckfragen_und_kommunikation'), meta: r.fields.versanddatum })}
        onOpen={onOpenRueckfragenUndKommunikation}
        onAdd={onAddRueckfragenUndKommunikation}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => extractRecordId(r.fields.anfrage) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('entscheidungen'), meta: r.fields.entscheidungsdatum })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => extractRecordId(r.fields.ursprungsanfrage) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: r.fields.bestaetigt_am })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('wiederverwendung_von_erfahrungen')}
        items={wiederverwendungVonErfahrungenList.filter(r => extractRecordId(r.fields.ziel_anfrage) === record.record_id)}
        map={r => ({ name: r.fields.geprueft_von ?? appLabel('wiederverwendung_von_erfahrungen'), meta: r.fields.abrufdatum })}
        onOpen={onOpenWiederverwendungVonErfahrungen}
        onAdd={onAddWiederverwendungVonErfahrungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.KUNDENANFRAGEN} recordId={record.record_id} readOnly={!perms.canWrite('kundenanfragen')} />
    </>
  );
}
