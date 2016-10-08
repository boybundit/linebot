'use strict';

const EventEmitter = require('events');
const fetch = require('node-fetch');
var express = require('express');
var bodyParser = require('body-parser');

class LineBot extends EventEmitter {
	
	constructor(options) {
		super();
		this.options = options;
	}
	
	parse(body, signature) {
		//console.log(body);
		if (!body || !body.events) {
			return;
		}
		body.events.forEach(function (event) {
			this.emit(event.type, event);
		}, this);
	}
	
	reply(event, text) {
		var headers = {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + this.options.channelAccessToken
		},
		body = {
			replyToken: event.replyToken,
			messages: [
				{
					type: 'text',
					text: text
				}
			]
		};
		console.log(headers);
		console.log(body);
		return fetch('https://api.line.me/v2/bot/message/reply', { method: 'POST', headers: headers, body: JSON.stringify(body) })
	}
	
	// Optional built-in Express app
	listen(path, port, callback) {
		var app = express();
		app.use(bodyParser.json());
		app.post(path, (req, res) => {
			this.parse(req.body, req.get('X-Line-Signature'));
			res.json({});
		});
		app.listen(process.env.PORT || 80, callback);
	}

}

function createBot(options) {
	return new LineBot(options);
}

module.exports = createBot;
module.exports.LineBot = LineBot;
