const { Client, Intents, Permissions } = require('discord.js');
const Discord = require('discord.js');
const { MongoClient, ServerApiVersion } = require('mongodb');
const fs = require('fs');
const { exit } = require('process');
const BASE_LVL_XP = 20;


//Token area
//Adding integration for development mode
let token;
let IDM = false;
if (process.env.token != undefined) {
    //Use "setx NAME VALUE" in the local powershell terminal to set
    token = process.env.token;
} else {
    token = require('./config.json').token;
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
        Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS
    ],
});

const prefix = '!';
bot.prefix = new String;
bot.prefix = prefix;
bot.inDebugMode = IDM;


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
    guild.members.fetch
    guild.roles.create({ name: 'Selmer Bot Mod' });
    
    const role = guild.roles.cache.find((role) => role.name === 'Selmer Bot Mod'); // member.roles.cache.has('role-id-here');
    let owner = guild.members.fetch(guild.ownerID);
    owner.send('Thank you for adding Selmer Bot to your server!\nPlease give people you want to have access to Selmer Bot\'s restricted commands the <@&' + role + '> role.');

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
  bot.commands.set('econ', temp_command);
  temp_command = require('./commands/db/game.js');
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
});


//Button Section
bot.on('interactionCreate', interaction => {
	if (!interaction.isButton()) return;
	console.log(interaction);
});


bot.on('messageCreate', (message) => {

    //COMMAND AREA
    //Check if the prefix exists
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();

    //Check if the user has sufficient permission
    //Performes the command
    //Admin section
    if (command == 'reactionrole') { bot.commands.get(command).execute(message, args, Discord, bot); }

    else if(bot.commands.has(command) && command != 'ECON') {
        //Database access is required, change the inputs
        if (command == 'game' || command == 'accept') {
            bot.commands.get(command).execute(bot, message, args, command, Discord, mongouri, items, xp_collection)
        } else {
            bot.commands.get(command).execute(message, args, Discord, Client, bot);
        }
    }

    //Catch
    else { bot.commands.get('econ').execute(bot, message, args, command, Discord, mongouri, items, xp_collection); }
})

//Look into integrating MySQL into SelmerBot instead of SQLite

//Last Line(s)
// bot.login(token);

bot.login(token);