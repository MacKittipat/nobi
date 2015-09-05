var fs = require('fs');
var Slack = require('slack-client');
var express = require('express');

var token = fs.readFileSync('./token', 'utf8').trim();
var autoReconnect = true;
var autoMark = true;
var slack = new Slack(token, autoReconnect, autoMark);

var slackChannels = [];
var slackUsers = [];

slack.on('open', function() {
  console.log('Slack on open');

  var channelsStoragePath = './storage/channels.txt';
  var usersStoragePath = './storage/users.txt';

  if(fs.existsSync(channelsStoragePath) && fs.existsSync(usersStoragePath)) {
    // Load channels and users from storage
    console.log('Load channels and users from storage');
    slackChannels = JSON.parse(fs.readFileSync(channelsStoragePath));
    slackUsers = JSON.parse(fs.readFileSync(usersStoragePath));
  } else {
    // Fetch channels and users from Slack and store in storage folder
    console.log('Fetch channels and users from Slack');
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

    // Store channels and users in file
    fs.writeFile(channelsStoragePath, JSON.stringify(slackChannels),
      function (err) {
        if (err) throw err;
        console.log('Saved channels to storage');
    });
    fs.writeFile(usersStoragePath, JSON.stringify(slackUsers),
      function (err) {
        if (err) throw err;
        console.log('Saved users to storage');
    });
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
console.log('Logged into Slack');

var app = express();
var rest = require('./rest')(slack, slackUsers, slackChannels);

app.use('/nobi/slack', rest);

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log('App listening at http://%s:%s', host, port);
});
