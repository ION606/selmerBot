//@ts-check
const { log, SEVCODES } = require('../log.js');
const { checkRole } = require('./verify.js');


function modHelp() {
    const l = ['lock', 'unlock', 'kick', 'ban', 'unban', 'mute', 'unmute'];

    return l.join(", ");
}


function kick(guild, user) {
    guild.members.kick(user);
}


async function toggle_ban(guild, message, args, ban, reason) {
    var user = args[0];
    let i = 0;
    while (user.indexOf('#') == -1) {
        user += args[i];
        i++
    }

    if (ban) {
        guild.members.ban(user);
    } else {
        return new Promise((resolve, reject) => {
            message.guild.bans.fetch().then((users) => {
                const userObj = users.filter((u) => {
                    return (`${u.user.username}#${u.user.discriminator}` == user);
                }).first();

                if (userObj && userObj.user) {
                    guild.members.unban(userObj.user.id, reason).then(() => {
                        resolve(userObj.user);
                    });
                } else {
                    reject("This user is not in the server!");
                }
            })
        });
            
        // //Check if the user is banned or not
        // message.guild.invites.fetch().then((invites) => {
        //     const u = guild.members.cache.get(id);
        //     u.send(`You have been unbanned from ${guild.name}, you can rejoin using the following link!\nhttps://discord.gg/${invites.first().code}`);
        // });
    }
}


function toggle_mute(bot, guild, command, message, user, reason, mute) {
    const mutedRole = guild.roles.cache.find((role) => role.name.toLowerCase() === 'muted');
       const guser = guild.members.cache.get(user.id);
       // if there is no `Muted` role, send an error
       if (!mutedRole) { return message.channel.send('There is no "muted" role on this server. Please create one then try again'); }

       if (mute) {
            if (guser.roles.cache.get(mutedRole.id) == undefined) {
                guser.roles.add(mutedRole);
                log(bot, message, command, user, reason, SEVCODES.low);
            } else { message.reply("This user is already muted!"); }
       } else {
            if (guser.roles.cache.get(mutedRole.id) != undefined) {
                guser.roles.remove(mutedRole);
                log(bot, message, command, user, reason, SEVCODES.none);
            } else { message.reply("This user is not muted!"); }
       }

       /*
        NOTE: use the following function for a "time out" type thing?
        setTimeout(() => {
            target.roles.remove(mutedRole); // remove the role
        }, <time>) 
       */
}


function timeOut(bot, user, message, args, command, reason) {

    let num = Number(args[1]);
    if (!args[1] && !Number.isSafeInteger(num)) { return message.reply(`Please use the following format ${bot.repfix}timeout <user> <amount of time> [*hours* **or** *minutes (default)*]`)}
    let ms = num * 60 * 1000;
    let timeAsSt = '';
    
    if (args[2] == 'hours') { ms *= 60; timeAsSt = `${args[1]} hours`; }
    else { timeAsSt = `${args[2]} minutes`; }

    user.timeout(ms, reason);

    log(bot, message, command, user, reason, timeAsSt);
}


function moderation_handler(bot, message, args, command) {
    const guild = message.guild;

    //Verify
    if (!checkRole(bot, guild, message.author.id)) { return message.reply('Insufficient Permission!'); }

    let mentioned = message.mentions.users.first();
    if (mentioned && mentioned.id == message.author.id) { return message.reply(`You can't ${command} yourself!`); }

    const reason = args.slice(1).join(' ');

    if (message.mentions.members.first() && (message.mentions.members.first().roles.highest.position > message.guild.members.resolve(bot.user).roles.highest.position)) {
        return message.reply("I'm not high enough in the role hierarchy to do that!\n_To raise my place, go to **Server Settings -> Roles** then drag me up!_");
    }
    
    if (command != 'unban' && !mentioned || !reason) { return message.channel.send(`Please use the following format: _!<command> <user> <reason>`); }
    if (command == 'unban' && !args[0] && !reason) { return message.channel.send("Please use the following format: _!unban <user_tag>#<user_discriminator> <reason>\nExample: _!unban John#1122_"); }
    // if (command == 'ban' && guild.members.cache.get(mentioned.id).bannable) { message.reply("This user is not bannable!"); } //Broken
    // if (command == 'ban' && !message.guild.members.cache.get(mentioned.id)) { message.reply("This user is not in the server"); }

    switch (command) {
        case 'kick': kick(guild, mentioned);
        log(bot, message, command, mentioned, reason, SEVCODES.medium);
        break;

        case 'ban': toggle_ban(guild, message, mentioned, true, reason);
        log(bot, message, command, mentioned, reason, SEVCODES.high);
        break;

        //Leave the then() catch() thing, it needs to be async
        case 'unban': toggle_ban(guild, message, args, false, reason).then((user) => { log(bot, message, command, user, reason, SEVCODES.none)}).catch((note) => { message.reply(note); });
        break;

        case 'mute': toggle_mute(bot, guild, command, message, mentioned, reason, true);
        break;
        
        case 'unmute': toggle_mute(bot, guild, command, message, mentioned, reason, true);
        break;

        // case 'timeout': timeOut(bot, mentioned, message, args, command, reason);
        // shouldIlog = false;
        // break;
        
        default: console.log(`ERROR! Moderation Command "${command}" has somehow been used!`);
    }
}

module.exports = { 
    name: 'moderation',
    moderation_handler, modHelp
}