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

        search.search(type, {
            maxResults: 1,
            term: name
        }).then((data) => {
            console.log(data[0]);
            message.reply("This command has not been implemented yet!");
        });
    }
}