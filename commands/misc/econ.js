const { MongoClient, ServerApiVersion } = require('mongodb');
// const { update } = require('apt');
const { Collection, Client, Formatters, Intents } = require('discord.js');
const BASE_PAY = 5;
const BASE_LVL_XP = 35;
//Note that leveling up to the next level takes 10% more xp than the previous one


//#region functions

function isNum(arg) {
    return (!isNaN(arg) && Number.isSafeInteger(Number(arg)));
};


function addxp(message, dbo, amt, xp_list) {
    if (!isNum(amt)) { return console.log("This isn't a number...."); }

    dbo.find({"balance": {$exists: true}}).toArray(function(err, doc) {
        if (!String(doc)) { return console.log("ERROR!\nThis account does not exist!"); }

        temp = doc[0];
        let rank = temp.rank + 1;
        const txp =  temp.xp + amt;
        //If the rank is less than 100, you can still advance
        if (rank < 101) {
            let needed = xp_list.get(rank);
            if (txp >= needed) {
                //Get to the max level possible with the current xp (may skip)
                while (txp >= needed) {
                    rank ++;
                    needed = xp_list.get(rank);
                }
                rank --; //Maybe?
                dbo.updateOne({balance: temp.balance, rank: temp.rank, lastdayworked: temp.lastdayworked}, { $set: { rank: rank }});
                message.channel.send('Congradulations <@' + message.author.id + '> for reaching rank ' + String(rank) + '!');
            }
        }

        dbo.updateOne({balance: temp.balance}, { $set: { xp: txp}});
    });
}


function rank(dbo, message, xp_list) {
    dbo.find({"balance": {$exists: true}}).toArray(function(err, doc) {
        if (!String(doc)) { return console.log("ERROR!\nThis account does not exist!"); }

        let next = doc[0].rank + 1;
        let needed = xp_list.get(next);

        message.channel.send('<@' + message.author.id + '> you are currently at rank ' + String(next-1) + ' and have ' + String(doc[0].xp) + 'xp. You need ' + String(needed - doc[0].xp) + ' more xp to get to rank ' + String(next));
    });
}


//Changes one type of currency for another
function convertCurrency(id, amt, dbo) {
    
}

function checkAndUpdateBal(dbo, item, message, args) {
    let b = false;
    dbo.find({"balance": {$exists: true}}).toArray(b = function(err, doc) {
        if (!String(doc)) { return message.reply("Your account doesn't exist, please contact the mods for support"); }

        const icost = args[0] * item.cost;
        if (doc[0].balance < icost) {
            message.reply("Insufficient funds!");
            return false;
        } else {
            let temp = doc[0];
            dbo.updateOne({balance: temp.balance, rank: temp.rank, lastdayworked: temp.lastdayworked}, { $set: { balance: doc[0].balance -= icost }});
            message.reply("You have bought " + item.name + " for $" + icost + "!");
            return true;
        }
    });

    return b;
}


function buy(id, message, args, dbo, shop, xp_list) {
    if (args.length < 2) { return; }
    if (!isNum(args[0])) { return message.reply("Please enter a number for query 2"); }

    let query = args[1];
    let item = shop.filter(function (item) { return item.name.toLowerCase() == query.toLowerCase(); });

    if (!String(item)) { return message.reply("This item does not exist!"); }

    let success = Boolean(checkAndUpdateBal(dbo, item[0], message, args));
    if (!success) { return; }

    var newObj = { name: item[0].name, cost: item[0].cost, icon: item[0].icon, sect: item[0].sect};

    addxp(message, dbo, Math.ceil(item[0].cost * 1.2), xp_list);
    dbo.find(newObj, {$exists: true}).toArray(function(err, doc) {
        if(String(doc)) {
            let newnum = doc[0].num + Number(args[0]);
            console.log(newnum);
            dbo.updateOne({ name: item[0].name }, {$set: {num: newnum}});
        } else {
            dbo.insertOne({ name: item[0].name, cost: item[0].cost, icon: item[0].icon, sect: item[0].sect, num: Number(args[0])});
        }
    });
};


function sell(id, message, args, dbo, shop) {
    if (args.length < 2) { return; }
    if (!isNum(args[0])) { return message.reply("Please enter a number for query 2"); }
    var newObj = { name: args[1] };

    let query = args[1];
    let item = shop.filter(function (item) { return item.name.toLowerCase() == query.toLowerCase(); });
    if (!String(item)) { return message.reply("This item does not exist!"); }
    if (!success) { return; }

    dbo.find(newObj, {$exists: true}).toArray(function(err, doc) {
        return console.log(String(doc));
        if(String(doc)) {
            dbo.updateOne({ name: args[1] }, {$set: {num: doc[0].num + Number(args[0])}});
        } else {
            message.reply("You don't own this item!");
        }
    });
}


