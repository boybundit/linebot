'use strict'; // Required to use class in node v4

const EventEmitter = require('events');
const fetch = require('node-fetch');
const crypto = require('crypto');
const http = require('http');
const bodyParser = require('body-parser');
const debug = require('debug')('linebot');

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
    // Constant-time comparison to prevent timing attack.
    if (hash.length !== signature.length) {
      return false;
    }
    let res = 0;
    for (let i = 0; i < hash.length; i++) {
      res |= (hash.charCodeAt(i) ^ signature.charCodeAt(i));
    }
    return res === 0;
  }

  parse(body) {
    const that = this;
    if (!body || !body.events) {
      return;
    }
    body.events.forEach(function(event) {
      debug('%O', event);
      event.reply = function (message) {
        return that.reply(event.replyToken, message);
      };
      if (event.source) {
        event.source.profile = function() {
          if (event.source.type === 'group') {
            return that.getGroupMemberProfile(event.source.groupId, event.source.userId);
          }
          if (event.source.type === 'room') {
            return that.getRoomMemberProfile(event.source.roomId, event.source.userId);
          }
          return that.getUserProfile(event.source.userId);
        };
        event.source.member = function() {
          if (event.source.type === 'group') {
            return that.getGroupMember(event.source.groupId);
          }
          if (event.source.type === 'room') {
            return that.getRoomMember(event.source.roomId);
          }
        };
      }
      if (event.message) {
        event.message.content = function() {
          return that.getMessageContent(event.message.id);
        };
      }
      process.nextTick(function() {
        that.emit(event.type, event);
      });
    });
  }

  static createMessages(message) {
    if (typeof message === 'string') {
      return [{ type: 'text', text: message }];
    }
    if (Array.isArray(message)) {
      return message.map(function(m) {
        if (typeof m === 'string') {
          return { type: 'text', text: m };
        }
        return m;
      });
    }
    return [message];
  }

  reply(replyToken, message) {
    const url = '/message/reply';
    const body = {
      replyToken: replyToken,
      messages: LineBot.createMessages(message)
    };
    debug('POST %s', url);
    debug('%O', body);
    return this.post(url, body).then(res => res.json()).then((result) => {
      debug(result);
      return result;
    });
  }

  push(to, message) {
    const url = '/message/push';
    if (Array.isArray(to)) {
      return Promise.all(to.map(recipient => this.push(recipient, message)));
    }
    const body = {
      to: to,
      messages: LineBot.createMessages(message)
    };
    debug('POST %s', url);
    debug('%O', body);
    return this.post(url, body).then(res => res.json()).then((result) => {
      debug('%O', result);
      return result;
    });
  }

  multicast(to, message) {
    const url = '/message/multicast';
    const body = {
      to: to,
      messages: LineBot.createMessages(message)
    };
    debug('POST %s', url);
    debug('%O', body);
    return this.post(url, body).then(res => res.json()).then((result) => {
      debug('%O', result);
      return result;
    });
  }

  getMessageContent(messageId) {
    const url = `/message/${messageId}/content`;
    debug('GET %s', url);
    return this.get(url).then(res => res.buffer()).then((buffer) => {
      debug(buffer.toString('hex'));
      return buffer;
    });
  }

  getUserProfile(userId) {
    const url = `/profile/${userId}`;
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((profile) => {
      debug('%O', profile);
      return profile;
    });
  }

  getGroupMemberProfile(groupId, userId) {
    const url = `/group/${groupId}/member/${userId}`;
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((profile) => {
      debug('%O', profile);
      profile.groupId = groupId;
      return profile;
    });
  }

  getGroupMember(groupId, next) {
    const url = `/group/${groupId}/members/ids` + (next ? `?start=${next}` : '');
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((groupMember) => {
      debug('%O', groupMember);
      if (groupMember.next) {
        return this.getGroupMember(groupId, groupMember.next).then((nextGroupMember) => {
          groupMember.memberIds = groupMember.memberIds.concat(nextGroupMember.memberIds);
          delete groupMember.next;
          return groupMember;
        });
      }
      delete groupMember.next;
      return groupMember;
    });
  }

  leaveGroup(groupId) {
    const url = `/group/${groupId}/leave`;
    debug('POST %s', url);
    return this.post(url).then(res => res.json()).then((result) => {
      debug('%O', result);
      return result;
    });
  }

  getRoomMemberProfile(roomId, userId) {
    const url = `/room/${roomId}/member/${userId}`;
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((profile) => {
      debug('%O', profile);
      profile.roomId = roomId;
      return profile;
    });
  }

  getRoomMember(roomId, next) {
    const url = `/room/${roomId}/members/ids` + (next ? `?start=${next}` : '');
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((roomMember) => {
      debug('%O', roomMember);
      if (roomMember.next) {
        return this.getRoomMember(roomId, roomMember.next).then((nextRoomMember) => {
          roomMember.memberIds = roomMember.memberIds.concat(nextRoomMember.memberIds);
          delete roomMember.next;
          return roomMember;
        });
      }
      delete roomMember.next;
      return roomMember;
    });
  }

  leaveRoom(roomId) {
    const url = `/room/${roomId}/leave`;
    debug('POST %s', url);
    return this.post(url).then(res => res.json()).then((result) => {
      debug('%O', result);
      return result;
    });
  }

  get(path) {
    const url = this.endpoint + path;
    const options = { method: 'GET', headers: this.headers };
    return fetch(url, options);
  }

  post(path, body) {
    const url = this.endpoint + path;
    const options = { method: 'POST', headers: this.headers, body: JSON.stringify(body) };
    return fetch(url, options);
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
