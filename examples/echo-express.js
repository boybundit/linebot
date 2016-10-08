'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var linebot = require('../index.js');

var app = express();
app.use(bodyParser.json());

var bot = linebot({
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.ACCESS_TOKEN
});

bot.on('message', function (event) {
	//console.log(event);
	bot.reply(event, event.message).then(function (data) {
		//console.log('OK', data);
	}).catch(function(error) {
		//console.log('ERROR', error);
	});
});

app.post('/linewebhook', function (req, res) {
	bot.parse(req.body, req.get('X-Line-Signature'));
	res.json({});
});

app.listen(process.env.PORT || 80, function () {
	console.log('Running');
});
