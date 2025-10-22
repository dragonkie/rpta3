import PtaItemSheet from "../item.mjs";
import utils from "../../../helpers/utils.mjs";
import { PTA } from "../../../helpers/config.mjs";
import PtaDialog from "../../dialog.mjs";

export default class PtaRuneSheet extends PtaItemSheet {
    static DEFAULT_OPTIONS = {
        classes: ["rune"],
        actions: {
            editAttack: this._onEditAttackFields,
            editDamage: this._onEditDamageFields,
            editDodge: this._onEditDodgeFields,
            editDefence: this._onEditDefenceFields,
        }
    }

    static get PARTS() {
        let p = super.PARTS;
        p.settings = { template: "systems/rpta3/templates/item/settings/rune.hbs" };
        return p;
    }

    static async _onEditAttackFields(event, target) {
        let content = `<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">`;

        for (const key of Object.keys(this.document.system.attack)) {
            let label = utils.localize(PTA.pokemonTypes[key]) || "MISSING";
            let value = this.document.system.attack[key];

            let ele = new foundry.data.fields.NumberField({
                name: key,
                label: label,
                initial: value,
                required: true,
                blank: false,
            }).toFormGroup({}, {name: key});

            content += ele.outerHTML;
        }
        content += '</div>';

        let app = await new PtaDialog({
            window: { title: 'ATTACK MODIFIERS' },
            id: `Item.${this.document.id}.attack-config`,
            content: content,
            classes: ['pta'],
            buttons: [{
                action: 'cancel',
                label: 'Cancel'
            }, {
                action: 'confirm',
                label: 'Confirm'
            }],
            submit: result => {
                if (result != 'confirm') return;
                const data = {};
                const inputs = app.element.querySelectorAll('input');

                for (const input of inputs) {
                    let n = input.name;
                    let v = Number(input.value);
                    if (v == 0) continue;
                    data[n] = v;
                }

                this.document.update({ system: { attack: data } });
            }
        }).render(true);
    }

    static async _onEditDamageFields(event, target) {

    }

    static async _onEditDodgeFields(event, target) {

    }

    static async _onEditDefenceFields(event, target) {

    }
}