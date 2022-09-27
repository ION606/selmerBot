module.exports = {
    name: "links",
    description: "A helpful list of links to all of Selmer's wonderful websites",
    execute(interaction, Discord, Client, bot) {
        const newEmbed = new Discord.MessageEmbed()
        .setColor('#002eff')
        .setTitle("Selmer's Links")
        .addFields(
            {name: 'HyperGrader', value: "https://rpi.logicamodernapproach.com/"},
            {name: 'Personal Website', value: "http://www.logicamodernapproach.com/"}
        );
        
        interaction.reply({ embeds: [newEmbed] });
    }, options: []
}