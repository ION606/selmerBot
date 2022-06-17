//@ts-check
const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const { STATE } = require('./econ');
const { winGame, getCustomEmoji } = require('./external_game_functions.js');
const { changeTurn } = require('../turnManager.js');
const { default: mongoose } = require('mongoose');


function postActionBar(thread, user_dbo) {
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


/**
 * Called by "attack"
 */
function attack_special() {

}


//Bow special phrase: Σ>―(´･ω･`)→
function attack(client, user_dbo, other_dbo, bot, thread, xp_collection, interaction) {
    //Get the weapon
    user_dbo.find({'equipped': {$exists: true}}).toArray(function(err, docs) {
        const doc = docs[0];
        const all_weapons = doc.equipped.weapons;
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
                other_dbo.updateOne({'equipped': {$exists: true}}, { $set: { 'hpmp.hp' :new_hp, state: STATE.FIGHTING }});
            }
        });

    })

    //Check for a "special" animation
    

    //Change turns
    changeTurn(client, bot, interaction);
}



async function heal(interaction, client, user_dbo, bot, thread, command, mongouri, items) {
    if (interaction.message.content.toLowerCase().indexOf('Which item would you like to use?') != -1) {
        // The person picked out an item
        //I think this is unecessary
    }

    //Get the 'healing' items (stored in "{item}: num" format)
    user_dbo.find({'equipped': {$exists: true}}).toArray(async function(err, docs) {
        const doc = docs[0];
        const rawitems = doc.equipped.items;
        const items = rawitems.filter(function(f) { return (f.sect.toLowerCase() == 'hp') });


        if  (JSON.stringify(items) == '[]') {
            interaction.editReply("You don't have any items!");
            return postActionBar(thread, user_dbo);
        } else { console.log(JSON.stringify(items))}

        var itemlist = [];

        items.forEach(function(item) {
            let n = item.name;

            let h = (doc.rank - 1) + Math.round(item.cost/10);

            itemlist.push({label: n, description: `Restores ${h} health (${item.num})`, value: `${n}`});
        });
        
        
        //Find something to heal with
        const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(`${interaction.user.id}|heal`)
                .setPlaceholder('Nothing selected')
                .addOptions(itemlist),
                // .addOptions([
                //     {
                //         label: 'Select me',
                //         description: 'This is a description',
                //         value: 'first_option',
                //     },
                //     {
                //         label: 'You can select me too',
                //         description: 'This is also a description',
                //         value: 'second_option',
                //     },
                // ])
        );

        await interaction.editReply({ content: 'Please choose a health potion!', components: [row] });
    });
}


//Gets items by section/name, reacts with them to the message, when pressed, trigger a response
function presentItems(interaction, client, user_dbo, bot, thread) {
    // throw 'THE "ITEM" COMMAND HAS NOT BEEN SET UP YET!';
    user_dbo.find({'equipped': {$exists: true}}).toArray(async function(err, docs) {
        const doc = docs[0];
        const items = doc.equipped.items;
        // const items = rawitems.filter(function(f) { return (f.sect.toLowerCase() == 'hp') });


        if  (JSON.stringify(items) == '[]' || JSON.stringify(items) == '{}') {
            interaction.editReply("You don't have any items!");
            return postActionBar(thread, user_dbo);
        } else { console.log(JSON.stringify(items))}

        var itemlist = [];

        items.forEach(function(item) {
            let n = item.name;

            

            itemlist.push({label: n, description: `${item.num} equipped!`, value: `${n}`});
        });
        
        
        //Find something to heal with
        const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(`${interaction.user.id}|heal`)
                .setPlaceholder('Nothing selected')
                .addOptions(itemlist)
        );

        await interaction.editReply({ content: 'Please choose a health potion!', components: [row] });
    });
}


function defend(client, interaction, user_dbo, bot, thread) {
    user_dbo.find({'equipped': {$exists: true}}).toArray(function(err, docs) {
        const doc = docs[0];
        const all_weapons = doc.get('weapons');
        const shield = all_weapons.get('secondary');

        //They don't have a shield
        if (shield == undefined) {
            thread.send("You don't have a shield equipped!");
            return postActionBar(thread, user_dbo);
        }
        
        //Change state
        user_dbo.updateOne({state: {$exists: true}}, {$set: {state: STATE.DEFENDING}});
    })

    changeTurn(client, bot, interaction);
    postActionBar(thread, user_dbo);
}


function usePotion(interaction, client, user_dbo, bot, thread) {
    const name = interaction.values[0];
    const cursor = user_dbo.find({'equipped.items': {$exists: true}});

    let doc = cursor.next().then((result) => {
        var allitems = Array.from(result.equipped.items);
        let items = allitems.filter((it) => { return it.name == name; })[0];
        let ind = allitems.findIndex((it) => { return it.name == name; })

        //Apply the item's effects
        if (name.toLowerCase().indexOf('hp') != -1) {
            let h = (result.rank - 1) + Math.round(items.cost/10);
            user_dbo.updateOne({"game": {$exists: true}}, { $set: {'hpmp.hp': (result.hpmp.hp + h)}})
        }

        //Deal with the item itself
        //If there's more than 1, subtract 1
        if (items.num > 1) { items.num -= 1; allitems[ind] = items; }
        else { allitems.splice(ind, 1) }

        user_dbo.updateOne({'equipped.items': {$exists: true}}, {$set: {'equipped.items': allitems}});
    })


    changeTurn(client, bot, interaction);
    postActionBar(thread, user_dbo);
}


function cast() {

}



async function handle(client, user_dbo, other_dbo, bot, thread, command, mongouri, items, interaction, xp_collection) {
    if (command == 'initalize') {
        return postActionBar(thread, user_dbo);
    } else if (command == 'attack') {
        attack(client, user_dbo, other_dbo, bot, thread, xp_collection, interaction);
        postActionBar(thread, other_dbo);
    } else if (command == 'items') {
        presentItems(interaction, client, user_dbo, bot, thread);
    } else if (command == 'heal') {
        heal(interaction, client, user_dbo, bot, thread, command, mongouri, items); //.then(() => {postActionBar(thread, other_dbo)});
    } else if (command == 'usepotion') {
        usePotion(interaction, client, user_dbo, bot, thread);
    } else if (command == 'defend') {
        defend(client, interaction, user_dbo, bot, thread);
    }

    // initiate(user_dbo, other_dbo, command, message);
}

module.exports = { handle, postActionBar }
