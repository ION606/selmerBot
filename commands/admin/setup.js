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
        return message.reply('Only the server owner can do this!');
    }

    // // @ts-ignore
    // const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    // if (client.writeConcern || client.writeConcern) { 
    //     client.close();
    //     return message.reply("Something went wrong with the database, please try again later and contact support if this problem persists!");
    // }

    bot.mongoconnection.then(async (client) => {
        // if (err) { return console.log(err); }
        //Initialize
        CreateNewCollection(message, client, server, owner.user.id);

        const db = client.db(server);
        const dbo = db.collection('SETUP');

        //Chose the appropriate command
        command = args[0];

        if (!command) {
            message.channel.send('Please use the following format _!setup help <welcome, logs>_');
        } else if (command == 'welcome_channel') {
            if (args.length != 2) { return message.reply('The command format is _!setup welcome_channel <channel name>_'); }
            // setWelcomeChannel(dbo, message, args[1]);
            const channel = message.guild.channels.cache.find(ch => ch.name === args[1]);
            if (!channel) { return message.reply('The specified channel does not exist!'); }

            dbo.updateOne({welcomechannel: {$exists: true}}, {$set: {welcomechannel: `${channel.id}`}});
            message.reply(`Set ${channel} as the new welcome channel`)
        } else if (command == 'welcome_message') {
            if (args.length < 2) { return message.reply('The command format is _!setup welcome\\_message_\nUse _{sn}_ to insert the server name, _{un}_ to insert the user name, and _{ut}_ to insert the user tag\nExample: _!setup welcome\\_message Welcome to {sn} Sir {un}#{ut}_'); }
            let msg = "";
            for (let i = 1; i < args.length; i ++ ) {
                msg += args[i] + ' ';
            }

            if (msg.length > 30) { return message.reply('Please specify a welcome message under 30 characters!'); }
            dbo.updateOne({welcomemessage: {$exists: true}}, {$set: {welcomemessage: msg}})
        } else if (command == 'keep_logs') {
            if (args.length != 2) { return message.reply('Please specify a parameter\nExample: _!setup keep\\_logs true'); }

            let keeplogs = false;
            if (args[1] == 'true') { keeplogs = true; }

            dbo.updateOne({ _id: 'LOG'}, {$set: {keepLogs: keeplogs}});

            message.reply(`Toggled log keeping to ${keeplogs}. Please use _!setup log_channel_ to choose the log channel`);
        } else if (command == 'log_channel') {
            if (args.length != 2) { return message.reply('Please specify a parameter\nExample: _!setup log\\_channel true_'); }

            const channel = message.guild.channels.cache.find(ch => ch.name === args[1]);
            if (!channel) { return message.reply('The specified channel does not exist!'); }

            dbo.updateOne({_id: 'LOG'}, {$set: {logchannel: `${channel.id}`}});
            message.reply(`Made ${channel} the new Selmer Bot Logs channel!`);
        } else if (command == 'log_severity') {
            const tier = args[1];
            const l = ['none', 'low', 'medium', 'high'];
            if (!l.includes(tier)) { return message.reply("Please select an existing tier ('none', 'low', 'medium', 'high')"); }

            dbo.updateOne({_id: 'LOG'}, {$set: {severity: tier}})
        } 
        
        else if (command == 'help') {
            let temp;
            if (args[1] == 'welcome') {
                temp = 'Use _!setup welcome\\_channel [channel name]_ to set the welcome channel and _!setup welcome\\_message [message]_ to set a welcome message!\n';
            } else if (args[1] == 'logs') {
                temp = 'To enable logging, use the command _!setup keep\\_logs true_ and _!setup log\\_channel_ [channel name] to set the logging channel!\n';
                temp += 'Use _!setup keep\\_logs false_ to disable logging and _!setup log\\_severity [none, low, medium, high]_ to set the threshold\n';
                temp += '__Severities:__\n*none* - unmute, unban\n*low* - mute\n*medium* - kick\n*high* - ban\nEvery tier also includes all notifs for ***higher*** tiers (AKA _!setup log\\_severity none_ will log everything from every severity)\n';
            } else { temp = 'Please use the following format: _!setup help [welcome, logs]_\nExample: _!setup help welcome_'; }

            message.reply(temp);
        }
    });
}





module.exports = {
    name: 'setup',
    description: 'Set up server features',
    execute
}