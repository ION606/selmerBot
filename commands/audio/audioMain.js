// const { joinVoiceChannel, createAudioResource } = require('@discordjs/voice');
const { VoiceConnectionStatus, AudioPlayerStatus, createAudioPlayer, StreamType,  joinVoiceChannel, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const { MessageActionRow, MessageButton, MessageEmbed, Constants } = require('discord.js');
const play = require('play-dl');
const { getPlaylistUrls } = require('./addPlaylist.js');
const { verPremium } = require('../premium/verifyPremium.js');

// Note: Unsure of what this does , but may be related to the play-dl lib (my notes are inconsistent)
// play.authorization();

async function playMusic(bot, interaction, channelId, url, isPlaylist) {
    return new Promise(async (resolve, reject) => {
        const channel =  bot.channels.cache.get(channelId);
        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: channel.guild.id,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });

        connection.on(VoiceConnectionStatus.Ready, () => {
            // console.log('Connected to the voice channel!');
        });

        try {
            let stream;
            let yt_info;
            if (url.startsWith("https://")) {
                if (!url.startsWith("https://www.youtube.com/") &&
                !url.startsWith("https://music.youtube.com/") && !url.startsWith("https://youtu.be/")) {
                    if (!isPlaylist) {
                        interaction.reply("This is not a valid YouTube URL").catch((err) => {
                            console.log(err.message);
                            interaction.reply("Uh oh, an error has occured!");
                        });
                        reject();
                        return;
                    }
                }

                yt_info = await play.video_info(url);
                // let stream = await play.stream_from_info(yt_info)
                stream = await play.stream(url);

                // console.log("Playing from a URL!");
            } else {
                yt_info = await play.search(url, {
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
                bot.audioData.set(interaction.guildId, data);

                if (!isPlaylist) {
                    interaction.reply(`_"${yt_info.video_details.title}" added to queue!_`).catch((err) => {
                        channel.send("Uh oh, there's been a Discord API error!");
                        console.log(err);
                        reject();
                    });
                }
            } else {
                const player = createAudioPlayer();
                connection.subscribe(player);

                bot.audioData.set(interaction.guildId, [player, new Array(), null]);
                player.play(resource);


                player.on(AudioPlayerStatus.Playing, () => {
                    //Check maybe?
                });

                player.on(AudioPlayerStatus.Idle, () => {
                    //TODO find away to trigger the "stop" event here
                    // playNext(interaction, bot);
                    // pause_start_stop(interaction, bot);
                });

                playStopEmbed(bot, interaction, yt_info, false, true);
            }

            resolve(true);
        } catch (err) {
            if (!isPlaylist) {
                console.log(err);
                interaction.reply("Uh Oh, there's been an error!").catch((err) => { console.log(err); })
            }
            reject();
        }
    });
}


async function playStopEmbed(bot, interaction, yt_info, stopped, message = null) {
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
            if (interaction) {
                const m = interaction.channel.send({ embeds: [newEmbed], components: [row] });
                m.then((msg) => {
                    const data = bot.audioData.get(interaction.guildId);
                    data[2] = msg.id;
                    bot.audioData.set(interaction.guildId, data);
                });
            } else {
                const m = message.reply({ embeds: [newEmbed], components: [row] });
                m.then((msg) => {
                    const data = bot.audioData.get(message.guild.id);
                    data[2] = msg.id;
                    bot.audioData.set(message.guild.id, data);
                });
            }
          } else {
            interaction.update({embeds: [newEmbed], components: [row]});
          }
    }
}


