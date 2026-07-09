/**
 * Chrome commun du site : barre haute, navigation, pied de page.
 */
import { ORGANIZATIONS } from "../collector/sources.ts";

export function TopBar() {
  return (
    <div class="topbar">
      <span>
        <b>CNRS//FLUX</b> — agrégateur d'actualité scientifique
      </span>
      <span class="right">
        <span>SYNC AUTO /30 MIN</span>
        <span>DENO·FRESH·HONO·KV</span>
      </span>
    </div>
  );
}

export function Nav({ active }: { active: "actualites" | "sources" }) {
  return (
    <nav class="nav">
      <a
        href="/"
        class={`navlink ${active === "actualites" ? "active" : ""}`}
      >
        ▸ Actualités
      </a>
      <a
        href="/sources"
        class={`navlink ${active === "sources" ? "active" : ""}`}
      >
        ▸ Sources
      </a>
      <a href="/api/stats" class="navlink">▸ API</a>
      <span class="grow" />
      {ORGANIZATIONS.map((org) => (
        <span
          key={org.id}
          class={`orgchip ${org.enabled ? "on" : ""}`}
          title={org.enabled
            ? org.fullName
            : `${org.fullName} — bientôt disponible`}
        >
          {org.enabled ? <b>● {org.name}</b> : <>○ {org.name}</>}
        </span>
      ))}
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer>
      <span>
        <span class="barcode" /> CNRS//FLUX
      </span>
      <span>Données : flux RSS publics du CNRS</span>
      <span>
        Propulsé par{" "}
        <a href="https://deno.com" target="_blank" rel="noopener">Deno 2</a>
        {" / "}
        <a href="https://fresh.deno.dev" target="_blank" rel="noopener">
          Fresh
        </a>
        {" / "}
        <a href="https://hono.dev" target="_blank" rel="noopener">Hono</a>
        {" / Deno KV"}
      </span>
    </footer>
  );
}
