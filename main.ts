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
}
