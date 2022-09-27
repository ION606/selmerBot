const { MessageEmbed, MessageActionRow, MessageButton, Interaction } = require('discord.js');

module.exports = {
    name: 'repo',
    description: 'See where Selmer bot\'s code is stored!',
    execute(interaction, Discord, Client, bot) {
        const embd = new MessageEmbed()
        .setAuthor({ name: "Selmer Bot", url: bot.inviteLink, iconURL: bot.user.displayAvatarURL() })
        .setThumbnail("https://github.com/ION606/selmer-bot-website/blob/main/assets/Selmer-icon.png?raw=true")    // .setThumbnail('https://repository-images.githubusercontent.com/460670550/43932b23-d795-4334-838f-f33ee8f795c4')
        .setDescription("Selmer Bot was created by ION606");

        const row = new MessageActionRow()
        .addComponents([
            new MessageButton()
            .setStyle("LINK")
            .setURL("https://github.com/ION606/selmerBot")
            .setLabel("Github Repo"),

            new MessageButton()
            .setStyle("LINK")
            .setURL("https://www.selmerbot.com/")
            .setLabel("Website"),

            new MessageButton()
            .setStyle("PRIMARY")
            .setLabel("Tutorial")
            .setCustomId("sbtutorial")
        ]);

        interaction.reply({ embeds: [embd], components: [row] });
    }, options: []
}