const hastebin = require("hastebin-gen");

module.exports ={
    name: "scrape",
    description: ".....",
    async execute(message, args, Discord, Client, bot) {
        const axios = require('axios');
        const cheerio = require('cheerio')
            const url = args[0];
            axios(url)
              .then(async response => {
                const html = response.data;
                const $ = cheerio.load(html);
                //lyrics = $('.para_row').text();
                const haste = await hastebin(html, { extension: "txt" });
               message.channel.send(haste);
              //  console.log(lyrics);
              })
              .catch(console.error);
    }
}

//TEST: https://www.karaoketexty.cz/texty-pisni/zoegirl/plain-170199