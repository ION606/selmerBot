// // @ts-check //Disabled

// Maybe have the interaction type be "user" https://canary.discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-types
const { MessageActionRow, MessageButton, Message } = require('discord.js');
const { MongoClient, ServerApiVersion } = require('mongodb');
let ecoimport = require("../db/econ.js");

//#region Game Imports
const battle = require("./battle.js");
const ttt = require('./tictactoe.js');
const trivia = require('./trivia.js');
const mnswpr = require('./minesweeper.js');

//#endregion

let snowflake = require("../db/addons/snowflake.js");
const STATE = ecoimport.STATE;
const BASE = ecoimport.BASE;

const { winGame, loseGame, equipItem } = require('./external_game_functions.js');
const { chooseClass, presentClasses } = require('./game_classes.js');

//Has a list of all games (used to change player state)
const allGames = ['battle', 'Tic Tac Toe'];



//#region functions (NOT GAME SPECIFIC)

/** Adds the game type tag to the user(s) so the system can tell what game they're playing
 * @param other_dbo optional, include if the game has two players
*/
async function Initialize(bot, user_dbo, command, message, first, second, other_dbo = null) {
    return new Promise(async function(resolve, reject) {
        user_dbo.findOne({"game": {$exists: true}}).then(function(doc){
            if (allGames.indexOf(command) != -1) {
                if (other_dbo != null) {
                    user_dbo.updateOne( { "game": {$exists: true} }, { $set: { game: command, opponent: other_dbo.s.namespace.collection, state: STATE.FIGHTING }});
                    other_dbo.updateOne({ "game": {$exists: true} }, { $set: { game: command, opponent: user_dbo.s.namespace.collection, state: STATE.FIGHTING }});
                } else {
                    user_dbo.updateOne({ "game": {$exists: true} }, { $set: { game: command, state: STATE.FIGHTING }});
                }

            } else { message.reply(`ERROR! ${command} IS NOT A GAME!`); }
        });

        //Create a new thread for the game (maybe uneccesary???) - done before initialize
        let name_first = await bot.users.cache.get(first);
        let name_second = await bot.users.cache.get(second);

        // message.reply(`${first} [${name_first}], ${second} [${name_second}]`); throw 'ERR';
        const threadname = `${name_first.username} VS ${name_second.username} [${command.toUpperCase()}]`;

        const thread = await message.channel.threads.create({
            name: threadname,
            // type: 'GUILD_PRIVATE_THREAD',
            autoArchiveDuration: 60,
            reason: `N/A`,
        });
        
        //Need lvl 2 boost for this
        // thread.add(first);
        // thread.add(second);

        message.channel.send(`<@${first}> and <@${second}> have started a game of ***${command.toUpperCase()}!***`);

        resolve(thread);
    });
}

//#endregion

//replies to the message with current game specifics
function getGame(interaction, args, db) {
    let id;
    var temp;

    if (args.length == 1 && String(args[0]).startsWith('<')) { id = args[0].substr(2, args[0].length - 3)}
    else { id = interaction.user.id; }
    var user_dbo = db.collection(interaction.user.id);

    user_dbo.find({"game": {$exists: true}}).toArray(function(err, docs){
        const doc = docs[0];
        if (doc.game == null) {
            return interaction.reply(`<@${id}> is not currently playing a game!`);
        }

        temp = `<@${id}> is currently playing "${doc.game}"`;

        if (doc.opponent != null) {
            temp += ` with <@${doc.opponent}>`
        }

        interaction.reply(temp);
    });
}

function acceptIsValid(bot, other_discord, interaction, invUserId, message) {

    if (other_discord == undefined) {
        interaction.reply("This is not a valid invite!");
        return false;
    }

    //Make sure the bot was the one creating the invite
    let check0 = message.author.bot;

    //Author
    let check1 = Number(other_discord.id) == Number(invUserId);

    //Time (within the last 5 min)
    let prev = snowflake.convertSnowflakeToDate(message.id);
    let now = snowflake.convertSnowflakeToDate(interaction.id);
    // @ts-ignore
    let diff = now - prev;
    var minutes = Math.floor((diff/1000)/60);
    let check2 = minutes <= 5 || bot.inDebugMode;

    if (!check0) { interaction.reply("really?"); }
    else if (!check1 && check2) { interaction.reply("_INVALID USER_"); }
    else if (check1 && !check2) { interaction.reply("_THIS INVITE EXPIRED!_"); }
    else if (!check1 && !check2) { interaction.reply("_THIS MESSAGE HAS AN INVALID USER AND HAS EXPIRED_")}

    return (check0 && check1 && check2);
}


function hpmp(interaction, command, dbo) {
    // throw 'THIS HAS NOT BEEN UPDATED WITH THE MOST RECENT VERSION OF THE MONGODB STRUCTURE!';
    
    dbo.find({"hpmp": {$exists: true}}).toArray(function(err, doc) {
        interaction.reply(`You have ${String(doc[0].hpmp.hp)} hp and ${String(doc[0].hpmp.mp)} mp left!`);
    });

    /*
    if (command == 'hp') {
        dbo.find({"hpmp": {$exists: true}}).toArray(function(err, doc) {
            return interaction.reply(`You have ${String(doc[0].hpmp.hp)} hp left!`);
        });
    } else if (command == 'mp') { 
        dbo.find({"hpmp": {$exists: true}}).toArray(function(err, doc) {
            return interaction.reply(`You have ${String(doc[0].hpmp.MP)} mp left!`);
        });
    }
    */
}


