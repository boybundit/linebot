'use strict';

var linebot = require('../index.js');
var bot = linebot({
	channelId: process.env.CHANNEL_ID,
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

bot.on('message', function (event) {
	if (event.message.type === 'text') {
		if (event.message.text === 'image') {
			return bot.reply(event, {
				type: 'image',
				originalContentUrl: 'https://d.line-scdn.net/stf/line-lp/family/en-US/190X190_line_me.png',
				previewImageUrl: 'https://d.line-scdn.net/stf/line-lp/family/en-US/190X190_line_me.png'
			});
		}
		bot.reply(event, event.message.text).then(function (data) {
			console.log('OK', data);
		}).catch(function(error) {
			console.log('ERROR', error);
		});
	} else if (event.message.type === 'image') {
		return bot.reply(event, 'Nice picture!');
	} else if (event.message.type === 'video') {
		return bot.reply(event, 'Nice movie!');
	} else if (event.message.type === 'audio') {
		return bot.reply(event, 'Nice song!');
	} else if (event.message.type === 'location') {
		return bot.reply(event, 'That\'s a good location!');
	} else if (event.message.type === 'sticker') {
		return bot.reply(event, {
			type: 'sticker',
			packageId: 1,
			stickerId: 1
		});
	}
});

bot.listen('/linewebhook', process.env.PORT || 80, function () {
	console.log('LineBot is running.');
});
