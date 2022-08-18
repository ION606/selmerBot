const { Modal, TextInputComponent, MessageActionRow, MessageButton, MessageEmbed, Interaction } = require('discord.js');

const dateFns = require('date-fns');
const { formatToTimeZone } = require('date-fns-timezone');
const Alpaca = require('@alpacahq/alpaca-trade-api');
const apiKeyId = require('../../config.json').alpKey;
const secretKey = require('../../config.json').alpSec;
const alpaca = new Alpaca({
    keyId: apiKeyId,
    secretKey: secretKey,
    paper: true,
    usePolygon: false
});

//This is the same as making the following request: https://data.alpaca.markets/v2/stocks/snapshots?symbols={stock_symbols_here}
async function getStockData(bot, message, args, stock) {
    try {
        const snapshotPromise = alpaca.getSnapshot(stock);

        snapshotPromise.then(snapshot => {
            const embd = new MessageEmbed()
                .setAuthor({ name: "Selmer Bot", url: "", iconURL: bot.user.displayAvatarURL() })
                .setFooter({ text: 'Selmer Bot uses Alpaca for stock information'})

            if (args[1] == 'trade') {
                const lt = snapshot.LatestTrade;
                embd.setTitle(`${stock} Latest Trade`)
                .setTimestamp(lt.Timestamp)
                .addFields(
                    {name: 'Price', value: `${lt.Price}`},
                    {name: 'Size', value: `${lt.Size}`},

                    //This will always be IEX, as it is the only exchange the free version offers
                    {name: 'Exchange', value: `IEX (${lt.Exchange})`},
                )
            } else if (args[1] == 'quote') {
                if (args[2] == 'after') {
                    return message.reply("Due to the markets not being open, there is no quote data available!");
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
            } else if (args[1] == 'bars') {
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
                return message.reply("The command format is: _!stocks <stock_name, 'hours'> <trade, quote, bars> [after]_");
            }

            message.reply({embeds: [embd]});
        })
    } catch(err) {
        console.error(err);
        message.reply("Uh Oh, there's been an error!");
    }
}

function getData(bot, message, args) {
    var stock;
    if (args.length < 1) {
        return message.reply("Please specify a stock (ex: AAPL, GOOG, etc)")
    } else { stock = args[0];}


    const format = `yyyy-MM-dd HH:mm:ss`;
    const date = dateFns.format(new Date(), format);

    alpaca.getClock().then((clock) => {
        // var txt = `The market is currently ${clock.is_open ? 'open.' : 'closed.'}`;

        alpaca.getCalendar({
            start: date,
            end: date
        }).then((calendars) => {
            let temp;
            if (clock.is_open || args[2] == 'after') {
                if (args[0] == 'hours') {
                    temp = `The markets opened at ${calendars[0].open} and will close at ${calendars[0].close} on ${date}.`;
                    return message.reply(temp);
                }
                getStockData(bot, message, args, stock);
            } else {
                // `The market is currently ${clock.is_open ? 'open.' : 'closed.'}`
                //May be innacurate?
                temp = `_The markets closed at \`${calendars[0].close}\` and will open again at \`${calendars[0].open}\` on \`${dateFns.format((new Date()).setDate(new Date().getDate() + 1), 'yyyy-MM-dd')}\`.\nTo get the last snapshot before market closure, add the \`after\` keyword to the end of your command (trade and bars ONLY), ex: !stocks GOOG bars after_`;
                return message.reply(temp);
            }
        });
    })
}


//!stocks <stock_name, "hours"> <trade, quote, bars> [after]
module.exports = {
    name: 'stocks',
    description: "Have Selmer Bot give you \"current\" stock prices",
    async execute(message, args, Discord, Client, bot) {
        if (args[0] == 'help' || args.length < 1) {
            return message.reply("The command format is: _!stocks <stock_name, 'hours'> <trade, quote, bars> [after]_");
        }
        getData(bot, message, args);
    }
}