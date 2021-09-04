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

   /**
    *     --- Basic ---
    */

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
      body.events.forEach(function (event) {
         debug('%O', event);
         event.reply = function (message) {
            return that.reply(event.replyToken, message);
         };
         if (event.joined) {
            let joinedMemberIds = [];
            event.joined.profiles = function () {
               if (event.type === 'memberJoined') {
                  for (let i = 0; i < event.joined.members.length; i++) {
                     joinedMemberIds.push(event.joined.members[i].userId);
                  }
                  if (event.source.type === 'group') {
                     return that.getGroupMemberProfile(event.source.groupId, joinedMemberIds);
                  }
                  if (event.source.type === 'room') {
                     return that.getRoomMemberProfile(event.source.roomId, joinedMemberIds);
                  }
               }
            };
         }
         if (event.left) {
            let leftMemberIds = [];
            event.left.profiles = function () {
               if (event.type === 'memberLeft') {
                  for (let i = 0; i < event.left.members.length; i++) {
                     leftMemberIds.push(event.left.members[i].userId);
                  }
                  return that.getUserProfile(leftMemberIds);
               }
            };
         }
         if (event.source) {
            event.source.profile = function () {
               if (event.source.type === 'group') {
                  return that.getGroupMemberProfile(event.source.groupId, event.source.userId);
               }
               if (event.source.type === 'room') {
                  return that.getRoomMemberProfile(event.source.roomId, event.source.userId);
               }
               return that.getUserProfile(event.source.userId);
            };
            event.source.member = function () {
               if (event.source.type === 'group') {
                  return that.getGroupMember(event.source.groupId);
               }
               if (event.source.type === 'room') {
                  return that.getRoomMember(event.source.roomId);
               }
            };
         }
         if (event.message) {
            event.message.content = function () {
               return that.getMessageContent(event.message.id);
            };
         }
         process.nextTick(function () {
            that.emit(event.type, event);
         });
      });
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

   static createMessages(message) {
      if (typeof message === 'string') {
         return [{
            type: 'text',
            text: message
         }];
      }
      if (Array.isArray(message)) {
         return message.map(function (m) {
            if (typeof m === 'string') {
               return {
                  type: 'text',
                  text: m
               };
            }
            return m;
         });
      }
      return [message];
   }

   get(path) {
      const url = this.endpoint + path;
      const options = {
         method: 'GET',
         headers: this.headers
      };
      return fetch(url, options);
   }

   post(path, body) {
      const url = this.endpoint + path;
      const options = {
         method: 'POST',
         headers: this.headers,
         body: JSON.stringify(body)
      };
      return fetch(url, options);
   }

   static yesterday() {
      const tempDate = new Date();
      tempDate.setDate(tempDate.getDate() - 1);
      const yday = tempDate.toLocaleString('en-US', {
         timeZone: 'Asia/Tokyo',
         day: '2-digit',
         month: '2-digit',
         year: 'numeric'
      });
      return yday.substr(6, 4) + yday.substr(0, 2) + yday.substr(3, 2);
   }

   /**
    *     --- Message ---
    */

   // Message - Reply message
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

   // 【 TO BE IMPLEMENTED 】
   // Message - Send narrowcast message

   // 【 TO BE IMPLEMENTED 】
   // Message - Get narrowcast message status

   // Message - Send broadcast message
   broadcast(message) {
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

   // Message - Get number of messages sent this month
   getTotalSentMessagesThisMonth() {
      const url = '/message/quota/consumption';
      debug('GET %s', url);
      return this.get(url).then(res => res.json()).then((profile) => {
         debug('%O', profile);
         return profile;
      });  
   }

   // Message - Get number of sent reply messages
   getTotalReplyMessages(date) {
      return this.getTotalMessages(date, 'reply');
   }

   // Message - Get number of sent push messages
   getTotalPushMessages(date) {
      return this.getTotalMessages(date, 'push');
   }

   // Message - Get number of sent multicast messages
   getTotalMulticastMessages(date) {
      return this.getTotalMessages(date, 'multicast');
   }

   // Message - Get number of sent broadcast messages
   getTotalBroadcastMessages(date) {
      return this.getTotalMessages(date, 'broadcast');
   }

   // 【 TO BE IMPLEMENTED 】
   // Message - Retrying an API request

   // 【 TO BE IMPLEMENTED 】
   // Managing Audience - 這個大類別，似乎是針對NarrowCast的小眾進行管理
   // 不太知道是什麼。但這大類別，通通沒有實作。也許未來算是次要的實作內容。

   // Message - Get number of sent reply messages
   getTotalMessages(date, type) {
      if (date == null) {
         date = LineBot.yesterday();
      }
      const url = `/message/delivery/${type}?date=${date}`;
      debug('GET %s', url);
      return this.get(url).then(res => res.json()).then((result) => {
         debug('%O', result);
         return result;
      });
   }

   /**
    *     --- Insight ---
    */

   // Insight - Get number of message deliveries
   getTotalMessagesInsight(date) {
      if (date == null) {
         date = LineBot.yesterday();
      }
      const url = `/insight/message/delivery?date=${date}`;
      debug('GET %s', url);
      return this.get(url).then(res => res.json()).then((result) => {
         debug('%O', result);
         return result;
      });
   } 

   // Insight - Get friend demographics
   getFriendDemographicsInsight() {
      const url = '/insight/demographic';
      debug('GET %s', url);
      return this.get(url).then(res => res.json()).then((result) => {
         debug('%O', result);
         return result;
      });      
   }

   // 【 TO BE IMPLEMENTED 】
   // Insight - Get user interaction statistics

   // Insight - Get number of followers
   getTotalFollowersInsight(date) {
      return this.getTotalFollowers(date);
   }
   getTotalFollowers(date) {
      if (date == null) {
         date = LineBot.yesterday();
      }
      const url = `/insight/followers?date=${date}`;
      debug('GET %s', url);
      return this.get(url).then(res => res.json()).then((result) => {
         debug('%O', result);
         return result;
      });
   }

   /**
    *     --- Users ---
    */

   // Users - Get profile
   getUserProfile(userId) {
      if (Array.isArray(userId)) {
         return Promise.all(userId.map(recipient => this.getUserProfile(recipient)));
      }
      const url = `/profile/${userId}`;
      debug('GET %s', url);
      return this.get(url).then(res => res.json()).then((profile) => {
         debug('%O', profile);
         return profile;
      });
   }

   // 【 TO BE IMPLEMENTED 】
   // Users - Get a list of users who added your 

   /**
    *     --- Bot ---
    */

   // Bot - Get bot info
   getBotInfo() {
      const url = '/info';
      debug('GET %s', url);
      return this.get(url).then(res => res.json()).then((profile) => {
         debug('%O', profile);
         return profile;
      });
   }

   /**
    *     --- Group ---
    */

   // Group - Get group summary
   getGroupProfile(groupId) {
      const url = `/group/${groupId}/summary`;
      debug('GET %s', url);
      return this.get(url).then(res => res.json()).then((profile) => {
         debug('%O', profile);
         return profile;
      });
   }

   // Group - Get number of users in a group
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
      if (Array.isArray(userId)) {
         return Promise.all(userId.map(recipient => this.getGroupMemberProfile(groupId, recipient)));
      }
      const url = `/group/${groupId}/member/${userId}`;
      debug('GET %s', url);
      return this.get(url).then(res => res.json()).then((profile) => {
         debug('%O', profile);
         profile.groupId = groupId;
         return profile;
      });
   }

   // Group - Leave group
   leaveGroup(groupId) {
      const url = `/group/${groupId}/leave`;
      debug('POST %s', url);
      return this.post(url).then(res => res.json()).then((result) => {
         debug('%O', result);
         return result;
      });
   }

   /**
    *     --- Chatroom ---
    */

   // Chatroom - Get number of users in a room
   getRoomMembersCount(roomId) {
      const url = `/room/${roomId}/members/count`;
      debug('GET %s', url);
      return this.get(url).then(res => res.json()).then((result) => {
         debug('%O', result);
         return result;
      });
   }

   // Chatroom - Get room member user IDs
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

   // Chatroom - Get room member profile
   getRoomMemberProfile(roomId, userId) {
      if (Array.isArray(userId)) {
         return Promise.all(userId.map(recipient => this.getRoomMemberProfile(roomId, recipient)));
      }
      const url = `/room/${roomId}/member/${userId}`;
      debug('GET %s', url);
      return this.get(url).then(res => res.json()).then((profile) => {
         debug('%O', profile);
         profile.roomId = roomId;
         return profile;
      });
   }

   // Chatroom - Leave room
   leaveRoom(roomId) {
      const url = `/room/${roomId}/leave`;
      debug('POST %s', url);
      return this.post(url).then(res => res.json()).then((result) => {
         debug('%O', result);
         return result;
      });
   }

   /**
    *     --- RichMenu ---
    */

   // 【 TO BE IMPLEMENTED 】
   // RichMenu 很多 API，目前實作優先權放比較後面。

   /**
    *     --- Account Link ---
    */

   // Account Link - Issue link token
   getIssueLinkToken(userId) {
      const url = `/user/${userId}/linkToken`;
      debug('GET %s', url);
      return this.post(url, {}).then(res => res.json()).then((linkToken) => {
         debug('%O', linkToken);
         return linkToken;
      });
   }
} // class LineBot

function createBot(options) {
   return new LineBot(options);
}

module.exports = createBot;
module.exports.LineBot = LineBot;
