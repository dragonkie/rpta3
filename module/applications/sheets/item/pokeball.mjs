import PtaItemSheet from "../item.mjs";

export default class PtaPokeballSheet extends PtaItemSheet {
    static DEFAULT_OPTIONS = {
        classes: ["pokeball"],
    }

    static get PARTS() {
        let p = super.PARTS;
        p.settings = { template: "systems/rpta3/templates/item/settings/pokeball.hbs" };
        return p;
    }
}