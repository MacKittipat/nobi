var fs = require('fs');
var Slack = require('slack-client');

var token = fs.readFileSync('./token', 'utf8').trim();
var autoReconnect = true;
var autoMark = true;
var slack = new Slack(token, autoReconnect, autoMark);

var slackChannels = [];
var slackUsers = [];

slack.on('open', function() {
  // Find channels that nobi is member
  for(var slackChannelId in slack.channels) {
    var slackChannel = slack.channels[slackChannelId];
    if(slackChannel.is_member) {
      var channel = {};
      channel[slackChannel.id] = slackChannel.name;
      slackChannels.push(channel);
      // Find users from all channel that nobi is member
      for(var slackUserId in slackChannel._client.users) {
        var slackUser = slackChannel._client.users[slackUserId];
        var user = {};
        user[slackUser.id] = slackUser.name;
        slackUsers.push(user);
      }
    }
  }
  // console.log("%j", slackChannels);
  // console.log("%j", slackUsers);
});

slack.on('message', function(message) {
  var user = slack.getUserByID(message.user);
  var channel = slack.getChannelGroupOrDMByID(message.channel);
  if(user && message && channel) {
    console.log("[" + channel.name + "] " + user.name + " : " + message.text);
  }
});

slack.on('error', function(error) {
  console.error(error);
});

slack.login();
