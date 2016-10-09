'use strict';

var linebot = require('../index.js');
var bot = linebot({
	channelId: process.env.CHANNEL_ID,
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	verify: false // default=true
});

bot.on('message', function (event) {
	event.reply(event.message.text).then(function (data) {
		// success
	}).catch(function(error) {
		// error
	});
});

bot.listen('/linewebhook', process.env.PORT || 80, function () {
	console.log('LineBot is running.');
});
