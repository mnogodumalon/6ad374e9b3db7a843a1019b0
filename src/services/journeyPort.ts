/**
 * The INTERNAL door of the journey port — authenticated, via LivingAppsService.
 * GENERATED: one lister and one creator per entity. Do not edit.
 *
 *   import { servicePort } from '@/services/journeyPort';
 *
 * Intent pages hand this to `useJourneySubmit` and to shared step blocks. It
 * exposes only list · create · ref — the public subset — so a step written
 * against it also runs on a public page. Undo, edit and delete stay on the
 * page itself (LivingAppsService), never inside a shared step.
 */
import { LivingAppsService, createRecordUrl, type RecordQuery } from '@/services/livingAppsService';
import { toWirePayload, type InternalJourneyPort, type JourneyRecord } from '@/lib/journey/port';
import { buildSearchFilter, byIdFilter, combineFilters } from '@/lib/journey/search';
import type { EntityKey } from '@/lib/journey/rules';

type RawRecord = { record_id: string; fields: Record<string, unknown>; createdat?: string | null };
type RawMutation = { record_id: string; fields?: Record<string, unknown>; created_at?: string | null };

const listers: Record<EntityKey, () => Promise<RawRecord[]>> = {
  'kunden': () => LivingAppsService.getKunden() as Promise<RawRecord[]>,
  'kundenanfragen': () => LivingAppsService.getKundenanfragen() as Promise<RawRecord[]>,
  'technischer_abschluss': () => LivingAppsService.getTechnischerAbschluss() as Promise<RawRecord[]>,
  'statusprotokoll': () => LivingAppsService.getStatusprotokoll() as Promise<RawRecord[]>,
  'informationsquellen': () => LivingAppsService.getInformationsquellen() as Promise<RawRecord[]>,
  'technische_anforderungen': () => LivingAppsService.getTechnischeAnforderungen() as Promise<RawRecord[]>,
  'offene_punkte': () => LivingAppsService.getOffenePunkte() as Promise<RawRecord[]>,
  'aufgaben': () => LivingAppsService.getAufgaben() as Promise<RawRecord[]>,
  'beurteilungen': () => LivingAppsService.getBeurteilungen() as Promise<RawRecord[]>,
  'rueckfragen_und_kommunikation': () => LivingAppsService.getRueckfragenUndKommunikation() as Promise<RawRecord[]>,
  'entscheidungen': () => LivingAppsService.getEntscheidungen() as Promise<RawRecord[]>,
  'erfahrungen': () => LivingAppsService.getErfahrungen() as Promise<RawRecord[]>,
  'wiederverwendung_von_erfahrungen': () => LivingAppsService.getWiederverwendungVonErfahrungen() as Promise<RawRecord[]>,
};

/** The query/count half — the REST parameters the plain listers never send. */
const queriers: Record<EntityKey, (q: RecordQuery) => Promise<RawRecord[]>> = {
  'kunden': q => LivingAppsService.queryKunden(q) as Promise<RawRecord[]>,
  'kundenanfragen': q => LivingAppsService.queryKundenanfragen(q) as Promise<RawRecord[]>,
  'technischer_abschluss': q => LivingAppsService.queryTechnischerAbschluss(q) as Promise<RawRecord[]>,
  'statusprotokoll': q => LivingAppsService.queryStatusprotokoll(q) as Promise<RawRecord[]>,
  'informationsquellen': q => LivingAppsService.queryInformationsquellen(q) as Promise<RawRecord[]>,
  'technische_anforderungen': q => LivingAppsService.queryTechnischeAnforderungen(q) as Promise<RawRecord[]>,
  'offene_punkte': q => LivingAppsService.queryOffenePunkte(q) as Promise<RawRecord[]>,
  'aufgaben': q => LivingAppsService.queryAufgaben(q) as Promise<RawRecord[]>,
  'beurteilungen': q => LivingAppsService.queryBeurteilungen(q) as Promise<RawRecord[]>,
  'rueckfragen_und_kommunikation': q => LivingAppsService.queryRueckfragenUndKommunikation(q) as Promise<RawRecord[]>,
  'entscheidungen': q => LivingAppsService.queryEntscheidungen(q) as Promise<RawRecord[]>,
  'erfahrungen': q => LivingAppsService.queryErfahrungen(q) as Promise<RawRecord[]>,
  'wiederverwendung_von_erfahrungen': q => LivingAppsService.queryWiederverwendungVonErfahrungen(q) as Promise<RawRecord[]>,
};

