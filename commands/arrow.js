module.exports = {
    name: 'arrow',
    description: 'Engage in a trademarked activity and throw an arrow at a trash can',
    async execute(message, args, Discord, Client, bot) {
        let counter = 0;
        arrow = '>';
        while (true) {
            arrow = '-' + arrow;
            message.channel.send(arrow);
            await message.channel.messages.fetch({limit: 1}).then(messages => {
                message.channel.bulkDelete(messages);
            });
            counter ++;
            if (counter >= 5) {
                message.channel.messages.fetch({limit: 1}).then(messages => {
                    message.channel.bulkDelete(messages);
                });
                arrow = arrow + '🗑️';
                message.channel.send(arrow);
                break;
            }
        }
    }
}