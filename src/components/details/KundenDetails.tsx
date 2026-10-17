import type { Kunden, Kundenanfragen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface KundenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Kunden;
  /** 1:N „Kundenanfragen" (kunde): VOLLE Liste — der Block filtert auf diesen Record. */
  kundenanfragenList: Kundenanfragen[];
  /** Zeilen-Klick → overlay.push auf das Kundenanfragen-Detail (nie der Edit-Dialog). */
  onOpenKundenanfragen: (record: Kundenanfragen) => void;
  /** Kontextuelles „+": öffnet den Kundenanfragen-Dialog mit diesem Record vorgesetzt. */
  onAddKundenanfragen?: () => void;
}

export function KundenDetails({
  record,
  kundenanfragenList,
  onOpenKundenanfragen,
  onAddKundenanfragen,
}: KundenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('kunden', 'kundennummer')} value={record.fields.kundennummer} format="text" />
        <RecordField label={fieldLabel('kunden', 'firmenname')} value={record.fields.firmenname} format="text" />
        <RecordField label={fieldLabel('kunden', 'ansprechpartner_vorname')} value={record.fields.ansprechpartner_vorname} format="text" />
        <RecordField label={fieldLabel('kunden', 'ansprechpartner_nachname')} value={record.fields.ansprechpartner_nachname} format="text" />
        <RecordField label={fieldLabel('kunden', 'e_mail')} value={record.fields.e_mail} format="email" />
        <RecordField label={fieldLabel('kunden', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('kunden', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('kunden', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('kunden', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('kunden', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('kunden', 'branche')} value={record.fields.branche} format="text" />
        <RecordField label={fieldLabel('kunden', 'interne_bemerkung')} value={record.fields.interne_bemerkung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('kunden', 'aktiv')} value={record.fields.aktiv} format="bool" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('kundenanfragen')}
        items={kundenanfragenList.filter(r => extractRecordId(r.fields.kunde) === record.record_id)}
        map={r => ({ name: r.fields.anfragenummer ?? appLabel('kundenanfragen'), meta: r.fields.eingangsdatum })}
        onOpen={onOpenKundenanfragen}
        onAdd={onAddKundenanfragen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.KUNDEN} recordId={record.record_id} readOnly={!perms.canWrite('kunden')} />
    </>
  );
}
