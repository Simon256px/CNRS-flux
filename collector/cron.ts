/**
 * Planification de la collecte.
 *
 * - `registerCron()` : appelé au démarrage du serveur (main.ts). Enregistre
 *   la tâche Deno.cron (toutes les 30 min) et lance une collecte initiale
 *   si la dernière remonte à plus de 30 min (ou n'a jamais eu lieu).
 * - `deno task collect` : exécute ce module directement pour une collecte
 *   unique (utile en développement ou dans un job externe).
 */
import { listFeedMeta } from "../lib/kv.ts";
import { collectAll } from "./rss.ts";

export const CRON_SCHEDULE = "*/30 * * * *";
const STALE_AFTER_MS = 30 * 60 * 1000;

export function registerCron(): void {
  Deno.cron("collecte des flux CNRS", CRON_SCHEDULE, async () => {
    await collectAll();
  });

  // Collecte initiale en arrière-plan si les données sont vides ou périmées.
  queueMicrotask(async () => {
    const metas = await listFeedMeta();
    const lastFetch = Math.max(0, ...metas.map((m) => m.lastFetchAt));
    if (Date.now() - lastFetch > STALE_AFTER_MS) {
      console.log("[collect] données absentes ou périmées → collecte initiale");
      await collectAll();
    }
  });
}

if (import.meta.main) {
  await collectAll();
  Deno.exit(0);
}