const counters: Record<EntityKey, (filter?: string, signal?: AbortSignal) => Promise<number>> = {
  'kunden': (filter, signal) => LivingAppsService.countKunden(filter, signal),
  'kundenanfragen': (filter, signal) => LivingAppsService.countKundenanfragen(filter, signal),
  'technischer_abschluss': (filter, signal) => LivingAppsService.countTechnischerAbschluss(filter, signal),
  'statusprotokoll': (filter, signal) => LivingAppsService.countStatusprotokoll(filter, signal),
  'informationsquellen': (filter, signal) => LivingAppsService.countInformationsquellen(filter, signal),
  'technische_anforderungen': (filter, signal) => LivingAppsService.countTechnischeAnforderungen(filter, signal),
  'offene_punkte': (filter, signal) => LivingAppsService.countOffenePunkte(filter, signal),
  'aufgaben': (filter, signal) => LivingAppsService.countAufgaben(filter, signal),
  'beurteilungen': (filter, signal) => LivingAppsService.countBeurteilungen(filter, signal),
  'rueckfragen_und_kommunikation': (filter, signal) => LivingAppsService.countRueckfragenUndKommunikation(filter, signal),
  'entscheidungen': (filter, signal) => LivingAppsService.countEntscheidungen(filter, signal),
  'erfahrungen': (filter, signal) => LivingAppsService.countErfahrungen(filter, signal),
  'wiederverwendung_von_erfahrungen': (filter, signal) => LivingAppsService.countWiederverwendungVonErfahrungen(filter, signal),
};

const creators: Record<EntityKey, (fields: Record<string, unknown>) => Promise<RawMutation>> = {
  'kunden': fields => LivingAppsService.createKundenEntry(fields as never),
  'kundenanfragen': fields => LivingAppsService.createKundenanfragenEntry(fields as never),
  'technischer_abschluss': fields => LivingAppsService.createTechnischerAbschlus(fields as never),
  'statusprotokoll': fields => LivingAppsService.createStatusprotokollEntry(fields as never),
  'informationsquellen': fields => LivingAppsService.createInformationsquellenEntry(fields as never),
  'technische_anforderungen': fields => LivingAppsService.createTechnischeAnforderungenEntry(fields as never),
  'offene_punkte': fields => LivingAppsService.createOffenePunkteEntry(fields as never),
  'aufgaben': fields => LivingAppsService.createAufgabenEntry(fields as never),
  'beurteilungen': fields => LivingAppsService.createBeurteilungenEntry(fields as never),
  'rueckfragen_und_kommunikation': fields => LivingAppsService.createRueckfragenUndKommunikationEntry(fields as never),
  'entscheidungen': fields => LivingAppsService.createEntscheidungenEntry(fields as never),
  'erfahrungen': fields => LivingAppsService.createErfahrungenEntry(fields as never),
  'wiederverwendung_von_erfahrungen': fields => LivingAppsService.createWiederverwendungVonErfahrungenEntry(fields as never),
};

