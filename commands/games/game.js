// // @ts-check //Disabled

const { MongoClient, ServerApiVersion } = require('mongodb');
let ecoimport = require("../db/econ.js");

//#region Game Imports
const battle = require("./battle.js");
const ttt = require('./tictactoe.js');
const trivia = require('./trivia.js');

//#endregion

let snowflake = require("../db/addons/snowflake.js");
const STATE = ecoimport.STATE;
const BASE = ecoimport.BASE;

const { winGame, loseGame, equipItem } = require('./external_game_functions.js');
const { chooseClass, presentClasses } = require('./game_classes.js');

//Has a list of all games (used to change player state)
const allGames = ['battle', 'Tic Tac Toe'];
// const { NULL } = require('mysql/lib/protocol/constants/types');


//#region functions (NOT GAME SPECIFIC)

/** Adds the game type tag to the user(s) so the system can tell what game they're playing
 * @param other_dbo optional, include if the game has two players
*/
async function Initialize(bot, user_dbo, command, message, first, second, other_dbo = null) {
    return new Promise(async function(resolve, reject) {
        user_dbo.find({"game": {$exists: true}}).toArray(function(err, docs){
            let doc = docs[0];
            console.log(command);
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
function getGame(message, args, db) {
    let id;
    var temp;

    if (args.length == 1 && String(args[0]).startsWith('<')) { id = args[0].substr(2, args[0].length - 3)}
    else { id = message.author.id; }
    var user_dbo = db.collection(message.author.id);

    user_dbo.find({"game": {$exists: true}}).toArray(function(err, docs){
        const doc = docs[0];
        if (doc.game == null) {
            return message.reply(`<@${id}> is not currently playing a game!`);
        }

        temp = `<@${id}> is currently playing "${doc.game}"`;

        if (doc.opponent != null) {
            temp += ` with <@${doc.opponent}>`
        }

        message.reply(temp);
    });
}

function acceptIsValid(bot, other_discord, message, msg, tag_len) {

    if (other_discord == undefined) {
        message.reply("This is not a valid invite!");
        return false;
    }

    //Make sure the bot was the one creating the invite
    let check0 = msg.author.bot;

    //Author
    let tag = msg.content.substr(2, tag_len);
    let check1 = Number(tag) == Number(message.author.id);

    //Time (within the last 5 min)
    let prev = snowflake.convertSnowflakeToDate(msg.id);
    let now = snowflake.convertSnowflakeToDate(message.id);
    // @ts-ignore
    let diff = now - prev;
    var minutes = Math.floor((diff/1000)/60);
    let check2 = minutes <= 5 || bot.inDebugMode;

    if (!check0) { message.reply("really?"); }
    else if (!check1 && check2) { message.reply("_INVALID USER_"); }
    else if (check1 && !check2) { message.reply("_THIS INVITE EXPIRED!_"); }
    else if (!check1 && !check2) { message.reply("_THIS MESSAGE HAS AN INVALID USER AND HAS EXPIRED_")}

    return (check0 && check1 && check2);
}


function hpmp(message, command, dbo) {
    // throw 'THIS HAS NOT BEEN UPDATED WITH THE MOST RECENT VERSION OF THE MONGODB STRUCTURE!';
    if (command == 'hp') {
        dbo.find({"hpmp": {$exists: true}}).toArray(function(err, doc) {
            return message.reply(`You have ${String(doc[0].hpmp.hp)} hp left!`);
        });
    } else if (command == 'mp') { 
        dbo.find({"hpmp": {$exists: true}}).toArray(function(err, doc) {
            return message.reply(`You have ${String(doc[0].hpmp.hp)} mp left!`);
        });
    }
}


function equip(message, args, command, dbo, bot, shop) {
    const inp = args[1];

    //Check if the user is already in a game
    dbo.find({'game': {$exists: true}}).toArray(function(err, docs) {
        const doc = docs[0];
        
        if (doc.game != null) {
            ret = true;
            // console.log(doc.game);
            return message.reply('You can\'t equip while in a game!');
        }

        //If the thing is a shield, add it to secondary
        if (inp.toLowerCase().indexOf('shield') != -1) {
            dbo.find({def: true}).toArray(function(err, docs) {
                if (docs[0] != undefined) {
                    dbo.updateOne({}, {$set: {'equipped.weapons.secondary': docs[0]}});
                } else {
                    message.reply("You don't own a shield!");
                }
            });

        } else {
            //Else, equip the weapon(s)
            
            dbo.find({name: inp, sect: 'Weapons'}).toArray(function(err, docs) {
                if (docs[0] != undefined) {
                    //Equip the weapon
                    dbo.updateOne({}, {$set: {'equipped.weapons.main': docs[0]}});
                } else {
                    message.reply(`You don't own any ${inp}s!`);
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
    async execute(bot, message, args, command, Discord, mongouri, items, xp_collection) {


//#region Setup
    const id = message.author.id;
    const server = message.guild.id;

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
    ecoimport.CreateNewCollection(message, client, server, id);
    command = args[0];

    //Check for a second person and create a second database entry if neccessary
    if (message.mentions.users.first() != undefined) {
        ecoimport.CreateNewCollection(message, client, server, message.mentions.users.first().id);
    }

//#endregion
        const db = client.db(String(server));
        const dbo = db.collection(id);

        //Check if the client is currently in a game and act accordingly
//#region Check Game
        dbo.find({"game": {$exists: true}}).toArray(async function(err, docs){
            if (err) { return console.log(err); }
            let doc = docs[0];
            let game = null;
            if (doc) { game = doc.game; }
//#endregion

//#region non-game-specific commands
            //For TWO+ PLAYER games only!!!
            if (command == 'accept') {
                //Handle the messages
                if (message.reference == null) { return message.reply("Please reply to a valid battle request message!"); }
                let mid = message.reference.messageId;
                let msg = await message.channel.messages.fetch(mid);

                //Check if the person actually challenged you
                //Get the length of any user tag
                let mentioned = msg.mentions.users.keys();

                let tag_len = String(mentioned.next().value).length;

                //<@tage_len>, <@  --2+tag_len+2+3 = 7+tag_len
                let other_tag = msg.content.substr(7+tag_len, tag_len);
                
                const other_discord = msg.mentions.users.get(other_tag);

                //Should also check if the player is already playing a game!!!
                if (!acceptIsValid(bot, other_discord, message, msg, tag_len)) { return; }

                //Get the opponent
                const other = db.collection(other_discord.id);
                let startPos = msg.content.indexOf('"') + 1;
                let newCommand = msg.content.substr(startPos, msg.content.lastIndexOf('"') - startPos);


                //#region BOT SECTION

                //Store both IDs in the database (for turns)
                let name_first = await bot.users.cache.get(id);
                let name_second = await bot.users.cache.get(other_discord.id);

                // message.reply(`${first} [${name_first}], ${second} [${name_second}]`); throw 'ERR';
                const threadname = `${name_first.username} VS ${name_second.username} [${newCommand.toUpperCase()}]`;
                var newObj = {0: id, 1: other_discord.id, turn: 0, thread: threadname};

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



                //Need this for all 2 player games
                const result = Initialize(bot, dbo, newCommand, msg, id, other_discord.id, other);

                if (newCommand == 'battle') {
                    result.then(function (thread) {
                        battle.handle(client, dbo, other, bot, thread, 'initalize', mongouri, items, null, xp_collection);
                    });
                } else if (newCommand == 'Tic Tac Toe') {
                    result.then(function (thread) {
                        ttt.handle(client, db, dbo, other, bot, thread, 'initalize', mongouri, null, xp_collection);
                    });
                }
            } else if (command == 'quit') {

                const channel = bot.channels.cache.get(message.channel.parentId);
                //Remove the turn counter from the bot's database
                serverinbotdb.deleteOne({0: id} || {1: id});
                if (doc.opponent != null) {
                    // let other = message.guild.members.cache.get(doc.opponent);
                    let other = db.collection(doc.opponent);
                    channel.send(`<@${message.author.id}> has quit a game of "${game}" with <@${doc.opponent}>!`);
                    winGame(client, bot, db, other, xp_collection, message);
                } else {
                    loseGame(dbo, xp_collection, message, bot);
                    channel.send(`<@${message.author.id}> has quit a game of "${game}"!`);
                }
            }
            else if (command == 'status') {
                getGame(message, args, db);
            } else if (command == 'hp' || command == 'mp') {
                hpmp(message, command, dbo);
            } else if (command == 'equip') {
                // equipItem(client, bot, db, dbo, message);
                equip(message, args, command, dbo, bot, items);
            } else if (command == 'classes') {
                presentClasses(message, args[1]);
            }
//#endregion

//#region game-specific commands
            else {
                if (command == undefined) { return message.reply("Please specify a game or use _!game help_"); }

                //Make change to new name if necessary
                if (command.replaceAll(" ", "").toLowerCase() == 'tictactoe') { command = 'Tic Tac Toe'; }
                
                if (game == 'battle' || command == 'battle') {
                    if (!bot.inDebugMode) { return message.reply("This command is currently in development!"); }
                    
                    //Handle sending the request and making sure the user exists here
                    let other_discord = message.mentions.users.first();
                    if (other_discord == undefined) {
                        return message.reply(`${args[1]} is not a valid user!`);
                    }
                    
                    message.channel.send(`${other_discord}, <@${message.author.id}> has invited you to play _"battle"_. To accept, please reply to this message with _!game accept_`);
                } else if (game == 'Tic Tac Toe' || command == 'Tic Tac Toe') {
                    let other_discord = message.mentions.users.first();
                    if (other_discord == undefined) {
                        return message.reply(`${args[1]} is not a valid user!`);
                    }
                    
                    message.channel.send(`${other_discord}, <@${message.author.id}> has invited you to play _"Tic Tac Toe"_. To accept, please reply to this message with _!game accept_`);
                } else if (game == 'trivia' || command == 'trivia') {
                    trivia.execute(message, args, Discord, client, bot);
                }


                //Catch statement (invalid command)
                else {
                    message.reply(`'${bot.prefix}game ${command}' is not a command!`);
                }
            }
//#endregion

        });
    }, allGames, in_game_redirector
}


//#endregion