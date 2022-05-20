const scraper = require('mal-scraper');
const search = scraper.search;
const type = "manga";
module.exports = {
    name: 'msearch',
    description: 'Selmer bot gives you info on a manga',
    async execute(message, args, Discord, Client, bot) {
        if (args.length < 1) { return message.reply("Please specify a manga!"); }
        let name = "";
        if (args.length > 1) {
            let i = 0;
            while (i < args.length && args[i] != '~fancy' && args[i] != '~summary' && args[i] != '~stats') {
                name += args[i] + " ";
                i++;
            }
        }

        let cmd = args[args.length - 1];
        search.search(type, {
            maxResults: 1,
            term: name
        }).then((data1) => {
            let data = data1[0];
            if (cmd == "~stats") {
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
                
                message.channel.send({ embeds: [newEmbed] });
            } else if (cmd == "~fancy") {
                let temp = `The ${data.type} _${data.title}_ currently has ${data.vols} volumes with ${data.nbChapters} chapters, `;
                temp += `running from _${data.startDate.replace(/-/g, "/")}_  to  _${data.endDate.replace(/-/g, "/")}_, and has a score of ${data.score} on MyAnimeList!\n`;
                temp += `You can read more about _${data.title}_ at ${data.url}`;

                message.channel.send(temp);
            } else if (cmd == "~summary") {
                //Remove the "read more." at the end
                let temp = data.shortDescription.slice(0, -10);
                temp += ` _read more at_ ${data.url}`;
                return message.channel.send(temp);
            }
        });
    }
}