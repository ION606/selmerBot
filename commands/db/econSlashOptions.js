const { Constants } = require('discord.js');

module.exports = {
    //Add the items on boot-up
    "buy": {
        description: 'Buy an item from the shop',
        options: [
        {name: 'item', description: 'the item you want to buy', type: Constants.ApplicationCommandOptionTypes.STRING, required: true, choices: []},
        {name: 'amount', description: 'item amount', type: Constants.ApplicationCommandOptionTypes.INTEGER, required: true, choices: []},
    ]},
    'shop': {
        description: 'Displays the shop',
        options: [
            {name: 'type', description: 'the type of item', type: Constants.ApplicationCommandOptionTypes.STRING, required: true, choices: [{name: 'Food', value: 'Food'}, {name: 'Weapons', value: 'Weapons'}, {name: 'HP', value: 'HP'}, {name: 'MP', value: 'MP'}]},
            {name: 'page', description: 'the shop page you want to go to', type: Constants.ApplicationCommandOptionTypes.INTEGER, required: false},
        ]
    }, 'work': {
        description: 'Work and earn money and xp',
        options: []
    },
    'rank': { description: 'See your current rank' },
    'inventory': { description: 'Check what\'s in your inventory' },
    'balance': { description: 'Check your current balance' },
    'sell': {
        description: 'Sell an item from your inventory',
        options: [
            {name: 'item', description: 'the item you want to buy', type: Constants.ApplicationCommandOptionTypes.STRING, required: true},
            {name: 'amount', description: 'the item you want to buy', type: Constants.ApplicationCommandOptionTypes.INTEGER, required: true}
        ]
    }
}