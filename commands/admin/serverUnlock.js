// const { checkRole } = require('./verify.js');
//Maybe add a list to selmer Bot that adds the channels when locking

module.exports = {
    name: 'serverunlock',
    description: 'unlocks the channels locked using /serverlock',
    execute(interaction, Discord, Client, bot) {
        const guild = bot.guilds.cache.get(interaction.guildId);
        const role = interaction.guild.roles.cache.find(r => r.name === "@everyone");

        // if (!checkRole(bot, guild, message.author.id)) { return message.reply('Insufficient Permissions!'); }
        if (interaction.guild.ownerId != interaction.user.id) { return interaction.reply('Insufficient Permissions!'); }

        const channelIds = bot.lockedChannels.get(interaction.guildId);

        if (!channelIds) { return interaction.reply("No channels to unlock..."); }

        channelIds.forEach(id => {
            const channel = guild.channels.cache.get(id);
            channel.permissionOverwrites.edit(role.id, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                READ_MESSAGE_HISTORY: true,
                ATTACH_FILES: true
            });
        });

        bot.lockedChannels.set(interaction.guildId, []);
        interaction.reply(`Channels unlocked by ${interaction.user}`);
    },
    options: []
}