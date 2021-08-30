'use strict'; // Required to use class in node v4

const EventEmitter = require('events');
const fetch = require('node-fetch');
const crypto = require('crypto');
const http = require('http');
const bodyParser = require('body-parser');
const debug = require('debug')('linebot');

class LineBot extends EventEmitter {

  // 建構式
  constructor(options) {
    super();  // 使用繼承，所以這裏透過super()呼叫父類別的建構式
    // 以下寫法很值得學習。若外部直接給一個完整的 options物件，就直接引用。
    // 否則也可以單一指定各元素的值。
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
      // LINE Server 傳 「訊息」的 Request來 Webhook
      // 用 message有沒有東西來判斷
      event.reply = function (message) {
        return that.reply(event.replyToken, message);
      };

      // LINE Server 傳來的 event 有含 event.source
      // 代表是從 group 或是 room 發出來的。
      if (event.source) {
        event.source.profile = function() {
          if (event.source.type === 'group') {
            if (event.joined) {
              return that.getGroupMemberProfile(event.source.groupId, event.joined.members[0].userId);
            } else {
              return that.getGroupMemberProfile(event.source.groupId, event.source.userId);
            }
          }
          if (event.source.type === 'room') {
            if (event.joined) {
              return that.getRoomMemberProfile(event.source.roomId, event.joined.members[0].userId);
            } else {
              return that.getRoomMemberProfile(event.source.roomId, event.source.userId);
            }
          }
          // LINE Server 傳來的 event " 不 "含 event.source
          // 代表是自己對機器人直接於 Chat 中發出
          return that.getUserProfile(event.source.userId);
        };

        // LINE Server 傳來的 event，可以透過傳入 GroupID，
        // 而得到 getGroupMember 或是 getRoomMember的資訊
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

  // 靜態成員函式，將字串訊息，轉成 LINE需要的「訊息物件陣列」。
  static createMessages(message) {
    // 單一字串
    if (typeof message === 'string') {
      return [{ type: 'text', text: message }];
    }

    // 字串陣列
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

  broadcast(message){
    const url = '/message/broadcast';
    const body = {
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
  
  getRoomMembersCount(roomId) {
    const url = `/room/${roomId}/members/count`;
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((result) => {
      debug('%O', result);
      return result;
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

  getTotalFollowers(date) {
    if (date == null) {
      date = yesterday();
    }
    const url = `/insight/followers?date=${date}`;
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((result) => {
      debug('%O', result);
      return result;
    });
  }

  getQuota() {
    const url = '/message/quota';
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((result) => {
      debug('%O', result);
      return result;
    });
  }

  getTotalReplyMessages(date) {
    return this.getTotalMessages(date, 'reply');
  }

  getTotalPushMessages(date) {
    return this.getTotalMessages(date, 'push');
  }

  getTotalBroadcastMessages(date) {
    return this.getTotalMessages(date, 'broadcast');
  }

  getTotalMulticastMessages(date) {
    return this.getTotalMessages(date, 'multicast');
  }

  getTotalMessages(date, type) {
    if (date == null) {
      date = yesterday();
    }
    const url = `/message/delivery/${type}?date=${date}`;
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((result) => {
      debug('%O', result);
      return result;
    });
  }

  getGroupProfile(groupId) {
    const url = `/group/${groupId}/summary`;
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((profile) => {
      debug('%O', profile);
      return profile;
    });
  }

  getGroupMembersCount(groupId) {
    const url = `/group/${groupId}/members/count`;
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((result) => {
      debug('%O', result);
      return result;
    });
  }

  // 發送 GET Request
  get(path) {
    const url = this.endpoint + path;
    const options = { method: 'GET', headers: this.headers };
    return fetch(url, options);
  }

  // 發送 POST Request
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

function yesterday() {
  const tempDate = new Date();
  tempDate.setDate(tempDate.getDate() - 1);
  const yesterday = tempDate.toLocaleString('en-US', {
    timeZone: 'Asia/Tokyo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  return yesterday.substr(6, 4) + yesterday.substr(0, 2) + yesterday.substr(3, 2);
}

module.exports = createBot;
module.exports.LineBot = LineBot;
