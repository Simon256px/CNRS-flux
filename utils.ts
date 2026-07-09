import { createDefine } from "fresh";

// État partagé entre middlewares, layouts et routes (vide pour l'instant).
export type State = Record<string, unknown>;

export const define = createDefine<State>();
