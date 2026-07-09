/**
 * Lecture du fil d'actualités : agrège Deno KV et le registre des sources,
 * applique les filtres (organisme, type, source, région, thème, recherche)
 * et pagine le résultat. Un petit cache mémoire évite de relire KV à chaque
 * requête.
 */
import type { Article, ArticlePage, ArticleQuery, Source } from "./types.ts";
import { listArticles } from "./kv.ts";
import { ACTIVE_SOURCES, getSource } from "../collector/sources.ts";
import { searchArticles } from "./search.ts";

const CACHE_TTL_MS = 30_000;
let cache: { at: number; articles: Article[] } | undefined;

/** Invalide le cache (appelé après chaque collecte). */
export function invalidateFeedCache(): void {
  cache = undefined;
}

async function allArticles(): Promise<Article[]> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.articles;
  const articles = await listArticles();
  cache = { at: Date.now(), articles };
  return articles;
}

function matchesSource(source: Source | undefined, query: ArticleQuery) {
  if (!source) return false;
  if (query.org && source.org !== query.org) return false;
  if (query.kind && source.kind !== query.kind) return false;
  if (query.source && source.id !== query.source) return false;
  if (query.region && source.region !== query.region) return false;
  return true;
}

/** Applique filtres + recherche + pagination. */
export async function queryArticles(query: ArticleQuery): Promise<ArticlePage> {
  const limit = Math.min(Math.max(query.limit ?? 24, 1), 100);
  const offset = Math.max(query.offset ?? 0, 0);

  let articles = await allArticles();

  if (query.org || query.kind || query.source || query.region) {
    articles = articles.filter((a) =>
      matchesSource(getSource(a.sourceId), query)
    );
  }
  if (query.theme) {
    articles = articles.filter((a) => a.themes.includes(query.theme!));
  }
  if (query.q?.trim()) {
    articles = searchArticles(articles, query.q);
  }

  return {
    articles: articles.slice(offset, offset + limit),
    total: articles.length,
    offset,
    limit,
  };
}

/** Valeurs de facettes pour construire les filtres de l'UI. */
export function facets() {
  const regions = [
    ...new Set(
      ACTIVE_SOURCES.map((s) => s.region).filter((r): r is string => !!r),
    ),
  ].sort((a, b) => a.localeCompare(b, "fr"));
  const themes = [
    ...new Set(ACTIVE_SOURCES.flatMap((s) => s.themes)),
  ].sort((a, b) => a.localeCompare(b, "fr"));
  return { regions, themes };
}
