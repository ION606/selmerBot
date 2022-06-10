const memes = require("random-memes");
const { randomHexColor } = require('../admin/colorgen.js');


module.exports = {
    name: 'meme',
    description: 'Selmer Bot will post a random meme from reddit',
    async execute(message, args, Discord, Client, bot) {
        memes.random().then(meme => {
            
            const newEmbed = new Discord.MessageEmbed()
            .setColor(randomHexColor())
            .setTitle(meme.caption)
            // .setURL(meme.image)
            .setDescription(`category: ${meme.category}`)
            .setImage(meme.image);
            
            message.channel.send({ embeds: [newEmbed] });
        }).catch(async err => {
            console.log(err);
            //Try a different way
            const fetch = require('node-fetch');
            const response = await fetch('https://some-random-api.ml/meme');
            const data = await response.json().catch(err => {
                console.log(err);
                return message.reply("_Uh oh, something's gone wrong!_");
            });

            const newEmbed = new Discord.MessageEmbed()
            .setColor(randomHexColor())
            .setTitle(data.caption)
            // .setURL(data.image)
            .setDescription(`category: ${data.category}`)
            .setImage(data.image);
            
            message.channel.send({ embeds: [newEmbed] });
        });
    }
}