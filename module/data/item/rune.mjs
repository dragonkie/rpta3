import PtaDialog from "../../applications/dialog.mjs";
import { PTA } from "../../helpers/config.mjs";
import utils from "../../helpers/utils.mjs";
import PokemonData from "../actor/pokemon.mjs";
import ItemData from "../item.mjs";
const {
    ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField
} = foundry.data.fields;

export default class RuneData extends ItemData {
    static defineSchema() {
        const schema = super.defineSchema();
        const requiredInteger = { required: true, nullable: false, integer: true };

        // is this rune equipped right now
        schema.equipped = new BooleanField({ initial: false, nullable: false });

        // add in modifier methods
        const methods = {};
        for (const m in PTA.modifierMethods) methods[m] = utils.localize(PTA.modifierMethods[m]);

        schema.stats = new SchemaField(Object.keys(CONFIG.PTA.stats).reduce((obj, stat) => {
            obj[stat] = new SchemaField({
                value: new NumberField({ required: true, nullable: false, initial: 0 }),
                method: new StringField({
                    required: true,
                    nullable: false,
                    initial: 'add',
                    label: PTA.generic.method,
                    choices: methods
                })
            });
            return obj;
        }, {}));

        schema.hp = new NumberField({ ...requiredInteger, initial: 0, label: "PTA.Generic.MaxHealth" })
        schema.move = new NumberField({ ...requiredInteger, initial: 0 });
        schema.priority = new NumberField({ ...requiredInteger, initial: 0, label: "PTA.Generic.Priority" });

        // prep attack modifier data field types
        function OffensiveFields() {
            // add in default options
            const validator = (value, options) => {
                if (!Roll.validate(value) && value != "") throw new Error("PTA.Error.InvalidFormulaFormat");
                else return true;
            }
            const options = {
                all: new StringField({ ...requiredInteger, initial: 0, validate: validator }),
                physical: new StringField({ ...requiredInteger, initial: 0, validate: validator }),
                special: new StringField({ ...requiredInteger, initial: 0, validate: validator }),
            };

            // add in fields for all the pokemon types
            for (const type in PTA.pokemonTypes) {
                options[type] = new StringField({ ...requiredInteger, initial: 0, validate: validator });
            }

            return new SchemaField(options);
        }

        schema.attack = OffensiveFields(); // chance to hit
        schema.damage = OffensiveFields(); // damage dealt

        schema.dodge = OffensiveFields(); // chance to not hit
        schema.defence = OffensiveFields(); // reduce damage taken

        return schema;
    }

    get importance() {
        let value = 0;
        for (const [key, stat] of Object.entries(this.stats)) {
            value += Math.abs(stat.value);
        }
        return value;
    }

    prepareActorData(actorData) {
        console.log(this)
        if (!this.equipped) return;
        console.log('Rune is augmenting actor data');
        for (const [key, stat] of Object.entries(this.stats)) {
            switch (stat.method) {
                case 'add': actorData.stats[key].total += stat.value; break;
                case 'subtract': actorData.stats[key].total -= stat.value; break;
                case 'multiply': actorData.stats[key].total *= stat.value; break;
                case 'grow': actorData.stats[key].total = Math.max(stat.value, actorData.stats[key].total); break;
                case 'shrink': actorData.stats[key].total = Math.min(actorData.stats[key].total, stat.value); break;
                default: break;
            }
        }

        actorData.hp.total += this.hp;
    }

    async use(event, target, action) {
        console.log("rune action: ", action);
        if (action == "give") return await this._onGive(event, target);
        return this._onEquip(event, target);
    }

    async _onEquip(event, target) {
        await this.parent.update({ system: { equipped: !this.equipped } });
        this.actor.sheet.render(false);
    }

    /**
     * Open up a dialog prompt to gift a rune to an active member of the team
     * @param {Event} event - the event triggered by the event button being clicked
     * @param {HTMLElement} target - Element that triggered the event action
     */
    async _onGive(event, target) {
        if (!this.actor) return false;

        if (this.actor.type == PokemonData.type) {
            // A pokemon will return its rune to it's trainer
            const trainer = await fromUuid(this.actor.system.trainer);
            if (!trainer) return false;

            const data = this.parent.toObject();
            data._id = "";
            data.system.equipped = false;

            const success = await trainer.createEmbeddedDocuments("Item", [data]);
            if (!success) return false;

            this.parent.delete();
        } else {
            // Trainers are given the chance to distribute the rune to one of their active pokemon
            const team = [];
            for (const actor of this.actor.system.pokemon) {
                if (actor.active) team.push(actor);
            }

            let html = await foundry.applications.handlebars.renderTemplate(PTA.templates.dialog.runeTransfer, { team: team, name: this.name });
            const app = await new PtaDialog({
                window: { title: "PTA.Title.TransferRune" },
                content: html,
                buttons: [{
                    label: "Cancel",
                    action: "cancel"
                }, {
                    label: 'Confirm',
                    action: 'confirm',
                    callback: async () => {
                        console.log("transfering the rune");
                        console.log(app.element)
                        const reciever = await fromUuid(app.element.querySelector("select").value);
                        const giver = this.actor;
                        const data = this.parent.toObject();
                        data._id = "";
                        data.system.equipped = false;

                        const success = await reciever.createEmbeddedDocuments("Item", [data]);
                        if (!success) return false;

                        this.parent.delete();
                        console.log(data);
                    }
                }],
            }).render(true);
        }
    }
}