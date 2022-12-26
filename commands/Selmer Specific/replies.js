const Discord = require('discord.js');

/**
 * @description a fun little easter egg mention function
 * @param {Discord.Message} message 
 */
function replies(bot, message) {
    const c = message.content.replace(`<@${bot.user.id}>`, "").toLowerCase().trim();
    var s = "";

    switch (c) {
        case "hi":
        case "hello":
        case "hya":
            s = "Hi there! :wave:";
            break;

        case "i love you":
            s = "seek help :smile:";
            break;
        
        case "chicken nuggets":
            s = "nom nom nom";
            break;

        case "chimkin nungits":
            s = "marry me :heart_eyes:";
            break;

        case "😉":
            s = ":wink:";
            break;

        case "😜":
            s = "😜";
            break;
        
        case "🍆":
        case "🍑":
        case "🍌":
            s = "❌";
            break;

        case "💩":
            s = "🤮";
            break;

        default: s = "I'm not sure what that means! Please use `/help` for a comprehensive list of commands!\n\n_PS - If you want to make full use of the bot's AI capabilities, consider Selmer Bot Premium. See more at https://selmerbot.com/premium _";
    }

    message.reply(s).catch(() => { message.channel.send(s); });
}

module.exports = replies;