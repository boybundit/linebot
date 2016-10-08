/*jslint node: true */
/*global describe, it */
'use strict';

var assert = require('assert');
var linebot = require('../index.js');

var bot = linebot({
	channelId: '[CHANNEL_ID]',
	channelSecret: '[CHANNEL_SECRET]',
	channelAccessToken: '[CHANNEL_ACCESS_TOKEN]'
});

describe('linebot', function () {
	describe('parse()', function () {
		it('should success', function () {
			bot.parse();
			assert.equal(-1, [1, 2, 3].indexOf(4));
		});
	});
});