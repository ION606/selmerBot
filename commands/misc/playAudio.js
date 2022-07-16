const pathToFfmpeg = require('ffmpeg-static');
// const { joinVoiceChannel, createAudioResource } = require('@discordjs/voice');
const { VoiceConnectionStatus, AudioPlayerStatus, createAudioPlayer, StreamType,  joinVoiceChannel, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const { MessageActionRow, MessageButton, MessageEmbed, MessageSelectMenu, Message } = require('discord.js');
const play = require('play-dl');


// Note: Unsure of what this does , but may be related to the play-dl lib (my notes are inconsistent)
// play.authorization();

function playStopEmbed(bot, interaction, yt_info, stopped, message = null) {
    if (stopped) {
        var em = interaction.message.embeds[0];
        rows = [];
        em.description = new String;
        em.description = 'IS NOW STOPPED';
    
        interaction.update({embeds: [em], components: rows});
    } else {
        const author = {
            name: "Selmer Bot",
            url: "",
            iconURL: bot.user.displayAvatarURL()
          }
        
          const newEmbed = new MessageEmbed()
          .setColor('#0F00F0')
          .setTitle(`${yt_info.video_details.title}`)
          .setAuthor(author)
          .setDescription('IS NOW PLAYING')
          .setURL(yt_info.video_details.url)
          .setThumbnail(yt_info.video_details.thumbnails[0].url);
        
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
                new MessageButton()
                    .setCustomId('SKIP')
                    .setLabel('⏭️')
                    .setStyle('SECONDARY')
          );
        

          if (message) {
            const m = message.reply({ embeds: [newEmbed], components: [row] });
            m.then((msg) => {
                const data = bot.audioData.get(message.guild.id);
                data[2] = msg.id;
                bot.audioData.set(message.guild.id, data);
            })
          } else {
            interaction.update({embeds: [newEmbed], components: [row]});
          }
    }
}


function pause_start_stop(interaction, bot, message = null, command = null) {
    try {
        var player, em;

        if (interaction) {
            player = bot.audioData.get(interaction.guildId)[0];
            command = interaction.customId.toLowerCase();
            em = interaction.message.embeds[0];
        } else {
            player = bot.audioData.get(message.guild.id)[0];
            em = message.embeds[0];
        }
        
        var rows = [new MessageActionRow()];

        if (command == "pause") {
            rows[0].addComponents(
                new MessageButton()
                    .setCustomId('RESUME')
                    .setLabel('▶️')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('STOP')
                    .setLabel('⏹️')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('SKIP')
                    .setLabel('⏭️')
                    .setStyle('SECONDARY')
            );
            
            em.description = 'IS NOW PAUSED';
            player.pause();

        } else if (command == "resume") {
            rows[0].addComponents(
                new MessageButton()
                    .setCustomId('PAUSE')
                    .setLabel('⏸️')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('STOP')
                    .setLabel('⏹️')
                    .setStyle('SECONDARY'),
                new MessageButton()
                    .setCustomId('SKIP')
                    .setLabel('⏭️')
                    .setStyle('SECONDARY')
            );
            
            em.description = 'IS NOW PLAYING';

            player.unpause();
        } else if (command == "stop") {
            playStopEmbed(bot, interaction, null, true);

            const connection = getVoiceConnection(interaction.guild.id);
            
            player.stop();

            //Remove everything from queue
            bot.audioData.delete(interaction.guildId);

            if (connection) { connection.destroy(); }
            return;
        }

        if (interaction) { interaction.update({embeds: [em], components: rows}); }
        else {
            const data = bot.audioData.get(message.guild.id);
            
            // var msg = message.channel.messages.cache.get(data[2]);
            const newEmbed = message.embeds[0];
            newEmbed.description = "Has been deferred";
            message.edit({ embeds: [ newEmbed ], components: []});

            const m = message.reply({embeds: [em], components: rows});
            m.then((msg) => {
                const data = bot.audioData.get(message.guild.id);
                data[2] = msg.id;
                bot.audioData.set(message.guild.id, data);
            })
        }
        
    } catch (e) {
        console.log(e);
        rows = [];
        em.description = new String('IS NOW STOPPED');
        interaction.update({embeds: [em], components: rows});
    }
}


