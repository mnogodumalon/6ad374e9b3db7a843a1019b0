import type { Informationsquellen, Kundenanfragen, TechnischeAnforderungen, OffenePunkte, Beurteilungen, RueckfragenUndKommunikation, Erfahrungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface InformationsquellenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Informationsquellen;
  /** N:1-Ziel „Informationsquellen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  informationsquellenList: Informationsquellen[];
  /** Klick auf die Informationsquellen-Relation → overlay.push auf dessen Detail. */
  onOpenInformationsquellen?: (record: Informationsquellen) => void;
  /** N:1-Ziel „Kundenanfragen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenanfragenList: Kundenanfragen[];
  /** Klick auf die Kundenanfragen-Relation → overlay.push auf dessen Detail. */
  onOpenKundenanfragen?: (record: Kundenanfragen) => void;
  /** 1:N „Technische Anforderungen" (quellen): VOLLE Liste — der Block filtert auf diesen Record. */
  technischeAnforderungenList: TechnischeAnforderungen[];
  /** Zeilen-Klick → overlay.push auf das TechnischeAnforderungen-Detail (nie der Edit-Dialog). */
  onOpenTechnischeAnforderungen: (record: TechnischeAnforderungen) => void;
  /** Kontextuelles „+": öffnet den TechnischeAnforderungen-Dialog mit diesem Record vorgesetzt. */
  onAddTechnischeAnforderungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden TechnischeAnforderungen-Datensatz. */
  onPickTechnischeAnforderungen?: () => void;
  /** 1:N „Offene Punkte" (betroffene_quellen): VOLLE Liste — der Block filtert auf diesen Record. */
  offenePunkteList: OffenePunkte[];
  /** Zeilen-Klick → overlay.push auf das OffenePunkte-Detail (nie der Edit-Dialog). */
  onOpenOffenePunkte: (record: OffenePunkte) => void;
  /** Kontextuelles „+": öffnet den OffenePunkte-Dialog mit diesem Record vorgesetzt. */
  onAddOffenePunkte?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden OffenePunkte-Datensatz. */
  onPickOffenePunkte?: () => void;
  /** 1:N „Beurteilungen" (zugrunde_liegende_quellen): VOLLE Liste — der Block filtert auf diesen Record. */
  beurteilungenList: Beurteilungen[];
  /** Zeilen-Klick → overlay.push auf das Beurteilungen-Detail (nie der Edit-Dialog). */
  onOpenBeurteilungen: (record: Beurteilungen) => void;
  /** Kontextuelles „+": öffnet den Beurteilungen-Dialog mit diesem Record vorgesetzt. */
  onAddBeurteilungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Beurteilungen-Datensatz. */
  onPickBeurteilungen?: () => void;
  /** 1:N „Rückfragen und Kommunikation" (quelle): VOLLE Liste — der Block filtert auf diesen Record. */
  rueckfragenUndKommunikationList: RueckfragenUndKommunikation[];
  /** Zeilen-Klick → overlay.push auf das RueckfragenUndKommunikation-Detail (nie der Edit-Dialog). */
  onOpenRueckfragenUndKommunikation: (record: RueckfragenUndKommunikation) => void;
  /** Kontextuelles „+": öffnet den RueckfragenUndKommunikation-Dialog mit diesem Record vorgesetzt. */
  onAddRueckfragenUndKommunikation?: () => void;
  /** 1:N „Erfahrungen" (belegquellen): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Erfahrungen-Datensatz. */
  onPickErfahrungen?: () => void;
}

