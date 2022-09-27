/*
-----WEBHOOKS ARE MONITORED AND PROCESSED HERE-----
https://selmer-bot-listener.ion606.repl.co
--------------------------------------------------
*/
//@ts-check

const { MongoClient, ServerApiVersion } = require('mongodb');
const { MessageActionRow, MessageSelectMenu, Constants } = require('discord.js');
const { addComplaintButton } = require('../dev only/submitcomplaint');


//Called from the dropdown menu
async function createSubscriptionManual(bot, interaction, id, priceID) {
    const stripe = bot.stripe;
    const mongouri = bot.mongouri;

    //Error Checking (unlikely, but just in case)
    if (!id) { console.log('....What? How?'); return interaction.editReply("Uh oh, something happened with the Stripe Discord ID check, please contact support!"); }

    // const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    new Promise(async function(resolve, reject) {
        bot.mongoconnection.then(async (client) => {
            // if (err) { return console.log(err); }

            const dbo = client.db('main').collection('authorized');
            await dbo.findOne({'discordID': id}).then(async (doc) => {
                var userID;

                if (doc != undefined) {
                    // client.close();
                    
                    reject(`An account with the tag <@${id}> already exists!`);
                } else {
                    const stripeUser = await stripe.customers.create({
                        metadata: { 'discordID': id }
                    });
                    userID = stripeUser.id;
                    
                    //Add to the database (I have to wait for the insertion)
                    await dbo.insertOne({stripeID: userID, discordID: id, paid: false, startDateUTC: null, tier: 0}).then(() => { /*client.close();*/ resolve(userID); });
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
    }).catch((err) => { 
        if (String(typeof(err)) == 'string') {
            interaction.editReply(err);
        } else {
            console.log(err);
            interaction.editReply("A Stripe error occured! Please click the ✅ to report this ASAP!");
            addComplaintButton(bot, interaction.message);
        }
     });
}


async function changeSubscriptionManual(bot, interaction) {
    const stripe = bot.stripe;
    const mongouri = bot.mongouri;
    const id = interaction.user.id;

    //Just in case
    if (!id) { return console.log('....What? How?'); }

    // const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    new Promise(async function(resolve, reject) {
        bot.mongoconnection.then(async (client) => {
            // if (err) { return console.log(err); }

            const dbo = client.db('main').collection('authorized');
            await dbo.findOne({'discordID': id}).then(async (doc) => {
                var userID;

                if (doc != undefined) {
                    userID = doc.stripeID;
                    // client.close();
                    resolve(userID);
                } else {
                    // client.close();
                    reject(`No user with the ID of <@${interaction.user.id}>`);
                }
            });
        });

    }).then(async (userID) => {
        await stripe.billingPortal.sessions.create({
            customer: userID,
            return_url: "https://linktr.ee/selmerbot",
        }).then((session) => {
            interaction.reply(session.url);
        })
    }).catch((err) => {

        if (String(typeof(err)) == 'string') {
            interaction.reply(err);
        } else {
            console.log(err);
            interaction.reply("A Stripe error occured! Please click the ✅ to report this ASAP!");
            addComplaintButton(bot, interaction.message); //?????????
        }
    });
}


function createDropDown(bot, interaction) {  
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
                .setCustomId(`${interaction.user.id}|premium`)
                .setPlaceholder('Nothing selected')
                .addOptions(vl)
        );
    
        interaction.reply({ content: `Please choose a tier`, components: [row], ephemeral: true });
    });
  });
}


function handleInp(bot, interaction) {
    const inp = interaction.options.data[0];
    if (!inp || inp.value == 'help') {
      interaction.reply({content: 'Use _!premium buy_ to get premium or use _!premium manage_ to change or cancel your subscription\n\n_Disclaimer: Selmer Bot uses Stripe to manage payments. Read more at *https://stripe.com/ *_', ephemeral: true});
    } else if (inp.value == 'buy') {
      createDropDown(bot, interaction);
    } else if (inp.value == 'manage') {
      changeSubscriptionManual(bot, interaction);
    }
}


module.exports = {
  name: 'premium',
  description: 'everything payment',
  execute(interaction, Discord, Client, bot) {
      handleInp(bot, interaction);
  }, handleInp, createSubscriptionManual,
  options: [{name: 'input', description: 'What do you want to do?', type: Constants.ApplicationCommandOptionTypes.STRING, required: true, choices: [{name: 'help', value: 'help'}, {name: 'buy', value: 'buy'}, {name: 'manage', value: 'manage'}]}],
  isDM: true
}