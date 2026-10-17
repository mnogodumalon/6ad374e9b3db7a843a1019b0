import type { RueckfragenUndKommunikation, OffenePunkte, Informationsquellen, Kundenanfragen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { usePermissions } from '@/lib/permissions';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface RueckfragenUndKommunikationDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: RueckfragenUndKommunikation;
  /** N:1-Ziel „OffenePunkte": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  offenePunkteList: OffenePunkte[];
  /** Reserviert — OffenePunkte ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenOffenePunkte?: (record: OffenePunkte) => void;
  /** N:1-Ziel „RueckfragenUndKommunikation": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  rueckfragenUndKommunikationList: RueckfragenUndKommunikation[];
  /** Klick auf die RueckfragenUndKommunikation-Relation → overlay.push auf dessen Detail. */
  onOpenRueckfragenUndKommunikation?: (record: RueckfragenUndKommunikation) => void;
  /** N:1-Ziel „Informationsquellen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  informationsquellenList: Informationsquellen[];
  /** Klick auf die Informationsquellen-Relation → overlay.push auf dessen Detail. */
  onOpenInformationsquellen?: (record: Informationsquellen) => void;
  /** N:1-Ziel „Kundenanfragen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenanfragenList: Kundenanfragen[];
  /** Klick auf die Kundenanfragen-Relation → overlay.push auf dessen Detail. */
  onOpenKundenanfragen?: (record: Kundenanfragen) => void;
}

export function RueckfragenUndKommunikationDetails({
  record,
  offenePunkteList,
  rueckfragenUndKommunikationList,
  onOpenRueckfragenUndKommunikation,
  informationsquellenList,
  onOpenInformationsquellen,
  kundenanfragenList,
  onOpenKundenanfragen,
}: RueckfragenUndKommunikationDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const beantwortet_nachrichtTarget = rueckfragenUndKommunikationList.find(r => r.record_id === extractRecordId(record.fields.beantwortet_nachricht));
  const quelleTarget = informationsquellenList.find(r => r.record_id === extractRecordId(record.fields.quelle));
  const anfrageTarget = kundenanfragenList.find(r => r.record_id === extractRecordId(record.fields.anfrage));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'zugehoerige_offene_punkte')} value={Array.isArray(record.fields.zugehoerige_offene_punkte) ? record.fields.zugehoerige_offene_punkte.map((u: unknown) => offenePunkteList.find(t => t.record_id === extractRecordId(u))?.fields.kurztitel ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'kommunikationstyp')} value={record.fields.kommunikationstyp} format="pill" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'kanal')} value={record.fields.kanal} format="pill" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'absender')} value={record.fields.absender} format="text" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'empfaenger')} value={record.fields.empfaenger} format="text" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'betreff')} value={record.fields.betreff} format="text" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'inhalt')} value={record.fields.inhalt} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'versandstatus')} value={record.fields.versandstatus} format="pill" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'versanddatum')} value={record.fields.versanddatum} format="datetime" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'antwort_erwartet_bis')} value={record.fields.antwort_erwartet_bis} format="date" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'antwort_erhalten_am')} value={record.fields.antwort_erhalten_am} format="datetime" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'antwortstatus')} value={record.fields.antwortstatus} format="pill" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'folgeaufgabe_noetig')} value={record.fields.folgeaufgabe_noetig} format="bool" />
        <RecordField label={fieldLabel('rueckfragen_und_kommunikation', 'notizen')} value={record.fields.notizen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('rueckfragen_und_kommunikation', 'beantwortet_nachricht')}
          name={beantwortet_nachrichtTarget?.fields.absender ?? '—'}
          meta={[beantwortet_nachrichtTarget?.fields.empfaenger, beantwortet_nachrichtTarget?.fields.betreff].filter(Boolean).join(' · ') || undefined}
          onClick={beantwortet_nachrichtTarget && onOpenRueckfragenUndKommunikation ? () => onOpenRueckfragenUndKommunikation!(beantwortet_nachrichtTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('rueckfragen_und_kommunikation', 'quelle')}
          name={quelleTarget?.fields.titel ?? '—'}
          meta={[quelleTarget?.fields.versionskennung, quelleTarget?.fields.pruefung_durch].filter(Boolean).join(' · ') || undefined}
          onClick={quelleTarget && onOpenInformationsquellen ? () => onOpenInformationsquellen!(quelleTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('rueckfragen_und_kommunikation', 'anfrage')}
          name={anfrageTarget?.fields.anfragenummer ?? '—'}
          meta={[anfrageTarget?.fields.kontakt_email].filter(Boolean).join(' · ') || undefined}
          onClick={anfrageTarget && onOpenKundenanfragen ? () => onOpenKundenanfragen!(anfrageTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.RUECKFRAGEN_UND_KOMMUNIKATION} recordId={record.record_id} readOnly={!perms.canWrite('rueckfragen_und_kommunikation')} />
    </>
  );
}
