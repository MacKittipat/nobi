var fs = require('fs');
var Slack = require('slack-client');
var restify = require('restify');

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

var server = restify.createServer();
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

var client = restify.createJsonClient({
  url: 'https://slack.com/api/channels.history?token=xoxb-9970939750-WkBO2rP0auy79h0ymtrBtK9Z&channel=C0476BKVB&count=1000'
});

server.get('/nobi/sendmessage', function (req, res, next) {
  console.log(req.params);

  client.get('/api/chat.postMessage?token=' + token +
      '&channel=' + req.params.channel +
      '&text=' + encodeURIComponent(req.params.message),
      function (err, req, res, obj) {
    console.log('Server returned: %j', obj);
  });
  res.send(200);
  return next();
});

server.listen(8080, function () {
  console.log('%s listening at %s', server.name, server.url);
});

// localhost:8080/nobi/sendmessage?channel=C0476BL03&message=555
