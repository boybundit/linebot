/*jslint node: true, es5: true*/

'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var fetch = require('node-fetch');

var app = express();
app.use(bodyParser.json());

app.get('/', function (req, res) {
	res.send('Hello World!');
});

app.post('/linewebhook', function (req, res) {
	console.log(req.body);
	var headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'Authorization': 'Bearer ' + process.env.ACCESS_TOKEN
	},
		body = {
			replyToken: req.body.events[0].replyToken,
			messages: [
				{
					type: "text",
					text: "Hello, user"
				}
			]
		};
	console.log(headers);
	console.log(body);
	fetch('https://api.line.me/v2/bot/message/reply', { method: 'POST', headers: headers, body: JSON.stringify(body) })
		.then(function (res) {
			console.log('Success');
			console.log(res);
			return res.json({});
		})
		.catch(function (err) {
			console.log('Error');
			console.log(err);
			return res.json({});
		});
});

app.listen(process.env.PORT || 80, function () {
	console.log('Running');
});