export function InformationsquellenDetails({
  record,
  informationsquellenList,
  onOpenInformationsquellen,
  kundenanfragenList,
  onOpenKundenanfragen,
  technischeAnforderungenList,
  onOpenTechnischeAnforderungen,
  onAddTechnischeAnforderungen,
  onPickTechnischeAnforderungen,
  offenePunkteList,
  onOpenOffenePunkte,
  onAddOffenePunkte,
  onPickOffenePunkte,
  beurteilungenList,
  onOpenBeurteilungen,
  onAddBeurteilungen,
  onPickBeurteilungen,
  rueckfragenUndKommunikationList,
  onOpenRueckfragenUndKommunikation,
  onAddRueckfragenUndKommunikation,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
  onPickErfahrungen,
}: InformationsquellenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const ersetzt_quelleTarget = informationsquellenList.find(r => r.record_id === extractRecordId(record.fields.ersetzt_quelle));
  const anfrageTarget = kundenanfragenList.find(r => r.record_id === extractRecordId(record.fields.anfrage));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('informationsquellen', 'eingangszeitpunkt')} value={record.fields.eingangszeitpunkt} format="datetime" />
        <RecordField label={fieldLabel('informationsquellen', 'versionskennung')} value={record.fields.versionskennung} format="text" />
        <RecordField label={fieldLabel('informationsquellen', 'quellenstatus')} value={record.fields.quellenstatus} format="pill" />
        <RecordField label={fieldLabel('informationsquellen', 'zusammenfassung')} value={record.fields.zusammenfassung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('informationsquellen', 'extraktionsstatus')} value={record.fields.extraktionsstatus} format="pill" />
        <RecordField label={fieldLabel('informationsquellen', 'pruefung_durch')} value={record.fields.pruefung_durch} format="text" />
        <RecordField label={fieldLabel('informationsquellen', 'pruefung_am')} value={record.fields.pruefung_am} format="datetime" />
        <RecordField label={fieldLabel('informationsquellen', 'erneute_pruefung')} value={record.fields.erneute_pruefung} format="bool" />
        <RecordField label={fieldLabel('informationsquellen', 'bemerkung')} value={record.fields.bemerkung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('informationsquellen', 'quellentyp')} value={record.fields.quellentyp} format="pill" />
        <RecordField label={fieldLabel('informationsquellen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('informationsquellen', 'datei')} className="md:col-span-2">
          {record.fields.datei ? (
            <MediaThumbnail src={record.fields.datei as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('informationsquellen', 'referenz_url')} value={record.fields.referenz_url} format="url" />
        <RecordField label={fieldLabel('informationsquellen', 'urheber')} value={record.fields.urheber} format="text" />
        <RecordField label={fieldLabel('informationsquellen', 'quellendatum')} value={record.fields.quellendatum} format="date" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('informationsquellen', 'ersetzt_quelle')}
          name={ersetzt_quelleTarget?.fields.titel ?? '—'}
          meta={[ersetzt_quelleTarget?.fields.versionskennung, ersetzt_quelleTarget?.fields.pruefung_durch].filter(Boolean).join(' · ') || undefined}
          onClick={ersetzt_quelleTarget && onOpenInformationsquellen ? () => onOpenInformationsquellen!(ersetzt_quelleTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('informationsquellen', 'anfrage')}
          name={anfrageTarget?.fields.anfragenummer ?? '—'}
          meta={[anfrageTarget?.fields.kontakt_email].filter(Boolean).join(' · ') || undefined}
          onClick={anfrageTarget && onOpenKundenanfragen ? () => onOpenKundenanfragen!(anfrageTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('technische_anforderungen')}
        items={technischeAnforderungenList.filter(r => Array.isArray(r.fields.quellen) && r.fields.quellen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.bezeichnung ?? appLabel('technische_anforderungen'), meta: r.fields.gueltig_ab })}
        onOpen={onOpenTechnischeAnforderungen}
        onAdd={onAddTechnischeAnforderungen}
        onPick={onPickTechnischeAnforderungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('offene_punkte')}
        items={offenePunkteList.filter(r => Array.isArray(r.fields.betroffene_quellen) && r.fields.betroffene_quellen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.kurztitel ?? appLabel('offene_punkte'), meta: r.fields.faellig_am })}
        onOpen={onOpenOffenePunkte}
        onAdd={onAddOffenePunkte}
        onPick={onPickOffenePunkte}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('beurteilungen')}
        items={beurteilungenList.filter(r => Array.isArray(r.fields.zugrunde_liegende_quellen) && r.fields.zugrunde_liegende_quellen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.beurteilungsgegenstand ?? appLabel('beurteilungen'), meta: r.fields.erstellt_am })}
        onOpen={onOpenBeurteilungen}
        onAdd={onAddBeurteilungen}
        onPick={onPickBeurteilungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('rueckfragen_und_kommunikation')}
        items={rueckfragenUndKommunikationList.filter(r => extractRecordId(r.fields.quelle) === record.record_id)}
        map={r => ({ name: r.fields.absender ?? appLabel('rueckfragen_und_kommunikation'), meta: r.fields.versanddatum })}
        onOpen={onOpenRueckfragenUndKommunikation}
        onAdd={onAddRueckfragenUndKommunikation}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => Array.isArray(r.fields.belegquellen) && r.fields.belegquellen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: r.fields.bestaetigt_am })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        onPick={onPickErfahrungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.INFORMATIONSQUELLEN} recordId={record.record_id} readOnly={!perms.canWrite('informationsquellen')} />
    </>
  );
}
