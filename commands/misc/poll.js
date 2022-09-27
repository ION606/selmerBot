const { MessageEmbed, Constants } = require('discord.js');


//!poll <name> <option 1, option 2> [option 3...option 10]
module.exports = {
    name: "poll",
    description: "Create a cool poll embed (with time up to 1 hour!)",
    async execute(interaction, Discord, Client, bot) {
        const args = interaction.options.data;

        const timeList = [ '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟' ];
        const author = {
            name: "Selmer Bot",
            url: "",
            iconURL: bot.user.displayAvatarURL()
        }
        const name = args.filter((arg) => { return (arg.name == 'question'); })[0].value;

        const time = interaction.options.data.filter((arg) => { return (arg.name == 'time'); })[0].value;
        var temp;
        // var isTimed = !Number.isNaN(Number(args[1].split(":")[0]));

        if (time != 0) {
            temp = `This poll was created by ${interaction.user} and has no time limit!\n`;
        } else {
            time += time * 60; // (Number(args[1].split(':')[0]) * 60) + Number(args[1].split(':')[1]);
            temp = `This poll was created by ${interaction.user} and ends <t:${Math.floor((new Date()).getTime()/1000) + time}:R>!\n`;
        }

        //args[0] is the poll name
        for(let i = 0; i < args.length; i ++) {
            if (args[i].name.indexOf('option') == -1) { continue; }
            // complist.push({ name: `${timeList[i - 1]}: ${args[i]}`, value: "" });
            temp += `\n${timeList[i - 2]}: ${args[i].value}\n`;
        }

        const embd = new MessageEmbed()
        .setTimestamp()
        .setTitle(`${name}`)
        .setDescription(temp)
        .setAuthor(author)

        const m = interaction.channel.send({ embeds: [embd] });
        m.then((msg) => {
            interaction.reply("Poll Posted!");

            for(let i = 0; i < args.length - 2; i ++) {
                msg.react(timeList[i]);
            }

            if (!isTimed) {
                return;
            }

            const filter = (reaction, user) => {
                return timeList.includes(reaction.emoji.name);
            };
            let embd = msg.embeds[0];

            //Replace the "and ends in <t:timestamp:R>" part with "has ended"
            const collector = msg.createReactionCollector({ filter, time: time * 1000 });
            collector.on('end', collected => {
                let winnerC = 0;
                let winners = [];
                const col = Array.from(collected);

                for (let i = 0; i < col.length; i++) {
                    const key = col[i][0];
                    const val = col[i][1];

                    if (val.count > winnerC) {
                        winners = [key];
                        winnerC = val.count;
                    } else if (val.count == winnerC) {
                        winners.push(key);
                    }
                }

                let temp;
                if (winners.length > 1) {
                    temp = `The winners are: \`${winners.join(", ")}\` with \`${winnerC}\` votes each!`;
                } else {
                    temp = `The winner is: \`${winners.join(", ")}\` with \`${winnerC}\` votes!`;
                }

                embd.description = embd.description.substr(0, 50) + ` has ended!\n${temp}` + embd.description.substr(embd.description.indexOf("!") + 1);
                msg.edit({ embeds: [embd] });
                msg.reply(temp);
            });
        });
    },
    options: [
        {name: 'question', description: 'The poll question...', type: Constants.ApplicationCommandOptionTypes.STRING, required: true},
        {name: 'time', description: 'the time the poll is open for in minutes (for no limit input 0)', type: Constants.ApplicationCommandOptionTypes.INTEGER, required: true},
        {name: 'option1', description: 'A poll option', type: Constants.ApplicationCommandOptionTypes.STRING, required: true},
        {name: 'option2', description: 'A poll option', type: Constants.ApplicationCommandOptionTypes.STRING, required: false},
        {name: 'option3', description: 'A poll option', type: Constants.ApplicationCommandOptionTypes.STRING, required: false},
        {name: 'option4', description: 'A poll option', type: Constants.ApplicationCommandOptionTypes.STRING, required: false},
        {name: 'option5', description: 'A poll option', type: Constants.ApplicationCommandOptionTypes.STRING, required: false},
        {name: 'option6', description: 'A poll option', type: Constants.ApplicationCommandOptionTypes.STRING, required: false},
        {name: 'option7', description: 'A poll option', type: Constants.ApplicationCommandOptionTypes.STRING, required: false},
        {name: 'option8', description: 'A poll option', type: Constants.ApplicationCommandOptionTypes.STRING, required: false},
        {name: 'option9', description: 'A poll option', type: Constants.ApplicationCommandOptionTypes.STRING, required: false},
        {name: 'option10', description: 'A poll option', type: Constants.ApplicationCommandOptionTypes.STRING, required: false},
    ]
}