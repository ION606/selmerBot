module.exports ={
    name: "help",
    description: "Gets help for all of Selmer Bot's commands",
    execute(message, Client) {
        const newEmbed = new Discord.MessageEmbed()
        .setColor('#002eff')
        .setTitle('My professional resume')
        //.setURL('https://discordjs.guide/popular-topics/embeds.html#embed-preview')
        //.setDescription('My professional resume')
        .setImage('https://github.com/ION606/selmerBot/blob/main/Sleemer_Bringsjorgend.png?raw=true')
        
        message.channel.send({ embeds: [newEmbed] });
    }
}