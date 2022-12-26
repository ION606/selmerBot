//@ts-check
const { MongoClient, ServerApiVersion } = require('mongodb');
const { Constants } = require('discord.js');
const { CreateNewCollection } = require("../db/econ");
const { checkRole } = require('./verify.js');
const fetch = require('node-fetch');
const help = require('../misc/help.js');


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
                
                if (command == 'welcome_channel') {
                    const channel = args[i].channel;

                    dbo.updateOne({welcomechannel: {$exists: true}}, {$set: {welcomechannel: `${channel.id}`}});
                    interaction.reply({content: `Set ${channel} as the new welcome channel`, ephemeral: true})
                }
                else if (command == 'welcome_message') {
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
                else if (command == 'ping_role') {
                    const role = args[i].value;
                    // if (message.mentions.roles.first() == undefined) {
                    //     return message.reply("Please mention a role (_!setup announcement\\_role **@role**_)\n_Note: Selmer Bot does NOT ping the @everyone role_");
                    // }
                    // const role = message.mentions.roles.first().id;
                    dbo.updateOne({_id: 'announcement'}, { $set: { 'role': role.id } });

                    interaction.reply({content: `Role updated to ${role}`, ephemeral: true});
                }
                else if (command == "ping_channel") {
                    const channel = args[i].channel;
                    if (!channel) { return interaction.reply({content: 'The specified channel does not exist!', ephemeral: true}); }

                    dbo.updateOne({_id: 'announcement'}, { $set: { 'channel': channel.id } });
                    interaction.reply({content: `Channel set to ${channel}`, ephemeral: true});
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
                    const attachement_url = interaction.options.data[0].attachment.attachment;
                    const response = await fetch(attachement_url);
                    const arrayBuffer = await response.arrayBuffer();
                    const imgbfr = Buffer.from(arrayBuffer);
                    dbo.updateOne({_id: 'WELCOME'}, {$set: {welcomebanner: imgbfr.toString('base64')}});
                    interaction.reply({ content: `Banner updated to ${attachement_url}`, ephemeral: true});
                }
                else if (command == "welcome_text_color") {
                    const reg = /^#[0-9A-F]{6}$/i;
                    const newCol = interaction.options.data[0].value;
                    if (reg.test(newCol)) {
                        dbo.updateOne({_id: 'WELCOME'}, {$set: {welcometextcolor: newCol}});
                        interaction.reply({content: `Color updated to ${newCol} (https://www.color-hex.com/color/${newCol.substring(1)})`, ephemeral: true});
                    } else {
                        interaction.reply("Please chose a valid hex color\nYou can find colors here: https://www.color-hex.com/");
                    }
                }
                else if (command == "toggle_leveling") {
                    const tog = interaction.options.data[0].value;
                    dbo.updateOne({_id: 'LEVELING'}, {$set: {enabled: tog}});
                    interaction.reply({content: "Turned leveling " + (tog) ? "ON" : "OFF", ephemeral: true});
                }
                else if (command == "leveling_banner") {
                    const level_banner = interaction.options.data[0].attachment.attachment;
                    const response = await fetch(level_banner);
                    const arrayBuffer = await response.arrayBuffer();
                    const imgbfr = Buffer.from(arrayBuffer);
                    dbo.updateOne({_id: 'LEVELING'}, {$set: {card: imgbfr.toString('base64')}});
                    interaction.reply({content: `Updated leveling banner to ${level_banner}`, ephemeral: true});
                }
                else if (command == "leveling_text") {
                    dbo.updateOne({_id: 'LEVELING'}, {$set: {text: interaction.options.data[0].value}});
                    interaction.reply({content: `Updated leveling text to ${interaction.options.data[0].value}`, ephemeral: true});
                }
                else if (command == "leveling_color") {
                    const reg = /^#[0-9A-F]{6}$/i;
                    const newCol = interaction.options.data[0].value;
                    if (reg.test(newCol)) {
                        dbo.updateOne({_id: 'LEVELING'}, {$set: {col: newCol}});
                        interaction.reply({content: `Color updated to ${newCol} (https://www.color-hex.com/color/${newCol.substring(1)})`, ephemeral: true});
                    } else {
                        interaction.reply("Please chose a valid hex color\nYou can find colors here: https://www.color-hex.com/");
                    }
                }
                else if (command == "help") {
                    if (interaction.options.data[0].value) {
                        help.execute(interaction, Discord, Client, bot);
                    } else {
                        interaction.reply({content: 'https://docs.selmerbot.com/setup', ephemeral: true});
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
        {name: 'welcome_message', description: 'Use {un}, {ud}, {ut}, and {sn} for username, user descriminator, user tag, and server name', type: Constants.ApplicationCommandOptionTypes.STRING },
        {name: 'welcome_banner', description: 'Sets the welcome banner', type: Constants.ApplicationCommandOptionTypes.ATTACHMENT},
        {name: 'welcome_text_color', description: 'Sets the welcome banner text color', type: Constants.ApplicationCommandOptionTypes.STRING},
        {name: 'keep_logs', description: 'Toggles logging', type: Constants.ApplicationCommandOptionTypes.BOOLEAN },
        {name: 'log_channel', description: 'Sets the logging channel', type: Constants.ApplicationCommandOptionTypes.CHANNEL },
        {name: 'log_severity', description: 'Sets the logging Severity (logs this/lower tiers)', type: Constants.ApplicationCommandOptionTypes.STRING, choices: [{name: 'none', value: 'none'}, {name: 'low', value: 'low'}, {name: 'medium', value: 'medium'}, {name: 'high', value: 'high'}] },
        {name: 'ping_role', description: 'Sets the role to be pinged for reminders', type: Constants.ApplicationCommandOptionTypes.ROLE},
        {name: 'ping_channel', description: 'Sets the channel for reminders', type: Constants.ApplicationCommandOptionTypes.CHANNEL},
        {name: 'add_mod_role', description: 'Make a role into an admin role for Selmer Bot, able to execute ALL Selmer Bot commands', type: Constants.ApplicationCommandOptionTypes.ROLE},
        {name: 'remove_mod_role', description: 'Remove a Selmer Bot moderation role', type: Constants.ApplicationCommandOptionTypes.ROLE},
        {name: 'toggle_leveling', description: 'Enable or Disable the leveling system', type: Constants.ApplicationCommandOptionTypes.BOOLEAN},
        {name: 'leveling_banner', description: 'Set the card background for the leveling system', type: Constants.ApplicationCommandOptionTypes.ATTACHMENT},
        {name: 'leveling_text', description: 'Use {un}, {ud}, {ut}, {sn}, and {r} for username, descriminator, user tag, server name, and rank', type: Constants.ApplicationCommandOptionTypes.STRING},
        {name: 'leveling_color', description: 'Set the card text color for the leveling system', type: Constants.ApplicationCommandOptionTypes.STRING},
        {name: 'help', description: 'in-app?', type: Constants.ApplicationCommandOptionTypes.BOOLEAN}
    ]
}