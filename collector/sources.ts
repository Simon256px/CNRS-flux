/**
 * Registre des sources collectées.
 *
 * Pour ajouter un organisme : déclarer l'`Organization` puis ses `Source`s.
 * Pour ajouter un flux : une entrée dans SOURCES suffit, le collecteur,
 * l'API et l'UI le prennent en compte automatiquement.
 */
import type { Organization, Source, SourceKind } from "../lib/types.ts";

export const ORGANIZATIONS: Organization[] = [
  {
    id: "cnrs",
    name: "CNRS",
    fullName: "Centre national de la recherche scientifique",
    enabled: true,
  },
  {
    id: "inserm",
    name: "Inserm",
    fullName: "Institut national de la santé et de la recherche médicale",
    enabled: true,
  },
  {
    id: "inria",
    name: "Inria",
    fullName:
      "Institut national de recherche en sciences et technologies du numérique",
    enabled: true,
  },
  {
    id: "cea",
    name: "CEA",
    fullName: "Commissariat à l'énergie atomique et aux énergies alternatives",
    enabled: true,
  },
  {
    id: "cern",
    name: "CERN",
    fullName: "Organisation européenne pour la recherche nucléaire",
    enabled: true,
  },
];

/** Thèmes scientifiques canoniques utilisés par les filtres. */
export const THEMES = [
  "Biologie",
  "Chimie",
  "Écologie & environnement",
  "Énergie",
  "Ingénierie",
  "Mathématiques",
  "Numérique",
  "Physique",
  "Sciences humaines & sociales",
  "Terre & Univers",
  "Institutionnel",
] as const;

/**
 * Correspondance entre les catégories rencontrées dans les flux
 * (rubriques de CNRS Le Journal notamment) et les thèmes canoniques.
 */
export const THEME_ALIASES: Record<string, string> = {
  "vivant": "Biologie",
  "biologie": "Biologie",
  "santé": "Biologie",
  "chimie": "Chimie",
  "matière": "Physique",
  "physique": "Physique",
  "terre": "Terre & Univers",
  "univers": "Terre & Univers",
  "espace": "Terre & Univers",
  "environnement": "Écologie & environnement",
  "écologie": "Écologie & environnement",
  "climat": "Écologie & environnement",
  "sociétés": "Sciences humaines & sociales",
  "société": "Sciences humaines & sociales",
  "histoire": "Sciences humaines & sociales",
  "numérique": "Numérique",
  "informatique": "Numérique",
  "intelligence artificielle": "Numérique",
  "mathématiques": "Mathématiques",
  "ingénierie": "Ingénierie",
  "énergie": "Énergie",
  "énergies": "Énergie",
  "défense & sécurité": "Ingénierie",
};

interface SourceSpec {
  id: string;
  kind: SourceKind;
  name: string;
  shortName: string;
  host: string; // hôte *.cnrs.fr — feedUrl dérivée
  feedPath?: string; // défaut : /fr/rss.xml
  region?: string;
  themes?: string[];
}

/** Fabrique compacte pour les sources CNRS (mutualise l'URL du flux). */
function cnrs(spec: SourceSpec): Source {
  return {
    id: spec.id,
    org: "cnrs",
    kind: spec.kind,
    name: spec.name,
    shortName: spec.shortName,
    homepage: `https://${spec.host}/fr`,
    feedUrl: `https://${spec.host}${spec.feedPath ?? "/fr/rss.xml"}`,
    region: spec.region,
    themes: spec.themes ?? [],
    enabled: true,
  };
}

