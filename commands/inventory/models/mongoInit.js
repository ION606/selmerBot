module.exports = {
    name: 'Init',
    async execute(bot, message, args, command, GuildModel, Discord, connect) {
        if (!message.guild) { return console.log("NO GUILD"); }
        const doc = new GuildModel( {id: message.guild.id });
        await doc.save();
    }
}