const fs = require('fs');
const {Buffer} = require('buffer');

function mapToObj(map){
    const obj = {}
    for (let [k,v] of map) {
        obj[k] = v
    }
    return obj
}


function objToMap(obj) {
    const m = new Map();
    for (i in obj) {
        m.set(i, obj[i]);
    }
    return m;
}


async function backupLists(bot, IDM) {
    try {
        var backups = {}
        backups.locked = mapToObj(bot.lockedChannels);
        const bts = JSON.stringify({ "backups": backups });

        if (IDM) {
            fs.writeFile('commands/admin/backup.json', bts, 'utf8', (err) => {
                // error checking
                if(err) throw err;
                
                console.log("New data added: " + bts);
                process.exit(0);
            });
        } else {
            process.env.backupLists = bts;
            process.exit(0);
        }
    } catch (err) {
        console.error(err);
        exit(-1);
    }
}


async function loadBotBackups(bot, IDM) {
    try {
        if (IDM) {
            const botBackups = require('./backup.json').backups;
            bot.lockedChannels = objToMap(botBackups.locked);
        } else {
            bot.lockedChannels = objToMap(JSON.parse(botBackups.locked));
        }
    } catch (err) {
        console.error(err);
        bot.lockedChannels = new Map();
        const a = new Map();
    }
}


module.exports = { backupLists, loadBotBackups }