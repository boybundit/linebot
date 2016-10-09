'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var linebot = require('../index.js');

var app = express();

var parser = bodyParser.json({
	verify: function(req, res, buf, encoding) {
		req.rawBody = buf.toString(encoding);
	}
});

var bot = linebot({
	channelId: process.env.CHANNEL_ID,
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

app.post(path, parser, (req, res) => {
	if (!this.verify(req.rawBody, req.get('X-Line-Signature'))) {
		return res.sendStatus(400);
	}
	this.parse(req.body);
	return res.json({});
});

bot.on('message', function (event) {
	bot.reply(event, event.message).then(function (data) {
		console.log('OK', data);
	}).catch(function(error) {
		console.log('ERROR', error);
	});
});

app.listen(process.env.PORT || 80, function () {
	console.log('LineBot is running.');
});
