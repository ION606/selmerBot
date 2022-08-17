const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, CommandInteractionOptionResolver } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
var FeedParser = require('feedparser');
const fetch = require('node-fetch');
const { VoiceConnectionStatus, AudioPlayerStatus, createAudioPlayer, StreamType,  joinVoiceChannel, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const play = require('play-dl');
const { addComplaintButton } = require('../dev only/submitcomplaint');

const hastebin = require("hastebin-gen");
const { simpleCast } = require('./simplecast.js')

let Parser = require('rss-parser');
let parser = new Parser();
const allFeedsJSON = require('./feeds.json');




/**
 * @param {JSON} inp 
 * @returns {Map<String, Map>}
 */
function jsonToMapRecursive(inp) {
    if (typeof(inp) != 'object') {
        return inp;
    }
    
    let m2 = new Map();
    Object.entries(inp).forEach((key) => { m2.set(key[0], jsonToMapRecursive(inp[key[0]])); });
    return m2;
}

const allFeeds = jsonToMapRecursive(allFeedsJSON);


function mapToTable(inp, layer) {
    var temp = '';

    if (typeof(inp) != 'object') {
        // return `?[${inp}]`;
        return '';
    }

    Array.from(inp.keys()).forEach((key) => {
        var keyTemp = ('|     ').repeat(layer);
        temp += `${keyTemp}- - ${key}\n`.replaceAll('     - -', '- -');
        temp += mapToTable(inp.get(key), layer + 1);
    });

    temp += ('|     ').repeat(layer - 1) + '\n';

    if (layer == 1) {
        var links = new Array();

        //Post-processing
        var l = temp.split('\n')

        l = l.filter((entry, ind) => {
            return entry.trim() == '|' || !((/[^A-Za-z0-9 ]+$/).test(entry.trim()) && (/[^A-Za-z0-9 ]+$/).test(l[ind + 1].trim()));
        });

        temp = l.join('\n')

        //Get the links
        Array.from(inp.keys()).forEach((key) => {
            links.push(key);
        });

        return [temp, links];
    }

    return temp;
}


/**
 * 
 * @param {simpleCast} obj 
 * @returns 
 */
function playAudio(bot, message, user, obj) {
    const member = message.guild.members.cache.get(user.id);
    if (!member.voice.channel) {
        message.reply("Please join a voice channel before you try this!");
        return;
    }
    const channel =  bot.channels.cache.get(member.voice.channel.id);
    
    const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
    });

    
    const resource = createAudioResource(obj.audioLink /*, { inlineVolume: true }*/ );

    const data = bot.audioData.get(message.channel.guild.id);
    if (data && data[1]) {
        return message.reply("No podcast queue support yet!");
    }
    const player = createAudioPlayer();
    connection.subscribe(player);
    bot.audioData.set(message.guild.id, [player, new Array(), null]);
    player.play(resource);

    //Create the embed
    const newEmbed = new MessageEmbed()
        .setColor('#0F00F0')
        .setTitle(`${obj.title}`)
        .setAuthor({ name: "Selmer Bot", url: "", iconURL: bot.user.displayAvatarURL() })
        .setDescription('IS NOW PLAYING')
        .setURL(obj.url)
        .setThumbnail(obj.thumbnal);
    
    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('PAUSE')
                .setLabel('⏸️')
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('STOP')
                .setLabel('⏹️')
                .setStyle('SECONDARY'),
            // new MessageButton()
            //     .setCustomId('SKIP')
            //     .setLabel('⏭️')
            //     .setStyle('SECONDARY')
        );
    console.log(obj.audioLink);
    const m = message.reply({ embeds: [newEmbed], components: [row] });
}



