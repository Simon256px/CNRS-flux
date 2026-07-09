/**
 * Parsing des flux RSS 2.0 / Atom vers un format intermédiaire neutre.
 * S'appuie sur @libs/xml (JSR) : attributs préfixés "@", texte sous "#text".
 */
import { parse } from "@libs/xml";

export interface ParsedItem {
  title: string;
  link: string;
  guid?: string;
  descriptionHtml: string;
  categories: string[];
  image?: string;
  publishedAt?: number;
}

// deno-lint-ignore no-explicit-any
type XmlNode = any;

/** Extrait le texte d'un nœud (@libs/xml renvoie string, nombre ou {#text}). */
function textOf(node: XmlNode): string {
  if (node === null || node === undefined) return "";
  if (typeof node === "string") return node.trim();
  if (typeof node === "number" || typeof node === "boolean") {
    return String(node);
  }
  if (typeof node === "object" && "#text" in node) {
    return textOf(node["#text"]);
  }
  return "";
}

function asArray(node: XmlNode): XmlNode[] {
  if (node === null || node === undefined) return [];
  return Array.isArray(node) ? node : [node];
}

function parseDate(raw: string): number | undefined {
  if (!raw) return undefined;
  const ts = Date.parse(raw);
  return Number.isNaN(ts) ? undefined : ts;
}

/** Catégories : éléments multiples et/ou valeurs "A, B" séparées par virgule. */
function parseCategories(node: XmlNode): string[] {
  const cats = asArray(node)
    .flatMap((c) => textOf(c).split(","))
    .map((c) => c.trim())
    .filter(Boolean);
  return [...new Set(cats)];
}

/** Première image trouvée : enclosure, media:content ou <img> du descriptif. */
function findImage(item: XmlNode, descriptionHtml: string): string | undefined {
  for (const enc of asArray(item.enclosure)) {
    const type = String(enc?.["@type"] ?? "");
    const url = String(enc?.["@url"] ?? "");
    if (url && (type.startsWith("image/") || type === "")) return url;
  }
  for (const media of asArray(item["media:content"])) {
    const url = String(media?.["@url"] ?? "");
    if (url) return url;
  }
  const img = descriptionHtml.match(/<img[^>]+src="([^"]+)"/i);
  return img?.[1];
}

function fromRssItem(item: XmlNode): ParsedItem {
  const descriptionHtml = textOf(item.description);
  return {
    title: textOf(item.title),
    link: textOf(item.link),
    guid: textOf(item.guid) || undefined,
    descriptionHtml,
    categories: parseCategories(item.category),
    image: findImage(item, descriptionHtml),
    publishedAt: parseDate(textOf(item.pubDate) || textOf(item["dc:date"])),
  };
}

function fromAtomEntry(entry: XmlNode): ParsedItem {
  // Atom : <link href="…"/> (souvent multiple, rel="alternate" prioritaire).
  const links = asArray(entry.link);
  const alternate = links.find((l) =>
    (l?.["@rel"] ?? "alternate") === "alternate"
  );
  const descriptionHtml = textOf(entry.summary) || textOf(entry.content);
  return {
    title: textOf(entry.title),
    link: String(alternate?.["@href"] ?? links[0]?.["@href"] ?? ""),
    guid: textOf(entry.id) || undefined,
    descriptionHtml,
    categories: asArray(entry.category)
      .map((c) => String(c?.["@term"] ?? "").trim())
      .filter(Boolean),
    image: findImage(entry, descriptionHtml),
    publishedAt: parseDate(textOf(entry.published) || textOf(entry.updated)),
  };
}

/** Parse un document RSS 2.0 ou Atom ; jette si le format est inconnu. */
export function parseFeed(xml: string): ParsedItem[] {
  const doc: XmlNode = parse(xml);
  if (doc.rss?.channel) {
    return asArray(doc.rss.channel.item).map(fromRssItem);
  }
  if (doc.feed) {
    return asArray(doc.feed.entry).map(fromAtomEntry);
  }
  throw new Error("Format de flux non reconnu (ni RSS 2.0 ni Atom)");
}

/** Nettoie un fragment HTML : balises supprimées, entités décodées. */
export function stripHtml(html: string, maxLength = 400): string {
  const text = html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;|&rsquo;|&#8217;/gi, "’")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}
