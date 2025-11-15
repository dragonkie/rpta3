import PtaItemSheet from "../item.mjs";
import utils from "../../../helpers/utils.mjs";
import { PTA } from "../../../helpers/config.mjs";
import PtaDialog from "../../dialog.mjs";

export default class PtaRuneSheet extends PtaItemSheet {
    /** @override */
    static DEFAULT_OPTIONS = {
        classes: ["rune"],
        actions: {
            editAttack: this._onEditAttackFields,
            editDamage: this._onEditDamageFields,
            editDodge: this._onEditDodgeFields,
            editDefence: this._onEditDefenceFields,
            editResist: this._onEditResistanceFields,
            removeMod: this._onRemoveModifier,
        }
    }

    static get PARTS() {
        let p = super.PARTS;
        p.settings = { template: "systems/rpta3/templates/item/settings/rune.hbs" };
        return p;
    }

    /** @override */
    async _prepareContext() {
        const context = await super._prepareContext();

        context.fields = {
            stats: {}
        };
        for (const [key, stat] of Object.entries(this.document.system.stats)) {
            context.fields.stats[key] = {
                method: `stats.${key}.method`,
                value: `stats.${key}.value`,
                label: utils.localize(PTA.stats[key])
            };
        }

        return context;
    }

    static async _onEditAttackFields(event, target) {
        const context = {
            path: "system.attack",
            fields: {}
        };

        for (const [key, value] of Object.entries(this.document.system.attack)) {
            let label = utils.localize(PTA.pokemonTypes[key]) || key;
            context.fields[key] = { label: label, value: value };
        }

        // render the template
        return this._configDialogRender(context, { title: "PTA.Dialog.ConfigAttack", id: "" });
    }

    static async _onEditDamageFields(event, target) {
        const context = {
            path: "system.damage",
            fields: {}
        };

        for (const [key, value] of Object.entries(this.document.system.damage)) {
            let label = utils.localize(PTA.pokemonTypes[key]) || key;
            context.fields[key] = { label: label, value: value };
        }

        // render the template
        return this._configDialogRender(context, { title: "PTA.Dialog.ConfigDamage", id: "" });
    }

    static async _onEditDodgeFields(event, target) {
        const context = {
            path: "system.dodge",
            fields: {}
        };

        for (const [key, value] of Object.entries(this.document.system.dodge)) {
            let label = utils.localize(PTA.pokemonTypes[key]) || key;
            context.fields[key] = { label: label, value: value };
        }

        // render the template
        return this._configDialogRender(context, { title: "PTA.Dialog.ConfigDodge", id: "" });
    }

    static async _onEditDefenceFields(event, target) {
        const context = {
            path: "system.defence",
            fields: {}
        };

        for (const [key, value] of Object.entries(this.document.system.defence)) {
            let label = utils.localize(PTA.pokemonTypes[key]) || key;
            context.fields[key] = { label: label, value: value };
        }

        // render the template
        return this._configDialogRender(context, { title: "PTA.Dialog.ConfigDefence", id: "" });
    }

    /**
     * Renders the generic config dialog used for most data arrays
     * @param {Object} context 
     * @param {Object} options 
     */
    async _configDialogRender(context, options) {
        const template = await foundry.applications.handlebars.renderTemplate(PTA.templates.dialog.runeCombatFields, context);
        const app = await new PtaDialog({
            window: { title: utils.localize(options.title) },
            id: options.id,
            content: template,
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
                    let v = input.value;
                    data[n] = v;
                }

                this.document.update(data);
            }
        }).render(true);
    }

    /**
     * Renders dialog popup for the resistance override configuration
     * only saves values other than "none" afterwards
     * @param {Event} event 
     * @param {HTMLElement} target 
     */
    static async _onEditResistanceFields(event, target) {
        const context = {
            config: PTA,
            path: "system.resistance_override",
            fields: {}
        };

        //Get a list from pokemon types
        for (const [key, value] of Object.entries(PTA.pokemonTypes)) {
            const label = utils.localize(value);

            // check if this value exists in the system overrides
            let v = 'none';
            let arr = this.document.system.resistance_override

            for (const entry of arr) {
                if (entry.type == key) v = entry.value;
            }

            // save the value
            context.fields[key] = { label: label, value: v };
        }

        const template = await utils.renderTemplate(PTA.templates.dialog.configResistanceOverride, context);

        let app = await new PtaDialog({
            window: { title: 'PTA.Title.ConfigResist' },
            id: `Actor.${this.document.id}.resist-config`,
            content: template,
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
                const list = [];
                let inputs = app.element.querySelectorAll('[data-type]');

                for (const input of inputs) {
                    let t = input.dataset.type;
                    let v = input.querySelector('select').value;
                    if (v == PTA.resistanceKeys.none) continue;
                    list.push({ type: t, value: v });
                }
                console.log('updating rune resistances', list)
                console.log(inputs)
                this.document.update({ system: { resistance_override: list } });
            }
        }).render(true);

        console.log('resist config context', context);
    }

    /**
     * Quick delete button to remove a modifier from a rune rather than opening and editing it through its config window
     * requires the sheet be put into edit mode
     * @param {Event} event - the triggering event
     * @param {HTMLElement} target - the event target
     */
    static async _onRemoveModifier(event, target) {
        const data = {};
        const field = target.closest('[data-field]')?.dataset.field;
        if (!field) return void console.error("Failked to find field to delete");
        data[field] = "";
        await this.document.update(data);
        this.render(false);
    }
}