const crypto = require('crypto');
const nock = require('nock');
const linebot = require('../index.js');
const assert = require('assert');

function randomUserId() {
  return 'U' + crypto.randomBytes(16).toString('hex');
}

const line = 'https://api.line.me/v2/bot';
const userId = randomUserId();

nock(line).get(`/profile/${userId}`).reply(200, {
  displayName: 'Test User',
  userId: userId,
  pictureUrl: null
});

const bot = linebot({
  channelId: 1234567890,
  channelSecret: 'secret',
  channelAccessToken: 'token'
});

describe('Profile', function() {

  describe('#getUserProfile()', function() {
    it('should return a profile.', function() {
      return bot.getUserProfile(userId).then((profile) => {
        assert.equal(profile.userId, userId);
      });
    });
  });

});
