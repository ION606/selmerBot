//@ts-check
const { MongoClient, ServerApiVersion } = require('mongodb');
const { CreateNewCollection } = require("../db/econ");


async function setWelcomeChannel(dbo, message, channelname) {
    const channel = message.guild.channels.cache.find(ch => ch.name === channelname);
    dbo.insertOne({welcomechannel: channel});
}



async function execute(bot, message, args, command, Discord, mongouri, items, xp_collection) {
    const server = message.guild.id;
    const owner = message.guild.members.cache.get(message.guild.ownerId);

    if (message.author.id != message.guild.ownerId) {
        return message.reply('Only the server owner can do this!')
    }

    // @ts-ignore
    const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    if (client.writeConcern || client.writeConcern) { 
        client.close();
        return message.reply("Something went wrong with the database, please try again later and contact support if this problem persists!");
    }

    //Initialize
    CreateNewCollection(message, client, server, owner.user.id);

    client.connect(err => {
        if (err) { return console.log(err); }

        const db = client.db(server);
        const dbo = db.collection('SETUP');

        //Chose the appropriate command
        command = args[0];

        if (command == 'welcome_channel') {
            if (args.length != 2) { return message.reply('The command format is _!setup welcome_channel <channel name>_'); }
            // setWelcomeChannel(dbo, message, args[1]);
            const channel = message.guild.channels.cache.find(ch => ch.name === args[1]);
            dbo.updateOne({welcomechannel: {$exists: true}}, {$set: {welcomechannel: `${channel.id}`}});
        } else if (command == 'welcome_message') {
            if (args.length < 2) { return message.reply('The command format is _!setup welcome\\_message_\nUse _{sn}_ to insert the server name, _{un}_ to insert the user name, and _{ut}_ to insert the user tag\nExample: _!setup welcome\\_message Welcome to {sn} Sir {un}#{ut}_'); }
            let msg = "";
            for (let i = 1; i < args.length; i ++ ) {
                msg += args[i] + ' ';
            }

            if (msg.length > 30) { return message.reply('Please specify a welcome message under 30 characters!'); }
            dbo.updateOne({welcomemessage: {$exists: true}}, {$set: {welcomemessage: msg}})
        }
    });

    client.close();
}





module.exports = {
    name: 'setup',
    description: 'N/A',
    execute
}