//#region imports
const { Client, Intents, MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const Discord = require('discord.js');
const { MongoClient, ServerApiVersion } = require('mongodb');
const fs = require('fs');
// const OpenAI = require('openai-api')
const { Configuration, OpenAIApi } = require("openai");
const Stripe = require('stripe');

const turnManager  = require('./commands/turnManager.js');
const { welcome } = require('./commands/admin/welcome.js');
const { handle_interaction } = require('./commands/interactionhandler.js');
const { handle_dm } = require('./commands/dm_handler');
const { devCheck } = require('./commands/dev only/devcheck.js');
const { moderation_handler } = require('./commands/admin/moderation.js');
const { exit } = require('process');
//#endregion

const BASE_LVL_XP = 20;


//#region Token area

//Adding integration for development mode
let token;
let IDM = false;
let home_server;

let MLAIKEY;
let StripeAPIKey;

if (process.env.token != undefined) {
    //Use "setx NAME VALUE" in the local powershell terminal to set
    token = process.env.token;
    home_server = process.env.home_server;
    MLAIKEY = process.env.MLAIKEY;
    StripeAPIKey = process.env.StripeAPIKey;
} else {
    token = require('./config.json').token;
    home_server = require('./config.json').home_server;
    IDM = true;
    MLAIKEY = require('./config.json').MLAIKEY;
    StripeAPIKey = require('./config.json').StripeAPIKey;
}

//#endregion

const bot = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
        Intents.FLAGS.GUILD_PRESENCES,
        Intents.FLAGS.GUILD_MEMBERS,
        Intents.FLAGS.DIRECT_MESSAGES,
        Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGE_TYPING,
    ],
    partials: [ 'CHANNEL' ]
});

const prefix = '!';
bot.prefix = new String;
bot.prefix = prefix;
bot.inDebugMode = IDM;
bot.home_server = home_server;

const configuration = new Configuration({
    apiKey: MLAIKEY,
});
bot.openai = new OpenAIApi(configuration);
bot.temptext = '';
bot.stripe = Stripe(StripeAPIKey);

//The first thing will be an audioPlayer(), the second a queue
bot.audioData = new Map();


//#region MongoDB integration
//Development support
let mongouritemp;
if (process.env.MONGODB_URI) {
    mongouritemp = process.env.MONGODB_URI;
} else {
    mongouritemp = require('./config.json').mongooseURI;
}
const mongouri = mongouritemp;
bot.mongouri = mongouri;
const { connect } = require('mongoose');

//#endregion MongoDB Integration end


//#region set up bot commands

// const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js')); // Obsolete?

bot.commands = new Discord.Collection();
const forbiddenFolders = ['db', 'dev only']; //premium, 

fs.readdirSync('./commands')
  .forEach(dir => {
      if (!forbiddenFolders.includes(dir) && !dir.endsWith('.js')) {
        fs.readdirSync(`./commands/${dir}`)
        .filter(file => file.endsWith('.js'))
        .forEach(file => {
           const command = require(`./commands/${dir}/${file}`);
           if (command.name && command.description) {
                bot.commands.set(command.name.toLowerCase(), command);
           }
        });
      }
  });


//Set these two manually because all the seperate games can't be included in the command list (all managed by the 'game' file)
let temp_command = require("./commands/db/econ.js");
const { STATE } = require('./commands/db/econ.js');
bot.commands.set('econ', temp_command);
temp_command = require('./commands/games/game.js');
bot.commands.set('game', temp_command);

//Everything in the API should be handled by specific handler functions
// const chat = require('./commands/premium/chat.js');
// bot.commands.set('chat', chat);
// const stripeCommands = require('./commands/premium/stripe.js');
// bot.commands.set('premium', stripeCommands);
// const 
// bot.commands.set('RSS', )

//#endregion



//#region bot.[anything] section

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



//Add the bot to a server setup
bot.on("guildCreate", guild => {
    if (guild.roles.cache.find((role) => { return (role.name == 'Selmer Bot Commands'); }) == undefined) {
        guild.roles.create({ name: 'Selmer Bot Commands' });
    }
    

    //const role = guild.roles.cache.find((role) => role.name === 'Selmer Bot Mod'); // member.roles.cache.has('role-id-here');
    const server = bot.guilds.cache.get(guild.id);
    const owner = server.members.fetch(guild.ownerId).then(function(owner) {
        owner.send('Thank you for adding Selmer Bot to your server!\nPlease give people you want to have access to Selmer Bot\'s restricted commands the "_Selmer Bot Commands_" role.');
        owner.send('To help set up Selmer Bot to work better with your server, use _!setup help_ in a channel Selmer Bot is in!');
    });

    //Set up the server
    const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    client.connect(err => {
        if (err) { return console.log(err); }
        
        const dbo = client.db(guild.id).collection('SETUP');
        dbo.insertMany([{_id: 'WELCOME', 'welcomechannel': null, 'welcomemessage': null, 'welcomebanner': null}, {_id: 'LOG', 'keepLogs': false, 'logchannel': null, 'severity': 0}]);
    });

    client.close();
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

    //DM SECTION
    if (message.channel.type === "DM") {
        return handle_dm(message, bot);
    } else if (message.content.indexOf('!spam_collection') != -1) {
        //Handle spam collection/Dev commands
        return devCheck(message, bot);
    }

    //Special case, testing server (still need the emojis)
    if (!bot.inDebugMode && message.guild.id == bot.home_server) { return; }

    //COMMAND AREA
    //Check if the prefix exists
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();

    //Log logable commands then execute them
    const logable = ['kick', 'ban', 'unban', 'mute', 'unmute', 'timeout'];
    if (logable.includes(command)) {
        moderation_handler(bot, message, args, command);
    }

    //Performes the command
    //Admin section
    else if (command == 'reactionrole') { bot.commands.get(command).execute(message, args, Discord, bot); }

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

//#endregion

//Last Line(s)
bot.login(token);