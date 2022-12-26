const { Modal, TextInputComponent, MessageActionRow, MessageButton, MessageEmbed, Interaction } = require('discord.js');


/**
 * @param {Interaction} interaction 
 */
function postEmbd(bot, desc, interaction, page, isGuild, id, refered) {
    try {
        const author = {
            name: "Selmer Bot",
            url: "",
            iconURL: bot.user.displayAvatarURL()
        };

        const newEmbed = new MessageEmbed()
            .setTitle("REMINDERS")
            .setAuthor(author)
            .setDescription(desc[page])
            .setFooter({ text: `Page ${page + 1}` });


        const row = new MessageActionRow();
        //Make sure the page is never < 1
        const prevbtn = new MessageButton()
            .setCustomId(`reminderQueue|${isGuild}-${id}|`)
            .setLabel('⬅️')
            .setStyle('SECONDARY')

        if (page <= 0) {
            prevbtn.customId += `0`;
            // prevbtn.setCustomId(`reminderQueue|${isGuild}-${id}|0`);
            prevbtn.setDisabled(true);
        } else {
            prevbtn.customId += `${page - 1}`;
        }

        const nextbtn = new MessageButton()
            .setCustomId(`reminderQueue|${isGuild}-${id}|`)
            .setLabel('➡️')
            .setStyle('SECONDARY');

        if ((page + 1) >= desc.length) {
            nextbtn.customId += `${desc.length}`;
            // nextbtn.setCustomId(`reminderQueue|`);
            nextbtn.setDisabled(true);
        } else {
            nextbtn.customId += `${page + 1}`;
        }

        row.addComponents(prevbtn, nextbtn);

        if (page > 0 || refered) {
            interaction.update({ content: '_Note: To see a full list of reminder stats visit https://selmerbot.com _', embeds: [newEmbed], components: [row] });
        } else {
            interaction.reply({ content: '_Note: To see a full list of reminder stats visit https://selmerbot.com _', embeds: [newEmbed], components: [row] });
        }
    } catch (err) {
        console.log(err);
        return interaction.reply("Uh Oh! There's been an error!");
    }
}


async function postForm(interaction, isGuild = false) {
    // Create the modal
    const modal = new Modal();

    if (!isGuild) {
        modal.setTitle('Creating a New Personal Reminder')
        .setCustomId('newEventModal|user');
    } else {
        modal.setTitle('Creating a New Guild Reminder')
        .setCustomId('newEventModal|guild');
    }

    // Add components to modal
    // Create the text input components
    // The label is the prompt the user sees for this input
    // Short means only a single line of text
    // Paragraph means multiple lines of text

    const nameInp = new TextInputComponent()
    .setCustomId('name')
    .setLabel("What is the Event's name?")
    .setStyle('SHORT');

    const descInp = new TextInputComponent()
    .setCustomId('description')
    .setLabel("What's the event's description?")
    .setStyle('PARAGRAPH');
    
    const dateInp = new TextInputComponent()
    .setCustomId('date')
    .setLabel("What's the event's date?")
    .setPlaceholder('1/1/2020')
    .setStyle('SHORT');

    const timeInp = new TextInputComponent()
    .setCustomId('time')
    .setLabel("What's the event's time?")
    .setPlaceholder("2:00 PM or 14:00")
    .setStyle('SHORT');


    const locurlinp = new TextInputComponent()
    .setCustomId('locationwurl')
    .setLabel("Where is the event happening?")
    .setPlaceholder('To add a URL, simply use location;url (the seperator is a semi-colon)')
    .setStyle('SHORT');

    // An action row only holds one text input,
    // so you need one action row per text input.
    const name = new MessageActionRow().addComponents(nameInp);
    const desc = new MessageActionRow().addComponents(descInp);
    const date = new MessageActionRow().addComponents(dateInp);
    const time = new MessageActionRow().addComponents(timeInp);
    const offset = new MessageActionRow().addComponents(locurlinp);

    // Add inputs to the modal
    modal.addComponents(name, desc, date, time, offset);

    // Show the modal to the user
    interaction.showModal(modal);
}



//#region DATABASE PROCESSING

