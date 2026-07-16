/**
 * Couche de persistance Deno KV.
 *
 * Schéma des clés :
 *   ["articles_by_date", invTs, id] → Article   (enregistrement principal,
 *                                                trié du plus récent au plus ancien)
 *   ["article_ref", id]             → invTs     (déduplication + accès direct)
 *   ["feed_meta", sourceId]         → FeedMeta  (état de collecte par flux)
 *
 * `invTs = MAX_TS - publishedAt` : Deno KV liste les clés en ordre croissant,
 * l'inversion du timestamp donne donc un parcours antéchronologique naturel.
 */
import type { Article, FeedMeta } from "./types.ts";

const MAX_TS = 10_000_000_000_000; // ~année 2286

let kvPromise: Promise<Deno.Kv> | undefined;

/** KV singleton (chemin surchargeable via la variable d'env KV_PATH). */
export function getKv(): Promise<Deno.Kv> {
  const promise = kvPromise ??
    Deno.openKv(Deno.env.get("KV_PATH") || undefined);
  kvPromise = promise;
  return promise;
}

export function invTs(publishedAt: number): number {
  return MAX_TS - publishedAt;
}

/**
 * Insère un article s'il est inconnu (déduplication atomique sur son id).
 * Retourne true si l'article a été ajouté.
 */
export async function saveArticle(article: Article): Promise<boolean> {
  const kv = await getKv();
  const ts = invTs(article.publishedAt);
  const res = await kv.atomic()
    .check({ key: ["article_ref", article.id], versionstamp: null })
    .set(["article_ref", article.id], ts)
    .set(["articles_by_date", ts, article.id], article)
    .commit();
  return res.ok;
}

/** Liste les articles du plus récent au plus ancien (au plus `max`). */
export async function listArticles(max = 2000): Promise<Article[]> {
  const kv = await getKv();
  const articles: Article[] = [];
  const iter = kv.list<Article>({ prefix: ["articles_by_date"] }, {
    limit: max,
  });
  for await (const entry of iter) articles.push(entry.value);
  return articles;
}

/**
 * Sous-ensemble des ids déjà stockés, vérifiés par lots de 10 via getMany
 * (une requête KV par lot au lieu d'une par article — important sur
 * Deno Deploy où chaque get est un aller-retour réseau).
 */
export async function knownArticleIds(ids: string[]): Promise<Set<string>> {
  const kv = await getKv();
  const known = new Set<string>();
  for (let i = 0; i < ids.length; i += 10) {
    const batch = ids.slice(i, i + 10);
    const entries = await kv.getMany(
      batch.map((id) => ["article_ref", id] as const),
    );
    entries.forEach((entry, j) => {
      if (entry.value !== null) known.add(batch[j]);
    });
  }
  return known;
}

export async function getArticle(id: string): Promise<Article | null> {
  const kv = await getKv();
  const ref = await kv.get<number>(["article_ref", id]);
  if (ref.value === null) return null;
  const entry = await kv.get<Article>(["articles_by_date", ref.value, id]);
  return entry.value;
}

export async function setFeedMeta(meta: FeedMeta): Promise<void> {
  const kv = await getKv();
  await kv.set(["feed_meta", meta.sourceId], meta);
}

export async function getFeedMeta(sourceId: string): Promise<FeedMeta | null> {
  const kv = await getKv();
  return (await kv.get<FeedMeta>(["feed_meta", sourceId])).value;
}

export async function listFeedMeta(): Promise<FeedMeta[]> {
  const kv = await getKv();
  const metas: FeedMeta[] = [];
  for await (const entry of kv.list<FeedMeta>({ prefix: ["feed_meta"] })) {
    metas.push(entry.value);
  }
  return metas;
}

/** Nombre total d'articles stockés. */
export async function countArticles(): Promise<number> {
  const kv = await getKv();
  let count = 0;
  const iter = kv.list({ prefix: ["article_ref"] }, {
    consistency: "eventual",
  });
  for await (const _ of iter) count++;
  return count;
}
