/**
 * Page d'accueil : hero avec télémétrie, puis explorateur d'actualités
 * (island). Les premières données sont rendues côté serveur directement
 * depuis Deno KV — l'API n'est interrogée qu'ensuite, à l'interaction.
 */
import { define } from "../utils.ts";
import { facets, queryArticles } from "../lib/feed.ts";
import { listFeedMeta } from "../lib/kv.ts";
import { ACTIVE_SOURCES, ORGANIZATIONS } from "../collector/sources.ts";
import {
  formatDate,
  formatTime,
  pad,
  SLASHES,
  type SourceRef,
} from "../lib/display.ts";
import { Nav, SiteFooter, TopBar } from "../components/Chrome.tsx";
import NewsExplorer from "../islands/NewsExplorer.tsx";

export const handler = define.handlers({
  async GET(ctx) {
    const [initial, metas] = await Promise.all([
      queryArticles({ limit: 24 }),
      listFeedMeta(),
    ]);
    const lastFetchAt = Math.max(0, ...metas.map((m) => m.lastFetchAt));
    const errors = metas.filter((m) => m.lastStatus === "error").length;
    return ctx.render(
      <Home
        initial={initial}
        lastFetchAt={lastFetchAt}
        errors={errors}
      />,
    );
  },
});

interface HomeProps {
  initial: Awaited<ReturnType<typeof queryArticles>>;
  lastFetchAt: number;
  errors: number;
}

function Home({ initial, lastFetchAt, errors }: HomeProps) {
  const { regions, themes } = facets();
  const sources: SourceRef[] = ACTIVE_SOURCES.map((s) => ({
    id: s.id,
    shortName: s.shortName,
    name: s.name,
    kind: s.kind,
    region: s.region,
  }));

  return (
    <div class="wrap">
      <TopBar />

      <header class="hero">
        <div>
          <h1 class="wordmark">
            Flux<span class="slash">{SLASHES}</span>
            <br />
            <span class="hollow">CNRS</span>
          </h1>
          <p class="tagline">
            <span class="dot">●</span> L'actualité de la recherche —{" "}
            {ORGANIZATIONS.filter((o) => o.enabled).length}{" "}
            organismes, collectés en continu
          </p>
        </div>

        <div class="readout" aria-label="Télémétrie du collecteur">
          <div class="cell">
            <div class="k">Articles indexés</div>
            <div class="v">{pad(initial.total)}</div>
          </div>
          <div class="cell">
            <div class="k">Flux suivis</div>
            <div class="v">{pad(ACTIVE_SOURCES.length, 2)}</div>
          </div>
          <div class="cell">
            <div class="k">Flux en erreur</div>
            <div class="v" style={errors > 0 ? "color: var(--red)" : ""}>
              {pad(errors, 2)}
            </div>
          </div>
          <div class="cell">
            <div class="k">Dernière synchro</div>
            <div class="v quiet">
              {lastFetchAt
                ? `${formatDate(lastFetchAt)} ${formatTime(lastFetchAt)}`
                : "—"}
            </div>
          </div>
        </div>
      </header>

      <Nav active="actualites" />

      <NewsExplorer
        initial={initial}
        sources={sources}
        orgs={ORGANIZATIONS.filter((o) => o.enabled).map((o) => ({
          id: o.id,
          name: o.name,
        }))}
        regions={regions}
        themes={themes}
      />

      <SiteFooter />
    </div>
  );
}
