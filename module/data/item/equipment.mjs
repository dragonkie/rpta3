import { PTA } from "../../helpers/config.mjs";
import ItemData from "../item.mjs";
import utils from "../../helpers/utils.mjs";

const {
    ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField, HTMLField
} = foundry.data.fields;


export default class EquipmentData extends ItemData {
    static defineSchema() {
        const schema = super.defineSchema();
        const requiredInteger = { required: true, nullable: false, integer: true };

        schema.equipped = new BooleanField({ initial: false, nullable: false, required: true });
        schema.priority = new NumberField({ ...requiredInteger, initial: 0, label: "PTA.Generic.Priority" });

        //=======================================================================================================================
        //> Behaviour data model
        //=======================================================================================================================
        /**
         * Behaviours are unique system for listening on hooks to trigger simple events, or even custom ones through macros
         * A behaviour is made of three parts
         * - A trigger (Passive, Damaged, Attack, etc)
         * - Conditional to adjust the trigger
         * - An effect, a preconfigured effect, or a link to a macro for a custom one
         */

        schema.behaviours = new ArrayField(new SchemaField({
            trigger: new StringField(),
            adjustment: new StringField(),
            effect: new StringField(),
            effectStrength: new StringField(),
        }));

        /**
         * New unified front for compiling the list of modifiers in a more convinient way
         */
        schema.rules = new ArrayField(new SchemaField({
            active: new BooleanField({ initial: true }),
            uuid: new StringField({ initial: null, nullable: true }),
            type: new StringField({
                initial: "attribute",
                choices: {
                    stat: "Stat",
                    attribute: "Attribute",
                    resist: "Resistance",
                    skill: "Skill",
                    restrict: "Restriction"
                }
            }),
            formula: new StringField({ initial: "" }),
            method: new StringField({})
        }))

        /**
         * Similar to behaviours, modifiers are simple adjustments for stats
         */
        schema.stats = new ArrayField(new SchemaField({
            stat: new StringField({
                required: true,
                nullable: false,
                initial: 'atk',
                label: PTA.generic.stat,
                choices: PTA.stats
            }),
            value: new NumberField({ initial: 0 }),
            method: new StringField({
                required: true,
                nullable: false,
                initial: 'add',
                label: PTA.generic.method,
                choices: PTA.modifierMethods
            })
        }));

        /**
         * Allows adjustments to values outside of stats, any core value that isn't used for rolling is here
         * Max hp, movement speed, evasion, damage reductions
         */
        schema.attributes = new ArrayField(new SchemaField({
            attribute: new StringField({
                initial: "hp",
                choices: {
                    hp: 'Max HP',
                    moveSpeed: 'Movement',
                    evasion: 'Evasion',
                    evasionPh: 'Evasion Ph.',
                    evasionSp: 'Evasion Sp.',
                    evasionAl: 'Evasion Al.',
                }
            }),
            value: new NumberField({ initial: 0 }),
            method: new StringField({
                required: true,
                nullable: false,
                initial: 'add',
                label: PTA.generic.method,
                choices: PTA.modifierMethods
            })
        }));

        /**
         * Modifiers to skills
         * Allows a valid formula as it's entry, eg. "1d4 + 2" is a valid bonus
         */
        schema.skills = new ArrayField(new SchemaField({
            skill: new StringField({
                required: true,
                nullable: false,
                initial: "acrobatics",
                label: PTA.generic.method,
                choices: PTA.skills
            }),
            value: new StringField({ initial: 0 }),// numeric used outside of "formula" method
            formula: new NumberField({ initial: "0" }),// used exclusivly for formula method
            method: new StringField({
                required: true,
                nullable: false,
                initial: 'add',
                label: PTA.generic.method,
                choices: PTA.modifierMethods
            })
        }));

        /**
         * Changes values of resistances, and how to modify them
         * if increment is selected, enter a numeric value to step resistance by
         */
        schema.resistances = new ArrayField(
            new SchemaField({
                value: new StringField({
                    initial: 'none', blank: false, required: true, nullable: false, choices: () => {
                        let options = { none: PTA.generic.none, ...PTA.typeEffectivenessValues };
                        for (const key of Object.keys(options)) options[key] = utils.localize(options[key]);
                        return options;
                    }
                }),
                method: new StringField({
                    required: true,
                    nullable: false,
                    blank: false,
                    initial: 'override',
                    label: PTA.generic.method,
                    choices: {
                        override: 'Override',
                        increment: 'Increment'
                    }
                }),// whether it should in/decrease the value, or override it entirely
                type: new StringField({ // the elemental type this effects
                    initial: 'normal', blank: false, required: true, nullable: false, choices: () => {
                        let options = { ...PTA.pokemonTypes };
                        for (const key of Object.keys(options)) options[key] = utils.localize(options[key]);
                        return options;
                    }
                }),
            }),
            { initial: [], nullable: false }
        );

        /**
         * Conditionals that an actor must meet to use / equip this item
         * 
         * Requirements can be made using binary operators, specifying how many must be met
         * or which combinations are neccessary to use the item. for example, you might 
         * allow a fire OR steel type to use this item, but no others
         * 
         * Type - requirements that you are, or aren't a matching element
         * Unique - Can't match any tags shared by this requirement on other items
         * Stat - Requires your stats be aboe, below, or match, a specified value
         * Gender - Must match the gender specified
         * Size - Size to match the details tab, or be under / over it
         * Weight - Same as size
         */
        schema.override = new BooleanField({ initial: false });
        schema.requirements = new ArrayField(new SchemaField({
            type: new StringField()
        }))

        return schema;
    }

    getMenuActions() {
        const group = "equipment";
        return [
            ...super.getMenuActions(),
            {
                label: PTA.contextMenu.equip,
                visible: !this.equipped,
                group: group,
                icon: "",
                onClick: () => this.parent.update({ system: { equipped: true } })
            }, {
                label: PTA.contextMenu.unequip,
                visible: this.equipped,
                group: group,
                icon: "",
                onClick: () => this.parent.update({ system: { equipped: false } })
            }
        ];
    }

    prepareActorData(actorData) {
        if (!this.equipped) return;
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
        actorData.hp.max += this.hp;
        actorData.moveSpeed += this.moveSpeed;
    }
}