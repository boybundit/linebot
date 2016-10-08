'use strict';

const EventEmitter = require('events');
const fetch = require('node-fetch');

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
	
}

function createBot(options) {
	return new LineBot(options);
}

module.exports = createBot;
module.exports.LineBot = LineBot;
