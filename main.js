const { Client, Intents } = require('discord.js');
const Discord = require('discord.js');
const { token } = require('./config.json');

const client = new Client({ 
    intents: [
        Intents.FLAGS.GUILDS,
        Intents.FLAGS.GUILD_MESSAGES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS
    ],
});

const prefix = '/';


const fs = require('fs');
const { exit } = require('process');
client.commands = new Discord.Collection();

client.commNames = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands/').filter(file => file.endsWith('.js'));

let i = 0;
for (const file of commandFiles) {
    const command = require(`./commands/${file}`);

    client.commands.set(command.name, command);
    client.commNames.set(i, [command.name, command.description]);
    i ++;
}


client.commNames.set('length', i);


client.on('ready', () => {
    console.log('SLEEMER BOT ONLINE!!!!! OH MY GOD OH MY GOD!!!');
});


client.on('messageCreate', (message) => {
    
    //COMMAND AREA
    //Check if the prefix exists
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    
    const args = message.content.slice(prefix.length).split(' ');
    const command = args.shift().toLowerCase();
    

    //Check if the user has sufficient permission
    //Performes the command
    switch(command) {
        case 'test': client.commands.get('Hello World').execute(message, args);
        break;

        case 'profile': client.commands.get('profile').execute(message, args, Discord);
        break;

        case 'links': client.commands.get('links').execute(message, args, Discord);
        break;

        case 'arrow': client.commands.get('arrow').execute(message, args, Discord);
        break;

        //case 'playaudio': client.commands.get('playaudio').execute(message, args, client, Discord);
        //break;
        case 'quotes': client.commands.get('quotes').execute(message, args, Discord, Client);
        break;

        case 'extracredit': client.commands.get('EC').execute(message);
        break;

        default: message.channel.send("'" + message.content + "' is not a command!");
    }
})



//Last Line
client.login(token);