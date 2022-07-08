/*
-----WEBHOOKS ARE MONITORED AND PROCESSED HERE-----
https://glitch.com/edit/#!/selmer-bot-listener
--------------------------------------------------
*/

const { MongoClient, ServerApiVersion } = require('mongodb');
const { MessageActionRow, MessageSelectMenu } = require('discord.js');


//Called from the dropdown menu
async function createSubscriptionManual(bot, interaction, id, priceID) {
    const stripe = bot.stripe;
    const mongouri = bot.mongouri;

    //Error Checking (unlikely, but just in case)
    if (!id) { console.log('....What? How?'); return interaction.editReply("Uh oh, something happened with the Stripe Discord ID check, please contact support!"); }

    const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    new Promise(async function(resolve, reject) {
        client.connect(async (err) => {
            if (err) { return console.log(err); }

            const dbo = client.db('main').collection('authorized');
            await dbo.findOne({'discordID': id}).then(async (doc) => {
                var userID;

                if (doc != undefined) {
                    client.close();
                    
                    reject(`An account with the tag <@${id}> already exists!`);
                } else {
                    const stripeUser = await stripe.customers.create({
                        metadata: { 'discordID': id }
                    });
                    userID = stripeUser.id;
                    
                    //Add to the database (I have to wait for the insertion)
                    await dbo.insertOne({stripeID: userID, discordID: id, paid: false, startDateUTC: null, tier: 0}).then(() => { client.close(); resolve(userID); });
                }
            });
        });

    }).then(async (userID) => {

        //Deal with the session
        const billingPortalSession = await stripe.billingPortal.sessions.create({
            customer: userID,
            return_url: "https://linktr.ee/selmerbot",
        });
        

        const session = await stripe.checkout.sessions.create(
        {
            payment_method_types: ["card"],
            line_items: [
                {
                    price: priceID,
                    quantity: 1,
                },
            ],
            customer: userID,
            mode: "subscription",
            success_url: billingPortalSession.url,
            cancel_url: "https://linktr.ee/selmerbot"
        });
    
        interaction.editReply(session.url);
    }).catch((err) => { interaction.editReply(err); })
}


async function changeSubscriptionManual(bot, message) {
    const stripe = bot.stripe;
    const mongouri = bot.mongouri;
    const id = message.author.id;

    //Just in case
    if (!id) { return console.log('....What? How?'); }

    const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    new Promise(async function(resolve, reject) {
        client.connect(async (err) => {
            if (err) { return console.log(err); }

            const dbo = client.db('main').collection('authorized');
            await dbo.findOne({'discordID': id}).then(async (doc) => {
                var userID;

                if (doc != undefined) {
                    userID = doc.stripeID;
                    client.close();
                    resolve(userID);
                } else {
                    client.close();

                    reject(`No user with the ID of <@${message.author.id}>`);
                }
            });
        });

    }).then(async (userID) => {
        const session = await stripe.billingPortal.sessions.create({
            customer: userID,
            return_url: "https://linktr.ee/selmerbot",
        });
        message.reply(session.url);
    }).catch((err) => {
        message.reply(err);
    });
}


function createDropDown(bot, message) {  
  const stripe = bot.stripe;

  const pl = [];
  const vl = [];
  stripe.products.list({
    limit: 3,
  }).then((prod) => {
    prod.data.forEach((obj) => {
        const pricePromise = stripe.prices.retrieve(obj.default_price);
        var newObj = {label: obj.name, description: null, value: `${obj.default_price}`}
        pl.push(pricePromise);
        vl.push(newObj);
    });

    let n = Promise.all(pl);
    let i = 0;
    n.then((t) => { 
        t.forEach(data => {
            let price = data.unit_amount/100;
            vl[i].description = `The $${price} tier`;
            i++;
        });


        const row = new MessageActionRow()
        .addComponents(
            new MessageSelectMenu()
                .setCustomId(`${message.author.id}|premium`)
                .setPlaceholder('Nothing selected')
                .addOptions(vl)
        );
    
        message.channel.send({ content: `Please choose a tier`, components: [row] });
    });
  });
}


function handleInp(bot, message) {
    if (message.content == '!premium' || message.content == '!premium help') {
      message.reply('Use _!premium buy_ to get premium or use _!premium manage_ to change or cancel your subscription\n\n_Disclaimer: Selmer Bot uses Stripe to manage payments. Read more at *https://stripe.com/ *_');
    } else if (message.content == '!premium buy') {
      createDropDown(bot, message);
    } else if (message.content == '!premium manage') {
      changeSubscriptionManual(bot, message);
    }
}


module.exports = {
  name: 'premium',
  description: 'everything payment',
  execute(message, args, Discord, Client, bot) {
      message.reply("Please DM Selmer bot to use this command!");
  }, handleInp, createSubscriptionManual
}