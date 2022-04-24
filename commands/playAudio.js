const pathToFfmpeg = require('ffmpeg-static');
const { joinVoiceChannel } = require('@discordjs/voice');
const { generateDependencyReport } = require('@discordjs/voice');
const { VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
    name: "playaudio",
    execute(message, args, client) {
            // message.channel.send("This command has not been set up yet\nSorry!");
            // return;
            const ytdl = require('ytdl-core-discord');
            const url = args[0];
            
            async function play(connection, url) {
                connection.playOpusStream(await ytdl(url));
            }
        
        
    }
}