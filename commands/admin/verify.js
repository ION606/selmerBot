const Discord = require('discord.js');

/**
 * @param {Discord.Guild} guild 
 * @returns {Promise<Boolean>}
 */
function checkRole(bot, guild, userId) {
    return new Promise((resolve, reject) => {
        const user = guild.members.cache.get(userId);

        // return (role != undefined && user.roles.cache.has(role.id)); // || user.id == guild.ownerId || bot.inDebugMode

        // Maybe implement this later, useless for now
        bot.mongoconnection.then((client) => {
            // const role = client.db(message.guild.id).collection("admin-roles");
            const a = new Array();
            client.db(guild.id).collection("SETUP").findOne({_id: "roles"}).then((doc) => {
                const comRoles = doc.commands;
                const role = guild.roles.cache.find((role) => { return (role.name == "Selmer Bot Commands"); });
                const hasPreAdminRole = (role != undefined && user.roles.cache.has(role.id) || user.id == guild.ownerId);

                if (!comRoles) {
                    resolve(hasPreAdminRole);
                } else {
                    const hasRoles = [];
                    Promise.all(comRoles.map((val) => {
                        if (user.roles.cache.has(val)) {
                            hasRoles.push(true);
                        }
                    })).then(() => {
                        resolve(hasRoles.length > 0 || hasPreAdminRole);
                    });
                }
            });
        });
    });
}



module.exports = { checkRole }