function pause_start_stop(interaction, bot, message = null, command = null) {
    try {
        var player, em, guildId;
        if (interaction) { guildId = interaction.guildId }
        else { guildId = message.guild.id; }


        const data = bot.audioData.get(guildId);
        if (!data) {
            var em = interaction.message.embeds[0];
            em.description = new String;
            em.description = 'IS NOW STOPPED';
            return interaction.message.edit({ components: [], embeds: [em]});
        }

        if (interaction) {
            player = data[0];
            command = interaction.customId.toLowerCase();
            em = interaction.message.embeds[0];
        } else {
            player = data[0];
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
            const data = bot.audioData.get(guildId);
            
            // var msg = message.channel.messages.cache.get(data[2]);
            const newEmbed = message.embeds[0];
            newEmbed.description = "Has been deferred";
            message.edit({ embeds: [ newEmbed ], components: []});

            const m = message.reply({embeds: [em], components: rows});
            m.then((msg) => {
                const data = bot.audioData.get(message.guild.id);
                data[2] = msg.id;
                bot.audioData.set(message.guild.id, data);
            });
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
    if (!data) { return interaction.followUp("Audio queue empty!"); }
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


function fromMessage(bot, command, interaction) {
    //Setup data[1] = {info: yt_info, resource: resource}
    const guildId = interaction.guildId;
    let data = bot.audioData.get(guildId);
    if (!data) { return interaction.reply("No music is currently playing!"); }

    const player = data[0];
    const message = interaction.channel.messages.cache.get(data[2]);
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
        interaction.reply("Audio stopped!");
        
    } else if (command == 'skip') {
        if (playNext(null, bot, message)) {
            rows = [];
            em = message.embeds[0];
            em.description = new String;
            em.description = 'IS NOW STOPPED';

            interaction.reply("Audio stopped!");
        }
    } else if (command == 'pause' || command == 'resume') {
        interaction.deferReply();
        pause_start_stop(null, bot, message, command);
        interaction.deleteReply();
    }


    message.edit({embeds: [em], components: rows});
}



function showQueue(bot, isUpdate, interaction = null, page = 0) {
    const guild = interaction.guildId;
    const data = bot.audioData.get(guild);
    if (!data) { return interaction.reply("The audio queue is empty!"); }

    const rawQueue = data[1];
    if (!rawQueue || rawQueue.length <= 0) { return interaction.reply("The audio queue is empty!"); }

    const songList = [];
    var tenSongs = '';
    let i = 0;

    rawQueue.forEach(function (rawSong) {
        const songDetails = rawSong.yt_info.video_details;
        tenSongs += `${i + 1}. ${songDetails.title}\n`;

        i++;

        //Split the songs into pages of 10
        if (i % 10 == 0) { songList.push(tenSongs); tenSongs = ''; }
    });

    //If there's still some left over songs, add that
    if (i % 10 != 0) {
        songList.push(tenSongs);
    }

    if (page >= songList.length) { page = songList.length - 1 }
    if (page < 0) { page = 0; } //LEAVE AS TWO IF's AS THE LENGTH MIGHT BE 0

    if (songList.length == 0) { songList.push(tenSongs); }

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

    if (isUpdate) {
        interaction.update({embeds: [newEmbed], components: [row]});
    } else {
        interaction.reply({ embeds: [newEmbed], components: [row] }).catch((err) => {
            console.log(err);
            interaction.channel.send({ embeds: [newEmbed], components: [row] });
        });
        
    }
}


function removeFromQueue(bot, interaction, posStr) {
    const guildId = interaction.guildId;
    let data = bot.audioData.get(guildId);
    if (!data) { return interaction.reply("The audio queue is empty!"); }

    const rawQueue = data[1];
    if (!rawQueue || rawQueue.length <= 0) { return interaction.reply("The audio queue is empty!"); }
    else if (isNaN(posStr) || Number(posStr) > rawQueue.length) { return interaction.reply("Please specify a number within queue bounds!"); }

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

    interaction.reply({ embeds: [newEmbed] }).catch((err) => {
        interaction.channel.send({ embeds: [newEmbed] });
        console.log(err);
    })
}



function shuffleQueue(bot, interaction) {
    const guildId = interaction.guildId;
    let data = bot.audioData.get(guildId);
    if (!data) { return interaction.reply("The audio queue is empty!"); }

    let rawQueue = data[1];
    if (!rawQueue || rawQueue.length <= 0) { return interaction.reply("The audio queue is empty!"); }

    //Shuffle the queue
    rawQueue = rawQueue.sort(() => Math.random()-0.5);

    data[1] = rawQueue;

    bot.audioData.set(guildId, data);

    interaction.reply("The queue has been shuffled!\nThe new queue is:").catch((err) => {
        console.log(err);
        interaction.channel.send("The queue has been shuffled!\nThe new queue is:");
    });
    
    showQueue(bot, false, interaction);
}


//[ { name: 'play', type: 'SUB_COMMAND', options: [ [Object] ] } ]
module.exports = {
    name: "audio",
    description: 'Play a song from YouTube, add free!',
    async execute(interaction, Discord, Client, bot) {
        const commandList = ['stop', 'skip', 'pause', 'resume'];
        const command = interaction.options.data[0];

        if (!command) {
            return interaction.reply("Please specify a song or playlist!").chatch(err => {
                console.log(err);
                interaction.channel.send("Uh oh, there's been an error!");
            });
        }

        // if (args.length < 1) {
        //     message.reply("Please use the following format _!audio [song name or URL]_ **or** _!audio queue_");
        //     return;
        // } else
        
        if (command.name == 'queue') {
            return showQueue(bot, false, interaction);
        } else if (commandList.indexOf(command.name) != -1) {
            return fromMessage(bot, command.name, interaction);
        } else if (command.name == 'remove') {
            if (args.length < 2) { return interaction.reply("Please specify a position in queue!"); }
            return removeFromQueue(bot, interaction, args[1].value);
        } else if (command.name == 'shuffle') {
            return shuffleQueue(bot, interaction);
        }

        /*
        Re-introduce once the issue with ydtl-core is resolved (see
        https://github.com/porridgewithraisins/jam-bot#known-bugs)
        const stream = await ytdl(url, { filter: 'audioonly' });
        */
        const channelId = interaction.guild.members.cache.get(interaction.user.id).voice.channelId;

        if (!channelId) {
            interaction.reply("Please join a voice channel before you try this!");
            return;
        }

        const subCommand = command.options[0];
        if (!subCommand) { return; }

        interaction.deferReply();
        if (subCommand.name == 'playlist') {
            
            var isPremium;
            await verPremium(bot, interaction.user.id).then(() => { isPremium = true; }).catch(() => { isPremium = false; });
            
            const urls_promise = getPlaylistUrls(bot, subCommand.value, isPremium);
            urls_promise.then(async (urls) => {

                for (let i = 0; i < urls.length; i++) {
                    try {
                        const url = urls[i].video_url;
                        await playMusic(bot, interaction, channelId, url, true);

                        const msg = (i > 0) ? `Added ${i+1}/${urls.length} songs to queue` : `Added ${i+1}/${urls.length} song to queue`;
                        interaction.editReply(msg).catch((err) => { interaction.channel.send(msg); });
                    } catch(err) {
                        console.log(err);
                    }
                }
            }).catch(err => {
                const msg = (err == "Request failed with status code 400") ? "Invalid playlist URL" : "uh oh, there's been an error";

                console.log(err);
                interaction.reply(msg).catch((err) => {
                    interaction.channel.send(msg);
                });
            });
        } else {
            const url = subCommand.value;
            playMusic(bot, interaction, channelId, url);
            interaction.deleteReply();
        }
    }, pause_start_stop, playNext, showQueue,
    options: [
        {name: 'play', description: 'play a song', type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND, options: [
            {name: 'video', description: 'The song URL/search term(s)', type: Constants.ApplicationCommandOptionTypes.STRING, required: false},
            {name: 'playlist', description: 'The playlist URL', type: Constants.ApplicationCommandOptionTypes.STRING, required: false}
        ]},
    
        {name: 'pause', description: 'Pause the currently playing song', type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND},

        {name: 'queue', description: 'Show the song queue', type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND},

        {name: 'remove', description: 'Remove a song from the queue', type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND, options: [
            {name: 'position', description: 'The song\'s position in queue', type: Constants.ApplicationCommandOptionTypes.INTEGER, required: true}
        ]},

        {name: 'resume', description: 'Resume playing the current song', type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND},

        {name: 'shuffle', description: 'Shuffle the song queue', type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND},

        {name: 'skip', description: 'skip the current song', type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND},

        {name: 'stop', description: 'stop the music and clear the queue', type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND},
        
        //Actions left: remove, shuffle, 
    ]
}