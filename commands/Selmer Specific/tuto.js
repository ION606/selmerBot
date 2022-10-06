// @ts-check
const { MessageActionRow, MessageButton, MessageEmbed, Interaction } = require('discord.js');

//Intro, setup/logging, Econ, Moderation, anime/manga, games, Selmer Specific, Misc, DMS/Premium
const tutoText = [
    "__**Hello, and welcome to the Selmer Bot tutorial**__\nIn this tutorial, I will walk you through the various commands and features of Selmer Bot\n\nTo progress to the next page, click the right arrow at the bottom of this message.\nTo go back to the previous page, click the left arrow",
    "__**SETUP AND LOGGING**__\nSet up your server to take full advantage of Selmer Bot's features, this includes moderation logging, custom welcome messages, calendar event pings and more\n_Note: Most of these commands are only available to the server owner_\n\n__***COMMANDS***__\nsetup",
    "__**ECONOMY**__\nThese commands have to do with the inventory and currency system Selmer Bot uses, although I should note that as of now Selmer Coin holds no IRL value ;-;\n\n__***COMMANDS***__\ninventory, buy, sell, shop, work, rank, balance",
    "__**MODERATION**__\nI mean....\n\n***__COMMANDS__***\nhelp admin, warn, mute, unmute, kick, ban, unban, lock, unlock, serverlock\n\n__***NOTE:***__\nThe user needs to have either _kick_ or _ban_ permissions to use these",
    "__**AMIME AND MANGA**__\nGet info on your favorite Anime or Manga as a stat-sheet, a fancy embed, or have Selmer Bot describe it to you\n\n__***COMMANDS***__\nasearch, msearch",
    "__**GAMES**__\nAt the moment Selmer Bot offers three games: Trivia, Tic Tac Toe, and Minesweeper. Both Trivia and Tic Tac Toe can be played with other people. Trivia and Minesweeper can also be played solo. Selmer Bot also has a battle game where you can use weapons, potions, attack and defend, but this is still in beta\n\n__***COMMANDS***__\nhelp game, game battle game tictactoe, game trivia, game equip, game status, game hp, game classes, game quit\n\n__**NOTE**__\nDue to how complicated this feature is, it will not be migrated to slash commands for now",
    "__**SELMER SPECIFIC**__\nThese commands will probably be found nowhere else\nThese include quotes (For legal reasons I have to state they aren't real quotes, mostly), as well as varius other things I based on good old Selmer\n\n__***COMMANDS***__\narrow, extracredit, tuto, profile, quotes",
    "__**MISCELLANEOUS**__\nThese are the commands that are not really in any of the other categories. Don't be fooled, these are actually some of the most useful commands Selmer Bot has to offer. From playing music to web scraping to memes, I'm sure Selmer Bot has what you're looking for\n\n__***COMMANDS***__\nhelp, kareoke, link, meme, pickupline, audio, react, scrape, stocks, crypto",
    "__**DM COMMANDS**__\nThese commands will only work in DM's. All these commands will only work with Selmer Bot Premium (it's on the next page).\nThese features include Reminders (AKA a calendar) and Selmer Bot's own chat AI\n\n__***COMMANDS***__\nchat, startconvo, endconvo, premium",
    "__**SELMER BOT PREMIUM**__\nUse an AI chat, complete with semi-accurate IRL data, have Selmer Bot remind you of events with an easy-to-use interface and even a clickable calendar on the Selmer Bot website (_www.selmerbot.com_)\n\n__***COMMANDS***__\npremium, premium buy, premium manage, reminders",
    "__**Thank you for completing the Selmer Bot Tutorial**__\n\nTry out Selmer Bot's features, play the games and most importantly, have fun\n\n-The Selmer Bot Team AKA ION606"
];

//If the page number == 0 and refered == false, then interaction will be a Message
function postEmbd(bot, interaction, page, refered) {
    const author = {
        name: "Selmer Bot",
        url: "",
        iconURL: bot.user.displayAvatarURL()
    };

    //Tutorial Embed
    const te = new MessageEmbed();
    te.setAuthor(author)
        .setTitle("Selmer Bot Tutorial")
        .setDescription(tutoText[page])
        .setURL('https://www.selmerbot.com/')
        .setFooter({ text: `Page ${page + 1}` });


    if (tutoText[page].indexOf('Thank you for completing the Selmer Bot Tutorial') != -1) {
        te.setImage('https://github.com/ION606/selmerBot/blob/main/assets/Sleemer_Bringsjorgend.png?raw=true');
    }

    const row = new MessageActionRow();
    //Make sure the page is never < 1
    const prevbtn = new MessageButton()
        .setCustomId(`tutoQueue|`)
        .setLabel('⬅️')
        .setStyle('SECONDARY');

    if (page <= 0) {
        prevbtn.customId += `0`;
        prevbtn.setDisabled(true);
    } else {
        prevbtn.customId += `${page - 1}`;
    }

    const nextbtn = new MessageButton()
        .setCustomId(`tutoQueue|`)
        .setLabel('➡️')
        .setStyle('SECONDARY');

    if ((page + 1) >= tutoText.length) {
        nextbtn.customId += `${tutoText.length}`;
        nextbtn.setDisabled(true);
    } else {
        nextbtn.customId += `${page + 1}`;
    }

    row.addComponents(prevbtn, nextbtn);

    if (page > 0 || refered) {
        interaction.update({ content: '_Note: To see a full list of reminder stats visit www.selmerbot.com _', embeds: [te], components: [row] });
    } else {
        interaction.channel.send({ content: '_Note: To see a full list of reminder stats visit www.selmerbot.com _', embeds: [te], components: [row] });
    }
}


module.exports = {
    name: 'tuto',
    description: 'An introduction command to Selmer Bot',
    async execute(interaction, Discord, Client, bot) {
        postEmbd(bot, interaction, 0, false);
    }, postEmbd,
    options: []
}