function addEvent(obj, connection, interaction, embd) {
    try {
        var Id;
        if (obj.event.userId != null) { Id = obj.event.userId }
        else { Id = obj.event.guildId; }
        connection.then((client) => {
            // Update the Key object first to check if the time is already there
            const kbo = client.db('main').collection('reminderKeys');
            kbo.findOne(({ 'userId': Id })).then((doc) => {
                const t = obj.time.toString();
                try {
                    if (doc) {
                        if (doc.times.indexOf(obj.time) == -1) {
                            kbo.updateOne({ 'userId': Id }, { $push: { times: t } })
                        } else {
                            //Event already exists at this time
                            return interaction.reply("An event already exists at this time!");
                        }
                    } else {
                        doc = { userId: Id, times: [t] }
                        kbo.insertOne(doc);
                    }


                    //Update the Time object
                    const dbo = client.db('main').collection('reminders');
                    dbo.findOne({ time: t }).then((doc) => {
                        let n = 0;
                        if (doc) {
                            n = doc.amt;
                            doc.amt ++;

                            doc[`${n}`] = obj.event;
                            dbo.findOneAndReplace({ time: t }, doc);
                        } else {
                            const d = new Date(Number(obj.time));
                            doc = { "0": obj.event, "time": t, "month": d.getMonth(), "amt": 1 }; //Month used for clearing when the calendar month begins (maybe modify the garbage collection with an `else if (day == 1? clear last month)` )
                            dbo.insertOne(doc);
                        }

                        //Reply with the reminder in correct format
                        interaction.reply({ content: "REMINDER SAVED!", embeds: [embd], ephemeral: true });
                    }).catch((err) =>  {
                        console.log("ERR");
                        console.error(err);
                        interaction.reply("Uh Oh! An error has occured!");
                    });
                } catch (err) {
                    console.error(err); interaction.reply("Uh Oh! An error has occured!");
                }
            }).catch((err) =>  {
                console.log("ERR");
                console.error(err);
                interaction.reply("Uh Oh! An error has occured!");
            });
        });
    } catch (err) {
        console.error(err);
        return interaction.reply("Uh Oh! An error has occured!");
    }
}

/**
 * @returns { Promise<[]> | Promise<[false, []] | [true, String]>} (all events) || (custom err) ? [true, err] : [false, err]
 */
function getEvents(bot, interaction, id, jpage = 0, isGuild = false, refered = false, isExport = false) {
    return new Promise((resolve, reject) => {
        var userId = false;
        var guildId = false;
        const numperpage = 5;

        if (isGuild) {
            guildId = id;
        } else {
            userId = id;
        }

        bot.mongoconnection.then((client) => {
            try {
                var times;
                const dbo = client.db('main').collection('reminderKeys');

                //ReminderKeys are all stored as userId, the reminders themselves are not
                dbo.findOne({$or: [ {userId: userId}, {userId: guildId} ]}).then((doc) => {
                    if (!doc) {
                        if (isExport) {
                            return reject([true, "No events exist!"]);
                        }

                        return interaction.reply("No events exist!");
                    }

                    times = doc.times;
                    const tbo = client.db('main').collection('reminders');
                    
                    tbo.find({time: {$in: times}}).toArray((err, docs) => {

                        if (isExport) {
                            return resolve(docs);
                        }

                        //There's gotta be a better way
                        var temp = [""];
                        var page = 0;

                        for (let i = 0; i < docs.length; i ++) {
                            if (i != 0 && i % numperpage == 0) {
                                page ++;
                                temp[page] = '';
                            }
                            // temp += `__***Events On ${new Date(Number(docs[i].time))}***__\n\n`;
                            for (let j in docs[i]) {
                                if (!isNaN(j) && (docs[i][j].userId == userId || docs[i][j].guildId == guildId)) {
                                    const obj = docs[i][j];
                                    temp[page] += `Name: ${obj.name}\nDescription: ${obj.description}\nDate/Time: ${new Date(Number(docs[i].time))}\nOffset: ${obj.offset}\nLink: ${obj.link}\nLocation: ${obj.location}\n------------------------------\n`
                                }
                            }
                        }

                        //Create the embed
                        postEmbd(bot, temp, interaction, jpage, isGuild, id, refered);

                        resolve(true);
                    });
                });
            } catch (err) {
                console.log(err);
                if (isExport) {
                    return reject([false, err]);
                }
                return interaction.reply("Uh Oh! There's been an error!");
            }
        });
    });
}

//#endregion



