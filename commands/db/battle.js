//@ts-check


function hpmp(message, command, dbo) {
    if (command == 'hp') {
        dbo.find({"hp": {$exists: true}}).toArray(function(err, doc) {
            return message.reply(`You have ${String(doc[0].hp)} hp left!`);
        });
    } else if (command == 'mp') { 
        dbo.find({"mp": {$exists: true}}).toArray(function(err, doc) {
            return message.reply(`You have ${String(doc[0].hp)} mp left!`);
        });
    }
}




//#region Exports
function verifyAndInitiate() {

}

function handle(user_dbo, other_dbo, bot, message, args, command, Discord, mongouri, items, xp_collection) {
    if (command == 'hp' || command == 'mp') {
        hpmp(message, command, user_dbo);
    } else if (command == 'initiate') {
        
    }
    // initiate(user_dbo, other_dbo, command, message);
}


//#endregion


module.exports = { handle }