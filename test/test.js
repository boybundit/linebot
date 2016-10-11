'use strict';

var assert = require('assert');
var linebot = require('../index.js');

var bot = linebot({
	channelId: process.env.CHANNEL_ID,
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

describe('linebot', function () {
	describe('GET POST METHODS', function () {

		it('should have a get method that returns a promise.', function () {
			var res = bot.get('a/random/path');
			assert.equal(Promise, res.constructor)
		});

		it('should have a post method that returns a promise.', function () {
			var body = {
				head: 'This is the head of the body. Do you not like it?'
			}
			var res = bot.post('a/random/path', body);
			assert.equal(Promise, res.constructor)
		});
	});
});
