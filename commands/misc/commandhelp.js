module.exports ={
    name: "help",
    description: "Gets help for all of Selmer Bot's commands",
    execute(message, args, Discord, Client, bot) {
        let temp = "***Selmer Bot Commands:***\n";
        
        bot.commands.sort((a, b) => a.name[0] < b.name[0]);

        bot.commands.forEach((comm) => {
            if (comm.name != 'verify') {
                temp += `${comm.name.toLowerCase()} - ${comm.description}\n`;
            }
        });

        message.channel.send(temp);
    }
}