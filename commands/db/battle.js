//@ts-check
const { STATE } = require('./econ');
const { winGame } = require('./external_game_functions.js');


/**
 * Called by "attack"
 */
function attack_special() {

}


//Bow special phrase: Σ>―(´･ω･`)→
function attack(client, user_dbo, other_dbo, bot, thread, command, mongouri, items, xp_collection, interaction) {
    //Get the weapon
    user_dbo.find({'equipped': {$exists: true}}).toArray(function(err, docs) {
        const doc = docs[0];
        const all_weapons = doc.equipped.weapons;
        console.log(all_weapons);
        const weapon = all_weapons.main;

        var dmg = 0;

        //No weapons (punch)
        if (weapon == null) {
            dmg = doc.rank;
        } else {
            dmg = (doc.rank - 1) + Math.round(weapon.cost/5);
        }

        other_dbo.find({'equipped': {$exists: true}}).toArray(function (err, docs) {
            const odoc = docs[0];
            
            //Handle defending
            if (odoc.state == STATE.DEFENDING) {
                var def = odoc.rank - doc.rank;
                //Make sure we don't go negative
                if (def < 0) { def = 0; }

                dmg /= 2 + def;
            }

            var new_hp = odoc.hpmp.hp -= dmg;
            if (new_hp <= 0) {
                winGame(client, bot, client.db(user_dbo.s.namespace.db), user_dbo, xp_collection, interaction.message);
            } else {
                other_dbo.updateOne({'equipped': {$exists: true}}, { $set: { hp :new_hp }}); //THIS DOES NOT WORK (OVERWRITES HPMP MAP WITH ONE VALUE)
            }
        });

    })

    //Check for a "special" animation
    

    
}


/**
 * Called by "item"
 */
function heal(user_dbo, bot, thread, command, mongouri, items) {


}


//Gets items by section/name, reacts with them to the message, when pressed, trigger a response
function item() {
    throw 'THE "ITEM" COMMAND HAS NOT BEEN SET UP YET!';
}


function defend(user_dbo, bot, thread, command, mongouri, items) {
    user_dbo.find({'equipped': {$exists: true}}).toArray(function(err, docs) {
        const doc = docs[0];
        const all_weapons = doc.get('weapons');
        const shield = all_weapons.get('secondary');

    })
}

function cast() {

}


function postActionBar(thread, user_dbo) {
    const { MessageActionRow, MessageButton } = require('discord.js');
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('ATTACK')
                .setLabel('ATTACK')
                .setStyle('DANGER'),
            new MessageButton()
                .setCustomId('HEAL')
                .setLabel('HEAL')
                .setStyle('SUCCESS'),
            new MessageButton()
                .setCustomId('DEFEND')
                .setLabel('DEFEND')
                .setStyle('PRIMARY'),
            new MessageButton()
                .setCustomId('ITEMS')
                .setLabel('ITEMS')
                .setStyle('SECONDARY')
        );

    thread.send({ content: `Your turn <@${user_dbo.s.namespace.collection}>!`, components: [row] });
}



function handle(client, user_dbo, other_dbo, bot, thread, command, mongouri, items, interaction, xp_collection) {
    if (command == 'initalize') {
        return postActionBar(thread, user_dbo);
    } else if (command == 'attack') {
        attack(client, user_dbo, other_dbo, bot, thread, command, mongouri, items, xp_collection, interaction);
    } else if (command == 'items') {
        item();
    } else if (command == 'heal') {
        heal();
    }

    //Post the action bar for the next person's turn
    postActionBar(thread, other_dbo);
    // initiate(user_dbo, other_dbo, command, message);
}

module.exports = { handle }
