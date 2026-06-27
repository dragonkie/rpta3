// Augments DataModel config to use new features from runic systems

import * as models from "../../../module/data/_module.mjs";
import rPtaMoveData from "./item/move.mjs";
import rPtaRuneData from "./item/rune.mjs";

export const ActorModels = models.ActorModels;
export const ActorConfig = models.ActorConfig;
export const ItemModels = models.ItemModels;
export const ItemConfig = { ...models.ItemConfig, rune: rPtaRuneData, move: rPtaMoveData };
