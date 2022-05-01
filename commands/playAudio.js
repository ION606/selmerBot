const pathToFfmpeg = require('ffmpeg-static');
const { joinVoiceChannel, createAudioResource } = require('@discordjs/voice');
const { generateDependencyReport } = require('@discordjs/voice');
const { VoiceConnectionStatus, AudioPlayerStatus, createAudioPlayer, StreamType } = require('@discordjs/voice');
const play = require('play-dl');

// Leave here to be initialized at the program's start
const player = createAudioPlayer();

// Note: Unsure of what this does , but may be related to the play-dl lib (my notes are inconsistent)
// play.authorization();


module.exports = {
    name: "playaudio",
    async execute(message, args, bot) {
            // message.channel.send("This command has not been set up yet\nSorry!");
            // return;
            if (args[0] == "play") {
                if (args.length < 1) {
                    message.reply("Please specify a function (play, pause, unpause or stop)");
                    return;
                } else if (args.length < 2) {
                    message.reply("Please provide a song url");
                    return;
                }
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

            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
            
            connection.on(VoiceConnectionStatus.Ready, () => {
                console.log('Connected to the voice channel!');
            });
            
            if (args[0] == "play") {
                let stream;
                let info = "Playing __***";
                let yt_info;
                if (args[1].startsWith("https://")) {
                    if (!args[1].startsWith("https://www.youtube.com/") &&
                    !args[1].startsWith("https://music.youtube.com/")) {
                        message.reply("This is not a valid YouTube URL");
                        return;
                    }
                    yt_info = await play.video_info(args[1]);
                    // let stream = await play.stream_from_info(yt_info)
                    stream = await play.stream(args[1]);

                    console.log("Playing from a URL!");
                } else {
                    yt_info = await play.search(args.slice(1).join(' '), {
                        limit: 1
                    });

                    stream = await play.stream(yt_info[0].url);
                    yt_info = await play.video_info(yt_info[0].url);
                }

                //Add the video info to the return message
                info += yt_info.video_details.title + "***__\n";
                info += "Check it out at " + yt_info.video_details.url + "\n";


                let resource = createAudioResource(stream.stream, {
                    inputType: stream.type
                })

                connection.subscribe(player);

                let audio = "em.mp3";
                // let resource = createAudioResource(join(__dirname, audio));
                player.play(resource);
    
                player.on(AudioPlayerStatus.Playing, () => {
                    console.log('The audio player has started playing!');
                });
                message.reply(info);
            } else if (args[0] == "pause") {
                player.pause();
            } else if (args[0] == "unpause") {
                player.unpause();
            } else if (args[0] == "stop") {
                player.stop();
                connection.destroy();
            }
    }
}