/**
 * Collecte des flux : téléchargement (GET conditionnel ETag/Last-Modified),
 * parsing, normalisation en Article et insertion dédupliquée dans Deno KV.
 */
import type { Article, CollectResult, FeedMeta, Source } from "../lib/types.ts";
import {
  getArticle,
  getFeedMeta,
  saveArticle,
  setFeedMeta,
} from "../lib/kv.ts";
import { invalidateFeedCache } from "../lib/feed.ts";
import { ACTIVE_SOURCES, themeFromCategory } from "./sources.ts";
import { parseFeed, stripHtml } from "./parser.ts";
import type { ParsedItem } from "./parser.ts";

const FETCH_TIMEOUT_MS = 20_000;
const CONCURRENCY = 6;
const USER_AGENT =
  "CNRS-flux/1.0 (+agrégateur d'actualités scientifiques ; Deno)";

/** Identifiant stable : SHA-256 (tronqué) du guid ou du lien. */
async function articleId(item: ParsedItem): Promise<string> {
  const seed = item.guid || item.link;
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(seed),
  );
  return Array.from(new Uint8Array(digest).slice(0, 12))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Beaucoup de flux CNRS n'exposent pas d'image : on tente la balise
 * Open Graph de la page de l'article (uniquement pour les nouveaux articles).
 */
async function fetchOgImage(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(8_000),
    });
    if (!res.ok) {
      await res.body?.cancel();
      return undefined;
    }
    const html = (await res.text()).slice(0, 200_000);
    const match = html.match(
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    ) ?? html.match(
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    );
    return match?.[1];
  } catch {
    return undefined;
  }
}

/** Écarte les items non éditoriaux (newsletters, pages de test). */
function isNoise(item: ParsedItem): boolean {
  if (!item.title || !item.link) return true;
  if (item.link.includes("/newsletter/")) return true;
  if (/^test\b/i.test(item.title)) return true;
  return false;
}

async function toArticle(item: ParsedItem, source: Source): Promise<Article> {
  const themes = new Set(source.themes);
  for (const cat of item.categories) {
    const theme = themeFromCategory(cat);
    if (theme) themes.add(theme);
  }
  return {
    id: await articleId(item),
    sourceId: source.id,
    org: source.org,
    title: stripHtml(item.title, 300),
    link: item.link,
    summary: stripHtml(item.descriptionHtml),
    image: item.image,
    categories: item.categories,
    themes: [...themes],
    publishedAt: item.publishedAt ?? Date.now(),
    fetchedAt: Date.now(),
  };
}

/** Collecte une source ; ne jette jamais, l'erreur est portée par le résultat. */
export async function collectSource(source: Source): Promise<CollectResult> {
  const started = Date.now();
  const previous = await getFeedMeta(source.id);
  const meta: FeedMeta = {
    sourceId: source.id,
    etag: previous?.etag,
    lastModified: previous?.lastModified,
    lastFetchAt: started,
    lastStatus: "ok",
    lastAdded: 0,
    total: previous?.total ?? 0,
  };

  try {
    const headers = new Headers({ "user-agent": USER_AGENT });
    if (previous?.etag) headers.set("if-none-match", previous.etag);
    if (previous?.lastModified) {
      headers.set("if-modified-since", previous.lastModified);
    }

    const res = await fetch(source.feedUrl, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (res.status === 304) {
      await res.body?.cancel();
      meta.lastStatus = "not-modified";
      await setFeedMeta(meta);
      return {
        sourceId: source.id,
        status: meta.lastStatus,
        added: 0,
        seen: 0,
        durationMs: Date.now() - started,
      };
    }
    if (!res.ok) {
      await res.body?.cancel();
      throw new Error(`HTTP ${res.status}`);
    }

    meta.etag = res.headers.get("etag") ?? undefined;
    meta.lastModified = res.headers.get("last-modified") ?? undefined;

    const items = parseFeed(await res.text()).filter((i) => !isNoise(i));
    let added = 0;
    for (const item of items) {
      const article = await toArticle(item, source);
      if (await getArticle(article.id)) continue; // déjà connu
      if (!article.image) article.image = await fetchOgImage(article.link);
      if (await saveArticle(article)) added++;
    }

    meta.lastAdded = added;
    meta.total += added;
    await setFeedMeta(meta);
    return {
      sourceId: source.id,
      status: "ok",
      added,
      seen: items.length,
      durationMs: Date.now() - started,
    };
  } catch (error) {
    meta.lastStatus = "error";
    meta.lastError = error instanceof Error ? error.message : String(error);
    await setFeedMeta(meta);
    return {
      sourceId: source.id,
      status: "error",
      added: 0,
      seen: 0,
      error: meta.lastError,
      durationMs: Date.now() - started,
    };
  }
}

/** Collecte toutes les sources actives avec une concurrence bornée. */
export async function collectAll(): Promise<CollectResult[]> {
  const queue = [...ACTIVE_SOURCES];
  const results: CollectResult[] = [];

  async function worker() {
    while (true) {
      const source = queue.shift();
      if (!source) return;
      const result = await collectSource(source);
      results.push(result);
      const detail = result.status === "error"
        ? `erreur: ${result.error}`
        : `+${result.added}/${result.seen} articles`;
      console.log(
        `[collect] ${source.id.padEnd(20)} ${
          result.status.padEnd(12)
        } ${detail} (${result.durationMs}ms)`,
      );
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker),
  );
  invalidateFeedCache();

  const added = results.reduce((sum, r) => sum + r.added, 0);
  const errors = results.filter((r) => r.status === "error").length;
  console.log(
    `[collect] terminé : ${added} nouveaux articles, ${errors} flux en erreur, ${results.length} flux traités`,
  );
  return results;
}
