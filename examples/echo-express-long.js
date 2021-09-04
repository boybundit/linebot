const linebot = require('../index.js');
const express = require('express');
const bodyParser = require('body-parser');

const bot = linebot({
   channelId: process.env.CHANNEL_ID,
   channelSecret: process.env.CHANNEL_SECRET,
   channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
});

const app = express();

const parser = bodyParser.json({
   verify: function (req, res, buf, encoding) {
      req.rawBody = buf.toString(encoding);
   }
});

app.post('/linewebhook', parser, function (req, res) {
   if (!bot.verify(req.rawBody, req.get('X-Line-Signature'))) {
      return res.sendStatus(400);
   }
   bot.parse(req.body);
   return res.json({});
});

bot.on('message', function (event) {
   event.reply(event.message.text).then(function (data) {
      console.log('Success', data);
   }).catch(function (error) {
      console.log('Error', error);
   });
});

app.listen(process.env.PORT || 80, function () {
   console.log('LineBot is running.');
});
