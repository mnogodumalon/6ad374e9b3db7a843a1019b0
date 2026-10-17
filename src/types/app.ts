import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
/** A raw record URL (applookup reference). NEVER render this directly
 *  in JSX — it is a URL, not a display value. Show the enriched `*Name`
 *  field or resolve it via the entity map instead. Assignable to/from
 *  string everywhere; the `& {}` keeps the alias NAME visible in tsc
 *  error messages (a plain primitive alias gets normalized away). */
export type RecordUrl = string & {};
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Kunden {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    kundennummer?: string;
    firmenname?: string;
    ansprechpartner_vorname?: string;
    ansprechpartner_nachname?: string;
    e_mail?: string;
    telefon?: string;
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    branche?: string;
    interne_bemerkung?: string;
    aktiv?: boolean;
  };
}

export interface Kundenanfragen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    anfragenummer?: string;
    kunde?: RecordUrl; // applookup -> URL zu 'Kunden' Record
    eingangsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    eingangskanal?: LookupValue;
    kundenreferenz?: string;
    kontakt_vorname?: string;
    kontakt_nachname?: string;
    kontakt_email?: string;
    produktfamilie?: string;
    produktvariante?: string;
    gewuenschte_menge?: number;
    gewuenschter_liefertermin?: string; // Format: YYYY-MM-DD oder ISO String
    anfragebeschreibung?: string;
    urspruengliche_kundenanforderungen?: string;
    prioritaet?: LookupValue;
    verantwortlicher_vorname?: string;
    verantwortlicher_nachname?: string;
    status?: LookupValue;
    klaeraufwand?: LookupValue;
    zieltermin_klaerung?: string; // Format: YYYY-MM-DD oder ISO String
    vollstaendigkeit?: LookupValue;
    schaetzung_bearbeitung_min?: number;
    gemessen_bearbeitung_min?: number;
    wartezeit_kunde_min?: number;
    wartezeit_intern_min?: number;
    geklaert_am?: string; // Format: YYYY-MM-DD oder ISO String
    anzahl_nachtraegliche_aenderungen?: number;
    anzahl_nacharbeiten?: number;
  };
}

export interface TechnischerAbschluss {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    anfrage?: RecordUrl; // applookup -> URL zu 'Kundenanfragen' Record
    pruefdatum?: string; // Format: YYYY-MM-DD oder ISO String
    geprueft_von?: string;
    anforderungen_geprueft?: boolean;
    kritische_punkte_geklaert?: boolean;
    entscheidungen_vorhanden?: boolean;
    freigaben_vorhanden?: boolean;
    verbleibende_abweichungen?: string;
    verbleibende_risiken?: string;
    offene_restpunkte?: string;
    uebergabeempfaenger?: string;
    uebergabestatus?: LookupValue;
    uebergabedatum?: string; // Format: YYYY-MM-DD oder ISO String
    zusammenfassung?: string;
    freigabestatus?: LookupValue;
  };
}

export interface Statusprotokoll {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    anfrage?: RecordUrl; // applookup -> URL zu 'Kundenanfragen' Record
    objekttyp?: LookupValue;
    objektbezeichnung?: string;
    alter_status?: string;
    neuer_status?: string;
    zeitpunkt?: string; // Format: YYYY-MM-DD oder ISO String
    benutzer_vorname?: string;
    benutzer_nachname?: string;
    begruendung?: string;
  };
}

export interface Informationsquellen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    eingangszeitpunkt?: string; // Format: YYYY-MM-DD oder ISO String
    versionskennung?: string;
    quellenstatus?: LookupValue;
    zusammenfassung?: string;
    extraktionsstatus?: LookupValue;
    pruefung_durch?: string;
    pruefung_am?: string; // Format: YYYY-MM-DD oder ISO String
    erneute_pruefung?: boolean;
    bemerkung?: string;
    ersetzt_quelle?: RecordUrl; // applookup -> URL zu 'Informationsquellen' Record
    anfrage?: RecordUrl; // applookup -> URL zu 'Kundenanfragen' Record
    quellentyp?: LookupValue;
    titel?: string;
    datei?: string;
    referenz_url?: string;
    urheber?: string;
    quellendatum?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface TechnischeAnforderungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    anfrage?: RecordUrl; // applookup -> URL zu 'Kundenanfragen' Record
    bezeichnung?: string;
    beschreibung?: string;
    anforderungstyp?: LookupValue;
    ursprung?: LookupValue;
    sollwert?: string;
    einheit?: string;
    vergleichsoperator?: LookupValue;
    min_wert?: number;
    max_wert?: number;
    ist_pflichtanforderung?: boolean;
    pruefstatus?: LookupValue;
    begruendung_pruefstatus?: string;
    verantwortlicher_vorname?: string;
    verantwortlicher_nachname?: string;
    gueltig_ab?: string; // Format: YYYY-MM-DD oder ISO String
    gueltig_bis?: string; // Format: YYYY-MM-DD oder ISO String
    erneute_pruefung?: boolean;
    quellen?: RecordUrl[];
  };
}

export interface OffenePunkte {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    betroffene_anforderungen?: RecordUrl[];
    betroffene_quellen?: RecordUrl[];
    anfrage?: RecordUrl; // applookup -> URL zu 'Kundenanfragen' Record
    kurztitel?: string;
    beschreibung?: string;
    punktetyp?: LookupValue;
    prioritaet?: LookupValue;
    auswirkung?: LookupValue;
    zustaendige_rolle?: string;
    verantwortlicher_vorname?: string;
    verantwortlicher_nachname?: string;
    faellig_am?: string; // Format: YYYY-MM-DD oder ISO String
    status?: LookupValue;
    erledigungskriterium?: string;
    loesung_oder_ergebnis?: string;
    antwort_geprueft?: boolean;
    abgeschlossen_am?: string; // Format: YYYY-MM-DD oder ISO String
    abschluss_durch?: string;
    erneute_pruefung?: boolean;
  };
}

export interface Aufgaben {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    anfrage?: RecordUrl; // applookup -> URL zu 'Kundenanfragen' Record
    titel?: string;
    beschreibung?: string;
    aufgabentyp?: LookupValue;
    verantwortlicher_vorname?: string;
    verantwortlicher_nachname?: string;
    mitwirkende?: string;
    prioritaet?: LookupValue;
    status?: LookupValue;
    faellig_am?: string; // Format: YYYY-MM-DD oder ISO String
    blockierungsgrund?: string;
    ergebnis?: string;
    abgeschlossen_am?: string; // Format: YYYY-MM-DD oder ISO String
    offener_punkt?: RecordUrl; // applookup -> URL zu 'OffenePunkte' Record
    abhaengige_aufgaben?: RecordUrl[];
  };
}

export interface Beurteilungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    betroffene_anforderungen?: RecordUrl[];
    betroffene_offene_punkte?: RecordUrl[];
    zugrunde_liegende_quellen?: RecordUrl[];
    anfrage?: RecordUrl; // applookup -> URL zu 'Kundenanfragen' Record
    beurteilungsgegenstand?: string;
    beurteilungsart?: LookupValue;
    einschaetzung?: LookupValue;
    fachliche_begruendung?: string;
    annahmen?: string;
    unsicherheiten?: string;
    alternativen?: string;
    empfehlung?: string;
    ist_ki_vorschlag?: boolean;
    erstellt_von?: string;
    erstellt_am?: string; // Format: YYYY-MM-DD oder ISO String
    pruefstatus?: LookupValue;
    geprueft_von?: string;
    geprueft_am?: string; // Format: YYYY-MM-DD oder ISO String
    erneute_pruefung?: boolean;
  };
}

