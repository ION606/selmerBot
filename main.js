const { Client, Intents } = require('discord.js');
const Discord = require('discord.js');
// const { token } = require('./config.json');
//Heroku part
// const { token } = process.env.token;

const bot = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.GUILD_VOICE_STATES
    ],
});

const prefix = '/';


const fs = require('fs');
const { exit } = require('process');
bot.commands = new Discord.Collection();

bot.commNames = new Discord.Collection();

bot.econ = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));

const econFiles = fs.readdirSync('./commands/currency').filter(file => file.endsWith('.js'));;

let i = 0;
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    bot.commands.set(command.name, command);
    bot.commNames.set(i, [command.name, command.description]);
    i ++;
}

// ECON SECTION
// bot.commands.set('ECON', require(`./commands/currency/app.js`));
// const currency = new Discord.Collection();
// const { Users } = require('./commands/currency/dbObjects.js');
// i++;

bot.commNames.set('length', i);


bot.on('ready', async () => {
    // bot.once('ready', async () => {
        // Another Econ Section
        // const storedBalances = await Users.findAll();
        // storedBalances.forEach(b => currency.set(b.user_id, b));

        // console.log(`Logged in as ${bot.user.tag}!`);
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

        case 'playaudio': bot.commands.get('playaudio').execute(message, args, bot, Discord);
        break;
        
        case 'quotes': bot.commands.get('quotes').execute(message, args, Discord, Client);
        break;

        case 'extracredit': bot.commands.get('EC').execute(message);
        break;

        case 'scrape': bot.commands.get('scraper').execute(message, args);
        break;

        case 'kareoke': bot.commands.get('kareoke').execute(message, args);
        break;

        default: message.channel.send("'" + message.content + "' is not a command!");
        //Removed because Heroku doesn't work with sqlite
        //default: bot.commands.get('ECON').execute(bot, prefix, message, args, command, Users, currency);
    }
})



//Last Line
bot.login("OTQ0MDQ2OTAyNDE1MDkzNzYw.Yg76MQ.A4V6Tqvrhuvq8nCafABCBrx8uuM");