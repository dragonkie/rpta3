import utils from "../../../helpers/utils.mjs";
import PtaDialog from "../../dialog.mjs";
import PtaItemSheet from "../item.mjs";
import { PTA } from "../../../helpers/config.mjs";

export default class PtaEquipmentSheet extends PtaItemSheet {
    static DEFAULT_OPTIONS = {
        classes: ["equipment"],
        actions: {
            createModifier: this._onCreateRule,
            remove: this._onRemoveRule
        }
    }

    static get PARTS() {
        let p = super.PARTS;
        p.settings = { template: `${this.TEMPLATE_PATH}/item/settings/equipment.hbs` };
        return p;
    }

    static async _onCreateRule() {
        console.log("Adding new item rule", this.document)
        const newRules = [
            ...this.document.system.rules,
            {
                name: 'New rule',
                uuid: foundry.utils.randomID(),
                active: true,
                surpressed: false,
                priority: 0,
                type: 'stat',
                keys: { stat: 'hp' },
                method: 'add',
                value: 0,
                formula: ''
            }]
        this.document.update({
            system: {
                rules: newRules
            }
        })
    }

    static async _onRemoveRule(event, target) {
        const index = target.closest('[data-rule-index').dataset?.ruleIndex;

        if (!index) throw new Error("Failed to find rule to delete");

        this.document.system.rules.splice(index, 1)
        this.document.update({
            system: {
                rules: this.document.system.rules
            }
        })
    }
}