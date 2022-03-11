module.exports = {
    name: "profile",
    description: "Posts a description of Monsieur Sleemer himself",
    execute(message, args, Discord) {
        const newEmbed = new Discord.MessageEmbed()
        .setColor('#002eff')
        .setTitle('My professional resume')
        //.setURL('https://discordjs.guide/popular-topics/embeds.html#embed-preview')
        //.setDescription('My professional resume')
        .setImage('https://github.com/ION606/selmerBot/blob/main/Sleemer_Bringsjorgend.png?raw=true')
        .addFields(
            {name: 'My Epithets:', value: "Pearls of Wisdom"},
            {name: '\t1. ', value: "Negative money is the best money"},
            {name: '\t2. ', value: "There is no god, only logic"}
        );
        
        message.channel.send({ embeds: [newEmbed] });
    }
}