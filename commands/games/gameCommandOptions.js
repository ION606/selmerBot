const { Constants } = require('discord.js');
const { trivia_categories } = require('./trivia_categories.json');

module.exports = [
    {
        name: "trivia",
        description: 'Start a game of Trivia',
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
        {name: 'difficulty', description: 'The question difficulty OR "help"', type: Constants.ApplicationCommandOptionTypes.STRING, required: true, choices: [{name: 'easy', value: 'easy'}, {name: 'medium', value: 'medium'}, {name: 'hard', value: 'hard'}]},
        {name: 'category', description: 'The trivia Category', type: Constants.ApplicationCommandOptionTypes.INTEGER, required: false, choices: trivia_categories},
        {name: 'time', description: 'Set the round length (in seconds)', type: Constants.ApplicationCommandOptionTypes.INTEGER, required: false},
    ]},

    {
        name: "battle",
        description: 'Start a game of Batte',
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
        {name: 'opponent', description: 'Who do you want to battle against?', type: Constants.ApplicationCommandOptionTypes.USER, required: true},
    ]},

    {
        name: "minesweeper",
        description: "Start a game of Minesweeper",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
            {name: 'difficulty', description: 'Set the diffficulty', type: Constants.ApplicationCommandOptionTypes.STRING, required: true, choices: [{name: 'easy', value: 'easy'}, {name: 'medium', value: 'medium'}, {name: 'hard', value: 'hard'}]},
            // {name: 'opponent', description: 'Play a game against someone else', type: Constants.ApplicationCommandOptionTypes.USER, required: false}
        ]
    },

    {
        name: "tictactoe",
        description: 'Start a game of TicTacToe',
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: [
        {name: 'opponent', description: 'Who do you want to play against?', type: Constants.ApplicationCommandOptionTypes.USER, required: true},
    ]},

    {
        name: "quit",
        description: "Quit your current game",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: []
    },

    {
        name: "status",
        description: "Check your current game status",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: []
    },

    {
        name: "hpmp",
        description: "Check your current game status",
        type: Constants.ApplicationCommandOptionTypes.SUB_COMMAND,
        options: []
    },
]