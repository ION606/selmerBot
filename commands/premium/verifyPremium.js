
/**
 * Check if the user has a premium subscription
 * @param {*} bot
 * @param {String} userId 
 * @returns {Promise<Boolean>}
 */
function verPremium(bot, userId) {
    return new Promise((resolve, reject) => {
        const member = bot.guilds.cache.get(bot.home_server).members.cache.get(userId);
        bot.mongoconnection.then(async (client) => {
            const dbo = client.db('main').collection('authorized');
            dbo.findOne({ discordID: userId }).then((doc) => {
                //Only available to Selmer Bot devs, testers and "authorized" users
                if (doc != undefined || member && (member.roles.cache.has('944048889038774302') || member.roles.cache.has('946610800418762792'))) {
                    resolve(true);
                } else {
                    reject("You have to be a premium subscriber to use this feature!\n_support coming soon_");
                }
            });
        });
    });
}


module.exports = { verPremium }