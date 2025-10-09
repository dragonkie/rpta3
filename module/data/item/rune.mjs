import ItemData from "../item.mjs";
const {
    ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField
} = foundry.data.fields;

export default class PokeballData extends ItemData {
    static defineSchema() {
        const schema = super.defineSchema();

        return schema();
    }
}