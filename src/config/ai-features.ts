/**
 * AI feature toggles per entity.
 * Set to true to show "Foto scannen" button in the create/edit dialog.
 * The agent can change these values — all other AI files are pre-generated.
 */

export const AI_PHOTO_SCAN: Record<string, boolean> = {
  Kunden: true,
  Kundenanfragen: true,
  TechnischerAbschluss: true,
  Statusprotokoll: true,
  Informationsquellen: true,
  TechnischeAnforderungen: true,
  OffenePunkte: true,
  Aufgaben: true,
  Beurteilungen: true,
  RueckfragenUndKommunikation: true,
  Entscheidungen: true,
  Erfahrungen: true,
  WiederverwendungVonErfahrungen: true,
};

/**
 * Extract GPS coordinates from photo EXIF metadata and use them
 * to provide location context (reverse geocoding) to the AI extraction
 * and to auto-populate geo fields.
 */
export const AI_PHOTO_LOCATION: Record<string, boolean> = {
  Kunden: true,
  Kundenanfragen: true,
  TechnischerAbschluss: true,
  Statusprotokoll: true,
  Informationsquellen: true,
  TechnischeAnforderungen: true,
  OffenePunkte: true,
  Aufgaben: true,
  Beurteilungen: true,
  RueckfragenUndKommunikation: true,
  Entscheidungen: true,
  Erfahrungen: true,
  WiederverwendungVonErfahrungen: true,
};