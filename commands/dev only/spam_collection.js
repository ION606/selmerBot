// EVERYTHING IN THIS FILE SHOULD BE ABLE TO RUN INDEPENDANTLY OF THE BOT


const Stripe = require('stripe');
const APIKey = process.env.APIKey // require('./config.json').APIKey;
const stripe = Stripe(APIKey);
const mongouri = process.env.APIKey // require('./config.json').mongooseURI;
const { MongoClient, ServerApiVersion } = require('mongodb');


function cleardb(db) {
    //Triggers about a week before the end of the month and clears out all the "spam" entries
    const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    new Promise(async function(resolve, reject) {
        client.connect(async (err) => {
            const dbo = client.db('main').collection(db);
            dbo.find({paid: false, tier: 0}).toArray((err, docs) => {
                if (err) { return console.log(err); }

                if (docs[0] != undefined) {
                    //Add them all to an array and resolve because deleting in a find() causes cyclic dependancies
                    resolve(docs);
                } else {
                    reject();
                }
            });
        });
    }).then((docs) => {
        const dbo = client.db('main').collection(db);
        const d = new Date().toUTCString();
        
        //Keep track of what was collected (chack later?)
        var newObj = {db: db, date: d, count: 0, results: []};

        docs.forEach(i => {
            //{discord id, stripe id}
            newObj.results.push({did: i.discordID, sid: i.stripeID});
            newObj.count ++;

            try {
                //For some reason, these aren't deleted in Stripe, just archived so they can't do anything new
                //See https://stripe.com/docs/api/customers/delete
                stripe.customers.del(i.stripeID);
            } catch (err) { console.log("err"); }
        });

        dbo.deleteMany({paid: false, tier: 0});

        //Add the newObj to another collection (ordered by date?)
        const spam_coll = client.db('main').collection("spam_collection_results");

        spam_coll.insertOne(newObj);
    }).catch((err) => { console.log('none'); });

    client.close();
}

module.exports = { cleardb }

//Does not include the day check, see the "selmer-bot-listener" app for that