function work(dbo, message, xp_list) {
    let fulldate = new Date();
    let date = fulldate.getDate();
    dbo.find({"lastdayworked": {$exists: true}}).toArray(function(err, doc) {
        if (!String(doc)) { return message.reply("Your account doesn't exist, please contact the mods for support"); }
        if (doc[0].lastdayworked == date) {
            message.reply("You've already worked today, try again tomorrow!");
        } else {
            //Amount to be paid
            let amt = 0;
            amt = BASE_PAY * doc[0].rank;
            dbo.updateOne({balance: doc[0].balance, rank: doc[0].rank}, { $set: { balance: amt, lastdayworked: date }});
            addxp(message, dbo, Math.ceil(amt*1.5), xp_list);
            message.channel.send('<@' + message.author.id + '> worked and earned $' + amt +' and ' + Math.ceil(amt*1.5) + ' xp!');
        }
    });
}


function printInventory(dbo, message) {
    let tempstring = "";
    dbo.find().toArray(function(err, docs){
        docs.forEach(val => {
            if (!val.balance) {
                tempstring += String(val.num) + " " + val.name + " (" + val.icon + ")\n";
            }
        });
        message.reply(tempstring);
    });
}


function getBalance(dbo, message) {
    dbo.find({"balance": {$exists: true}}).toArray(function(err, doc) {
        message.reply('Your current balance is $' + String(doc[0].balance));
    });
}


function getShop(message, args, items) {
    if (args.length == 0) {
        let temp = Formatters.codeBlock(items.map(i => `${i.sect}`).join(' '));
        temp = [...new Set(temp.split(' '))];

        return message.reply("Please use the format /shop [type] [page number]\nTypes are: " + temp);
    }

    let ind = 1;
    let noinp = false;
    if (args.length > 1) {
        if (args[1] < (items.length / 9)) {
            ind = Number(args[1]);
        } else {
            return message.reply("That number is too large");
        }
    } else {
        noinp = true;
    }

    const items2 = items.slice((ind - 1)*10, (ind - 1)*10+10);
    newText = Formatters.codeBlock(items2.map(i => `${i.icon} (${i.name}): \$${i.cost}`)
    .filter(f => f.sect = args[0]).join('\n'));

    if (noinp) {
        newText += "(Use /shop [type] [page number] to access other pages)";
    }

    return message.reply(newText);
}

//#endregion

//Main Code
module.exports = {
    name: 'ECON',
    description: 'ECON',
    async execute(bot, message, args, command, Discord, mongouri, items, xp_list) {
        //Set Discord vars
        const id = message.author.id;
        const server = message.guild.id;

        const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
        client.connect(err => {
            const db = client.db(String(server) + "[ECON]");
            const dbo = db.collection(id);
            if (err) { return console.log(err); }
            //Initialize if necessary
            db.listCollections({name: id})
            .next(function(err, collinfo) {
                if (!collinfo) {
                    message.reply("You didn't have a place in my databases, so I created one for you!\nPlease try your command again!")
                    dbo.insertOne({balance: 100, rank: 1, lastdayworked: 0, xp: 0});
                    return;
                }

                //test area
                if (command == 'xp' || command == 'adbal') {
                    //Selmer Dev only command
                    if (message.member.roles.cache.has('944048889038774302')) {
                        if (command == 'xp') {
                            return addxp(message, dbo, Number(args[0]), xp_list);
                        }
                    }
                }

                //Command Area
                if(command == 'init') {
                    //Add security check here
                    // init.execute(bot, message, args, command, dbo, Discord, connect);
                    return;
                } else if (command == 'checkinv') {
                    const req = dbo.findOne({ id: message.guild.id });
                    if (!req) { return message.reply("Doc doesn't exist!"); }
                } else if (command == 'buy') {
                    buy(id, message, args, dbo, items, xp_list);
                } else if (command == 'shop') {
                    getShop(message, args, items);
                } else if (command == 'work') {
                    work(dbo, message, xp_list);
                } else if (command == 'rank') {
                    rank(dbo, message, xp_list);
                } else if (command == 'inventory') {
                    printInventory(dbo, message);
                } else if (command == 'balance') {
                    getBalance(dbo, message);
                } else {
                    message.channel.send("'" + message.content + "' is not a command!");
                }
                
            });
        });

        //Close the database
        client.close();
    }
}