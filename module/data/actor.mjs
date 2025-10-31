import utils from "../helpers/utils.mjs";
import DataModel from "./abstract.mjs";
import { PTA } from "../helpers/config.mjs";

const { SchemaField, NumberField, BooleanField, StringField, ArrayField, DataField, ObjectField, HTMLField } = foundry.data.fields;

export default class ActorData extends DataModel {

  static defineSchema() {

    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.hp = new SchemaField({
      value: new NumberField({ ...requiredInteger, initial: 20, min: 0 }),
      max: new NumberField({ ...requiredInteger, initial: 20, min: 0 }),
      min: new NumberField({ ...requiredInteger, initial: 0, min: 0, max: 0 }),
    })

    // Iterate over stats names and create a new SchemaField for each.
    schema.stats = new SchemaField(Object.keys(CONFIG.PTA.stats).reduce((obj, stat) => {
      obj[stat] = new SchemaField({
        value: new NumberField({ ...requiredInteger, initial: 3, min: 0 }),
        bonus: new NumberField({ ...requiredInteger, initial: 0 }),
        boost: new NumberField({ ...requiredInteger, initial: 0 }),
      });
      return obj;
    }, {}));

    // manually set a pokemons resistance to a certain element
    schema.resistance_override = new ArrayField(
      new SchemaField({
        value: new StringField({
          initial: 'none', blank: false, required: true, nullable: false, choices: () => {
            let options = { none: PTA.generic.none, ...PTA.typeEffectivenessValues };
            for (const key of Object.keys(options)) options[key] = utils.localize(options[key]);
            return options;
          }
        }),
        type: new StringField({
          initial: 'normal', blank: false, required: true, nullable: false, choices: () => {
            let options = { ...PTA.pokemonTypes };
            for (const key of Object.keys(options)) options[key] = utils.localize(options[key]);
            return options;
          }
        }),
      }), { initial: [], nullable: false });

    //====================================================================================
    //> Skill fields
    //====================================================================================
    const _getSkillFields = () => {
      let _field = {};
      // loop through list of skills
      for (const [skill, stat] of Object.entries(PTA.skillAbilities)) {
        // grab the stats that matches this skill
        for (const [key, value] of Object.entries(PTA.stats)) {
          if (stat === value) _field[skill] = new SchemaField({
            talent: new NumberField({ ...requiredInteger, max: 2, min: 0, initial: 0 }),
            stat: new StringField({ required: true, nullable: false, initial: key }),
            value: new NumberField({ ...requiredInteger, initial: 0 }),
            bonus: new NumberField({ ...requiredInteger, initial: 0 })
          })
        }
      }
      return new SchemaField(_field);
    }

    schema.skills = _getSkillFields();

    //====================================================================================
    //> Bonus fields
    //====================================================================================
    schema.bonuses = new SchemaField({
      attack: new NumberField({ initial: 0, required: true, nullable: false }),
      hpMax: new NumberField({ initial: 0, ...requiredInteger })
    })

    return schema;
  }

  prepareBaseData() {
    super.prepareBaseData();
    for (const key in this.stats) this.stats[key].total = 0;
  }

  prepareDerivedData() {
    super.prepareDerivedData();

    // calculate max hp
    this.hp.total = this.hp.max + this.bonuses.hpMax;

    // after status modifiers are applied, we can total up the final value of the stats
    for (const key in this.stats) {
      this.stats[key].total += (this.stats[key].value + this.stats[key].bonus) * utils.AbilityStage(this.stats[key].boost);
      this.stats[key].mod = Math.floor(this.stats[key].total / 2);
    }

    // calculate skill totals
    for (const key in this.skills) {
      let skill = this.skills[key];
      let stat = this.stats[skill.stat];
      skill.total = skill.value + stat.mod + Math.floor(skill.talent * 2.5) + skill.bonus;
    }

    // applys conditions relevant to token statuses
    for (const status of this.parent.statuses) {
      switch (status) {
        case 'burn':
          this.stats.atk.total -= 2;
          break;
        case 'paralyzed':
          this.stats.spd.total -= 2;
          break;
        case 'poison':
        case 'toxic':// deliberate fall through
          this.stats.satk.total -= 2;
          break;
        default: break;
      }
    }

    //====================================================================================
    //> Derived fields from runes
    //====================================================================================
    const items = this.parent.items;
    for (const item of items) {
      item.prepareActorData(this);
    }
  }

  getRollData() {
    const data = super.getRollData();

    for (let [k, v] of Object.entries(this.stats)) {
      data[k] = v.mod;
      data[PTA.statKeyLong[k]] = v.total;
    }

    return data;
  }

  get isFainted() { return this.hp.value <= 0 };
  get fainted() { return this.isFainted };
  get isDead() { return this.isFainted };
  get isAlive() { return !this.isFainted };
}