const hastebin = require("hastebin-gen");

module.exports ={
    name: "scrape",
    description: ".....",
    async execute(message, args, Discord, Client, bot) {
        const axios = require('axios');
        const cheerio = require('cheerio');
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
              .catch(function(err) {
                if (err.message.indexOf('The "url" argument must be of type string') != -1) {
                  message.reply("The URL should be a string!");
                } else {
                  message.reply("Oops! There's been an error");
                }

                console.log(err);
              });
    }
}

//TEST: https://www.karaoketexty.cz/texty-pisni/zoegirl/plain-170199