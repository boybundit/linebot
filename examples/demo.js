const linebot = require('../index.js');

const bot = linebot({
  channelId: process.env.CHANNEL_ID,
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  verify: true // default=true
});

bot.on('message', function (event) {
  console.log(event.message.text);
  switch (event.message.type) {
    case 'text':
      switch (event.message.text) {
        case 'Me':
          event.source.profile().then(function (profile) {
            return event.reply('Hello ' + profile.displayName + ' ' + profile.userId);
          });
          break; 
        case 'Member':
          event.source.member().then(function (member) {
            return event.reply(JSON.stringify(member));
          });
          break;
        case 'Picture':
          event.reply({
            type: 'image',
            originalContentUrl: 'https://d.line-scdn.net/stf/line-lp/family/en-US/190X190_line_me.png',
            previewImageUrl: 'https://d.line-scdn.net/stf/line-lp/family/en-US/190X190_line_me.png'
          });
          break;
        case 'Location':
          event.reply({
            type: 'location',
            title: 'LINE Plus Corporation',
            address: '1 Empire tower, Sathorn, Bangkok 10120, Thailand',
            latitude: 13.7202068,
            longitude: 100.5298698
          });
          break;
        case 'Push':
          bot.push('U17448c796a01b715d293c34810985a4c', ['Hey!', 'สวัสดี ' + String.fromCharCode(0xD83D, 0xDE01)]);
          break;
        case 'Push2':
          bot.push('Cba71ba25dafbd6a1472c655fe22979e2', 'Push to group');
          break;
        case 'Multicast':
          bot.push(['U17448c796a01b715d293c34810985a4c', 'Cba71ba25dafbd6a1472c655fe22979e2'], 'Multicast!');
          break;
        case 'Broadcast':
          bot.broadcast('Broadcast!');
          break;
        case 'Confirm':
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
          break;
        case 'Multiple':
          return event.reply(['Line 1', 'Line 2', 'Line 3', 'Line 4', 'Line 5']);
        case 'Total followers':
          bot.getTotalFollowers().then((result) => {
            event.reply('Total followers: ' + result.followers);
          });
          break;
        case 'Quota':
          bot.getQuota().then((result) => {
            event.reply('Quota: ' + result.value);
          });
          break;
        case 'Total reply':
          bot.getTotalReplyMessages().then((result) => {
            event.reply('Total reply messages: ' + result.success);
          });
          break;
        case 'Version':
          event.reply('linebot@' + require('../package.json').version);
          break;
        case 'GetGroupProfile':
          bot.getGroupProfile('Cba71ba25dafbd6a1472c655fe22979e2').then((result) => {
            event.reply('This is the group(' + result.groupName + ').\n' + 
              'groupID : ' + result.groupId + '\n' +
              'picUrl : ' + result.pictureUrl);
          });
          break;
        case 'GetRoomMembersCount':
          bot.getRoomMembersCount('Bba70ba25dafbd6a1472c655fe22970c1').then((result) => {
            event.reply('Members Count: ' + result.count);
          });
          break;
        case 'GetGroupMembersCount':
          bot.getGroupMembersCount('Cba71ba25dafbd6a1472c655fe22979e2').then((result) => {
            event.reply('Members Count: ' + result.count);
          });
          break;  
        default:
          event.reply(event.message.text).then(function (data) {
            console.log('Success', data);
          }).catch(function (error) {
            console.log('Error', error);
          });
          break;
      }
      break;
    case 'image':
      event.message.content().then(function (data) {
        const s = data.toString('hex').substring(0, 32);
        return event.reply('Nice picture! ' + s);
      }).catch(function (err) {
        return event.reply(err.toString());
      });
      break;
    case 'video':
      event.reply('Nice video!');
      break;
    case 'audio':
      event.reply('Nice audio!');
      break;
    case 'location':
      event.reply(['That\'s a good location!', 'Lat:' + event.message.latitude, 'Long:' + event.message.longitude]);
      break;
    case 'sticker':
      event.reply({
        type: 'sticker',
        packageId: 1,
        stickerId: 1
      });
      break;
    default:
      event.reply('Unknown message: ' + JSON.stringify(event));
      break;
  }
});

bot.on('follow', function (event) {
  event.reply('follow: ' + event.source.userId);
});

bot.on('unfollow', function (event) {
  event.reply('unfollow: ' + event.source.userId);
});

bot.on('join', function (event) {
  if(event.source.groupId) {
    event.reply('join group: ' + event.source.groupId);
  }
  if(event.source.roomId) {
    event.reply('join room: ' + event.source.roomId);
  }
});

bot.on('leave', function (event) {
  if(event.source.groupId) {
    console.log('leave group: ' + event.source.groupId);
  }
  if(event.source.roomId) {
    console.log('leave room: ' + event.source.roomId);
  }
});

bot.on('memberJoined', function (event) {
  event.source.profile().then(function (profile) {
    if(event.source.type === 'group') {
      event.reply('memberJoined: ' + profile.displayName + '\n' +
        'groupId: ' + event.source.groupId + '  userId: ' + event.joined.members[0].userId);
    }
    if(event.source.type === 'room') {
      event.reply('memberJoined: ' + profile.displayName + '\n' +
        'roomId: ' + event.source.roomId + '  userId: ' + event.joined.members[0].userId);
    }
  });
});

bot.on('memberLeft', function (event) {
  console.log('memberLeft: ' + event.left.members[0].userId);
});

bot.on('postback', function (event) {
  event.reply('postback: ' + event.postback.data);
});

bot.on('beacon', function (event) {
  event.reply('beacon: ' + event.beacon.hwid);
});

bot.listen('/linewebhook', process.env.PORT || 80, function () {
  console.log('LineBot is running. Port : ' + (process.env.PORT || 80));
});
