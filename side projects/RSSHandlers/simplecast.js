class simpleCast {
    constructor(data, url) {
        this.title = data.title;

        if (data['itunes:summary']) {
            this.description = data['itunes:summary']['#'];
        } else {
            //<p>......<p>
            this.description = data.description.substring(3, s.indexOf('<p>', 4));
        }

        var audio = data.enclosures.filter((entry) => { return (entry.type.indexOf('audio') != -1) });
        if (audio.length > 0) {
            this.audioLink = audio[0].url;
        } else { console.log("What?"); }
        this.url = url;

        this.thumbnal = data.meta.image.url;
    }
}


module.exports = { simpleCast }