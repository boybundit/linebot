'use strict'; // Required to use class in node v4
/*
1. LINE Webhook的 Endpoint要讓人家可以設定，可以設計在 options裏
   也許就叫 this.endpoint.

2. 這個專案就只是幫助學習而已，並不做功能新增或 merge到 master.

*/
// https://developers.line.biz/en/reference/messaging-api/#get-profile

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

  // Message - Send reply message
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

  /*************************************/
  /*             Message               */
  /*************************************/
  // Message -  Send push message
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

  // Message - Send multicast message
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

  // 【 待實作 】
  // Message - Send narrowcast message



  // 【 待實作 】
  // Message - Get narrowcast message status



  // Message - Send broadcast message
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

  // Message - Get content
  getMessageContent(messageId) {
    const url = `/message/${messageId}/content`;
    debug('GET %s', url);
    return this.get(url).then(res => res.buffer()).then((buffer) => {
      debug(buffer.toString('hex'));
      return buffer;
    });
  }

  // Message - Get the target limit for additional messages
  getQuota() {
    const url = '/message/quota';
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((result) => {
      debug('%O', result);
      return result;
    });
  }

  // 【 待實作 】
  // Message - Get number of messages sent this month

  // 【 待實作 】
  // Message - Get number of sent reply messages
  getTotalReplyMessages(date) {
    return this.getTotalMessages(date, 'reply');
  }

  // 【 待實作 】
  // Message - Get number of sent push messages
  getTotalPushMessages(date) {
    return this.getTotalMessages(date, 'push');
  }

  // 【 待實作 】
  // Message - Get number of sent multicast messages
  getTotalMulticastMessages(date) {
    return this.getTotalMessages(date, 'multicast');
  }

  // 【 待實作 】
  // Message - Get number of sent broadcast messages
  getTotalBroadcastMessages(date) {
    return this.getTotalMessages(date, 'broadcast');
  }

  // 【 待實作 】
  // Message - Retrying an API request


  // Managing Audience - 這個大類別，似乎是針對NarrowCast的小眾進行管理
  // 不太知道是什麼。但這大類別，通通沒有實作。也許未來算是次要的實作內容。

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

  /*************************************/
  /*             Insight               */
  /*************************************/
  // 【 待實作 】
  // Insight - Get number of message deliveries
  // Returns the number of messages sent from LINE Official 
  // Account on a specified day.



  // 【 待實作 】
  // Insight - Get friend demographics
  // Retrieves the demographic attributes for a LINE Official 
  // Account's friends. You can only retrieve information about 
  // friends for LINE Official Accounts created by users in Japan (JP),
  // Thailand (TH), Taiwan (TW) and Indonesia (ID).



  // 【 待實作 】
  // Insight - Get user interaction statistics
  
  

  // Insight - Get number of followers
  // Returns the number of users who have added the LINE Official 
  // Account on or before a specified date.
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


  /*************************************/
  /*             Users                 */
  /*************************************/

  // Users - Get profile
  getUserProfile(userId) {
    const url = `/profile/${userId}`;
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((profile) => {
      debug('%O', profile);
      return profile;
    });
  }

  // 【 待實作 】
  // Users - Get a list of users who added your 
  // LINE Official Account as a friend 


  /*************************************/
  /*             Bot                   */
  /*************************************/
  
  // 【 待實作 】
  // Bot - Get bot info


  /*************************************/
  /*             Group                 */
  /*************************************/

  // Group - Get group summary
  // Gets the group ID, group name, and group icon URL of a 
  // group where the LINE Official Account is a member.
  getGroupProfile(groupId) {
    const url = `/group/${groupId}/summary`;
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((profile) => {
      debug('%O', profile);
      return profile;
    });
  }

  // Group - Get number of users in a group
  // Gets the count of users in a group.
  getGroupMembersCount(groupId) {
    const url = `/group/${groupId}/members/count`;
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((result) => {
      debug('%O', result);
      return result;
    });
  }

  // Group - Get group member user IDs
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

  // Group - Get group member profile
  getGroupMemberProfile(groupId, userId) {
    const url = `/group/${groupId}/member/${userId}`;
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((profile) => {
      debug('%O', profile);
      profile.groupId = groupId;
      return profile;
    });
  }


  // Group - Leave group
  // Leaves a group.
  leaveGroup(groupId) {
    const url = `/group/${groupId}/leave`;
    debug('POST %s', url);
    return this.post(url).then(res => res.json()).then((result) => {
      debug('%O', result);
      return result;
    });
  }


  /*************************************/
  /*             ChatRoom              */
  /*************************************/

  // ChatRoom - Get number of users in a room
  // Gets the count of users in a room.
  getRoomMembersCount(roomId) {
    const url = `/room/${roomId}/members/count`;
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((result) => {
      debug('%O', result);
      return result;
    });
  }  

  // ChatRoom - Get room member user IDs
  // Gets the user IDs of the members of a room that the 
  // LINE Official Account is in.
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

  // ChatRoom - Get room member profile
  // Gets the profile information of a member of a room that the 
  // LINE Official Account is in if the user ID of the room member is known.
  getRoomMemberProfile(roomId, userId) {
    const url = `/room/${roomId}/member/${userId}`;
    debug('GET %s', url);
    return this.get(url).then(res => res.json()).then((profile) => {
      debug('%O', profile);
      profile.roomId = roomId;
      return profile;
    });
  }

  // ChatRoom - Leave room
  // Leaves a room.
  leaveRoom(roomId) {
    const url = `/room/${roomId}/leave`;
    debug('POST %s', url);
    return this.post(url).then(res => res.json()).then((result) => {
      debug('%O', result);
      return result;
    });
  }

  
  /*************************************/
  /*             RichMenu              */
  /*************************************/

  // RichMenu 很多 API，目前實作優先權放比較後面。

  /*************************************/
  /*             Account Link          */
  /*************************************/  

  // 【 待實作 】
  // Account Link - Issue link token
  
  //////////////////////////////////////////////////



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
