# CNRS//FLUX

**🌐 Site en ligne : <https://cnrs-flux.imocourtois.deno.net>**

Agrégateur d'actualité scientifique du CNRS — instituts, délégations régionales
et CNRS Le Journal — collectée automatiquement, indexée dans Deno KV,
recherchable et filtrable.

**100 % écosystème Deno** : Deno 2, [Fresh 2](https://fresh.deno.dev) (SSR +
islands), [Hono](https://hono.dev) (API), Deno KV (stockage), `Deno.cron()`
(collecte planifiée), packages JSR.

<img width="1346" height="948" alt="flux" src="https://github.com/user-attachments/assets/627012ee-4ae2-4729-838a-86f9a6a992d5" />

## Démarrage

```sh
# Serveur de développement (collecte initiale automatique au démarrage)
deno task dev            # → http://localhost:8000

# Collecte manuelle unique
deno task collect

# Production
deno task build
deno task start

# Qualité
deno task check          # fmt + lint + typecheck
```

Aucune configuration requise : la base Deno KV est créée au premier lancement
(chemin surchargeable via la variable d'environnement `KV_PATH`).

## Architecture

```
collector/
  sources.ts    Registre des sources : organismes, flux, régions, thèmes
  parser.ts     Parsing RSS 2.0 / Atom (@libs/xml) → format neutre
  rss.ts        Téléchargement (GET conditionnel ETag/Last-Modified),
                normalisation, enrichissement og:image, dédup atomique
  cron.ts       Deno.cron (toutes les 30 min) + collecte initiale
lib/
  types.ts      Types partagés (Organization, Source, Article, …)
  kv.ts         Couche Deno KV (index antéchronologique, dédup, meta)
  feed.ts       Lecture filtrée/paginée du fil + facettes + cache
  search.ts     Recherche plein texte (accents ignorés, score de pertinence)
  display.ts    Helpers d'affichage partagés SSR/îles
routes/
  index.tsx     Accueil : hero télémétrie + explorateur d'actualités
  sources.tsx   Tableau de bord du réseau de flux
  api/[...path].ts  API Hono montée sous /api
islands/
  NewsExplorer.tsx  Console de recherche + grille (fetch /api/articles)
components/     Chrome du site, carte article
static/         CSS, fontes auto-hébergées, favicon
```

### Flux de données

1. `Deno.cron` (ou le démarrage si les données ont plus de 30 min) déclenche
   `collectAll()` : les 28 flux sont téléchargés avec une concurrence bornée et
   un GET conditionnel (`ETag`/`Last-Modified`).
2. Chaque item est parsé, nettoyé (HTML → texte), rattaché à ses thèmes
   canoniques, enrichi d'une image Open Graph si le flux n'en fournit pas.
3. L'insertion est **atomique et dédupliquée** : la clé primaire est un hash
   SHA-256 du `guid`/lien ; un article déjà connu est ignoré.
4. Les clés `["articles_by_date", invTs, id]` donnent un parcours
   antéchronologique naturel ; l'API filtre/pagine par-dessus.

### API

| Endpoint            | Description                                                        |
| ------------------- | ------------------------------------------------------------------ |
| `GET /api/articles` | `q`, `org`, `kind`, `source`, `region`, `theme`, `limit`, `offset` |
| `GET /api/sources`  | Organismes, sources actives, état de collecte, facettes            |
| `GET /api/stats`    | Compteurs globaux, dernière synchro, planification                 |
| `POST /api/collect` | Déclenche une collecte manuelle                                    |

## Sources suivies (28)

- **National** : actualités cnrs.fr
- **CNRS Le Journal** (rubriques mappées vers les thèmes)
- **10 instituts** : INSB, INC, INEE, INSHS, INS2I, INSIS, INSMI, INP, IN2P3,
  INSU
- **16 délégations régionales** : Alsace, Alpes, Aquitaine, Centre-Est, Centre
  Limousin Poitou-Charentes, Côte d'Azur, Hauts-de-France, Île-de-France (Gif,
  Meudon, Villejuif), Normandie, Occitanie Est/Ouest, Paris-Centre, Provence et
  Corse, Rhône Auvergne

## Étendre l'agrégateur

Tout passe par le registre [`collector/sources.ts`](collector/sources.ts) :

- **Ajouter un flux CNRS** : une entrée
  `cnrs({ id, kind, name, shortName,
  host, region?, themes? })` suffit —
  collecteur, API et UI le prennent en compte automatiquement.
- **Ajouter un laboratoire** : même chose avec `kind: "laboratoire"`.
- **Ajouter un organisme (Inserm, Inria, CEA, …)** : passer son entrée
  `ORGANIZATIONS` à `enabled: true` puis déclarer ses sources avec
  `org: "<id>"`. Les filtres par organisme apparaissent d'eux-mêmes.
- **Nouveaux thèmes** : compléter `THEMES` et `THEME_ALIASES` (mapping des
  catégories brutes des flux vers les thèmes canoniques).

## Design

Interface sombre « terminal scientifique » : fond quasi-noir teinté de vert,
vert phosphore, IBM Plex Mono pour la donnée (badges, télémétrie, filtres),
Space Grotesk pour les titres, grille de fond, repères `+` et tuiles
typographiques pour les articles sans visuel. Fontes auto-hébergées (latin),
aucune dépendance front externe.
