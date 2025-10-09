import { PTA } from "../../helpers/config.mjs";
import utils from "../../helpers/utils.mjs";
import ActorData from "../actor.mjs";

const {
  ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField, ObjectField
} = foundry.data.fields;

export default class CharacterData extends ActorData {

  static defineSchema() {
    const requiredInteger = { required: true, nullable: false, integer: true };
    const schema = super.defineSchema();

    schema.honours = new NumberField({ ...requiredInteger, initial: 0, min: 0 });
    schema.rank = new NumberField({ ...requiredInteger, initial: 0, label: PTA.generic.rank });
    schema.origin = new StringField({ initial: "", label: PTA.generic.origin });

    // helper function for defining skills
    const _getSkillField = () => {
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

    schema.skills = _getSkillField();
    schema.credits = new NumberField({ ...requiredInteger, initial: 0 });

    // list of owned pokemon
    schema.pokemon = new ArrayField(new SchemaField({
      uuid: new StringField({ initial: '', required: true, nullable: false }),
      name: new StringField({ initial: '', required: true, nullable: false }),
      active: new BooleanField({ initial: false, required: true, nullable: false })
    }), { initial: [] });

    // Character classes
    schema.class_1 = new SchemaField({ label: new StringField({ initial: '' }) });
    schema.class_2 = new SchemaField({ label: new StringField({ initial: '' }) });
    schema.class_3 = new SchemaField({ label: new StringField({ initial: '' }) });
    schema.class_4 = new SchemaField({ label: new StringField({ initial: '' }) });

    // Character descriptions
    schema.details = new SchemaField({
      age: new StringField({ label: PTA.generic.age, initial: '' }),
      gender: new StringField({ label: PTA.generic.gender, initial: '' }),
      height: new StringField({ label: PTA.generic.height, initial: '' }),
      weight: new StringField({ label: PTA.generic.weight, initial: '' }),
      hair: new StringField({ label: PTA.generic.hair, initial: '' }),
      eyes: new StringField({ label: PTA.generic.eyes, initial: '' })
    })

    return schema;
  }

  prepareDerivedData() {
    super.prepareDerivedData();
    for (const key in this.skills) {
      let skill = this.skills[key]
      let stat = this.stats[skill.stat];
      skill.total = skill.value + stat.mod + Math.floor(skill.talent * 2.5) + skill.bonus;
    }

    this.level = this.class_1.level = this.rank;

    this.class_2.level = this.class_1.level >= 3 ? this.class_1.level - 2 : 0;
    this.class_3.level = this.class_1.level >= 7 ? this.class_1.level - 6 : 0;
    this.class_4.level = this.class_1.level >= 11 ? this.class_1.level - 10 : 0;
  }

  getRollData() {
    const data = super.getRollData();

    return data;
  }

  async _preUpdate(changed, options, userId) {
    return await super._preUpdate(changed, options, userId);
  }

  _onUpdate(changed, options, userId) {
    return super._onUpdate(changed, options, userId);
  }
}