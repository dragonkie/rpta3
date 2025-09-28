import * as BattleFeatures from './BattleTester.mjs'

globalThis.pta = {
    id: 'rpta3',
    paths: {
        template: 'systems/rpta3/templates'
    },
    battle: BattleFeatures,
    utils: Object.assign(PtaUtils, foundry.utils),
    pokeapi: pokeapi
}

import PtaActor from './documents/actor.mjs';
import PtaItem from './documents/item.mjs';
// Import sheet classes.
import applications from "./applications/_module.mjs";
// Import helper/utility classes and constants.
import PtaUtils from './helpers/utils.mjs'
import { PTA } from './helpers/config.mjs';
import PtaSocketManager from './helpers/socket.mjs';
// Import DataModel classes
import * as models from './data/_module.mjs';
import registerPtaHandlebars from './helpers/handlebars.mjs';
import registerSystemSettings from './helpers/settings.mjs';
import registerHooks from './helpers/hooks.mjs';
import pokeapi from './helpers/pokeapi.mjs';


/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', function () {
    //CONFIG.debug.hooks = true;

    // Add utility classes to the global game object so that they're more easily
    // accessible in global contexts.
    pta.data = models;
    pta.application = applications

    PTA.loadPokedex();
    pta.config = PTA;
    CONFIG.PTA = PTA;

    CONFIG.statusEffects = PTA.statusEffects;

    /**
     * Set an initiative formula for the system
     * @type {String}
     */
    CONFIG.Combat.initiative = {
        formula: '@speed',
        decimals: 2,
    };

    // Active Effects are never copied to the Actor,
    // but will still apply to the Actor from within the Item
    // if the transfer property on the Active Effect is true.
    CONFIG.ActiveEffect.legacyTransferral = false;

    // Define custom Document and DataModel classes
    CONFIG.Actor.documentClass = PtaActor;
    CONFIG.Item.documentClass = PtaItem;
    CONFIG.Actor.dataModels = models.ActorConfig;
    CONFIG.Item.dataModels = models.ItemConfig;

    // Register sheet application classes
    foundry.documents.collections.Actors.unregisterSheet('core', foundry.appv1.sheets.ActorSheet);
    foundry.documents.collections.Items.unregisterSheet('core', foundry.appv1.sheets.ItemSheet);

    for (const sheet of applications.sheets.actor.config) {
        if (!sheet.application) continue;
        foundry.documents.collections.Actors.registerSheet('rpta3', sheet.application, sheet.options);
    }

    for (const sheet of applications.sheets.item.config) {
        if (!sheet.application) continue;
        foundry.documents.collections.Items.registerSheet('rpta3', sheet.application, sheet.options);
    }

    /* -------------------------------------------- */
    /*  system settings                             */
    /* -------------------------------------------- */
    registerSystemSettings();

    /* -------------------------------------------- */
    /*  Handlebars Helpers                          */
    /* -------------------------------------------- */
    registerPtaHandlebars();

    /* -------------------------------------------- */
    /*  system hooks                                */
    /* -------------------------------------------- */
    registerHooks();

    pta.socket = new PtaSocketManager();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */
Hooks.once('ready', function () {
    // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
    Hooks.on('hotbarDrop', (bar, data, slot) => createItemMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createItemMacro(data, slot) {
    // First, determine if this is a valid owned item.
    if (data.type !== 'Item') return;
    if (!data.uuid.includes('Actor.') && !data.uuid.includes('Token.')) {
        return ui.notifications.warn(
            'You can only create macro buttons for owned Items'
        );
    }
    // If it is, retrieve it based on the uuid.
    const item = await Item.fromDropData(data);

    // Create the macro command using the uuid.
    const command = `game.rpta3.rollItemMacro("${data.uuid}");`;
    let macro = game.macros.find(
        (m) => m.name === item.name && m.command === command
    );
    if (!macro) {
        macro = await Macro.create({
            name: item.name,
            type: 'script',
            img: item.img,
            command: command,
            flags: { 'rpta3.itemMacro': true },
        });
    }
    game.user.assignHotbarMacro(macro, slot);
    return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
    // Reconstruct the drop data so that we can load the item.
    const dropData = {
        type: 'Item',
        uuid: itemUuid,
    };
    // Load the item from the uuid.
    Item.fromDropData(dropData).then((item) => {
        // Determine if the item loaded and if it's an owned item.
        if (!item || !item.parent) {
            const itemName = item?.name ?? itemUuid;
            return ui.notifications.warn(
                `Could not find item ${itemName}. You may need to delete and recreate this macro.`
            );
        }

        // Trigger the item roll
        item.roll();
    });
}
