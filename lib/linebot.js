'use strict';

const EventEmitter = require('events');
const fetch = require('node-fetch');
const crypto = require('crypto');
const express = require('express');
const bodyParser = require('body-parser');

class LineBot extends EventEmitter {
	
	constructor(options) {
		super();
		this.options = options || {};
		this.options.channelSecret = options.channelSecret || '';
	}
	
	validate(body, signature) {
		var str = JSON.stringify(body),
			hash = crypto.createHmac('sha256', this.options.channelSecret).update(str).digest('base64');
		console.log(signature);
		console.log(hash);
		console.log(hash === signature);
		return hash === signature;
	}
	
	parse(body) {
		//console.log(body);
		if (!body || !body.events) {
			return;
		}
		body.events.forEach(function (event) {
			this.emit(event.type, event);
		}, this);
	}
	
	reply(event, message) {
		var headers = {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + this.options.channelAccessToken
		},
		body = {
			replyToken: event.replyToken,
			messages: [message]
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
			this.validate(req.body, req.get('X-Line-Signature'));
			this.parse(req.body);
			return res.json({ ok: true});
		});
		return app.listen(process.env.PORT || 80, callback);
	}

}

function createBot(options) {
	return new LineBot(options);
}

module.exports = createBot;
module.exports.LineBot = LineBot;
