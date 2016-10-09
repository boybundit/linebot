# linebot

  [![NPM Version][npm-image]][npm-url]
  [![NPM Dependencies][dependencies-image]][dependencies-url]
  [![NPM Downloads][downloads-image]][downloads-url]

LINE Messaging API for Node.js

# About LINE Messaging API

Please refer to the official API documents for details.

https://devdocs.line.me

# Installation

```bash
$ npm install linebot --save
```

# Usage

```js
var linebot = require('linebot');

var bot = linebot({
	channelId: [CHANNEL_ID],
	channelSecret: [CHANNEL_SECRET],
	channelAccessToken: [CHANNEL_ACCESS_TOKEN]
});

bot.on('message', function (event) {
	event.reply(event.message.text).then(function (data) {
		// success
	}).catch(function(error) {
		// error
	});
});

bot.listen('/linewebhook', 3000);
```

# API

## linebot(config)
Create LineBot instance with specified configuration.
```js
var bot = linebot({
    channelId: [CHANNEL_ID],
    channelSecret: [CHANNEL_SECRET],
    channelAccessToken: [CHANNEL_ACCESS_TOKEN],
	verify: true // Verify `X-Line-Signature` header.
});
```

## LineBot.listen(webHookPath, port, callback)

Start [Express.js](http://expressjs.com/) web server on the specified `port`,
and accept POST request callback on the specified `webHookPath`.

This method is provided for convenience.
You can write you own server and use `verify` and `parse` methods to process webhook events.
See `examples/echo-express.js` for example.

## LineBot.verify(rawBody, signature)

Verify `X-Line-Signature` header

## LineBot.parse(body)

Process incoming webhook request, and raise an event.

## LineBot.on(eventType, eventHandler)

Raised when a [Webhook event](https://devdocs.line.me/en/#webhook-event-object) is received.
```js
bot.on('message',  function (event) { });
bot.on('follow',   function (event) { });
bot.on('unfollow', function (event) { });
bot.on('join',     function (event) { });
bot.on('leave',    function (event) { });
bot.on('postback', function (event) { });
```
## Event.reply(message)

Respond to the event.
`message` can be a string, a [Send message](https://devdocs.line.me/en/#send-message-object) object, or an array of [Send message](https://devdocs.line.me/en/#send-message-object) objects.

Return a [Promise](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise) object from [`node-fetch`](https://github.com/bitinn/node-fetch) module.

```js
event.reply('Hello, world');

event.reply({ type: 'text', text: 'Hello, world' });

event.reply({
	type: 'image',
	originalContentUrl: 'https://example.com/original.jpg',
	previewImageUrl: 'https://example.com/preview.jpg'
});
```

## Event.source.profile()

Get user profile information of the sender.
Return a [Promise][promise-url] object from [`node-fetch`][node-fetch-url] module.

This is a shorthand for LineBot.getUserProfile(event.source.userId);

## Event.message.content()

Get image, video, and audio data sent by users.
Return a [Promise][promise-url] object from [`node-fetch`][node-fetch-url] module.

This is a shorthand for LineBot.getMessageContent(event.message.messageId);

# License

  [MIT](LICENSE)

[promise-url]: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Promise
[node-fetch-url]: https://github.com/bitinn/node-fetch
[npm-image]: https://img.shields.io/npm/v/linebot.svg
[npm-url]: https://npmjs.org/package/linebot
[dependencies-image]: https://david-dm.org/boybundit/linebot.svg
[dependencies-url]: https://david-dm.org/boybundit/linebot
[downloads-image]: https://img.shields.io/npm/dm/linebot.svg
[downloads-url]: https://npmjs.org/package/linebot