export interface RueckfragenUndKommunikation {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    zugehoerige_offene_punkte?: RecordUrl[];
    beantwortet_nachricht?: RecordUrl; // applookup -> URL zu 'RueckfragenUndKommunikation' Record
    quelle?: RecordUrl; // applookup -> URL zu 'Informationsquellen' Record
    anfrage?: RecordUrl; // applookup -> URL zu 'Kundenanfragen' Record
    kommunikationstyp?: LookupValue;
    kanal?: LookupValue;
    absender?: string;
    empfaenger?: string;
    betreff?: string;
    inhalt?: string;
    versandstatus?: LookupValue;
    versanddatum?: string; // Format: YYYY-MM-DD oder ISO String
    antwort_erwartet_bis?: string; // Format: YYYY-MM-DD oder ISO String
    antwort_erhalten_am?: string; // Format: YYYY-MM-DD oder ISO String
    antwortstatus?: LookupValue;
    folgeaufgabe_noetig?: boolean;
    notizen?: string;
  };
}

export interface Entscheidungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    betroffene_anforderungen?: RecordUrl[];
    betroffene_offene_punkte?: RecordUrl[];
    zugrunde_liegende_beurteilungen?: RecordUrl[];
    ersetzt_durch_entscheidung?: RecordUrl; // applookup -> URL zu 'Entscheidungen' Record
    anfrage?: RecordUrl; // applookup -> URL zu 'Kundenanfragen' Record
    titel?: string;
    entscheidungsgegenstand?: string;
    entscheidungstyp?: LookupValue;
    alternativen?: string;
    entscheidung?: string;
    begruendung?: string;
    verantwortlicher_vorname?: string;
    verantwortlicher_nachname?: string;
    kompetenz_geprueft?: boolean;
    entscheidungsstatus?: LookupValue;
    entscheidungsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    auflagen?: string;
    gueltig_bis?: string; // Format: YYYY-MM-DD oder ISO String
    ergebnis?: string;
    erneute_pruefung?: boolean;
  };
}

export interface Erfahrungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    belegquellen?: RecordUrl[];
    belegbeurteilungen?: RecordUrl[];
    belegentscheidungen?: RecordUrl[];
    ursprungsanfrage?: RecordUrl; // applookup -> URL zu 'Kundenanfragen' Record
    titel?: string;
    sachverhalt?: string;
    erfahrungstyp?: LookupValue;
    produktfamilie?: string;
    anforderungstyp?: string;
    schlagwoerter?: string;
    urspruengliches_problem?: string;
    vorgehen?: string;
    beobachtetes_ergebnis?: string;
    erkenntnis?: string;
    belegabschluss?: RecordUrl; // applookup -> URL zu 'TechnischerAbschluss' Record
    gueltigkeitsbedingungen?: string;
    bekannte_grenzen?: string;
    risiko_uebertragung?: LookupValue;
    bestaetigungsstatus?: LookupValue;
    bestaetigt_von?: string;
    bestaetigt_am?: string; // Format: YYYY-MM-DD oder ISO String
    gueltig_ab?: string; // Format: YYYY-MM-DD oder ISO String
    gueltig_bis?: string; // Format: YYYY-MM-DD oder ISO String
    wiederverwendungsstatus?: LookupValue;
    kommentar_wiederverwendung?: string;
  };
}

