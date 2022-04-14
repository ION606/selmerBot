const pathToFfmpeg = require('ffmpeg-static');
const { joinVoiceChannel } = require('@discordjs/voice');
const { generateDependencyReport } = require('@discordjs/voice');
const { VoiceConnectionStatus, AudioPlayerStatus } = require('@discordjs/voice');

module.exports = {
    name: "playaudio",
    execute(message, args, client) {
            message.channel.send("This command has not been set up yet\nSorry!");
            return;
    //     //const guild = client.guilds.cache.get(client.guild.id);
    //     const channel = client.guilds.channels.cache.get('930148609406685227');
    //     channel.join()
    //     .then(connection => console.log('Connected'))
    //     .catch(console.error);


    //     const { createAudioResource, createAudioPlayer } = require('@discordjs/voice');

    //     const player = createAudioPlayer();
        
    //     const resource = createAudioResource('/home/user/voice/music.mp3', {
    //         metadata: {
    //             title: 'A good song!',
    //         },
    //     });
        
    //     // Not recommended - listen to errors from the audio player instead for most usecases!
    //     resource.playStream.on('error', error => {
    //         console.error('Error:', error.message, 'with track', resource.metadata.title);
    //     });
        
    //     player.play(resource);
        
        
    }
}