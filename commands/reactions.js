module.exports = {
    name: 'r',
    description: "Reacts with a phrase or single emoji",
    async execute(message, args, Discord, Client, bot) {

        // if (!message.reference) { return; }
        let msg;
        if (message.reference) {
            msg = await message.channel.messages.fetch(message.reference.messageId);
        } else { msg = message; }

        for (let i = 0; i < args.length; i ++) {
            try {  
                await msg.react(args[i]);
            } catch(err) {
                //The emoji wasn't a valid one
                message.reply("Please enter a valid emoji");
            }
        }
    }
}