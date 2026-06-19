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
     * Rulesets made to match the ways that foundry's ActiveEffects work because people are
     * LAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZY
     * Nobody wants to mess around with active effects, learning system keys is just to much effort
     * most people lack the technical know how to use the console to check, and installing a module to do it 
     * with is a pain, so this is a quick and easy way to set it up for them
     * 
     * This mostly boils down to how resistances are used, literally everything else could be 
     * an active effect, I'm just not sure how I'd set up other resistance types
     */
    schema.rules = new ArrayField(new SchemaField({
      name: new StringField({ initial: "New Rule" }),
      uuid: new StringField({ initial: null, nullable: true }),
      active: new BooleanField({ initial: true }),// if this effect is active right now
      surpressed: new BooleanField({ initial: false }),// if something is limiting this effect
      priority: new NumberField({ initial: 0 }),
      type: new StringField({
        initial: "attribute",
        choices: {
          stat: "Stat",
          resist: "Resistance",
          skill: "Skill",
          restrict: "Restriction"
        }
      }),
      keys: new SchemaField({// holds the value of the different modifier types
        stat: new StringField({
          initial: "hp",
          choices: {
            ...PTA.stats,
            hp: 'Max HP',
            moveSpeed: 'Movement',
            evasion: 'Evasion',
            evasionPh: 'Evasion Ph.',
            evasionSp: 'Evasion Sp.',
            evasionAl: 'Evasion Al.',
          }
        }),
        resist: new StringField({
          initial: "normal",
          choices: PTA.pokemonTypes
        }),
        skill: new StringField({
          initial: "acrobatics",
          choices: PTA.skills
        }),
        restrict: new StringField({})
      }),
      method: new StringField({ // have to manually add formula type for some of these
        initial: "add",
        choices: { ...PTA.modifierMethods, formula: "Formula" }
      }),// How the value of this rule is applied, different limitations apply based on type
      value: new NumberField({}),// numeric methods + types are changed here
      formula: new StringField({ initial: "" }),// rollable types may use the formula field to specify their effects
    }), { initial: [], nullable: false });

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

  /*
  static migrateData(source) {
    console.log("Migrating rules...")
    // Converts previous version runes into new generic rules system
    if (!source.rules) source.rules = [];

    function getRuleCopy(data) {
      return Object.assign({
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
      }, data)
    }
    if (Array.isArray(source.stats) && source.stats.length > 0) {
      console.log("Migrating stats");
      for (const rule of source.stats) {
        source.rules.push(getRuleCopy({
          type: 'stat',
          keys: { stat: rule.stat || "hp" },
          value: rule.value || 0,
          method: rule.method || "add"
        }))
      }
    }


    if (Array.isArray(source.attributes) && source.attributes.length > 0) {
      console.log("Migrating attributes");
      for (const rule of source.attributes) {
        source.rules.push(getRuleCopy({
          type: 'stat',
          keys: { stat: rule.attribute || "hp" },
          value: rule.value || 0,
          method: rule.method || "add"
        }))
      }
    }

    if (Array.isArray(source.skills) && source.skills.length > 0) {
      console.log("Migrating skills");
      for (const rule of source.skills) {
        source.rules.push(getRuleCopy({
          type: 'skill',
          keys: { skill: rule.skill || "acrobatics" },
          method: rule.method || "add",
          value: rule.value || 0,
          formula: rule.formula || ""
        }))
      }
    }
    console.log("Deleting old system");
    delete source.skills;
    delete source.stats;
    delete source.attributes;

    // validate rules quickly
    console.log("Validating new rules");
    for (const rule of source.rules) {
      if (typeof rule.value != "number") rule.value = 0;
      if (typeof rule.formula != "string") rule.formula = "";
    }

    console.log("Finished migrating rules", source);

    return super.migrateData(source);
  }
    */

  async use() {
    this.parent.update({ system: { equipped: !this.equipped } });
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
    if (!this.equipped || !actorData) return;

    const valid = [];
    for (const rule of this.rules) {
      // use blacklists to clear out invalid combinations for these options from parsing
      const bl_formula = ['attribute', 'resist'];
      if (rule.method == "formula" && bl_formula.includes(rule.type)) continue;

      // Parse rules in order of priority by passing them to the valid list
      valid.push(rule);
    }

    // sort the valid rules list
    valid.sort((a, b) => a.priority - b.priority);

    function methodMath(base, value, method) {
      switch (method) {
        case 'add': base += value; break;
        case 'subtract': base -= value; break;
        case 'multiply': base *= value; break;
        case 'grow': base = Math.max(base, value); break;
        case 'shrink': base = Math.min(base, value); break;
        default: break;
      }

      return base;
    }

    for (const rule of valid) {
      // stat type rule modifiers apply first
      if (rule.type == "stat") {
        // core ability stats
        for (const key of Object.keys(PTA.stats)) {
          if (rule.keys.stat == key) {
            // formulas are only added to rolls, and have a special field and handling as such
            if (rule.method == 'formula') {

            }
            // added to stat totals, lets go!
            else actorData.stats[key].total = methodMath(actorData.stats[key].total, rule.value, rule.method);
          }
        }

        // non rollable stats, add to flat values
        if (rule.keys.stat == 'hp') actorData.hp.max = methodMath(actorData.hp.max, rule.value, rule.method);
        if (rule.keys.stat == 'moveSpeed') actorData.moveSpeed = methodMath(actorData.moveSpeed, rule.value, rule.method);
      }

      if (rule.type == "skill") {
        // core ability stats
        for (const key of Object.keys(PTA.skills)) {
          if (rule.keys.skill == key) {
            // formulas are only added to rolls, and have a special field and handling as such
            if (rule.method == 'formula') {

            }
            // added to stat totals, lets go!
            else actorData.skills[key].total = methodMath(actorData.skills[key].total, rule.value, rule.method);
          }
        }
      }
    }

  }
}