function playNext(interaction, bot, message = null) {
    // https://discordjs.guide/voice/audio-player.html#taking-action-within-the-error-handler

    //Setup data[1] = {info: yt_info, resource: resource}
    var guildId;
    if (message != null) { guildId = message.guild.id; }
    else { guildId = interaction.guildId; }

    let data = bot.audioData.get(guildId);
    const player = data[0];

    //Check if the queue is empty
    if (data[1].length <= 0) { 
        player.stop();
        bot.audioData.delete(guildId);
        if (message) { return true; }
        else { return playStopEmbed(bot, interaction, null, true); }
    }
    

    const resource = data[1][0].resource;
    const yt_info = data[1][0].yt_info;
    player.stop();

    //Play the thing
    player.play(resource);

    //remove the song from queue
    delete data[1][0];
    data[1] = data[1].filter(n => n);

    bot.audioData.set(guildId, data);

    //Add the embed
    var msg = message;
    if (!message) {
        msg = interaction.message;
        interaction.update({ embeds: [ new MessageEmbed(interaction.message.embeds[0]).setDescription("IS NOW STOPPED") ], components: []});
    }

    playStopEmbed(bot, interaction, yt_info, false, msg);

    return false;
}


function fromMessage(bot, command, msg) {
    //Setup data[1] = {info: yt_info, resource: resource}
    const guildId = msg.guild.id;
    let data = bot.audioData.get(guildId);
    if (!data) { return msg.reply("No music is currently playing!"); }

    const player = data[0];
    const message = msg.channel.messages.cache.get(data[2]);
    // console.log(message);

    var em;
    if (message.embeds) { em = message.embeds[0]; }
    var rows;

    if (command == 'stop') {
        em = message.embeds[0];
        rows = [];
        em.description = new String;
        em.description = 'IS NOW STOPPED';
        
        player.stop();
        const connection = getVoiceConnection(guildId);
        if (connection) { connection.destroy(); }

        bot.audioData.delete(guildId);
        msg.reply("Audio stopped!");
        
    } else if (command == 'skip') {
        if (playNext(null, bot, message)) {
            rows = [];
            em = message.embeds[0];
            em.description = new String;
            em.description = 'IS NOW STOPPED';

            msg.reply("Audio stopped!");
        }
    } else if (command == 'pause' || command == 'resume') {
        pause_start_stop(null, bot, message, command);
    }


    message.edit({embeds: [em], components: rows});
}



function showQueue(bot, message, interaction = null, page = 0) {
    const guild = message.guild.id;
    const data = bot.audioData.get(guild);
    if (!data) { return message.reply("The audio queue is empty!"); }

    const rawQueue = data[1];
    if (!rawQueue || rawQueue.length <= 0) { return message.reply("The audio queue is empty!"); }

    const songList = [];
    var fiveSongs = '';
    let i = 0;

    rawQueue.forEach(function (rawSong) {
        const songDetails = rawSong.yt_info.video_details;
        fiveSongs += `${i + 1}. ${songDetails.title}\n`;

        i++;

        //Split the songs into pages of 10
        if (i % 10 == 0) { songList.push(fiveSongs); fiveSongs = ''; }
    });

    if (page >= songList.length) { page = songList.length - 1 }
    if (page < 0) { page = 0; } //LEAVE AS TWO IF's AS THE LENGTH MIGHT BE 0

    if (songList.length == 0) { songList.push(fiveSongs); }

    //Create the embed
    const author = {
        name: "Selmer Bot",
        url: "",
        iconURL: bot.user.displayAvatarURL()
    }
    
    const newEmbed = new MessageEmbed()
    .setTitle("SONG QUEUE")
    .setAuthor(author)
    .setDescription(songList[page])
    .setFooter({ text: `Page ${page + 1}` })

    const row = new MessageActionRow()
    .addComponents(
        new MessageButton()
            .setCustomId(`audioQueue|${page - 1}`)
            .setLabel('⬅️')
            .setStyle('SECONDARY'),
        new MessageButton()
            .setCustomId(`audioQueue|${page + 1}`)
            .setLabel('➡️')
            .setStyle('SECONDARY'),
        
    )

    if (interaction) {
        interaction.update({embeds: [newEmbed], components: [row]});
    } else {
        message.reply({ embeds: [newEmbed], components: [row] });
    }
}


