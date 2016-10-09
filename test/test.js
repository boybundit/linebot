'use strict';

var assert = require('assert');
var linebot = require('../index.js');

var bot = linebot({
	channelId: process.env.CHANNEL_ID,
	channelSecret: process.env.CHANNEL_SECRET,
	channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

describe('linebot', function () {
	describe('parse()', function () {
		it('should success', function () {
			// TODO
		});
	});
});
