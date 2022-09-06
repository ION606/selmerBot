const { MessageEmbed } = require('discord.js');


//!poll <name> <option 1, option 2> [option 3...option 10]
module.exports = {
    name: "poll",
    description: "Create a cool poll embed (with time up to 1 hour!)",
    async execute(message, args, Discord, Client, bot) {
        if (args.length < 3) { return message.reply("Please provide a poll name, time (like 1:25 or 0 for not timed) and 1 - 10 options!"); }
        if (args.length > 12) { return message.reply("Please specify less than 10 options!"); }

        const timeList = [ '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟' ];
        const author = {
            name: "Selmer Bot",
            url: "",
            iconURL: bot.user.displayAvatarURL()
        }


        var time = 0;
        var temp;
        var isTimed = !Number.isNaN(Number(args[1].split(":")[0]));

        if (!isTimed) {
            temp = `This poll was created by ${message.author} and has no time limit!\n`;
        } else {
            time += (Number(args[1].split(':')[0]) * 60) + Number(args[1].split(':')[1]);
            temp = `This poll was created by ${message.author} and ends <t:${Math.floor((new Date()).getTime()/1000) + time}:R>!\n`;
        }

        //args[0] is the poll name
        for(let i = 2; i < args.length; i ++) {
            // complist.push({ name: `${timeList[i - 1]}: ${args[i]}`, value: "" });
            temp += `\n${timeList[i - 2]}: ${args[i]}\n`;
        }

        const embd = new MessageEmbed()
        .setTimestamp()
        .setTitle(`${args[0]}`)
        .setDescription(temp)
        .setAuthor(author)

        message.channel.send({ embeds: [embd] }).then((msg) => {
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
    }
}