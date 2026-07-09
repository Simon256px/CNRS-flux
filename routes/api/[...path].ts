/**
 * API HTTP de l'agrégateur, construite avec Hono et montée dans Fresh
 * via cette route attrape-tout (/api/*).
 *
 *   GET  /api/articles  — liste filtrée + paginée (q, org, kind, source,
 *                         region, theme, limit, offset)
 *   GET  /api/sources   — organismes, sources actives, état de collecte, facettes
 *   GET  /api/stats     — compteurs globaux et état du collecteur
 *   POST /api/collect   — déclenche une collecte manuelle
 */
import { Hono } from "@hono/hono";
import { define } from "../../utils.ts";
import { facets, queryArticles } from "../../lib/feed.ts";
import { listFeedMeta } from "../../lib/kv.ts";
import { ACTIVE_SOURCES, ORGANIZATIONS } from "../../collector/sources.ts";
import { collectAll } from "../../collector/rss.ts";
import { CRON_SCHEDULE } from "../../collector/cron.ts";
import type { SourceKind } from "../../lib/types.ts";

const api = new Hono().basePath("/api");

api.get("/articles", async (c) => {
  const q = c.req.query();
  const page = await queryArticles({
    q: q.q,
    org: q.org || undefined,
    kind: (q.kind || undefined) as SourceKind | undefined,
    source: q.source || undefined,
    region: q.region || undefined,
    theme: q.theme || undefined,
    limit: q.limit ? Number(q.limit) : undefined,
    offset: q.offset ? Number(q.offset) : undefined,
  });
  return c.json(page);
});

api.get("/sources", async (c) => {
  const metas = new Map(
    (await listFeedMeta()).map((m) => [m.sourceId, m]),
  );
  return c.json({
    organizations: ORGANIZATIONS,
    sources: ACTIVE_SOURCES.map((s) => ({
      ...s,
      meta: metas.get(s.id) ?? null,
    })),
    facets: facets(),
  });
});

api.get("/stats", async (c) => {
  const metas = await listFeedMeta();
  const total = metas.reduce((sum, m) => sum + m.total, 0);
  const lastFetchAt = Math.max(0, ...metas.map((m) => m.lastFetchAt));
  return c.json({
    articles: total,
    sources: ACTIVE_SOURCES.length,
    organizations: ORGANIZATIONS.filter((o) => o.enabled).length,
    errors: metas.filter((m) => m.lastStatus === "error").length,
    lastFetchAt: lastFetchAt || null,
    cron: CRON_SCHEDULE,
  });
});

api.post("/collect", async (c) => {
  const results = await collectAll();
  return c.json({
    added: results.reduce((sum, r) => sum + r.added, 0),
    results,
  });
});

api.notFound((c) => c.json({ error: "Route API inconnue" }, 404));

export const handler = define.handlers({
  GET: (ctx) => api.fetch(ctx.req),
  POST: (ctx) => api.fetch(ctx.req),
});
