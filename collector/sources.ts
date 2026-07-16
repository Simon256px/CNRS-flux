/**
 * Registre des sources collectées.
 *
 * Pour ajouter un organisme : déclarer l'`Organization` puis ses `Source`s.
 * Pour ajouter un flux : une entrée dans SOURCES suffit, le collecteur,
 * l'API et l'UI le prennent en compte automatiquement.
 */
import type { Organization, Source, SourceKind } from "../lib/types.ts";

/** Déclaration compacte : [id, nom court, nom complet, actif]. */
const ORG_DEFS: [string, string, string, boolean][] = [
  ["cnrs", "CNRS", "Centre national de la recherche scientifique", true],
  [
    "inserm",
    "Inserm",
    "Institut national de la santé et de la recherche médicale",
    true,
  ],
  [
    "inria",
    "Inria",
    "Institut national de recherche en sciences et technologies du numérique",
    true,
  ],
  [
    "cea",
    "CEA",
    "Commissariat à l'énergie atomique et aux énergies alternatives",
    true,
  ],
  ["cern", "CERN", "Organisation européenne pour la recherche nucléaire", true],
  ["ird", "IRD", "Institut de recherche pour le développement", true],
  [
    "gustave-roussy",
    "Gustave Roussy",
    "Centre de lutte contre le cancer",
    true,
  ],
  ["meteofrance", "Météo-France", "Établissement public de météorologie", true],
  ["obspm", "Obs. de Paris", "Observatoire de Paris - PSL", true],
  ["paris-saclay", "Paris-Saclay", "Université Paris-Saclay", true],
  ["sorbonne", "Sorbonne", "Sorbonne Université", true],
  ["futura", "Futura", "Futura Sciences (média)", true],
  ["conversation", "The Conversation", "The Conversation France (média)", true],
  // Sans flux RSS d'actualités public exploitable (vérifié juillet 2026) —
  // flux morts, vides ou inexistants. Passer enabled à true et déclarer la
  // source si l'un d'eux (re)publie un flux.
  ["cnes", "CNES", "Centre national d'études spatiales", false],
  ["pasteur", "Institut Pasteur", "Institut Pasteur", false],
  [
    "inrae",
    "INRAE",
    "Institut national de recherche pour l'agriculture, l'alimentation et l'environnement",
    false,
  ],
  [
    "ifremer",
    "IFREMER",
    "Institut français de recherche pour l'exploitation de la mer",
    false,
  ],
  ["brgm", "BRGM", "Bureau de recherches géologiques et minières", false],
  [
    "anses",
    "ANSES",
    "Agence nationale de sécurité sanitaire de l'alimentation, de l'environnement et du travail",
    false,
  ],
  ["curie", "Institut Curie", "Institut Curie", false],
];

export const ORGANIZATIONS: Organization[] = ORG_DEFS.map(
  ([id, name, fullName, enabled]) => ({ id, name, fullName, enabled }),
);

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
  "tech": "Numérique",
  "mathématiques": "Mathématiques",
  "ingénierie": "Ingénierie",
  "énergie": "Énergie",
  "énergies": "Énergie",
  "défense & sécurité": "Ingénierie",
  "astronomie": "Terre & Univers",
  "géologie": "Terre & Univers",
  "météorologie": "Écologie & environnement",
  "océan": "Écologie & environnement",
  "médecine": "Biologie",
  "cancer": "Biologie",
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

