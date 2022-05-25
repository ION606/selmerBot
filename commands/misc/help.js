module.exports ={
    name: "help",
    description: "Gets help for all of Selmer Bot's commands",
    execute(message, args, Discord, Client, bot) {

        if (args[0] == 'econ') {
            let temp = "***Selmer Bot Commands (Econ):***\n";
            temp += bot.commands.get('econ').econHelp();
            temp += `\n\n(remember to use '${bot.prefix}' before the command!)`;
            return message.channel.send(temp);
        } 
        else if (args[0] == 'game') {
            let temp = "***Selmer Bot Commands (Games):***\n";
            temp += bot.commands.get('game').allGames.join(", ");
            temp += `\n\n(remember to use '${bot.prefix}' before the command!)`;
            return message.channel.send(temp);
        }

        let temp = "***Selmer Bot Commands:***\n";
        
        bot.commands.sort((a, b) => {a.name[0] < b.name[0]});

        bot.commands.forEach((comm) => {            
            if (comm.name != 'verify') {
                if (comm.name == 'econ') {
                    temp += `econ - use _!help econ_\n`;
                }
                else if (comm.name == 'game') {
                    temp += `game - use _!help game_\n`;
                }
                else {
                    temp += `${comm.name.toLowerCase()} - _${comm.description}_\n`;
                }
            }
        });

        temp += `\n_(remember to use '${bot.prefix}' before the command!)_`;
        message.channel.send(temp);
    }
}