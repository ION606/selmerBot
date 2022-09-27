module.exports = {
    name: 'serverlock',
    description: 'Lock ALL CHANNELS for everyone with the "everyone" role - SERVER OWNER ONLY!',
    execute(interaction, Discord, Client, bot) {
        if (interaction.guild.ownerId != interaction.user.id) { return interaction.reply('Insufficient Permissions!'); }

        const role = interaction.guild.roles.cache.find(r => r.name === "@everyone");
        const arr = [];

        interaction.guild.channels.cache.forEach(channel => {
            if (channel.permissionsFor(role).has("SEND_MESSAGES")) {
                channel.permissionOverwrites.edit(role.id, {
                    VIEW_CHANNEL: true,
                    SEND_MESSAGES: false,
                    READ_MESSAGE_HISTORY: true,
                    ATTACH_FILES: false
                });
    
                //Maybe add the message to the array to be edited/deleted after unlock
                if (channel.type == 'GUILD_TEXT') {
                    channel.send(`***CHANNEL LOCKED BY ${interaction.user}***`);
                }
    
                arr.push(channel.id);
            }
        });
        
        bot.lockedChannels.set(interaction.guildId, arr);

        interaction.reply(`***SERVER LOCKED BY ${interaction.user}***`);
    }, options: []
}

        // interaction.reply(```diff
        // - SERVER LOCKED
        // ```);