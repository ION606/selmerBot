const {Client, Constants} = require('discord.js');

/**
 * Registers all slash commands
 * @param {Client} bot 
 */
function registerCommands(bot) {
    const commands = bot.application.commands;

    /*
        val: {
            name: 'code',
            description: "See where Selmer bot's code is stored! (you can also use _!repo_)",
            execute: [Function: execute]
        },

        key: code
    */
    bot.commands.forEach((val, key) => {

        if (val.options && val.name != 'econ') {
            if (val.isDM) {
                commands.create({
                    name: val.name,
                    description: val.description,
                    options: val.options,
                    dm_permission: true,
                });
            } else {
                commands.create({
                    name: val.name,
                    description: val.description,
                    options: val.options,
                    dm_permission: false,
                });
            }
        } else {
            // console.log(val, key);
            console.log(key);
        }
    });

    //Create the "econ" commands
    const econList = ["buy", 'shop', 'work', 'rank', 'inventory', 'balance', 'sell'];
    const econMain = require('./commands/db/econSlashOptions.js');

    econList.forEach((commandName) => {
        const command = econMain[`${commandName}`];
        commands.create({
            name: commandName,
            description: command.description,
            options: command.options || [],
            dm_permission: false,
        });
    });


    //Create the moderation commands
    //NOTE: The user needs to have kicking or banning permissions to use these
    const modList = ['lock', 'unlock', 'kick', 'ban', 'unban', 'mute', 'unmute'];
    for (let i = 0; i < modList.length; i++) {
        const opts = [
            {name: "user", description: `The user to ${modList[i]}`, type: Constants.ApplicationCommandOptionTypes.USER, required: true},
            {name: "reason", description: "Why?", type: Constants.ApplicationCommandOptionTypes.STRING, required: false}
        ];

        commands.create({
            name: modList[i],
            description: `${modList[i]} a user`,
            options: opts,
            dm_permission: false,
            default_member_permissions: 6,
        });
        
        // .then((comm) => {
        //     comm.setDefaultMemberPermissions(Discord.PermissionFlagsBits.KickMembers | Discord.PermissionFlagsBits.BanMembers);
        // });
    }
}



module.exports = { registerCommands }