const { Interaction, MessageActionRow, MessageButton, MessageEmbed, Modal, TextInputComponent } = require('discord.js');
const { checkRole } = require('../admin/verify.js');


async function postForm(interaction) {
    // Create the modal
    const modal = new Modal();

    modal.setTitle('Creating a new giveaway')
    .setCustomId('giveawayModal');

    // Add components to modal
    // Create the text input components
    // The label is the prompt the user sees for this input
    // Short means only a single line of text
    // Paragraph means multiple lines of text

    const durationInp = new TextInputComponent()
    .setCustomId('duration')
    .setLabel("How long should the givaway last?")
    .setPlaceholder('10S or 10M or 10H or 10D between 1 minute and 30 days')
    .setStyle('SHORT');

    const titleInp = new TextInputComponent()
    .setCustomId('title')
    .setLabel("What should the giveaway be called?")
    .setStyle('SHORT');
    
    const descriptionInp = new TextInputComponent()
    .setCustomId('description')
    .setLabel("Describe the giveaway")
    .setPlaceholder('A fun giveaway!')
    .setStyle('PARAGRAPH');

    const prizeInp = new TextInputComponent()
    .setCustomId('prize')
    .setLabel("What does the winner....win?")
    .setPlaceholder('Discord Nitro')
    .setStyle('SHORT');
    
    const winnersInp = new TextInputComponent()
    .setCustomId('winners')
    .setLabel("Number of winners")
    .setPlaceholder('Between 1 and 99 winners')
    .setMinLength(1)
    .setMaxLength(2)
    .setStyle('SHORT');

    // An action row only holds one text input,
    // so you need one action row per text input.
    const title = new MessageActionRow().addComponents(titleInp);
    const desc = new MessageActionRow().addComponents(descriptionInp);
    const dur = new MessageActionRow().addComponents(durationInp);
    const prize = new MessageActionRow().addComponents(prizeInp);
    const winners = new MessageActionRow().addComponents(winnersInp);

    // Add inputs to the modal
    modal.addComponents(title, desc, dur, prize, winners);

    // Show the modal to the user
    interaction.showModal(modal);
}


/**
 * @param {Interaction} interaction 
 */
function processForm(interaction, bot) {
    const title = interaction.fields.getTextInputValue('title');
    const desc = interaction.fields.getTextInputValue('description');
    const dur = interaction.fields.getTextInputValue('duration');
    const prize = interaction.fields.getTextInputValue('prize');
    const winners = interaction.fields.getTextInputValue('winners');

    postGiveawayMessage(bot, interaction, title, desc, dur, prize, winners);
}

/**
* @param {Interaction} interaction
*/
function postGiveawayMessage(bot, interaction, title, desc, dur, prize, winners) {

    const author = {
        name: "Selmer Bot",
        url: "",
        iconURL: bot.user.displayAvatarURL()
    };

    var timeAdjuster = 1;
    var time;

    if (dur.indexOf('M') != -1) {
        timeAdjuster = 60;
        time = dur.replace("M", "");
    } else if (dur.indexOf('H') != -1) {
        timeAdjuster = 3600;
        time = dur.replace("H", "");
    } else if (dur.indexOf('D') != -1) {
        timeAdjuster = 86400;
        time = dur.replace("D", "");
    }

    if (!Number.isInteger(Number(time))) {
        return interaction.reply("Please enter a valid time in the following format: 10[S, M, H, D]");
    } else if (!Number.isInteger(Number(winners))) {
        return interaction.reply("Please enter a valid NUMBER of winners");
    }

    const embd = new MessageEmbed()
    .setTitle(title)
    .setAuthor(author)
    .setDescription(desc)
    .addFields([
        {name: 'Prize', value: prize},
        {name: 'Ends in', value: `<t:${Math.floor((new Date()).getTime()/1000) + (Number(time) * timeAdjuster)}:R>`},
        {name: 'Host', value: `${interaction.user}`},
        {name: 'Number of Contestants', value: '0'},
        {name: 'Number of Winners', value: winners}
    ]);
    
    const msgPromise = interaction.channel.send({ embeds: [embd] });
    msgPromise.then((msg) => {
        msg.react('🎉');

        var nonbots = [];
        const filter = (reaction, user) => {
            if (!user.bot) {
                nonbots.push(user);
            }

            return (reaction.emoji.name === '🎉');
        };
        
        const collector = msg.createReactionCollector({ filter, time: 5000 });
        
        // collector.on('collect', (reaction, user) => {
        //     console.log(`Collected ${reaction.emoji.name} from ${user.tag}`);
        // });
        
        collector.on('end', collected => {
            const finalists = [];
            if (winners >= nonbots.length) {
                for (let i = 0; i < nonbots.length; i++) {
                    finalists.push(`<@${nonbots[i].id}>`);
                }
            } else {
                for (let i = 0; i < winners; i++) {
                    const ind = Math.floor(nonbots.length * Math.random());
                    finalists.push(`<@${nonbots[ind].id}>`);
                    delete nonbots[ind];
                    nonbots = nonbots.filter((val) => { return (val != null); });
                }
            }

            let embd = msg.embeds[0];

            if (winners > 1) {
                msg.reply(`And the winners are:\n${finalists.join("\n")}`);
                embd.fields.push({name: 'winners:', value: `${finalists.join("\n")}`, inline: true});
            } else {
                msg.reply(`And the winner is:\n${finalists.join("\n")}`);
                embd.fields.push({name: 'winner:', value: `${finalists.join("\n")}`, inline: true});
            }

            msg.edit({ embeds: [embd] });
        });        
        
        interaction.reply({ content: 'Giveaway posted!', ephemeral: true });
    });
}


module.exports = {
    name: 'giveaway',
    description: 'Create a giveaway',
    execute(interaction, Discord, Client, bot) {
        
        postForm(interaction);
    },
    processForm,
    options: []
}