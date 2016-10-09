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
		this.options.channelId = options.channelId || '';
		this.options.channelSecret = options.channelSecret || '';
		this.options.channelAccessToken = options.channelAccessToken || '';
		if (this.options.verify === undefined) {
			this.options.verify = true;
		}
	}
	
	verify(rawBody, signature) {
		var hash = crypto.createHmac('sha256', this.options.channelSecret).update(rawBody).digest('base64');
		console.log(signature);
		console.log(hash);
		console.log(hash === signature);
		return hash === signature;
	}
	
	parse(body) {
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
		body = { replyToken: event.replyToken };
		if (typeof message === 'string') {
			body.messages = [{ type: "text", text: message }];
		} else {
			body.messages = [message];
		}
		console.log(headers);
		console.log(body);
		return fetch('https://api.line.me/v2/bot/message/reply', { method: 'POST', headers: headers, body: JSON.stringify(body) })
	}
	
	// Optional built-in Express app
	listen(path, port, callback) {
		var app = express(),
			parser = bodyParser.json({
    			verify: function(req, res, buf, encoding) {
					req.rawBody = buf.toString(encoding);
				}
			});
		app.post(path, parser, (req, res) => {
			if (this.options.verify && !this.verfiy(req.rawBody, req.get('X-Line-Signature'))) {
				return res.sendStatus(400);
			}
			this.parse(req.body);
			return res.json({});
		});
		return app.listen(port, callback);
	}

} // class LineBot

function createBot(options) {
	return new LineBot(options);
}

module.exports = createBot;
module.exports.LineBot = LineBot;