function removeFromQueue(bot, message, posStr) {
    const guildId = message.guild.id;
    let data = bot.audioData.get(guildId);
    if (!data) { return message.reply("The audio queue is empty!"); }

    const rawQueue = data[1];
    if (!rawQueue || rawQueue.length <= 0) { return message.reply("The audio queue is empty!"); }
    else if (isNaN(posStr) || Number(posStr) > rawQueue.length) { return message.reply("Please specify a number within queue bounds!"); }

    const pos = Number(posStr) - 1;
    const details = rawQueue[pos].yt_info.video_details;

    delete data[1][pos];
    data[1] = data[1].filter(n => n);
    
    bot.audioData.set(guildId, data);

    const newEmbed = new MessageEmbed()
    .setColor('#0F00F0')
    .setTitle(`${details.title}`)
    .setAuthor({ name: "Selmer Bot", url: "", iconURL: bot.user.displayAvatarURL() })
    .setDescription( `has been removed from position ${pos + 1} in queue!`)
    .setThumbnail(details.thumbnails[0].url);

    message.reply({ embeds: [newEmbed] });
}



function shuffleQueue(bot, message) {
    const guildId = message.guild.id;
    let data = bot.audioData.get(guildId);
    if (!data) { return message.reply("The audio queue is empty!"); }

    let rawQueue = data[1];
    if (!rawQueue || rawQueue.length <= 0) { return message.reply("The audio queue is empty!"); }

    //Shuffle the queue
    rawQueue = rawQueue.sort(() => Math.random()-0.5);

    data[1] = rawQueue;

    bot.audioData.set(guildId, data);

    message.reply("The queue has been shuffled!\nThe new queue is:");
    showQueue(bot, message);
}



module.exports = {
    name: "audio",
    description: 'Play a song from YouTube, add free!',
    async execute(message, args, Discord, Client, bot, interaction = null) {
            const commandList = ['stop', 'skip', 'pause', 'resume'];

            if (args.length < 1) {
                message.reply("Please use the following format _!audio [song name or URL]_ **or** _!audio queue_");
                return;
            } else if (args[0] == 'queue') {
                return showQueue(bot, message);
            } else if (commandList.indexOf(args[0]) != -1) {
                return fromMessage(bot, args[0], message);
            } else if (args[0] == 'remove') {
                if (args.length < 2) { return message.reply("Please specify a position in queue!"); }
                return removeFromQueue(bot, message, args[1]);
            } else if (args[0] == 'shuffle') {
                return shuffleQueue(bot, message);
            }

            /*
            Re-introduce once the issue with ydtl-core is resolved (see
            https://github.com/porridgewithraisins/jam-bot#known-bugs)
            const stream = await ytdl(url, { filter: 'audioonly' });
            */
           
            if (!message.member.voice.channel) {
                message.reply("Please join a voice channel before you try this!");
                return;
            }

            const channel =  bot.channels.cache.get(message.member.voice.channel.id);
            // console.log(message.member.voice.channel.id);

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });

            connection.on(VoiceConnectionStatus.Ready, () => {
                // console.log('Connected to the voice channel!');
            });
        
            let stream;
            let yt_info;
            if (args[0].startsWith("https://")) {
                if (!args[0].startsWith("https://www.youtube.com/") &&
                !args[0].startsWith("https://music.youtube.com/")) {
                    message.reply("This is not a valid YouTube URL");
                    return;
                }
                yt_info = await play.video_info(args[0]);
                // let stream = await play.stream_from_info(yt_info)
                stream = await play.stream(args[0]);

                // console.log("Playing from a URL!");
            } else {
                yt_info = await play.search(args.join(' '), {
                    limit: 1
                });

                stream = await play.stream(yt_info[0].url);
                yt_info = await play.video_info(yt_info[0].url);
            }

            let resource = createAudioResource(stream.stream, {
                inputType: stream.type
            })

            // let audio = "em.mp3";
            // let resource = createAudioResource(join(__dirname, audio));
            
            const data = bot.audioData.get(channel.guild.id);

            if (data && data[1]) {
                //[player, [queue Array]]
                data[1].push({yt_info: yt_info, resource: resource});
                bot.audioData.set(message.guild.id, data);
                message.reply(`_"${yt_info.video_details.title}" added to queue!_`);
            } else {
                const player = createAudioPlayer();
                connection.subscribe(player);

                bot.audioData.set(message.guild.id, [player, new Array(), null]);
                player.play(resource);


                player.on(AudioPlayerStatus.Playing, () => {
                    //Check maybe?
                });

                playStopEmbed(bot, interaction, yt_info, false, message);
            }

            

    }, pause_start_stop, playNext, showQueue
}