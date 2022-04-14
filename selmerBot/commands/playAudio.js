const pathToFfmpeg = require('ffmpeg-static');
const { joinVoiceChannel } = require('@discordjs/voice');
const { generateDependencyReport } = require('@discordjs/voice');
const { VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
    name: "playaudio",
    execute(message, args, client) {
        const channel = "930148609406685227";
        //console.log(generateDependencyReport());
        connection.on(VoiceConnectionStatus.Ready, (oldState, newState) => {
            console.log('Connection is in the Ready state!');
        });
        const connection = joinVoiceChannel({
            channelId: channel,
            guildId: channel.guild,
            adapterCreator: channel.guild.voiceAdapterCreator,
        });
    }
}