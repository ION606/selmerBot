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
        if (command == 'welcomechannel') {
            if (args.length != 2) { return message.reply('The command format is _!setup welcomechannel <channel name>_'); }
            // setWelcomeChannel(dbo, message, args[1]);
            const channel = message.guild.channels.cache.find(ch => ch.name === args[1]);
            dbo.updateOne({welcomechannel: {$exists: true}}, {$set: {welcomechannel: `${channel.id}`}});
        }
    });

    client.close();
}





module.exports = {
    name: 'setup',
    description: 'N/A',
    execute
}