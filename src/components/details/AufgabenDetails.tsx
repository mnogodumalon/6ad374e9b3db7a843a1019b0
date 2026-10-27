import type { Aufgaben, Kundenanfragen, OffenePunkte } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';

export interface AufgabenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Aufgaben;
  /** N:1-Ziel „Kundenanfragen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenanfragenList: Kundenanfragen[];
  /** Klick auf die Kundenanfragen-Relation → overlay.push auf dessen Detail. */
  onOpenKundenanfragen?: (record: Kundenanfragen) => void;
  /** N:1-Ziel „OffenePunkte": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  offenePunkteList: OffenePunkte[];
  /** Klick auf die OffenePunkte-Relation → overlay.push auf dessen Detail. */
  onOpenOffenePunkte?: (record: OffenePunkte) => void;
  /** N:1-Ziel „Aufgaben": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  aufgabenList: Aufgaben[];
  /** Reserviert — Aufgaben ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenAufgaben?: (record: Aufgaben) => void;
}

export function AufgabenDetails({
  record,
  kundenanfragenList,
  onOpenKundenanfragen,
  offenePunkteList,
  onOpenOffenePunkte,
  aufgabenList,
}: AufgabenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const anfrageTarget = kundenanfragenList.find(r => r.record_id === extractRecordId(record.fields.anfrage));
  const offener_punktTarget = offenePunkteList.find(r => r.record_id === extractRecordId(record.fields.offener_punkt));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('aufgaben', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('aufgaben', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('aufgaben', 'aufgabentyp')} value={record.fields.aufgabentyp} format="pill" />
        <RecordField label={fieldLabel('aufgaben', 'verantwortlicher_vorname')} value={record.fields.verantwortlicher_vorname} format="text" />
        <RecordField label={fieldLabel('aufgaben', 'verantwortlicher_nachname')} value={record.fields.verantwortlicher_nachname} format="text" />
        <RecordField label={fieldLabel('aufgaben', 'mitwirkende')} value={record.fields.mitwirkende} format="text" />
        <RecordField label={fieldLabel('aufgaben', 'prioritaet')} value={record.fields.prioritaet} format="pill" />
        <RecordField label={fieldLabel('aufgaben', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('aufgaben', 'faellig_am')} value={record.fields.faellig_am} format="date" />
        <RecordField label={fieldLabel('aufgaben', 'blockierungsgrund')} value={record.fields.blockierungsgrund} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('aufgaben', 'ergebnis')} value={record.fields.ergebnis} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('aufgaben', 'abgeschlossen_am')} value={record.fields.abgeschlossen_am} format="datetime" />
        <RecordField label={fieldLabel('aufgaben', 'abhaengige_aufgaben')} value={Array.isArray(record.fields.abhaengige_aufgaben) ? record.fields.abhaengige_aufgaben.map((u: unknown) => aufgabenList.find(t => t.record_id === extractRecordId(u))?.fields.titel ?? '—').join(', ') : null} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('aufgaben', 'anfrage')}
          name={anfrageTarget?.fields.anfragenummer ?? '—'}
          meta={[anfrageTarget?.fields.kontakt_email].filter(Boolean).join(' · ') || undefined}
          onClick={anfrageTarget && onOpenKundenanfragen ? () => onOpenKundenanfragen!(anfrageTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('aufgaben', 'offener_punkt')}
          name={offener_punktTarget?.fields.kurztitel ?? '—'}
          meta={[offener_punktTarget?.fields.zustaendige_rolle, offener_punktTarget?.fields.verantwortlicher_vorname].filter(Boolean).join(' · ') || undefined}
          onClick={offener_punktTarget && onOpenOffenePunkte ? () => onOpenOffenePunkte!(offener_punktTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.AUFGABEN} recordId={record.record_id} readOnly={!perms.canWrite('aufgaben')} />
    </>
  );
}
