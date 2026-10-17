import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Kunden, Kundenanfragen, TechnischerAbschluss, Statusprotokoll, Informationsquellen, TechnischeAnforderungen, OffenePunkte, Aufgaben, Beurteilungen, RueckfragenUndKommunikation, Entscheidungen, Erfahrungen, WiederverwendungVonErfahrungen } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { t } from '@/i18n';

/** Dashboard data + the OPTIMISTIC-WRITE API.
 *
 *  The per-entity setters (`set<Entity>`) are exported for exactly one job:
 *  optimistic updates on drag writes (onEventDrop / onEventResize /
 *  onCardMove). Call the setter FIRST — the bar/card lands instantly — then
 *  fire the PATCH in the background and call `fetchAll()` ONLY in the catch.
 *  Never await the PATCH before updating state (the UI freezes for the full
 *  round-trip on every drag) and never refetch after a successful write.
 *  There is no other mechanism (no `__optimistic`, no `mutate`).
 */
/** Entities this hook can load — the same keys the journey layer uses. */
export type DashboardEntity = 'kunden' | 'kundenanfragen' | 'technischer_abschluss' | 'statusprotokoll' | 'informationsquellen' | 'technische_anforderungen' | 'offene_punkte' | 'aufgaben' | 'beurteilungen' | 'rueckfragen_und_kommunikation' | 'entscheidungen' | 'erfahrungen' | 'wiederverwendung_von_erfahrungen';

export interface DashboardDataOptions {
  /** Entities this page does NOT need (picked through useRecordSearch instead).
   *  Every flow page mounts this hook on its own route, so without `omit` a
   *  page that searches 3.000 guests server-side would still pull all 3.000
   *  through the side door. */
  omit?: DashboardEntity[];
}

