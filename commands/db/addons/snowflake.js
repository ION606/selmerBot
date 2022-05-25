//THIS CODE WAS TAKEN FROM https://github.com/vegeta897/snow-stamp/blob/main/src/convert.js

const DISCORD_EPOCH = 1420070400000

// Converts a snowflake ID string into a JS Date object using the provided epoch (in ms), or Discord's epoch if not provided
function convertSnowflakeToDate(snowflake, epoch = DISCORD_EPOCH) {
	// Convert snowflake to BigInt to extract timestamp bits
	// https://discord.com/developers/docs/reference#snowflakes
	const milliseconds = BigInt(snowflake) >> 22n
	return new Date(Number(milliseconds) + epoch);
}

// Validates a snowflake ID string and returns a JS Date object if valid
function validateSnowflake(snowflake, epoch) {
	if (!Number.isInteger(+snowflake)) {
		throw new Error(
			"That doesn't look like a snowflake. Snowflakes contain only numbers."
		)
	}

	if (snowflake < 4194304) {
		throw new Error(
			"That doesn't look like a snowflake. Snowflakes are much larger numbers."
		)
	}

	const timestamp = convertSnowflakeToDate(snowflake, epoch)

	if (Number.isNaN(timestamp.getTime())) {
		throw new Error(
			"That doesn't look like a snowflake. Snowflakes have fewer digits."
		)
	}

	return timestamp
}

module.exports = { convertSnowflakeToDate, validateSnowflake }




/*

//TEST FUNCTION BY ION606 (for Discord ONLY)
async function TEST_FUNC(message) {
    let mid = message.reference.messageId;
    let msg = await message.channel.messages.fetch(mid);
    let snowflake = require("./commands/db/addons/snowflake.js");
    let prev = snowflake.convertSnowflakeToDate(msg.id);
    let now = snowflake.convertSnowflakeToDate(message.id);
    let diff = now - prev;
    var minutes = Math.floor((diff / 1000) / 60);
    console.log(diff, minutes);
    return { diff, minutes };
}


*/