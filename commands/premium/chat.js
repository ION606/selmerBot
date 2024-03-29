const { MongoClient, ServerApiVersion, ConnectionClosedEvent } = require('mongodb');
const { exit } = require('process');
const { checkResponses } = require('./wordlist.js');


//Error checking function (message deleted error fix, workaround already applied but...)
//message.channel.send("Oops, there's been an error, please contact support!");
async function messageExists(message) {
    return new Promise((resolve, reject) => {
        try {
            message.channel.messages.fetch(message.id)
            .then((fetchedMessage) => {
                resolve(true);
            })
            .catch((err) => {
                console.log(err);
                resolve(false);
            })
        } catch (err) { resolve(false); }

        resolve(true);
    });
}


async function getResponse(convo, bot) {
    try {
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
    } catch (err) {
        console.error(err);
        return false;
    }
    
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
                    return message.channel.send("You're already in a conversation");
                } else {
                    dbo.insertOne({convo: 'Human: Hello\nAI: Hello'});
                    return message.channel.send('-----Started Conversation-----\nuse _!endconvo_ to end the conversation!\n\n_Disclaimer: Your conversation data is stored for the duration of the conversation to help Selmer Bot better understand what you are saying *then deleted*_\n\n');
                }
            });

        } else if (message.content.split(' ')[0] == '!endconvo') { 
            dbo.drop();
            return message.channel.send('-----Ended Conversation-----\nSee you next time!');
        } else {
            return message.channel.send('UNUSABLE DM COMMAND DETECTED');
        }
    } else {
        dbo.find({convo: {$exists: true}}).toArray(async function (err, docs) {
            const doc = docs[0];
            if (!doc) { return message.reply('You aren\'t currently in a conversation\nUse _!startconvo_ to start one!'); }

            //Checking Section
            const check = checkResponses(message.content, "I'm sorry, I can't do that");
            if (check != null) { return message.reply(check); }


            let convo = doc.convo;
            convo += `\nHuman: ${message.content}\n`;;

            //Get the response
            const r = await getResponse(convo, bot);

            if (!r) {
                return message.channel.send("Uh oh! There's been an error! Please contact support \:[");
            }

            let response = r.data.choices[0].text;

            convo += (response + '\n');

            dbo.updateOne(doc, {$set: {convo: convo}});
            response = response.replaceAll('AI: ', '').replaceAll('AI:\n', '');

            //Very buggy so I'm adding this for now
            message.channel.send(response);

            //Note: Work with the following later
            /* messageExists(message).then((e) => {
                console.log(e);
                if (e) { return message.reply(response); }
                message.channel.send(response);
            }) */
        });
    }
}

//"Hello! discord_user:"
module.exports = {
    name: 'chat',
    description: 'chat',
    convoManager,
    execute(interaction, args, Discord, Client, bot) {
        interaction.reply("Please DM Selmer bot to use this command!");
    }
}