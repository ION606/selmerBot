const scraper = require('mal-scraper');
module.exports = {
    name: 'asearch',
    description: 'Selmer bot gives you either an explanation or a list of stats',
    async execute(message, args, Discord, Client, bot) {
        if (args.length < 1) { return message.reply("Please specify an anime!"); }
        let name = "";
        if (args.length > 1) {
            let i = 0;
            while (i < args.length && args[i] != '~fancy' && args[i] != '~summary' && args[i] != '~stats') {
                name += args[i] + " ";
                i++;
            }
        }

        scraper.getInfoFromName(name).then((data) => {
            //If the user didn't specify, give a stat list
            if (args[args.length - 1] == 'stats') {
                const newEmbed = new Discord.MessageEmbed()
                .setColor('#002eff')
                .setTitle(data.title)
                //.setURL('https://discordjs.guide/popular-topics/embeds.html#embed-preview')
                //.setDescription('My professional resume')
                .setImage(data.picture)
                .addFields(
                    {name: 'Genres:', value: data.genres.join(", ")},
                    {name: 'Score:', value: data.score},
                    {name: 'Episode:', value: data.episodes}
                ).setURL(data.trailer);
                
                message.channel.send({ embeds: [newEmbed] });
            } else if (args[args.length - 1] == '~fancy') {
                let temp =  `The ${data.genres.join(", ")} anime "${data.title}" first aired on ${data.premiered}`;
                if (data.aired) { temp +=  `. This anime ran for ${data.aired} for a total of ${data.episodes} episodes.`}
                else { temp += ` and is still airing with ${data.episodes} so far!`}

                temp += ` This anime has a score of ${data.score} and is ${data.popularity} on MyAnimeList!`;
                temp += `\n\n(to see a summary of the anime, use '${bot.prefix}asearch <anime name> ~summary')`;
                
                message.channel.send({ embeds: [new Discord.MessageEmbed().setImage(data.picture)]});
                message.channel.send(temp);
            } else if (args[args.length - 1] == '~summary') {
                let temp = data.synopsis;
                message.channel.send(temp);
            } else {
                message.reply(`Unknown command, try using the format '${bot.prefix}asearch <anime name> [~stats or ~fancy or ~summary]`);
            }
        
        });
    }
}