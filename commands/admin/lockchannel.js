const { checkRole } = require('./verify.js');


module.exports = {
    name: 'lock',
    description: 'Lock a channel',
    execute(message, args, Discord, Client, bot) {
        const guild = bot.guilds.cache.get(message.guild.id);

        if (!checkRole(bot, guild, message.author.id)) { return message.reply('Insufficient Permissions!'); }

        var channel;
        if (args[0]) {
            channel = guild.channels.cache.find(channel => channel.name.toLowerCase() === args[0]);
        } else {
            channel = message.channel;
        }

        if (!channel) { return message.reply("This channel does not exist!"); }

        channel.permissionOverwrites.edit(message.guild.roles.everyone.id, {
            VIEW_CHANNEL: true,
            SEND_MESSAGES: false,
            READ_MESSAGE_HISTORY: true,
            ATTACH_FILES: false
        });
    }
}