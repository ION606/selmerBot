const { checkRole } = require('./verify.js');
const { Constants } = require('discord.js');


module.exports = {
    name: 'unlock',
    description: 'Unlock a channel',
    execute(interaction, Discord, Client, bot) {
        const arg = interaction.options.data[0];
        const guild = bot.guilds.cache.get(interaction.guildId);

        checkRole(bot, guild, interaction.user.id).then((isAllowed) => {
            if (!isAllowed) { return message.reply('Insufficient Permissions!'); }

            var channel;
            if (arg) {
                channel = arg.channel;
            } else {
                channel = interaction.channel;
            }

            let role = interaction.guild.roles.cache.find(r => r.name === "@everyone");

            channel.permissionOverwrites.edit(role.id, {
                VIEW_CHANNEL: true,
                SEND_MESSAGES: true,
                READ_MESSAGE_HISTORY: true,
                ATTACH_FILES: true
            });

            interaction.reply(`${channel} has been unlocked!`);
        });
    },
    options: [{name: 'channel', description: 'The channel to unlock (defaults to current channel)', type: Constants.ApplicationCommandOptionTypes.CHANNEL, required: false}]
}