// const { checkRole } = require('./verify.js');


// module.exports = {
//     name: 'serverUnlock',
//     description: 'unlocks ***ALL CHANNELS*** for everyone except the those with the "Selmer Bot Commands" role',
//     execute(message, args, Discord, Client, bot) {
//         const guild = bot.guilds.cache.get(message.guild.id);

//         if (!checkRole(bot, guild, message.author.id)) { return message.reply('Insufficient Permissions!'); }

//         message.guild.channels.cache.forEach(ch => {
//             channel.permissionOverwrites.edit(message.guild.roles.everyone.id, {
//                 VIEW_CHANNEL: true,
//                 SEND_MESSAGES: false,
//                 READ_MESSAGE_HISTORY: false,
//                 ATTACH_FILES: false
//             });
//         });
//     }
// }