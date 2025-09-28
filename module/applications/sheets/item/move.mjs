import PtaItemSheet from "../item.mjs";

export default class PtaMoveSheet extends PtaItemSheet {
    static DEFAULT_OPTIONS = {
        classes: ["move"],
    }

    static get PARTS() {
        let p = super.PARTS;
        p.settings = { template: "systems/rpta3/templates/item/settings/move.hbs" };
        return p;
    }
}