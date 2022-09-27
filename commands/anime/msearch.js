const { Constants } = require('discord.js');
const scraper = require('mal-scraper');
const search = scraper.search;
const type = "manga";


module.exports = {
    name: 'msearch',
    description: 'Selmer bot gives you info on a manga',
    async execute(interaction, Discord, Client, bot) {
        const args = interaction.options.data;
        const name = args.filter((arg) => { return (arg.name == 'manga'); })[0].value;
        var style;

        if (args.length > 1) {
            style = args.filter((arg) => { return (arg.name == 'style'); })[0].value;
        }
        else { style = "stats"; }

        try {
            search.search(type, {
                maxResults: 1,
                term: name
            }).then((data1) => {
                let data = data1[0];
                if (style == "stats") {
                    const newEmbed = new Discord.MessageEmbed()
                    .setColor('#ff9900')
                    .setTitle(data.title)
                    .setURL(data.url)
                    .setImage(data.thumbnail)
                    //.setDescription('My professional resume')
                    .addFields(
                        {name: 'Type:', value: data.type},
                        {name: 'Score:', value: data.score},
                        {name: 'Volumes:', value: data.vols}
                    );
                    
                    interaction.reply({ embeds: [newEmbed] });
                } else if (style == "fancy") {
                    let temp = `The ${data.type} _${data.title}_ currently has ${data.vols} volumes with ${data.nbChapters} chapters, `;
                    temp += `running from _${data.startDate.replace(/-/g, "/")}_  to  _${data.endDate.replace(/-/g, "/")}_, and has a score of ${data.score} on MyAnimeList!\n`;
                    temp += `You can read more about _${data.title}_ at ${data.url}`;

                    interaction.reply(temp);
                } else if (style == "summary") {
                    //Remove the "read more." at the end
                    let temp = data.shortDescription.slice(0, -10);
                    temp += ` _read more at_ ${data.url}`;
                    return interaction.reply(temp);
                } else {
                    interaction.reply(`Unknown command, try using the format '${bot.prefix}msearch <manga name> [stats or fancy or summary]`);
                }
            });
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
    },
    options: [{name: 'manga', description: 'The name of the manga', type: Constants.ApplicationCommandOptionTypes.STRING, required: true}, {name: 'style', description: 'stats or fancy or summary (defaults to stats)', type: Constants.ApplicationCommandOptionTypes.STRING, required: false, choices: [ { name: 'stats', value: 'stats' }, { name: 'fancy', value: 'fancy' }, {name: 'summary', value: 'summary'} ] }]

}