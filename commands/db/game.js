const { MongoClient, ServerApiVersion } = require('mongodb');
let ecoimport = require("./econ.js");
let battle = require("./battle.js");
const STATE = ecoimport.STATE;

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
                user_dbo.updateOne(doc, { $set: { game: command, opponent: other_dbo.s.namespace.collection }});
            } else {
                user_dbo.updateOne(doc, { $set: { game: command }});
            }
        }
    });
}


function resetPlayer(user_dbo) {
    user_dbo.find({"game": {$exists: true}}).toArray(function(err, docs){
        let doc = docs[0];
        user_dbo.updateOne(doc, { $set: { game: null, opponent: null, state: STATE.IDLE }});
    });
}


function gameHelp() {
    let l = [''];

    return l.join(', ');
}

//#endregion




module.exports ={
    name: "game",
    description: "Play a game using Selmer Bot!",
    async execute(bot, message, args, command, Discord, mongouri, items, xp_collection) {

        return message.reply("This command is currently in development!");
        
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
                let game = doc.game;
                //#endregion

                if (command == 'accept') {
                    //Handle the messages
                    if (message.reference == null) { return message.reply("Please reply to a valid battle request message!"); }
                    let mid = message.reference.messageId;
                    let msg = await message.channel.messages.fetch(mid);

                    //Check if the person actually challenged you
                    let mentioned = msg.mentions.users.keys();
                    const other_discord = mentioned.next().value;

                    //Get the opponent
                    const other = db.collection(other_discord);
                    Initialize(dbo, command, message);
                    battle.handle(dbo, other, bot, message, args, command, Discord, mongouri, items, xp_collection);
                } else {
                    if (game == 'battle' || command == 'battle') {
                        //Handle sending the request and making sure the user exists here
                        let other_discord = message.mentions.users.first();
                        if (other_discord == undefined) {
                            return message.reply(`${args[1]} is not a valid user!`);
                        }
                        
                        message.channel.send(`<@${other_discord}>, <@${message.author.id}> has invited you to battle, to accept, please reply to this message with !accept`);
                    }

                    //Catch statement (invalid command)
                    else {
                        message.reply(`'!game ${command}' is not a command!`);
                    }
                }

            });
        });

        client.close();
    }
}