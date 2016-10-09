'use strict';

var linebot = require('../index.js');
var bot = linebot({
	channelId: process.env.CHANNEL_ID,
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

bot.on('message', function (event) {
	bot.reply(event, event.message).then(function (data) {
		//console.log('OK', data);
	}).catch(function(error) {
		//console.log('ERROR', error);
	});
});

bot.listen('/linewebhook', process.env.PORT || 80, function () {
	console.log('LineBot is running.');
});
