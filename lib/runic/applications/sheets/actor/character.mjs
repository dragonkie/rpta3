import PtaCharacterSheet from "../../../../../module/applications/sheets/actor/character.mjs";
import { PTA } from "../../../../../module/helpers/config.mjs";

export default class rPtaCharacterSheet extends PtaCharacterSheet {

    static PARTS = {
        body: { template: `${this.TEMPLATE_PATH}/actor/character/body.hbs`, scrollable: [".tab"] },
        // Tab bodies
        features: { template: `${this.TEMPLATE_PATH}/actor/shared/features.hbs`, scrollable: [".tab"] },
        inventory: { template: `${this.TEMPLATE_PATH}/actor/shared/inventory.hbs`, scrollable: [".tab", ".pta-inventory"] },
        pokebox: { template: `${this.TEMPLATE_PATH}/actor/character/pokemon.hbs`, scrollable: [".tab", ".pta-pc-entries"] },
        effects: { template: `${this.TEMPLATE_PATH}/actor/parts/actor-effects.hbs`, scrollable: [".tab"] },
        details: { template: `${this.TEMPLATE_PATH}/actor/character/details.hbs`, scrollable: [".tab"] },
        combat: { template: `systems/${PTA.SystemId}/lib/runic/templates/actor/shared/combat.hbs`, scrollable: [".tab"] },
    }
}