const scraper = require('mal-scraper');
module.exports = {
    name: 'asearch',
    description: 'Selmer bot gives you info on an anime',
    async execute(message, args, Discord, Client, bot) {
        if (args.length < 1) { return message.reply("Please specify an anime!"); }
        let name = "";
        if (args.length > 1) {
            let i = 0;
            while (i < args.length && args[i] != '~fancy' && args[i] != '~summary' && args[i] != '~stats') {
                name += args[i] + " ";
                i++;
            }
        } else { name = args[0]; }

        if (args[args.length - 1] != args[args.length - 1] != '~fancy' && args[args.length - 1] != '~summary' && args[args.length - 1] != '~stats') { args.push('~stats'); }

        scraper.getInfoFromName(name).then((data) => {
            try {
                if (args[args.length - 1] == '~stats') {
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
                    let temp =  `The ${data.genres.join(", ")} anime _${data.title}_ first aired on ${data.premiered}`;
                    if (data.aired) { temp +=  `. This anime ran for ${data.aired} for a total of ${data.episodes} episodes.`}
                    else { temp += ` and is still airing with ${data.episodes} so far!`}

                    temp += ` This anime has a score of ${data.score} and is ${data.popularity} on MyAnimeList!\n`;
                    temp += `You can see a trailer for ${data.title} here: ${data.trailer}`;
                    temp += `\n\n(to see a summary of the anime, use '${bot.prefix}asearch <anime name> ~summary')`;
                    
                    message.channel.send({ embeds: [new Discord.MessageEmbed().setImage(data.picture)]});
                    message.channel.send(temp);
                } else if (args[args.length - 1] == '~summary') {
                    let temp = data.synopsis;
                    message.channel.send(temp);
                } else {
                    message.reply(`Unknown command, try using the format '${bot.prefix}asearch <anime name> [~stats or ~fancy or ~summary]`);
                }
            } catch (err) {
                if (err.message.indexOf('MessageEmbed field values must be non-empty strings') != -1) {
                    message.reply(`Insufficient information on website!\nThe page can be found here: ${data.url}`);
                }
            }
        
        });
    }
}