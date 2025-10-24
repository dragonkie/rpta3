import { PTA } from "../../helpers/config.mjs";
import utils from "../../helpers/utils.mjs";
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
                value: new NumberField({ ...requiredInteger, initial: 0 }),
                method: new StringField({
                    required: true,
                    nullable: false,
                    initial: 'add',
                    label: PTA.generic.method,
                    choices: methods
                }),
                mod: new NumberField({ ...requiredInteger, initial: 0 }),
                grow: new NumberField({ ...requiredInteger, initial: 0 }),
                shrink: new NumberField({ ...requiredInteger, initial: 0 }),
                mult: new NumberField({ ...requiredInteger, initial: 0 }),
            });
            return obj;
        }, {}));

        schema.move = new NumberField({ ...requiredInteger, initial: 0 });

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

    async use(event, target, action) {
        return this._onEquip(event, target);
    }

    async _onEquip(event, target) {
        await this.parent.update({ system: { equipped: !this.equipped } });
        this.actor.sheet.render(false);
    }
}