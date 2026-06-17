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
        const result = await new Promise((resolve, reject) => {
            new PtaDialog({
                render: true,
                window: { title: "PTA.windowTitle.AddRule" },
                id: `Item.${this.document.id}.add-ruleset`,
                classes: ['pta3'],
                buttons: [{
                    action: 'create',
                    label: 'Create'
                }],
                submit: (result, dialog) => {
                    resolve(dialog.element.querySelector('input:checked').value);
                },
                content: `
                    <div class="flexcol flex-gap-m">
                        <p>Select a ruleset</p>

                        <div class="flexrow">
                            <input style="min-height: 1em; flex: 0" type="radio" name="type" value="behaviour">
                            <label>Behaviour</label>
                        </div>

                        <div class="flexrow">
                            <input style="min-height: 1em; flex: 0" type="radio" name="type" value="attribute">
                            <label>Attribute</label>
                        </div>

                        <div class="flexrow">
                            <input style="min-height: 1em; flex: 0" type="radio" name="type" value="stat">
                            <label>Stat</label>
                        </div>

                        <div class="flexrow">
                            <input style="min-height: 1em; flex: 0" type="radio" name="type" value="skill">
                            <label>Skill</label>
                        </div>

                        <div class="flexrow">
                            <input style="min-height: 1em; flex: 0" type="radio" name="type" value="resist">
                            <label>Resistance</label>
                        </div>

                        <div class="flexrow">
                            <input style="min-height: 1em; flex: 0" type="radio" name="type" value="requirement">
                            <label>Requirement</label>
                        </div>
                    </div>
                `,
            }).render(true);

        })

        switch (result) {
            case 'attribute': this.document.update({ system: { attributes: [...this.document.system.attributes, { attribute: "hp", value: 0, method: "add" }] } }); break;
            case 'stat': this.document.update({ system: { stats: [...this.document.system.stats, { stat: "atk", value: 0, method: "add" }] } }); break;
            case 'skill': break;
            default: break;
        }
    }

    static async _onRemoveRule(event, target) {
        const ruleset = target.closest('[data-ruleset]').dataset?.ruleset;
        const index = target.closest('[data-rule-index').dataset?.ruleIndex;

        if (!ruleset || !index) throw new Error("Failed to find rule to delete");
        console.log("Removing rule from " + ruleset + " in position " + index, this.document.system[ruleset][index]);
        
        this.document.system[ruleset].splice(index, 1)
        this.document.update({
            system: {
                [ruleset]: this.document.system[ruleset]
            }
        })
    }
}