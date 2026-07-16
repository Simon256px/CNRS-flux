/**
 * Page "Sources" : tableau de bord du réseau de flux — état de collecte,
 * volumes par source, organismes à venir.
 */
import { define } from "../utils.ts";
import { countBySource } from "../lib/feed.ts";
import { listFeedMeta } from "../lib/kv.ts";
import { ACTIVE_SOURCES, ORGANIZATIONS } from "../collector/sources.ts";
import type { FeedMeta, Source, SourceKind } from "../lib/types.ts";
import {
  formatDate,
  formatTime,
  KIND_ACCENT,
  SLASHES,
} from "../lib/display.ts";
import { Nav, SiteFooter, TopBar } from "../components/Chrome.tsx";

export const handler = define.handlers({
  async GET(ctx) {
    const [metaList, counts] = await Promise.all([
      listFeedMeta(),
      countBySource(),
    ]);
    const metas = new Map(metaList.map((m) => [m.sourceId, m]));
    return ctx.render(<SourcesPage metas={metas} counts={counts} />);
  },
});

const GROUPS: SourceKind[] = ["national", "journal", "institut", "delegation"];

const GROUP_LABEL: Record<SourceKind, string> = {
  national: "Flux nationaux",
  journal: "Médias scientifiques",
  institut: "Instituts thématiques",
  delegation: "Délégations régionales",
  laboratoire: "Laboratoires",
};

function SourceRow(
  { source, meta, count }: { source: Source; meta?: FeedMeta; count: number },
) {
  const error = meta?.lastStatus === "error";
  return (
    <a
      class="srcrow"
      href={source.feedUrl}
      target="_blank"
      rel="noopener noreferrer"
      title={`Flux RSS — ${source.feedUrl}`}
    >
      <span
        class={`st ${error ? "err" : ""}`}
        style={error ? "" : `background: ${KIND_ACCENT[source.kind]};
          box-shadow: 0 0 8px ${KIND_ACCENT[source.kind]}`}
      />
      <span>
        <div class="id">{source.shortName}</div>
        <div class="desc">
          {source.name}
          {source.region ? ` — ${source.region}` : ""}
        </div>
      </span>
      <span class="meta">
        <div>
          <span class="n">{count}</span> art.
        </div>
        <div>
          {error
            ? `⚠ ${meta?.lastError ?? "erreur"}`
            : meta
            ? `sync ${formatDate(meta.lastFetchAt)} ${
              formatTime(meta.lastFetchAt)
            }`
            : "jamais collecté"}
        </div>
      </span>
    </a>
  );
}

function SourcesPage(
  { metas, counts }: {
    metas: Map<string, FeedMeta>;
    counts: Map<string, number>;
  },
) {
  return (
    <div class="wrap">
      <TopBar />
      <Nav active="sources" />

      {GROUPS.map((kind) => {
        const group = ACTIVE_SOURCES.filter((s) => s.kind === kind);
        if (group.length === 0) return null;
        return (
          <section key={kind}>
            <h2 class="sec-title">
              <b>{SLASHES}</b> {GROUP_LABEL[kind]} — {group.length} flux
            </h2>
            <div class="srcgrid">
              {group.map((source) => (
                <SourceRow
                  key={source.id}
                  source={source}
                  meta={metas.get(source.id)}
                  count={counts.get(source.id) ?? 0}
                />
              ))}
            </div>
          </section>
        );
      })}

      <section>
        <h2 class="sec-title">
          <b>{SLASHES}</b> Extension du réseau — à venir
        </h2>
        <div class="soon">
          {ORGANIZATIONS.filter((o) => !o.enabled).map((org) => (
            <span key={org.id} class="chip" title={org.fullName}>
              ○ {org.name}
            </span>
          ))}
          <span class="chip">○ Laboratoires CNRS</span>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
