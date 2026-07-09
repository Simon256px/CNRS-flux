/**
 * Page "Sources" : tableau de bord du réseau de flux — état de collecte,
 * volumes par source, organismes à venir.
 */
import { define } from "../utils.ts";
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
    const metas = new Map(
      (await listFeedMeta()).map((m) => [m.sourceId, m]),
    );
    return ctx.render(<SourcesPage metas={metas} />);
  },
});

const GROUPS: SourceKind[] = ["national", "journal", "institut", "delegation"];

const GROUP_LABEL: Record<SourceKind, string> = {
  national: "Flux national",
  journal: "CNRS Le Journal",
  institut: "Instituts thématiques",
  delegation: "Délégations régionales",
  laboratoire: "Laboratoires",
};

function SourceRow({ source, meta }: { source: Source; meta?: FeedMeta }) {
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
          <span class="n">{meta?.total ?? 0}</span> art.
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

function SourcesPage({ metas }: { metas: Map<string, FeedMeta> }) {
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
