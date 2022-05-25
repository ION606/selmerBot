const { MongoClient, ServerApiVersion } = require('mongodb');
let ecoimport = require("./econ.js");
let battle = require("./battle.js");
let snowflake = require("./addons/snowflake.js");
const STATE = ecoimport.STATE;
const BASE = ecoimport.BASE;

//Has a list of all games (used to change player state)
const allGames = ['battle'];
// const { NULL } = require('mysql/lib/protocol/constants/types');


//#region functions (NOT GAME SPECIFIC)

/** Adds the game type tag to the user(s) so the system can tell what game they're playing
 * @param other_dbo optional, include if the game has two players
*/
function Initialize(user_dbo, command, message, other_dbo = null) {
    user_dbo.find({"game": {$exists: true}}).toArray(function(err, docs){
        let doc = docs[0];
        if (allGames.indexOf(command) != -1) {
            if (other_dbo != null) {
                user_dbo.updateOne({ doc}, { $set: { game: command, opponent: other_dbo.s.namespace.collection }});
                other_dbo.updateOne({ game: null, opponent: null}, { $set: { game: command, opponent: user_dbo.s.namespace.collection }});
            } else {
                user_dbo.updateOne(doc, { $set: { game: command }});
            }

        } else { console.log(`ERROR! ${command} IS NOT A GAME!`); }
    });

    let mentioned = message.mentions.users.keys();
    let second = mentioned.next().value;
    message.reply(`<@${mentioned.next().value}> and <@${second}> have started a game of ***${command.toUpperCase()}!***`);
}


//#region game lose/win
function loseGame(user_dbo, xp_collection) {
    user_dbo.find({"game": {$exists: true}}).toArray(function(err, docs){
        const doc = docs[0];
        
        //Update the player's xp
        user_dbo.updateOne(doc, { $set: { game: null, opponent: null, state: STATE.IDLE, xp: ecoimport.addxp(message, dbo, Math.ceil((BASE.XP * doc.rank)/2),xp_collection) }});

        //If remove some money (looting) [maybe implement a "friendly" game setting later with no looting]
        let addbal = doc.rank * 2;
        let diff = addbal;
        if (doc.balance - addbal < 5) { addbal = addbal - doc.balance; }
        if (doc.balance > 5) {
            user_dbo.updateOne(doc, { $set: { balance: doc.balance - addbal}});
        }
        user_dbo.updateOne(doc, { $set: { game: null, opponent: null, state: STATE.IDLE, xp: BASE.XP * doc.rank }});

        return addbal;
    });
}

function winGame(db, user_dbo, xp_collection) {
    user_dbo.find({"game": {$exists: true}}).toArray(function(err, docs){
        const doc = docs[0];
        
        //Update the player with xp
        user_dbo.updateOne(doc, { $set: { game: null, opponent: null, state: STATE.IDLE, xp: doc.xp + (BASE.XP * doc.rank) }});

        //Check for an opponent
        if (doc.opponent != null) {
            let other = db.collection(doc.opponent);
            let amt_taken = loseGame(other, xp_collection);
            user_dbo.updateOne(doc, { $set: { balance: doc.balance + amt_taken}});
        }
    });
}

//#endregion


function resetPlayer(db, user_dbo, message) {
    user_dbo.find({"game": {$exists: true}}).toArray(function(err, docs){
        const doc = docs[0];
        
        if (doc.game == null) { return message.reply("You're not even in a game and you're trying to quit! Sad..."); }
        user_dbo.updateOne(doc, { $set: { game: null, opponent: null, state: STATE.IDLE }});

        let temp = `${message.author} has quit a game of ${doc.game}!`;

        if (doc.opponent != null) {
            let other = db.collection(doc.opponent);
            
        }
        message.reply(temp);
    });
}


function acceptIsValid(other_discord, message, msg) {

    if (other_discord == undefined) {
        message.reply("This is not a valid invite!");
        return false;
    }

    //Make sure the bot was the one creating the invite
    let check0 = msg.author.bot;

    //Author
    let check1 = other_discord.id == message.author.id;

    //Time (within the last 5 min)
    let prev = snowflake.convertSnowflakeToDate(msg.id);
    let now = snowflake.convertSnowflakeToDate(message.id);
    let diff = now - prev;
    var minutes = Math.floor((diff/1000)/60);
    let check2 = minutes <= 5;

    if (!check0) { message.reply("really?"); }
    else if (!check1 && check2) { message.reply("_INVALID USER_"); }
    else if (check1 && !check2) { message.reply("_THIS INVITE EXPIRED!_"); }
    else if (!check1 && !check2) { message.reply("_THIS MESSAGE HAS AN INVALID USER AND HAS EXPIRED_")}

    return (check0 && check1 && check2);
}

//#endregion



module.exports ={
    name: "game",
    description: "Play a game using Selmer Bot!",
    async execute(bot, message, args, command, Discord, mongouri, items, xp_collection) {

        if (!bot.inDebugMode) { return message.reply("This command is currently in development!"); }
        
        const id = message.author.id;
        const server = message.guild.id;

        const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
        if (client.writeConcern || client.writeConcern) { 
            client.close();
            return message.reply("Something went wrong with the database, please try again later and contact support if this problem persists!");
         }

        //Initialize if necessary
        ecoimport.CreateNewCollection(message, client, server, id);
        command = args[0];

        //Check for a second person and create a second database entry if neccessary
        if (message.mentions.users.first() != undefined) {
            ecoimport.CreateNewCollection(message, client, server, message.mentions.users.first().id);
        }

        client.connect(err => {
            const db = client.db(String(server) + "[ECON]");
            const dbo = db.collection(id);
            if (err) { return console.log(err); }

            //Check if the client is currently in a game and act accordingly
            //#region Check Game
            dbo.find({"game": {$exists: true}}).toArray(async function(err, docs){
                if (err) { return console.log(error); }
                let doc = docs[0];
                let game = null;
                if (doc) { game = doc.game; }
                //#endregion

                if (command == 'accept') {
                    //Handle the messages
                    if (message.reference == null) { return message.reply("Please reply to a valid battle request message!"); }
                    let mid = message.reference.messageId;
                    let msg = await message.channel.messages.fetch(mid);

                    //Check if the person actually challenged you
                    let mentioned = msg.mentions.users.keys();
                    const other_discord = mentioned.next().value;

                    if (!acceptIsValid(other_discord, message, msg)) { return; }

                    //Get the opponent
                    const other = db.collection(other_discord);
                    let startPos = msg.content.indexOf('"') + 1;
                    let newCommand = msg.content.substr(startPos, msg.content.lastIndexOf('"') - startPos);

                    if (newCommand == 'battle') {
                        Initialize(dbo, newCommand, msg, other);
                        battle.handle(dbo, other, bot, message, args, 'initiate', Discord, mongouri, items, xp_collection);
                    }
                } else {
                    if (command == 'quit') {
                        winGame(db, dbo, xp_collection);
                    } else if (game == 'battle' || command == 'battle') {
                        //Handle sending the request and making sure the user exists here
                        let other_discord = message.mentions.users.first();
                        if (other_discord == undefined) {
                            return message.reply(`${args[1]} is not a valid user!`);
                        }
                        
                        message.channel.send(`${other_discord}, <@${message.author.id}> has invited you to play "battle", to accept, please reply to this message with _!game accept_`);
                    }

                    //Catch statement (invalid command)
                    else {
                        if (command == undefined) { message.reply("Please specify a game or use _!game help_"); }
                        else { message.reply(`'!game ${command}' is not a command!`); }
                    }
                }

            });
        });

        client.close();
    }, allGames
}