import type { Beurteilungen, TechnischeAnforderungen, OffenePunkte, Informationsquellen, Kundenanfragen, Entscheidungen, Erfahrungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface BeurteilungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Beurteilungen;
  /** N:1-Ziel „TechnischeAnforderungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  technischeAnforderungenList: TechnischeAnforderungen[];
  /** Reserviert — TechnischeAnforderungen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenTechnischeAnforderungen?: (record: TechnischeAnforderungen) => void;
  /** N:1-Ziel „OffenePunkte": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  offenePunkteList: OffenePunkte[];
  /** Reserviert — OffenePunkte ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenOffenePunkte?: (record: OffenePunkte) => void;
  /** N:1-Ziel „Informationsquellen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  informationsquellenList: Informationsquellen[];
  /** Reserviert — Informationsquellen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenInformationsquellen?: (record: Informationsquellen) => void;
  /** N:1-Ziel „Kundenanfragen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenanfragenList: Kundenanfragen[];
  /** Klick auf die Kundenanfragen-Relation → overlay.push auf dessen Detail. */
  onOpenKundenanfragen?: (record: Kundenanfragen) => void;
  /** 1:N „Entscheidungen" (zugrunde_liegende_beurteilungen): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Entscheidungen-Datensatz. */
  onPickEntscheidungen?: () => void;
  /** 1:N „Erfahrungen" (belegbeurteilungen): VOLLE Liste — der Block filtert auf diesen Record. */
  erfahrungenList: Erfahrungen[];
  /** Zeilen-Klick → overlay.push auf das Erfahrungen-Detail (nie der Edit-Dialog). */
  onOpenErfahrungen: (record: Erfahrungen) => void;
  /** Kontextuelles „+": öffnet den Erfahrungen-Dialog mit diesem Record vorgesetzt. */
  onAddErfahrungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Erfahrungen-Datensatz. */
  onPickErfahrungen?: () => void;
}

export function BeurteilungenDetails({
  record,
  technischeAnforderungenList,
  offenePunkteList,
  informationsquellenList,
  kundenanfragenList,
  onOpenKundenanfragen,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
  onPickEntscheidungen,
  erfahrungenList,
  onOpenErfahrungen,
  onAddErfahrungen,
  onPickErfahrungen,
}: BeurteilungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const anfrageTarget = kundenanfragenList.find(r => r.record_id === extractRecordId(record.fields.anfrage));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('beurteilungen', 'betroffene_anforderungen')} value={Array.isArray(record.fields.betroffene_anforderungen) ? record.fields.betroffene_anforderungen.map((u: unknown) => technischeAnforderungenList.find(t => t.record_id === extractRecordId(u))?.fields.bezeichnung ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('beurteilungen', 'betroffene_offene_punkte')} value={Array.isArray(record.fields.betroffene_offene_punkte) ? record.fields.betroffene_offene_punkte.map((u: unknown) => offenePunkteList.find(t => t.record_id === extractRecordId(u))?.fields.kurztitel ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('beurteilungen', 'zugrunde_liegende_quellen')} value={Array.isArray(record.fields.zugrunde_liegende_quellen) ? record.fields.zugrunde_liegende_quellen.map((u: unknown) => informationsquellenList.find(t => t.record_id === extractRecordId(u))?.fields.titel ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('beurteilungen', 'beurteilungsgegenstand')} value={record.fields.beurteilungsgegenstand} format="text" />
        <RecordField label={fieldLabel('beurteilungen', 'beurteilungsart')} value={record.fields.beurteilungsart} format="pill" />
        <RecordField label={fieldLabel('beurteilungen', 'einschaetzung')} value={record.fields.einschaetzung} format="pill" />
        <RecordField label={fieldLabel('beurteilungen', 'fachliche_begruendung')} value={record.fields.fachliche_begruendung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('beurteilungen', 'annahmen')} value={record.fields.annahmen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('beurteilungen', 'unsicherheiten')} value={record.fields.unsicherheiten} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('beurteilungen', 'alternativen')} value={record.fields.alternativen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('beurteilungen', 'empfehlung')} value={record.fields.empfehlung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('beurteilungen', 'ist_ki_vorschlag')} value={record.fields.ist_ki_vorschlag} format="bool" />
        <RecordField label={fieldLabel('beurteilungen', 'erstellt_von')} value={record.fields.erstellt_von} format="text" />
        <RecordField label={fieldLabel('beurteilungen', 'erstellt_am')} value={record.fields.erstellt_am} format="datetime" />
        <RecordField label={fieldLabel('beurteilungen', 'pruefstatus')} value={record.fields.pruefstatus} format="pill" />
        <RecordField label={fieldLabel('beurteilungen', 'geprueft_von')} value={record.fields.geprueft_von} format="text" />
        <RecordField label={fieldLabel('beurteilungen', 'geprueft_am')} value={record.fields.geprueft_am} format="datetime" />
        <RecordField label={fieldLabel('beurteilungen', 'erneute_pruefung')} value={record.fields.erneute_pruefung} format="bool" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('beurteilungen', 'anfrage')}
          name={anfrageTarget?.fields.anfragenummer ?? '—'}
          meta={[anfrageTarget?.fields.kontakt_email].filter(Boolean).join(' · ') || undefined}
          onClick={anfrageTarget && onOpenKundenanfragen ? () => onOpenKundenanfragen!(anfrageTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => Array.isArray(r.fields.zugrunde_liegende_beurteilungen) && r.fields.zugrunde_liegende_beurteilungen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.titel ?? appLabel('entscheidungen'), meta: r.fields.entscheidungsdatum })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        onPick={onPickEntscheidungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('erfahrungen')}
        items={erfahrungenList.filter(r => Array.isArray(r.fields.belegbeurteilungen) && r.fields.belegbeurteilungen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.titel ?? appLabel('erfahrungen'), meta: r.fields.bestaetigt_am })}
        onOpen={onOpenErfahrungen}
        onAdd={onAddErfahrungen}
        onPick={onPickErfahrungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.BEURTEILUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('beurteilungen')} />
    </>
  );
}
