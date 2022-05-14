function checkRole(message, args) {
    let role = args[0];
    if (message.member.hasPermission('ADMINISTRATOR')) { return true; }

    /*Maybe implement this later, useless for now
    const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    client.connect(err => {


        const role = client.db(message.guild.id).collection("admin-roles");
        shop.find().toArray(function(err, itemstemp) {
            if (err) throw err;

            items = [...itemstemp];
            
            client.close();
        });
    });*/
}



module.exports = {name: 'verify', checkRole}