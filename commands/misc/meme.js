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
        })
    }
}