/**
 * Island principal : console de recherche + grille d'articles.
 * Rendu SSR avec les données initiales, puis interroge /api/articles
 * à chaque changement de filtre (recherche débouncée, requêtes annulables).
 */
import { useEffect, useRef, useState } from "preact/hooks";
import type { Article, ArticlePage, SourceKind } from "../lib/types.ts";
import { pad, type SourceRef } from "../lib/display.ts";
import { ArticleCard } from "../components/ArticleCard.tsx";

const PAGE_SIZE = 24;

const KIND_TABS: { value: "" | SourceKind; label: string }[] = [
  { value: "", label: "Tout" },
  { value: "institut", label: "Instituts" },
  { value: "delegation", label: "Délégations" },
  { value: "journal", label: "Journal" },
  { value: "national", label: "National" },
];

export interface NewsExplorerProps {
  initial: ArticlePage;
  sources: SourceRef[];
  orgs: { id: string; name: string }[];
  regions: string[];
  themes: string[];
}

export default function NewsExplorer(
  { initial, sources, orgs, regions, themes }: NewsExplorerProps,
) {
  const [articles, setArticles] = useState<Article[]>(initial.articles);
  const [total, setTotal] = useState(initial.total);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [org, setOrg] = useState("");
  const [kind, setKind] = useState<"" | SourceKind>("");
  const [source, setSource] = useState("");
  const [region, setRegion] = useState("");
  const [theme, setTheme] = useState("");

  const sourceById = new Map(sources.map((s) => [s.id, s]));
  const filtered = Boolean(q || org || kind || source || region || theme);

  const skipFirst = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  async function load(offset: number, append: boolean) {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(offset),
      });
      if (q) params.set("q", q);
      if (org) params.set("org", org);
      if (kind) params.set("kind", kind);
      if (source) params.set("source", source);
      if (region) params.set("region", region);
      if (theme) params.set("theme", theme);

      const res = await fetch(`/api/articles?${params}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const page: ArticlePage = await res.json();
      setArticles((prev) =>
        append ? [...prev, ...page.articles] : page.articles
      );
      setTotal(page.total);
      setLoading(false);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("[explorer]", err);
      setLoading(false);
    }
  }

  // Recharge à chaque changement de filtre (débounce pour la saisie).
  useEffect(() => {
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    const timer = setTimeout(() => load(0, false), q ? 280 : 0);
    return () => clearTimeout(timer);
  }, [q, org, kind, source, region, theme]);

  function reset() {
    setQ("");
    setOrg("");
    setKind("");
    setSource("");
    setRegion("");
    setTheme("");
  }

  return (
    <section>
      <div class="console">
        <div class="searchrow">
          <span class="prompt">▸</span>
          <input
            type="search"
            placeholder="Rechercher dans les actualités… (titre, résumé, thème)"
            value={q}
            onInput={(e) => setQ((e.target as HTMLInputElement).value)}
            aria-label="Rechercher"
          />
        </div>
        <div class="filterrow">
          <div class="tabs" role="tablist">
            {KIND_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                class={`tab ${kind === tab.value ? "on" : ""}`}
                onClick={() => setKind(tab.value)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={org}
            onChange={(e) => setOrg((e.target as HTMLSelectElement).value)}
            aria-label="Filtrer par organisme"
          >
            <option value="">Organisme : tous</option>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>

          <select
            value={source}
            onChange={(e) => setSource((e.target as HTMLSelectElement).value)}
            aria-label="Filtrer par source"
          >
            <option value="">Source : toutes</option>
            {sources.map((s) => (
              <option key={s.id} value={s.id}>{s.shortName}</option>
            ))}
          </select>

          <select
            value={region}
            onChange={(e) => setRegion((e.target as HTMLSelectElement).value)}
            aria-label="Filtrer par région"
          >
            <option value="">Région : toutes</option>
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>

          <select
            value={theme}
            onChange={(e) => setTheme((e.target as HTMLSelectElement).value)}
            aria-label="Filtrer par thème"
          >
            <option value="">Thème : tous</option>
            {themes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          {filtered && (
            <button type="button" class="reset" onClick={reset}>
              ✕ Réinitialiser
            </button>
          )}
        </div>
      </div>

      <div class="status">
        <span>
          // <span class="n">{pad(total)}</span> résultat{total > 1 ? "s" : ""}
          {loading ? " — interrogation" : ""}
          <span class="cursor" />
        </span>
        <span>tri : {q ? "pertinence" : "date ↓"}</span>
      </div>

      {articles.length === 0 && !loading
        ? (
          <div class="empty">
            <b>∅ aucun signal</b>
            <br />
            <br />
            Aucun article ne correspond à ces critères.
          </div>
        )
        : (
          <div class="grid">
            {articles.map((article, i) => (
              <ArticleCard
                key={article.id}
                article={article}
                source={sourceById.get(article.sourceId)}
                index={i}
              />
            ))}
          </div>
        )}

      {articles.length < total && (
        <button
          type="button"
          class="more"
          disabled={loading}
          onClick={() => load(articles.length, true)}
        >
          {loading
            ? "▚ chargement…"
            : `▾ charger ${
              Math.min(PAGE_SIZE, total - articles.length)
            } de plus — ${pad(articles.length)}/${pad(total)}`}
        </button>
      )}
    </section>
  );
}
