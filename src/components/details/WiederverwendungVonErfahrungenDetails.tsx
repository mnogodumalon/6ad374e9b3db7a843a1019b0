import type { WiederverwendungVonErfahrungen, Erfahrungen, Kundenanfragen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { usePermissions } from '@/lib/permissions';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';

export interface WiederverwendungVonErfahrungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: WiederverwendungVonErfahrungen;
  /** N:1-Ziel „Erfahrungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  erfahrungenList: Erfahrungen[];
  /** Klick auf die Erfahrungen-Relation → overlay.push auf dessen Detail. */
  onOpenErfahrungen?: (record: Erfahrungen) => void;
  /** N:1-Ziel „Kundenanfragen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenanfragenList: Kundenanfragen[];
  /** Klick auf die Kundenanfragen-Relation → overlay.push auf dessen Detail. */
  onOpenKundenanfragen?: (record: Kundenanfragen) => void;
}

export function WiederverwendungVonErfahrungenDetails({
  record,
  erfahrungenList,
  onOpenErfahrungen,
  kundenanfragenList,
  onOpenKundenanfragen,
}: WiederverwendungVonErfahrungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const erfahrungTarget = erfahrungenList.find(r => r.record_id === extractRecordId(record.fields.erfahrung));
  const ziel_anfrageTarget = kundenanfragenList.find(r => r.record_id === extractRecordId(record.fields.ziel_anfrage));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('wiederverwendung_von_erfahrungen', 'abrufdatum')} value={record.fields.abrufdatum} format="datetime" />
        <RecordField label={fieldLabel('wiederverwendung_von_erfahrungen', 'abrufgrund')} value={record.fields.abrufgrund} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('wiederverwendung_von_erfahrungen', 'aehnlichkeit')} value={record.fields.aehnlichkeit} format="pill" />
        <RecordField label={fieldLabel('wiederverwendung_von_erfahrungen', 'kontextunterschiede')} value={record.fields.kontextunterschiede} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('wiederverwendung_von_erfahrungen', 'gueltigkeit_geprueft')} value={record.fields.gueltigkeit_geprueft} format="bool" />
        <RecordField label={fieldLabel('wiederverwendung_von_erfahrungen', 'geprueft_von')} value={record.fields.geprueft_von} format="text" />
        <RecordField label={fieldLabel('wiederverwendung_von_erfahrungen', 'verwendungsergebnis')} value={record.fields.verwendungsergebnis} format="pill" />
        <RecordField label={fieldLabel('wiederverwendung_von_erfahrungen', 'begruendung')} value={record.fields.begruendung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('wiederverwendung_von_erfahrungen', 'beobachteter_nutzen')} value={record.fields.beobachteter_nutzen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('wiederverwendung_von_erfahrungen', 'ersparnis_schaetzung_min')} value={record.fields.ersparnis_schaetzung_min} format="text" />
        <RecordField label={fieldLabel('wiederverwendung_von_erfahrungen', 'ersparnis_tatsaechlich_min')} value={record.fields.ersparnis_tatsaechlich_min} format="text" />
        <RecordField label={fieldLabel('wiederverwendung_von_erfahrungen', 'negative_folgen')} value={record.fields.negative_folgen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('wiederverwendung_von_erfahrungen', 'bewertet_am')} value={record.fields.bewertet_am} format="date" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('wiederverwendung_von_erfahrungen', 'erfahrung')}
          name={erfahrungTarget?.fields.titel ?? '—'}
          meta={[erfahrungTarget?.fields.produktfamilie, erfahrungTarget?.fields.anforderungstyp].filter(Boolean).join(' · ') || undefined}
          onClick={erfahrungTarget && onOpenErfahrungen ? () => onOpenErfahrungen!(erfahrungTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('wiederverwendung_von_erfahrungen', 'ziel_anfrage')}
          name={ziel_anfrageTarget?.fields.anfragenummer ?? '—'}
          meta={[ziel_anfrageTarget?.fields.kontakt_email].filter(Boolean).join(' · ') || undefined}
          onClick={ziel_anfrageTarget && onOpenKundenanfragen ? () => onOpenKundenanfragen!(ziel_anfrageTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.WIEDERVERWENDUNG_VON_ERFAHRUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('wiederverwendung_von_erfahrungen')} />
    </>
  );
}
