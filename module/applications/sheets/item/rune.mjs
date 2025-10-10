import PtaItemSheet from "../item.mjs";

export default class PtaRuneSheet extends PtaItemSheet {
    static DEFAULT_OPTIONS = {
        classes: ["rune"],
    }

    static get PARTS() {
        let p = super.PARTS;
        p.settings = { template: "systems/rpta3/templates/item/settings/rune.hbs" };
        return p;
    }
}