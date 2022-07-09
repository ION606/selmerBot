function checkRole(bot, guild, userId) {
    const role = guild.roles.cache.find((role) => { return (role.name == 'Selmer Bot Commands'); })
    const user = guild.members.cache.get(userId);

    return (user.roles.cache.get(role.id) || user.id == guild.ownerId || bot.inDebugMode);


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



module.exports = { checkRole }