export const SOURCES: Source[] = [
  // ── National ────────────────────────────────────────────────────────────
  cnrs({
    id: "cnrs",
    kind: "national",
    name: "CNRS — Actualités nationales",
    shortName: "CNRS",
    host: "www.cnrs.fr",
    themes: ["Institutionnel"],
  }),
  {
    id: "lejournal",
    org: "cnrs",
    kind: "journal",
    name: "CNRS Le Journal",
    shortName: "LE JOURNAL",
    homepage: "https://lejournal.cnrs.fr",
    feedUrl: "https://lejournal.cnrs.fr/rss",
    themes: [],
    enabled: true,
  },

  // ── Instituts thématiques ───────────────────────────────────────────────
  cnrs({
    id: "insb",
    kind: "institut",
    name: "Institut des sciences biologiques",
    shortName: "INSB",
    host: "www.insb.cnrs.fr",
    themes: ["Biologie"],
  }),
  cnrs({
    id: "inc",
    kind: "institut",
    name: "Institut de chimie",
    shortName: "INC",
    host: "www.inc.cnrs.fr",
    themes: ["Chimie"],
  }),
  cnrs({
    id: "inee",
    kind: "institut",
    name: "Institut écologie et environnement",
    shortName: "INEE",
    host: "www.inee.cnrs.fr",
    themes: ["Écologie & environnement"],
  }),
  cnrs({
    id: "inshs",
    kind: "institut",
    name: "Institut des sciences humaines et sociales",
    shortName: "INSHS",
    host: "www.inshs.cnrs.fr",
    themes: ["Sciences humaines & sociales"],
  }),
  cnrs({
    id: "ins2i",
    kind: "institut",
    name: "Institut des sciences informatiques et de leurs interactions",
    shortName: "INS2I",
    host: "www.ins2i.cnrs.fr",
    themes: ["Numérique"],
  }),
  cnrs({
    id: "insis",
    kind: "institut",
    name: "Institut des sciences de l'ingénierie et des systèmes",
    shortName: "INSIS",
    host: "www.insis.cnrs.fr",
    themes: ["Ingénierie"],
  }),
  cnrs({
    id: "insmi",
    kind: "institut",
    name:
      "Institut national des sciences mathématiques et de leurs interactions",
    shortName: "INSMI",
    host: "www.insmi.cnrs.fr",
    themes: ["Mathématiques"],
  }),
  cnrs({
    id: "inp",
    kind: "institut",
    name: "Institut de physique",
    shortName: "INP",
    host: "www.inp.cnrs.fr",
    themes: ["Physique"],
  }),
  cnrs({
    id: "in2p3",
    kind: "institut",
    name:
      "Institut national de physique nucléaire et de physique des particules",
    shortName: "IN2P3",
    host: "www.in2p3.cnrs.fr",
    themes: ["Physique", "Terre & Univers"],
  }),
  cnrs({
    id: "insu",
    kind: "institut",
    name: "Institut national des sciences de l'Univers",
    shortName: "INSU",
    host: "www.insu.cnrs.fr",
    themes: ["Terre & Univers"],
  }),

  // ── Délégations régionales ──────────────────────────────────────────────
  cnrs({
    id: "dr-alsace",
    kind: "delegation",
    name: "Délégation Alsace",
    shortName: "ALSACE",
    host: "www.alsace.cnrs.fr",
    region: "Grand Est",
  }),
  cnrs({
    id: "dr-alpes",
    kind: "delegation",
    name: "Délégation Alpes",
    shortName: "ALPES",
    host: "www.alpes.cnrs.fr",
    region: "Auvergne-Rhône-Alpes",
  }),
  cnrs({
    id: "dr-aquitaine",
    kind: "delegation",
    name: "Délégation Aquitaine",
    shortName: "AQUITAINE",
    host: "www.aquitaine.cnrs.fr",
    region: "Nouvelle-Aquitaine",
  }),
  cnrs({
    id: "dr-centre-est",
    kind: "delegation",
    name: "Délégation Centre-Est",
    shortName: "CENTRE-EST",
    host: "www.centre-est.cnrs.fr",
    region: "Grand Est",
  }),
  cnrs({
    id: "dr-clpc",
    kind: "delegation",
    name: "Délégation Centre Limousin Poitou-Charentes",
    shortName: "CLPC",
    host: "www.centre-limousin-poitou-charentes.cnrs.fr",
    region: "Centre-Val de Loire",
  }),
  cnrs({
    id: "dr-cote-azur",
    kind: "delegation",
    name: "Délégation Côte d'Azur",
    shortName: "CÔTE D'AZUR",
    host: "www.cote-azur.cnrs.fr",
    region: "Provence-Alpes-Côte d'Azur",
  }),
  cnrs({
    id: "dr-hdf",
    kind: "delegation",
    name: "Délégation Hauts-de-France",
    shortName: "HAUTS-DE-FR.",
    host: "www.hauts-de-france.cnrs.fr",
    region: "Hauts-de-France",
  }),
  cnrs({
    id: "dr-idf-gif",
    kind: "delegation",
    name: "Délégation Île-de-France Gif-sur-Yvette",
    shortName: "IDF GIF",
    host: "www.iledefrance-gif.cnrs.fr",
    region: "Île-de-France",
  }),
  cnrs({
    id: "dr-idf-meudon",
    kind: "delegation",
    name: "Délégation Île-de-France Meudon",
    shortName: "IDF MEUDON",
    host: "www.iledefrance-meudon.cnrs.fr",
    region: "Île-de-France",
  }),
  cnrs({
    id: "dr-idf-villejuif",
    kind: "delegation",
    name: "Délégation Île-de-France Villejuif",
    shortName: "IDF VILLEJUIF",
    host: "www.iledefrance-villejuif.cnrs.fr",
    region: "Île-de-France",
  }),
  cnrs({
    id: "dr-normandie",
    kind: "delegation",
    name: "Délégation Normandie",
    shortName: "NORMANDIE",
    host: "www.normandie.cnrs.fr",
    region: "Normandie",
  }),
  cnrs({
    id: "dr-occitanie-est",
    kind: "delegation",
    name: "Délégation Occitanie Est",
    shortName: "OCCITANIE E.",
    host: "www.occitanie-est.cnrs.fr",
    region: "Occitanie",
  }),
  cnrs({
    id: "dr-occitanie-ouest",
    kind: "delegation",
    name: "Délégation Occitanie Ouest",
    shortName: "OCCITANIE O.",
    host: "www.occitanie-ouest.cnrs.fr",
    region: "Occitanie",
  }),
  cnrs({
    id: "dr-paris-centre",
    kind: "delegation",
    name: "Délégation Paris-Centre",
    shortName: "PARIS-CENTRE",
    host: "www.paris-centre.cnrs.fr",
    region: "Île-de-France",
  }),
  cnrs({
    id: "dr-provence-corse",
    kind: "delegation",
    name: "Délégation Provence et Corse",
    shortName: "PROVENCE-CORSE",
    host: "www.provence-corse.cnrs.fr",
    region: "Provence-Alpes-Côte d'Azur",
  }),
  cnrs({
    id: "dr-rhone-auvergne",
    kind: "delegation",
    name: "Délégation Rhône Auvergne",
    shortName: "RHÔNE-AUV.",
    host: "www.rhone-auvergne.cnrs.fr",
    region: "Auvergne-Rhône-Alpes",
  }),
  // ── Laboratoires ────────────────────────────────────────────────────────
  // Extension future : ajouter ici les flux de laboratoires, kind: "laboratoire",
  // avec region + themes. Exemple :
  // cnrs({ id: "lab-xxx", kind: "laboratoire", name: "…", shortName: "…",
  //        host: "www.xxx.cnrs.fr", region: "…", themes: ["…"] }),

  // ── Autres organismes ───────────────────────────────────────────────────
  {
    id: "inserm",
    org: "inserm",
    kind: "national",
    name: "Inserm — Actualités",
    shortName: "INSERM",
    homepage: "https://www.inserm.fr",
    feedUrl: "https://www.inserm.fr/feed/",
    themes: ["Biologie"],
    enabled: true,
  },
  {
    id: "inserm-presse",
    org: "inserm",
    kind: "national",
    name: "Inserm — Salle de presse",
    shortName: "INSERM PRESSE",
    homepage: "https://presse.inserm.fr",
    feedUrl: "https://presse.inserm.fr/feed/",
    themes: ["Biologie"],
    enabled: true,
  },
  {
    id: "inria",
    org: "inria",
    kind: "national",
    name: "Inria — Actualités",
    shortName: "INRIA",
    homepage: "https://www.inria.fr/fr",
    feedUrl: "https://www.inria.fr/fr/rss.xml",
    themes: ["Numérique"],
    enabled: true,
  },
  {
    id: "cea",
    org: "cea",
    kind: "national",
    name: "CEA — Presse & médias",
    shortName: "CEA",
    homepage: "https://www.cea.fr/presse",
    feedUrl:
      "https://www.cea.fr/presse/_layouts/15/i2i/web/ceasrchrss.ashx?pid=9&wid=g_f5b1fb1e_16a3_42ba_a2fe_fb25fb65577b",
    themes: ["Énergie", "Physique"],
    enabled: true,
  },
  {
    id: "cern",
    org: "cern",
    kind: "national",
    name: "CERN — Actualités",
    shortName: "CERN",
    homepage: "https://home.cern/fr",
    feedUrl: "https://home.cern/fr/feed/",
    themes: ["Physique"],
    enabled: true,
  },
];

export const ACTIVE_SOURCES: Source[] = SOURCES.filter((s) => s.enabled);

const BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

export function getSource(id: string): Source | undefined {
  return BY_ID.get(id);
}

/** Mappe une catégorie brute de flux vers un thème canonique (ou null). */
export function themeFromCategory(raw: string): string | null {
  return THEME_ALIASES[raw.trim().toLowerCase()] ?? null;
}
