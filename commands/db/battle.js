//@ts-check
const { STATE } = require('./econ');

/**
 * Called by "attack"
 */
function attack_special() {

}


function attack(user_dbo, other_dbo, bot, thread, command, mongouri, items) {
    
    postActionBar(thread, other_dbo);
}


/**
 * Called by "item"
 */
function heal(user_dbo, bot, thread, command, mongouri, items) {
    postActionBar(thread, user_dbo);
}


//Gets items by section/name, reacts with them to the message, when pressed, trigger a response
function item() {
    throw 'THE "ITEM" COMMAND HAS NOT BEEN SET UP YET!';
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
                .setCustomId('ITEMS')
                .setLabel('ITEMS')
                .setStyle('SECONDARY')
        );

    thread.send({ content: `Your turn <@${user_dbo.s.namespace.collection}>!`, components: [row] });
}



function handle(user_dbo, other_dbo, bot, thread, command, mongouri, items) {

    if (command == 'initalize') {
        postActionBar(thread, user_dbo);
    } else if (command == 'attack') {
        attack(user_dbo, other_dbo, bot, thread, command, mongouri, items);
    } else if (command == 'items') {
        item();
    } else if (command == 'heal') {
        heal();
    }
    // initiate(user_dbo, other_dbo, command, message);
}


module.exports = { handle }
