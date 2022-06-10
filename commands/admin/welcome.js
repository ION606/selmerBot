const { MessageAttachment } = require('discord.js');
const { readFile } = require('fs/promises');

const { request } = require('undici');
const CanvasImport = require('@napi-rs/canvas');
const canvas = CanvasImport.createCanvas(700, 250)
const context = canvas.getContext('2d')

//https://some-random-api.ml/welcome
async function welcome(member, welcomechannel, welcomebanner = null) {

    //Draw Stuff
    const context = canvas.getContext('2d');

	const backgroundFile = await readFile('https://github.com/ION606/selmerBot/blob/main/commands/admin/wallpaper.jpg');
	const background = new CanvasImport.Image();
	background.src = backgroundFile;

	// This uses the canvas dimensions to stretch the image onto the entire canvas
	context.drawImage(background, 0, 0, canvas.width, canvas.height);

    //Draw the Border
    context.strokeStyle = '#0099ff';
    context.strokeRect(0, 0, canvas.width, canvas.height);


        //Add Text

    //have the function here, because returns are whack
    const applyText = (canvas, text) => {
        const context = canvas.getContext('2d');
    
        // Declare a base size of the font
        let fontSize = 70;
    
        do {
            // Assign the font to the context and decrement it so it can be measured again
            context.font = `italic ${fontSize -= 10}px sans-serif`;
            // Compare pixel width of the text to the canvas minus the approximate avatar size
        } while (context.measureText(text).width > canvas.width - 100);
    
        // Return the result to use in the actual canvas
        return context.font;
    };

    //message.author.username == interaction.member.displayName
    //message.guild.name == interaction.member.guild.name
    const text = `Welcome to ${member.guild.name} ${member.user.username}#${member.user.discriminator}!`;
    context.font = applyText(canvas, text);
    context.fillStyle = '#ffffff';
    context.fillText(text, (canvas.width/2) - (text.length * 7.5), canvas.height - 15);


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
}

module.exports = { welcome }