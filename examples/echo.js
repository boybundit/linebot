'use strict';

var linebot = require('../index.js');

var bot = linebot({
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.ACCESS_TOKEN
});

bot.on('message', function (event) {
	//console.log(event);
	bot.reply(event, event.message.text).then(function (data) {
		//console.log('OK', data);
	}).catch(function(error) {
		//console.log('ERROR', error);
	});
});

bot.listen('/linewebhook', process.env.PORT || 80, function () {
	console.log('LineBot is running.');
});
