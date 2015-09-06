var express = require('express');

module.exports = function(slack, slackUsers, slackChannels) {
  var router = express.Router();

  router.get('/users', function(req, res) {
    res.send(slackUsers);
  });

  router.get('/channels', function(req, res) {
    res.send(slackChannels);
  });

  router.get('/messages/send', function(req, res) {
    var slackChannel = slack.getChannelByName(req.query.channel);
    slackChannel.send(req.query.message);
    res.send();
  });

  router.get('/messages/bot/send', function (req, res) {
    slack._apiCall('chat.postMessage',
      {
        'token': req.query.token,
        'channel': req.query.channel,
        'text': req.query.message
      },
      function(data) {
        console.log(data);
    });
    res.send();
  });

  return router;
};
