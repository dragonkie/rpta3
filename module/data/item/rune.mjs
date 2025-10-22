import { PTA } from "../../helpers/config.mjs";
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

        // Adds in stat modifiers
        // adds in stat growth
        // adds in stat shrink
        // adds in stat multipliers
        schema.stats = new SchemaField(Object.keys(CONFIG.PTA.stats).reduce((obj, stat) => {
            obj[stat] = new SchemaField({
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
            const options = {
                all: new NumberField({ ...requiredInteger, initial: 0 }),
                physical: new NumberField({ ...requiredInteger, initial: 0 }),
                special: new NumberField({ ...requiredInteger, initial: 0 }),
            };

            // add in fields for all the pokemon types
            for (const type in PTA.pokemonTypes) {
                options[type] = new NumberField({ ...requiredInteger, initial: 0 });
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