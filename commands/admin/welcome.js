const { MessageAttachment } = require('discord.js');
// const { readFile } = require('fs/promises');
const fs = require("fs");
const fetch = require('node-fetch');
const arrayBufferToBuffer = require('arraybuffer-to-buffer');

const { request } = require('undici');
const CanvasImport = require('@napi-rs/canvas');
const canvas = CanvasImport.createCanvas(700, 250)
const context = canvas.getContext('2d')

//https://some-random-api.ml/welcome
async function welcome(member, welcomechannel, welcomemessage = null, welcomebanner = null) {

    //Draw Stuff
    const context = canvas.getContext('2d');
    var bkimgsrc;

    let bkurl = 'https://github.com/ION606/selmerBot/blob/main/commands/admin/wallpaper.jpg';
    const response = await fetch(bkurl);
    response.arrayBuffer().then(async (data) => {
        
        // const background = new CanvasImport.Image();
        // background.src = arrayBufferToBuffer(data);
        

        // This uses the canvas dimensions to stretch the image onto the entire canvas
        // context.drawImage(background, 0, 0, canvas.width, canvas.height);
        context.fillStyle = 'rgba(0,0,0,1)';
        context.fillRect(0,0, canvas.width, canvas.height);

        //Draw the Border
        context.strokeStyle = '#0099ff';
        context.strokeRect(0, 0, canvas.width, canvas.height);


        //Add Text

        //have the function here, because returns are whack
        const applyText = (canvas, text) => {
            const context = canvas.getContext('2d');
        
            // Declare a base size of the font
            let fontSize = 70;
            let i = 0;
        
            do {
                // Assign the font to the context and decrement it so it can be measured again
                context.font = `italic ${fontSize -= 10}px sans-serif`;
                // Compare pixel width of the text to the canvas minus the approximate avatar size

                i ++;
            } while (context.measureText(text).width > canvas.width - 100);
        
            // Return the result to use in the actual canvas
            return context.font;
        };

        //message.author.username == interaction.member.displayName
        //message.guild.name == interaction.member.guild.name
        let text = `Welcome to ${member.guild.name} ${member.user.username}#${member.user.discriminator}!`;
        if(welcomemessage != null) {
            text = welcomemessage;
            text = text.replace('{sn}', member.guild.name);
            text = text.replace('{un}', member.user.username);
            text = text.replace('{ut}', member.user.discriminator);
        }
        
        context.font= applyText(canvas, text);
        context.fillStyle = '#ffffff';
        context.fillText(text, (canvas.width/2) - (context.measureText(text).width)/2, canvas.height - 15);


        //Draw a white circle
        context.beginPath();
        context.arc((canvas.width/2), 90, 85, 0, 2 * Math.PI, false);
        context.fillStyle = 'white';
        context.fill();
        context.closePath();

        //ANYTHING DRAWN AFTER THIS WILL BE CLIPPED!!! 
        //Make whatever image will be draw (the user's avatar) into a circular format
        context.beginPath();
        context.arc((canvas.width/2), 90, 80, 0, Math.PI * 2, true);
        context.closePath();

        // Clip off the region you just drew (enforce template?)
        context.clip();


        //Add the user's profile pic (message.author == interaction.user)
        const { body } = await request(member.displayAvatarURL({ format: 'jpg' }));
        const avatar = new CanvasImport.Image();
        avatar.src = Buffer.from(await body.arrayBuffer());
        context.drawImage(avatar, (canvas.width/2) - 80, 10, 160, 160);

        // Use the helpful Attachment class structure to process the file for you
        const attachment = new MessageAttachment(canvas.toBuffer('image/png'), 'profile-image.png');

        welcomechannel.send({ files: [attachment] });
        
    })
}

module.exports = { welcome }