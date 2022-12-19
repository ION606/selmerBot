const { ICalParser } = require('cozy-ical');
const { URL } = require('url');
const { Constants } = require('discord.js');
const request = require('request');
const { verPremium } = require('../premium/verifyPremium.js');
const { isValidUrl } = require('../dev only/setPresence.js');


//#region SET REMINDERS

function addReminder(interaction, bot, obj, Id) {
    return new Promise((resolve, reject) => {
        try {
            bot.mongoconnection.then((client) => {
                // Update the Key object first to check if the time is already there
                const kbo = client.db('main').collection('reminderKeys');
                kbo.findOne(({ 'userId': Id })).then((doc) => {
                    const t = obj.time.toString();
                    try {
                        if (doc.times.indexOf(obj.time) == -1) {
                            kbo.updateOne({ 'userId': Id }, { $push: { times: t } })
                        } else {
                            //Event already exists at this time
                            reject("An event already exists at this time!");
                            return; // interaction.channel.send("An event already exists at this time!");
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
                            // interaction.reply({ content: "REMINDER SAVED!", embeds: [embd], ephemeral: true });
                            resolve(true);
                        }).catch((err) =>  {
                            console.error(err);
                            // interaction.reply("Uh Oh! An error has occured!");
                        });
                    } catch (err) {
                        console.error(err); //interaction.reply("Uh Oh! An error has occured!");
                        reject(err);
                    }
                }).catch((err) =>  {
                    console.log("ERR");
                    console.error(err);
                    reject(false);
                    // interaction.reply("Uh Oh! An error has occured!");
                });
            });
        } catch (err) {
            console.error(err);
            // return interaction.reply("Uh Oh! An error has occured!"); // Gets "acknowledged" too many times
        }
    });
}

//#endregion



//#region SETUP AND PARSING
class calClass {
    constructor(vevent) {
        const model = vevent.model;
        const alarms = vevent.subComponents;

        if (alarms && alarms[0] && alarms[0].model) {
            let temp = alarms[0].model.trigger;
            temp = temp.split('DT')[1];
            temp = temp.split("H");

            let hours = (temp[0] && temp[0] != '0') ? Number(temp[0]) : 0;
            let minutesStr = temp[1].split('M')[0];
            let minutes = (minutesStr && !isNaN(minutesStr)) ? hours + Number(minutesStr) : hours;

            this.offset = minutes;
        } else {
            this.offset = 0;
        }

        this.name = model.summary;
        this.description = (model.description) ? model.description : "N/A";
        
        const dateTime = new Date(model.startDate);
        this.time = dateTime.getTime()/1000;

        if (isValidUrl(model.location)) {
            this.url = model.location || undefined;
            this.loc = undefined;
        } else {
            this.url = undefined;
            this.loc = model.location || undefined;
        }
    }

    isValidUrl(s) {
        try {
            new URL(s);
            return true;
        } catch (err) {
            return false;
        }
    }

    exportAsObj(gid, uid) {
        const obj = { time: this.time, event: { guildId: gid, userId: uid, name: this.name, description: this.description, offset: this.offset, link: this.url, location: this.loc } }
        return obj;
    }
}


function parseData(calStr, gid, uid) {
    return new Promise((resolve, reject) => {
        const parser = new ICalParser();
        parser.parseString(calStr, function(err, cal) {
            try {
                const arr = [];

                for (i in cal.subComponents) {
                    const a = new calClass(cal.subComponents[i]);
                    arr.push(a.exportAsObj(gid, uid));
                }

                resolve(arr);
            } catch (err) {
                console.log(err);
                reject(err);
            }
        });
    });
}


/**
 * @param {String} fileName
 */
function readFileAndParse(url, bot, interaction, gid, uid) {
    request.get(url, function (error, response, body) {
        try {
            if (!error && response.statusCode == 200) {
                const isGuild = (gid && !uid) || false;
                const notAdded = [];
                
                const Id = (isGuild) ? gid : uid;

                parseData(body, gid, uid).then((arr) => {

                    new Promise((resolve, reject) => {
                        // If the key does not exist, create it
                        if (arr.length > 0) {
                            bot.mongoconnection.then((client) => {
                                const kbo = client.db('main').collection('reminderKeys');
                                kbo.findOne(({ 'userId': Id })).then((doc) => {
                                    if (!doc) {
                                        doc = { userId: Id, times: [] }
                                        kbo.insertOne(doc);

                                        reject("New user created, please try again!");
                                    } else {
                                        resolve(true);
                                    }
                                });
                            });
                        } else {
                            reject("No data...");
                        }

                        // const m = new Map(arr.map((obj, ind) => { return [ind, obj]; }));
                    }).then(() => {
                        Promise.all(arr.map((obj, ind) => {
                            addReminder(interaction, bot, obj, Id).then(() => {})
                            .catch((err) => {
                                notAdded.push(err);
                            });
                        })).then((t) => {
                            const r1 = { content: `ITEMS NOT ADDED:\n${notAdded.join("\n")}`, ephemeral: true }

                            if (r1.content != "ITEMS NOT ADDED:\n") {
                                interaction.reply(r1).catch((err) => { interaction.channel.send(r1); });
                            } else {
                                const r2 = `All ${arr.length} items added to calendar!`;
                                interaction.reply(r2).catch((err) => { interaction.channel.send(r2); });
                            }
                        });
                    }).catch((err) => {
                        interaction.reply(err);
                    })
                }).catch((err) => {
                    console.log(err);
                });
            }
        } catch (err) {
            console.log(err);
            interaction.reply({ content: "Uh oh, there's been an error!", ephemeral: true});
        }
    });
}

//#endregion


module.exports = {
    name: 'import_ics',
    description: 'Import events using a calendar',
    async execute(interaction, Discord, Client, bot) {
        //Check if the user has premium
        await verPremium(bot, interaction.user.id).then(() => {
            const url = interaction.options.data[0].attachment.attachment;

            if (!url.endsWith(".ics")) {
                return interaction.reply("Please use a valid ***.ics*** file!")
            }
            
            let uid, gid;
            if (interaction.channel.type == 'DM') {
                uid = interaction.user.id;
            } else {
                gid = interaction.guildId;
            }
            readFileAndParse(url, bot, interaction, gid, uid);
        }).catch(() => {
            interaction.reply("You have to be a premium subscriber to use this feature!");
        });
    },
    options: [
        {name: 'ics_file', description: 'The ics file to input', type: Constants.ApplicationCommandOptionTypes.ATTACHMENT, required: true},
    ],
    isDm: true
}