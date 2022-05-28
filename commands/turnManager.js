//THESE STRUCTURES SUPPORTS TWO PLAYERS ONLY!!!!



//Determines who's turn it currently is
function getTurn(client, bot, interaction) {
    return new Promise(function(resolve, reject) {

        const db = client.db('B|S' + bot.user.id);
        const dbo = db.collection(interaction.member.guild.id);
        let id = interaction.user.id;
        
        //Check if you're in the right thread
        // dbo.find({thread: {$exists: true}}).toArray(function(err, docs) {
        //     if (docs[0].thread) {}
        // });

        dbo.find({$or: [ {0: id}, {1: id} ]}).toArray(function(err, docs) {
            if (err) { console.log(err); }
            
            const doc = docs[0];
            const turn = String(doc.turn);

//#TODO     Optimize this somehow.........
            let currentuser;
            for (const [key, value] of Object.entries(doc)) {
                if (key == turn) { currentuser = value; break; }
            }

            //Return statement?
            // throw "NO";
            resolve([currentuser, doc]);
        });
    });
}


function changeTurn(client, bot, interaction) {
    const db = client.db('B|S' + bot.user.id);
    const dbo = db.collection(interaction.member.guild.id);
    dbo.find({turn: {$exists: true}}).toArray(function (err, docs) {
        let turn = docs[0].turn;
        turn = Number(!turn);
        dbo.updateOne(docs[0], {$set: {turn: turn}});
    });
}


module.exports = { getTurn, changeTurn }