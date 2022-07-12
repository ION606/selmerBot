module.exports = {
    name: 'serverLock',
    description: 'Lock ***ALL CHANNELS*** for everyone with the "everyone" role - ***SERVER OWNER ONLY. FOR EMERGENCY USE ONLY***',
    execute(message, args, Discord, Client, bot) {
        const guild = bot.guilds.cache.get(message.guild.id);

        if (guild.ownerId != message.author.id) { return message.reply('Insufficient Permissions!'); }

        message.guild.channels.cache.forEach(ch => {
            channel.permissionOverwrites.edit(message.guild.roles.everyone.id, {
                VIEW_CHANNEL: false,
                SEND_MESSAGES: false,
                READ_MESSAGE_HISTORY: false,
                ATTACH_FILES: false
            });
        });
    }
}