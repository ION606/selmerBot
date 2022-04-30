module.exports = {
    name: 'ECON',
    description: 'ALL ECON STUFF',
    async execute(clientTemp, prefix, message, args, com2, Users, currency) {
        const { Op } = require('sequelize');
        const { Collection, Client, Formatters, Intents } = require('discord.js');
        const { CurrencyShop } = require('./dbObjects.js');
        // const { token } = require('./config.json');
        //Heroku
        const { token } = require('process.env');
        const command = com2;

        const client = clientTemp; //new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });
        

        /*
        * THIS REPO HEAVILY BORROWS FROM https://github.com/discordjs/guide/tree/main/code-samples/sequelize/currency

        * Make sure you are on at least version 5 of Sequelize! Version 4 as used in this guide will pose a security threat.
        * You can read more about this issue On the [Sequelize issue tracker](https://github.com/sequelize/sequelize/issues/7310).
        */

        //If the table hasn't been created, use "node dbInit.js"

        function isNum(arg) {
            return (!isNaN(arg) && Number.isSafeInteger(Number(arg)));
        };
        


        Reflect.defineProperty(currency, 'add', {
            value: async (id, amount) => {
                const user = currency.get(id);

                if (user) {
                    user.balance += Number(amount);
                    return user.save();
                }

                const newUser = await Users.create({ user_id: id, balance: amount });
                currency.set(id, newUser);

                return newUser;
            },
        });

        Reflect.defineProperty(currency, 'getBalance', {
            value: id => {
                const user = currency.get(id);
                return user ? user.balance : 0;
            },
        });

        client.once('ready', async () => {
            const storedBalances = await Users.findAll();
            storedBalances.forEach(b => currency.set(b.user_id, b));

            console.log(`Logged in as ${client.user.tag}!`);
        });

        // client.on('messageCreate', async message => {
            //debounce();
            
            // if (message.author.bot) return;
        // 	currency.add(message.author.id, 1);
        // });

        // client.on('interactionCreate', async interaction => {
            
            //if (!interaction.isCommand()) return;
            //To replace this with an interaction, replace every instance of "message" with interaction

            //Custom section

            //const { commandName } = command;
            //Replace all instances of "command" with "commandName"
            //Replace "message.author;" with "interaction.options.getUser('user') || interaction.user;"
            const user = await Users.findOne({ where: { user_id: message.author.id } });
            // if (!user) { currency.add(message.author.id, 0); }


            if (command == 'reset') {
                if(message.guild.fetchOwner()) {
                    const target = message.author;
                    const oldBal = Number(currency.getBalance(target.id));
                    currency.add(target.id, -oldBal);
                }
            } else if (command == 'add') {
            //Check if the person is a mod
                if (!isNum(args[0])) { message.reply("No..."); }
                else if (args[0] > 100) {
                    message.reply("That's over $100 you greedy pig!");
                } else if (args[0] < 0) {
                    currency.add(message.author.id, args[0]);
                }
                else if (args.length < 2) {
                    const oldBal = Number(currency.getBalance(message.author.id));
                    if (oldBal > 0) {
                        currency.add(message.author.id, -oldBal);
                    }
                    
                    currency.add(message.author.id, Number(args[0]) + oldBal);
                } else {
                    for (let i = 1; i < args.size(); i ++) {
                        currency.add(args[i].id, oldBal + args[0]);
                    }
                }
            } else if (command === 'balance') {
                const target = message.author;
                currency.add(target.id, 0); //Make sure there's something
                return message.reply(`${target.tag} has \$${currency.getBalance(target.id)}`);
            } else if (command === 'inventory') {
                const target = message.author;
                const user = await Users.findOne({ where: { user_id: target.id } });
                const items = await user.getItems();

                if (!items.length) return message.reply(`${target.tag} has nothing!`);

                return message.reply(Formatters.codeBlock(items.map(i => `\$${i.item.cost * i.amount} worth of ${i.amount} ${i.item.icon}`).join('\n')));

                //return message.reply(`${target.tag} currently has ${items.map(t => `${t.amount} ${t.item.name}`).join(', ')}`);
                
            } else if (command === 'transfer') {
                const currentAmount = currency.getBalance(message.author.id); //interaction.user.id
                const transferAmount = args[0]; //interaction.options.getInteger('amount');
                const transferTarget = args[1]; //interaction.options.getUser('user');

                if (transferAmount > currentAmount) return message.reply(`Sorry ${message.author} you don't have that much.`);
                if (transferAmount <= 0) return message.reply(`Please enter an amount greater than zero, ${message.author}`);

                currency.add(message.author.id, -transferAmount);
                currency.add(transferTarget.id, transferAmount);

                return message.reply(`Successfully transferred ${transferAmount}💰 to ${transferTarget.tag}. Your current balance is ${currency.getBalance(message.author.id)}💰`);

            } else if (command === 'buy') {
                if (!isNum(args[0]) || Number(args[0]) < 0) { 
                    message.reply("Please enter a valid argument!");
                    return;
                }

                const numItems = Number(args[0]);
                const itemName = args[1];

                const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: itemName } } });

                if (!item) return message.reply('That item doesn\'t exist.');
                if (item.cost > currency.getBalance(message.author.id)) {
                    return message.reply(`You don't have enough currency, ${message.author}`);
                }

                const user = await Users.findOne({ where: { user_id: message.author.id } });
                await user.addItem(item, message, currency, args[0]);

                return;

                //return message.reply(`You've bought a ${item.name}`);

            } else if (command == 'sell') {
                const itemName = args[1];
                const item = await CurrencyShop.findOne({ where: { name: { [Op.like]: itemName } } });

                if (!item) return message.reply('That item doesn\'t exist.');

                const user = await Users.findOne({ where: { user_id: message.author.id } });
                
                let ll;
                if (args.length > 1) {
                    ll = Number(args[0]);
                } else {
                    ll = 1;
                }

                user.removeItem(item, message, currency, ll, CurrencyShop);


            }else if (command === 'shop') {
                const items = await CurrencyShop.findAll();
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
            } else if (command === 'leaderboard') {
                return message.reply(
                    Formatters.codeBlock(
                        currency.sort((a, b) => b.balance - a.balance)
                            .filter(user => client.users.cache.has(user.user_id))
                            .first(10)
                            .map((user, position) => `(${position + 1}) ${(client.users.cache.get(user.user_id).tag)}: ${user.balance}💰`)
                            .join('\n'),
                    ),
                );
            } else {
                message.channel.send("'" + message.content + "' is not a command!");
            }
        // });
    }
}