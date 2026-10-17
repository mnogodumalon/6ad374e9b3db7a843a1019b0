import type { Erfahrungen, Informationsquellen, Beurteilungen, Entscheidungen, Kundenanfragen, TechnischerAbschluss, WiederverwendungVonErfahrungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface ErfahrungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Erfahrungen;
  /** N:1-Ziel „Informationsquellen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  informationsquellenList: Informationsquellen[];
  /** Reserviert — Informationsquellen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenInformationsquellen?: (record: Informationsquellen) => void;
  /** N:1-Ziel „Beurteilungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  beurteilungenList: Beurteilungen[];
  /** Reserviert — Beurteilungen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenBeurteilungen?: (record: Beurteilungen) => void;
  /** N:1-Ziel „Entscheidungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  entscheidungenList: Entscheidungen[];
  /** Reserviert — Entscheidungen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenEntscheidungen?: (record: Entscheidungen) => void;
  /** N:1-Ziel „Kundenanfragen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenanfragenList: Kundenanfragen[];
  /** Klick auf die Kundenanfragen-Relation → overlay.push auf dessen Detail. */
  onOpenKundenanfragen?: (record: Kundenanfragen) => void;
  /** N:1-Ziel „TechnischerAbschluss": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  technischerAbschlussList: TechnischerAbschluss[];
  /** Klick auf die TechnischerAbschluss-Relation → overlay.push auf dessen Detail. */
  onOpenTechnischerAbschluss?: (record: TechnischerAbschluss) => void;
  /** 1:N „Wiederverwendung von Erfahrungen" (erfahrung): VOLLE Liste — der Block filtert auf diesen Record. */
  wiederverwendungVonErfahrungenList: WiederverwendungVonErfahrungen[];
  /** Zeilen-Klick → overlay.push auf das WiederverwendungVonErfahrungen-Detail (nie der Edit-Dialog). */
  onOpenWiederverwendungVonErfahrungen: (record: WiederverwendungVonErfahrungen) => void;
  /** Kontextuelles „+": öffnet den WiederverwendungVonErfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddWiederverwendungVonErfahrungen?: () => void;
}

export function ErfahrungenDetails({
  record,
  informationsquellenList,
  beurteilungenList,
  entscheidungenList,
  kundenanfragenList,
  onOpenKundenanfragen,
  technischerAbschlussList,
  onOpenTechnischerAbschluss,
  wiederverwendungVonErfahrungenList,
  onOpenWiederverwendungVonErfahrungen,
  onAddWiederverwendungVonErfahrungen,
}: ErfahrungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const ursprungsanfrageTarget = kundenanfragenList.find(r => r.record_id === extractRecordId(record.fields.ursprungsanfrage));
  const belegabschlussTarget = technischerAbschlussList.find(r => r.record_id === extractRecordId(record.fields.belegabschluss));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('erfahrungen', 'belegquellen')} value={Array.isArray(record.fields.belegquellen) ? record.fields.belegquellen.map((u: unknown) => informationsquellenList.find(t => t.record_id === extractRecordId(u))?.fields.titel ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'belegbeurteilungen')} value={Array.isArray(record.fields.belegbeurteilungen) ? record.fields.belegbeurteilungen.map((u: unknown) => beurteilungenList.find(t => t.record_id === extractRecordId(u))?.fields.beurteilungsgegenstand ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'belegentscheidungen')} value={Array.isArray(record.fields.belegentscheidungen) ? record.fields.belegentscheidungen.map((u: unknown) => entscheidungenList.find(t => t.record_id === extractRecordId(u))?.fields.titel ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'sachverhalt')} value={record.fields.sachverhalt} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'erfahrungstyp')} value={record.fields.erfahrungstyp} format="pill" />
        <RecordField label={fieldLabel('erfahrungen', 'produktfamilie')} value={record.fields.produktfamilie} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'anforderungstyp')} value={record.fields.anforderungstyp} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'schlagwoerter')} value={record.fields.schlagwoerter} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'urspruengliches_problem')} value={record.fields.urspruengliches_problem} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'vorgehen')} value={record.fields.vorgehen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'beobachtetes_ergebnis')} value={record.fields.beobachtetes_ergebnis} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'erkenntnis')} value={record.fields.erkenntnis} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'gueltigkeitsbedingungen')} value={record.fields.gueltigkeitsbedingungen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'bekannte_grenzen')} value={record.fields.bekannte_grenzen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('erfahrungen', 'risiko_uebertragung')} value={record.fields.risiko_uebertragung} format="pill" />
        <RecordField label={fieldLabel('erfahrungen', 'bestaetigungsstatus')} value={record.fields.bestaetigungsstatus} format="pill" />
        <RecordField label={fieldLabel('erfahrungen', 'bestaetigt_von')} value={record.fields.bestaetigt_von} format="text" />
        <RecordField label={fieldLabel('erfahrungen', 'bestaetigt_am')} value={record.fields.bestaetigt_am} format="date" />
        <RecordField label={fieldLabel('erfahrungen', 'gueltig_ab')} value={record.fields.gueltig_ab} format="date" />
        <RecordField label={fieldLabel('erfahrungen', 'gueltig_bis')} value={record.fields.gueltig_bis} format="date" />
        <RecordField label={fieldLabel('erfahrungen', 'wiederverwendungsstatus')} value={record.fields.wiederverwendungsstatus} format="pill" />
        <RecordField label={fieldLabel('erfahrungen', 'kommentar_wiederverwendung')} value={record.fields.kommentar_wiederverwendung} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={2}>
        <RecordRelation
          label={fieldLabel('erfahrungen', 'ursprungsanfrage')}
          name={ursprungsanfrageTarget?.fields.anfragenummer ?? '—'}
          meta={[ursprungsanfrageTarget?.fields.kontakt_email].filter(Boolean).join(' · ') || undefined}
          onClick={ursprungsanfrageTarget && onOpenKundenanfragen ? () => onOpenKundenanfragen!(ursprungsanfrageTarget!) : undefined}
        />
        <RecordRelation
          label={fieldLabel('erfahrungen', 'belegabschluss')}
          name={belegabschlussTarget?.fields.geprueft_von ?? '—'}
          meta={[belegabschlussTarget?.fields.uebergabeempfaenger].filter(Boolean).join(' · ') || undefined}
          onClick={belegabschlussTarget && onOpenTechnischerAbschluss ? () => onOpenTechnischerAbschluss!(belegabschlussTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('wiederverwendung_von_erfahrungen')}
        items={wiederverwendungVonErfahrungenList.filter(r => extractRecordId(r.fields.erfahrung) === record.record_id)}
        map={r => ({ name: r.fields.geprueft_von ?? appLabel('wiederverwendung_von_erfahrungen'), meta: r.fields.abrufdatum })}
        onOpen={onOpenWiederverwendungVonErfahrungen}
        onAdd={onAddWiederverwendungVonErfahrungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.ERFAHRUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('erfahrungen')} />
    </>
  );
}
