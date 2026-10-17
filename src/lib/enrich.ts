import type { EnrichedAufgaben, EnrichedBeurteilungen, EnrichedEntscheidungen, EnrichedErfahrungen, EnrichedInformationsquellen, EnrichedKundenanfragen, EnrichedOffenePunkte, EnrichedRueckfragenUndKommunikation, EnrichedStatusprotokoll, EnrichedTechnischeAnforderungen, EnrichedTechnischerAbschluss, EnrichedWiederverwendungVonErfahrungen } from '@/types/enriched';
import type { Aufgaben, Beurteilungen, Entscheidungen, Erfahrungen, Informationsquellen, Kunden, Kundenanfragen, OffenePunkte, RueckfragenUndKommunikation, Statusprotokoll, TechnischeAnforderungen, TechnischerAbschluss, WiederverwendungVonErfahrungen } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface KundenanfragenMaps {
  kundenMap: Map<string, Kunden>;
}

export function enrichKundenanfragen(
  kundenanfragen: Kundenanfragen[],
  maps: KundenanfragenMaps
): EnrichedKundenanfragen[] {
  return kundenanfragen.map(r => ({
    ...r,
    kundeName: resolveDisplay(r.fields.kunde, maps.kundenMap, 'kundennummer'),
  }));
}

interface TechnischerAbschlussMaps {
  kundenanfragenMap: Map<string, Kundenanfragen>;
}

export function enrichTechnischerAbschluss(
  technischerAbschluss: TechnischerAbschluss[],
  maps: TechnischerAbschlussMaps
): EnrichedTechnischerAbschluss[] {
  return technischerAbschluss.map(r => ({
    ...r,
    anfrageName: resolveDisplay(r.fields.anfrage, maps.kundenanfragenMap, 'anfragenummer'),
  }));
}

interface StatusprotokollMaps {
  kundenanfragenMap: Map<string, Kundenanfragen>;
}

export function enrichStatusprotokoll(
  statusprotokoll: Statusprotokoll[],
  maps: StatusprotokollMaps
): EnrichedStatusprotokoll[] {
  return statusprotokoll.map(r => ({
    ...r,
    anfrageName: resolveDisplay(r.fields.anfrage, maps.kundenanfragenMap, 'anfragenummer'),
  }));
}

interface InformationsquellenMaps {
  informationsquellenMap: Map<string, Informationsquellen>;
  kundenanfragenMap: Map<string, Kundenanfragen>;
}

export function enrichInformationsquellen(
  informationsquellen: Informationsquellen[],
  maps: InformationsquellenMaps
): EnrichedInformationsquellen[] {
  return informationsquellen.map(r => ({
    ...r,
    ersetzt_quelleName: resolveDisplay(r.fields.ersetzt_quelle, maps.informationsquellenMap, 'titel'),
    anfrageName: resolveDisplay(r.fields.anfrage, maps.kundenanfragenMap, 'anfragenummer'),
  }));
}

interface TechnischeAnforderungenMaps {
  kundenanfragenMap: Map<string, Kundenanfragen>;
  informationsquellenMap: Map<string, Informationsquellen>;
}

export function enrichTechnischeAnforderungen(
  technischeAnforderungen: TechnischeAnforderungen[],
  maps: TechnischeAnforderungenMaps
): EnrichedTechnischeAnforderungen[] {
  return technischeAnforderungen.map(r => ({
    ...r,
    anfrageName: resolveDisplay(r.fields.anfrage, maps.kundenanfragenMap, 'anfragenummer'),
    quellenName: resolveDisplay(r.fields.quellen, maps.informationsquellenMap, 'titel'),
  }));
}

interface OffenePunkteMaps {
  technischeAnforderungenMap: Map<string, TechnischeAnforderungen>;
  informationsquellenMap: Map<string, Informationsquellen>;
  kundenanfragenMap: Map<string, Kundenanfragen>;
}

export function enrichOffenePunkte(
  offenePunkte: OffenePunkte[],
  maps: OffenePunkteMaps
): EnrichedOffenePunkte[] {
  return offenePunkte.map(r => ({
    ...r,
    betroffene_anforderungenName: resolveDisplay(r.fields.betroffene_anforderungen, maps.technischeAnforderungenMap, 'bezeichnung'),
    betroffene_quellenName: resolveDisplay(r.fields.betroffene_quellen, maps.informationsquellenMap, 'titel'),
    anfrageName: resolveDisplay(r.fields.anfrage, maps.kundenanfragenMap, 'anfragenummer'),
  }));
}

interface AufgabenMaps {
  kundenanfragenMap: Map<string, Kundenanfragen>;
  offenePunkteMap: Map<string, OffenePunkte>;
  aufgabenMap: Map<string, Aufgaben>;
}

export function enrichAufgaben(
  aufgaben: Aufgaben[],
  maps: AufgabenMaps
): EnrichedAufgaben[] {
  return aufgaben.map(r => ({
    ...r,
    anfrageName: resolveDisplay(r.fields.anfrage, maps.kundenanfragenMap, 'anfragenummer'),
    offener_punktName: resolveDisplay(r.fields.offener_punkt, maps.offenePunkteMap, 'kurztitel'),
    abhaengige_aufgabenName: resolveDisplay(r.fields.abhaengige_aufgaben, maps.aufgabenMap, 'titel'),
  }));
}

interface BeurteilungenMaps {
  technischeAnforderungenMap: Map<string, TechnischeAnforderungen>;
  offenePunkteMap: Map<string, OffenePunkte>;
  informationsquellenMap: Map<string, Informationsquellen>;
  kundenanfragenMap: Map<string, Kundenanfragen>;
}