export function useDashboardData(options: DashboardDataOptions = {}) {
  // A string key, not the array: an inline `omit={['gaeste']}` is a new array
  // on every render and would restart the fetch forever.
  const omitKey = (options.omit ?? []).slice().sort().join('|');
  const [kunden, setKunden] = useState<Kunden[]>([]);
  const [kundenanfragen, setKundenanfragen] = useState<Kundenanfragen[]>([]);
  const [technischerAbschluss, setTechnischerAbschluss] = useState<TechnischerAbschluss[]>([]);
  const [statusprotokoll, setStatusprotokoll] = useState<Statusprotokoll[]>([]);
  const [informationsquellen, setInformationsquellen] = useState<Informationsquellen[]>([]);
  const [technischeAnforderungen, setTechnischeAnforderungen] = useState<TechnischeAnforderungen[]>([]);
  const [offenePunkte, setOffenePunkte] = useState<OffenePunkte[]>([]);
  const [aufgaben, setAufgaben] = useState<Aufgaben[]>([]);
  const [beurteilungen, setBeurteilungen] = useState<Beurteilungen[]>([]);
  const [rueckfragenUndKommunikation, setRueckfragenUndKommunikation] = useState<RueckfragenUndKommunikation[]>([]);
  const [entscheidungen, setEntscheidungen] = useState<Entscheidungen[]>([]);
  const [erfahrungen, setErfahrungen] = useState<Erfahrungen[]>([]);
  const [wiederverwendungVonErfahrungen, setWiederverwendungVonErfahrungen] = useState<WiederverwendungVonErfahrungen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  /** Lists the signed-in user may not read (403 on the platform). They load as
   *  empty and the rest of the page loads normally — one forbidden list used to
   *  empty the whole dashboard (05.10.2026). Hide a block whose list is here. */
  const [forbidden, setForbidden] = useState<DashboardEntity[]>([]);

  // Every list on its own: a 403 is „not yours“, any other failure is an error.
  const settle = useCallback((settled: PromiseSettledResult<unknown>[]) => {
    const denied: DashboardEntity[] = [];
    let failure: unknown = null;
    // null = this list failed for another reason: its current data stays
    const pick = <T,>(i: number, key: DashboardEntity): T[] | null => {
      const s = settled[i];
      if (s.status === 'fulfilled') return s.value as T[];
      if ((s.reason as { status?: number } | null)?.status === 403) { denied.push(key); return []; }
      failure = failure ?? s.reason;
      return null;
    };
    { const rows = pick<Kunden>(0, 'kunden'); if (rows) setKunden(rows); }
    { const rows = pick<Kundenanfragen>(1, 'kundenanfragen'); if (rows) setKundenanfragen(rows); }
    { const rows = pick<TechnischerAbschluss>(2, 'technischer_abschluss'); if (rows) setTechnischerAbschluss(rows); }
    { const rows = pick<Statusprotokoll>(3, 'statusprotokoll'); if (rows) setStatusprotokoll(rows); }
    { const rows = pick<Informationsquellen>(4, 'informationsquellen'); if (rows) setInformationsquellen(rows); }
    { const rows = pick<TechnischeAnforderungen>(5, 'technische_anforderungen'); if (rows) setTechnischeAnforderungen(rows); }
    { const rows = pick<OffenePunkte>(6, 'offene_punkte'); if (rows) setOffenePunkte(rows); }
    { const rows = pick<Aufgaben>(7, 'aufgaben'); if (rows) setAufgaben(rows); }
    { const rows = pick<Beurteilungen>(8, 'beurteilungen'); if (rows) setBeurteilungen(rows); }
    { const rows = pick<RueckfragenUndKommunikation>(9, 'rueckfragen_und_kommunikation'); if (rows) setRueckfragenUndKommunikation(rows); }
    { const rows = pick<Entscheidungen>(10, 'entscheidungen'); if (rows) setEntscheidungen(rows); }
    { const rows = pick<Erfahrungen>(11, 'erfahrungen'); if (rows) setErfahrungen(rows); }
    { const rows = pick<WiederverwendungVonErfahrungen>(12, 'wiederverwendung_von_erfahrungen'); if (rows) setWiederverwendungVonErfahrungen(rows); }
    setForbidden(prev => (prev.join('|') === denied.join('|') ? prev : denied));
    return failure;
  }, []);

  const fetchAll = useCallback(async () => {
    setError(null);
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    try {
      const failure = settle(await Promise.allSettled([
        omit.has('kunden') ? Promise.resolve([] as Kunden[]) : LivingAppsService.getKunden(),
        omit.has('kundenanfragen') ? Promise.resolve([] as Kundenanfragen[]) : LivingAppsService.getKundenanfragen(),
        omit.has('technischer_abschluss') ? Promise.resolve([] as TechnischerAbschluss[]) : LivingAppsService.getTechnischerAbschluss(),
        omit.has('statusprotokoll') ? Promise.resolve([] as Statusprotokoll[]) : LivingAppsService.getStatusprotokoll(),
        omit.has('informationsquellen') ? Promise.resolve([] as Informationsquellen[]) : LivingAppsService.getInformationsquellen(),
        omit.has('technische_anforderungen') ? Promise.resolve([] as TechnischeAnforderungen[]) : LivingAppsService.getTechnischeAnforderungen(),
        omit.has('offene_punkte') ? Promise.resolve([] as OffenePunkte[]) : LivingAppsService.getOffenePunkte(),
        omit.has('aufgaben') ? Promise.resolve([] as Aufgaben[]) : LivingAppsService.getAufgaben(),
        omit.has('beurteilungen') ? Promise.resolve([] as Beurteilungen[]) : LivingAppsService.getBeurteilungen(),
        omit.has('rueckfragen_und_kommunikation') ? Promise.resolve([] as RueckfragenUndKommunikation[]) : LivingAppsService.getRueckfragenUndKommunikation(),
        omit.has('entscheidungen') ? Promise.resolve([] as Entscheidungen[]) : LivingAppsService.getEntscheidungen(),
        omit.has('erfahrungen') ? Promise.resolve([] as Erfahrungen[]) : LivingAppsService.getErfahrungen(),
        omit.has('wiederverwendung_von_erfahrungen') ? Promise.resolve([] as WiederverwendungVonErfahrungen[]) : LivingAppsService.getWiederverwendungVonErfahrungen(),
      ]));
      if (failure) throw failure;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(t('data_load_failed')));
    } finally {
      setLoading(false);
    }
  }, [omitKey, settle]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Silent background refresh (no loading state change → no flicker)
  useEffect(() => {
    const omit = new Set(omitKey ? omitKey.split('|') : []);
    async function silentRefresh() {
      try {
        // a failed list keeps its stale data out of the way: settle() only
        // replaces what loaded or was refused
        settle(await Promise.allSettled([
          omit.has('kunden') ? Promise.resolve([] as Kunden[]) : LivingAppsService.getKunden(),
          omit.has('kundenanfragen') ? Promise.resolve([] as Kundenanfragen[]) : LivingAppsService.getKundenanfragen(),
          omit.has('technischer_abschluss') ? Promise.resolve([] as TechnischerAbschluss[]) : LivingAppsService.getTechnischerAbschluss(),
          omit.has('statusprotokoll') ? Promise.resolve([] as Statusprotokoll[]) : LivingAppsService.getStatusprotokoll(),
          omit.has('informationsquellen') ? Promise.resolve([] as Informationsquellen[]) : LivingAppsService.getInformationsquellen(),
          omit.has('technische_anforderungen') ? Promise.resolve([] as TechnischeAnforderungen[]) : LivingAppsService.getTechnischeAnforderungen(),
          omit.has('offene_punkte') ? Promise.resolve([] as OffenePunkte[]) : LivingAppsService.getOffenePunkte(),
          omit.has('aufgaben') ? Promise.resolve([] as Aufgaben[]) : LivingAppsService.getAufgaben(),
          omit.has('beurteilungen') ? Promise.resolve([] as Beurteilungen[]) : LivingAppsService.getBeurteilungen(),
          omit.has('rueckfragen_und_kommunikation') ? Promise.resolve([] as RueckfragenUndKommunikation[]) : LivingAppsService.getRueckfragenUndKommunikation(),
          omit.has('entscheidungen') ? Promise.resolve([] as Entscheidungen[]) : LivingAppsService.getEntscheidungen(),
          omit.has('erfahrungen') ? Promise.resolve([] as Erfahrungen[]) : LivingAppsService.getErfahrungen(),
          omit.has('wiederverwendung_von_erfahrungen') ? Promise.resolve([] as WiederverwendungVonErfahrungen[]) : LivingAppsService.getWiederverwendungVonErfahrungen(),
        ]));
      } catch {
        // silently ignore — stale data is better than no data
      }
    }
    function handleRefresh() { void silentRefresh(); }
    // assistant:data-changed comes from the assistant (<la-klar-assistant>)
    // after every mutation. The element additionally fires the legacy
    // dashboard-refresh event for OLD deployed bundles — do NOT subscribe to
    // both here, or every mutation fetches twice.
    window.addEventListener('assistant:data-changed', handleRefresh);
    return () => window.removeEventListener('assistant:data-changed', handleRefresh);
  }, [omitKey, settle]);

  const kundenMap = useMemo(() => {
    const m = new Map<string, Kunden>();
    kunden.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kunden]);

  const kundenanfragenMap = useMemo(() => {
    const m = new Map<string, Kundenanfragen>();
    kundenanfragen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [kundenanfragen]);

  const technischerAbschlussMap = useMemo(() => {
    const m = new Map<string, TechnischerAbschluss>();
    technischerAbschluss.forEach(r => m.set(r.record_id, r));
    return m;
  }, [technischerAbschluss]);

  const informationsquellenMap = useMemo(() => {
    const m = new Map<string, Informationsquellen>();
    informationsquellen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [informationsquellen]);

  const technischeAnforderungenMap = useMemo(() => {
    const m = new Map<string, TechnischeAnforderungen>();
    technischeAnforderungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [technischeAnforderungen]);

  const offenePunkteMap = useMemo(() => {
    const m = new Map<string, OffenePunkte>();
    offenePunkte.forEach(r => m.set(r.record_id, r));
    return m;
  }, [offenePunkte]);

  const aufgabenMap = useMemo(() => {
    const m = new Map<string, Aufgaben>();
    aufgaben.forEach(r => m.set(r.record_id, r));
    return m;
  }, [aufgaben]);

  const beurteilungenMap = useMemo(() => {
    const m = new Map<string, Beurteilungen>();
    beurteilungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [beurteilungen]);

  const rueckfragenUndKommunikationMap = useMemo(() => {
    const m = new Map<string, RueckfragenUndKommunikation>();
    rueckfragenUndKommunikation.forEach(r => m.set(r.record_id, r));
    return m;
  }, [rueckfragenUndKommunikation]);

  const entscheidungenMap = useMemo(() => {
    const m = new Map<string, Entscheidungen>();
    entscheidungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [entscheidungen]);

  const erfahrungenMap = useMemo(() => {
    const m = new Map<string, Erfahrungen>();
    erfahrungen.forEach(r => m.set(r.record_id, r));
    return m;
  }, [erfahrungen]);

  return { kunden, setKunden, kundenanfragen, setKundenanfragen, technischerAbschluss, setTechnischerAbschluss, statusprotokoll, setStatusprotokoll, informationsquellen, setInformationsquellen, technischeAnforderungen, setTechnischeAnforderungen, offenePunkte, setOffenePunkte, aufgaben, setAufgaben, beurteilungen, setBeurteilungen, rueckfragenUndKommunikation, setRueckfragenUndKommunikation, entscheidungen, setEntscheidungen, erfahrungen, setErfahrungen, wiederverwendungVonErfahrungen, setWiederverwendungVonErfahrungen, loading, error, fetchAll, forbidden, kundenMap, kundenanfragenMap, technischerAbschlussMap, informationsquellenMap, technischeAnforderungenMap, offenePunkteMap, aufgabenMap, beurteilungenMap, rueckfragenUndKommunikationMap, entscheidungenMap, erfahrungenMap };
}

/** The hook's return — the `data` prop of DashboardOverview in the Ready-Wrapper form. */
export type DashboardData = ReturnType<typeof useDashboardData>;