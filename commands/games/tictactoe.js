// @ts-check

const wait = require('node:timers/promises').setTimeout;
const { MessageActionRow, MessageButton, MessageSelectMenu, Client, CommandInteractionOptionResolver } = require('discord.js');
const { STATE } = require('../db/econ');
const { winGame, getCustomEmoji } = require('./external_game_functions.js');
const { changeTurn } = require('../turnManager.js');
const { game_class_battle } = require('./game_classes');
const { MongoClient } = require('mongodb');
const { convertSnowflakeToDate } = require('../db/addons/snowflake');

//This function is blatantly stolen from https://alialaa.com/blog/tic-tac-toe-js
function isTerminal(board) {
	//Return False if board in empty
    if (board.every(cell => !cell)) return false;
    let nums = [0, 0, 0]

    //Checking Horizontal Wins
    if (board[0] === board[1] && board[0] === board[2] && board[0]) {
        nums = [0, 1, 2];
    	return {'winner': board[0], 'direction': 'H', 'row': 1, 'nums': nums};
    }
    if (board[3] === board[4] && board[3] === board[5] && board[3]) {
        nums = [3, 4, 5];
    	return {'winner': board[3], 'direction': 'H', 'row': 2, 'nums': nums};
    }
    if (board[6] === board[7] && board[6] === board[8] && board[6]) {
        nums = [6, 7, 8];
    	return {'winner': board[6], 'direction': 'H', 'row': 3, 'nums': nums};
    }

    //Checking Vertical Wins
    if (board[0] === board[3] && board[0] === board[6] && board[0]) {
        nums = [0, 3, 6];
    	return {'winner': board[0], 'direction': 'V', 'column': 1, 'nums': nums};
    }
    if (board[1] === board[4] && board[1] === board[7] && board[1]) {
        nums = [1, 4, 7];
    	return {'winner': board[1], 'direction': 'V', 'column': 2, 'nums': nums};
    }
    if (board[2] === board[5] && board[2] === board[8] && board[2]) {
        nums = [2, 5, 8];
    	return {'winner': board[2], 'direction': 'V', 'column': 3, 'nums': nums};
    }

    //Checking Diagonal Wins
    if (board[0] === board[4] && board[0] === board[8] && board[0]) {
        nums = [0, 4, 8];
    	return {'winner': board[0], 'direction': 'D', 'diagonal': 'main', 'nums': nums};
    }
    if (board[2] === board[4] && board[2] === board[6] && board[2]) {
        nums = [2, 4, 6];
    	return {'winner': board[2], 'direction': 'D', 'diagonal': 'counter', 'nums': nums};
    }

    //If no winner but the board is full, then it's a draw
    if (board.every(cell => cell)) {
        return {'winner': 'draw'};
    }

    //return false otherwise
    return false;
}


//I know it's sloppy, but when 'initial' is true, 'interaction' will actually be 'thread'
function postActionBar(interaction, user_dbo, board, won, initial = false) {
    let componentlist = [];
    let newRow = new MessageActionRow();

    for (let i = 0; i < 9; i ++) {
        let button;
        
        if (!won) {
            if (!board[i]) {
                button = new MessageButton()
                .setCustomId(`ttt|${i}`)
                .setLabel('-')
                .setStyle('SUCCESS')
            } else {
                button = new MessageButton()
                .setCustomId(`ttt|${i}`)
                .setLabel(board[i])
                .setStyle('DANGER')
                .setDisabled(true);
            }
        } else {
            if (i in won.nums) {
                button = new MessageButton()
                .setCustomId(`ttt|${i}`)
                .setLabel('W')
                .setStyle('SUCCESS')
            } else {
                button = new MessageButton()
                .setCustomId(`ttt|${i}`)
                .setLabel('F')
                .setStyle('DANGER')
                .setDisabled(true);
            }
        }

        newRow.addComponents(button);
        
        if ((i + 1) % 3 == 0) {
            //Add the row to the list of rows
            componentlist.push(newRow);
            newRow = new MessageActionRow();
        }
    }

    // console.log(componentlist);

    if (initial) {
        interaction.send({ content: `Your turn <@${user_dbo.s.namespace.collection}>!`, components: componentlist });
    } else {
        interaction.update({ content: `Your turn <@${user_dbo.s.namespace.collection}>!`, components: componentlist });
    }
}


async function handle(client, db, dbo, other, bot, thread, command, doc, interaction, xp_collection) {
    
    if (command == 'initalize') {
        let board = ["", "", "", "", "", "", "", "", ""];
        postActionBar(thread, dbo, board, false,true);
    } else {

        //Change the board
        let square = Number(interaction.customId.split('|')[1]);
        let symbol = doc.symbols[doc.turn];
        let board = doc.board;
        board[square] = symbol;
        const gamedbo = client.db('B|S' + bot.user.id).collection(interaction.guildId);

        gamedbo.updateOne({$or: [ {0: interaction.user.id}, {1: interaction.user.id} ], 'board': {$exists: true}}, {$set: {board: board}});

        //Check if the game is over
        let won = isTerminal(board);
        
        if (!won) {
            changeTurn(client, bot, interaction);
            postActionBar(interaction, other, board, false);
            changeTurn(client, bot, interaction);
        } else {
            postActionBar(interaction, dbo, board, won);
            await wait(7000);
            winGame(client, bot, db, dbo, xp_collection, interaction.message);
        }
    }
}

module.exports = { handle }