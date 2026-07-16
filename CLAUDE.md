# CLAUDE.md — CNRS//FLUX

Agrégateur d'actualité scientifique (CNRS, Inserm, Inria, CEA, CERN), 100 %
écosystème Deno : Deno 2, Fresh 2 (builder, pas Vite), Hono, Deno KV,
`Deno.cron()`, packages JSR. En ligne : https://cnrs-flux.simon256px.deno.net
(Deno Deploy, auto-déploiement à chaque push sur `main`).

## Commandes

```sh
deno task dev      # serveur de dev (http://localhost:8000, collecte initiale auto)
deno task collect  # collecte manuelle unique des flux
deno task check    # fmt --check + lint + typecheck — DOIT passer avant commit
deno task build    # build de production (_fresh/)
```

## Architecture (règles du projet)

- `collector/sources.ts` est le **registre unique** : tout organisme/flux
  s'ajoute là, le collecteur, l'API et l'UI suivent automatiquement.
- Les compteurs affichés viennent de KV (`lib/feed.ts` `countAll`/
  `countBySource`), **jamais** des compteurs incrémentaux de `feed_meta` (ils
  sous-comptent quand un isolate serverless est recyclé en pleine collecte).
- Insertion d'articles : dédup **atomique** sur hash SHA-256 du guid/lien
  (`lib/kv.ts saveArticle`). Clés `["articles_by_date", invTs, id]` pour le
  parcours antéchronologique.
- Le démarrage ne doit jamais échouer à cause de KV ou du réseau : la collecte
  initiale est enveloppée dans un try/catch (`collector/cron.ts`).
- UI : CSS artisanal dans `static/styles.css` (design « terminal scientifique »
  : vert phosphore sur quasi-noir, IBM Plex Mono pour la donnée, Space Grotesk
  pour les titres). Pas de Tailwind, pas de dépendance front externe, fontes
  auto-hébergées.
- Le linter Fresh interdit `//` littéral dans les nœuds texte JSX : utiliser la
  constante `SLASHES` de `lib/display.ts`.
- Textes UI et commentaires en français.

---

# Behavioral guidelines

Behavioral guidelines to reduce common LLM coding mistakes. Merge with
project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial
tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes,
simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it
work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer
rewrites due to overcomplication, and clarifying questions come before
implementation rather than after mistakes.

Source :
[forrestchang/andrej-karpathy-skills](https://github.com/forrestchang/andrej-karpathy-skills)
