'use strict';

const EventEmitter = require('events');
const fetch = require('node-fetch');
const crypto = require('crypto');
const http = require('http');
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
		this.headers = {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: 'Bearer ' + this.options.channelAccessToken
		};
		this.endpoint = 'https://api.line.me/v2/bot';
	}

	verify(rawBody, signature) {
		const hash = crypto.createHmac('sha256', this.options.channelSecret)
			.update(rawBody, 'utf8')
			.digest('base64');
		return hash === signature;
	}

	parse(body) {
		const that = this;
		if (!body || !body.events) {
			return;
		}
		body.events.forEach(function (event) {
			event.reply = function (message) {
				return that.reply(event.replyToken, message);
			};
			if (event.source) {
				event.source.profile = function () {
					return that.getUserProfile(event.source.userId);
				};
			}
			if (event.message) {
				event.message.content = function () {
					return that.getMessageContent(event.message.id);
				};
			}
			process.nextTick(function () {
				that.emit(event.type, event);
			});
		});
	}

	static createMessages(message) {
		if (typeof message === 'string') {
			return [{ type: 'text', text: message }];
		}
		if (Array.isArray(message)) {
			return message.map(function (m) {
				if (typeof m === 'string') {
					return { type: 'text', text: m };
				}
				return m;
			});
		}
		return [message];
	}

	reply(replyToken, message) {
		const body = {
			replyToken: replyToken,
			messages: LineBot.createMessages(message)
		};
		return this.post('/message/reply', body).then(function (res) {
			return res.json();
		});
	}

	push(to, message) {
		if (Array.isArray(to)) {
			return Promise.all(to.map(recipient => this.push(recipient, message)));
		}
		const body = {
			to: to,
			messages: LineBot.createMessages(message)
		};
		return this.post('/message/push', body).then(function (res) {
			return res.json();
		});
	}

	multicast(to, message) {
		const body = {
			to: to,
			messages: LineBot.createMessages(message)
		};
		return this.post('/message/multicast', body).then(function (res) {
			return res.json();
		});
	}

	getUserProfile(userId) {
		return this.get('/profile/' + userId).then(function (res) {
			return res.json();
		});
	}

	getMessageContent(messageId) {
		return this.get('/message/' + messageId + '/content/').then(function (res) {
			return res.buffer();
		});
	}

	leaveGroup(groupId) {
		return this.post('/group/' + groupId + '/leave/').then(function (res) {
			return res.json();
		});
	}

	leaveRoom(roomId) {
		return this.post('/room/' + roomId + '/leave/').then(function (res) {
			return res.json();
		});
	}

	get(path) {
		return fetch(this.endpoint + path, { method: 'GET', headers: this.headers });
	}

	post(path, body) {
		return fetch(this.endpoint + path, { method: 'POST', headers: this.headers, body: JSON.stringify(body) });
	}

	// Optional Express.js middleware
	parser() {
		const parser = bodyParser.json({
			verify: function (req, res, buf, encoding) {
				req.rawBody = buf.toString(encoding);
			}
		});
		return (req, res) => {
			parser(req, res, () => {
				if (this.options.verify && !this.verify(req.rawBody, req.get('X-Line-Signature'))) {
					return res.sendStatus(400);
				}
				this.parse(req.body);
				return res.json({});
			});
		};
	}

	// Optional built-in http server
	listen(path, port, callback) {
		const parser = bodyParser.json({
			verify: function (req, res, buf, encoding) {
				req.rawBody = buf.toString(encoding);
			}
		});
		const server = http.createServer((req, res) => {
			const signature = req.headers['x-line-signature']; // Must be lowercase
			res.setHeader('X-Powered-By', 'linebot');
			if (req.method === 'POST' && req.url === path) {
				parser(req, res, () => {
					if (this.options.verify && !this.verify(req.rawBody, signature)) {
						res.statusCode = 400;
						res.setHeader('Content-Type', 'text/html; charset=utf-8');
						return res.end('Bad request');
					}
					this.parse(req.body);
					res.statusCode = 200;
					res.setHeader('Content-Type', 'application/json');
					return res.end('{}');
				});
			} else {
				res.statusCode = 404;
				res.setHeader('Content-Type', 'text/html; charset=utf-8');
				return res.end('Not found');
			}
		});
		return server.listen(port, callback);
	}

} // class LineBot

function createBot(options) {
	return new LineBot(options);
}

module.exports = createBot;
module.exports.LineBot = LineBot;