async function getAndFormatRSS(bot, message, user, inp) {

    var req = fetch(inp)
    const feedparser = new FeedParser();
    
    req.then(function (res) {
        
      if (res.status !== 200) {
        throw new Error('Bad status code');
      }
      else {
        // The response `body` -- res.body -- is a stream
        res.body.pipe(feedparser);
      }
    }, function (err) {
      // handle any request errors
    });
    
    feedparser.on('error', function (error) {
      // always handle errors
      addComplaintButton(bot, message);
      console.log(error);
    });
    
    const items = new Array();
    feedparser.on('readable', async function () {
        // This is where the action is!
        var stream = this; // `this` is `feedparser`, which is a stream
        var meta = this.meta; // **NOTE** the "meta" is always available in the context of the feedparser instance
        var item;
        
        let i = 0;
        while (item = stream.read()) {
            items.push(item);
            i ++;
            if (i >= 100) { break; }
        }
    })
    
    feedparser.addListener('end', () => {
        const item = items[Math.round(Math.random() * items.length)];

        if (inp.indexOf('simplecast') != -1) {
            var s = new simpleCast(item, inp);
            s.audioLink = 'https://download.samplelib.com/mp3/sample-15s.mp3';
            playAudio(bot, message, user, s);
        }
    });
    
    return;
    //Get the feed
    const feed = await parser.parseURL(inp);
    // const items = feed.items;
    const item = items[Math.round(Math.random() * items.length)];

    var url;
    try {
        url = item.link || item.guid;
        axios(url).then(async response => {
            const html = response.data;
            const $ = cheerio.load(html);
            // console.log(html);
            const haste = await hastebin(html, { extension: "txt" });
            console.log(url, '\n', haste);
        })
    } catch (err) {
        console.log(err);
        return console.log(item);
    }
    
    //   const newEmbed = new MessageEmbed()
    //     .setTitle(feed.title)
    //     .setAuthor({ name: "Selmer Bot", url: "", iconURL: bot.user.displayAvatarURL() })
    //     .setTimestamp()

    // console.log(feed.items);

    /*
    creator?: 'Ben Casselman and Jeanna Smialek',
    title: 'Income and Spending Rose Less Than Prices in May',
    link: 'https://www.nytimes.com/2022/06/30/business/economy/income-spending-may.html',
    */

}


function presentFeeds(bot, message, commands, interaction) {

    var r;
    var url;
    if (commands[0] == 'all') {
        r = mapToTable(allFeeds, 1);
    } else {
        var r2 = allFeeds.get(commands[0]);
        // commands = commands.slice(1);
        commands.slice(1).forEach((key) => {
            r2 = r2.get(key);
        });


        r = mapToTable(r2, 1);

        if(!r[1]) { url = r2; }

        //Array.from(r2.keys())
    }

    //Check if we have a feed (no more paths)
    if (!r[1]) {
        // console.log("Commands:", commands, "\nR: ", r); throw 1;
        let path = ''
        commands.forEach((com) => { path += `${com} --> `});
        path = path.slice(0, path.length - 5);

        interaction.update({ content: `You have chosen ${path}!`, components: []});

        return getAndFormatRSS(bot, interaction.message, interaction.user, url);
    }

    var keyList = new Array();
    r[1].forEach((key) => {
        const listEntry = {
            label: `${key}`,
            description: `Choose a feed from this category!`,
            value: `${key}`,
        }

        keyList.push(listEntry);
    });

    const row = new MessageActionRow()
        .setComponents(
            new MessageSelectMenu()
            .setCustomId(`RSS|${commands.join('|')}`)
            .setPlaceholder('Nothing selected')
            .addOptions(keyList)
        )

    if (interaction) { return interaction.update({content: r[0], components: [ row ]}); }
    message.reply({ content: r[0], components: [ row ] });

     /*else if (commands[0].length = 1) {
        const data = allFeeds.get(commands[0]).get(commands[1]).get(commands[2]);
        interaction.update({ content: `You have chosen ${commands[1]} from the ${commands[0]} section!`, components: []});
        return getAndFormatRSS(bot, interaction.message, data);
    }*/
}



function RSSInteractionHandler(bot, interaction) {
    let commands = interaction.values[0].split('|');
    let temp = interaction.customId.split('|').slice(1);
    if (temp[0] != 'all') { commands = temp.concat(commands); }
    // console.log(interaction.customId, interaction.values);

    presentFeeds(bot, null, commands, interaction);
}



// getAndFormatRSS(null, null, imp[0]);

// presentFeeds(null, ['all']);

module.exports = { 
    name: 'RSS',
    description: 'Selmer Bot will present a list of RSS feeds to read from *EXPERAMENTAL*',
    execute(message, args, Discord, Client, bot) {
        if (!bot.inDebugMode) { return message.reply('Command under development!'); }
        if (!args[0]) {
            presentFeeds(bot, message, [ 'all' ], null);
        }
    },
    RSSInteractionHandler
}


/*
REMOVED
"ABC": "https://abcnews.go.com/abcnews/topstories"
"FBI": "https://www.fbi.gov/feeds/national-press-releases/rss.xml" (Uhhhh......maybe I should't use this one.....)


*/