export function enrichBeurteilungen(
  beurteilungen: Beurteilungen[],
  maps: BeurteilungenMaps
): EnrichedBeurteilungen[] {
  return beurteilungen.map(r => ({
    ...r,
    betroffene_anforderungenName: resolveDisplay(r.fields.betroffene_anforderungen, maps.technischeAnforderungenMap, 'bezeichnung'),
    betroffene_offene_punkteName: resolveDisplay(r.fields.betroffene_offene_punkte, maps.offenePunkteMap, 'kurztitel'),
    zugrunde_liegende_quellenName: resolveDisplay(r.fields.zugrunde_liegende_quellen, maps.informationsquellenMap, 'titel'),
    anfrageName: resolveDisplay(r.fields.anfrage, maps.kundenanfragenMap, 'anfragenummer'),
  }));
}

interface RueckfragenUndKommunikationMaps {
  offenePunkteMap: Map<string, OffenePunkte>;
  rueckfragenUndKommunikationMap: Map<string, RueckfragenUndKommunikation>;
  informationsquellenMap: Map<string, Informationsquellen>;
  kundenanfragenMap: Map<string, Kundenanfragen>;
}

export function enrichRueckfragenUndKommunikation(
  rueckfragenUndKommunikation: RueckfragenUndKommunikation[],
  maps: RueckfragenUndKommunikationMaps
): EnrichedRueckfragenUndKommunikation[] {
  return rueckfragenUndKommunikation.map(r => ({
    ...r,
    zugehoerige_offene_punkteName: resolveDisplay(r.fields.zugehoerige_offene_punkte, maps.offenePunkteMap, 'kurztitel'),
    beantwortet_nachrichtName: resolveDisplay(r.fields.beantwortet_nachricht, maps.rueckfragenUndKommunikationMap, 'absender'),
    quelleName: resolveDisplay(r.fields.quelle, maps.informationsquellenMap, 'titel'),
    anfrageName: resolveDisplay(r.fields.anfrage, maps.kundenanfragenMap, 'anfragenummer'),
  }));
}

interface EntscheidungenMaps {
  technischeAnforderungenMap: Map<string, TechnischeAnforderungen>;
  offenePunkteMap: Map<string, OffenePunkte>;
  beurteilungenMap: Map<string, Beurteilungen>;
  entscheidungenMap: Map<string, Entscheidungen>;
  kundenanfragenMap: Map<string, Kundenanfragen>;
}

export function enrichEntscheidungen(
  entscheidungen: Entscheidungen[],
  maps: EntscheidungenMaps
): EnrichedEntscheidungen[] {
  return entscheidungen.map(r => ({
    ...r,
    betroffene_anforderungenName: resolveDisplay(r.fields.betroffene_anforderungen, maps.technischeAnforderungenMap, 'bezeichnung'),
    betroffene_offene_punkteName: resolveDisplay(r.fields.betroffene_offene_punkte, maps.offenePunkteMap, 'kurztitel'),
    zugrunde_liegende_beurteilungenName: resolveDisplay(r.fields.zugrunde_liegende_beurteilungen, maps.beurteilungenMap, 'beurteilungsgegenstand'),
    ersetzt_durch_entscheidungName: resolveDisplay(r.fields.ersetzt_durch_entscheidung, maps.entscheidungenMap, 'titel'),
    anfrageName: resolveDisplay(r.fields.anfrage, maps.kundenanfragenMap, 'anfragenummer'),
  }));
}

interface ErfahrungenMaps {
  informationsquellenMap: Map<string, Informationsquellen>;
  beurteilungenMap: Map<string, Beurteilungen>;
  entscheidungenMap: Map<string, Entscheidungen>;
  kundenanfragenMap: Map<string, Kundenanfragen>;
  technischerAbschlussMap: Map<string, TechnischerAbschluss>;
}

export function enrichErfahrungen(
  erfahrungen: Erfahrungen[],
  maps: ErfahrungenMaps
): EnrichedErfahrungen[] {
  return erfahrungen.map(r => ({
    ...r,
    belegquellenName: resolveDisplay(r.fields.belegquellen, maps.informationsquellenMap, 'titel'),
    belegbeurteilungenName: resolveDisplay(r.fields.belegbeurteilungen, maps.beurteilungenMap, 'beurteilungsgegenstand'),
    belegentscheidungenName: resolveDisplay(r.fields.belegentscheidungen, maps.entscheidungenMap, 'titel'),
    ursprungsanfrageName: resolveDisplay(r.fields.ursprungsanfrage, maps.kundenanfragenMap, 'anfragenummer'),
    belegabschlussName: resolveDisplay(r.fields.belegabschluss, maps.technischerAbschlussMap, 'geprueft_von'),
  }));
}

interface WiederverwendungVonErfahrungenMaps {
  erfahrungenMap: Map<string, Erfahrungen>;
  kundenanfragenMap: Map<string, Kundenanfragen>;
}

export function enrichWiederverwendungVonErfahrungen(
  wiederverwendungVonErfahrungen: WiederverwendungVonErfahrungen[],
  maps: WiederverwendungVonErfahrungenMaps
): EnrichedWiederverwendungVonErfahrungen[] {
  return wiederverwendungVonErfahrungen.map(r => ({
    ...r,
    erfahrungName: resolveDisplay(r.fields.erfahrung, maps.erfahrungenMap, 'titel'),
    ziel_anfrageName: resolveDisplay(r.fields.ziel_anfrage, maps.kundenanfragenMap, 'anfragenummer'),
  }));
}
