/**
 * Recherche plein texte, sans dépendance : normalisation des accents,
 * découpage en tokens et score de pertinence (titre > résumé > catégories).
 */
import type { Article } from "./types.ts";

/** Minuscules + suppression des diacritiques ("Écologie" → "ecologie"). */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1);
}

/**
 * Score d'un article pour une requête : chaque token doit apparaître
 * quelque part (ET logique) ; le score pondère l'endroit du match.
 * Retourne 0 si l'article ne correspond pas.
 */
export function scoreArticle(article: Article, tokens: string[]): number {
  if (tokens.length === 0) return 1;
  const title = normalize(article.title);
  const summary = normalize(article.summary);
  const tags = normalize(
    [...article.categories, ...article.themes].join(" "),
  );

  let score = 0;
  for (const token of tokens) {
    let tokenScore = 0;
    if (title.includes(token)) tokenScore += 5;
    if (tags.includes(token)) tokenScore += 3;
    if (summary.includes(token)) tokenScore += 1;
    if (tokenScore === 0) return 0; // token absent → article écarté
    score += tokenScore;
  }
  return score;
}

/** Filtre + trie par pertinence (score décroissant, puis date). */
export function searchArticles(articles: Article[], query: string): Article[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return articles;
  return articles
    .map((article) => ({ article, score: scoreArticle(article, tokens) }))
    .filter((r) => r.score > 0)
    .sort((a, b) =>
      b.score - a.score || b.article.publishedAt - a.article.publishedAt
    )
    .map((r) => r.article);
}
