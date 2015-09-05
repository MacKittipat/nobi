var express = require('express');

module.exports = function(slack, slackUsers, slackChannels) {
  var router = express.Router();

  router.get('/users', function(req, res) {
    res.send(slackUsers);
  });

  router.get('/channels', function(req, res) {
    res.send(slackChannels);
  });

  return router;
};
