//Remember to strip all non-alpha chars from string (including ' )

wordlist = {
    pay: ['pay me', 'give me money', 'send money', 'send me money', 'send cash', 'PayPal me', 'venmo me', 'cashapp me', 'cash app me'],
    name: ['what is your name', 'whats your name', 'what are you called']
}


function checkResponses(convoOG, answer) {
    if (answer.indexOf("I'm sorry, I can't do that") == -1) { console.log('what?'); return 'none'}
    // remove all uneccesary chars
    convo = convoOG.replace(/\W/g, ' ').toLowerCase();

    var b = 'none';
    wordlist.name.forEach((w) => { if (convo.includes(w)) { b = 'name'; return }})
    wordlist.pay.forEach((w) => { if (convo.includes(w)) { b = 'pay'; return }})

    if (b === 'pay') {
        //Exctract the number
        var amt = convoOG.match(/(\d+)/)[0];
        
        
        if (matches) {
            currency = convoOG[convoOG.indexOf(amt) - 1];
            //Do something with pay API to get the amount here
        }
    } else if (b == 'name') {
        return 'My name is Selmer Bot!';
    } else { return null; }

    return b;
}

module.exports = { checkResponses }