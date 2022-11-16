const request = require('request');
const fetch = require('node-fetch');
const categoriesJSON = require('./trivia_categories.json').trivia_categories;
const { decode } = require('html-entities');
const { MongoClient, ServerApiVersion } = require('mongodb');
const { Interaction } = require('discord.js');


const categories = new Map();
for (i in categoriesJSON) {
    categories.set(categoriesJSON[i].name, categoriesJSON[i].value);
}
// const { jsonToMapRecursive, mapToTableRecursive } = require('../utils/jsonFormatters.js');


function changeDB(bot, message, m) {
    try {
        bot.mongoconnection.then(client => {
            const dbo = client.db(message.guild.id).collection('trivia');
            //Game Over
            if (m == null) {
                return dbo.deleteOne({ channel: message.channel.id });
            }

            dbo.findOne({ channel: message.channel.id }).then((doc) => {
                if (doc) {
                    dbo.updateOne({ channel: message.channel.id }, {$set: { m: Object.fromEntries(m) }});
                } else{
                    dbo.insertOne({ channel: message.channel.id, m: Object.fromEntries(m) });
                }
            });
            
        });

    } catch (err) {
        console.log(err);
    }
}





/**
 * @param {Interaction} interaction 
 * @param {Map<string, object>} m 
 * @param {int} time 
 */
function startTrivia(interaction, m, time, bot) {
    var iter = m.values().next();
    var obj = iter.value;

    //Get rid of the "answers required" ones
    while (obj.question.toLowerCase().indexOf('which of these') != -1 && obj.question.toLowerCase().indexOf('which of the following') != -1) {
        iter = iter.next();
        obj = iter.value;
    }

    const question = obj.question;
    const answer = obj.answer;

    const filter = (response) => {
        // return item.answers.some(answer => answer.toLowerCase() === response.content.toLowerCase());
        return (response.content.toLowerCase() == answer.toLowerCase());
    };
    
    interaction.channel.send({ content: `${question}\n(Type your answers below!)`, fetchReply: true })
        .then((message) => {
            interaction.reply({content: `Trivia started by ${interaction.user}`});

            const timeList = ['🔟', '9️⃣', '8️⃣', '7️⃣', '6️⃣', '5️⃣', '4️⃣', '3️⃣', '2️⃣', '1️⃣', '0️⃣' ];
            var i = 0;
            const intId = setInterval(() => { if (i < timeList.length) { message.react(timeList[i]); i++ } }, Math.round(time/11));
            //time: 1000 = 1 second
            message.channel.awaitMessages({ filter, max: 10, time: time }) // , errors: ['time']
                .then((collected) => {
                    if (collected.size > 0) {
                        message.reply(`${collected.first().author} got the correct answer (||${answer}||) first!`);
                    } else {
                        message.reply(`Tsk Tsk, looks like nobody got the answer (||${answer}||) this time.`);
                    }

                    // changeDB(bot, message, null);
                    clearInterval(intId);
                })
                .catch((collected) => {
                    console.log(collected);
                    message.reply(`Tsk Tsk, looks like nobody got the answer (||${answer}||) this time.`);
                    // changeDB(bot, message, null);
                    clearInterval(intId);
                });
        });
}


//Add shuffle button?

module.exports = {
    name: 'trivia',
    async execute(interaction, Discord, Client, bot) {
        const opts = interaction.options.data[0].options;
        const args = [];
        args[0] = opts.filter((o) => { return (o.name == 'difficulty'); })[0];
        args[1] = opts.filter((o) => { return (o.name == 'category'); })[0];
        args[2] = opts.filter((o) => { return (o.name == 'time'); })[0];

        const difficult = ['hard', 'medium', 'easy'];
        let inputs = ['easy', ''];

        if (args[0] && difficult.includes(args[0].value.toLowerCase())) {
            inputs[0] = args[0].value.toLowerCase();
        } else if (args[0].value == 'help') {
            let temp = `Use /trivia [difficulty (easy, medium, hard)] [category] [time]\n`;
            temp += '**__Trivia Categories__**\n';
            categories.forEach((val, key) => {
                temp += `_${key}_\n`;
            });
            temp += '_Please copy and paste the FULL NAME if you want to use a category';

            return interaction.reply(temp);
        }

        if (args[1] && Array.from(categories.keys()).includes(args[1].value)) {
            inputs[1] = categories.get(args[1].value);
        }

        // Get all categories mapped to their ids
        // const a = await fetch('https://opentdb.com/api_category.php');
        // const json = await a.json();
        // console.log(json);
        
        var url = `https://opentdb.com/api.php?amount=${3}&difficulty=${inputs[0]}&type=multiple`;
        if (inputs[1] != '') {
            url += `&category=${inputs[1]}`;
        }

        request(url, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                // const m = new Map(body);
                let s = body.replace('{"response_code":0,"results":[', '');
                s = s.substring(0, s.length - 2);
                let queries = s.split('},');

                const m = new Map();
                let i = 0;

                queries.forEach((query, ind) => {
                    query = query.substring(1, s.length - 2);
                    if (query.endsWith('}')) { query = query.substring(0, s.length - 2); }

                    // console.log(decode(query));
                    query = decode(query);

                    if (bot.inDebugMode) {
                        //Get the answer (may have "" in it)
                        // const question = query.substring(query.indexOf('question":') + 10, query.indexOf('","correct_answer'));
                        // console.log(`Q: ${question}\n\nActual: ${query}\n---------------------------------------`);
                    }

                    let q = query.split('","');
                    // queries[ind] = q;
                                        
                    q[5] = q[5].split(':[')[1];

                    let obj = { question: q[3].split(':"')[1], answer: q[4].split(':"')[1], incorrect: [ q[5].replaceAll('"', ''), q[6].replaceAll('"', ''), q[7].replaceAll(']}', '').replaceAll(']', '').replaceAll('"', '') ] }
                    m.set(i, obj);
                    i ++;
                });

                const time = (args[2]) ? args[2].value : (difficult.indexOf(inputs[0]) + 1) * 10000;

                // console.log(m, time);
                // changeDB(bot, message, m);
                startTrivia(interaction, m, time, bot);
            }
        });
    }
}