import type { OffenePunkte, TechnischeAnforderungen, Informationsquellen, Kundenanfragen, Aufgaben, Beurteilungen, RueckfragenUndKommunikation, Entscheidungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';

export interface OffenePunkteDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: OffenePunkte;
  /** N:1-Ziel „TechnischeAnforderungen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  technischeAnforderungenList: TechnischeAnforderungen[];
  /** Reserviert — TechnischeAnforderungen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenTechnischeAnforderungen?: (record: TechnischeAnforderungen) => void;
  /** N:1-Ziel „Informationsquellen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  informationsquellenList: Informationsquellen[];
  /** Reserviert — Informationsquellen ist hier nur über ein Mehrfach-Feld verknüpft (Text-Join, keine Einzel-Relation); Übergabe erlaubt, aber ohne Wirkung. */
  onOpenInformationsquellen?: (record: Informationsquellen) => void;
  /** N:1-Ziel „Kundenanfragen": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  kundenanfragenList: Kundenanfragen[];
  /** Klick auf die Kundenanfragen-Relation → overlay.push auf dessen Detail. */
  onOpenKundenanfragen?: (record: Kundenanfragen) => void;
  /** 1:N „Aufgaben" (offener_punkt): VOLLE Liste — der Block filtert auf diesen Record. */
  aufgabenList: Aufgaben[];
  /** Zeilen-Klick → overlay.push auf das Aufgaben-Detail (nie der Edit-Dialog). */
  onOpenAufgaben: (record: Aufgaben) => void;
  /** Kontextuelles „+": öffnet den Aufgaben-Dialog mit diesem Record vorgesetzt. */
  onAddAufgaben?: () => void;
  /** 1:N „Beurteilungen" (betroffene_offene_punkte): VOLLE Liste — der Block filtert auf diesen Record. */
  beurteilungenList: Beurteilungen[];
  /** Zeilen-Klick → overlay.push auf das Beurteilungen-Detail (nie der Edit-Dialog). */
  onOpenBeurteilungen: (record: Beurteilungen) => void;
  /** Kontextuelles „+": öffnet den Beurteilungen-Dialog mit diesem Record vorgesetzt. */
  onAddBeurteilungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Beurteilungen-Datensatz. */
  onPickBeurteilungen?: () => void;
  /** 1:N „Rückfragen und Kommunikation" (zugehoerige_offene_punkte): VOLLE Liste — der Block filtert auf diesen Record. */
  rueckfragenUndKommunikationList: RueckfragenUndKommunikation[];
  /** Zeilen-Klick → overlay.push auf das RueckfragenUndKommunikation-Detail (nie der Edit-Dialog). */
  onOpenRueckfragenUndKommunikation: (record: RueckfragenUndKommunikation) => void;
  /** Kontextuelles „+": öffnet den RueckfragenUndKommunikation-Dialog mit diesem Record vorgesetzt. */
  onAddRueckfragenUndKommunikation?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden RueckfragenUndKommunikation-Datensatz. */
  onPickRueckfragenUndKommunikation?: () => void;
  /** 1:N „Entscheidungen" (betroffene_offene_punkte): VOLLE Liste — der Block filtert auf diesen Record. */
  entscheidungenList: Entscheidungen[];
  /** Zeilen-Klick → overlay.push auf das Entscheidungen-Detail (nie der Edit-Dialog). */
  onOpenEntscheidungen: (record: Entscheidungen) => void;
  /** Kontextuelles „+": öffnet den Entscheidungen-Dialog mit diesem Record vorgesetzt. */
  onAddEntscheidungen?: () => void;
  /** „Vorhandene wählen": Listenfeld-Rückbezug — hängt diesen Record an einen bestehenden Entscheidungen-Datensatz. */
  onPickEntscheidungen?: () => void;
}

