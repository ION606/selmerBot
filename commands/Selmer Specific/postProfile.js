module.exports = {
    name: "profile",
    description: "Posts a description of Monsieur Sleemer himself",
    execute(interaction, Discord, Client, bot) {
        const newEmbed = new Discord.MessageEmbed()
        .setColor('#002eff')
        .setTitle('My professional resume')
        //.setURL('https://discordjs.guide/popular-topics/embeds.html#embed-preview')
        //.setDescription('My professional resume')
        .setImage('https://github.com/ION606/selmerBot/blob/main/assets/Sleemer_Bringsjorgend.png?raw=true')
        .addFields(
            {name: 'My Epithets:', value: "~~Pearls of Wisdom~~"},
            {name: '\t__Epithet 1__', value: "_Negative money is the best money_"},
            {name: '\t__Epithet 2__', value: "_There is no god, only logic_"}
        );
        
        interaction.reply({ embeds: [newEmbed] });
    }, options: []
}