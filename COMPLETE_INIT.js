let d = new Date();
const START = d.getTime();


resetShop = false;


if (resetShop) {
    const { MongoClient, ServerApiVersion } = require('mongodb');
    const mongouri = process.env.MONGODB_URI; //DO NOT RUN LOCALLY (no process.env)

    const client = new MongoClient(mongouri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
    let collectiontemp;
    client.connect(err => {
        collectiontemp = client.db("main").collection("shop");
        // perform actions on the collection object
        collectiontemp.insertMany(
        [
            { name: 'Grapes', cost: 2, icon: '🍇', sect: 'Food' },
            { name: 'Melon', cost: 5, icon: '🍈', sect: 'Food' },
            { name: 'Watermelon', cost: 5, icon: '🍉', sect: 'Food' },
            { name: 'Tangerine', cost: 3, icon: '🍊', sect: 'Food' },
            { name: 'Lemon', cost: 3, icon: '🍋', sect: 'Food' },
            { name: 'Banana', cost: 4, icon: '🍌', sect: 'Food' },
            { name: 'Pineapple', cost: 4, icon: '🍍', sect: 'Food' },
            { name: 'Mango', cost: 3, icon: '🥭', sect: 'Food' },
            { name: 'Red Apple', cost: 3, icon: '🍎', sect: 'Food' },
            { name: 'Green Apple', cost: 3, icon: '🍏', sect: 'Food' },
            { name: 'Pear', cost: 3, icon: '🍐', sect: 'Food' },
            { name: 'Peach', cost: 3, icon: '🍑', sect: 'Food' },
            { name: 'Cherries', cost: 4, icon: '🍒', sect: 'Food' },
            { name: 'Strawberry', cost: 3, icon: '🍓', sect: 'Food' },
            { name: 'Blueberries', cost: 3, icon: '🫐', sect: 'Food' },
            { name: 'Kiwi', cost: 3, icon: '🥝', sect: 'Food' },
            { name: 'Tomato', cost: 4, icon: '🍅', sect: 'Food' },
            { name: 'Olive', cost: 4, icon: '🫒', sect: 'Food' },
            { name: 'Coconut', cost: 3, icon: '🥥', sect: 'Food' },
            { name: 'Avocado', cost: 3, icon: '🥑', sect: 'Food' },
            { name: 'Eggplant', cost: 10, icon: '🍆', sect: 'Food' },
            { name: 'Potato', cost: 3, icon: '🥔', sect: 'Food' },
            { name: 'Carrot', cost: 3, icon: '🥕', sect: 'Food' },
            { name: 'Ear of Corn', cost: 3, icon: '🌽', sect: 'Food' },
            { name: 'Hot Pepper', cost: 3, icon: '🌶️', sect: 'Food' },
            { name: 'Bell Pepper', cost: 3, icon: '🫑', sect: 'Food' },
            { name: 'Cucumber', cost: 3, icon: '🥒', sect: 'Food' },
            { name: 'Leafy Green', cost: 3, icon: '🥬', sect: 'Food' },
            { name: 'Broccoli', cost: 2, icon: '🥦', sect: 'Food' },
            { name: 'Garlic', cost: 3, icon: '🧄', sect: 'Food' },
            { name: 'Onion', cost: 3, icon: '🧅', sect: 'Food' },
            { name: 'Mushroom', cost: 3, icon: '🍄', sect: 'Food' },
            { name: 'Peanuts', cost: 4, icon: '🥜', sect: 'Food' },
            { name: 'Chestnut', cost: 3, icon: '🌰', sect: 'Food' },
            { name: 'Bread', cost: 5, icon: '🍞', sect: 'Food' },
            { name: 'Croissant', cost: 7, icon: '🥐', sect: 'Food' },
            { name: 'Baguette Bread', cost: 10, icon: '🥖', sect: 'Food' },
            { name: 'Flatbread', cost: 9, icon: '🫓', sect: 'Food' },
            { name: 'Pretzel', cost: 5, icon: '🥨', sect: 'Food' },
            { name: 'Bagel', cost: 4, icon: '🥯', sect: 'Food' },
            { name: 'Pancakes', cost: 5, icon: '🥞', sect: 'Food' },
            { name: 'Waffle', cost: 5, icon: '🧇', sect: 'Food' },
            { name: 'Cheese Wedge', cost: 3, icon: '🧀', sect: 'Food' },
            { name: 'Meat on the Bone', cost: 5, icon: '🍖', sect: 'Food' },
            { name: 'Checken Leg', cost: 5, icon: '🍗', sect: 'Food' },
            { name: 'Cut of Meat', cost: 4, icon: '🥩', sect: 'Food' },
            { name: 'Bacon', cost: 4, icon: '🥓', sect: 'Food' },
            { name: 'Hamburger', cost: 5, icon: '🍔', sect: 'Food' },
            { name: 'French Fries', cost: 3, icon: '🍟', sect: 'Food' },
            { name: 'Pizza', cost: 6, icon: '🍕', sect: 'Food' },
            { name: 'Hot Dog', cost: 3, icon: '🌭', sect: 'Food' },
            { name: 'Sandwich', cost: 3, icon: '🥪', sect: 'Food' },
            { name: 'Taco', cost: 3, icon: '🌮', sect: 'Food' },
            { name: 'Burrito', cost: 5, icon: '🌯', sect: 'Food' },
            { name: 'Tamale', cost: 5, icon: '🫔', sect: 'Food' },
            { name: 'Stuffed Flatbread', cost: 5, icon: '🥙', sect: 'Food' },
            { name: 'Falafel', cost: 4, icon: '🧆', sect: 'Food' },
            { name: 'Egg', cost: 3, icon: '🥚', sect: 'Food' },
            { name: 'Hot Pot', cost: 12, icon: '🍲', sect: 'Food' },
            { name: 'Fondue', cost: 8, icon: '🫕', sect: 'Food' },
            { name: 'Green Salad', cost: 3, icon: '🥗', sect: 'Food' },
            { name: 'Popcorn', cost: 3, icon: '🍿', sect: 'Food' },
            { name: 'Butter', cost: 2, icon: '🧈', sect: 'Food' },
            { name: 'Salt', cost: 2, icon: '🧂', sect: 'Food' },
            { name: 'Canned Food', cost: 3, icon: '🥫', sect: 'Food' },
            { name: 'Bento Box', cost: 7, icon: '🍱', sect: 'Food' },
            { name: 'Rice Cracker', cost: 1, icon: '🍘', sect: 'Food' },
            { name: 'Rice Ball', cost: 3, icon: '🍙', sect: 'Food' },
            { name: 'Cooked Rice', cost: 3, icon: '🍚', sect: 'Food' },
            { name: 'Curry Rice', cost: 4, icon: '🍛', sect: 'Food' },
            { name: 'Ramen', cost: 4, icon: '🍜', sect: 'Food' },
            { name: 'Spaghetti', cost: 5, icon: '🍝', sect: 'Food' },
            { name: 'Roasted Sweet Potato', cost: 3, icon: '🍠', sect: 'Food' },
            { name: 'Oden', cost: 3, icon: '🍢', sect: 'Food' },
            { name: 'Sushi', cost: 4, icon: '🍣', sect: 'Food' },
            { name: 'Fried Shrimp', cost: 3, icon: '🍤', sect: 'Food' },
            { name: 'Fish Cake', cost: 3, icon: '🍥', sect: 'Food' },
            { name: 'Moon Cake', cost: 3, icon: '🥮', sect: 'Food' },
            { name: 'Dango', cost: 3, icon: '🍡', sect: 'Food' },
            { name: 'Dumpling', cost: 3, icon: '🥟', sect: 'Food' },
            { name: 'Fortune Cookie', cost: 3, icon: '🥠', sect: 'Food' },
            { name: 'Oyster', cost: 4, icon: '🦪', sect: 'Food' },
            { name: 'Ice Cream Cone', cost: 3, icon: '🍦', sect: 'Food' },
            { name: 'Shaved Ice', cost: 3, icon: '🍧', sect: 'Food' },
            { name: 'Ice Cream', cost: 3, icon: '🍨', sect: 'Food' },
            { name: 'Doughnut', cost: 3, icon: '🍩', sect: 'Food' },
            { name: 'Cookie', cost: 3, icon: '🍪', sect: 'Food' },
            { name: 'Birthday Cake', cost: 7, icon: '🎂', sect: 'Food' },
            { name: 'Shortcake', cost: 4, icon: '🍰', sect: 'Food' },
            { name: 'Cupcake', cost: 3, icon: '🧁', sect: 'Food' },
            { name: 'Pie', cost: 4, icon: '🥧', sect: 'Food' },
            { name: 'Chocolate Bar', cost: 2, icon: '🍫', sect: 'Food' },
            { name: 'Candy', cost: 1, icon: '🍬', sect: 'Food' },
            { name: 'Lollipop', cost: 1, icon: '🍭', sect: 'Food' },
            { name: 'Custard', cost: 3, icon: '🍮', sect: 'Food' },
            { name: 'Honey Pot', cost: 3, icon: '🍯', sect: 'Food' },
            { name: 'Baby Bottle', cost: 3, icon: '🍼', sect: 'Food' },
            { name: 'Glass of Milk', cost: 3, icon: '🥛', sect: 'Food' },
            { name: 'Coffee', cost: 3, icon: '☕', sect: 'Food' },
            { name: 'Teapot', cost: 3, icon: '🫖', sect: 'Food' },
            { name: 'Tea', cost: 3, icon: '🍵', sect: 'Food' },
            { name: 'Sake', cost: 3, icon: '🍶', sect: 'Food' },
            { name: 'Champagne', cost: 3, icon: '🍾', sect: 'Food' },
            { name: 'Wine Glass', cost: 3, icon: '🍷', sect: 'Food' },
            { name: 'Cocktail Glass', cost: 3, icon: '🍸', sect: 'Food' },
            { name: 'Tropical Drink', cost: 3, icon: '🍹', sect: 'Food' },
            { name: 'Beer Mug', cost: 3, icon: '🍺', sect: 'Food' },
            { name: 'Tumbler', cost: 3, icon: '🥃', sect: 'Food' },
            { name: 'Soda', cost: 3, icon: '🥤', sect: 'Food' },
            { name: 'Bubble Tea', cost: 3, icon: '🧋', sect: 'Food' },
            { name: 'Beverage Box', cost: 30, icon: '🧃', sect: 'Food' },
            { name: 'Mate', cost: 3, icon: '🧉', sect: 'Food' },
            
            //Weapons
            // { name: 'Swords_special', cost: 3, icon: '⚔️', sect: 'Weapons', double: false },
            { name: 'Boomerang', cost: 300, icon: '🪃', sect: 'Weapons', double: false, def: false },
            { name: 'Crossbow', cost: 200, icon: '🏹', sect: 'Weapons', double: true, def: false },
            { name: 'Knife', cost: 20, icon: '🔪', sect: 'Weapons', double: false, def: false },
            { name: 'Dagger', cost: 60, icon: '🗡', sect: 'Weapons', double: false, def: false },
            { name: 'Shield', cost: 100, icon: '🛡', sect: 'Weapons', double: false, def: true },
            { name: 'Axe', cost: 40, icon: '🪓', sect: 'Weapons', double: false, def: false },
            { name: 'Trident', cost: 140, icon: '🔱', sect: 'Weapons', double: false, def: false },
            { name: 'Scissors', cost: 10, icon: '✂️', sect: 'Weapons', double: false, def: false },

            //Potions (of varying sections)
            { name: 'HP Potion', cost: 20, icon: 'CUSTOM|healing_potion', sect: 'HP' },
            { name: 'MP Potion', cost: 15, icon: 'CUSTOM|mana_potion', sect: 'MP' },
            { name: 'Super HP Potion', cost: 50, icon: 'CUSTOM|superior_healing_potion', sect: 'HP' },
            { name: 'Super MP Potion', cost: 40, icon: 'CUSTOM|superior_mana_potion', sect: 'MP' }
            
        ]);
    });

    client.close().then(function() {
        const END = d.getTime();
        console.log(`Total time in SECONDS: ${(((END - START) % 60000) / 1000).toFixed(0)} ms!`);
    });
} else {
    console.log('To reset the main shop, please change the variable "resetShop" in the "COMPLETE_INIT.js" file to true');
}