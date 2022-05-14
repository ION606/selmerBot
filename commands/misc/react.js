module.exports = {
    name: 'r',
    description: "Reacts with a phrase or single emoji",
    async execute(message, args, Discord, Client, bot) {

        // if (!message.reference) { return; }
        let msg;
        if (message.reference) {
            msg = await message.channel.messages.fetch(message.reference.messageId);
        } else { msg = message; }

        let emoji = [...new Set(args[0])];
        if (emoji.length > 15) { return message.reply("Please enter less than 15 emojis"); }
        let notused = new Array(15);
        let counter = 0;

        for (let i = 0; i < emoji.length; i ++) {
            try {  
                await msg.react(emoji[i]);
            } catch(err) {
                //The emoji wasn't a valid one
                notused[counter] = emoji[i];
                counter ++;
            }
        }

        if (notused.length > 0) {
            notused = notused.filter(element => element !== undefined);
            if (notused.length > 1) {
                message.reply("These are not valid reaction emoji(s): " + notused.toString());
            } else {
                message.reply(notused.toString() + " is not a valid reaction emoji");
            }
        }
    }
}