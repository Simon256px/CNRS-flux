# CNRS//FLUX

> L'actualité scientifique française au même endroit, collectée toute seule.

CNRS//FLUX agrège les actualités d'une vingtaine d'organismes de recherche et de
médias scientifiques — CNRS Le Journal, Inserm, CEA, CERN, ESA, IRD, IPGP,
Gustave Roussy, Météo-France, Observatoire de Paris, Université Paris-Saclay,
The Conversation, Reporterre, Vert, Bon Pote, Splann!, AFIS, Sciences Humaines…
Les articles sont collectés automatiquement, indexés dans Deno KV, et se
cherchent et se filtrent par organisme, région ou thème.

En ligne sur **[flux.simoncourtois.com](https://flux.simoncourtois.com/)**.

Construit entièrement sur l'écosystème Deno : Deno 2,
[Fresh 2](https://fresh.deno.dev) (rendu serveur et îlots),
[Hono](https://hono.dev) (API), Deno KV (stockage), `Deno.cron()` (collecte
planifiée), paquets JSR.

## Sommaire

- [Démarrage](#démarrage)
- [Fonctionnement](#fonctionnement)
- [API](#api)
- [Sources](#sources)
- [Ajouter une source](#ajouter-une-source)
- [Structure](#structure)
- [Déploiement](#déploiement)
- [Contribuer](#contribuer)
- [Soutenir le projet](#soutenir-le-projet)
- [Licence](#licence)

## Démarrage

Prérequis : [Deno](https://deno.com) 2.x.

```sh
git clone https://github.com/Simon256px/CNRS-flux.git
cd CNRS-flux
deno task dev            # http://localhost:8000, collecte initiale au démarrage
```

| Commande            | Rôle                                          |
| ------------------- | --------------------------------------------- |
| `deno task dev`     | serveur de développement avec rechargement    |
| `deno task collect` | lance une collecte unique, puis s'arrête      |
| `deno task build`   | build de production dans `_fresh/`            |
| `deno task start`   | sert le build de production                   |
| `deno task check`   | `deno fmt --check`, `deno lint`, `deno check` |

Aucune configuration n'est nécessaire : la base Deno KV est créée au premier
lancement.

| Variable        | Rôle                                                               |
| --------------- | ------------------------------------------------------------------ |
| `KV_PATH`       | emplacement de la base Deno KV (par défaut, celui choisi par Deno) |
| `COLLECT_TOKEN` | active `POST /api/collect` ; sans lui, l'endpoint reste fermé      |

## Fonctionnement

1. `Deno.cron` déclenche la collecte toutes les 30 minutes, ainsi qu'au
   démarrage si les données ont plus de 30 minutes. Les flux sont téléchargés
   avec une concurrence bornée et un GET conditionnel (`ETag` /
   `Last-Modified`).
2. Chaque article est parsé (RSS 2.0 ou Atom), nettoyé du HTML, rattaché à ses
   thèmes, et enrichi d'une image Open Graph si le flux n'en fournit pas.
3. L'insertion est atomique et dédupliquée : la clé est un hash SHA-256 du
   `guid` ou du lien, et un article déjà connu est ignoré.
4. Les clés `["articles_by_date", invTs, id]` donnent un parcours
   antéchronologique naturel ; l'API filtre et pagine par-dessus.

## API

| Endpoint            | Description                                                        |
| ------------------- | ------------------------------------------------------------------ |
| `GET /api/articles` | `q`, `org`, `kind`, `source`, `region`, `theme`, `limit`, `offset` |
| `GET /api/sources`  | organismes, sources actives, état de collecte, facettes            |
| `GET /api/stats`    | compteurs globaux, dernière synchronisation, planification         |
| `POST /api/collect` | collecte manuelle, avec `Authorization: Bearer $COLLECT_TOKEN`     |

## Sources

**CNRS** : CNRS Le Journal, avec ses rubriques rattachées aux thèmes.

**Organismes de recherche** : Inserm (actualités et salle de presse), CEA, CERN,
ESA (actualités et Webb), IRD, IPGP, Gustave Roussy, Météo-France, Observatoire
de Paris, Université Paris-Saclay.

**Médias** : Futura Sciences (contenu sponsorisé filtré), The Conversation
France, et des médias indépendants dont la structure a été vérifiée sur leurs
mentions légales : Reporterre, Vert, Bon Pote, Splann!, AFIS, Sciences Humaines.

**Déclarées mais désactivées**, faute de flux RSS exploitable : CNES, Institut
Pasteur, INRAE, IFREMER, BRGM, ANSES, Institut Curie, Inria, Sorbonne
Université, ainsi que les instituts et délégations régionales du CNRS, dont les
anciens flux sont figés.

## Ajouter une source

Tout passe par le registre [`collector/sources.ts`](collector/sources.ts) ;
collecteur, API et interface prennent une nouvelle entrée en compte d'eux-mêmes.

- **Flux CNRS ou laboratoire** : une entrée
  `cnrs({ id, kind, name, shortName, host, region?, themes? })`, avec
  `kind: "laboratoire"` pour un labo.
- **Nouvel organisme** : passer son entrée `ORGANIZATIONS` à `enabled: true`,
  puis déclarer ses sources avec `org: "<id>"`. Le filtre par organisme apparaît
  tout seul.
- **Nouveaux thèmes** : compléter `THEMES` et `THEME_ALIASES`, qui associent les
  catégories brutes des flux aux thèmes du site.

## Structure

```
collector/
  sources.ts       registre des organismes, flux, régions et thèmes
  parser.ts        parsing RSS 2.0 / Atom
  rss.ts           téléchargement conditionnel, normalisation, og:image, déduplication
  cron.ts          Deno.cron et collecte initiale
lib/
  kv.ts            couche Deno KV (index antéchronologique, déduplication)
  feed.ts          lecture filtrée et paginée, facettes, cache
  search.ts        recherche plein texte, accents ignorés
routes/
  index.tsx        accueil et explorateur d'actualités
  sources.tsx      tableau de bord des flux
  api/[...path].ts API Hono montée sous /api
islands/           explorateur interactif
components/        habillage du site, carte article
static/            CSS, polices auto-hébergées
deploy/            service et timer systemd de déploiement automatique
```

## Design

Interface sombre façon « terminal scientifique » : vert phosphore sur fond quasi
noir, IBM Plex Mono pour la donnée, Space Grotesk pour les titres, tuiles
typographiques pour les articles sans visuel. Polices auto-hébergées, aucune
dépendance front externe.

## Déploiement

Le site tourne sur un serveur Fedora comme service systemd. Le timer
`deploy/cnrs-flux-autodeploy.timer` vérifie toutes les 2 minutes si un commit
est arrivé sur `main` ; si oui, le script `deploy/cnrs-flux-autodeploy` tire le
code, construit, puis redémarre le service. Si le build échoue, l'ancienne
version continue de tourner.

## Contribuer

Une source à proposer, un flux cassé, un bug ? Tout est expliqué dans
[CONTRIBUTING.md](CONTRIBUTING.md).

## Soutenir le projet

CNRS//FLUX est gratuit, sans publicité ni pistage. S'il vous est utile, vous
pouvez me soutenir sur [ko-fi.com/simon256px](https://ko-fi.com/simon256px).

## Licence

Code distribué sous [licence MIT](LICENSE). Les articles agrégés restent la
propriété de leurs éditeurs : le site n'en affiche que le titre, le résumé
publié dans le flux, l'image d'aperçu et un lien vers l'original.
