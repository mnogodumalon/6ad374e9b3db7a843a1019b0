import type { Aufgaben, Beurteilungen, Entscheidungen, Erfahrungen, Informationsquellen, Kundenanfragen, OffenePunkte, RueckfragenUndKommunikation, Statusprotokoll, TechnischeAnforderungen, TechnischerAbschluss, WiederverwendungVonErfahrungen } from './app';

export type EnrichedKundenanfragen = Kundenanfragen & {
  kundeName: string;
};

export type EnrichedTechnischerAbschluss = TechnischerAbschluss & {
  anfrageName: string;
};

export type EnrichedStatusprotokoll = Statusprotokoll & {
  anfrageName: string;
};

export type EnrichedInformationsquellen = Informationsquellen & {
  ersetzt_quelleName: string;
  anfrageName: string;
};

export type EnrichedTechnischeAnforderungen = TechnischeAnforderungen & {
  anfrageName: string;
  quellenName: string;
};

export type EnrichedOffenePunkte = OffenePunkte & {
  betroffene_anforderungenName: string;
  betroffene_quellenName: string;
  anfrageName: string;
};

export type EnrichedAufgaben = Aufgaben & {
  anfrageName: string;
  offener_punktName: string;
  abhaengige_aufgabenName: string;
};

export type EnrichedBeurteilungen = Beurteilungen & {
  betroffene_anforderungenName: string;
  betroffene_offene_punkteName: string;
  zugrunde_liegende_quellenName: string;
  anfrageName: string;
};

export type EnrichedRueckfragenUndKommunikation = RueckfragenUndKommunikation & {
  zugehoerige_offene_punkteName: string;
  beantwortet_nachrichtName: string;
  quelleName: string;
  anfrageName: string;
};

export type EnrichedEntscheidungen = Entscheidungen & {
  betroffene_anforderungenName: string;
  betroffene_offene_punkteName: string;
  zugrunde_liegende_beurteilungenName: string;
  ersetzt_durch_entscheidungName: string;
  anfrageName: string;
};

export type EnrichedErfahrungen = Erfahrungen & {
  belegquellenName: string;
  belegbeurteilungenName: string;
  belegentscheidungenName: string;
  ursprungsanfrageName: string;
  belegabschlussName: string;
};

export type EnrichedWiederverwendungVonErfahrungen = WiederverwendungVonErfahrungen & {
  erfahrungName: string;
  ziel_anfrageName: string;
};
