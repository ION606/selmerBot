const Discord = require('discord.js')
const axios = require('axios')
const cheerio = require('cheerio');
const { URL } = require("url");

function isValidUrl(s) {
    try {
        new URL(s);
        return true;
    } catch (err) {
        return false;
    }
};

function handleStreamInp(bot, url, customTitle) {
    return new Promise((resolve, reject) => {
        if (!isValidUrl(url)) {
            return reject(false);
        }

        axios.get(url).then(async response => {
            var title;

            if (customTitle) {
                title = customTitle;
            } else {
                const html = response.data;
                const $ = cheerio.load(html);
                title = $('meta[name="description"]').attr("content");
            }

            bot.user.setActivity({name: title, type: "STREAMING", url: url});

            resolve(true);
        });
    });
}

//Have this only visible to you.
/**
 * @param {Discord.Client} bot 
 * @param {Discord.Interaction} interaction 
 */
async function setPresence(bot, interaction) {
    const command = interaction.options.data[0];

    if (command.name == "setpresence") {
        const txt = command.options.filter((arg) => { return(arg.name == 'pres_text'); })[0].value;
        const type = command.options.filter((arg) => { return(arg.name == 'type'); })[0].value;
        
        var sep = " ";
        if (type == "LISTENING" || type == "WATCHING") {
            sep = " to ";
        } else if (type == "COMPETING") {
            sep = " in ";
        }
    
        //Check if it's me
        if (interaction.user.id == bot.guilds.cache.get(bot.home_server).ownerId) {
            if (type == "STREAMING") {
                const t = (command.options.length > 2) ? command.options.filter((arg) => { return(arg.name == "display_name"); })[0].value : null;

                handleStreamInp(bot, txt, t, interaction).then(() => {
                    interaction.reply(`Set bot presence to _${type + sep + txt}_`);
                }).catch(() => {
                    interaction.reply("Invalid URL").catch((err) => {
                        interaction.channel.send("Invalid URL");
                    });
                });
            } else {
                bot.user.setActivity(txt, { type: type });
                interaction.reply(`Set bot presence to _${type + sep + txt}_`);
            }
        }
    } else if (command.name == "setactivity") {
        const stat = command.options[0];

        bot.user.setStatus(stat.value);
        interaction.reply(`Set bot status to ${stat.value}`);
    }
}


module.exports = { setPresence }