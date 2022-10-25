const sharp = require('sharp');
const fetch = require('node-fetch');
const { GuildMember } = require('discord.js');


function formatMessage(member, welcomemessage) {
    return new Promise((resolve, reject) => {
        let text = `Welcome to ${member.guild.name} ${member.user.tag}!`;
        if (welcomemessage != null) {
            text = welcomemessage;
            text = text.replace('{sn}', member.guild.name);
            text = text.replace('{un}', member.user.username);
            text = text.replace('{ut}', member.user.discriminator);
        }

        resolve(text);
    });
}

/**
 * @param {GuildMember} member 
 * @param {*} welcomeChannel 
 */
async function welcome(member, welcomeChannel, welcomemessage, welcomebanner, welcomeTextCol) {
    formatMessage(member, welcomemessage).then(async (wmsg) => {
        const width = 1024;
        const height = 500;
        const usernameText = `${wmsg}`;
        const memberCountText = `You are member ${member.guild.memberCount}`;
        const username = `
            <svg width="${width}" height="${height}">
                <style>
                    .username { fill: ${welcomeTextCol}; font-size: ${Math.round(wmsg.length/2)}px; font-weight: bold;}
                </style>
                <text x="50%" y="50%" text-anchor="middle" class="username" font-family='Didot'>${usernameText}</text>
            </svg>
            `;
        const memberCount = `
            <svg width="${width}" height="${height}">
                <style>
                    .memberCount { fill: ${welcomeTextCol}; font-size: 40px; font-weight: bold;}
                </style>
                <text x="50%" y="50%" text-anchor="middle" class="memberCount" font-family='Didot'>${memberCountText}</text>
            </svg>
            `;

        const r = 100;
        const circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);
        var response, arrayBuffer;
        const usernameBuffer = Buffer.from(username);
        const memberCountBuffer = Buffer.from(memberCount);
        response = await fetch(member.displayAvatarURL());
        arrayBuffer = await response.arrayBuffer();
        const iconBuffer = Buffer.from(arrayBuffer);

        var bkBuffer;

        if (!welcomebanner) {
            response = await fetch('https://wallpapercave.com/wp/wp3258574.png');
            arrayBuffer = await response.arrayBuffer();
            bkBuffer = Buffer.from(arrayBuffer);
        } else {
            // return console.log(welcomebanner);
            bkBuffer = Buffer.from(welcomebanner, 'base64');
        }

        sharp(iconBuffer)
        .resize(300, 300)
        .composite([{
            input: circleShape,
            blend: 'dest-in'
        }])
        .toBuffer().then((iconBufferNew) => {
            sharp(bkBuffer)
                .resize(1024, 500)
                .composite([
                {
                    input: usernameBuffer,
                    top: 80,
                    left: -10,
                },
                {
                    input: memberCountBuffer,
                    top: 130,
                    left: -10,
                },
                {
                    input: iconBufferNew,
                    top: 10,
                    left: 1024/2 - 300/2,
                },
                ]).toBuffer((err, buffer) => {
                    if (err) { return console.error(err); }

                    // return console.log(buffer.byteLength * 0.000001);
                    welcomeChannel.send({
                        content: "content",
                        files: [buffer],
                    });
                });
            });
        });
                
        //     .toFile("./events/output.jpeg", (err, info) => {
        //     if (err) throw err;
        //     const attachment = new DJS.MessageAttachment("./events/output.jpeg");
        //     welcomeChannel.send({
        //         content: content,
        //         files: [attachment],
        //     });*/
        //     });
}

module.exports = { welcome }