const hastebin = require("hastebin-gen");
const { addComplaintButton } = require('../dev only/submitcomplaint');
const { Constants } = require('discord.js');
const { URL } = require("url");
const axios = require('axios');
const { isValidUrl } = require('../dev only/setPresence.js');


module.exports ={
    name: "scrape",
    description: "Scrapes a website, then puts the result into a hastebin",
    async execute(interaction, Discord, Client, bot) {
        // const cheerio = require('cheerio');
        const url = interaction.options.data[0].value;

        if (!isValidUrl(url)) {
          return interaction.reply("Please enter a valid url").catch((err) => {
            interaction.channel.send("Please enter a valid url");
          });
        }

        axios(url)
          .then(async response => {
            const html = response.data;
            // const $ = cheerio.load(html);
            //lyrics = $('.para_row').text();

            const haste = await hastebin(html, { extension: "txt" });
            interaction.reply(haste);
          //  console.log(lyrics);
          })
          .catch(function(err) {
            if (err.message.indexOf('The "url" argument must be of type string') != -1) {
              interaction.reply("The URL should be a string!");
            } else if (err.code == 'ERR_BAD_REQUEST') {
              interaction.reply("404 link not valid!")
            } else {
              const m = interaction.reply("Oops! There's been an error, click the ✅ to report this!");

              m.then((msg) => {
                addComplaintButton(bot, msg);
              });

              console.log(err);
            }
          });
    },
    options: [{name: 'url', description: 'The website URL', type: Constants.ApplicationCommandOptionTypes.STRING, required: true }]
}

//TEST: https://www.karaoketexty.cz/texty-pisni/zoegirl/plain-170199