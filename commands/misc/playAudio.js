const pathToFfmpeg = require('ffmpeg-static');
// const { joinVoiceChannel, createAudioResource } = require('@discordjs/voice');
const { VoiceConnectionStatus, AudioPlayerStatus, createAudioPlayer, StreamType,  joinVoiceChannel, createAudioResource, getVoiceConnection } = require('@discordjs/voice');
const { MessageActionRow, MessageButton, MessageSelectMenu } = require('discord.js');
const play = require('play-dl');

// Leave here to be initialized at the program's start
const player = createAudioPlayer();

// Note: Unsure of what this does , but may be related to the play-dl lib (my notes are inconsistent)
// play.authorization();

function pause_start_stop(interaction, bot) {
    const command = interaction.customId.toLowerCase();
    var em = interaction.message.embeds[0];
    var rows = [new MessageActionRow()];

    if (command == "pause") {
        rows[0].addComponents(
            new MessageButton()
                .setCustomId('UNPAUSE')
                .setLabel('▶️')
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('STOP')
                .setLabel('⏹️')
                .setStyle('SECONDARY')
        );
        
        em.description = 'IS NOW PAUSED';
        player.pause();

    } else if (command == "unpause") {
        rows[0].addComponents(
            new MessageButton()
                .setCustomId('PAUSE')
                .setLabel('⏸️')
                .setStyle('SECONDARY'),
            new MessageButton()
                .setCustomId('STOP')
                .setLabel('⏹️')
                .setStyle('SECONDARY')
        );
        
        em.description = 'IS NOW PLAYING';

        player.unpause();
    } else if (command == "stop") {
        rows = [];
        em.description = 'IS NOW STOPPED';

        const connection = getVoiceConnection(interaction.guild.id);
        
        player.stop();
        if (connection) { connection.destroy(); }
    }

    interaction.update({embeds: [em], components: rows})
}


module.exports = {
    name: "audio",
    description: 'Play a song from YouTube, add free!',
    async execute(message, args, Discord, Client, bot, interaction = null) {
            // message.channel.send("This command has not been set up yet\nSorry!");
            // return;
            if (args.length < 1) {
                message.reply("Please use the following format _!audio [song name or URL]_");
                return;
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

            const author = {
                name: "Selmer Bot",
                url: "",
                iconURL: bot.user.displayAvatarURL()
            }

            const newEmbed = new Discord.MessageEmbed()
            .setColor(' #0F00F0')
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
                    .setStyle('SECONDARY')
            );


            let resource = createAudioResource(stream.stream, {
                inputType: stream.type
            })

            connection.subscribe(player);

            let audio = "em.mp3";
            // let resource = createAudioResource(join(__dirname, audio));
            player.play(resource);

            player.on(AudioPlayerStatus.Playing, () => {
                // console.log('The audio player has started playing!');
            });
            
            message.reply({ embeds: [newEmbed], components: [row] });

    }, pause_start_stop
}