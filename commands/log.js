const Discord = require('discord.js');
const SEVCODES = {
    none: 0,
    low: 1,
    medium: 2,
    high: 3
}
const col_list = {0: '0ed300', 1: 'f6ff00', 2: 'ffa100', 3: 'FF0000'}

/**
 * @param {Discord.Client} bot
 * @param {Discord.Interaction} interaction the message the mod sent (AKA a DISCORD MESSAGE OBJECT)
 */
function log(bot, interaction, command, mentioned, reason, severity) {
    bot.mongoconnection.then(client => {
        // if (err) { return console.log(err); }

        client.db(interaction.guildId).collection('SETUP').findOne({_id: 'LOG'}).then((doc) => {
            if (!doc) { return interaction.reply("Server logs not set up yet!"); }
            const channel = interaction.guild.channels.cache.get(doc.logchannel);

            if (!channel) { return console.log("There is no specified log channel!"); }
            //Check severity threshold
            if (SEVCODES[doc.severity] < severity) { return; }
            
            let action;
            if (command.endsWith('e')) { action = (command + 'd'); }
            else if (command.endsWith('n')) { action = (command + 'ned'); }
            else { action = (command + 'ed'); }
            
            const newEmbed = new Discord.MessageEmbed()
            .setColor(col_list[severity])
            .setTitle(`User ${mentioned.username}#${mentioned.discriminator} has been ${action}`)
            //.setURL('https://discordjs.guide/popular-topics/embeds.html#embed-preview')
            .setDescription(`Reason: ${reason}\n Responsible Mod: ${interaction.user.username}#${interaction.user.discriminator} (${interaction.user})`)
            .setThumbnail(mentioned.displayAvatarURL())
            .setTimestamp();

            channel.send({ embeds: [newEmbed] });
        });
    });
}

module.exports = { log, SEVCODES }