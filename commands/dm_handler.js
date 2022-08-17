const { convoManager } = require('./premium/chat.js');
const { handleInp } = require('./premium/stripe');
const reminders = require('./premium/reminders.js')
const { MongoClient, ServerApiVersion, ConnectionClosedEvent } = require('mongodb');

function handle_dm(message, bot) {
    if (message.author.bot) { return; }
    
    if (!message.content.startsWith('!') || message.content.split(' ')[0] == '!startconvo' || message.content.split(' ')[0] == '!endconvo') {
        const member = bot.guilds.cache.get(bot.home_server).members.cache.get(message.author.id);

        bot.mongoconnection.then(async (client) => {
            const dbo = client.db('main').collection('authorized');
            dbo.find({ discordID: message.author.id }).toArray((err, docs) => {

                //Only available to Selmer Bot devs, testers and "authorized" users
                if (docs[0] != undefined || member.roles.cache.has('944048889038774302') || member.roles.cache.has('946610800418762792')) {
                    convoManager(client, bot, message);
                } else {
                    message.reply("You have to be a premium subscriber to use this feature!\n_support coming soon_");
                }
            });
        });

    } else if (message.content.indexOf('!premium') != -1) {
        handleInp(bot, message);
    } else if (message.content.indexOf('!reminders') != -1) {
        reminders.execute(message, null, null, null, bot);
    } else {
        return message.reply('UNUSABLE DM COMMAND DETECTED');
    }

    //Selmer Bot is conversing with them
    
}


module.exports = { handle_dm }