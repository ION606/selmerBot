module.exports = {
    name: 'arrow',
    description: 'Engage in a trademarked activity and throw an arrow at a trash can',
    async execute(interaction, Discord, Client, bot) {
        arrow = '>';
        await interaction.reply(arrow);
        for (let i = 0; i < 5; i++) {
            arrow = '-' + arrow
            await interaction.editReply(arrow);
        }

        arrow = arrow + '🗑️';
        await interaction.editReply(arrow);
    }, options: []
}