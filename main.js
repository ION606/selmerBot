//#region imports
const { Client, Intents } = require('discord.js');
const Discord = require('discord.js');
const { MongoClient, ServerApiVersion } = require('mongodb');
const fs = require('fs');
// const OpenAI = require('openai-api')
const { Configuration, OpenAIApi } = require("openai");
const Stripe = require('stripe');

const turnManager  = require('./commands/turnManager.js');
const { welcome } = require('./commands/admin/welcome.js');
const { handle_interaction, handleContext } = require('./commands/interactionhandler.js');
const { handle_dm } = require('./commands/dm_handler');
const { devCheck } = require('./commands/dev only/devcheck.js');
const { moderation_handler } = require('./commands/admin/moderation.js');
const { registerCommands } = require('./registerCommands.js');
const { backupLists, loadBotBackups } = require('./commands/dev only/backupBot.js');
const { setPresence } = require('./commands/dev only/setPresence.js');
const { exit } = require('process');
//#endregion

const BASE_LVL_XP = 20;


//#region Token area

//Adding integration for development mode
let token;
let IDM = false;
let home_server;
let debug_channel;

let MLAIKEY;
let StripeAPIKey;
let youtubeAPIKey;

if (process.env.token != undefined) {
    //Use "setx NAME VALUE" in the local powershell terminal to set
    token = process.env.token;
    home_server = process.env.home_server;
    debug_channel = process.env.debug_channel;
    MLAIKEY = process.env.MLAIKEY;
    StripeAPIKey = process.env.StripeAPIKey;
    youtubeAPIKey = process.env.youtubeAPIKey;
} else {
    token = require('./config.json').token;
    home_server = require('./config.json').home_server;
    debug_channel = require('./config.json').debug_channel;

    MLAIKEY = require('./config.json').MLAIKEY;
    StripeAPIKey = require('./config.json').StripeAPIKey;
    youtubeAPIKey = require('./config.json').youtubeAPIKey;

    IDM = true;
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
bot.debug_channel = debug_channel;
bot.inviteLink = 'https://discord.com/oauth2/authorize?client_id=944046902415093760&scope=applications.commands+bot&permissions=549755289087';
bot.youtubeAPIKey = youtubeAPIKey;

const configuration = new Configuration({
    apiKey: MLAIKEY,
});
bot.openai = new OpenAIApi(configuration);
bot.temptext = '';
bot.stripe = Stripe(StripeAPIKey);

//The first thing will be an audioPlayer(), the second a queue
bot.audioData = new Map();

bot.lockedChannels = new Map();

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
const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
bot.mongoconnection = client.connect();

//#endregion MongoDB Integration end


//#region PROCESS STUFF
loadBotBackups(bot, IDM);
process.on("SIGTERM", (signal) => {
    console.log(`Process ${process.pid} received a SIGTERM signal`);
    backupLists(bot, IDM);
    // process.exit(0);
});

process.on("SIGINT", (signal) => {
    console.log(`Process ${process.pid} has been interrupted`);
    backupLists(bot, IDM);
    // process.exit(0);
});

//#endregion


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
    const startTime = new Date().getTime();
    registerCommands(bot).then(() => {
        //Make then copy the shop
        bot.mongoconnection.then(client => {
            const shop = client.db("main").collection("shop");
            shop.find().toArray(function(err, itemstemp) {
                if (err) throw err;

                items = [...itemstemp];
            });


            bot.user.setStatus('online');
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
    }).catch((err) => {
        console.log(err);
    }).finally(() => { console.log(`Setting up Slash Commands took ${(new Date().getTime() - startTime) / 1000} seconds to complete!`); });
}); 


//Button Section
bot.on('interactionCreate', async interaction => {
    const { commandName } = interaction;

    // console.log(bot.lockedChannels);
    //Slash commands
    if (interaction.isApplicationCommand()) {

        if (interaction.isUserContextMenu()) {
            return handleContext(bot, interaction.options.data[0]);
        }

        const logable = ['kick', 'ban', 'unban', 'mute', 'unmute', 'timeout'];
        const econList = ["buy", 'shop', 'work', 'rank', 'inventory', 'balance', 'sell'];
        const adminList = ["setpresence", "setactivity"];

        if (commandName == "admin" && adminList.includes(interaction.options.data[0].name)) {
            if (interaction.user.id == bot.guilds.cache.get(bot.home_server).ownerId) {
                setPresence(bot, interaction);
            } else {
                return interaction.reply({ content: "HAHAHAHAHAHAHAHAHAHAHA\n\nno.", ephemeral: true }).catch((err) => {
                    interaction.channel.send({ content: "HAHAHAHAHAHAHAHAHAHAHA\n\nno.", ephemeral: true });
                });
            }
        } else if (logable.includes(commandName)) {
            moderation_handler(bot, interaction, commandName);
        } else if (econList.includes(commandName)) {
            bot.commands.get('econ').execute(bot, interaction, Discord, mongouri, items, xp_collection);
        } else if (commandName == 'game') {
            return console.log(interaction);
            bot.commands.get(bot, interaction, command, Discord, mongouri, items, xp_collection)
        } else if (bot.commands.has(commandName)) {
            bot.commands.get(commandName).execute(interaction, Discord, Client, bot);
        } else {
            interaction.reply("Unknown command detected!");
        }
    } else {
        handle_interaction(interaction, mongouri, turnManager, bot, STATE, items, xp_collection);
    }
});



//Add the bot to a server setup
bot.on("guildCreate", guild => {
    if (guild.roles.cache.find((role) => { return (role.name == 'Selmer Bot Commands'); }) == undefined) {
        guild.roles.create({ name: 'Selmer Bot Commands' });
    }
    
    if (guild.roles.cache.find((role) => { return (role.name == 'Selmer Bot Calendar'); }) == undefined) {
        guild.roles.create({ name: 'Selmer Bot Calendar' });
    }
    

    //const role = guild.roles.cache.find((role) => role.name === 'Selmer Bot Mod'); // member.roles.cache.has('role-id-here');
    const server = bot.guilds.cache.get(guild.id);
    server.members.fetch(guild.ownerId).then(function(owner) {
        owner.send('Thank you for adding Selmer Bot to your server!\nPlease give people you want to have access to Selmer Bot\'s restricted commands the "_Selmer Bot Commands_" role and people you want to access set the calendar the "_Selmer Bot Calendar_" role');
        owner.send('To help set up Selmer Bot to work better with your server, use _/setup help_ in a channel Selmer Bot is in!');
    });

    //Set up the server
    bot.mongoconnection.then(client => {
        
        const dbo = client.db(guild.id).collection('SETUP');
        dbo.insertMany([{_id: 'WELCOME', 'welcomechannel': null, 'welcomemessage': null, 'welcomebanner': null}, {_id: 'LOG', 'keepLogs': false, 'logchannel': null, 'severity': 0}, {_id: 'announcement', channel: null, role: null}]);
    });
});


bot.on("guildDelete", guild => {
    bot.mongoconnection.then((client) => {
        //Insufficient Permission????
        // db.dropDatabase();

        try {
            const db = client.db(guild.id);
            db.listCollections().forEach(function(x) { db.collection(x.name).drop(); });

            var times;
            const dbo = client.db('main').collection('reminderKeys');

            //ReminderKeys are all stored as userId, the reminders themselves are not
            dbo.findOne({userId: guild.id}).then((doc) => {
                if (!doc || !doc.times) { return; }

                times = doc.times;
                const tbo = client.db('main').collection('reminders');
                
                tbo.find({time: {$in: times}}).toArray((err, docs) => {
                        try {
                        for (let i = 0; i < docs.length; i ++) {
                            for (let j in docs[i]) {
                                if (!isNaN(j) && (docs[i][j].guildId == guild.id)) {
                                    delete docs[i][j];
                                    docs[i].amt --;
                                }
                            }

                            if (docs.amt > 0) {
                                tbo.replaceOne({ time: docs[i].time }, docs[i]);
                            } else {
                                tbo.deleteOne({ time: docs[i].time });
                            }
                        }
                    } catch (err) {
                        console.error(err);
                    }
                });
            });

            dbo.deleteOne({ userId: guild.id });
        } catch (err) {
            console.error(err);
        }
    })
});



//Welcome new members
bot.on('guildMemberAdd', async (member) => {
    if (member.guild.id == bot.home_server && !bot.inDebugMode) { return; }

    //Check for impartial data
    if (member.partial) { member = await member.fetch(); }

    const guild = bot.guilds.cache.get(member.guild.id);

    bot.mongoconnection.then(client => {
        const dbo = client.db(member.guild.id).collection('SETUP');

        dbo.find({_id: 'WELCOME'}).toArray(async (err, docs) => {
            if (!docs) { return; }

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
    } else if (message.type === "CHANNEL_PINNED_MESSAGE") {
        //Debug log stuff
        if (message.guild.id == bot.home_server && message.channel.id == bot.debug_channel) {
            message.delete();
        }
    }

    //Special case, testing server (still need the emojis and error logging)
    if (!bot.inDebugMode && message.guild.id == bot.home_server) { return; }

    //Check if the prefix exists
    if (!message.content.startsWith(prefix) || message.author.bot) {
        //Use for the leveling-by-interaction system
        return;
    } else {
        //Game section (too complicated to move to Slash Commands)
        //Note: Slash commands do not register as valid replies
        const args = message.content.slice(prefix.length).split(' ');
        const command = args.shift().toLowerCase();
        if (command == 'game' || command == 'accept') {
            bot.commands.get(command).execute(bot, message, args, command, Discord, mongouri, items, xp_collection);
        } else if (command == 'rss' && bot.inDebugMode) {
            const rss = require('./side projects/RSSHandlers/rssFeed.js');
            rss.execute(message, args, Discord, client, bot);
        }
    }
});

//#endregion

//Last Line(s)
bot.login(token);
