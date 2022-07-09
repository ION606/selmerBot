//THESE STRUCTURES SUPPORTS TWO PLAYERS ONLY!!!!

const { STATE } = require("./db/econ");



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
        let turnnumer = docs[0].turn;
        turnnumer = Number(!turnnumer);

        //Check for prone, and change it if necessary
        let turnInfo = getTurn(client, bot, interaction);

        turnInfo.then(id = (turn => {
            var id;
            // console.log(turn); throw 1;
            for (const [key, value] of Object.entries(turn[1])) {
                if (key == turnnumer) { id = value; break; }
            }
            

            const other_dbo = client.db(interaction.member.guild.id).collection(id);

            other_dbo.find({'state': {$exists: true}}).toArray((err, docs) => {
                //If the person was prone, skip their turn
                if (docs[0].state == STATE.PRONE) {
                    dbo.updateOne({'turn': {$exists: true}}, {$set: {state: STATE.FIGHTING}});
                } else {
                    dbo.updateOne({'turn': {$exists: true}}, {$set: {turn: turnnumer}});
                }
            });
        }))
    });
}


module.exports = { getTurn, changeTurn }