const updaters: Record<EntityKey, (id: string, fields: Record<string, unknown>) => Promise<RawMutation>> = {
  'kunden': (id, fields) => LivingAppsService.updateKundenEntry(id, fields as never),
  'kundenanfragen': (id, fields) => LivingAppsService.updateKundenanfragenEntry(id, fields as never),
  'technischer_abschluss': (id, fields) => LivingAppsService.updateTechnischerAbschlus(id, fields as never),
  'statusprotokoll': (id, fields) => LivingAppsService.updateStatusprotokollEntry(id, fields as never),
  'informationsquellen': (id, fields) => LivingAppsService.updateInformationsquellenEntry(id, fields as never),
  'technische_anforderungen': (id, fields) => LivingAppsService.updateTechnischeAnforderungenEntry(id, fields as never),
  'offene_punkte': (id, fields) => LivingAppsService.updateOffenePunkteEntry(id, fields as never),
  'aufgaben': (id, fields) => LivingAppsService.updateAufgabenEntry(id, fields as never),
  'beurteilungen': (id, fields) => LivingAppsService.updateBeurteilungenEntry(id, fields as never),
  'rueckfragen_und_kommunikation': (id, fields) => LivingAppsService.updateRueckfragenUndKommunikationEntry(id, fields as never),
  'entscheidungen': (id, fields) => LivingAppsService.updateEntscheidungenEntry(id, fields as never),
  'erfahrungen': (id, fields) => LivingAppsService.updateErfahrungenEntry(id, fields as never),
  'wiederverwendung_von_erfahrungen': (id, fields) => LivingAppsService.updateWiederverwendungVonErfahrungenEntry(id, fields as never),
};

function toJourneyRecord(r: RawRecord): JourneyRecord {
  return { id: r.record_id, fields: r.fields ?? {}, createdAt: r.createdat ?? null };
}

export const servicePort: InternalJourneyPort = {
  door: 'internal',
  async list(entity, opts) {
    // Only a bare list(entity) (or an empty options object) takes the historic
    // load-everything path. ANY explicit option — `limit` included — goes to the
    // server: useRecordSearch's first page of a big entity must not pull the
    // whole table (live 2026-09-02: all 263 employees travelled for a limit-50
    // first page because `limit` alone did not count as a query).
    const usesQuery = !!opts && (opts.search !== undefined || opts.offset !== undefined
      || opts.orderby !== undefined || opts.fields !== undefined || opts.signal !== undefined
      || opts.limit !== undefined || opts.filter !== undefined);
    if (!usesQuery) {
      const rows = await listers[entity]();
      const limited = opts?.limit ? rows.slice(0, opts.limit) : rows;
      return limited.map(toJourneyRecord);
    }
    const filter = combineFilters(opts.filter, opts.search ? buildSearchFilter(opts.search.query, opts.search.fields) : undefined);
    const rows = await queriers[entity]({
      filter, orderby: opts.orderby, limit: opts.limit, offset: opts.offset, fields: opts.fields, signal: opts.signal,
    });
    return rows.map(toJourneyRecord);
  },
  async count(entity, opts) {
    const filter = combineFilters(opts?.filter, opts?.search ? buildSearchFilter(opts.search.query, opts.search.fields) : undefined);
    return counters[entity](filter, opts?.signal);
  },
  async get(entity, id) {
    // One query on the server, not the whole table: `r.id` is the vSQL name
    // of the record id (a live page wrote `r.record_id` and got a 400).
    const rows = await queriers[entity]({ filter: byIdFilter(id), limit: 1 });
    return rows[0] ? toJourneyRecord(rows[0]) : null;
  },
  async create(entity, values) {
    const r = await creators[entity](toWirePayload(entity, values, servicePort));
    return { id: r.record_id, fields: r.fields ?? {}, createdAt: r.created_at ?? null };
  },
  // The same payload rules as create — plain ids in, references shaped here.
  async update(entity, id, values) {
    const r = await updaters[entity](id, toWirePayload(entity, values, servicePort));
    return { id: r.record_id || id, fields: r.fields ?? {}, createdAt: r.created_at ?? null };
  },
  ref: (appId, recordId) => createRecordUrl(appId, recordId),
};
