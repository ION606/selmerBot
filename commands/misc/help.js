const { modHelp } = require('../admin/moderation.js');
const { Constants } = require('discord.js');

//CHANGE THIS TO FORMS?
module.exports ={
    name: "help",
    description: "Gets help for all of Selmer Bot's commands",
    execute(interaction, Discord, Client, bot) {

        const groups = new Map([['SBspec', ['arrow', 'extracredit', 'profile', 'quotes', 'code']], ['adminCommands', [ 'setup', 'lock', 'unlock', 'serverlock' ]]]);
        
        var spec = "";
        if (interaction.options.data[0]) {
            spec = interaction.options.data[0].value;
        }

        if (spec == 'econ') {
            let temp = "***Selmer Bot Commands (Econ):***\n";
            temp += bot.commands.get('econ').econHelp();
            temp += `\n\n(remember to use _'${bot.prefix}'_ before the command!)`;
            return interaction.reply({ content: temp, ephemeral: true });

        } 
        else if (spec == 'game') {
            let temp = "***Selmer Bot Commands (Games):***\n";
            temp += bot.commands.get('game').allGames.join(", ");
            temp += `\n\n_Note: due to how complicated this feature is, it will not be migrated to slash commands for now_`;
            return interaction.reply({ content: temp, ephemeral: true });
            
        }
        else if (spec == 'admin') {
            let temp = `__**Selmer Bot Admin Commands**__\n`
            Array.from(groups.get('adminCommands')).forEach(commName => {
                let comm = bot.commands.get(commName);
                temp += `${comm.name.toLowerCase()} - _${comm.description}_\n`;
            });

            temp += `__**Selmer Bot Moderation Commands**__\n`
            temp += modHelp();

            //Uses a different format, only the server owner can use it
            temp += '\n_setup_ - ***SERVER OWNER ONLY*** - use _!setup help_\n';
            temp += `\n\n(remember to use _'${bot.prefix}'_ before the command!)`;

            return interaction.reply({ content: temp, ephemeral: true });
        }

        let temp = "***Selmer Bot Commands:***\n";
        
        bot.commands.sort((a, b) => {if (a.name && b.name) { return a.name[0] < b.name[0]} else {return false;} });

        const noPostList = Array.from(groups.values()).flat();
        const sList = groups.get('SBspec');

        bot.commands.forEach((comm) => {
            if (comm.name != 'verify') {
                if (comm.name == 'econ') {
                    temp += `**econ** - use _!help econ_\n`;
                }
                else if (comm.name == 'game') {
                    temp += `**games** - use _!help game_\n`;
                }
                else {
                    if (comm.name && comm.description && !noPostList.includes(comm.name)) {
                        temp += `${comm.name.toLowerCase()} - _${comm.description}_\n`;
                    }
                }
            }
        });

        temp += '**admin/moderation commands** - use !help admin\n';
        
        //Selmer Specific
        temp += '\n__**Selmer\'s \\*Special\\* Commands**__\n'
        sList.forEach((commName) => {
            const comm = bot.commands.get(commName);
            temp += `${comm.name.toLowerCase()} - _${comm.description}_\n`;
        })

        temp += `\n_(remember to use '${bot.prefix}' before the command!)_`;

        interaction.reply({ content: temp, ephemeral: true });
    },
    options: [{name: 'command', description: 'econ, game, or admin', type: Constants.ApplicationCommandOptionTypes.STRING, required: false, choices: [ { name: 'econ', value: 'econ' }, { name: 'game', value: 'game' }, {name: 'admin', value: 'admin'} ]}]
}