function equip(interaction, inp, command, dbo, bot, shop) {
    // const inp = args[1];
    if (!inp) { return interaction.reply("Please provide input (either a weapon for main or shield for secondary)"); }

    //Check if the user is already in a game
    dbo.find({'game': {$exists: true}}).toArray(function(err, docs) {
        const doc = docs[0];
        
        if (doc.game != null) {
            ret = true;
            // console.log(doc.game);
            return interaction.reply('You can\'t equip while in a game!');
        }

        //If the thing is a shield, add it to secondary
        if (inp.toLowerCase().indexOf('shield') != -1) {
            dbo.find({def: true}).toArray(function(err, docs) {
                if (docs[0] != undefined) {
                    dbo.updateOne({}, {$set: {'equipped.weapons.secondary': docs[0]}});
                } else {
                    interaction.reply("You don't own a shield!");
                }
            });

        } else {
            //Else, equip the weapon(s)
            
            dbo.find({name: inp, sect: 'Weapons'}).toArray(function(err, docs) {
                if (docs[0] != undefined) {
                    //Equip the weapon
                    dbo.updateOne({}, {$set: {'equipped.weapons.main': docs[0]}});
                } else {
                    interaction.reply(`You don't own any ${inp}s!`);
                }
            });
        }
    });

}

//#endregion




//#region Game Handlers

function in_game_redirector(bot, interaction, threadname, doc, client, mongouri, items, xp_collection) {

    //Maybe fix this later......
    let turn = doc.turn;
    const user1 = doc[turn];
    const user2 = doc[Number(!turn)];
    const db = client.db(interaction.guildId);
    const dbo = db.collection(user1);
    const other = db.collection(user2);
    const thread = interaction.channel;

    dbo.find({'game': {$exists: true}}).toArray(function (err, docs) {
        const game = docs[0].game

        switch (game) {
            case 'battle': battle.handle(client, dbo, other, bot, thread, interaction.customId.toLowerCase(), mongouri, items, interaction, xp_collection);
            break;

            case 'Tic Tac Toe': ttt.handle(client, db, dbo, other, bot, thread, null, doc, interaction, xp_collection);
            break;
        }
    });
}


