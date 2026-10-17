import type { TechnischeAnforderungen, Kundenanfragen, Informationsquellen, OffenePunkte, Beurteilungen, Entscheidungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface TechnischeAnforderungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: TechnischeAnforderungen;
  /** N:1-Ziel „Kundenanfragen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenanfragenList: Kundenanfragen[];
  /** Klick auf die Kundenanfragen-Relation → overlay.push auf dessen Detail. */
  onOpenKundenanfragen?: (record: Kundenanfragen) => void;
  /** N:1-Ziel „Informationsquellen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  informationsquellenList: Informationsquellen[];
  /** Reserviert — Informationsquellen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenInformationsquellen?: (record: Informationsquellen) => void;
  /** 1:N „Offene Punkte" (betroffene_anforderungen): VOLLE Liste — der Block filtert auf diesen Record. */
  offenePunkteList: OffenePunkte[];
  /** Zeilen-Klick → overlay.push auf das OffenePunkte-Detail (nie der Edit-Dialog). */
  onOpenOffenePunkte: (record: OffenePunkte) => void;
  /** Kontextuelles „+": öffnet den OffenePunkte-Dialog mit diesem Record vorgesetzt. */
  onAddOffenePunkte?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden OffenePunkte-Datensatz. */
  onPickOffenePunkte?: () => void;
  /** 1:N „Beurteilungen" (betroffene_anforderungen): VOLLE Liste — der Block filtert auf diesen Record. */
  beurteilungenList: Beurteilungen[];
  /** Zeilen-Klick → overlay.push auf das Beurteilungen-Detail (nie der Edit-Dialog). */
  onOpenBeurteilungen: (record: Beurteilungen) => void;
  /** Kontextuelles „+": öffnet den Beurteilungen-Dialog mit diesem Record vorgesetzt. */
  onAddBeurteilungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Beurteilungen-Datensatz. */
  onPickBeurteilungen?: () => void;
  /** 1:N „Entscheidungen" (betroffene_anforderungen): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Entscheidungen-Datensatz. */
  onPickEntscheidungen?: () => void;
}

export function TechnischeAnforderungenDetails({
  record,
  kundenanfragenList,
  onOpenKundenanfragen,
  informationsquellenList,
  offenePunkteList,
  onOpenOffenePunkte,
  onAddOffenePunkte,
  onPickOffenePunkte,
  beurteilungenList,
  onOpenBeurteilungen,
  onAddBeurteilungen,
  onPickBeurteilungen,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
  onPickEntscheidungen,
}: TechnischeAnforderungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const anfrageTarget = kundenanfragenList.find(r => r.record_id === extractRecordId(record.fields.anfrage));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('technische_anforderungen', 'bezeichnung')} value={record.fields.bezeichnung} format="text" />
        <RecordField label={fieldLabel('technische_anforderungen', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('technische_anforderungen', 'anforderungstyp')} value={record.fields.anforderungstyp} format="pill" />
        <RecordField label={fieldLabel('technische_anforderungen', 'ursprung')} value={record.fields.ursprung} format="pill" />
        <RecordField label={fieldLabel('technische_anforderungen', 'sollwert')} value={record.fields.sollwert} format="text" />
        <RecordField label={fieldLabel('technische_anforderungen', 'einheit')} value={record.fields.einheit} format="text" />
        <RecordField label={fieldLabel('technische_anforderungen', 'vergleichsoperator')} value={record.fields.vergleichsoperator} format="pill" />
        <RecordField label={fieldLabel('technische_anforderungen', 'min_wert')} value={record.fields.min_wert} format="text" />
        <RecordField label={fieldLabel('technische_anforderungen', 'max_wert')} value={record.fields.max_wert} format="text" />
        <RecordField label={fieldLabel('technische_anforderungen', 'ist_pflichtanforderung')} value={record.fields.ist_pflichtanforderung} format="bool" />
        <RecordField label={fieldLabel('technische_anforderungen', 'pruefstatus')} value={record.fields.pruefstatus} format="pill" />
        <RecordField label={fieldLabel('technische_anforderungen', 'begruendung_pruefstatus')} value={record.fields.begruendung_pruefstatus} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('technische_anforderungen', 'verantwortlicher_vorname')} value={record.fields.verantwortlicher_vorname} format="text" />
        <RecordField label={fieldLabel('technische_anforderungen', 'verantwortlicher_nachname')} value={record.fields.verantwortlicher_nachname} format="text" />
        <RecordField label={fieldLabel('technische_anforderungen', 'gueltig_ab')} value={record.fields.gueltig_ab} format="date" />
        <RecordField label={fieldLabel('technische_anforderungen', 'gueltig_bis')} value={record.fields.gueltig_bis} format="date" />
        <RecordField label={fieldLabel('technische_anforderungen', 'erneute_pruefung')} value={record.fields.erneute_pruefung} format="bool" />
        <RecordField label={fieldLabel('technische_anforderungen', 'quellen')} value={Array.isArray(record.fields.quellen) ? record.fields.quellen.map((u: unknown) => informationsquellenList.find(t => t.record_id === extractRecordId(u))?.fields.titel ?? '—').join(', ') : null} format="text" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('technische_anforderungen', 'anfrage')}
          name={anfrageTarget?.fields.anfragenummer ?? '—'}
          meta={[anfrageTarget?.fields.kontakt_email].filter(Boolean).join(' · ') || undefined}
          onClick={anfrageTarget && onOpenKundenanfragen ? () => onOpenKundenanfragen!(anfrageTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('offene_punkte')}
        items={offenePunkteList.filter(r => Array.isArray(r.fields.betroffene_anforderungen) && r.fields.betroffene_anforderungen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.kurztitel ?? appLabel('offene_punkte'), meta: r.fields.faellig_am })}
        onOpen={onOpenOffenePunkte}
        onAdd={onAddOffenePunkte}
        onPick={onPickOffenePunkte}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('beurteilungen')}
        items={beurteilungenList.filter(r => Array.isArray(r.fields.betroffene_anforderungen) && r.fields.betroffene_anforderungen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.beurteilungsgegenstand ?? appLabel('beurteilungen'), meta: r.fields.erstellt_am })}
        onOpen={onOpenBeurteilungen}
        onAdd={onAddBeurteilungen}
        onPick={onPickBeurteilungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => Array.isArray(r.fields.betroffene_anforderungen) && r.fields.betroffene_anforderungen.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.titel ?? appLabel('entscheidungen'), meta: r.fields.entscheidungsdatum })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        onPick={onPickEntscheidungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.TECHNISCHE_ANFORDERUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('technische_anforderungen')} />
    </>
  );
}
