const {Interaction, Constants, Modal, TextInputComponent, MessageActionRow, MessageEmbed, MessageButton, Message} = require('discord.js');
const { checkRole } = require('./verify.js');
const { isValidUrl } = require('../dev only/setPresence.js');
const embdList = [{name: 'Title'}, {name: 'Image', desc: 'The image url'}, {name: 'Thumbnail', desc: 'The thumbnail url'}, {name: 'URL'}, {name: 'Description', desc: 'Use {ROLE} to insert the role'}];


async function postForm(interaction, role, useEmoji, txt) {
    // Create the modal
    const modal = new Modal();

    modal.setTitle('Create a new reaction role!')
    .setCustomId(`reactionModal|${role.id}|${useEmoji}|${txt}`);

    for (let i = 0; i < 5; i++) {
        const tempInp = new TextInputComponent()
        .setCustomId(embdList[i].name.toLowerCase())
        .setLabel(embdList[i].name);

        if (embdList[i].name != 'Description') {
            tempInp.setStyle('SHORT');
        } else {
            tempInp.setStyle('PARAGRAPH');
        }

        if (embdList[i].desc) {
            tempInp.setPlaceholder(embdList[i].desc);
        }

        modal.addComponents(new MessageActionRow().addComponents(tempInp));
    }

    // Show the modal to the user
    interaction.showModal(modal);
}

/**
 * @param {Interaction} interaction 
 */
function postNotif(interaction, roleId, guild, user) {
    const role = guild.roles.cache.get(roleId);

    const embd = new MessageEmbed()
    .setTitle("You got a new role!")
    .setDescription(`You were given the *${role.name}* role in **${guild}**\n_You did this by reacting to [this message](${interaction.message.url})_`)
    .setTimestamp()
    .setThumbnail(guild.iconURL());
    user.send({embeds: [embd]});
}

/**
 * @param {Interaction} interaction 
 */
function processForm(interaction, bot) {
    const roleId = interaction.customId.split('|')[1];
    const title = interaction.fields.getTextInputValue('title');
    const img = interaction.fields.getTextInputValue('image');
    const thumb = interaction.fields.getTextInputValue('thumbnail');
    const url = interaction.fields.getTextInputValue('url');
    var desc = interaction.fields.getTextInputValue('description');
    
    const useEmoji = (interaction.customId.split('|')[2] == 'true');
    var txt = interaction.customId.split('|')[3];
    var emoji = undefined;

    //Emoji?

    if (Number.isInteger(Number(txt))) {
        emoji = interaction.guild.emojis.cache.get(txt);
    }

    if (desc.indexOf("{ROLE}") != -1) {
        desc = desc.replaceAll("{ROLE}", `<@&${roleId}>`);
    }

    const embd = new MessageEmbed()
    .setTitle(title)
    .setDescription(desc || "");

    if (img && isValidUrl(img)) embd.setImage(img);
    if (thumb && isValidUrl(thumb)) embd.setThumbnail(thumb);
    if (url && isValidUrl(url)) embd.setURL(url);

    if (useEmoji) {
        interaction.channel.send({embeds: [embd]}).then((msg) => {
            try {
                msg.react(emoji || txt);

                const filter = (reaction, user) => {
                    return (!user.bot && (reaction.emoji.id == txt || reaction.emoji.name == txt));
                };
                
                const collector = msg.createReactionCollector({ filter });
                
                collector.on('collect', (reaction, user) => {
                    const guildUser = reaction.message.guild.members.cache.get(user.id);

                    if (guildUser.roles.cache.has(roleId)) {
                        return guildUser.send("You already have this role!");
                    }

                    guildUser.roles.add(roleId);
                    postNotif(reaction, roleId, reaction.message.guild, guildUser);
                });
            } catch (err) {
                console.error(err);
            }
        });
    } else {
        const btn = new MessageButton()
        .setCustomId(`addRole|${roleId}`)
        .setStyle('PRIMARY');

        if (emoji) btn.setEmoji(emoji);
        else btn.setLabel(txt);

        const row = new MessageActionRow()
        .addComponents([btn]);

        interaction.channel.send({embeds: [embd], components: [row]})
    }

    interaction.reply({content: "Reaction role added!", ephemeral: true});
}


/**
 * @param {Interaction} interaction 
 * @returns 
 */
function handleBtn(interaction) {
    const roleId = interaction.customId.split('|')[1];
    const user = interaction.guild.members.cache.get(interaction.user.id);
    if (user.roles.cache.has(roleId)) {
        return interaction.reply({content: "You already have this role!", ephemeral: true});
    }

    user.roles.add(roleId);
    const role = interaction.guild.roles.cache.get(roleId);
    postNotif(interaction, role.id, interaction.guild, interaction.user);
}


module.exports = {
    name: "reactionrole",
    description: "Give someone a role when they react to a message",
    /**
     * @param {Interaction} interaction 
     */
    execute(interaction, Discord, Client, bot) {
        const user = interaction.user;

        checkRole(bot, interaction.guild, user.id).then((isAdmin) => {
            if (isAdmin) {
                const role = interaction.options.data.filter((opt) => { return(opt.name == "role"); })[0].role;
                const useEmoji = interaction.options.data.filter((opt) => { return(opt.name == "useemoji"); })[0].value;
                var txt = interaction.options.data.filter((opt) => { return(opt.name == "text"); })[0].value;

                if (txt.startsWith('<:') && txt.endsWith(">")) {
                    const emoji = interaction.guild.emojis.cache.get(txt.split(":")[2].split(">")[0]);
                    
                    if (!emoji) { return interaction.reply("Please use a valid emoji"); }

                    txt = txt.split(":")[2].split(">")[0];
                }

                if (role.position >= interaction.guild.me.roles.highest.position ||!interaction.guild.me.permissions.has("MANAGE_ROLES")) {
                    return interaction.reply({
                    content: "I'm not high enough in the role hierarchy to do that!\n_To raise my place, go to **Server Settings -> Roles** then drag me up!_",
                    ephemeral: true
                  });
                }

                postForm(interaction, role, useEmoji, txt);
            }
        });
    }, processForm, handleBtn,
    options: [
        {name: "role", description: "The role to assign", type: Constants.ApplicationCommandOptionTypes.ROLE, required: true},
        {name: "useemoji", description: 'React using a button or emoji', type: Constants.ApplicationCommandOptionTypes.BOOLEAN, required: true},
        {name: 'text', description: 'The reaction emoji or button text', type: Constants.ApplicationCommandOptionTypes.STRING, required: true}
    ]
}