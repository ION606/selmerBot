module.exports ={
    name: "scraper",
    description: ".....",
    execute(message, args) {
        const axios = require('axios');
        const cheerio = require('cheerio')
            const url = args[0];
            axios(url)
              .then(response => {
                const html = response.data;
                const $ = cheerio.load(html);
                //lyrics = $('.para_row').text();

               message.channel.send(lyrics);
               console.log(lyrics);
              })
              .catch(console.error);
    }
}

//TEST: https://www.karaoketexty.cz/texty-pisni/zoegirl/plain-170199