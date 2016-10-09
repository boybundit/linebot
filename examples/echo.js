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
			switch (event.message.text) {
				case 'who am i':
					event.source.profile().then(function (profile) {
						return event.reply('Hello ' + profile.displayName);
					});
					break;
				case 'show picture':
					event.reply({
						type: 'image',
						originalContentUrl: 'https://d.line-scdn.net/stf/line-lp/family/en-US/190X190_line_me.png',
						previewImageUrl: 'https://d.line-scdn.net/stf/line-lp/family/en-US/190X190_line_me.png'
					});
					break;
				default:
					event.reply(event.message.text).then(function (data) {
						//console.log('OK', data);
					}).catch(function(error) {
						//console.log('ERROR', error);
					});
					break;
			}
			break;
		case 'image':
			event.message.content().then(function (data) {
				var s = data.toString('base64').substring(0, 30);
				return event.reply('Nice picture! ' + s);
			}).catch(function (err) {
				return event.reply(err.toString());
			});
			break;
		case 'video':
			return event.reply('Nice movie!');
			break;
		case 'audio':
			return event.reply('Nice song!');
			break;
		case 'location':
			return event.reply('That\'s a good location!');
			break;
		case 'sticker':
			return event.reply({
				type: 'sticker',
				packageId: 1,
				stickerId: 1
			});
			break;
		default:
			return event.reply('Unknow message: ' + JSON.stringify(event));
			break;
	}
});

bot.listen('/linewebhook', process.env.PORT || 80, function () {
	console.log('LineBot is running.');
});
