module.exports = {
    name: 'extracredit',
    description: "Selmer Bot Dm's you for some *AHEM* extra credit",
    execute(interaction, Discord, Client, bot) {
        let dm;
        let num = Math.floor(Math.random() * 10);
        
        
        switch(num) {
            case 0: dm = 'Hello there, let me show you some...logic';
            break;

            case 1: dm = 'I think the sexiest part of a person is their brain';
            break;

            case 2: dm = 'Hey babe, wanna make some negative money?';
            break;

            case 3: dm = 'The AI is coming for you! Buy my book to find out how to stop them!';
            break;

            case 4: dm = 'Did you know I proved P=NP? The proof is on my password-encrypted tablet.\nPretty safe there I reckon';
            break;

            case 5: dm = 'I hate informal logic, but there\'s nothing informal about you!';
            break;

            case 6: dm = 'My book "A Modern Approach; Beginning Deductive Logic via HyperSlate®, Advanced" is now available online!';
            break;

            case 7: dm = 'HyperSlate is a flawless creation. I should know, I made it myself!';
            break;

            case 8: dm = 'Could a Robot Be a Bona Fide Hero? I think not! He\'s not me, after all!';
            break;

            case 9: dm = "Warning: Increasingly, the term ‘reasoning’ is used by some who don’t really do anything related to reasoning, as traditionally understood, to nonetheless label what they do. Fortunately, it’s easy to verify that some reasoning is that which is covered by formal logic: If the reasoning is explicit; links declarative statements or formulae together via explicit, abstract reasoning schemata or rules of inference (giving rise to at least explicit arguments, and often proofs); is surveyable and inspectable, and ultimately machine-checkable; then the reasoning in question is what formal logic is the science and engineering of. (An immediate consequence of the characteristics just listed is that AIs based on artificial neural networks don’t reason, ever.) In order to characterize /in/formal logic, one can remove from the previous sentence the requirements that the links must conform to explicit reasoning schemas or rules of inference, and machine-checkability. It follows that so-called informal logic would revolve around arguments, but not proofs. An excellent overview of informal logic, which will be completely ignored in this class, is provided in “Informal Logic” in the Stanford Encyclopedia of Philosophy. In this article, it’s made clear that, yes, informal logic concentrates on the nature and uses of argument. ";
            break;

            default: 'Logic kan redde menneskehten!';
            break;
        }

        // let ID = interaction.user.id;
        // message.client.users.fetch(ID).then(user => user.send(dm));
        interaction.user.send(dm);
        interaction.reply({content: "Extra Credit sent  😉", ephemeral: true});
    },
    options: []
}