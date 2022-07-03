const { MongoClient, ServerApiVersion, ConnectionClosedEvent } = require('mongodb');
const { exit } = require('process');


async function getResponse(convo, bot) {
    const response = await bot.openai.createCompletion({
        model: "text-davinci-002",
        prompt: convo,
        temperature: 0.9,
        max_tokens: 150,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0.6,
        stop: [" Human:", " AI:"],
      });

      return response;
}

async function convoManager(clientinp, bot, message) {
    //Just in case, make sure it can't be changed
    const client = clientinp;
    const dbo = client.db("DM").collection(message.author.id);

    if (message.content.startsWith('!')) {
        if (message.content.split(' ')[0] == '!startconvo') {
            //Check if a conversation already exists
            dbo.find({'_id': {$exists: true}}).toArray((err, docs) => { 
                if (docs[0] != undefined) {
                    return message.reply("You're already in a conversation");
                } else {
                    dbo.insertOne({convo: 'Human: Hello\nAI: Hello'});
                    return message.channel.send('-----Started Conversation-----\nuse _!endconvo_ to end the conversation!\n\n_Disclaimer: Your conversation data is stored for the duration of the conversation to help Selmer Bot better understand what you are saying *then deleted*_\n\n');
                }
            });

        } else if (message.content.split(' ')[0] == '!endconvo') { 
            dbo.drop();
            return message.channel.send('-----Ended Conversation-----\nSee you next time!');
        } else {
            return message.reply('UNUSABLE DM COMMAND DETECTED');
        }
    } else {
        dbo.find({convo: {$exists: true}}).toArray(async function (err, docs) {
            const doc = docs[0];
            if (!doc) { return message.reply('You aren\'t currently in a conversation\nUse _!startconvo_ to start one!'); }

            let convo = doc.convo;
            convo += `\nHuman: ${message.content}\n`;;

            //Get the response
            const r = await getResponse(convo, bot);

            let response = r.data.choices[0].text;

            convo += (response + '\n');

            dbo.updateOne(doc, {$set: {convo: convo}});
            response = response.replaceAll('AI: ', '').replaceAll('AI:\n', '');

            message.reply(response);
        });
    }
}
//"Hello! discord_user:"
module.exports = {
    name: 'chat',
    description: 'chat',
    convoManager,
    execute(message, args, Discord, Client, bot) {
        message.reply("Please DM Selmer bot to use this command!");
    }
}