export function OffenePunkteDetails({
  record,
  technischeAnforderungenList,
  informationsquellenList,
  kundenanfragenList,
  onOpenKundenanfragen,
  aufgabenList,
  onOpenAufgaben,
  onAddAufgaben,
  beurteilungenList,
  onOpenBeurteilungen,
  onAddBeurteilungen,
  onPickBeurteilungen,
  rueckfragenUndKommunikationList,
  onOpenRueckfragenUndKommunikation,
  onAddRueckfragenUndKommunikation,
  onPickRueckfragenUndKommunikation,
  entscheidungenList,
  onOpenEntscheidungen,
  onAddEntscheidungen,
  onPickEntscheidungen,
}: OffenePunkteDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const anfrageTarget = kundenanfragenList.find(r => r.record_id === extractRecordId(record.fields.anfrage));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('offene_punkte', 'betroffene_anforderungen')} value={Array.isArray(record.fields.betroffene_anforderungen) ? record.fields.betroffene_anforderungen.map((u: unknown) => technischeAnforderungenList.find(t => t.record_id === extractRecordId(u))?.fields.bezeichnung ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('offene_punkte', 'betroffene_quellen')} value={Array.isArray(record.fields.betroffene_quellen) ? record.fields.betroffene_quellen.map((u: unknown) => informationsquellenList.find(t => t.record_id === extractRecordId(u))?.fields.titel ?? '—').join(', ') : null} format="text" />
        <RecordField label={fieldLabel('offene_punkte', 'kurztitel')} value={record.fields.kurztitel} format="text" />
        <RecordField label={fieldLabel('offene_punkte', 'beschreibung')} value={record.fields.beschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('offene_punkte', 'punktetyp')} value={record.fields.punktetyp} format="pill" />
        <RecordField label={fieldLabel('offene_punkte', 'prioritaet')} value={record.fields.prioritaet} format="pill" />
        <RecordField label={fieldLabel('offene_punkte', 'auswirkung')} value={record.fields.auswirkung} format="pill" />
        <RecordField label={fieldLabel('offene_punkte', 'zustaendige_rolle')} value={record.fields.zustaendige_rolle} format="text" />
        <RecordField label={fieldLabel('offene_punkte', 'verantwortlicher_vorname')} value={record.fields.verantwortlicher_vorname} format="text" />
        <RecordField label={fieldLabel('offene_punkte', 'verantwortlicher_nachname')} value={record.fields.verantwortlicher_nachname} format="text" />
        <RecordField label={fieldLabel('offene_punkte', 'faellig_am')} value={record.fields.faellig_am} format="date" />
        <RecordField label={fieldLabel('offene_punkte', 'status')} value={record.fields.status} format="pill" />
        <RecordField label={fieldLabel('offene_punkte', 'erledigungskriterium')} value={record.fields.erledigungskriterium} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('offene_punkte', 'loesung_oder_ergebnis')} value={record.fields.loesung_oder_ergebnis} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('offene_punkte', 'antwort_geprueft')} value={record.fields.antwort_geprueft} format="bool" />
        <RecordField label={fieldLabel('offene_punkte', 'abgeschlossen_am')} value={record.fields.abgeschlossen_am} format="datetime" />
        <RecordField label={fieldLabel('offene_punkte', 'abschluss_durch')} value={record.fields.abschluss_durch} format="text" />
        <RecordField label={fieldLabel('offene_punkte', 'erneute_pruefung')} value={record.fields.erneute_pruefung} format="bool" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('offene_punkte', 'anfrage')}
          name={anfrageTarget?.fields.anfragenummer ?? '—'}
          meta={[anfrageTarget?.fields.kontakt_email].filter(Boolean).join(' · ') || undefined}
          onClick={anfrageTarget && onOpenKundenanfragen ? () => onOpenKundenanfragen!(anfrageTarget!) : undefined}
        />
      </RecordSection>

      <SatelliteSection
        title={appLabel('aufgaben')}
        items={aufgabenList.filter(r => extractRecordId(r.fields.offener_punkt) === record.record_id)}
        map={r => ({ name: r.fields.titel ?? appLabel('aufgaben'), meta: r.fields.faellig_am })}
        onOpen={onOpenAufgaben}
        onAdd={onAddAufgaben}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('beurteilungen')}
        items={beurteilungenList.filter(r => Array.isArray(r.fields.betroffene_offene_punkte) && r.fields.betroffene_offene_punkte.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.beurteilungsgegenstand ?? appLabel('beurteilungen'), meta: r.fields.erstellt_am })}
        onOpen={onOpenBeurteilungen}
        onAdd={onAddBeurteilungen}
        onPick={onPickBeurteilungen}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('rueckfragen_und_kommunikation')}
        items={rueckfragenUndKommunikationList.filter(r => Array.isArray(r.fields.zugehoerige_offene_punkte) && r.fields.zugehoerige_offene_punkte.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.absender ?? appLabel('rueckfragen_und_kommunikation'), meta: r.fields.versanddatum })}
        onOpen={onOpenRueckfragenUndKommunikation}
        onAdd={onAddRueckfragenUndKommunikation}
        onPick={onPickRueckfragenUndKommunikation}
        getKey={r => r.record_id}
      />

      <SatelliteSection
        title={appLabel('entscheidungen')}
        items={entscheidungenList.filter(r => Array.isArray(r.fields.betroffene_offene_punkte) && r.fields.betroffene_offene_punkte.some((u: unknown) => extractRecordId(u) === record.record_id))}
        map={r => ({ name: r.fields.titel ?? appLabel('entscheidungen'), meta: r.fields.entscheidungsdatum })}
        onOpen={onOpenEntscheidungen}
        onAdd={onAddEntscheidungen}
        onPick={onPickEntscheidungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.OFFENE_PUNKTE} recordId={record.record_id} readOnly={!perms.canWrite('offene_punkte')} />
    </>
  );
}