export interface WiederverwendungVonErfahrungen {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    erfahrung?: RecordUrl; // applookup -> URL zu 'Erfahrungen' Record
    ziel_anfrage?: RecordUrl; // applookup -> URL zu 'Kundenanfragen' Record
    abrufdatum?: string; // Format: YYYY-MM-DD oder ISO String
    abrufgrund?: string;
    aehnlichkeit?: LookupValue;
    kontextunterschiede?: string;
    gueltigkeit_geprueft?: boolean;
    geprueft_von?: string;
    verwendungsergebnis?: LookupValue;
    begruendung?: string;
    beobachteter_nutzen?: string;
    ersparnis_schaetzung_min?: number;
    ersparnis_tatsaechlich_min?: number;
    negative_folgen?: string;
    bewertet_am?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export const APP_IDS = {
  KUNDEN: '6ad374a7cdbb4a3fe2285276',
  KUNDENANFRAGEN: '6ad374b293b05d5bdd839733',
  TECHNISCHER_ABSCHLUSS: '6ad374b25d969c5d67d858cc',
  STATUSPROTOKOLL: '6ad374b39b98474d0a011deb',
  INFORMATIONSQUELLEN: '6ad374b43a246ff1dc577854',
  TECHNISCHE_ANFORDERUNGEN: '6ad374b4503e0e7a068928e6',
  OFFENE_PUNKTE: '6ad374b5fae4dc99cafc4860',
  AUFGABEN: '6ad374b62868e9a196f28482',
  BEURTEILUNGEN: '6ad374b6f969ab660f88e8c6',
  RUECKFRAGEN_UND_KOMMUNIKATION: '6ad374b7af6615797f457a9b',
  ENTSCHEIDUNGEN: '6ad374b7aa0f039d0b5e988e',
  ERFAHRUNGEN: '6ad374b85eda691ec7e0f837',
  WIEDERVERWENDUNG_VON_ERFAHRUNGEN: '6ad374b99acb53d8968f5e09',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'kundenanfragen': {
    eingangskanal: [{ key: "email", get label() { return lookupLabel('kundenanfragen', 'eingangskanal', "email") ?? "E-Mail"; } }, { key: "webformular", get label() { return lookupLabel('kundenanfragen', 'eingangskanal', "webformular") ?? "Webformular"; } }, { key: "telefon", get label() { return lookupLabel('kundenanfragen', 'eingangskanal', "telefon") ?? "Telefon"; } }, { key: "persoenliches_gespraech", get label() { return lookupLabel('kundenanfragen', 'eingangskanal', "persoenliches_gespraech") ?? "Persönliches Gespräch"; } }, { key: "bestandskunde", get label() { return lookupLabel('kundenanfragen', 'eingangskanal', "bestandskunde") ?? "Bestandskunde"; } }, { key: "sonstiger_kanal", get label() { return lookupLabel('kundenanfragen', 'eingangskanal', "sonstiger_kanal") ?? "Sonstiger Kanal"; } }],
    prioritaet: [{ key: "niedrig", get label() { return lookupLabel('kundenanfragen', 'prioritaet', "niedrig") ?? "Niedrig"; } }, { key: "normal", get label() { return lookupLabel('kundenanfragen', 'prioritaet', "normal") ?? "Normal"; } }, { key: "hoch", get label() { return lookupLabel('kundenanfragen', 'prioritaet', "hoch") ?? "Hoch"; } }, { key: "kritisch", get label() { return lookupLabel('kundenanfragen', 'prioritaet', "kritisch") ?? "Kritisch"; } }],
    status: [{ key: "neu", get label() { return lookupLabel('kundenanfragen', 'status', "neu") ?? "Neu"; } }, { key: "in_pruefung", get label() { return lookupLabel('kundenanfragen', 'status', "in_pruefung") ?? "In Prüfung"; } }, { key: "rueckfragen_offen", get label() { return lookupLabel('kundenanfragen', 'status', "rueckfragen_offen") ?? "Rückfragen offen"; } }, { key: "fachliche_pruefung", get label() { return lookupLabel('kundenanfragen', 'status', "fachliche_pruefung") ?? "Fachliche Prüfung"; } }, { key: "entscheidungsbedarf", get label() { return lookupLabel('kundenanfragen', 'status', "entscheidungsbedarf") ?? "Entscheidungsbedarf"; } }, { key: "technisch_geklaert", get label() { return lookupLabel('kundenanfragen', 'status', "technisch_geklaert") ?? "Technisch geklärt"; } }, { key: "freigegeben", get label() { return lookupLabel('kundenanfragen', 'status', "freigegeben") ?? "Freigegeben"; } }, { key: "abgelehnt", get label() { return lookupLabel('kundenanfragen', 'status', "abgelehnt") ?? "Abgelehnt"; } }, { key: "zurueckgestellt", get label() { return lookupLabel('kundenanfragen', 'status', "zurueckgestellt") ?? "Zurückgestellt"; } }],
    klaeraufwand: [{ key: "klein", get label() { return lookupLabel('kundenanfragen', 'klaeraufwand', "klein") ?? "Klein"; } }, { key: "mittel", get label() { return lookupLabel('kundenanfragen', 'klaeraufwand', "mittel") ?? "Mittel"; } }, { key: "hoch", get label() { return lookupLabel('kundenanfragen', 'klaeraufwand', "hoch") ?? "Hoch"; } }, { key: "unbekannt", get label() { return lookupLabel('kundenanfragen', 'klaeraufwand', "unbekannt") ?? "Noch unbekannt"; } }],
    vollstaendigkeit: [{ key: "ungeprueft", get label() { return lookupLabel('kundenanfragen', 'vollstaendigkeit', "ungeprueft") ?? "Ungeprüft"; } }, { key: "unvollstaendig", get label() { return lookupLabel('kundenanfragen', 'vollstaendigkeit', "unvollstaendig") ?? "Unvollständig"; } }, { key: "in_klaerung", get label() { return lookupLabel('kundenanfragen', 'vollstaendigkeit', "in_klaerung") ?? "In Klärung"; } }, { key: "vollstaendig_geprueft", get label() { return lookupLabel('kundenanfragen', 'vollstaendigkeit', "vollstaendig_geprueft") ?? "Vollständig geprüft"; } }],
  },
  'technischer_abschluss': {
    uebergabestatus: [{ key: "nicht_vorbereitet", get label() { return lookupLabel('technischer_abschluss', 'uebergabestatus', "nicht_vorbereitet") ?? "Nicht vorbereitet"; } }, { key: "bereit", get label() { return lookupLabel('technischer_abschluss', 'uebergabestatus', "bereit") ?? "Bereit zur Übergabe"; } }, { key: "uebergeben", get label() { return lookupLabel('technischer_abschluss', 'uebergabestatus', "uebergeben") ?? "Übergeben"; } }, { key: "zurueckgewiesen", get label() { return lookupLabel('technischer_abschluss', 'uebergabestatus', "zurueckgewiesen") ?? "Zurückgewiesen"; } }],
    freigabestatus: [{ key: "nicht_freigegeben", get label() { return lookupLabel('technischer_abschluss', 'freigabestatus', "nicht_freigegeben") ?? "Nicht freigegeben"; } }, { key: "freigegeben", get label() { return lookupLabel('technischer_abschluss', 'freigabestatus', "freigegeben") ?? "Freigegeben"; } }, { key: "verweigert", get label() { return lookupLabel('technischer_abschluss', 'freigabestatus', "verweigert") ?? "Freigabe verweigert"; } }, { key: "zurueckgestellt", get label() { return lookupLabel('technischer_abschluss', 'freigabestatus', "zurueckgestellt") ?? "Zurückgestellt"; } }],
  },
  'statusprotokoll': {
    objekttyp: [{ key: "kundenanfrage", get label() { return lookupLabel('statusprotokoll', 'objekttyp', "kundenanfrage") ?? "Kundenanfrage"; } }, { key: "anforderung", get label() { return lookupLabel('statusprotokoll', 'objekttyp', "anforderung") ?? "Technische Anforderung"; } }, { key: "quelle", get label() { return lookupLabel('statusprotokoll', 'objekttyp', "quelle") ?? "Quelle"; } }, { key: "offener_punkt", get label() { return lookupLabel('statusprotokoll', 'objekttyp', "offener_punkt") ?? "Offener Punkt"; } }, { key: "aufgabe", get label() { return lookupLabel('statusprotokoll', 'objekttyp', "aufgabe") ?? "Aufgabe"; } }, { key: "beurteilung", get label() { return lookupLabel('statusprotokoll', 'objekttyp', "beurteilung") ?? "Beurteilung"; } }, { key: "kommunikation", get label() { return lookupLabel('statusprotokoll', 'objekttyp', "kommunikation") ?? "Kommunikation"; } }, { key: "entscheidung", get label() { return lookupLabel('statusprotokoll', 'objekttyp', "entscheidung") ?? "Entscheidung"; } }, { key: "abschluss", get label() { return lookupLabel('statusprotokoll', 'objekttyp', "abschluss") ?? "Abschluss"; } }, { key: "erfahrung", get label() { return lookupLabel('statusprotokoll', 'objekttyp', "erfahrung") ?? "Erfahrung"; } }],
  },
  'informationsquellen': {
    quellenstatus: [{ key: "aktuell", get label() { return lookupLabel('informationsquellen', 'quellenstatus', "aktuell") ?? "Aktuell"; } }, { key: "ersetzt", get label() { return lookupLabel('informationsquellen', 'quellenstatus', "ersetzt") ?? "Ersetzt"; } }, { key: "ungeprueft", get label() { return lookupLabel('informationsquellen', 'quellenstatus', "ungeprueft") ?? "Ungeprüft"; } }, { key: "strittig", get label() { return lookupLabel('informationsquellen', 'quellenstatus', "strittig") ?? "Strittig"; } }, { key: "ungueltig", get label() { return lookupLabel('informationsquellen', 'quellenstatus', "ungueltig") ?? "Ungültig"; } }],
    extraktionsstatus: [{ key: "nicht_verarbeitet", get label() { return lookupLabel('informationsquellen', 'extraktionsstatus', "nicht_verarbeitet") ?? "Nicht verarbeitet"; } }, { key: "in_bearbeitung", get label() { return lookupLabel('informationsquellen', 'extraktionsstatus', "in_bearbeitung") ?? "In Bearbeitung"; } }, { key: "extrahiert", get label() { return lookupLabel('informationsquellen', 'extraktionsstatus', "extrahiert") ?? "Extrahiert"; } }, { key: "manuell_geprueft", get label() { return lookupLabel('informationsquellen', 'extraktionsstatus', "manuell_geprueft") ?? "Manuell geprüft"; } }, { key: "fehler", get label() { return lookupLabel('informationsquellen', 'extraktionsstatus', "fehler") ?? "Fehler"; } }],
    quellentyp: [{ key: "email", get label() { return lookupLabel('informationsquellen', 'quellentyp', "email") ?? "E-Mail"; } }, { key: "pdf", get label() { return lookupLabel('informationsquellen', 'quellentyp', "pdf") ?? "PDF"; } }, { key: "office_dokument", get label() { return lookupLabel('informationsquellen', 'quellentyp', "office_dokument") ?? "Office-Dokument"; } }, { key: "bild", get label() { return lookupLabel('informationsquellen', 'quellentyp', "bild") ?? "Bild"; } }, { key: "zeichnung", get label() { return lookupLabel('informationsquellen', 'quellentyp', "zeichnung") ?? "Zeichnung"; } }, { key: "cad_dokument", get label() { return lookupLabel('informationsquellen', 'quellentyp', "cad_dokument") ?? "CAD-Dokument"; } }, { key: "webadresse", get label() { return lookupLabel('informationsquellen', 'quellentyp', "webadresse") ?? "Webadresse"; } }, { key: "gespraechsnotiz", get label() { return lookupLabel('informationsquellen', 'quellentyp', "gespraechsnotiz") ?? "Gesprächsnotiz"; } }, { key: "erp_datensatz", get label() { return lookupLabel('informationsquellen', 'quellentyp', "erp_datensatz") ?? "ERP-Datensatz"; } }, { key: "manuelle_eingabe", get label() { return lookupLabel('informationsquellen', 'quellentyp', "manuelle_eingabe") ?? "Manuelle Eingabe"; } }, { key: "sonstige_quelle", get label() { return lookupLabel('informationsquellen', 'quellentyp', "sonstige_quelle") ?? "Sonstige Quelle"; } }],
  },
  'technische_anforderungen': {
    anforderungstyp: [{ key: "abmessung", get label() { return lookupLabel('technische_anforderungen', 'anforderungstyp', "abmessung") ?? "Abmessung"; } }, { key: "material", get label() { return lookupLabel('technische_anforderungen', 'anforderungstyp', "material") ?? "Material"; } }, { key: "leistung", get label() { return lookupLabel('technische_anforderungen', 'anforderungstyp', "leistung") ?? "Leistung"; } }, { key: "funktion", get label() { return lookupLabel('technische_anforderungen', 'anforderungstyp', "funktion") ?? "Funktion"; } }, { key: "schnittstelle", get label() { return lookupLabel('technische_anforderungen', 'anforderungstyp', "schnittstelle") ?? "Schnittstelle"; } }, { key: "norm", get label() { return lookupLabel('technische_anforderungen', 'anforderungstyp', "norm") ?? "Norm"; } }, { key: "sicherheit", get label() { return lookupLabel('technische_anforderungen', 'anforderungstyp', "sicherheit") ?? "Sicherheit"; } }, { key: "umweltbedingung", get label() { return lookupLabel('technische_anforderungen', 'anforderungstyp', "umweltbedingung") ?? "Umweltbedingung"; } }, { key: "qualitaet", get label() { return lookupLabel('technische_anforderungen', 'anforderungstyp', "qualitaet") ?? "Qualität"; } }, { key: "liefertermin", get label() { return lookupLabel('technische_anforderungen', 'anforderungstyp', "liefertermin") ?? "Liefertermin"; } }, { key: "dokumentation", get label() { return lookupLabel('technische_anforderungen', 'anforderungstyp', "dokumentation") ?? "Dokumentation"; } }, { key: "sonstiges", get label() { return lookupLabel('technische_anforderungen', 'anforderungstyp', "sonstiges") ?? "Sonstiges"; } }],
    ursprung: [{ key: "kundenangabe", get label() { return lookupLabel('technische_anforderungen', 'ursprung', "kundenangabe") ?? "Explizite Kundenangabe"; } }, { key: "kundenunterlage", get label() { return lookupLabel('technische_anforderungen', 'ursprung', "kundenunterlage") ?? "Kundenunterlage"; } }, { key: "interne_vorgabe", get label() { return lookupLabel('technische_anforderungen', 'ursprung', "interne_vorgabe") ?? "Interne Vorgabe"; } }, { key: "technische_ableitung", get label() { return lookupLabel('technische_anforderungen', 'ursprung', "technische_ableitung") ?? "Technische Ableitung"; } }, { key: "erfahrungswissen", get label() { return lookupLabel('technische_anforderungen', 'ursprung', "erfahrungswissen") ?? "Erfahrungswissen"; } }, { key: "ki_vorschlag", get label() { return lookupLabel('technische_anforderungen', 'ursprung', "ki_vorschlag") ?? "KI-Vorschlag"; } }],
    vergleichsoperator: [{ key: "gleich", get label() { return lookupLabel('technische_anforderungen', 'vergleichsoperator', "gleich") ?? "Gleich"; } }, { key: "groesser", get label() { return lookupLabel('technische_anforderungen', 'vergleichsoperator', "groesser") ?? "Größer als"; } }, { key: "groesser_gleich", get label() { return lookupLabel('technische_anforderungen', 'vergleichsoperator', "groesser_gleich") ?? "Größer oder gleich"; } }, { key: "kleiner", get label() { return lookupLabel('technische_anforderungen', 'vergleichsoperator', "kleiner") ?? "Kleiner als"; } }, { key: "kleiner_gleich", get label() { return lookupLabel('technische_anforderungen', 'vergleichsoperator', "kleiner_gleich") ?? "Kleiner oder gleich"; } }, { key: "zwischen", get label() { return lookupLabel('technische_anforderungen', 'vergleichsoperator', "zwischen") ?? "Zwischen"; } }],
    pruefstatus: [{ key: "ungeprueft", get label() { return lookupLabel('technische_anforderungen', 'pruefstatus', "ungeprueft") ?? "Ungeprüft"; } }, { key: "zu_pruefen", get label() { return lookupLabel('technische_anforderungen', 'pruefstatus', "zu_pruefen") ?? "Zu prüfen"; } }, { key: "bestaetigt", get label() { return lookupLabel('technische_anforderungen', 'pruefstatus', "bestaetigt") ?? "Bestätigt"; } }, { key: "unklar", get label() { return lookupLabel('technische_anforderungen', 'pruefstatus', "unklar") ?? "Unklar"; } }, { key: "widerspruechlich", get label() { return lookupLabel('technische_anforderungen', 'pruefstatus', "widerspruechlich") ?? "Widersprüchlich"; } }, { key: "nicht_erfuellt", get label() { return lookupLabel('technische_anforderungen', 'pruefstatus', "nicht_erfuellt") ?? "Nicht erfüllt"; } }, { key: "nicht_anwendbar", get label() { return lookupLabel('technische_anforderungen', 'pruefstatus', "nicht_anwendbar") ?? "Nicht anwendbar"; } }],
  },
  'offene_punkte': {
    punktetyp: [{ key: "fehlende_information", get label() { return lookupLabel('offene_punkte', 'punktetyp', "fehlende_information") ?? "Fehlende Information"; } }, { key: "widerspruch", get label() { return lookupLabel('offene_punkte', 'punktetyp', "widerspruch") ?? "Widerspruch"; } }, { key: "technische_pruefung", get label() { return lookupLabel('offene_punkte', 'punktetyp', "technische_pruefung") ?? "Technische Prüfung"; } }, { key: "normenpruefung", get label() { return lookupLabel('offene_punkte', 'punktetyp', "normenpruefung") ?? "Normenprüfung"; } }, { key: "machbarkeit", get label() { return lookupLabel('offene_punkte', 'punktetyp', "machbarkeit") ?? "Machbarkeit"; } }, { key: "risiko", get label() { return lookupLabel('offene_punkte', 'punktetyp', "risiko") ?? "Risiko"; } }, { key: "rueckfrage", get label() { return lookupLabel('offene_punkte', 'punktetyp', "rueckfrage") ?? "Rückfrage"; } }, { key: "freigabe", get label() { return lookupLabel('offene_punkte', 'punktetyp', "freigabe") ?? "Freigabe"; } }, { key: "sonstiges", get label() { return lookupLabel('offene_punkte', 'punktetyp', "sonstiges") ?? "Sonstiges"; } }],
    prioritaet: [{ key: "niedrig", get label() { return lookupLabel('offene_punkte', 'prioritaet', "niedrig") ?? "Niedrig"; } }, { key: "normal", get label() { return lookupLabel('offene_punkte', 'prioritaet', "normal") ?? "Normal"; } }, { key: "hoch", get label() { return lookupLabel('offene_punkte', 'prioritaet', "hoch") ?? "Hoch"; } }, { key: "kritisch", get label() { return lookupLabel('offene_punkte', 'prioritaet', "kritisch") ?? "Kritisch"; } }],
    auswirkung: [{ key: "qualitaet", get label() { return lookupLabel('offene_punkte', 'auswirkung', "qualitaet") ?? "Qualität"; } }, { key: "sicherheit", get label() { return lookupLabel('offene_punkte', 'auswirkung', "sicherheit") ?? "Sicherheit"; } }, { key: "funktion", get label() { return lookupLabel('offene_punkte', 'auswirkung', "funktion") ?? "Funktion"; } }, { key: "kosten", get label() { return lookupLabel('offene_punkte', 'auswirkung', "kosten") ?? "Kosten"; } }, { key: "termin", get label() { return lookupLabel('offene_punkte', 'auswirkung', "termin") ?? "Termin"; } }, { key: "herstellbarkeit", get label() { return lookupLabel('offene_punkte', 'auswirkung', "herstellbarkeit") ?? "Herstellbarkeit"; } }, { key: "normenkonformitaet", get label() { return lookupLabel('offene_punkte', 'auswirkung', "normenkonformitaet") ?? "Normenkonformität"; } }, { key: "sonstiges", get label() { return lookupLabel('offene_punkte', 'auswirkung', "sonstiges") ?? "Sonstiges"; } }],
    status: [{ key: "neu", get label() { return lookupLabel('offene_punkte', 'status', "neu") ?? "Neu"; } }, { key: "zugewiesen", get label() { return lookupLabel('offene_punkte', 'status', "zugewiesen") ?? "Zugewiesen"; } }, { key: "in_bearbeitung", get label() { return lookupLabel('offene_punkte', 'status', "in_bearbeitung") ?? "In Bearbeitung"; } }, { key: "wartet_auf_kunde", get label() { return lookupLabel('offene_punkte', 'status', "wartet_auf_kunde") ?? "Wartet auf Kunde"; } }, { key: "wartet_intern", get label() { return lookupLabel('offene_punkte', 'status', "wartet_intern") ?? "Wartet intern"; } }, { key: "zur_entscheidung", get label() { return lookupLabel('offene_punkte', 'status', "zur_entscheidung") ?? "Zur Entscheidung"; } }, { key: "erledigt", get label() { return lookupLabel('offene_punkte', 'status', "erledigt") ?? "Erledigt"; } }, { key: "entschieden_akzeptiert", get label() { return lookupLabel('offene_punkte', 'status', "entschieden_akzeptiert") ?? "Entschieden akzeptiert"; } }, { key: "nicht_mehr_relevant", get label() { return lookupLabel('offene_punkte', 'status', "nicht_mehr_relevant") ?? "Nicht mehr relevant"; } }],
  },
  'aufgaben': {
    aufgabentyp: [{ key: "informationspruefung", get label() { return lookupLabel('aufgaben', 'aufgabentyp', "informationspruefung") ?? "Informationsprüfung"; } }, { key: "technische_bewertung", get label() { return lookupLabel('aufgaben', 'aufgabentyp', "technische_bewertung") ?? "Technische Bewertung"; } }, { key: "kundenrueckfrage", get label() { return lookupLabel('aufgaben', 'aufgabentyp', "kundenrueckfrage") ?? "Kundenrückfrage"; } }, { key: "interne_rueckfrage", get label() { return lookupLabel('aufgaben', 'aufgabentyp', "interne_rueckfrage") ?? "Interne Rückfrage"; } }, { key: "normenpruefung", get label() { return lookupLabel('aufgaben', 'aufgabentyp', "normenpruefung") ?? "Normenprüfung"; } }, { key: "machbarkeitspruefung", get label() { return lookupLabel('aufgaben', 'aufgabentyp', "machbarkeitspruefung") ?? "Machbarkeitsprüfung"; } }, { key: "dokumentation", get label() { return lookupLabel('aufgaben', 'aufgabentyp', "dokumentation") ?? "Dokumentation"; } }, { key: "entscheidung_vorbereiten", get label() { return lookupLabel('aufgaben', 'aufgabentyp', "entscheidung_vorbereiten") ?? "Entscheidung vorbereiten"; } }, { key: "freigabepruefung", get label() { return lookupLabel('aufgaben', 'aufgabentyp', "freigabepruefung") ?? "Freigabeprüfung"; } }, { key: "sonstiges", get label() { return lookupLabel('aufgaben', 'aufgabentyp', "sonstiges") ?? "Sonstiges"; } }],
    prioritaet: [{ key: "niedrig", get label() { return lookupLabel('aufgaben', 'prioritaet', "niedrig") ?? "Niedrig"; } }, { key: "normal", get label() { return lookupLabel('aufgaben', 'prioritaet', "normal") ?? "Normal"; } }, { key: "hoch", get label() { return lookupLabel('aufgaben', 'prioritaet', "hoch") ?? "Hoch"; } }, { key: "kritisch", get label() { return lookupLabel('aufgaben', 'prioritaet', "kritisch") ?? "Kritisch"; } }],
    status: [{ key: "offen", get label() { return lookupLabel('aufgaben', 'status', "offen") ?? "Offen"; } }, { key: "in_bearbeitung", get label() { return lookupLabel('aufgaben', 'status', "in_bearbeitung") ?? "In Bearbeitung"; } }, { key: "blockiert", get label() { return lookupLabel('aufgaben', 'status', "blockiert") ?? "Blockiert"; } }, { key: "wartet_auf_antwort", get label() { return lookupLabel('aufgaben', 'status', "wartet_auf_antwort") ?? "Wartet auf Antwort"; } }, { key: "erledigt", get label() { return lookupLabel('aufgaben', 'status', "erledigt") ?? "Erledigt"; } }, { key: "abgebrochen", get label() { return lookupLabel('aufgaben', 'status', "abgebrochen") ?? "Abgebrochen"; } }],
  },
  'beurteilungen': {
    beurteilungsart: [{ key: "machbarkeit", get label() { return lookupLabel('beurteilungen', 'beurteilungsart', "machbarkeit") ?? "Technische Machbarkeit"; } }, { key: "vollstaendigkeit", get label() { return lookupLabel('beurteilungen', 'beurteilungsart', "vollstaendigkeit") ?? "Vollständigkeit"; } }, { key: "risiko", get label() { return lookupLabel('beurteilungen', 'beurteilungsart', "risiko") ?? "Risiko"; } }, { key: "qualitaet", get label() { return lookupLabel('beurteilungen', 'beurteilungsart', "qualitaet") ?? "Qualität"; } }, { key: "normenkonformitaet", get label() { return lookupLabel('beurteilungen', 'beurteilungsart', "normenkonformitaet") ?? "Normenkonformität"; } }, { key: "termin", get label() { return lookupLabel('beurteilungen', 'beurteilungsart', "termin") ?? "Termin"; } }, { key: "kostenwirkung", get label() { return lookupLabel('beurteilungen', 'beurteilungsart', "kostenwirkung") ?? "Kostenwirkung"; } }, { key: "herstellbarkeit", get label() { return lookupLabel('beurteilungen', 'beurteilungsart', "herstellbarkeit") ?? "Herstellbarkeit"; } }, { key: "sonstiges", get label() { return lookupLabel('beurteilungen', 'beurteilungsart', "sonstiges") ?? "Sonstiges"; } }],
    einschaetzung: [{ key: "positiv", get label() { return lookupLabel('beurteilungen', 'einschaetzung', "positiv") ?? "Positiv"; } }, { key: "bedingt_positiv", get label() { return lookupLabel('beurteilungen', 'einschaetzung', "bedingt_positiv") ?? "Bedingt positiv"; } }, { key: "negativ", get label() { return lookupLabel('beurteilungen', 'einschaetzung', "negativ") ?? "Negativ"; } }, { key: "unklar", get label() { return lookupLabel('beurteilungen', 'einschaetzung', "unklar") ?? "Unklar"; } }, { key: "nicht_anwendbar", get label() { return lookupLabel('beurteilungen', 'einschaetzung', "nicht_anwendbar") ?? "Nicht anwendbar"; } }],
    pruefstatus: [{ key: "entwurf", get label() { return lookupLabel('beurteilungen', 'pruefstatus', "entwurf") ?? "Entwurf"; } }, { key: "fachlich_geprueft", get label() { return lookupLabel('beurteilungen', 'pruefstatus', "fachlich_geprueft") ?? "Fachlich geprüft"; } }, { key: "bestaetigt", get label() { return lookupLabel('beurteilungen', 'pruefstatus', "bestaetigt") ?? "Bestätigt"; } }, { key: "ueberholt", get label() { return lookupLabel('beurteilungen', 'pruefstatus', "ueberholt") ?? "Überholt"; } }],
  },
  'rueckfragen_und_kommunikation': {
    kommunikationstyp: [{ key: "kundenrueckfrage", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'kommunikationstyp', "kundenrueckfrage") ?? "Kundenrückfrage"; } }, { key: "interne_anfrage", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'kommunikationstyp', "interne_anfrage") ?? "Interne Anfrage"; } }, { key: "antwort", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'kommunikationstyp', "antwort") ?? "Antwort"; } }, { key: "information", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'kommunikationstyp', "information") ?? "Information"; } }, { key: "eskalation", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'kommunikationstyp', "eskalation") ?? "Eskalation"; } }, { key: "gespraechsprotokoll", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'kommunikationstyp', "gespraechsprotokoll") ?? "Gesprächsprotokoll"; } }],
    kanal: [{ key: "email", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'kanal', "email") ?? "E-Mail"; } }, { key: "telefon", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'kanal', "telefon") ?? "Telefon"; } }, { key: "besprechung", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'kanal', "besprechung") ?? "Besprechung"; } }, { key: "chat", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'kanal', "chat") ?? "Chat"; } }, { key: "persoenliches_gespraech", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'kanal', "persoenliches_gespraech") ?? "Persönliches Gespräch"; } }, { key: "sonstiges", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'kanal', "sonstiges") ?? "Sonstiges"; } }],
    versandstatus: [{ key: "entwurf", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'versandstatus', "entwurf") ?? "Entwurf"; } }, { key: "zur_pruefung", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'versandstatus', "zur_pruefung") ?? "Zur Prüfung"; } }, { key: "freigegeben", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'versandstatus', "freigegeben") ?? "Freigegeben"; } }, { key: "versendet", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'versandstatus', "versendet") ?? "Versendet"; } }, { key: "fehlgeschlagen", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'versandstatus', "fehlgeschlagen") ?? "Fehlgeschlagen"; } }, { key: "nicht_erforderlich", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'versandstatus', "nicht_erforderlich") ?? "Nicht erforderlich"; } }],
    antwortstatus: [{ key: "offen", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'antwortstatus', "offen") ?? "Offen"; } }, { key: "teilweise_beantwortet", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'antwortstatus', "teilweise_beantwortet") ?? "Teilweise beantwortet"; } }, { key: "beantwortet", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'antwortstatus', "beantwortet") ?? "Beantwortet"; } }, { key: "unklar", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'antwortstatus', "unklar") ?? "Unklar"; } }, { key: "widerspruechlich", get label() { return lookupLabel('rueckfragen_und_kommunikation', 'antwortstatus', "widerspruechlich") ?? "Widersprüchlich"; } }],
  },
  'entscheidungen': {
    entscheidungstyp: [{ key: "technische_freigabe", get label() { return lookupLabel('entscheidungen', 'entscheidungstyp', "technische_freigabe") ?? "Technische Freigabe"; } }, { key: "abweichung_akzeptieren", get label() { return lookupLabel('entscheidungen', 'entscheidungstyp', "abweichung_akzeptieren") ?? "Abweichung akzeptieren"; } }, { key: "alternative_auswaehlen", get label() { return lookupLabel('entscheidungen', 'entscheidungstyp', "alternative_auswaehlen") ?? "Alternative auswählen"; } }, { key: "anforderung_aendern", get label() { return lookupLabel('entscheidungen', 'entscheidungstyp', "anforderung_aendern") ?? "Anforderung ändern"; } }, { key: "risiko_akzeptieren", get label() { return lookupLabel('entscheidungen', 'entscheidungstyp', "risiko_akzeptieren") ?? "Risiko akzeptieren"; } }, { key: "rueckfrage_abschliessen", get label() { return lookupLabel('entscheidungen', 'entscheidungstyp', "rueckfrage_abschliessen") ?? "Rückfrage abschließen"; } }, { key: "ablehnung", get label() { return lookupLabel('entscheidungen', 'entscheidungstyp', "ablehnung") ?? "Ablehnung"; } }, { key: "eskalation", get label() { return lookupLabel('entscheidungen', 'entscheidungstyp', "eskalation") ?? "Eskalation"; } }, { key: "sonstiges", get label() { return lookupLabel('entscheidungen', 'entscheidungstyp', "sonstiges") ?? "Sonstiges"; } }],
    entscheidungsstatus: [{ key: "vorbereitung", get label() { return lookupLabel('entscheidungen', 'entscheidungsstatus', "vorbereitung") ?? "Vorbereitung"; } }, { key: "zur_entscheidung", get label() { return lookupLabel('entscheidungen', 'entscheidungsstatus', "zur_entscheidung") ?? "Zur Entscheidung"; } }, { key: "entschieden", get label() { return lookupLabel('entscheidungen', 'entscheidungsstatus', "entschieden") ?? "Entschieden"; } }, { key: "zurueckgestellt", get label() { return lookupLabel('entscheidungen', 'entscheidungsstatus', "zurueckgestellt") ?? "Zurückgestellt"; } }, { key: "ersetzt", get label() { return lookupLabel('entscheidungen', 'entscheidungsstatus', "ersetzt") ?? "Ersetzt"; } }],
  },
  'erfahrungen': {
    erfahrungstyp: [{ key: "erfahrung", get label() { return lookupLabel('erfahrungen', 'erfahrungstyp', "erfahrung") ?? "Erfahrung"; } }, { key: "annahme", get label() { return lookupLabel('erfahrungen', 'erfahrungstyp', "annahme") ?? "Annahme"; } }, { key: "experiment", get label() { return lookupLabel('erfahrungen', 'erfahrungstyp', "experiment") ?? "Experiment"; } }, { key: "wirkung", get label() { return lookupLabel('erfahrungen', 'erfahrungstyp', "wirkung") ?? "Wirkung"; } }, { key: "beobachtung", get label() { return lookupLabel('erfahrungen', 'erfahrungstyp', "beobachtung") ?? "Beobachtung"; } }, { key: "bewaehrte_vorgehensweise", get label() { return lookupLabel('erfahrungen', 'erfahrungstyp', "bewaehrte_vorgehensweise") ?? "Bewährte Vorgehensweise"; } }],
    risiko_uebertragung: [{ key: "niedrig", get label() { return lookupLabel('erfahrungen', 'risiko_uebertragung', "niedrig") ?? "Niedrig"; } }, { key: "mittel", get label() { return lookupLabel('erfahrungen', 'risiko_uebertragung', "mittel") ?? "Mittel"; } }, { key: "hoch", get label() { return lookupLabel('erfahrungen', 'risiko_uebertragung', "hoch") ?? "Hoch"; } }, { key: "unbekannt", get label() { return lookupLabel('erfahrungen', 'risiko_uebertragung', "unbekannt") ?? "Unbekannt"; } }],
    bestaetigungsstatus: [{ key: "ungeprueft", get label() { return lookupLabel('erfahrungen', 'bestaetigungsstatus', "ungeprueft") ?? "Ungeprüft"; } }, { key: "vorlaeufig", get label() { return lookupLabel('erfahrungen', 'bestaetigungsstatus', "vorlaeufig") ?? "Vorläufig"; } }, { key: "fachlich_bestaetigt", get label() { return lookupLabel('erfahrungen', 'bestaetigungsstatus', "fachlich_bestaetigt") ?? "Fachlich bestätigt"; } }, { key: "wiederholt_bestaetigt", get label() { return lookupLabel('erfahrungen', 'bestaetigungsstatus', "wiederholt_bestaetigt") ?? "Wiederholt bestätigt"; } }, { key: "widerlegt", get label() { return lookupLabel('erfahrungen', 'bestaetigungsstatus', "widerlegt") ?? "Widerlegt"; } }, { key: "ueberholt", get label() { return lookupLabel('erfahrungen', 'bestaetigungsstatus', "ueberholt") ?? "Überholt"; } }],
    wiederverwendungsstatus: [{ key: "nicht_geprueft", get label() { return lookupLabel('erfahrungen', 'wiederverwendungsstatus', "nicht_geprueft") ?? "Nicht geprüft"; } }, { key: "verfuegbar", get label() { return lookupLabel('erfahrungen', 'wiederverwendungsstatus', "verfuegbar") ?? "Für Wiederverwendung verfügbar"; } }, { key: "nur_hinweis", get label() { return lookupLabel('erfahrungen', 'wiederverwendungsstatus', "nur_hinweis") ?? "Nur als Hinweis verwenden"; } }, { key: "nicht_mehr_verwenden", get label() { return lookupLabel('erfahrungen', 'wiederverwendungsstatus', "nicht_mehr_verwenden") ?? "Nicht mehr verwenden"; } }],
  },
  'wiederverwendung_von_erfahrungen': {
    aehnlichkeit: [{ key: "hoch", get label() { return lookupLabel('wiederverwendung_von_erfahrungen', 'aehnlichkeit', "hoch") ?? "Hoch"; } }, { key: "mittel", get label() { return lookupLabel('wiederverwendung_von_erfahrungen', 'aehnlichkeit', "mittel") ?? "Mittel"; } }, { key: "niedrig", get label() { return lookupLabel('wiederverwendung_von_erfahrungen', 'aehnlichkeit', "niedrig") ?? "Niedrig"; } }, { key: "unklar", get label() { return lookupLabel('wiederverwendung_von_erfahrungen', 'aehnlichkeit', "unklar") ?? "Unklar"; } }],
    verwendungsergebnis: [{ key: "verwendet", get label() { return lookupLabel('wiederverwendung_von_erfahrungen', 'verwendungsergebnis', "verwendet") ?? "Verwendet"; } }, { key: "teilweise_verwendet", get label() { return lookupLabel('wiederverwendung_von_erfahrungen', 'verwendungsergebnis', "teilweise_verwendet") ?? "Teilweise verwendet"; } }, { key: "nicht_verwendet", get label() { return lookupLabel('wiederverwendung_von_erfahrungen', 'verwendungsergebnis', "nicht_verwendet") ?? "Nicht verwendet"; } }, { key: "ungeeignet", get label() { return lookupLabel('wiederverwendung_von_erfahrungen', 'verwendungsergebnis', "ungeeignet") ?? "Als ungeeignet erkannt"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'kunden': {
    'kundennummer': 'string/text',
    'firmenname': 'string/text',
    'ansprechpartner_vorname': 'string/text',
    'ansprechpartner_nachname': 'string/text',
    'e_mail': 'string/email',
    'telefon': 'string/tel',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'branche': 'string/text',
    'interne_bemerkung': 'string/textarea',
    'aktiv': 'bool',
  },
  'kundenanfragen': {
    'anfragenummer': 'string/text',
    'kunde': 'applookup/select',
    'eingangsdatum': 'date/date',
    'eingangskanal': 'lookup/select',
    'kundenreferenz': 'string/text',
    'kontakt_vorname': 'string/text',
    'kontakt_nachname': 'string/text',
    'kontakt_email': 'string/email',
    'produktfamilie': 'string/text',
    'produktvariante': 'string/text',
    'gewuenschte_menge': 'number',
    'gewuenschter_liefertermin': 'date/date',
    'anfragebeschreibung': 'string/textarea',
    'urspruengliche_kundenanforderungen': 'string/textarea',
    'prioritaet': 'lookup/select',
    'verantwortlicher_vorname': 'string/text',
    'verantwortlicher_nachname': 'string/text',
    'status': 'lookup/select',
    'klaeraufwand': 'lookup/radio',
    'zieltermin_klaerung': 'date/date',
    'vollstaendigkeit': 'lookup/select',
    'schaetzung_bearbeitung_min': 'number',
    'gemessen_bearbeitung_min': 'number',
    'wartezeit_kunde_min': 'number',
    'wartezeit_intern_min': 'number',
    'geklaert_am': 'date/datetimeminute',
    'anzahl_nachtraegliche_aenderungen': 'number',
    'anzahl_nacharbeiten': 'number',
  },
  'technischer_abschluss': {
    'anfrage': 'applookup/select',
    'pruefdatum': 'date/datetimeminute',
    'geprueft_von': 'string/text',
    'anforderungen_geprueft': 'bool',
    'kritische_punkte_geklaert': 'bool',
    'entscheidungen_vorhanden': 'bool',
    'freigaben_vorhanden': 'bool',
    'verbleibende_abweichungen': 'string/textarea',
    'verbleibende_risiken': 'string/textarea',
    'offene_restpunkte': 'string/textarea',
    'uebergabeempfaenger': 'string/text',
    'uebergabestatus': 'lookup/select',
    'uebergabedatum': 'date/datetimeminute',
    'zusammenfassung': 'string/textarea',
    'freigabestatus': 'lookup/select',
  },
  'statusprotokoll': {
    'anfrage': 'applookup/select',
    'objekttyp': 'lookup/select',
    'objektbezeichnung': 'string/text',
    'alter_status': 'string/text',
    'neuer_status': 'string/text',
    'zeitpunkt': 'date/datetimeminute',
    'benutzer_vorname': 'string/text',
    'benutzer_nachname': 'string/text',
    'begruendung': 'string/textarea',
  },
  'informationsquellen': {
    'eingangszeitpunkt': 'date/datetimeminute',
    'versionskennung': 'string/text',
    'quellenstatus': 'lookup/select',
    'zusammenfassung': 'string/textarea',
    'extraktionsstatus': 'lookup/select',
    'pruefung_durch': 'string/text',
    'pruefung_am': 'date/datetimeminute',
    'erneute_pruefung': 'bool',
    'bemerkung': 'string/textarea',
    'ersetzt_quelle': 'applookup/select',
    'anfrage': 'applookup/select',
    'quellentyp': 'lookup/select',
    'titel': 'string/text',
    'datei': 'file',
    'referenz_url': 'string/url',
    'urheber': 'string/text',
    'quellendatum': 'date/date',
  },
  'technische_anforderungen': {
    'anfrage': 'applookup/select',
    'bezeichnung': 'string/text',
    'beschreibung': 'string/textarea',
    'anforderungstyp': 'lookup/select',
    'ursprung': 'lookup/select',
    'sollwert': 'string/text',
    'einheit': 'string/text',
    'vergleichsoperator': 'lookup/select',
    'min_wert': 'number',
    'max_wert': 'number',
    'ist_pflichtanforderung': 'bool',
    'pruefstatus': 'lookup/select',
    'begruendung_pruefstatus': 'string/textarea',
    'verantwortlicher_vorname': 'string/text',
    'verantwortlicher_nachname': 'string/text',
    'gueltig_ab': 'date/date',
    'gueltig_bis': 'date/date',
    'erneute_pruefung': 'bool',
    'quellen': 'multipleapplookup/select',
  },
  'offene_punkte': {
    'betroffene_anforderungen': 'multipleapplookup/select',
    'betroffene_quellen': 'multipleapplookup/select',
    'anfrage': 'applookup/select',
    'kurztitel': 'string/text',
    'beschreibung': 'string/textarea',
    'punktetyp': 'lookup/select',
    'prioritaet': 'lookup/select',
    'auswirkung': 'lookup/select',
    'zustaendige_rolle': 'string/text',
    'verantwortlicher_vorname': 'string/text',
    'verantwortlicher_nachname': 'string/text',
    'faellig_am': 'date/date',
    'status': 'lookup/select',
    'erledigungskriterium': 'string/textarea',
    'loesung_oder_ergebnis': 'string/textarea',
    'antwort_geprueft': 'bool',
    'abgeschlossen_am': 'date/datetimeminute',
    'abschluss_durch': 'string/text',
    'erneute_pruefung': 'bool',
  },
  'aufgaben': {
    'anfrage': 'applookup/select',
    'titel': 'string/text',
    'beschreibung': 'string/textarea',
    'aufgabentyp': 'lookup/select',
    'verantwortlicher_vorname': 'string/text',
    'verantwortlicher_nachname': 'string/text',
    'mitwirkende': 'string/text',
    'prioritaet': 'lookup/select',
    'status': 'lookup/select',
    'faellig_am': 'date/date',
    'blockierungsgrund': 'string/textarea',
    'ergebnis': 'string/textarea',
    'abgeschlossen_am': 'date/datetimeminute',
    'offener_punkt': 'applookup/select',
    'abhaengige_aufgaben': 'multipleapplookup/select',
  },
  'beurteilungen': {
    'betroffene_anforderungen': 'multipleapplookup/select',
    'betroffene_offene_punkte': 'multipleapplookup/select',
    'zugrunde_liegende_quellen': 'multipleapplookup/select',
    'anfrage': 'applookup/select',
    'beurteilungsgegenstand': 'string/text',
    'beurteilungsart': 'lookup/select',
    'einschaetzung': 'lookup/select',
    'fachliche_begruendung': 'string/textarea',
    'annahmen': 'string/textarea',
    'unsicherheiten': 'string/textarea',
    'alternativen': 'string/textarea',
    'empfehlung': 'string/textarea',
    'ist_ki_vorschlag': 'bool',
    'erstellt_von': 'string/text',
    'erstellt_am': 'date/datetimeminute',
    'pruefstatus': 'lookup/select',
    'geprueft_von': 'string/text',
    'geprueft_am': 'date/datetimeminute',
    'erneute_pruefung': 'bool',
  },
  'rueckfragen_und_kommunikation': {
    'zugehoerige_offene_punkte': 'multipleapplookup/select',
    'beantwortet_nachricht': 'applookup/select',
    'quelle': 'applookup/select',
    'anfrage': 'applookup/select',
    'kommunikationstyp': 'lookup/select',
    'kanal': 'lookup/select',
    'absender': 'string/text',
    'empfaenger': 'string/text',
    'betreff': 'string/text',
    'inhalt': 'string/textarea',
    'versandstatus': 'lookup/select',
    'versanddatum': 'date/datetimeminute',
    'antwort_erwartet_bis': 'date/date',
    'antwort_erhalten_am': 'date/datetimeminute',
    'antwortstatus': 'lookup/select',
    'folgeaufgabe_noetig': 'bool',
    'notizen': 'string/textarea',
  },
  'entscheidungen': {
    'betroffene_anforderungen': 'multipleapplookup/select',
    'betroffene_offene_punkte': 'multipleapplookup/select',
    'zugrunde_liegende_beurteilungen': 'multipleapplookup/select',
    'ersetzt_durch_entscheidung': 'applookup/select',
    'anfrage': 'applookup/select',
    'titel': 'string/text',
    'entscheidungsgegenstand': 'string/textarea',
    'entscheidungstyp': 'lookup/select',
    'alternativen': 'string/textarea',
    'entscheidung': 'string/textarea',
    'begruendung': 'string/textarea',
    'verantwortlicher_vorname': 'string/text',
    'verantwortlicher_nachname': 'string/text',
    'kompetenz_geprueft': 'bool',
    'entscheidungsstatus': 'lookup/select',
    'entscheidungsdatum': 'date/datetimeminute',
    'auflagen': 'string/textarea',
    'gueltig_bis': 'date/date',
    'ergebnis': 'string/textarea',
    'erneute_pruefung': 'bool',
  },
  'erfahrungen': {
    'belegquellen': 'multipleapplookup/select',
    'belegbeurteilungen': 'multipleapplookup/select',
    'belegentscheidungen': 'multipleapplookup/select',
    'ursprungsanfrage': 'applookup/select',
    'titel': 'string/text',
    'sachverhalt': 'string/textarea',
    'erfahrungstyp': 'lookup/select',
    'produktfamilie': 'string/text',
    'anforderungstyp': 'string/text',
    'schlagwoerter': 'string/text',
    'urspruengliches_problem': 'string/textarea',
    'vorgehen': 'string/textarea',
    'beobachtetes_ergebnis': 'string/textarea',
    'erkenntnis': 'string/textarea',
    'belegabschluss': 'applookup/select',
    'gueltigkeitsbedingungen': 'string/textarea',
    'bekannte_grenzen': 'string/textarea',
    'risiko_uebertragung': 'lookup/select',
    'bestaetigungsstatus': 'lookup/select',
    'bestaetigt_von': 'string/text',
    'bestaetigt_am': 'date/date',
    'gueltig_ab': 'date/date',
    'gueltig_bis': 'date/date',
    'wiederverwendungsstatus': 'lookup/select',
    'kommentar_wiederverwendung': 'string/textarea',
  },
  'wiederverwendung_von_erfahrungen': {
    'erfahrung': 'applookup/select',
    'ziel_anfrage': 'applookup/select',
    'abrufdatum': 'date/datetimeminute',
    'abrufgrund': 'string/textarea',
    'aehnlichkeit': 'lookup/select',
    'kontextunterschiede': 'string/textarea',
    'gueltigkeit_geprueft': 'bool',
    'geprueft_von': 'string/text',
    'verwendungsergebnis': 'lookup/select',
    'begruendung': 'string/textarea',
    'beobachteter_nutzen': 'string/textarea',
    'ersparnis_schaetzung_min': 'number',
    'ersparnis_tatsaechlich_min': 'number',
    'negative_folgen': 'string/textarea',
    'bewertet_am': 'date/date',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
  'kundenanfragen': [
    { field: 'anfrage', entity: 'technischer_abschluss' },
    { field: 'anfrage', entity: 'statusprotokoll' },
    { field: 'anfrage', entity: 'informationsquellen' },
    { field: 'anfrage', entity: 'technische_anforderungen' },
    { field: 'anfrage', entity: 'offene_punkte' },
    { field: 'anfrage', entity: 'aufgaben' },
    { field: 'anfrage', entity: 'beurteilungen' },
    { field: 'anfrage', entity: 'rueckfragen_und_kommunikation' },
    { field: 'anfrage', entity: 'entscheidungen' },
    { field: 'ursprungsanfrage', entity: 'erfahrungen' },
    { field: 'ziel_anfrage', entity: 'wiederverwendung_von_erfahrungen' },
  ],
  'informationsquellen': [
    { field: 'quellen', entity: 'technische_anforderungen' },
    { field: 'betroffene_quellen', entity: 'offene_punkte' },
    { field: 'zugrunde_liegende_quellen', entity: 'beurteilungen' },
    { field: 'quelle', entity: 'rueckfragen_und_kommunikation' },
    { field: 'belegquellen', entity: 'erfahrungen' },
  ],
  'technische_anforderungen': [
    { field: 'betroffene_anforderungen', entity: 'offene_punkte' },
    { field: 'betroffene_anforderungen', entity: 'beurteilungen' },
    { field: 'betroffene_anforderungen', entity: 'entscheidungen' },
  ],
  'offene_punkte': [
    { field: 'offener_punkt', entity: 'aufgaben' },
    { field: 'betroffene_offene_punkte', entity: 'beurteilungen' },
    { field: 'zugehoerige_offene_punkte', entity: 'rueckfragen_und_kommunikation' },
    { field: 'betroffene_offene_punkte', entity: 'entscheidungen' },
  ],
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateKunden = StripLookup<Kunden['fields']>;
export type CreateKundenanfragen = StripLookup<Kundenanfragen['fields']>;
export type CreateTechnischerAbschluss = StripLookup<TechnischerAbschluss['fields']>;
export type CreateStatusprotokoll = StripLookup<Statusprotokoll['fields']>;
export type CreateInformationsquellen = StripLookup<Informationsquellen['fields']>;
export type CreateTechnischeAnforderungen = StripLookup<TechnischeAnforderungen['fields']>;
export type CreateOffenePunkte = StripLookup<OffenePunkte['fields']>;
export type CreateAufgaben = StripLookup<Aufgaben['fields']>;
export type CreateBeurteilungen = StripLookup<Beurteilungen['fields']>;
export type CreateRueckfragenUndKommunikation = StripLookup<RueckfragenUndKommunikation['fields']>;
export type CreateEntscheidungen = StripLookup<Entscheidungen['fields']>;
export type CreateErfahrungen = StripLookup<Erfahrungen['fields']>;
export type CreateWiederverwendungVonErfahrungen = StripLookup<WiederverwendungVonErfahrungen['fields']>;