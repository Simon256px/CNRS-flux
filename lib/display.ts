/**
 * Helpers d'affichage partagés entre le serveur (SSR) et les islands.
 * Les formats sont déterministes (fuseau Europe/Paris) pour éviter tout
 * écart d'hydratation entre serveur et client.
 */
import type { SourceKind } from "./types.ts";

/** Couleur d'accent par type de source (pip des badges). */
export const KIND_ACCENT: Record<SourceKind, string> = {
  national: "#ffffff",
  journal: "#7adfff",
  institut: "#63f78b",
  delegation: "#e3f56d",
  laboratoire: "#c9a7ff",
};

export const KIND_LABEL: Record<SourceKind, string> = {
  national: "National",
  journal: "Journal",
  institut: "Institut",
  delegation: "Délégation",
  laboratoire: "Laboratoire",
};

const DATE_FMT = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Europe/Paris",
});

const TIME_FMT = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Paris",
});

/** "09 JUIL 2026" */
export function formatDate(ts: number): string {
  return DATE_FMT.format(new Date(ts)).replaceAll(".", "").toUpperCase();
}

/** "12:45" */
export function formatTime(ts: number): string {
  return TIME_FMT.format(new Date(ts));
}

/** Glyphe décoratif "//" (extrait en constante : le linter JSX interdit
 * les doubles barres obliques littérales dans les nœuds texte). */
export const SLASHES = "//";

/** Compteur façon terminal : 42 → "0042". */
export function pad(n: number, width = 4): string {
  return String(n).padStart(width, "0");
}

/** Sous-ensemble de Source sérialisé vers les islands. */
export interface SourceRef {
  id: string;
  shortName: string;
  name: string;
  kind: SourceKind;
  region?: string;
}
