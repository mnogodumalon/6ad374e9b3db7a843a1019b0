import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { IconAlertTriangle, IconPlus, IconFlame, IconGavel, IconClipboardCheck } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { DashboardGrid } from '@/components/DashboardGrid';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { KanbanWidget, type KanbanCard } from '@/components/widgets/KanbanWidget';
import { LOOKUP_OPTIONS, lookupOption } from '@/types/app';
import type { OffenePunkte, Aufgaben, RueckfragenUndKommunikation, Kundenanfragen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { formatDate, lookupKey } from '@/lib/formatters';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import { tx, appLabel } from '@/i18n';

const person = (v?: string, n?: string) => [v, n].filter(Boolean).join(' ');

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { setOffenePunkte, setAufgaben, setRueckfragenUndKommunikation, setKundenanfragen, fetchAll } = data;
  const clock = useClock();
  const today = format(clock, 'yyyy-MM-dd');
  const [onlyCritical, setOnlyCritical] = useState(false);

  // ---- shared write helpers (optimistic, undo) ----
  const advancePunkt = (rec: OffenePunkte, key: string) => {
    const prev = rec.fields.status;
    const next = lookupOption('offene_punkte', 'status', key);
    setOffenePunkte(list => list.map(r => r.record_id === rec.record_id ? { ...r, fields: { ...r.fields, status: next } } : r));
    LivingAppsService.updateOffenePunkteEntry(rec.record_id, { status: key } as any).catch(() => fetchAll());
    undoToast(tx`${rec.fields.kurztitel ?? ''} — ${next.label}`, () => {
      setOffenePunkte(list => list.map(r => r.record_id === rec.record_id ? { ...r, fields: { ...r.fields, status: prev } } : r));
      if (prev) LivingAppsService.updateOffenePunkteEntry(rec.record_id, { status: prev.key } as any).catch(() => fetchAll());
    });
  };

  const nextTaskStatus = (a: Aufgaben) => (lookupKey(a.fields.status) === 'offen' ? 'in_bearbeitung' : 'erledigt');
  const advanceTask = (rec: Aufgaben) => {
    const key = nextTaskStatus(rec);
    const prev = rec.fields.status;
    const prevDone = rec.fields.abgeschlossen_am;
    const next = lookupOption('aufgaben', 'status', key);
    const done = key === 'erledigt' ? today : undefined;
    setAufgaben(list => list.map(r => r.record_id === rec.record_id ? { ...r, fields: { ...r.fields, status: next, abgeschlossen_am: done ?? r.fields.abgeschlossen_am } } : r));
    LivingAppsService.updateAufgabenEntry(rec.record_id, { status: key, ...(done ? { abgeschlossen_am: done } : {}) } as any).catch(() => fetchAll());
    undoToast(tx`${rec.fields.titel ?? ''} — ${next.label}`, () => {
      setAufgaben(list => list.map(r => r.record_id === rec.record_id ? { ...r, fields: { ...r.fields, status: prev, abgeschlossen_am: prevDone } } : r));
      if (prev) LivingAppsService.updateAufgabenEntry(rec.record_id, { status: prev.key, abgeschlossen_am: prevDone } as any).catch(() => fetchAll());
    });
  };

  const markAnswered = (rec: RueckfragenUndKommunikation) => {
    const prev = rec.fields.antwortstatus;
    const prevAt = rec.fields.antwort_erhalten_am;
    const next = lookupOption('rueckfragen_und_kommunikation', 'antwortstatus', 'beantwortet');
    setRueckfragenUndKommunikation(list => list.map(r => r.record_id === rec.record_id ? { ...r, fields: { ...r.fields, antwortstatus: next, antwort_erhalten_am: today } } : r));
    LivingAppsService.updateRueckfragenUndKommunikationEntry(rec.record_id, { antwortstatus: 'beantwortet', antwort_erhalten_am: today } as any).catch(() => fetchAll());
    undoToast(tx`${rec.fields.betreff ?? ''} — Antwort eingegangen (noch zu prüfen)`, () => {
      setRueckfragenUndKommunikation(list => list.map(r => r.record_id === rec.record_id ? { ...r, fields: { ...r.fields, antwortstatus: prev, antwort_erhalten_am: prevAt } } : r));
      if (prev) LivingAppsService.updateRueckfragenUndKommunikationEntry(rec.record_id, { antwortstatus: prev.key, antwort_erhalten_am: prevAt } as any).catch(() => fetchAll());
    });
  };

  const takeOver = (rec: Kundenanfragen) => {
    const prev = rec.fields.status;
    const next = lookupOption('kundenanfragen', 'status', 'in_pruefung');
    setKundenanfragen(list => list.map(r => r.record_id === rec.record_id ? { ...r, fields: { ...r.fields, status: next } } : r));
    LivingAppsService.updateKundenanfragenEntry(rec.record_id, { status: 'in_pruefung' } as any).catch(() => fetchAll());
    undoToast(tx`${rec.fields.anfragenummer ?? ''} — in Prüfung`, () => {
      setKundenanfragen(list => list.map(r => r.record_id === rec.record_id ? { ...r, fields: { ...r.fields, status: prev } } : r));
      if (prev) LivingAppsService.updateKundenanfragenEntry(rec.record_id, { status: prev.key } as any).catch(() => fetchAll());
    });
  };

  const crud = useEntityCrud(data, {
    footer: (top) => {
      if (top.type === 'offenePunkte') {
        const k = lookupKey(top.record.fields.status);
        if (k === 'neu' || k === 'zugewiesen') return { label: tx('In Bearbeitung nehmen'), onClick: () => advancePunkt(top.record, 'in_bearbeitung') };
        return undefined;
      }
      if (top.type === 'aufgaben') {
        const k = lookupKey(top.record.fields.status);
        if (k === 'erledigt' || k === 'abgebrochen') return undefined;
        return { label: k === 'offen' ? tx('Starten') : tx('Als erledigt markieren'), onClick: () => advanceTask(top.record) };
      }
      if (top.type === 'kundenanfragen' && lookupKey(top.record.fields.status) === 'neu') {
        return { label: tx('Anfrage übernehmen'), onClick: () => takeOver(top.record) };
      }
      return undefined;
    },
  });

  const anfragen = crud.enriched.kundenanfragen;
  const punkte = crud.enriched.offenePunkte;
  const aufgabenE = crud.enriched.aufgaben;
  const komm = crud.enriched.rueckfragenUndKommunikation;
  const entsch = crud.enriched.entscheidungen;

  const CLOSED_PUNKT = ['erledigt', 'entschieden_akzeptiert', 'nicht_mehr_relevant'];
  const isOpenPunkt = (p: OffenePunkte) => !CLOSED_PUNKT.includes(lookupKey(p.fields.status) ?? 'neu');

  const neueAnfragen = useMemo(() => anfragen.filter(a => lookupKey(a.fields.status) === 'neu'), [anfragen]);
  const kritisch = useMemo(() => punkte.filter(p => isOpenPunkt(p) && lookupKey(p.fields.prioritaet) === 'kritisch'), [punkte]);
  const ueberfaellig = useMemo(
    () => aufgabenE
      .filter(a => !['erledigt', 'abgebrochen'].includes(lookupKey(a.fields.status) ?? 'offen') && a.fields.faellig_am && a.fields.faellig_am.slice(0, 10) < today)
      .sort((a, b) => (a.fields.faellig_am ?? '').localeCompare(b.fields.faellig_am ?? '')),
    [aufgabenE, today],
  );
  const ausstehend = useMemo(
    () => komm
      .filter(k => lookupKey(k.fields.versandstatus) === 'versendet' && ['offen', 'teilweise_beantwortet', 'unklar', 'widerspruechlich'].includes(lookupKey(k.fields.antwortstatus) ?? 'offen'))
      .sort((a, b) => (a.fields.antwort_erwartet_bis ?? '9999').localeCompare(b.fields.antwort_erwartet_bis ?? '9999')),
    [komm],
  );
  const offeneEntsch = useMemo(() => entsch.filter(e => ['vorbereitung', 'zur_entscheidung'].includes(lookupKey(e.fields.entscheidungsstatus) ?? 'vorbereitung')), [entsch]);
  const zurFreigabe = useMemo(() => anfragen.filter(a => lookupKey(a.fields.status) === 'technisch_geklaert'), [anfragen]);

  // ---- board ----
  const columns = (LOOKUP_OPTIONS['offene_punkte']?.status ?? []).map(o => ({ key: o.key, label: o.label }));
  const boardPunkte = punkte.filter(p => !onlyCritical || lookupKey(p.fields.prioritaet) === 'kritisch');
  const cards: KanbanCard[] = boardPunkte
    .slice()
    .sort((a, b) => (a.fields.faellig_am ?? '9999').localeCompare(b.fields.faellig_am ?? '9999'))
    .map(p => {
      const prio = lookupKey(p.fields.prioritaet);
      const who = person(p.fields.verantwortlicher_vorname, p.fields.verantwortlicher_nachname);
      const bits = [
        p.fields.prioritaet?.label,
        who || tx('Ohne Verantwortliche/n'),
        p.fields.faellig_am ? formatDate(p.fields.faellig_am) : null,
        p.betroffene_anforderungenName || null,
      ].filter(Boolean);
      return {
        id: p.record_id,
        column: lookupKey(p.fields.status) ?? 'neu',
        title: p.fields.kurztitel ?? p.anfrageName,
        subtitle: bits.join(' · '),
        tone: prio === 'kritisch' ? 'destructive' : prio === 'hoch' ? 'warning' : 'default',
      };
    });

  const onCardMove = (id: string, col: string) => {
    const rec = punkte.find(p => p.record_id === id);
    if (!rec) return;
    if (col === 'erledigt' && !rec.fields.loesung_oder_ergebnis) {
      return tx('Zum Abschließen bitte zuerst Lösung/Ergebnis im Detail dokumentieren.');
    }
    if (col === 'entschieden_akzeptiert' && lookupKey(rec.fields.prioritaet) === 'kritisch' && !rec.fields.loesung_oder_ergebnis) {
      return tx('Kritische Punkte brauchen eine dokumentierte Entscheidung und Begründung.');
    }
    advancePunkt(rec, col);
  };

  const first = ueberfaellig[0];
  const context = (() => {
    if (first) return tx`${gruss(clock)} Überfällig: ${namen(ueberfaellig.map(a => a.fields.titel ?? ''))}.`;
    if (kritisch.length > 0) return tx`${gruss(clock)} Kritisch offen: ${namen(kritisch.map(p => p.fields.kurztitel ?? ''))}.`;
    if (neueAnfragen.length > 0) return tx`${gruss(clock)} Neu eingegangen: ${namen(neueAnfragen.map(a => a.kundeName))}.`;
    if (ausstehend.length > 0) return tx`${gruss(clock)} Wir warten auf Antwort zu ${namen(ausstehend.map(k => k.fields.betreff ?? ''))}.`;
    return tx`${gruss(clock)} Alles im Griff — keine dringenden Punkte.`;
  })();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold truncate">{tx('Arbeitsübersicht')}</h1>
          <p className="text-sm text-muted-foreground">{context}</p>
        </div>
        {crud.kundenanfragen.canWrite && (
          <button
            type="button"
            onClick={() => crud.kundenanfragen.openCreate({ status: 'neu' })}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            <IconPlus size={16} className="shrink-0" />
            {tx('Neue Anfrage')}
          </button>
        )}
      </div>

      <DashboardGrid
        variant="wide"
        hero={first ? (
          <HeroBanner
            icon={<IconAlertTriangle size={18} />}
            action={{ label: nextTaskStatus(first) === 'erledigt' ? tx('Als erledigt markieren') : tx('Starten'), onClick: () => advanceTask(first) }}
          >
            {ueberfaellig.length === 1
              ? tx`Überfällige Aufgabe: ${first.fields.titel ?? ''} — fällig war ${formatDate(first.fields.faellig_am)} (${first.anfrageName}).`
              : tx`${ueberfaellig.length} Aufgaben überfällig, zuerst: ${first.fields.titel ?? ''} — fällig war ${formatDate(first.fields.faellig_am)} (${first.anfrageName}).`}
          </HeroBanner>
        ) : undefined}
        kpis={(
          <StatStrip>
            <StatStripItem
              title={tx('Kritische Punkte')}
              value={kritisch.length}
              icon={<IconFlame size={16} />}
              tone={kritisch.length > 0 ? 'warning' : 'default'}
              onClick={() => setOnlyCritical(v => !v)}
              active={onlyCritical}
            />
            <StatStripItem title={tx('Offene Entscheidungen')} value={offeneEntsch.length} icon={<IconGavel size={16} />} />
            <StatStripItem title={tx('Zur Freigabe bereit')} value={zurFreigabe.length} icon={<IconClipboardCheck size={16} />} tone={zurFreigabe.length > 0 ? 'success' : 'default'} />
          </StatStrip>
        )}
        primary={(
          <KanbanWidget
            columns={columns}
            cards={cards}
            defaultCollapsed={['erledigt', 'entschieden_akzeptiert', 'nicht_mehr_relevant']}
            onCardClick={c => {
              const rec = data.offenePunkte.find(p => p.record_id === c.id);
              if (rec) crud.offenePunkte.openDetail(rec);
            }}
            onCardMove={onCardMove}
            onAddCard={crud.offenePunkte.canWrite ? (col) => crud.offenePunkte.openCreate({ status: col }) : undefined}
          />
        )}
        aside={(
          <>
            <WorkList
              title={tx('Neu eingegangene Anfragen')}
              items={neueAnfragen.map(a => ({
                id: a.record_id,
                title: a.kundeName || a.fields.anfragenummer || appLabel('kundenanfragen'),
                secondLine: <span className="text-muted-foreground">{[a.fields.anfragenummer, a.fields.produktfamilie, a.fields.eingangsdatum ? formatDate(a.fields.eingangsdatum) : null].filter(Boolean).join(' · ')}</span>,
                action: { label: tx('Übernehmen'), onClick: () => takeOver(a) },
              }))}
              onItemClick={id => { const r = data.kundenanfragen.find(x => x.record_id === id); if (r) crud.kundenanfragen.openDetail(r); }}
              empty={{ text: tx('Keine neuen Anfragen.'), action: crud.kundenanfragen.canWrite ? { label: tx('Anfrage aufnehmen'), onClick: () => crud.kundenanfragen.openCreate({ status: 'neu' }) } : undefined }}
            />
            <WorkList
              title={tx('Ausstehende Kundenantworten')}
              items={ausstehend.map(k => {
                const late = k.fields.antwort_erwartet_bis && k.fields.antwort_erwartet_bis.slice(0, 10) < today;
                return {
                  id: k.record_id,
                  title: k.fields.betreff ?? k.anfrageName,
                  secondLine: (
                    <>
                      <span className={late ? 'font-medium text-destructive' : 'font-medium text-amber-600'}>{k.fields.antwortstatus?.label ?? tx('Offen')}</span>
                      <span className="text-muted-foreground"> · {k.fields.empfaenger ?? ''}{k.fields.antwort_erwartet_bis ? ` · ${formatDate(k.fields.antwort_erwartet_bis)}` : ''}</span>
                    </>
                  ),
                  action: { label: tx('Antwort eingegangen'), onClick: () => markAnswered(k) },
                };
              })}
              onItemClick={id => { const r = data.rueckfragenUndKommunikation.find(x => x.record_id === id); if (r) crud.rueckfragenUndKommunikation.openDetail(r); }}
              empty={{ text: tx('Keine Antworten ausstehend.') }}
            />
            <WorkList
              title={tx('Offene Entscheidungen')}
              items={offeneEntsch.map(e => ({
                id: e.record_id,
                title: e.fields.titel ?? e.anfrageName,
                secondLine: (
                  <>
                    <span className="font-medium text-amber-600">{e.fields.entscheidungsstatus?.label ?? tx('Vorbereitung')}</span>
                    <span className="text-muted-foreground"> · {e.anfrageName}</span>
                  </>
                ),
              }))}
              onItemClick={id => { const r = data.entscheidungen.find(x => x.record_id === id); if (r) crud.entscheidungen.openDetail(r); }}
              empty={{ text: tx('Keine Entscheidung offen.') }}
            />
          </>
        )}
      />
      {crud.surfaces}
    </div>
  );
}
