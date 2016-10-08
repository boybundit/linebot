# linebot

LINE Messaging API for Node.js

  [![NPM Version][npm-image]][npm-url]
  [![NPM Dependencies][dependencies-image]][dependencies-url]
  [![NPM Downloads][downloads-image]][downloads-url]
  
## About LINE Messaging API

Please refer to the official API documents for details.

https://devdocs.line.me

## Installation

```bash
$ npm install linebot --save
```

## Usage

```js
var linebot = require('linebot');

var bot = linebot({
	channelSecret: [CHANNEL_SECRET],
	channelAccessToken: [CHANNEL_ACCESS_TOKEN]
});

bot.on('message', function (event) {
	bot.reply(event, event.message);
});

bot.listen('/linewebhook', 3000);
```

## License

  [MIT](LICENSE)
  
[npm-image]: https://img.shields.io/npm/v/linebot.svg
[npm-url]: https://npmjs.org/package/linebot
[dependencies-image]: https://david-dm.org/runnables/line-bot-sdk-nodejs.svg
[dependencies-url]: https://david-dm.org/runnables/line-bot-sdk-nodejs
[downloads-image]: https://img.shields.io/npm/dm/linebot.svg
[downloads-url]: https://npmjs.org/package/linebot
