'use strict';

var linebot = require('linebot');
var express = require('express');
var bodyParser = require('body-parser');

var bot = linebot({
	channelId: process.env.CHANNEL_ID,
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

var app = express();

var parser = bodyParser.json({
	verify: function(req, res, buf, encoding) {
		req.rawBody = buf.toString(encoding);
	}
});

app.post(path, parser, (req, res) => {
	if (!this.verify(req.rawBody, req.get('X-Line-Signature'))) {
		return res.sendStatus(400);
	}
	this.parse(req.body);
	return res.json({});
});

bot.on('message', function (event) {
	event.reply(event.message.text).then(function (data) {
		// success
	}).catch(function(error) {
		// error
	});
});

app.listen(process.env.PORT || 80, function () {
	console.log('LineBot is running.');
});
