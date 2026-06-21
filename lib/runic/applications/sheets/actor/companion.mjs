import PtaPokemonSheet from "../../../../../module/applications/sheets/actor/pokemon.mjs";
import { PTA } from "../../../../../module/helpers/config.mjs";

export default class rPtaCompanionSheet extends PtaPokemonSheet {

    static PARTS = {
        body: { template: `${this.TEMPLATE_PATH}/actor/pokemon/body.hbs` },
        features: { template: `${this.TEMPLATE_PATH}/actor/pokemon/features.hbs` },
        combat: { template: `systems/${PTA.SystemId}/lib/runic/actor/shared/combat.hbs`, scrollable: [".tab"] },
        effects: { template: `${this.TEMPLATE_PATH}/actor/parts/actor-effects.hbs` },
        pokedex: { template: `${this.TEMPLATE_PATH}/actor/pokemon/pokedex.hbs` },
        details: { template: `${this.TEMPLATE_PATH}/actor/pokemon/details.hbs` },
        runes: { template: `${this.TEMPLATE_PATH}/actor/pokemon/runes.hbs` },
    }

}