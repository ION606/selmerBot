const { Formatters, MessageEmbed, Constants } = require('discord.js');
const CoinGecko = require('coingecko-api');
const CoinGeckoClient = new CoinGecko();

//#region Runs at the start to store all coins
const coinlist = new Map();
async function getAllCoins() {
    const coinlistraw = await CoinGeckoClient.coins.all();
    coinlistraw.data.forEach((coin) => {
        const obj = { id: coin.id, symbol: coin.symbol, name: coin.name, img: coin.image.small };
        coinlist.set(coin.symbol.toLowerCase(), obj);
    });
}
getAllCoins();
//#endregion

// Formatters.codeBlock
module.exports = {
    name: 'crypto',
    description: 'Get the prices for most cryptocurrencies!',
    async execute(interaction, Discord, Client, bot) {
        const args = interaction.options.data;
        if (args.length < 1 || args[0].value == 'help') {
            return interaction.reply("Please specify at least one cryptocurrency (_ex: !crypto BTC_) or list all currencies (_!crypto list_)");
        } else if (args[0].value == 'list') {
            try {
                return new Promise((resolve, reject) => {
                    let temp = "```Name --> Symbol\n\n";
                    coinlist.forEach((val, key) => {
                        temp += `${val.name} --> ${key.toUpperCase()}\n`;
                    });
                    temp += "```";
                    
                    resolve(temp);
                }).then((temp) => {
                    interaction.reply(temp);
                })
            } catch (err) {
                console.error(err);
                return interaction.reply("Uh Oh! There's been an error!");
            }
        }
        
        try {
            let data = await CoinGeckoClient.exchanges.fetchTickers('bitfinex', {
                coin_ids: ['bitcoin', 'ethereum', 'ripple', 'litecoin', 'stellar']
            });

            var datacc = data.data.tickers.filter(t => t.target == 'USD');

            const temp = datacc.filter(t => t.base == args[0].value);
            const res = temp.length == 0 ? [] : temp[0];

            //price: res.last, symbol: base, trust score: trust_score
            var obj = coinlist.get(res.base.toLowerCase());
            obj.price = res.last;
            obj.score = res.trust_score || "N/A";

            const embd = new MessageEmbed()
                .setTitle(obj.name)
                .setAuthor({ name: "Selmer Bot", url: "", iconURL: bot.user.displayAvatarURL() })
                .setFields(
                    {name: "Price", value: `$${obj.price}`},
                    {name: "Symbol", value: `${obj.symbol}`},
                    {name: "Trust Score", value: `${obj.score}`},
                )
                .setThumbnail(obj.img)
                .setTimestamp()
                .setFooter({ text: 'Selmer Bot uses CoinGecko for cryptocurrency information'});

                interaction.reply({ embeds: [embd] });
        } catch (err) {
            console.error(err);
            return interaction.reply("Uh Oh! There's been an error!");
        }
    },
    options: [{name: 'query', description: 'Name or List', type: Constants.ApplicationCommandOptionTypes.STRING, required: true}]
}