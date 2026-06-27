import { PTA } from "../../../../module/helpers/config.mjs";
import utils from "../../../../module/helpers/utils.mjs";
import PtaDialog from "../../../../module/applications/dialog.mjs";
import MoveData from "../../../../module/data/item/move.mjs";

const {
    ArrayField, BooleanField, IntegerSortField, NumberField, SchemaField, SetField, StringField
} = foundry.data.fields;

export default class rPtaMoveData extends MoveData {
    //=====================================================================================================
    //>- Attack 
    //=====================================================================================================
    async _onUseAttack(event, target) {
        if (this.uses.max > 0 && this.uses.value <= 0) return void utils.warn('PTA.Warn.NoUses');

        // gather relevant data
        const attacker = this.actor;
        if (!attacker) return void utils.warn('PTA.Warn.NoUser');

        const targets = utils.getTargets();
        const rolldata = this.getRollData();
        if (!rolldata) return void utils.error('PTA.Error.RolldataMissing');

        //============================================================================
        //>-- Roll attack for all targets
        //============================================================================
        if (!targets) return void utils.warn('PTA.Warn.EnforceTargeting');
        for (const target of targets) {
            //========================================================================
            //>--- Data prep
            //========================================================================
            let damage_formula = this.damage.formula;

            let target_stat = {};
            if (this.category == 'physical') target_stat = target.actor.system.stats.def;
            if (this.category == 'special') target_stat = target.actor.system.stats.sdef;
            if (this.category == 'status') target_stat = target.actor.system.stats.spd;

            const message_config = { ...rolldata, user: attacker.name, move: this.parent.name, target: target.token.name };
            const message_data = { content: '', speaker: null }

            if (this.actor.type == 'pokemon' && this.actor.system.trainer != '') {
                // validate that theres a real trainer attached to this pokemon
                let trainer = await fromUuid(this.actor.system.trainer);
                if (!trainer) message_data.speaker = ChatMessage.getSpeaker({ actor: this.actor })
                else message_data.speaker = ChatMessage.getSpeaker({ actor: trainer })
            }

            //========================================================================
            //>--- Attack Roll
            //========================================================================
            const r_accuracy = new Roll('1d20 + @stat.mod + @accuracy', rolldata);
            await r_accuracy.evaluate();

            let missed = false;
            let critical = false;

            if (r_accuracy.dice.find(a => a.faces == 20).results[0].result >= 20 - this.critical_chance) critical = true;
            else if (r_accuracy.total <= game.settings.get(game.system.id, 'baseAc') + (target_stat.mod * 3)) missed = true;

            // attack roll content
            message_data.content += `<p><b>${utils.localize(PTA.generic.accuracy)}</b></p>`
            if (missed) message_data.content += utils.format(PTA.chat.attack.miss, message_config);
            else if (critical) message_data.content += utils.format(PTA.chat.attack.crit, message_config);
            else message_data.content += utils.format(PTA.chat.attack.hit, message_config);
            message_data.content += await r_accuracy.render();

            //========================================================================
            //>--- Damage Roll
            //========================================================================
            if (!missed) {
                // Add stab damage bonus
                for (const key of Object.keys(attacker.system.types)) {
                    if (attacker.system.types[key] == this.type) {
                        damage_formula += '+4';
                        break;
                    }
                }
            }

            //========================================================================
            //>--- RPTA3
            //========================================================================
            // subtract flat modifier from other target pokemon if present
            console.log('reducing damage', target_stat)
            if (target_stat.mod > 0) damage_formula += ` - ${target_stat.mod}`
            console.log(damage_formula);

            const r_damage = new Roll(damage_formula, rolldata);

            // get the move effectiveness values
            let effectiveness = { value: 0, percent: 1, immune: false };;
            if (!missed) {
                if (target.actor.type == 'pokemon') {
                    let overriden = false
                    for (const override of target.actor.system.resistance_override) {
                        if (override.type == this.type) {
                            overriden = true;
                            switch (override.value) {
                                case 'immune': effectiveness = { value: 0, percent: 0, immune: true }; break;
                                case 'double': effectiveness = { value: 1, percent: 2, immune: false }; break;
                                case 'quadruple': effectiveness = { value: 2, percent: 4, immune: false }; break;
                                case 'half': effectiveness = { value: -1, percent: 0.5, immune: false }; break;
                                case 'quarter': effectiveness = { value: -2, percent: 0.25, immune: false }; break;
                            }
                        }
                    }
                    if (!overriden) effectiveness = utils.typeEffectiveness(this.type, target.actor.system.getTypes());
                }

                // add or remove dice from the formula to match effectiveness, then resert formula to match new terms
                r_damage.dice[0].number = Math.max(r_damage.dice[0].number + effectiveness.value, 0);
                r_damage.resetFormula();

                // critical hits maximize dice
                await r_damage.evaluate({ maximize: critical });

                message_data.content += `<p><b>${utils.localize(PTA.generic.damage)}</b></p>`

                if (effectiveness.immune) message_data.content += utils.format(PTA.chat.damage.immune, message_config);
                else switch (effectiveness.value) {
                    case -2: message_data.content += utils.format(PTA.chat.damage.quarter, message_config); break;
                    case -1: message_data.content += utils.format(PTA.chat.damage.half, message_config); break;
                    case 0: message_data.content += utils.format(PTA.chat.damage.normal, message_config); break;
                    case 1: message_data.content += utils.format(PTA.chat.damage.double, message_config); break;
                    case 2: message_data.content += utils.format(PTA.chat.damage.quadruple, message_config); break;
                }

                message_data.content += await r_damage.render();
            }

            //==================================================================================================
            //>--- Lifesteal application
            //==================================================================================================
            if (this.drain > 0) {
                message_config.drain = Math.floor(r_damage.total * (this.drain / 100));
                message_data.content += `<p>${utils.format(PTA.chat.lifesteal, message_config)}</p>`;
                await this.actor.update({ system: { hp: { value: Math.min(this.actor.system.hp.value + message_config.drain, this.actor.system.hp.max) } } })
            }

            //==================================================================================================
            //>--- Apply ailments
            //==================================================================================================
            if (Object.keys(PTA.ailments).includes(this.ailment.type) && this.ailment.chance > 0) {
                let applied = false;

                // Make the dice roll if needed
                const r_ailment = new Roll('1d100');
                await r_ailment.evaluate();
                if (r_ailment.total <= this.ailment.chance) applied = true;

                // compile the message data
                message_data.content += `<p><b>${utils.localize(PTA.generic.ailment)}: ${utils.localize(PTA.ailments[this.ailment.type])} ${this.ailment.chance}%</b></p>`
                if (applied) {
                    message_data.content += utils.format(PTA.chat.ailment.success, message_config);
                    //==========================================================================================
                    //>--- Apply status effects
                    //==========================================================================================
                    if (game.user.isGM || target.actor.isOwner) {
                        console.log("Applying status effect to target")
                        await target.actor.toggleStatusEffect(this.ailment.type, { active: true, overlay: false });
                    }
                }
                else message_data.content += utils.format(PTA.chat.ailment.failed, message_config);
                message_data.content += await r_ailment.render();
            }


            //======================================================================================================
            //>--- Chat Message
            //======================================================================================================
            message_data.content = await foundry.applications.ux.TextEditor.enrichHTML(message_data.content);
            let message = await r_accuracy.toMessage(message_data, message_config);

            // if we reach this point, attack was successful so we expend a use
            if (this.uses.max > 0) this.parent.update({ 'system.uses.value': this.uses.value - 1 });
        }
    }
}