//fields: [<name>, <description>, <date>, <time>, [offset], [url], [location]]
function processForm(bot, interaction) {

    try {
        var guildId = null;
        var userId = null;
        var isGuild = false;
        if (interaction.customId.toLowerCase().indexOf('user') != -1) {
            userId = interaction.user.id;
        } else {
            guildId = interaction.guildId;
            isGuild = true;
        }


        //Get the values
        const name = interaction.fields.getTextInputValue('name');
        const desc = interaction.fields.getTextInputValue('description');
        const date = new Date(interaction.fields.getTextInputValue('date'));
        const timeTemp = interaction.fields.getTextInputValue('time');
        const locurl = interaction.fields.getTextInputValue('locationwurl');

        var loc = "N/A";
        var url = "N/A";
        if (locurl.indexOf(';') != -1) {
            let temp = locurl.split(';');
            loc = temp[0];
            url = temp[1];
        } else if (locurl.indexOf('http') != -1) {
            //Set the URL
            url = locurl;
        } else if (locurl != "") {
            //Set the location
            loc = locurl;
        }

        //Process time
        var timesplit = timeTemp.split(' ').filter((inp) => { return(inp.indexOf(':') != -1); });
        if (timesplit.length == 0) { return interaction.reply("Please enter a date in one of the following formats: _2:00 PM or 14:00_"); }

        timesplit = timesplit[0].split(":");
        timesplit[0] = Number(timesplit[0]);
        timesplit[1] = Number(timesplit[1]);

        if (timeTemp.toLowerCase().indexOf('pm') != -1) { timesplit[0] += 12; }
        //else if (timeTemp.toLowerCase().indexOf('am') != -1) {

        date.setHours(timesplit[0]);
        date.setMinutes(timesplit[1]);

        const timeUTC = date.getTime();

        //Make sure the reminder is at least 5 minutes into the future
        var currentDate = new Date();
        currentDate.setMinutes(currentDate.getMinutes() + 5);

        if (currentDate.getTime() >= (timeUTC)) {
            return interaction.reply("Please enter a date at least 5 minutes in the future!");
        }

        temp = `***${name}*** is coming up in <t:${timeUTC/1000}:R> on <t:${timeUTC/1000}:F>`;
        const embd = new MessageEmbed()
        .setAuthor({ name: "Selmer Bot", url: "", iconURL: bot.user.displayAvatarURL() })
        .setTitle(temp)
        .setDescription(`Description: ${desc}`)
        .addFields(
            { name: 'Time', value: `<t:${timeUTC/1000}:F>` },
            { name: 'Location', value: `${loc}` },
            { name: 'Link', value: `${url}` },
            { name: 'Offset', value: `Available on Website` }
        );

        const obj = { time: timeUTC, event: { guildId: guildId, userId: userId, name: name, description: desc, offset: 0, link: url, location: loc } }
        addEvent(obj, bot.mongoconnection, interaction, embd, isGuild);
    } catch (err) {
        console.error(err);
    }
}



function modalHandle(bot, interaction) {
    try {
        //If the person selected "add" post the form
        if (interaction.customId.indexOf('newEvent|User') != -1) {
            if (interaction.user.id == interaction.customId.split('|')[2]) {
                postForm(interaction);
            }
        } else if (interaction.customId == 'newEvent|Guild') {
            postForm(interaction, true);
        } else if (interaction.isModalSubmit()) {
            //The user is submitting a form
            processForm(bot, interaction);
        } else if (interaction.customId == 'getEvents') {
            if (interaction.channel.type === "DM") {
                getEvents(bot, interaction, interaction.user.id, 0, false);
            } else {
                getEvents(bot, interaction, interaction.guildId, 0, true);
            }
        }
    } catch (err) {
        console.error(err);
    }
}

// reminderQueue
function turnPage(bot, interaction) {
    const isplit = interaction.customId.split('|');
    const isGuild = (isplit[1].split('-')[0] === 'true');
    const id = isplit[1].split('-')[1];
    const page = Number(isplit[2]);
    getEvents(bot, interaction, id, page, isGuild, true);
}


module.exports = {
    name: "reminders",
    description: "Have Selmer Bot remind you - premium feature",
    execute(interaction, Discord, Client, bot) {
        //Check if the user has premium
        bot.mongoconnection.then(async (client) => {
            const dbo = client.db('main').collection('authorized');
            dbo.find({ discordID: interaction.user.id }).toArray((err, docs) => {

                //Only available to Selmer Bot devs, testers and "authorized" users
                if (docs[0] != undefined) {
                    //Execute the command
                    const row = new MessageActionRow()

                    if (interaction.channel.type == 'DM') {
                        row.addComponents(
                            new MessageButton()
                                .setCustomId(`newEvent|User|${interaction.user.id}`)
                                .setLabel('New Personal Reminder')
                                .setStyle('SUCCESS'),
                            new MessageButton()
                                .setCustomId('getEvents')
                                .setLabel('See Personal Reminders')
                                .setStyle('PRIMARY'),
                        );
                    } else {
                        row.addComponents(
                            new MessageButton()
                                .setCustomId(`newEvent|User|${interaction.user.id}`)
                                .setLabel('New Personal Reminder')
                                .setStyle('SUCCESS'),
                            new MessageButton()
                                .setCustomId('newEvent|Guild')
                                .setLabel('New Guild Reminder')
                                .setStyle('SUCCESS'),
                            new MessageButton()
                                .setCustomId('getEvents')
                                .setLabel('See Guild Reminders')
                                .setStyle('PRIMARY'),
                        );
                    }

                    return interaction.reply({ content: 'Please select an action\n_Notes: Adding offset to an event is only supported on the website and personal reminders can be viewed in DM\'s_', components: [row], ephemeral: true });
                } else {
                    interaction.reply("You have to be a premium subscriber to use this feature!\n_support coming soon_");
                }
            });
        });
    }, modalHandle, turnPage, addEvent, getEvents,
    options: []
}