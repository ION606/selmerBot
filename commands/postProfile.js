module.exports = {
    name: "profile",
    description: "Posts a description of Monsieur Sleemer himself",
    execute(message, args, Discord) {
        const newEmbed = new Discord.MessageEmbed()
        .setColor('#002eff')
        .setTitle('Rules')
        //.setURL('https://discordjs.guide/popular-topics/embeds.html#embed-preview')
        .setDescription('My professional resume')
        .addFields(
            {name: 'My Epithets:', value: "My Epithets:"},
            {name: '\t1. ', value: "Negative money is the best money"},
            {name: '\t2. ', value: "Ukrane"}
        )

        .setImage('Sleemer_Bringsjorgend.png');
        
        message.channel.send({ embeds: [newEmbed] });
    }
}