# linebot

  [![NPM Version][npm-image]][npm-url]
  [![NPM Downloads][downloads-image]][downloads-url]
  [![NPM Dependencies][dependencies-image]][dependencies-url]
  [![Build][travis-image]][travis-url]

🤖 SDK for the LINE Messaging API for Node.js
- Come with built-in server for quick setup
- Provide convenient addon functions to [event object](#event-object)

# About LINE Messaging API

Please refer to the official API documents for details.
- Developer Documents - https://developers.line.me/en/docs/messaging-api/overview
- API Reference - https://developers.line.me/en/docs/messaging-api/reference

# Installation

```bash
$ npm install linebot --save
```

# Usage

```js
var linebot = require('linebot');

var bot = linebot({
  channelId: CHANNEL_ID,
  channelSecret: CHANNEL_SECRET,
  channelAccessToken: CHANNEL_ACCESS_TOKEN
});

bot.on('message', function (event) {
  event.reply(event.message.text).then(function (data) {
    // success
  }).catch(function (error) {
    // error
  });
});

bot.listen('/linewebhook', 3000);
```

### Using with your own [Express.js][express-url] server
```js
const app = express();
const linebotParser = bot.parser();
app.post('/linewebhook', linebotParser);
app.listen(3000);
```

See [`examples`](examples) folder for more examples.

# API

## LineBot object

### linebot(config)
Create LineBot instance with specified configuration.
```js
var bot = linebot({
  channelId: CHANNEL_ID,
  channelSecret: CHANNEL_SECRET,
  channelAccessToken: CHANNEL_ACCESS_TOKEN,
  verify: true // Verify 'X-Line-Signature' header (default=true)
});
```

### LineBot.listen(webHookPath, port, callback)

Start built-in http server on the specified `port`,
and accept POST request callback on the specified `webHookPath`.

This method is provided for convenience.
You can write you own server and use `verify` and `parse` methods to process webhook events.
See [`examples/echo-express-long.js`](examples/echo-express-long.js) for example.

### LineBot.parser()

Create [Express.js][express-url] middleware to parse the request.

The parser assumes that the request body has never been parsed by any body parser before,
so it must be placed BEFORE any generic body parser e.g. `app.use(bodyParser.json());`

### LineBot.verify(rawBody, signature)

Verify `X-Line-Signature` header.

### LineBot.parse(body)

Process incoming webhook request, and raise an event.

### LineBot.on(eventType, eventHandler)

Raised when a [Webhook event][webhook-event-url] is received.
```js
bot.on('message',      function (event) { });
bot.on('follow',       function (event) { });
bot.on('unfollow',     function (event) { });
bot.on('join',         function (event) { });
bot.on('leave',        function (event) { });
bot.on('memberJoined', function (event) { });
bot.on('memberLeft',   function (event) { });
bot.on('postback',     function (event) { });
bot.on('beacon',       function (event) { });
```

### LineBot.reply(replyToken, message)

Reply a message.

See: [Event.reply(message)](#eventreplymessage)

### LineBot.push(to, message)

Send push message.

`to` is a userId, or an array of userId.
A userId can be saved from `event.source.userId`
when added as a friend (follow event), or during the chat (message event).

`message` can be a string, an array of string,
a [Send message][send-message-url] object,
or an array of [Send message][send-message-url] objects.

### LineBot.multicast(to, message)

Send push message to multiple users (Max: 150 users).
This is more efficient than `push` as it will make api call only once.

`to` is an array of userId.

`message` can be a string, an array of string,
a [Send message][send-message-url] object,
or an array of [Send message][send-message-url] objects.

### LineBot.broadcast(message)

Send push message to all users.
This is more efficient than `push` as it will make api call only once.

`message` can be a string, an array of string,
a [Send message][send-message-url] object,
or an array of [Send message][send-message-url] objects.

### LineBot.getMessageContent(messageId)

Get image, video, and audio data sent by users as a [Buffer][buffer-url] object.

See: [Event.message.content()](#eventmessagecontent)

### LineBot.getUserProfile(userId)

Get user profile information of the user.

See: [Event.source.profile()](#eventsourceprofile)

### LineBot.getGroupMemberProfile(groupId, userId)

Get user profile of a member in a group.

### LineBot.getGroupMember(groupId)

Get userId of all members in a group.

See: [Event.source.member()](#eventsourcemember)

### LineBot.leaveGroup(groupId)

Leave a group.

### LineBot.getRoomMemberProfile(roomId, userId)

Get user profile of a member in a chat room.

### LineBot.getRoomMember(roomId)

Get userId of all members in a chat room.

See: [Event.source.member()](#eventsourcemember)

### LineBot.leaveRoom(roomId)

Leave a room.

## Event object

Provide convenient shorthands to call LineBot's functions
which require parameter from a source event object.

### Event.reply(message)

Respond to the event.

`message` can be a string, an array of string,
a [Send message][send-message-url] object,
or an array of [Send message][send-message-url] objects.

Return a [Promise][promise-url] object from [`node-fetch`][node-fetch-url] module.

This is a shorthand for: `LineBot.reply(event.replyToken, message)`

```js
// reply text message
event.reply('Hello, world').then(function (data) {
  // success
}).catch(function (error) {
  // error
});

// reply multiple text messages
event.reply(['Hello, world 1', 'Hello, world 2']);

// reply message object
event.reply({ type: 'text', text: 'Hello, world' });

// reply multiple message object
event.reply([
  { type: 'text', text: 'Hello, world 1' },
  { type: 'text', text: 'Hello, world 2' }
]);

event.reply({
  type: 'image',
  originalContentUrl: 'https://example.com/original.jpg',
  previewImageUrl: 'https://example.com/preview.jpg'
});

event.reply({
  type: 'video',
  originalContentUrl: 'https://example.com/original.mp4',
  previewImageUrl: 'https://example.com/preview.jpg'
});

event.reply({
  type: 'audio',
  originalContentUrl: 'https://example.com/original.m4a',
  duration: 240000
});

event.reply({
  type: 'location',
  title: 'my location',
  address: '〒150-0002 東京都渋谷区渋谷２丁目２１−１',
  latitude: 35.65910807942215,
  longitude: 139.70372892916203
});

event.reply({
  type: 'sticker',
  packageId: '1',
  stickerId: '1'
});

event.reply({
  type: 'imagemap',
  baseUrl: 'https://example.com/bot/images/rm001',
  altText: 'this is an imagemap',
  baseSize: { height: 1040, width: 1040 },
  actions: [{
    type: 'uri',
    linkUri: 'https://example.com/',
    area: { x: 0, y: 0, width: 520, height: 1040 }
  }, {
    type: 'message',
    text: 'hello',
    area: { x: 520, y: 0, width: 520, height: 1040 }
  }]
});

event.reply({
  type: 'template',
  altText: 'this is a buttons template',
  template: {
    type: 'buttons',
    thumbnailImageUrl: 'https://example.com/bot/images/image.jpg',
    title: 'Menu',
    text: 'Please select',
    actions: [{
      type: 'postback',
      label: 'Buy',
      data: 'action=buy&itemid=123'
    }, {
      type: 'postback',
      label: 'Add to cart',
      data: 'action=add&itemid=123'
    }, {
      type: 'uri',
      label: 'View detail',
      uri: 'http://example.com/page/123'
    }]
  }
});

event.reply({
  type: 'template',
  altText: 'this is a confirm template',
  template: {
    type: 'confirm',
    text: 'Are you sure?',
    actions: [{
      type: 'message',
      label: 'Yes',
      text: 'yes'
    }, {
      type: 'message',
      label: 'No',
      text: 'no'
    }]
  }
});

event.reply({
  type: 'template',
  altText: 'this is a carousel template',
  template: {
    type: 'carousel',
    columns: [{
      thumbnailImageUrl: 'https://example.com/bot/images/item1.jpg',
      title: 'this is menu',
      text: 'description',
      actions: [{
        type: 'postback',
        label: 'Buy',
        data: 'action=buy&itemid=111'
      }, {
        type: 'postback',
        label: 'Add to cart',
        data: 'action=add&itemid=111'
      }, {
        type: 'uri',
        label: 'View detail',
        uri: 'http://example.com/page/111'
      }]
    }, {
      thumbnailImageUrl: 'https://example.com/bot/images/item2.jpg',
      title: 'this is menu',
      text: 'description',
      actions: [{
        type: 'postback',
        label: 'Buy',
        data: 'action=buy&itemid=222'
      }, {
        type: 'postback',
        label: 'Add to cart',
        data: 'action=add&itemid=222'
      }, {
        type: 'uri',
        label: 'View detail',
        uri: 'http://example.com/page/222'
      }]
    }]
  }
});
```

### Event.source.profile()

Get user profile information of the sender.

This is a shorthand for:
  - `LineBot.getUserProfile(event.source.userId)` if it is 1:1 chat
  - `LineBot.getGroupMemberProfile(event.source.groupId, event.source.userId)` if bot is in a group
  - `LineBot.getRoomMemberProfile(event.source.roomId, event.source.userId)` if bot is in a chat room

```js
event.source.profile().then(function (profile) {
  event.reply('Hello ' + profile.displayName);
});
```

### Event.source.member()

Get userId of all members in a group or a chat room.

This is a shorthand for:
  - `LineBot.getGroupMember(event.source.groupId)` if bot is in a group
  - `LineBot.getRoomMember(event.source.roomId)` if bot is in a chat room

```js
event.source.member().then(function (member) {
  console.log(member.memberIds);
});
```

### Event.message.content()

Get image, video, and audio data sent by users as a [Buffer][buffer-url] object.

This is a shorthand for: `LineBot.getMessageContent(event.message.messageId)`

```js
event.message.content().then(function (content) {
  console.log(content.toString('base64'));
});
```

# License

  [MIT](LICENSE)

[express-url]: http://expressjs.com
[webhook-event-url]: https://developers.line.me/en/docs/messaging-api/reference/#webhooks
[send-message-url]: https://developers.line.me/en/docs/messaging-api/reference/#message-objects
[promise-url]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
[node-fetch-url]: https://github.com/bitinn/node-fetch
[buffer-url]: https://nodejs.org/api/buffer.html

[npm-image]: https://img.shields.io/npm/v/linebot.svg
[npm-url]: https://npmjs.org/package/linebot
[dependencies-image]: https://david-dm.org/boybundit/linebot.svg
[dependencies-url]: https://david-dm.org/boybundit/linebot
[downloads-image]: https://img.shields.io/npm/dm/linebot.svg
[downloads-url]: https://npmjs.org/package/linebot
[travis-image]: https://img.shields.io/travis/boybundit/linebot/master.svg
[travis-url]: https://travis-ci.org/boybundit/linebot
