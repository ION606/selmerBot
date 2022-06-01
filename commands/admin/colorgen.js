function randomHexColor() {
    var letters = "0123456789ABCDEF";

    // html color code starts with #
    var randomcol = '#';

    // generating 6 times as HTML color code consist
    // of 6 letter or digits
    for (var i = 0; i < 6; i++)
        randomcol += letters[(Math.floor(Math.random() * 16))];
    
    return randomcol;
}

module.exports = { randomHexColor }