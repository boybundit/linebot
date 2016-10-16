const assert = require('assert');
const linebot = require('../index.js');

const bot = linebot({
	channelId: process.env.CHANNEL_ID,
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

const req = {};
req.body = {
	events: [{
		replyToken: 'nHuyWiB7yP5Zw52FIkcQobQuGDXCTA',
		type: 'message',
		timestamp: 1462629479859,
		source: {
			type: 'user',
			userId: 'U206d25c2ea6bd87c17655609a1c37cb8'
		},
		message: {
			id: '325708',
			type: 'text',
			text: 'Hello, world'
		}
	}]
};
req.rawBody = JSON.stringify(req.body);

describe('linebot', function () {
	describe('#constructor()', function () {
		it('should create a new LineBot instance.', function () {
			assert.equal(linebot.LineBot, bot.constructor);
		});
		it('should have options as specified.', function () {
			assert.equal(bot.options.verify, true);
		});
	});
	describe('#verify()', function () {
		it('should return true when the signature is correct.', function () {
			const res = bot.verify(req.rawBody, '/WxKL7xCHe0yh0+lGW5Bev10kxKIAHziPgLkkqXSdWE=');
			assert.equal(res, true);
		});
		it('should return false when the signature is incorrect.', function () {
			const res = bot.verify(req.rawBody, 'random signature');
			assert.equal(res, false);
		});
	});
	describe('#reply()', function () {
		it('should return a promise.', function () {
			const res = bot.reply('reply token', 'message');
			assert.equal(Promise, res.constructor);
		});
	});
	describe('#get()', function () {
		it('should have a get method that returns a promise.', function () {
			const res = bot.get('a/random/path');
			assert.equal(Promise, res.constructor);
		});
	});
	describe('#post()', function () {
		it('should have a post method that returns a promise.', function () {
			const body = {
				head: 'This is the head of the body. Do you not like it?'
			};
			const res = bot.post('a/random/path', body);
			assert.equal(Promise, res.constructor);
		});
	});
});
