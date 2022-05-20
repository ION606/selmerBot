module.exports ={
    name: "game",
    description: "Play a game using Selmer Bot!",
    execute(message, args, Discord, Client, bot) {
        let temp = "Selmer Bot Commands:\n";
        var keys = bot.commands.keys();
        for (let i = 0; i < keys.length; i ++) {
            temp += keys[i].toLowerCase();
            temp += ` - ${bot.commands.get(keys[i]).description}\n`;
        }
    }
}