module.exports ={
    name: "game",
    description: "Play a game using Selmer Bot!",
    async execute(bot, interaction, command, Discord, mongouri, items, xp_collection) {

//#region Setup
        const id = interaction.user.id;
        const server = interaction.guildId;

        // // @ts-ignore
        // const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
        // if (client.writeConcern || client.writeConcern) { 
        //     client.close();
        //     return message.reply("Something went wrong with the database, please try again later and contact support if this problem persists!");
        // }
        var client;
        await bot.mongoconnection.then((client1) => {
            client = client1;
        });

        const botdb = client.db('B|S' + bot.user.id);
        const serverinbotdb = botdb.collection(server);

        //Initialize if necessary
        ecoimport.CreateNewCollection(interaction, client, server, id);
        var commandName = command.name;

        //Check for a second person and create a second database entry if neccessary
        if (command.options && command.options.length > 0 && command.options[0].type == "USER") {
            ecoimport.CreateNewCollection(interaction, client, server, command.options[0].value);
        }

//#endregion
        const db = client.db(String(server));
        const dbo = db.collection(id);

        //Check if the client is currently in a game and act accordingly
//#region Check Game
        dbo.find({"game": {$exists: true}}).toArray(async function(err, docs) {
            if (err) { return console.log(err); }
            let doc = docs[0];
            let game = null;
            if (doc) { game = doc.game; }
//#endregion

//#region non-game-specific commands
            //For TWO+ PLAYER games only!!!
            if (commandName == 'accept') {
                const args = interaction.customId.split('|');
                // console.log(interaction.message.interaction);
                // console.log(interaction.user);
                // return console.log(args);

                //Should also check if the player is already playing a game!!!
                if (!acceptIsValid(bot, interaction.user, interaction, args[1], interaction.message)) { return; }

                //Get the opponent
                const other_id = interaction.message.interaction.user.id;
                const other = db.collection(other_id);
                // return console.log(args, interaction.message.interaction);
                let newCommand = interaction.message.interaction.commandName.split(" ")[1];
                
                //#region BOT SECTION

                //Store both IDs in the database (for turns)
                let name_first = await bot.users.cache.get(id);
                let name_second = await bot.users.cache.get(other_id);

                // message.reply(`${first} [${name_first}], ${second} [${name_second}]`); throw 'ERR';
                const threadname = `${name_first.username} VS ${name_second.username} [${newCommand.toUpperCase()}]`;
                var newObj = {0: id, 1: other_id, turn: 0, thread: threadname};

                if (newCommand.replaceAll(" ", "").toLowerCase() == 'tictactoe') { newCommand = 'Tic Tac Toe'; }

                if (newCommand === 'Tic Tac Toe') {
                    //Create the new board
                    let newboard = ["", "", "", "", "", "", "", "", ""];
                    newObj.board = newboard;
                    let symbols;

                    /*DOES NOT WORK
                    if (msg.content.lastIndexOf('>') == msg.content.lenth) {
                        symbols = ['X', 'O'];
                    } else {
                        symbols = msg.content.substring(msg.content.lastIndexOf('>') + 2).split(' ');
                    }
                    */
                    newObj.symbols = ['X', 'O'];
                }
                
                serverinbotdb.insertOne(newObj);

                //#endregion

                const remAccptBtn = (msgToDel) => {
                    try {
                        msgToDel.edit({components: []});
                    } catch(err) {
                        console.error(err);
                    }
                }

                //Need this for all 2 player games
                const result = Initialize(bot, dbo, newCommand, interaction.message, id, other_id, other);

                if (newCommand == 'battle') {
                    result.then(function (thread) {
                        battle.handle(client, dbo, other, bot, thread, 'initalize', mongouri, items, null, xp_collection);
                        remAccptBtn(interaction.message);
                    });
                } else if (newCommand == 'Tic Tac Toe') {
                    result.then(function (thread) {
                        ttt.handle(client, db, dbo, other, bot, thread, 'initalize', mongouri, null, xp_collection);
                        remAccptBtn(interaction.message);
                    });
                }
            } else if (commandName == 'quit') {

                const channel = bot.channels.cache.get(interaction.channel.parentId);

                //Remove the turn counter from the bot's database
                serverinbotdb.deleteOne({0: id} || {1: id});
                if (doc.opponent != null) {
                    // let other = message.guild.members.cache.get(doc.opponent);
                    let other = db.collection(doc.opponent);
                    channel.send(`<@${interaction.user.id}> has quit a game of "${game}" with <@${doc.opponent}>!`);
                    winGame(client, bot, db, other, xp_collection, interaction);
                } else {
                    loseGame(dbo, xp_collection, interaction, bot);
                    channel.send(`<@${interaction.user.id}> has quit a game of "${game}"!`);
                }
            }
            else if (commandName == 'status') {
                getGame(interaction, args, db);
            } else if (commandName == 'hpmp') {
                hpmp(interaction, commandName, dbo);
            } else if (command == 'equip') {
                // equipItem(client, bot, db, dbo, message);
                // This does not work
                equip(interaction, args, command, dbo, bot, items);
            } else if (command == 'classes') {
                // This does not work
                presentClasses(message, args[1]);
            }
//#endregion

//#region game-specific commands
            else {
                if (commandName == undefined) { return interaction.reply("Please specify a game or use _!game help_"); }

                //Make change to new name if necessary
                if (commandName.replaceAll(" ", "").toLowerCase() == 'tictactoe') { commandName = 'Tic Tac Toe'; }
                
                //RETURN TO THIS LATER
                if (game == 'battle' || commandName == 'battle') {
                    if (!bot.inDebugMode) { return interaction.reply("This command is currently in development!"); }
                    
                    const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                        .setCustomId(`gameaccept|${command.options[0].value}|${interaction.user.id}`)
                        .setLabel('Accept Invite')
                        .setStyle('SUCCESS')
                    );

                    const content = {content: `${command.options[0].user}, ${interaction.user} has invited you to play _"Tic Tac Toe"_. Click the button to accept the invitation!`, components: [row]};
                    interaction.reply(content).catch((err) => interaction.channel.send(content));

                } else if (game == 'Tic Tac Toe' || commandName == 'Tic Tac Toe') {
                    const row = new MessageActionRow()
                    .addComponents(
                        new MessageButton()
                        .setCustomId(`gameaccept|${command.options[0].value}|${interaction.user.id}`)
                        .setLabel('Accept Invite')
                        .setStyle('SUCCESS')
                    );

                    const content = {content: `${command.options[0].user}, ${interaction.user} has invited you to play _"Tic Tac Toe"_. Click the button to accept the invitation!`, components: [row]};
                    interaction.reply(content).catch((err) => interaction.channel.send(content));
                } else if (game == 'trivia' || commandName == 'trivia') {
                    trivia.execute(interaction, Discord, client, bot);
                } else if (game == "minesweeper" || commandName == 'minesweeper') {
                    if (game == "minesweeper" && commandName == 'minesweeper') {
                        return message.reply("You're already in a game!");
                    }
                    const threadname = `${interaction.user.username} is playing Minesweeper`;
                    const thread = await interaction.channel.threads.create({
                        name: threadname,
                        // type: 'GUILD_PRIVATE_THREAD',
                        autoArchiveDuration: 60,
                        reason: `N/A`,
                    });
                    mnswpr.handle(bot, interaction, thread);
                }

                //Catch statement (invalid command)
                else {
                    interaction.reply(`'/game ${commandName}' is not a command!`);
                }
            }
//#endregion

        });
    }, allGames, in_game_redirector
}


//#endregion