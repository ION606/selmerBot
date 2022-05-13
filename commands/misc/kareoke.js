module.exports ={
    name: 'kareoke',
    description: 'Sing your least-favorite song with your favorite person, me!',
    execute(message, args, Discord, Client, bot) {
        const axios = require('axios');
        const cheerio = require('cheerio')
            const url = args[0];
            if (args[0] == undefined) {
                message.channel.send("Please pick out a song at https://www.karaoke-lyrics.net/\nThe command should look like\n/kareoke [link_here]");
            } else {
                axios(url)
                .then(response => {
                  const html = response.data;
                  const $ = cheerio.load(html);
                  lyrics = $('.para_row').text();
                  breakbar = "---------------------------------------------";
                
                  message.channel.send(breakbar + "\n" + lyrics + "\n" + breakbar);
                 //console.log(lyrics);
                })
                .catch(console.error);
            }
    }
}

//TEST: https://www.karaoketexty.cz/texty-pisni/zoegirl/plain-170199