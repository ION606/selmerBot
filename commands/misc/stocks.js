const { Constants, MessageEmbed, Interaction } = require('discord.js');

const dateFns = require('date-fns');
const { formatToTimeZone } = require('date-fns-timezone');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const apiKeyId = process.env.alpKey || require('../../config.json').alpKey;
const secretKey = process.env.alpSec || require('../../config.json').alpSec;
const alpaca = new Alpaca({
    keyId: apiKeyId,
    secretKey: secretKey,
    paper: true,
    usePolygon: false
});

//This is the same as making the following request: https://data.alpaca.markets/v2/stocks/snapshots?symbols={stock_symbols_here}
async function getStockData(bot, interaction, stock, type, after) {
    try {
        const snapshotPromise = alpaca.getSnapshot(stock);

        snapshotPromise.then(snapshot => {
            const embd = new MessageEmbed()
                .setAuthor({ name: "Selmer Bot", url: "", iconURL: bot.user.displayAvatarURL() })
                .setFooter({ text: 'Selmer Bot uses Alpaca for stock information'})

            if (type) {
                const lt = snapshot.LatestTrade;
                embd.setTitle(`${stock} Latest Trade`)
                .setTimestamp(lt.Timestamp)
                .addFields(
                    {name: 'Price', value: `${lt.Price}`},
                    {name: 'Size', value: `${lt.Size}`},

                    //This will always be IEX, as it is the only exchange the free version offers
                    {name: 'Exchange', value: `IEX (${lt.Exchange})`},
                )
            } else if (type) {
                if (after) {
                    return interaction.reply("Due to the markets not being open, there is no quote data available!");
                }
                const lq = snapshot.LatestQuote;
                embd.setTitle(`${stock} Latest Quote`)
                .setTimestamp(lq.Timestamp)
                .addFields(
                    {name: 'Ask Price', value: `${lq.AskPrice}`},
                    {name: 'Ask Size', value: `${lq.AskSize}`},
                    {name: 'Bid price', value: `${lq.BidPrice}`},
                    {name: 'Bid Size', value: `${lq.BidSize}`},

                    //This will always be IEX, as it is the only exchange the free version offers
                    {name: 'Exchange', value: `IEX (${lq.Exchange})`},
                )
            } else if (type) {
                const mb = snapshot.MinuteBar;
                const db = snapshot.DailyBar;
                const pdb = snapshot.PrevDailyBar;
                embd.setTitle(`${stock} Bars`)
                .setTimestamp(mb.Timestamp)
                .addFields(
                    {name: 'Minute Bar', value: `Open Price: ${mb.OpenPrice},\nClose Price: ${mb.ClosePrice},\nHigh Price: ${mb.HighPrice},\nLow Price: ${mb.LowPrice},\nVolume: ${mb.Volume},\nCount: ${mb.TradeCount},\nVWAP: ${mb.VWAP}`},
                    {name: 'Day Bar (Today)', value: `Open Price: ${db.OpenPrice},\nClose Price: ${db.ClosePrice},\nHigh Price: ${db.HighPrice},\nLow Price: ${db.LowPrice},\nVolume: ${db.Volume},\nCount: ${db.TradeCount},\nVWAP: ${db.VWAP}`},
                    {name: 'Day Bar (Yesterday)', value: `Open Price: ${pdb.OpenPrice},\nClose Price: ${pdb.ClosePrice},\nHigh Price: ${pdb.HighPrice},\nLow Price: ${pdb.LowPrice},\nVolume: ${pdb.Volume},\nCount: ${pdb.TradeCount},\nVWAP: ${pdb.VWAP}`},
                )
            } else {
                return interaction.reply("The command format is: _/stocks <stock_name, 'hours'> <trade, quote, bars> [after]_");
            }

            interaction.reply({embeds: [embd]});
        })
    } catch(err) {
        console.error(err);
        interaction.reply("Uh Oh, there's been an error!");
    }
}

function getData(bot, interaction) {
    const args = interaction.options.data;
    const stock = args.filter((arg) => { return (arg.name == 'name')})[0].value;
    const type = args.filter((arg) => { return (arg.name == 'type')})[0].value;
    const after = (args.length > 2 && args.filter((arg) => { return (arg.name == 'after')})[0].value);

    const format = `yyyy-MM-dd HH:mm:ss`;
    const date = dateFns.format(new Date(), format);

    alpaca.getClock().then((clock) => {
        // var txt = `The market is currently ${clock.is_open ? 'open.' : 'closed.'}`;

        alpaca.getCalendar({
            start: date,
            end: date
        }).then((calendars) => {
            let temp;
            if (clock.is_open || after) {
                if (stock == 'hours') {
                    temp = `The markets opened at ${calendars[0].open} and will close at ${calendars[0].close} on ${date}.`;
                    return interaction.reply(temp);
                }
                getStockData(bot, interaction, stock, type, after);
            } else {
                // `The market is currently ${clock.is_open ? 'open.' : 'closed.'}`
                //May be innacurate?
                temp = `_The markets closed at \`${calendars[0].close}\` and will open again at \`${calendars[0].open}\` on \`${dateFns.format((new Date()).setDate(new Date().getDate() + 1), 'yyyy-MM-dd')}\`.\nTo get the last snapshot before market closure, add the \`after\` keyword to the end of your command (trade and bars ONLY), ex: /stocks GOOG bars after_`;
                return interaction.reply(temp);
            }
        });
    })
}


//!stocks <stock_name, "hours"> <trade, quote, bars> [after]
module.exports = {
    name: 'stocks',
    description: "Have Selmer Bot give you \"current\" stock prices",
    async execute(interaction, Discord, Client, bot) {
        getData(bot, interaction);
    },
    options: [
        {name: 'name', description: 'the stock name or "hours" for market hours', type: Constants.ApplicationCommandOptionTypes.STRING, required: true},
        {name: 'type', description: 'The type of data to present', type: Constants.ApplicationCommandOptionTypes.STRING, required: true, choices: [ { name: 'trade', value: 'trade' }, { name: 'quote', value: 'quote' }, {name: 'bars', value: 'bars'}]},
        {name: 'after', description: 'If the markets are closed, get the last entry', type: Constants.ApplicationCommandOptionTypes.BOOLEAN, required: false},
    ]
}