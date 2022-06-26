//Leave this as it's own file in case I want to expand the classes in the future

const { MessageActionRow, MessageSelectMenu } = require("discord.js");


//#region multiplayer games

/**
 * A temporary container to keep track of what abilities each class has
 * @param {string} name - the name of the class ('fighter', 'wizard', etc.)
 * @property { Boolean } canUseWeapons
 * @property { Boolean } canUseSpells
 * @example var myClass = new game_class('wizard');
 */
class game_class_battle {
    constructor(name = 'none') {
        if (name == 'fighter') {
            this.canUseWeapons = true;
            this.canUseSpells = false;
            this.specialAttack = {
                icon: 'spatkfight',
                dmg: 'r*2.5',
                prone: false
            };
            this.description = 'More damage, less effects!';
        } else if (name == 'wizard') {
            this.canUseWeapons = false;
            this.canUseSpells = true;
            this.specialAttack = {
                icon: 'spatkwiz',
                dmg: 'r*2.0',
                prone: true
            }
            this.description = 'Less damage, more effects!';
        } else if (name == 'none') {
            //The player doesn't have a class
            this.canUseSpells = undefined;
            this.canUseWeapons = undefined;
            this.specialAttack = undefined;
            this.description = undefined;
        }

        this.className = name;
    }
}

//#endregion




//#region functions
function presentClasses(message, game) {
    let classes;

    if (game == 'battle') {
        classes = [new game_class_battle('fighter'), new game_class_battle('wizard')];
    } else {
        return message.reply('Please use the following format for this command: _!game class [game name]_');
    }

    var classList = [];

    classes.forEach(function(c) {
        let n = c.className;

        classList.push({label: n, description: `${c.description}`, value: `${n}`});
    });

    const row = new MessageActionRow()
    .addComponents(
        new MessageSelectMenu()
            .setCustomId(`${message.author.id}|class`)
            .setPlaceholder('none')
            .addOptions(classList)
    )

    message.reply({ content: `Please choose your class <@${message.author.id}>`, components: [row] });
}


function chooseClass(user_dbo, message, game) {

}

//#endregion

module.exports = { game_class_battle, presentClasses, chooseClass }