/** Fabrique générique pour les flux des autres organismes. */
function src(
  spec:
    & Pick<Source, "id" | "org" | "name" | "shortName" | "homepage" | "feedUrl">
    & Partial<Pick<Source, "kind" | "themes" | "exclude">>,
): Source {
  return {
    kind: "national",
    themes: [],
    enabled: true,
    ...spec,
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

  // ── Autres organismes (flux vérifiés) ───────────────────────────────────
  src({
    id: "inserm",
    org: "inserm",
    name: "Inserm — Actualités",
    shortName: "INSERM",
    homepage: "https://www.inserm.fr",
    feedUrl: "https://www.inserm.fr/feed/",
    themes: ["Biologie"],
  }),
  src({
    id: "inserm-presse",
    org: "inserm",
    name: "Inserm — Salle de presse",
    shortName: "INSERM PRESSE",
    homepage: "https://presse.inserm.fr",
    feedUrl: "https://presse.inserm.fr/feed/",
    themes: ["Biologie"],
  }),
  src({
    id: "inria",
    org: "inria",
    name: "Inria — Actualités",
    shortName: "INRIA",
    homepage: "https://www.inria.fr/fr",
    feedUrl: "https://www.inria.fr/fr/rss.xml",
    themes: ["Numérique"],
  }),
  src({
    id: "cea",
    org: "cea",
    name: "CEA — Presse & médias",
    shortName: "CEA",
    homepage: "https://www.cea.fr/presse",
    feedUrl:
      "https://www.cea.fr/presse/_layouts/15/i2i/web/ceasrchrss.ashx?pid=9&wid=g_f5b1fb1e_16a3_42ba_a2fe_fb25fb65577b",
    themes: ["Énergie", "Physique"],
  }),
  src({
    id: "cern",
    org: "cern",
    name: "CERN — Actualités",
    shortName: "CERN",
    homepage: "https://home.cern/fr",
    feedUrl: "https://home.cern/fr/feed/",
    themes: ["Physique"],
  }),
  src({
    id: "ird",
    org: "ird",
    name: "IRD — Actualités",
    shortName: "IRD",
    homepage: "https://www.ird.fr",
    feedUrl: "https://www.ird.fr/rss.xml",
    themes: ["Écologie & environnement", "Sciences humaines & sociales"],
  }),
  src({
    id: "gustave-roussy",
    org: "gustave-roussy",
    name: "Gustave Roussy — Actualités",
    shortName: "GUSTAVE ROUSSY",
    homepage: "https://www.gustaveroussy.fr",
    feedUrl: "https://www.gustaveroussy.fr/fr/rss.xml",
    themes: ["Biologie"],
  }),
  src({
    id: "meteofrance",
    org: "meteofrance",
    name: "Météo-France — Actualités",
    shortName: "MÉTÉO-FRANCE",
    homepage: "https://meteofrance.fr",
    feedUrl: "https://meteofrance.fr/rss.xml",
    themes: ["Écologie & environnement"],
  }),
  src({
    id: "obspm",
    org: "obspm",
    name: "Observatoire de Paris — Actualités",
    shortName: "OBS. PARIS",
    homepage: "https://www.observatoiredeparis.psl.eu",
    feedUrl: "https://www.observatoiredeparis.psl.eu/spip.php?page=backend",
    themes: ["Terre & Univers"],
  }),
  src({
    id: "paris-saclay",
    org: "paris-saclay",
    name: "Université Paris-Saclay — Actualités",
    shortName: "PARIS-SACLAY",
    homepage: "https://www.universite-paris-saclay.fr",
    feedUrl: "https://www.universite-paris-saclay.fr/rss.xml",
  }),
  src({
    id: "sorbonne",
    org: "sorbonne",
    name: "Sorbonne Université — Actualités",
    shortName: "SORBONNE",
    homepage: "https://www.sorbonne-universite.fr",
    feedUrl: "https://www.sorbonne-universite.fr/rss.xml",
  }),

  // ── Médias scientifiques ────────────────────────────────────────────────
  src({
    id: "futura",
    org: "futura",
    kind: "journal",
    name: "Futura Sciences",
    shortName: "FUTURA",
    homepage: "https://www.futura-sciences.com",
    feedUrl: "https://www.futura-sciences.com/rss/actualites.xml",
    // Écarte le contenu sponsorisé (bons plans, soldes…) du flux général.
    exclude: "bons?-?plans?|no_ads|cdiscount|soldes|black friday|promotion",
  }),
  src({
    id: "conversation",
    org: "conversation",
    kind: "journal",
    name: "The Conversation France",
    shortName: "THE CONVERSATION",
    homepage: "https://theconversation.com/fr",
    feedUrl: "https://theconversation.com/fr/articles.atom",
  }),
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
