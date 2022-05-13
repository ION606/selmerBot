const { top } = require('./all_time_top_anime');

module.exports = {
    name: 'anime',
    description: 'a-anime....',
    execute(command, message, args, bot) {
        switch(command) {
            case 'topanime': top.execute(message, args);
            break;
        }
    }
}