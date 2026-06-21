import rPtaActorSheet from "./sheets/actor.mjs";
import rPtaCharacterSheet from "./sheets/actor/character.mjs";
import rPtaCompanionSheet from "./sheets/actor/companion.mjs";
import rPtaRuneSheet from "./sheets/item/rune.mjs";

import baseSheets from "../../../module/applications/_module.mjs"

baseSheets.sheets.actor.config.character.application = rPtaCharacterSheet;
baseSheets.sheets.actor.config.companion.application = rPtaCompanionSheet;
baseSheets.sheets.item.config.rune = {
    application: rPtaRuneSheet,
    options: {
        label: 'TYPES.Item.rune',
        types: ['rune']
    }
}

console.log(baseSheets);

export default baseSheets;