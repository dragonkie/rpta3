import ItemData from "../item.mjs";
const {
    ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField
} = foundry.data.fields;

export default class RuneData extends ItemData {
    static defineSchema() {
        const schema = super.defineSchema();
        schema.equipped = new BooleanField({ initial: false, nullable: false });
        return schema;
    }

    async use(event, target, action) {
        return this._onEquip(event, target);
    }

    async _onEquip(event, target) {
        await this.parent.update({ system: { equipped: !this.equipped } });
        this.actor.sheet.render(false);
        console.log("Set rune equipped to:", this.equipped)
    }
}