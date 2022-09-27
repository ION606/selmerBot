const { Constants } = require('discord.js');

module.exports ={
    name: 'kareoke',
    description: 'Sing your least-favorite song with your favorite person, me!',
    execute(interaction, Discord, Client, bot) {
        const arg = interaction.options.data[0].value;
        if (arg == "help") { return interaction.reply({content: "Please pick out a song at https://www.karaoke-lyrics.net/\nThe command should look like\n/kareoke [link_here]"}); }

        const axios = require('axios');
        const cheerio = require('cheerio')
        const url = interaction.options.data[0].value;

        axios(url)
        .then(response => {
            const html = response.data;
            const $ = cheerio.load(html);
            lyrics = $('.para_row').text();
            breakbar = "---------------------------------------------";
        
            message.channel.send(breakbar + "\n" + lyrics + "\n" + breakbar);
            //console.log(lyrics);
        })
        .catch((err) => {
            console.log(err);
            interaction.reply("Please provide a valid url from https://www.karaoke-lyrics.net/");
        });
    },
    options: [{name: 'url', description: 'the url of the song or "help"', type: Constants.ApplicationCommandOptionTypes.STRING, required: true}]
}

//TEST: https://www.karaoketexty.cz/texty-pisni/zoegirl/plain-170199