const { MongoClient, ServerApiVersion } = require('mongodb');
const { createSubscriptionManual } = require('./premium/stripe.js');
const { pause_start_stop, playNext, showQueue } = require('./misc/playAudio.js');
const { resolveComplaint } = require('./dev only/submitcomplaint.js');
// const { RSSInteractionHandler } = require('./premium/rssFeed.js');


async function handle_interaction(interaction, mongouri, turnManager, bot, STATE, items, xp_collection) {
    if (interaction.isButton()) {
        const battlecommandlist = ['ATTACK', 'HEAL', 'DEFEND', 'ITEMS', 'ULTIMATE'];
        const singleCommandGames = ['ttt']; // Use when you have more single-player games
        const musicCommandList = ['PLAY', 'PAUSE', 'RESUME', 'STOP', 'SKIP'];

        bot.mongoconnection.then(async (client) => {

            if (battlecommandlist.indexOf(interaction.customId) != -1) {
                await interaction.deferReply();

                let current_user = turnManager.getTurn(client, bot, interaction);
                
                current_user.then(function (result) {
                    const id = result[0];
                    const doc = result[1];
                    const threadname = doc.thread;
                    const dbo = client.db(interaction.guildId).collection(id);

                    dbo.find({ 'state': {$exists: true} }).toArray(async function (err, docs) {
                        if (interaction.user.id == id) {

                            //Check State
                            if (docs[0].state != STATE.IDLE) {
                                //Do turn stuff
                                bot.commands.get('game').in_game_redirector(bot, interaction, threadname, doc, client, mongouri, items, xp_collection);
                            }

                            //remove the old interation message
                            await interaction.message.delete();
                            
                            if (interaction.customId.toLowerCase() != 'heal') {
                                interaction.editReply(`<@${interaction.user.id}> used _${interaction.customId.toLowerCase()}_!`);
                            }
                        } else {
                            console.log("It's not your turn!");
                        }
                    });
                });
            } else if (interaction.customId.split('|')[0] == 'ttt') { 
                let current_user = turnManager.getTurn(client, bot, interaction);
                current_user.then(function (result) {
                    const id = result[0];

                    if (interaction.user.id == id) {
                        const doc = result[1];
                        const threadname = doc.thread;

                        let board = result.board;
                        
                        bot.commands.get('game').in_game_redirector(bot, interaction, threadname, doc, client, mongouri, items, xp_collection, board);
                    } else {
                        console.log("It's not your turn!");
                    }
                });
            } else if (musicCommandList.indexOf(interaction.customId) != -1 || interaction.customId.indexOf('audioQueue|') != -1) {
                if (interaction.customId == 'SKIP') {
                    playNext(interaction, bot);
                } else if (interaction.customId.indexOf('audioQueue|') != -1) {
                    const page = Number(interaction.customId.split('|')[1]);
                    showQueue(bot, interaction.message, interaction, page);
                } else {
                    pause_start_stop(interaction, bot);
                }
                
            } else if (interaction.customId == 'DEBUGURGENT' || interaction.customId == 'DEBUGDONE') {
                resolveComplaint(interaction);
            } //Button else ifs here
        });
    }

    //Menu Selection
    else if (interaction.isSelectMenu()) {
        const id = interaction.customId.substring(0, interaction.customId.indexOf('|'))
        // const command = interaction.customId.substring(interaction.customId.indexOf('|'), interaction.customId.length - interaction.customId.indexOf('|'))
        
        if (interaction.customId.toLowerCase().indexOf('|heal') != -1) {
            bot.mongoconnection.then(client => {
                console.log(id);
                if (id != interaction.user.id) { return; }

                let current_user = turnManager.getTurn(client, bot, interaction);
                current_user.then(function(result) {
                    const doc = result[1];
                    const threadname = doc.thread;
                    const dbo = client.db(interaction.guildId).collection(id);

                    dbo.find({ 'state': {$exists: true} }).toArray(async function (err, docs) {
                        if (interaction.user.id == id) {
                            await interaction.deferReply();

                            //Check State
                            if (docs[0].state == STATE.FIGHTING) {
                                interaction.customId = 'usepotion';
                                //Do turn stuff
                                bot.commands.get('game').in_game_redirector(bot, interaction, threadname, doc, client, mongouri, items, xp_collection);
                            }

                            interaction.editReply(`<@${interaction.user.id}> used a _${interaction.values[0]}_!`);

                            //remove the old interation message
                            await interaction.message.delete();
                            
                        } else {
                            console.log("It's not your turn!");
                        }
                    });
                });

                //Get all chars from after "CUSTOM|" to the end of the str
                // let name = item.icon.substr(7, item.icon.length - 6);
            });
        } else if (interaction.customId.toLowerCase().indexOf('|item') != -1) {

        } else if (interaction.customId.split('|')[1] == 'premium') {
            //Check if the person subscribing and the person clicking are the same (group DM catch)
            const user = interaction.customId.split('|')[0];
            if (interaction.user.id == user) {
                // await interaction.deferReply();
                await interaction.update({ content: 'TIER SELECTED PLEASE HOLD', components: [] });
                await createSubscriptionManual(bot, interaction, user, interaction.values[0]);

                //Handle the interaction here
            }
        } /*else if (interaction.customId.indexOf('RSS') != -1) {
            RSSInteractionHandler(bot, interaction);
        }*/  //menu else ifs here
    } //other selection types here
}


module.exports = { handle_interaction }

//values: [ 'price_1LI5pzFtuywsbrwdlY1gWMkV' ]
//values: [ 'price_1LIpROFtuywsbrwdmxOb8Baj' ]