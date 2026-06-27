import PtaPokemonSheet from "../../../../../module/applications/sheets/actor/pokemon.mjs";
import { PTA } from "../../../../../module/helpers/config.mjs";

export default class rPtaCompanionSheet extends PtaPokemonSheet {

    static PARTS = {
        body: { template: `${this.TEMPLATE_PATH}/actor/pokemon/body.hbs` },
        features: { template: `${this.TEMPLATE_PATH}/actor/pokemon/features.hbs` },
        combat: { template: `systems/${PTA.SystemId}/lib/runic/templates/actor/shared/combat.hbs`, scrollable: [".tab"] },
        effects: { template: `${this.TEMPLATE_PATH}/actor/parts/actor-effects.hbs` },
        pokedex: { template: `${this.TEMPLATE_PATH}/actor/pokemon/pokedex.hbs` },
        details: { template: `${this.TEMPLATE_PATH}/actor/pokemon/details.hbs` },
        runes: { template: `${this.TEMPLATE_PATH}/actor/pokemon/runes.hbs` },
    }

    static TABS = {
        features: { id: "features", group: "primary", label: "PTA.Tab.Features", icon: "fa-user" },
        combat: { id: "combat", group: "primary", label: "PTA.Tab.Combat", icon: "fa-sword" },
        runes: { id: "runes", group: "primary", label: "PTA.Tab.Runes", icon: "fa-gem" },
        effects: { id: "effects", group: "primary", label: "PTA.Tab.Effects", icon: "fa-sparkles" },
        details: { id: "details", group: "primary", label: "PTA.Tab.Details", icon: "fa-book" },
        pokedex: { id: "pokedex", group: "primary", label: "PTA.Tab.Pokedex", icon: "fa-circle-info" },
    }
}