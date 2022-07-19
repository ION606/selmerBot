//@ts-check
const { addxp, STATE, BASE } = require("../db/econ");
const turnManger = require('../turnManager.js');
const { addComplaintButton } = require('../dev only/submitcomplaint');


//#region game lose/win
function loseGame(user_dbo, xp_collection, message, bot = null) {
    return new Promise(function(resolve, reject) {
    user_dbo.find({"game": {$exists: true}}).toArray(function(err, docs){
        const doc = docs[0];
        if (doc == undefined) { 
            message.reply("Oops! There's been an error, click the ✅ to report this!");
            addComplaintButton(bot, message);
            return;
        }
        if (doc.game == null) { return message.reply("You're not even in a game and you're trying to quit! Sad..."); }

        var addbal;
        //If this function was called from "winGame", return
        if (doc.opponent) {
            //If remove some money (looting) [maybe implement a "friendly" game setting later with no looting]
            addbal = doc.rank * 2;
            if (doc.balance - addbal < 5) { addbal = addbal - doc.balance; }
            if (doc.balance > 5) {
                user_dbo.updateOne(doc, { $set: { balance: doc.balance - addbal}});
            }
        } else { message.channel.delete(); }

        //Update the player's xp
        addxp(message, user_dbo, Math.ceil((BASE.XP * doc.rank)/2),xp_collection)
        user_dbo.updateOne({"game": {$exists: true}}, { $set: { game: null, opponent: null, state: STATE.IDLE, 'hpmp.hp': doc.hpmp.maxhp, 'hpmp.mp': doc.hpmp.maxmp }});

        resolve(addbal);
    });
});

}


function winGame(client, bot, db, user_dbo, xp_collection, message) {
    user_dbo.find({"game": {$exists: true}}).toArray(function(err, docs){
        const doc = docs[0];
        
        //Check for an opponent
        if (doc.opponent != null) {
            let other = db.collection(doc.opponent);
            let promise_temp = loseGame(other, xp_collection, message);
            
            promise_temp.then(function(result) {
                var amt_taken = result;
                user_dbo.updateOne({'balance': {$exists: true}}, { $set: { balance: doc.balance + amt_taken}});
            });
        }

        //Delete the bot's record of the game
        client.db('B|S' + bot.user.id).collection(message.guild.id).drop();
        

        //Update the player with xp
        user_dbo.updateOne({"game": {$exists: true}}, { $set: { game: null, opponent: null, state: STATE.IDLE, xp: doc.xp + (BASE.XP * doc.rank), 'hpmp.hp': doc.hpmp.maxhp, 'hpmp.mp': doc.hpmp.maxmp }});

        const channel = bot.channels.cache.get(message.channel.parentId);
        channel.send(`<@${user_dbo.s.namespace.collection}> just won a game of "${docs[0].game}"!`);
        message.channel.delete();
    });
}


function equipItem(client, bot, db, dbo, message) {
    
    if (!bot.inDebugMode) { return; }
    let items = [
        { name: 'HP Potion', cost: 20, icon: 'CUSTOM|healing_potion', sect: 'HP', num: 2 },
        { name: 'Super HP Potion', cost: 50, icon: 'CUSTOM|super_healing_potion', sect: 'HP', num: 2 },
        { name: 'MP Potion', cost: 15, icon: 'CUSTOM|mana_potion', sect: 'MP', num: 2 }
    ]
    for (let i = 1; i <= 10; i ++) {
        
        items.push({ name: `${String.fromCharCode(i + 64)}`, cost: i * 10, icon: 'N/A', sect: 'N/A', num: i })
    }
    
    dbo.updateMany({}, {$set: {'equipped.items': items}});
}

function getCustomEmoji(bot, name) {
    let srv = bot.guilds.cache.get(bot.home_server).emojis.cache;
        // console.log(srv);
        let emj = srv.find((g) => { return g.name == name });
        // message.channel.send(`${emj}`);
        return `${emj}`;
}


module.exports = { winGame, loseGame, equipItem, getCustomEmoji }