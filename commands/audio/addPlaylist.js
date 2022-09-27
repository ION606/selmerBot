const axios = require('axios');

/**
 * @param {String} purl 
 * @returns {Promise<Array<String>>}
 * 
 * @example
 * const purls = getPlaylistUrls(url);
 * purls.then((urls) => { console.log(urls); });
 */
async function getPlaylistUrls(bot, purl, isPremium) {
    const gApiKey = bot.youtubeAPIKey;
    const numSongs = (isPremium) ? 20 : 10;

    return new Promise(async (resolve, reject) => {
        try {
            const pid = (purl.split("list=")[1]).replace("&feature=share", "");
            await axios.get(`https://www.googleapis.com/youtube/v3/playlistItems`, {
                params: {
                    part: 'id,snippet',
                    maxResults: numSongs,
                    playlistId: pid,
                    key: gApiKey
                }
            })
            .then((result) => {
                const l = [];
                result.data.items.forEach((vid, ind) => {
                    const vurl = `https://www.youtube.com/watch?v=${vid.snippet.resourceId.videoId}`
                    const pvurl = `https://www.youtube.com/watch?v=${vid.snippet.resourceId.videoId}&list=${pid}&index=${ind+1}`
                    l.push({video_url: vurl, in_playlist_url: pvurl});
                });

                resolve(l);
            }).catch((err) => { reject(err.message); });
        } catch (err) {
            reject(err.message);
        }
    });
}


module.exports = { getPlaylistUrls }