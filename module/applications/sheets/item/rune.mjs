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
        return this._configDialogRender(context, { title: "", id: "" });
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
        return this._configDialogRender(context, { title: "", id: "" });
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
        return this._configDialogRender(context, { title: "", id: "" });
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
        return this._configDialogRender(context, { title: "", id: "" });
    }

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