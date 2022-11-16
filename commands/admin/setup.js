//@ts-check
const { MongoClient, ServerApiVersion } = require('mongodb');
const { Constants } = require('discord.js');
const { CreateNewCollection } = require("../db/econ");
const { checkRole } = require('./verify.js');
const fetch = require('node-fetch');


async function execute(interaction, Discord, Client, bot) {
    const server = interaction.guildId;
    const owner = interaction.guild.members.cache.get(interaction.guild.ownerId);
    const args = interaction.options.data;

    if (interaction.user.id != interaction.guild.ownerId) {
        return interaction.reply({content: 'Only the server owner can do this!', ephemeral: true});
    }

    bot.mongoconnection.then(async (client) => {
        //Initialize
        CreateNewCollection(interaction, client, server, owner.user.id);

        const db = client.db(server);
        const dbo = db.collection('SETUP');

        if (args.length < 1) { return interaction.reply({content: "Please chose a valid option", ephemeral: true}); }

        for (let i = 0; i < args.length; i++) {
            try {
                const command = args[i].name;

                // if (!command) {
                //     interaction.reply('Please use the following format _!setup help <welcome, logs>_');
                // } else
                
                if (command == 'welcome_channel') {
                    // if (args.length != 2) { return interaction.reply('The command format is _!setup welcome_channel <channel name>_'); }
                    // setWelcomeChannel(dbo, message, args[1]);
                    const channel = args[i].channel;

                    dbo.updateOne({welcomechannel: {$exists: true}}, {$set: {welcomechannel: `${channel.id}`}});
                    interaction.reply({content: `Set ${channel} as the new welcome channel`, ephemeral: true})
                }
                else if (command == 'welcome_message') {
                    // if (args.length < 2) { return interaction.reply('The command format is _!setup welcome\\_message_\nUse _{sn}_ to insert the server name, _{un}_ to insert the user name, and _{ut}_ to insert the user tag\nExample: _!setup welcome\\_message Welcome to {sn} Sir {un}#{ut}_'); }
                    const msg = args[i].value;

                    if (msg.length > 30 || msg.length < 1) { return interaction.reply({content: 'Please specify a welcome message between 0 and 30 characters!', ephemeral: true}); }
                    dbo.updateOne({welcomemessage: {$exists: true}}, {$set: {welcomemessage: msg}})
                }
                else if (command == 'keep_logs') {
                    let keeplogs = args[i].value;

                    dbo.updateOne({ _id: 'LOG'}, {$set: {keepLogs: keeplogs}});

                    interaction.reply({content: `Toggled log keeping to ${keeplogs}. Please use _!setup log_channel_ to choose the log channel`, ephemeral: true});
                }
                else if (command == 'log_channel') {
                    // if (args.length != 2) { return message.reply('Please specify a parameter\nExample: _!setup log\\_channel true_'); }

                    const channel = args[i].channel;
                    if (!channel) { return interaction.reply({content: 'The specified channel does not exist!', ephemeral: true}); }

                    dbo.updateOne({_id: 'LOG'}, {$set: {logchannel: `${channel.id}`}});
                    interaction.reply({content: `Made ${channel} the new Selmer Bot Logs channel!`, ephemeral: true});
                }
                else if (command == 'log_severity') {
                    const tier = args[i].value;
                    const l = ['none', 'low', 'medium', 'high'];
                    if (!l.includes(tier)) { return interaction.reply({content: "Please select an existing tier ('none', 'low', 'medium', 'high')", ephemeral: true}); }

                    dbo.updateOne({_id: 'LOG'}, {$set: {severity: tier}})

                    interaction.reply({content: `Severity updated to ${tier}`, ephemeral: true});
                }
                else if (command == 'announcement_role') {
                    const role = args[i].value;
                    // if (message.mentions.roles.first() == undefined) {
                    //     return message.reply("Please mention a role (_!setup announcement\\_role **@role**_)\n_Note: Selmer Bot does NOT ping the @everyone role_");
                    // }
                    // const role = message.mentions.roles.first().id;
                    dbo.updateOne({_id: 'announcement'}, { $set: { 'role': role.id } });

                    interaction.reply({content: `Role updated to ${role}`, ephemeral: true});
                }
                else if (command == "announcement_channel") {
                    const channel = args[i].channel;
                    if (!channel) { return interaction.reply({content: 'The specified channel does not exist!', ephemeral: true}); }

                    dbo.updateOne({_id: 'announcement'}, { $set: { 'channel': channel.id } });
                }
                else if (command == "add_mod_role") {
                    dbo.findOne({_id: "roles"}).then((doc) => {
                        const role = args[i].value;
                        if (!doc.commands.includes(role)) {
                            dbo.updateOne({_id: "roles"}, { $push: { commands: role } });
                            interaction.reply({ content: "Role added!", ephemeral: true });
                        } else {
                            interaction.reply({ content: "This role is already a command role!", ephemeral: true });
                        }
                    });
                }
                else if (command == "remove_mod_role") {
                    dbo.updateOne({_id: "roles"}, { $pull: { commands: { $in: [ args[i].value ] }} });
                    interaction.reply({ content: "Role removed!", ephemeral: true });
                }
                else if (command == "welcome_banner") {
                    const response = await fetch(interaction.options.data[0].attachment.attachment);
                    const arrayBuffer = await response.arrayBuffer();
                    const imgbfr = Buffer.from(arrayBuffer);
                    dbo.updateOne({_id: 'WELCOME'}, {$set: {welcomebanner: imgbfr.toString('base64')}});
                    interaction.reply({ content: "Banner updated!", ephemeral: true });
                }
                else if ("welcome_text_color") {
                    const reg = /^#[0-9A-F]{6}$/i;
                    const newCol = interaction.options.data[0].value;
                    if (reg.test(newCol)) {
                        dbo.updateOne({_id: 'WELCOME'}, {$set: {welcometextcolor: newCol}});
                    interaction.reply("Color updated!");
                    } else {
                        interaction.reply("Please chose a valid hex color");
                    }
                }
                else {
                    interaction.reply({content: "Please chose a valid option", ephemeral: true});
                }
                /* Made obsolete by the change to Slash Commands

                else if (command == 'help') {
                    let temp;
                    const subcat = args[i].value;
                    if (args[1] == 'welcome') {
                        temp = 'Use _/setup welcome\\_channel [channel name]_ to set the welcome channel and _/setup welcome\\_message [message]_ to set a welcome message/\n';
                    } else if (args[1] == 'logs') {
                        temp = 'To enable logging, use the command _/setup keep\\_logs true_ and _/setup log\\_channel_ [channel name] to set the logging channel/\n';
                        temp += 'Use _/setup keep\\_logs false_ to disable logging and _/setup log\\_severity [none, low, medium, high]_ to set the threshold\n';
                        temp += '__Severities:__\n*none* - unmute, unban\n*low* - mute\n*medium* - kick\n*high* - ban\nEvery tier also includes all notifs for ***higher*** tiers (AKA _/setup log\\_severity none_ will log everything from every severity)\n';
                    } else if (args[1] == 'announcement') {
                        temp = "To pick the announcement channel, use _/setup announcement\\_channel_\nTo pick the announcement role, use _/setup announcement\\_role_";
                    } else { temp = 'Use _/setup Please use the following format: _/setup help [welcome, logs, announcement]_\nExample: _/setup help welcome_'; }

                    interaction.reply({content: temp, ephemeral: true});
                }*/
            } catch (err) {
                console.error(err);
            }
        }
    });
}



