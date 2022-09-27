const { Constants } = require('discord.js');
const scraper = require('mal-scraper');


module.exports = {
    name: 'asearch',
    description: 'Selmer bot gives you info on an anime',
    async execute(interaction, Discord, Client, bot) {

        const args = interaction.options.data;
        const name = args.filter((arg) => { return (arg.name == 'anime'); })[0].value;
        var style;

        if (args.length > 1) {
            style = args.filter((arg) => { return (arg.name == 'style'); })[0].value;
        }
        else { style = "stats"; }

        //Maybe change it to "this anime movie" if there is only 1 episode?

        //When set to true, getInfoFromName.getBestMatch did not, in fact, return the best results
        scraper.getInfoFromName(name, false).then((data) => {
            try { console.log(data);
                if (style == 'stats') {
                    const newEmbed = new Discord.MessageEmbed()
                    .setColor('#002eff')
                    .setTitle(data.title)
                    //.setURL('https://discordjs.guide/popular-topics/embeds.html#embed-preview')
                    //.setDescription('My professional resume')
                    .setImage(data.picture)
                    .addFields(
                        {name: 'Genres:', value: data.genres.join(", ")},
                        {name: 'Score:', value: data.score},
                        {name: 'Episode:', value: data.episodes},
                        {name: "Date Aired/Premiered", value: data.premiered || data.aired}
                    ).setURL(data.trailer);
                    
                    interaction.reply({ embeds: [newEmbed] });
                } else if (style == 'fancy') {
                    let temp =  `The ${data.genres.join(", ")} anime _${data.title}_ first aired on ${data.premiered || data.aired}`;
                    if (data.aired) { temp +=  `. This anime ran for ${data.aired} for a total of ${data.episodes} episodes.`}
                    else { temp += ` and is still airing with ${data.episodes} so far!`}

                    temp += ` This anime has a score of ${data.score} and is ${data.popularity} on MyAnimeList!\n`;
                    temp += `You can see a trailer for ${data.title} ***[here](${data.trailer})***`;
                    // temp += `\n\n(to see a summary of the anime, use '${bot.prefix}asearch <anime name> summary')`;
                    
                    interaction.reply({ embeds: [new Discord.MessageEmbed().setImage(data.picture).setDescription(temp)] });
                    // message.channel.send(temp);
                } else if (style == 'summary') {
                    let temp = data.synopsis;
                    interaction.reply(temp);
                } else {
                    interaction.reply(`Unknown command, try using the format '/asearch <anime name> [stats or fancy or summary]`);
                }
            } catch (err) {
                if (err.message.indexOf('MessageEmbed field values must be non-empty strings') != -1) {
                    interaction.reply(`Insufficient information on website!\nThe page can be found here: ${data.url}`);
                } else {
                    const m = interaction.reply("Uh oh, an unknown error occured, click the ✅ to report this!");
                    
                    const { addComplaintButton } = require('../dev only/submitcomplaint');
                    m.then((msg) => {
                        addComplaintButton(bot, msg);
                    });
                }

                console.log(err);
            }
        
        });
    },
    options: [
        {name: 'anime', description: 'The name of the anime', type: Constants.ApplicationCommandOptionTypes.STRING, required: true},
        {name: 'style', description: 'stats or fancy or summary (defaults to stats)', type: Constants.ApplicationCommandOptionTypes.STRING, required: false, choices: [ { name: 'stats', value: 'stats' }, { name: 'fancy', value: 'fancy' }, {name: 'summary', value: 'summary'} ] }
    ]
}