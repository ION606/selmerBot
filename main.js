const { Client, Intents, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const Discord = require('discord.js');
const { MongoClient, ServerApiVersion } = require('mongodb');
const fs = require('fs');
const turnManager  = require('./commands/turnManager.js');
const { welcome } = require('./commands/admin/welcome.js');
const { handle_interaction } = require('./commands/interactionhandler.js');
const { exit } = require('process');
const BASE_LVL_XP = 20;


//Token area
//Adding integration for development mode
let token;
let IDM = false;
let home_server;
if (process.env.token != undefined) {
    //Use "setx NAME VALUE" in the local powershell terminal to set
    token = process.env.token;
    home_server = process.env.home_server;
} else {
    token = require('./config.json').token;
    home_server = require('./config.json').home_server;
    IDM = true;
}

// const { token } = require('./config.json');
//Heroku part
// const { token } = process.env.token;

const bot = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MEMBERS
    ],
});

const prefix = '!';
bot.prefix = new String;
bot.prefix = prefix;
bot.inDebugMode = IDM;
bot.home_server = home_server;


//MongoDB integration
//Development support
let mongouritemp;
if (process.env.MONGODB_URI) {
    mongouritemp = process.env.MONGODB_URI;
} else {
    mongouritemp = require('./config.json');
}
const mongouri = mongouritemp;
const { connect } = require('mongoose');

bot.on("guildCreate", guild => {
    guild.roles.create({ name: 'Selmer Bot Mod' });

    //const role = guild.roles.cache.find((role) => role.name === 'Selmer Bot Mod'); // member.roles.cache.has('role-id-here');
    const server = bot.guilds.cache.get(guild.id);
    const owner = server.members.fetch(guild.ownerId).then(function(owner) {
        owner.send('Thank you for adding Selmer Bot to your server!\nPlease give people you want to have access to Selmer Bot\'s restricted commands the "_Selmer Bot Mod_" role.');
        owner.send('To help set up Selmer Bot to work better with your server, use _!setup help_ in a channel Selmer Bot is in!');
    });

    //Set up the server
    const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    client.connect(err => {
        if (err) { return console.log(err); }
        
        const dbo = client.db(guild.id).collection('SETUP');
        dbo.insertMany([{_id: 'WELCOME', 'welcomechannel': null, 'welcomemessage': null, 'welcomebanner': null}]);
    });

    client.close();
});


//MongoDB Integration end
// let item = items.filter(function (item) { return item.name.toLowerCase() == 'grapes'; });

bot.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));


bot.commands = new Discord.Collection();
fs.readdirSync('./commands')
  .forEach(dir => {
      if (dir != 'db' && !dir.endsWith('.js')) {
        fs.readdirSync(`./commands/${dir}`)
        .filter(file => file.endsWith('.js'))
        .forEach(file => {
           const command = require(`./commands/${dir}/${file}`);
           bot.commands.set(command.name, command);
        });
      }
  });


  //Set these two manually because all the seperate games can't be included in the command list (all managed by the 'game' file)
let temp_command = require("./commands/db/econ.js");
const { STATE } = require('./commands/db/econ.js');
bot.commands.set('econ', temp_command);
temp_command = require('./commands/games/game.js');
bot.commands.set('game', temp_command);

// const econFiles = fs.readdirSync('./commands/inventory').filter(file => file.endsWith('.js'));;
// const currency = new Discord.Collection();
// const { Users } = require('./commands/currency/dbObjects.js');
// i++;

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

        //Srt status and Activity (idle and listening to !help)
        bot.user.setActivity(`${bot.prefix}help`, { type: "LISTENING" });
        // bot.user.setStatus('idle');
    });

    //Note the xp numbers are a little wonky on levels 6, 8 and 13 (why though?)
    //See https://stackoverflow.com/questions/72212928/why-are-the-differences-between-my-numbers-inconsistent-sort-of-compund-interes
    for (let i = 1; i < 101; i ++) {
        // xp_collection.set(i, BASE_LVL_XP * .1);
        let amount = BASE_LVL_XP * (Math.ceil(Math.pow((1.1), (2 * i))) + i);
        xp_collection.set(i+1, amount);
    }


    //Reaction map area
    if (!bot.inDebugMode) {
        console.log('SLEEMER BOT ONLINE!!!!! OH MY GOD OH MY GOD!!!');
    } else {
        console.log("Testing testing 1 2 5...");
    }


    //Add the money symbol
    let srv = bot.guilds.cache.get(bot.home_server).emojis.cache;
    emj = srv.find((g) => { return g.name == 'selmer_coin' });
    bot.currencysymbolmmain = `${emj}`;
});


//Button Section
bot.on('interactionCreate', async interaction => {
    handle_interaction(interaction, mongouri, turnManager, bot, STATE, items, xp_collection);
});


//Welcome new members
bot.on('guildMemberAdd', async (member) => {
    //Check for impartial data
    if(member.partial) await member.fetch();

    const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

    const guild = bot.guilds.cache.get(member.guild.id);

    client.connect(err => {
        const dbo = client.db(member.guild.id).collection('SETUP');

        dbo.find({_id: 'WELCOME'}).toArray(async (err, docs) => {
            var welcomechannel;
            if (docs[0].welcomechannel == null) {
                welcomechannel = guild.channels.cache.find(channel => channel.name.toLowerCase() === 'welcome');
            } else {
                welcomechannel = guild.channels.cache.get(docs[0].welcomechannel)
            }

            if (welcomechannel == null) {
                return console.log('No welcome channel detected');
            }

            await welcome(member, welcomechannel, docs[0].welcomemessage);
        })
    })
});


bot.on('messageCreate', (message) => {

    //Special case, testing server (still need the emojis)
    if (!bot.inDebugMode && message.guild.id == bot.home_server) { return; }

    //COMMAND AREA
    //Check if the prefix exists
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();


    //Performes the command
    //Admin section
    if (command == 'reactionrole') { bot.commands.get(command).execute(message, args, Discord, bot); }

    else if(bot.commands.has(command) && command != 'ECON') {
        //Database access is required, change the inputs
        if (command == 'game' || command == 'accept' || command == 'setup') {
            bot.commands.get(command).execute(bot, message, args, command, Discord, mongouri, items, xp_collection);
        } else {
            bot.commands.get(command).execute(message, args, Discord, Client, bot);
        }
    }

    //Econ and also the catch statement
    else { bot.commands.get('econ').execute(bot, message, args, command, Discord, mongouri, items, xp_collection); }
})

//Look into integrating MySQL into SelmerBot instead of SQLite

//Last Line(s)
// bot.login(token);

bot.login(token);