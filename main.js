const { Client, Intents } = require('discord.js');
const Discord = require('discord.js');
const { MongoClient, ServerApiVersion } = require('mongodb');
const fs = require('fs');
const { exit } = require('process');
const BASE_LVL_XP = 20;

// const { token } = require('./config.json');
//Heroku part
const { token } = process.env.token;

const bot = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES
    ],
});

const prefix = '/';


//MongoDB integration
const mongouri = process.env.MONGODB_URI;
const GuildModel = require('./commands/inventory/models/guild');
const { connect } = require('mongoose');


bot.on("guildCreate", guild => {
    // guild.owner.send('Thanks! You can use +help to discover commands.')

    //Get total inventory
    const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    client.connect(err => {
      const collection = client.db(guild).collection("shop");
      // perform actions on the collection object
      console.log(guild);
      client.close();
    });
});

//MongoDB Integration end
// let item = items.filter(function (item) { return item.name.toLowerCase() == 'grapes'; });

bot.commands = new Discord.Collection();

bot.commNames = new Discord.Collection();

bot.econ = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));



let i = 0;
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    bot.commands.set(command.name, command);
    bot.commNames.set(i, [command.name, command.description]);
    i ++;
}

// const econFiles = fs.readdirSync('./commands/inventory').filter(file => file.endsWith('.js'));;
// ECON SECTION
bot.commands.set('ECON', require(`./commands/inventory/models/app`));
// const currency = new Discord.Collection();
// const { Users } = require('./commands/currency/dbObjects.js');
// i++;

bot.commNames.set('length', i);

//XP Table section
let xp_collection = new Map();
let items;

bot.on('ready', async () => {
    //Make then copy the shop
    const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
        client.connect(err => {
        const shop = client.db("main").collection("shop");
        shop.find().toArray(function(err, itemstemp) {
            if (err) throw err;

            items = [...itemstemp];
            
            client.close();
        });
        
    });

    //XP section (start at 2 bc you're already at lvl 1)
    //Note the xp numbers are a little wonky on levels 6, 8 and 13 (why though?)
    //See https://stackoverflow.com/questions/72212928/why-are-the-differences-between-my-numbers-inconsistent-sort-of-compund-interes
    for (let i = 1; i < 101; i ++) {
        // xp_collection.set(i, BASE_LVL_XP * .1);
        let amount = BASE_LVL_XP * (Math.ceil(Math.pow((1.1), (2 * i))) + i);
        xp_collection.set(i+1, amount);
    }

    console.log('SLEEMER BOT ONLINE!!!!! OH MY GOD OH MY GOD!!!');
});


bot.on('messageCreate', (message) => {
    //COMMAND AREA
    //Check if the prefix exists
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();

    //Check if the user has sufficient permission
    //Performes the command
    switch(command) {
        case 'test': bot.commands.get('Hello World').execute(message, args);
        break;

        case 'profile': bot.commands.get('profile').execute(message, args, Discord);
        break;

        case 'links': bot.commands.get('links').execute(message, args, Discord);
        break;

        case 'arrow': bot.commands.get('arrow').execute(message, args, Discord);
        break;

        case 'audio': bot.commands.get('playaudio').execute(message, args, bot, Discord);
        break;
        
        case 'quotes': bot.commands.get('quotes').execute(message, args, Discord, Client);
        break;

        case 'extracredit': bot.commands.get('EC').execute(message);
        break;

        case 'scrape': bot.commands.get('scraper').execute(message, args);
        break;

        case 'kareoke': bot.commands.get('kareoke').execute(message, args);
        break;

        default: bot.commands.get('ECON').execute(bot, message, args, command, Discord, mongouri, items, xp_collection);
        //Removed because Heroku doesn't work with sqlite
        //default: bot.commands.get('ECON').execute(bot, prefix, message, args, command, Users, currency);
    }
})

//Look into integrating MySQL into SelmerBot instead of SQLite

//Last Line(s)
bot.login(token);

// bot.login(process.env.token);