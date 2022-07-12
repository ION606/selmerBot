const { convoManager } = require('./premium/chat.js');
const { handleInp } = require('./premium/stripe');
const { MongoClient, ServerApiVersion, ConnectionClosedEvent } = require('mongodb');

function handle_dm(message, bot) {
    if (message.author.bot) { return; }
    
    if (!message.content.startsWith('!') || message.content.split(' ')[0] == '!startconvo' || message.content.split(' ')[0] == '!endconvo') {
        const member = bot.guilds.cache.get(bot.home_server).members.cache.get(message.author.id);

        const client = new MongoClient(bot.mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
        client.connect(async (err) => {
            if (err) { return console.log(err); }

            const dbo = client.db('main').collection('authorized');
            dbo.find({id: message.author}).toArray((err, docs) => {

                //Only available to Selmer Bot devs, testers and "authorized" users
                if (docs[0] != undefined || member.roles.cache.has('944048889038774302') || member.roles.cache.has('946610800418762792')) {
                    convoManager(client, bot, message);
                } else {
                    message.reply("You have to be a premium subscriber to use this feature!\n_support coming soon_");
                }
            });
        });

        client.close();
    } else if (message.content.indexOf('!premium') != -1) {
        handleInp(bot, message);
    } else {
        return message.reply('UNUSABLE DM COMMAND DETECTED');
    }

    //Selmer Bot is conversing with them
    
}


module.exports = { handle_dm }