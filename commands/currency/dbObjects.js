const Sequelize = require('sequelize');

/*
 * Make sure you are on at least version 5 of Sequelize! Version 4 as used in this guide will pose a security threat.
 * You can read more about this issue on the [Sequelize issue tracker](https://github.com/sequelize/sequelize/issues/7310).
 */

const sequelize = new Sequelize('database', 'username', 'password', {
	host: 'localhost',
	dialect: 'sqlite',
	logging: false,
	storage: 'database.sqlite',
});

const Users = require('./models/Users.js')(sequelize, Sequelize.DataTypes);
const CurrencyShop = require('./models/CurrencyShop.js')(sequelize, Sequelize.DataTypes);
const UserItems = require('./models/UserItems.js')(sequelize, Sequelize.DataTypes);

UserItems.belongsTo(CurrencyShop, { foreignKey: 'item_id', as: 'item' });

Reflect.defineProperty(Users.prototype, 'addItem', {
	/* eslint-disable-next-line func-name-matching */
	value: async function addItem(item, message, currency, numItems) {
		const userItem = await UserItems.findOne({
			where: { user_id: this.user_id, item_id: item.id },
		});
		
		//Makes it so you can only buy as many items as you can afford
		let numItemsFinal;
		let n = Math.floor(currency.getBalance(message.author.id)/item.cost);

		if (n > numItems) { numItemsFinal = numItems; }
		else { numItemsFinal = n; }

		currency.add(message.author.id, -(item.cost * numItemsFinal));

		if (userItem) {
			userItem.amount += numItemsFinal;
			userItem.save();
		} else {
			UserItems.create({ user_id: this.user_id, item_id: item.id, amount: numItemsFinal, icon: item.icon });
		}
		//console.log(numItemsFinal);
		return message.reply(`You bought ${numItemsFinal}  ${item.icon}  for \$${numItemsFinal * item.cost}. You have \$${currency.getBalance(message.author.id)} left.`);
	},
});

Reflect.defineProperty(Users.prototype, 'removeItem', {
	/* eslint-disable-next-line func-name-matching */
	value: async function removeItem(item, message, currency, ll, CurrencyShop) {
		const userItem = await UserItems.findOne({
			where: { user_id: this.user_id, item_id: item.id },
		});

		let val;
		if (userItem) {
			if (userItem.amount > 0 && ll > 0) {
				val = userItem.amount;
				let i = 0;
				
				val = userItem.amount;
				if (ll > val) { i = val; }
				else { i = ll; }

				userItem.amount -= i;
				userItem.save();
				currency.add(message.author.id, i * item.cost);
				
				if (userItem.amount <= 0) {
					//START
					const tagID = item.id;
					// equivalent to: DELETE from tags WHERE name = ?;
					const rowCount = await UserItems.destroy({ where: { item_id: tagID } });

					if (!rowCount) return message.reply('That tag doesn\'t exist.');
				}

				return message.reply(`You've sold ${i}  ${item.icon}  for \$${i * item.cost}!`);
			} else { return message.reply("You don't have this item!"); }
		} else { return message.reply("You don't have this item!");}		
	},
});

Reflect.defineProperty(Users.prototype, 'getItems', {
	/* eslint-disable-next-line func-name-matching */
	value: function getItems() {
		return UserItems.findAll({
			where: { user_id: this.user_id },
			include: ['item'],
		});
	},
});

module.exports = { Users, CurrencyShop, UserItems };
