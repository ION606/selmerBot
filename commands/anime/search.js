const scraper = require('mal-scraper');
module.exports = {
    name: 'search',
    description: 'Selmer bot gives you either an explanation or a list of stats',
    async execute() {
        scraper.getInfoFromName('Fullmetal Alchemist').then((data) => {
            //If the user didn't specify, give a stat list
            if (args.length < 1) {
                let s = `Title: ${s.title}\n`;
                s += ``
            } else if (args[0] != 'full') {
                
            } else {

            }
        });
    }
}