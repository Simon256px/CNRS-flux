import { define } from "../utils.ts";

export default define.page(function App({ Component }) {
  return (
    <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>CNRS//FLUX — Agrégateur d'actualité scientifique</title>
        <meta
          name="description"
          content="L'actualité de la recherche française et européenne — CNRS, Inserm, Inria, CEA, CERN — agrégée, recherchable et filtrable."
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link
          rel="preload"
          href="/fonts/space-grotesk.woff2"
          as="font"
          type="font/woff2"
          crossorigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/ibm-plex-mono-400.woff2"
          as="font"
          type="font/woff2"
          crossorigin="anonymous"
        />
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
});
