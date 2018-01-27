const crypto = require('crypto');
const nock = require('nock');
const linebot = require('../index.js');
const assert = require('assert');

function randomUserId() {
  return 'U' + crypto.randomBytes(16).toString('hex');
}

const line = 'https://api.line.me/v2/bot';
const roomId = randomUserId().replace('U', 'R');
const userId = randomUserId();

nock(line).get(`/room/${roomId}/member/${userId}`).reply(200, {
  displayName: 'Test User',
  userId: userId,
  pictureUrl: null
});

nock(line).get(`/room/${roomId}/members/ids`).reply(200, {
  memberIds: [userId],
  next: 'token2'
});

nock(line).get(`/room/${roomId}/members/ids?start=token2`).reply(200, {
  memberIds: [randomUserId(), randomUserId()],
  next: 'token3'
});

nock(line).get(`/room/${roomId}/members/ids?start=token3`).reply(200, {
  memberIds: [randomUserId(), randomUserId()]
});

nock(line).post(`/room/${roomId}/leave`).reply(200, {});

const bot = linebot({
  channelId: 1234567890,
  channelSecret: 'secret',
  channelAccessToken: 'token'
});

describe('Room', function() {

  describe('#getRoomMemberProfile()', function() {
    it('should return a profile.', function() {
      return bot.getRoomMemberProfile(roomId, userId).then((profile) => {
        assert.equal(profile.userId, userId);
        assert.equal(profile.roomId, roomId);
      });
    });
  });

  describe('#getRoomMember()', function() {
    it('should return a list of member.', function() {
      return bot.getRoomMember(roomId).then((roomMember) => {
        assert.equal(roomMember.memberIds.length, 5);
        assert.equal(roomMember.memberIds[0], userId);
      });
    });
  });

  describe('#leaveRoom()', function() {
    it('should return an empty object.', function() {
      return bot.leaveRoom(roomId).then((result) => {
        assert.deepEqual(result, {});
      });
    });
  });

});
