/**
 * Carte article. Utilisée côté serveur (SSR initial) et dans l'island
 * NewsExplorer — ne dépend que de données sérialisables.
 */
import type { Article } from "../lib/types.ts";
import {
  formatDate,
  KIND_ACCENT,
  KIND_LABEL,
  pad,
  type SourceRef,
} from "../lib/display.ts";

export interface ArticleCardProps {
  article: Article;
  source?: SourceRef;
  index: number;
}

export function ArticleCard({ article, source, index }: ArticleCardProps) {
  const accent = source ? KIND_ACCENT[source.kind] : "var(--green)";
  const tags = article.themes.slice(0, 3);

  return (
    <a
      class="card"
      href={article.link}
      target="_blank"
      rel="noopener noreferrer"
      title={article.title}
    >
      <span class="corner tl">+</span>
      <span class="corner br">+</span>

      <div class="card-head">
        <span class="badge" style={`--accent: ${accent}`}>
          <span class="pip" />
          {source?.shortName ?? article.sourceId}
        </span>
        <time dateTime={new Date(article.publishedAt).toISOString()}>
          {formatDate(article.publishedAt)}
        </time>
      </div>

      {article.image
        ? (
          <div class="thumb">
            <img src={article.image} alt="" loading="lazy" />
          </div>
        )
        : (
          <div class="thumb notext">
            <span class="idx">N°{pad(index + 1)}</span>
            <span class="lbl">
              {source ? KIND_LABEL[source.kind] : "flux"} / signal texte
            </span>
          </div>
        )}

      <div class="card-body">
        <h3>{article.title}</h3>
        {article.summary && <p>{article.summary}</p>}
      </div>

      <div class="card-foot">
        <span class="tags">
          {tags.map((t) => <span key={t} class="tag">{t}</span>)}
        </span>
        <span class="go">LIRE ↗</span>
      </div>
    </a>
  );
}
