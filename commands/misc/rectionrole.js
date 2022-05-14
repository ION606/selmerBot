module.exports = {
    name: 'reactionrole',
    description: 'Creates an embed that will give a role when reacted to',
    async execute(message, args, Discord, bot) {
        if (bot.commands.get('verify').checkRole(message, args)) {
            console.log("IS ADMNIN");
        }
    }
}