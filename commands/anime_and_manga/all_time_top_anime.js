module.exports = {
    name: 'top_anime',
    description: 'Get the top anime of all time (according to MyAnimeList)',
    execute(message, args) {
        const axios = require('axios');
        const cheerio = require('cheerio')
        //Genre list area (not set up yet)
        if (args.length != 0) {
            return;
        }
        const url = "https://myanimelist.net/topanime.php?type=bypopularity";
        axios(url)
        .then(response => {
            const html = response.data;
            const $ = cheerio.load(html);
            data = $('.top-ranking-table').text();
            breakbar = "---------------------------------------------";
        
            // message.channel.send(breakbar + "\n" + lyrics + "\n" + breakbar);
            console.log(data);
        })
        .catch(console.error);
    }
}