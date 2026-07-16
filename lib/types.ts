/**
 * Types partagés de l'agrégateur.
 *
 * Le modèle est volontairement générique : une `Source` appartient à un
 * `Organization` (CNRS aujourd'hui, Inserm/Inria/CEA demain) et porte les
 * métadonnées qui alimentent les filtres du site (kind, région, thèmes).
 */

/** Organisme de recherche (extensible : Inserm, Inria, CEA, …). */
export interface Organization {
  id: string;
  name: string;
  fullName: string;
  /** Actif = au moins une source collectée. */
  enabled: boolean;
}

/** Nature d'une source au sein d'un organisme. */
export type SourceKind =
  | "national" // site institutionnel national
  | "journal" // média / magazine de l'organisme
  | "institut" // institut thématique
  | "delegation" // délégation / antenne régionale
  | "laboratoire"; // laboratoire (extension future)

/** Un flux RSS/Atom suivi par le collecteur. */
export interface Source {
  id: string;
  org: string; // Organization.id
  kind: SourceKind;
  name: string;
  shortName: string;
  homepage: string;
  feedUrl: string;
  /** Région administrative (délégations, laboratoires). */
  region?: string;
  /** Thèmes scientifiques canoniques portés par la source. */
  themes: string[];
  /**
   * Regex (insensible à la casse) testée contre lien + catégories de
   * chaque item ; les correspondances sont écartées (contenu sponsorisé…).
   */
  exclude?: string;
  enabled: boolean;
}

/** Article normalisé, tel que stocké dans Deno KV. */
export interface Article {
  id: string; // hash stable (guid ou lien)
  sourceId: string;
  org: string;
  title: string;
  link: string;
  summary: string;
  image?: string;
  /** Catégories brutes du flux. */
  categories: string[];
  /** Thèmes canoniques (source + catégories mappées). */
  themes: string[];
  publishedAt: number; // epoch ms
  fetchedAt: number; // epoch ms
}

/** État de la dernière collecte d'un flux (stocké dans KV). */
export interface FeedMeta {
  sourceId: string;
  etag?: string;
  lastModified?: string;
  lastFetchAt: number;
  lastStatus: "ok" | "not-modified" | "error";
  lastError?: string;
  /** Nombre d'articles ajoutés lors de la dernière collecte. */
  lastAdded: number;
  /** Total d'articles connus pour cette source. */
  total: number;
}

/** Filtres de consultation exposés par l'API et l'UI. */
export interface ArticleQuery {
  q?: string;
  org?: string;
  kind?: SourceKind;
  source?: string;
  region?: string;
  theme?: string;
  limit?: number;
  offset?: number;
}

export interface ArticlePage {
  articles: Article[];
  total: number;
  offset: number;
  limit: number;
}

/** Résultat de collecte d'une source (log / API stats). */
export interface CollectResult {
  sourceId: string;
  status: FeedMeta["lastStatus"];
  added: number;
  seen: number;
  error?: string;
  durationMs: number;
}