module.exports = {
    name: 'setup',
    description: 'Set up server features',
    execute,
    options: [
        {name: 'welcome_channel', description: 'Sets the channel for welcome messages', type: Constants.ApplicationCommandOptionTypes.CHANNEL },
        {name: 'welcome_message', description: 'Sets the welcome message, Use {un} for username, {ut} for user tag and {sn} for server name', type: Constants.ApplicationCommandOptionTypes.STRING },
        {name: 'welcome_banner', description: 'Sets the welcome banner', type: Constants.ApplicationCommandOptionTypes.ATTACHMENT},
        {name: 'welcome_text_color', description: 'Sets the welcome banner text color', type: Constants.ApplicationCommandOptionTypes.STRING},
        {name: 'keep_logs', description: 'Toggles logging', type: Constants.ApplicationCommandOptionTypes.BOOLEAN },
        {name: 'log_channel', description: 'Sets the logging channel', type: Constants.ApplicationCommandOptionTypes.CHANNEL },
        {name: 'log_severity', description: 'Sets the logging Severity (logs this/lower tiers)', type: Constants.ApplicationCommandOptionTypes.STRING, choices: [{name: 'none', value: 'none'}, {name: 'low', value: 'low'}, {name: 'medium', value: 'medium'}, {name: 'high', value: 'high'}] },
        {name: 'announcement_role', description: 'Sets the role to be pinged for reminders', type: Constants.ApplicationCommandOptionTypes.ROLE},
        {name: 'announcement_channel', description: 'Sets the channel for reminders', type: Constants.ApplicationCommandOptionTypes.CHANNEL},
        {name: 'add_mod_role', description: 'Make a role into an admin role for Selmer Bot, able to execute ALL Selmer Bot commands', type: Constants.ApplicationCommandOptionTypes.ROLE},
        {name: 'remove_mod_role', description: 'Remove a Selmer Bot moderation role', type: Constants.ApplicationCommandOptionTypes.ROLE}
        // {name: 'help', description: 'gets help with setup commands', type: Constants.ApplicationCommandOptionTypes.STRING, choices: [{name: 'welcome', value: 'welcome'}, {name: 'logs', value: 'logs'}, {name: 'announcement', value: 'announcement'}]}
    ]
}