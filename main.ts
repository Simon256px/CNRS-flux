import { App, staticFiles } from "fresh";
import type { State } from "./utils.ts";
import { registerCron } from "./collector/cron.ts";

export const app = new App<State>();

app.use(staticFiles());

// Routes basées sur le système de fichiers (routes/, islands/).
app.fsRoutes();

// Collecte planifiée (Deno.cron nécessite --unstable-cron ; absent lors
// du build statique, d'où la garde).
if (typeof Deno.cron === "function") {
  registerCron();

  // `deno serve` n'installe pas de gestionnaire de signal, et Deno.cron()
  // maintient la boucle d'événements vivante : le processus ne quittait donc
  // ni sur SIGTERM ni sur SIGINT, et systemd l'abattait après le
  // TimeoutStopSec (core dump à chaque redéploiement).
  for (const signal of ["SIGINT", "SIGTERM"] as const) {
    Deno.addSignalListener(signal, () => Deno.exit(0));
  }
}
