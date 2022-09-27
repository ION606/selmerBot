const { cleardb } = require('./spam_collection.js');

function devCheck(message, bot) {
    const command = message.content.split(' ')[0].slice(1);
    const args = message.content.split(' ')[1];
    const member = bot.guilds.cache.get(bot.home_server).members.cache.get(message.author.id);

    //Check if they have the "Selmer Dev" role
    if (member.roles.cache.has('944048889038774302')) {
        switch (command) {
            case 'spam_collection': if (args[0] != undefined) { cleardb(args[0]); }
            break;
        }
    }
}

module.exports = { devCheck }