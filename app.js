var fs = require('fs');
var Slack = require('slack-client');

var token = fs.readFileSync('./token', 'utf8').trim();
var autoReconnect = true;
var autoMark = true;
var slack = new Slack(token, autoReconnect, autoMark);

slack.on('open', function() {
  var channels = slack.channels;
});

slack.on('message', function(message) {
  console.log(message);
  var user = slack.getUserByID(message.user);
  console.log(user.name + " : " + message.text);
});

slack.login();
