const { addxp, BASE } = require('../db/econ.js');


async function setCard(bot, interaction) {
    bot.mongoconnection.then(async (client) => {
        const dbo = client.db(interaction.guildId).collection('SETUP');
        dbo.findOne({_id: "LEVELING"}).then((doc) => {
            const bkBuffer = Buffer.from(doc.card, 'base64');
            
        });
    });
}


function textToLevels(bot, message, xp_list) {
    if (!bot.inDebugMode && message.guild.id == bot.home_server) { return; }

    const author = message.author;
    // doc.xp + (BASE.XP * doc.rank)
    bot.mongoconnection.then((client) => {
        const serverOpts = client.db(message.guild.id).collection('SETUP');
        serverOpts.findOne({_id: "LEVELING"}).then((doc) => {
            if (!doc) {
                serverOpts.insertOne({_id: "LEVELING", enabled: false, card: undefined, text: undefined, col: "#FFFFFF"});
                const server = bot.guilds.cache.get(message.guild.id);
                server.members.fetch(message.guild.ownerId).then(function(owner) {
                    // Implement `setup leveling enable`
                    owner.send("Interactive Leveling has been added to your server!\nTo enable it, use `/setup leveling enable`");
                });
            } else if (doc.enabled) {
                const dbo = client.db(message.guild.id).collection(author.id);
                dbo.findOne({"balance": {$exists: true}}).then((doc) => {
                    const newXp = doc.xp + Math.ceil((BASE.XP * doc.rank) / 4);
                    addxp(bot, message, dbo, newXp, xp_list, true);
                });
            }
        });
    });
}

module.exports = {textToLevels};