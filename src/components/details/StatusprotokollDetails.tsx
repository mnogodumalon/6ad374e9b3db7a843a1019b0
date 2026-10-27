import type { Statusprotokoll, Kundenanfragen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface StatusprotokollDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Statusprotokoll;
  /** N:1-Ziel „Kundenanfragen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenanfragenList: Kundenanfragen[];
  /** Klick auf die Kundenanfragen-Relation → overlay.push auf dessen Detail. */
  onOpenKundenanfragen?: (record: Kundenanfragen) => void;
}

export function StatusprotokollDetails({
  record,
  kundenanfragenList,
  onOpenKundenanfragen,
}: StatusprotokollDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const anfrageTarget = kundenanfragenList.find(r => r.record_id === extractRecordId(record.fields.anfrage));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('statusprotokoll', 'objekttyp')} value={record.fields.objekttyp} format="pill" />
        <RecordField label={fieldLabel('statusprotokoll', 'objektbezeichnung')} value={record.fields.objektbezeichnung} format="text" />
        <RecordField label={fieldLabel('statusprotokoll', 'alter_status')} value={record.fields.alter_status} format="text" />
        <RecordField label={fieldLabel('statusprotokoll', 'neuer_status')} value={record.fields.neuer_status} format="text" />
        <RecordField label={fieldLabel('statusprotokoll', 'zeitpunkt')} value={record.fields.zeitpunkt} format="datetime" />
        <RecordField label={fieldLabel('statusprotokoll', 'benutzer_vorname')} value={record.fields.benutzer_vorname} format="text" />
        <RecordField label={fieldLabel('statusprotokoll', 'benutzer_nachname')} value={record.fields.benutzer_nachname} format="text" />
        <RecordField label={fieldLabel('statusprotokoll', 'begruendung')} value={record.fields.begruendung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('statusprotokoll', 'anfrage')}
          name={anfrageTarget?.fields.anfragenummer ?? '—'}
          meta={[anfrageTarget?.fields.kontakt_email].filter(Boolean).join(' · ') || undefined}
          onClick={anfrageTarget && onOpenKundenanfragen ? () => onOpenKundenanfragen!(anfrageTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.STATUSPROTOKOLL} recordId={record.record_id} readOnly={!perms.canWrite('statusprotokoll')} />
    </>
  );
}
