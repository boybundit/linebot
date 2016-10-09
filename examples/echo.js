'use strict';

var linebot = require('../index.js');
var bot = linebot({
	channelId: process.env.CHANNEL_ID,
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

bot.on('message', function (event) {
	if (event.message.type === 'text') {
		bot.reply(event, event.message.text).then(function (data) {
			console.log('OK', data);
		}).catch(function(error) {
			console.log('ERROR', error);
		});
	} else if (event.message.type === 'image') {
		//bot.reply(event, 'Nice picture!');
		bot.reply(event, {
			type: 'image',
			originalContentUrl: 'https://d.line-scdn.net/stf/line-lp/family/en-US/190X190_line_me.png',
    		previewImageUrl: 'https://d.line-scdn.net/stf/line-lp/family/en-US/190X190_line_me.png'
		});
	}
});

bot.listen('/linewebhook', process.env.PORT || 80, function () {
	console.log('LineBot is running.');
});
