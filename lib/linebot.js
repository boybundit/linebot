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
		return hash === signature;
	}
	
	parse(body) {
		var that = this;
		var headers = {
			'Accept': 'application/json',
			'Content-Type': 'application/json',
			'Authorization': 'Bearer ' + /*this.options.channelAccessToken*/ 'gRI9J+Rta1aNKAunotpLPNkpmiXFr92+d3zvt5yu8KPT9wcZb3ls7Cr2a7kNr03l1qeMNWZOM94fNgkWx4amoxH/aISig/ME07JlIGmsAuj0RMldvZov3jN+4Zedom28WOmjv2gjINjTyl72c/4TfgdB04t89/1O/w1cDnyilFU='
		};
		if (!body || !body.events) {
			return;
		}
		body.events.forEach(function (event) {
			if (event.type === 'message' && typeof event.source === 'object' && event.source.type === 'user') {
				fetch('https://api.line.me/v2/bot/profile/' + event.source.userId, { method: 'GET', headers: headers }).then(function (res) {
					return res.json();
				}).then(function (json) {
					event.source.profile = json;
					return that.emit(event.type, event);
				}).catch(function(err) {
					console.log(err);
				});;
				return;
			}
			return that.emit(event.type, event);
		});
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
			if (this.options.verify && !this.verify(req.rawBody, req.get('X-Line-Signature'))) {
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
