# Contribuer à CNRS//FLUX

Merci de votre intérêt. Les contributions les plus utiles sont souvent les plus
simples : signaler un flux cassé, proposer une source, corriger un thème mal
attribué.

## Signaler un problème

Ouvrez une [issue](https://github.com/Simon256px/CNRS-flux/issues) avec :

- ce que vous avez fait, ce que vous attendiez et ce qui s'est passé ;
- la page ou l'URL de l'API concernée ;
- pour un article mal classé ou absent : sa source et son lien d'origine.

## Proposer une source

Une source doit avoir un flux RSS ou Atom public, vivant (publications récentes)
et en lien avec la recherche ou la vulgarisation scientifique. Dans l'issue,
indiquez :

- l'organisme ou le média, et l'adresse du flux ;
- pour un média, qui le possède ou le finance (lien vers ses mentions légales) :
  le site privilégie les organismes publics et les médias indépendants.

Les sources déclarées mais désactivées dans `collector/sources.ts` le sont faute
de flux exploitable. Si l'une d'elles en publie un de nouveau, c'est une très
bonne contribution.

## Mettre en place l'environnement

Prérequis : [Deno](https://deno.com) 2.x.

```sh
git clone https://github.com/Simon256px/CNRS-flux.git
cd CNRS-flux
deno task dev
```

Le site est sur http://localhost:8000. La collecte initiale se lance au
démarrage ; la base Deno KV locale peut être supprimée sans risque.

## Où va quoi

| Vous voulez…                         | Fichier                                   |
| ------------------------------------ | ----------------------------------------- |
| Ajouter ou activer une source        | `collector/sources.ts`                    |
| Corriger l'attribution des thèmes    | `THEMES` et `THEME_ALIASES`, même fichier |
| Corriger le parsing d'un flux        | `collector/parser.ts`, `collector/rss.ts` |
| Modifier la recherche ou les filtres | `lib/search.ts`, `lib/feed.ts`            |
| Modifier l'API                       | `routes/api/[...path].ts`                 |
| Modifier l'interface                 | `routes/`, `islands/`, `components/`      |
| Modifier l'apparence                 | `static/`                                 |

## Avant d'ouvrir une pull request

```sh
deno task check     # deno fmt --check, deno lint, deno check
deno task collect   # si vous avez touché au collecteur ou aux sources
deno task build
```

Puis :

- une pull request, un sujet ;
- une description qui dit ce qui change et pourquoi ;
- pas de nouvelle dépendance front : le site n'en a aucune et doit le rester ;
- pas de pistage, de cookie publicitaire ni de script tiers.

## Licence

En contribuant, vous acceptez que votre code soit distribué sous la
[licence MIT](LICENSE) du projet.

## Soutenir le projet

Pas le temps de contribuer ? Vous pouvez aussi soutenir CNRS//FLUX sur
[ko-fi.com/simon256px](https://ko-fi.com/simon256px).
