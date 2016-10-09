'use strict';

var linebot = require('../index.js');
var bot = linebot({
	channelId: process.env.CHANNEL_ID,
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
	verify: false // default=true
});

bot.on('message', function (event) {
	//console.log(JSON.stringify(event));
	//return bot.reply(event, JSON.stringify(event));
	switch (event.message.type) {
		case 'text':
			if (event.message.text === 'image') {
				return bot.reply(event, {
					type: 'image',
					originalContentUrl: 'https://d.line-scdn.net/stf/line-lp/family/en-US/190X190_line_me.png',
					previewImageUrl: 'https://d.line-scdn.net/stf/line-lp/family/en-US/190X190_line_me.png'
				});
			}
			bot.reply(event, event.message.text).then(function (data) {
				//console.log('OK', data);
			}).catch(function(error) {
				//console.log('ERROR', error);
			});
			break;
		case 'image':
			event.message.content().then(function (data) {
				var s = data.toString('base64').substring(0, 30);
				return bot.reply(event, 'Nice picture! ' + s);
			}).catch(function (err) {
				return bot.reply(event, err.toString());
			});
			break;
		case 'video':
			return bot.reply(event, 'Nice movie!');
			break;
		case 'audio':
			return bot.reply(event, 'Nice song!');
			break;
		case 'location':
			return bot.reply(event, 'That\'s a good location!');
			break;
		case 'sticker':
			return bot.reply(event, {
				type: 'sticker',
				packageId: 1,
				stickerId: 1
			});
			break;
		default:
			return bot.reply(event, 'Unknow message: ' + JSON.stringify(event));
			break;
	}
});

bot.listen('/linewebhook', process.env.PORT || 80, function () {
	console.log('LineBot is running.');
});
