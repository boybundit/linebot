'use strict';

const EventEmitter = require('events');
const fetch = require('node-fetch');
const express = require('express');
const bodyParser = require('body-parser');

class LineBot extends EventEmitter {
	
	constructor(options = {}) {
		super();
		this.options = options;
	}
	
	parse(body, signature) {
		console.log(body);
		if (!body || !body.events) {
			return;
		}
		body.events.forEach((event) => {
			this.emit(event.type, event);
		});
	}
	
	reply(event, text) {
		var headers = {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + this.options.accessToken
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
		return fetch('https://api.line.me/v2/bot/message/reply', { method: 'POST', headers: headers, body: JSON.stringify(body) })
	}
	
	// Optional builit-in express app
	listen(path, port, callback) {
		var app = express();
		app.use(bodyParser.json());
		app.post(path, (req, res) => {
			this.parse(req.body, req.get('X-Line-Signature'));
			return res.json({});
		});
		app.listen(process.env.PORT || 80, callback);
	}
}

function createBot(options) {
	return new LineBot(options);
}

module.exports = createBot;
module.exports.LineBot = LineBot;
