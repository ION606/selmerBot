const { MessageActionRow, MessageButton, Interaction } = require('discord.js');
const { winGame, loseGame, equipItem } = require('./external_game_functions.js');
const wait = require('node:timers/promises').setTimeout;
const { STATE } = require('../db/econ.js')

function startGame(bot, channel, message, args) {
    let componentlist = [];
    var diff;

    if (args.length < 1 || args[0] == 'easy') {
        diff = 0;
    } else if (args[0] == 'medium') {
        diff = 0.1;
    } else if (args[0] == 'hard') {
        diff = 0.2;
    } else {
        diff = 0;
    }

    let user = '';
    if (args.length < 2 || args[1] == 'solo') {
        user = message.author.id;
    }

    for (let i = 0; i < 5; i ++) {
        const row = new MessageActionRow();

        for (let j = 0; j < 5; j ++) {
            //customId = (spot in row)|(spot in column)
            const btn = new MessageButton();
            const isbmb = (Math.random() > (0.70 - diff));

            if (isbmb) {
                btn.setCustomId(`mswpr|${i}|${j}|t|${user}`);
            } else {
                btn.setCustomId(`mswpr|${i}|${j}|f|${user}`);
            }
            
            btn.setLabel('?')
            .setStyle('SECONDARY')
            row.addComponents(btn);
        }

        //Add the row to the list of rows
        componentlist.push(row);
    }

    channel.send({ content: `SCORE: \`0\`\nTILES LEFT: \`25\``, components: componentlist });
}


function gameOver(interaction, won = false) {
    var components = interaction.message.components;

    return new Promise((resolve, reject) => {
        for (i in components) {
            for (j in components[i].components) {
                if (components[i].components[j].customId.split("|")[3] === 't') {
                    components[i].components[j].label = "💣";
                    components[i].components[j].style = "DANGER";
                } else {
                    components[i].components[j].style = "SUCCESS";
                    components[i].components[j].label = "5";
                }

                components[i].components[j].setDisabled(true);
            }
        }

        if (won) {
            resolve(components);
        } else {
            interaction.message.edit({ components: components });
        }
    });
}


/**
 * @param {Interaction} interaction 
 */
async function changeBoard(bot, interaction, xp_collection) {
    interaction.deferUpdate();
    const id = interaction.customId.split('|');

    //"mswpr|y|x|<t/f>|[user]"
    const col = id[1];
    const row = id[2];
    const isbmb = (id[3] === 't');
    const user = id[4];
    if (user && user != '') {
        if (interaction.user.id != user) {
            interaction.user.send(`Message from a Minesweeper game in <#${interaction.channel.id}>: ***It's not your turn!***`);
            return; // interaction.reply({ content: "It's not your turn!", ephemeral: true }); //Can only reply once
        }
    }

    var components = interaction.message.components;
    var btn = components[col].components[row];

    if (isbmb) {
        gameOver(interaction);
        bot.mongoconnection.then((client) => { client.db(interaction.guildId).collection(interaction.user.id).updateOne({ game: {$exists: true} }, { $set: { game: null } }); });
        const channel = bot.channels.cache.get(interaction.message.channel.parentId);
        channel.send(`${interaction.user} found a bomb in Minesweeper!`);
        interaction.channel.send(`\`Thread closing\` <t:${Math.floor((new Date()).getTime()/1000) + 8}:R>`);
        
        await wait(7000);
        interaction.channel.delete();
    } else {
        btn.setDisabled(true);
        btn.label = "1";
        btn.style = "SUCCESS";
        components[col].components[row] = btn;

        let content = interaction.message.content;
        let score = Number(content.split('`')[1]);
        let tLeft = Number(content.split('`')[3]);

        //Win the game (just clicked the last tile)
        if (tLeft <= 1) {
            gameOver(interaction, true).then(async (newComp) => {
                interaction.message.edit({ content: `GAME WON!!!\nSCORE: \`${score + 1}\``, components: newComp });
                const channel = bot.channels.cache.get(interaction.message.channel.parentId);
                channel.send(`${interaction.user} won a game of Minesweeper with a score of ${score + 1}!`);
                interaction.channel.send(`\`Thread closing\` <t:${Math.floor((new Date()).getTime()/1000) + 8}:R>`);
                
                await wait(7000);
                // interaction.channel.delete();
                bot.mongoconnection.then(client => {
                    const db = client.db(interaction.guildId);
                    const dbo = db.collection(interaction.user.id);
                    winGame(client, bot, db, dbo, xp_collection, interaction.message, true);
                });
            });
        } else {
            interaction.message.edit({ content: `SCORE: \`${score + 1}\`\nTILES LEFT: \`${tLeft - 1}\``, components: components });
        }
    }
}


function checkAndStartGame(bot, message, channel, args) {
    bot.mongoconnection.then(client => {
        const db = client.db(message.guild.id);
        const dbo = db.collection(message.author.id);
        dbo.findOne({game: {$exists: true}}).then((doc) => {
            try {
                if (doc.game != null) { return message.reply("You're already in a game!"); }

                dbo.updateOne({ "game": {$exists: true} }, { $set: { game: "minesweeper", state: STATE.FIGHTING }});
                startGame(bot, channel, message, args);
            } catch (err) {
                console.log(err);
                const { addComplaintButton } = require('../dev only/submitcomplaint.js');
                addComplaintButton(bot, message);
            }
        });
    });
}


function handle(bot, interaction, channel = null, message = null, args = null, xp_collection = null) {
    if (channel != null && args != null) {
        checkAndStartGame(bot, message, channel, args);
    } else {
        //Maybe add player checking later?
        changeBoard(bot, interaction, xp_collection);
    }
}


module.exports = { handle }