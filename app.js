var fs = require('fs');
var Slack = require('slack-client');
var express = require('express');
var util = require('util');
var async = require('async');

var token = fs.readFileSync('./token', 'utf8').trim();
var autoReconnect = true;
var autoMark = true;
var slack = new Slack(token, autoReconnect, autoMark);

var slackChannels = [];
var slackUsers = [];

async.series([
    function(callback) {
      // Load channels and users into memory
      var channelsStoragePath = './storage/channels.txt';
      var usersStoragePath = './storage/users.txt';
      if(fs.existsSync(channelsStoragePath) && fs.existsSync(usersStoragePath)) {
        // Load channels and users from storage
        console.log('Loading channels and users from storage');
        slackChannels = JSON.parse(fs.readFileSync(channelsStoragePath));
        slackUsers = JSON.parse(fs.readFileSync(usersStoragePath));
      } else {
        // Fetch channels and users from Slack and store in storage folder
        console.log('Fetching channels from Slack');
        slack._apiCall('channels.list', {'token':token}, function(data) {
          if(data.ok) {
            for(var i=0; i<data.channels.length; i++) {
              var slackChannel = data.channels[i];
              if(slackChannel.is_member) {
                slackChannels.push({'id': slackChannel.id, 'name': slackChannel.name});
              }
            }
            // Store channels in storage
            fs.writeFile(channelsStoragePath, JSON.stringify(slackChannels),
              function(err) {
                if (err) throw err;
                console.log('Saved channels to storage');
            });
          }
        });
        console.log('Fetching users from Slack');
        slack._apiCall('users.list', {'token':token}, function(data) {
          if(data.ok) {
            for(var i=0; i<data.members.length; i++) {
              var slackUser = data.members[i];
              slackUsers.push({'id': slackUser.id, 'name': slackUser.name});
            }
            // Store users in storage
            fs.writeFile(usersStoragePath, JSON.stringify(slackUsers),
              function(err) {
                if (err) throw err;
                console.log('Saved users to storage');
            });
          }
        });
      }

      callback();
    },
    function(callback) {
      // Start express
      var app = express();
      var rest = require('./rest')(slack, slackUsers, slackChannels);

      app.use('/nobi/slack', rest);

      var server = app.listen(3000, function () {
        var host = server.address().address;
        var port = server.address().port;
        console.log('App listening at http://%s:%s', host, port);
      });

      callback();
    }
]);

slack.on('open', function() {
  console.log('Slack on open');
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
