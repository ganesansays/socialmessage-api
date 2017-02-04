var Feed = require('../models/feed');
var FeedAuth = require('../models/feedAuth');
var authController = require('./auth');
var facebookUtils = require('../helpers/facebookUtils');
var ObjectId = require('mongoose').Types.ObjectId; 
var facebookScrapper = require('../modules/facebookScrapper');
var Feed = require('../models/feed');

// Create endpoint /api/socialPosts for POST
exports.create = function(req, res) {
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      var feed = new Feed();
      var feedReq = req.body;

      // Set the socialPost properties that came from the POST data
      feed.uid = authentication.uid; //Multi Tenant
      feed.feedName = feedReq.feedName;
      feed.feedHandle = feedReq.feedHandle;
      feed.feedType = feedReq.feedType;
      feed.authentication = feedReq.authentication;
      feed.hashTag = feedReq.hashTag;

      // Save the socialPost and check for errors
      feed.save(function(err) {
        if (err) {
          console.error(err);
          return res.send(err);
        }

        res.json(feed);
      });
    }
  ).catch(function(err) {
    res.status(403).send(err);
  });
};

// Create endpoint /api/socialPosts for GET
exports.list = function(req, res) {
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      console.log(authentication.uid);
        Feed.get({ uid: authentication.uid }, function(err, feeds) {
          if (err) {
            console.log(JSON.stringify(err));
            return res.status(400).send({message: 'Error finding feed'});
          }

          
          if(feeds instanceof Array) {
            res.json(feeds);
          } else {
            var feedArray = [];
            if(feeds) feedArray.push(feeds);
            console.log('Feeds: ' + JSON.stringify(feedArray));
            res.json(feedArray);
          }
          
        });
    }
  ).catch(function(err) {
    console.log(JSON.stringify(err));
    if(err && err.message) {
      res.status(403).send(err);
    } else {
      res.status(403).send({message: 'Error Authenticating user'});
    }
  });
};

// Create endpoint /api/socialPost/:socialPost_id for GET
exports.readById = function(req, res) {
  console.log('readyById called ...');
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      console.log(JSON.stringify(authentication) + ' ' + JSON.stringify(req.swagger.params.id));
      Feed.get({uid: authentication.uid, feedHandle: req.swagger.params.id.value}, function(err, feed) {
        console.log(feed.feedHandle);
        if (err) {
          console.log(JSON.parse(err));
          return res.send(err);
        }

        if(feed) {
          if(feed instanceof Array) {
            res.json(feed);
          } else {
            var feedArray = [];
            if(feed) feedArray.push(feed);
            console.log('Feeds: ' + JSON.stringify(feedArray));
            res.json(feedArray);
          }
        } else {
          res.status(404).send({message: 'Feed not found'});
        }
      });
    }
  ).catch(function(err) {
    res.status(403).send(err);
  });
  
};

// Create endpoint /api/socialPosts/:socialPost_id for PUT
exports.updateById = function(req, res) {
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      var feed = req.body;

      var feedToUpdate = {
        feedName: feed.feedName,
        feedType: feed.feedType,
        feedStatus: feed.feedStatus,
        hashTag: feed.hashTag,
        scrappedSince: feed.scrappedSince
      };

      Feed.update(
        { 
          uid: authentication.uid,
          feedHandle: req.swagger.params.id.value
        }, 
        feedToUpdate, 
        function(err, num) {
          if (err) {
            return res.send(err);
          } else {
            var result = { message: 'Update sucessfull'};
            res.send(result);
          }
        }
      );
    }
  ).catch(function(err) {
    console.log(err);
    res.status(403).send(err);
  });
  
};

// Create endpoint /api/socialPosts/:socialPost_id for DELETE
exports.deleteById = function(req, res) {
  console.log('Delete by id called');
  // Use the socialPost model to find a specific socialPost and remove it
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      Feed.delete({ uid: authentication.uid, feedHandle: req.swagger.params.id.value }, function(err, num, raw) {
        if (err) {
          res.json(err); 
        }
        res.json({message: 'Deletion sucessfull!'});
      });
    }
  ).catch(function(err) {
    res.status(403).send(err);
  });  
};

exports.scrapNewPostsFromSource = function(req, res) {
  console.log('here ... ');
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      console.log('authenticated ... ' + authentication);
      Feed.get({ uid: authentication.uid, feedHandle: req.swagger.params.id.value }, function(err, feed) {
        if (err) {
          console.log(err);
          return res.send(err);
        }

        if(feed) {
          console.log('Feed found ...' + feed);
          FeedAuth.get({ uid: authentication.uid, feedHandle: feed.feedHandle}, function(err, feedAuth) {
            if(feedAuth) {
              console.log('FeedAuths found ...' + feedAuth);
              if(feed.feedType === 'facebook') {
                facebookScrapper.scrap(
                  feed,
                  feedAuth
                ).then(function(result) {
                  console.log('Scrapped ...' + JSON.stringify(result));
                  console.log(authentication.uid);
                  console.log(req.swagger.params.id.value);
                  Feed.update(
                  {
                    uid: authentication.uid,
                    feedHandle: req.swagger.params.id.value
                  }, 
                  { 
                    scrappedSince: result.since
                  }, 
                  function(err, num, raw) {
                    console.log(num);
                    res.json(result);  
                  });
                });
              } else {
                console.log('Feed type not supported');
                res.send({message: 'Feed type not supported!'});
              }
            } else {
              console.log('Authorization to scrap this feed is missing!');
              res.send({message: 'Authorization to scrap this feed is missing!'});
            }
          });
        }
        else {
          console.log({message: 'Feed not found!'});
          res.send({message: 'Feed not found!'});
        }
      });
    }
  ).catch(function(err) {
    console.log(err);
    res.status(403).send(err);
  });
}

exports.authorizeToScrap = function(req, res) {
  console.log('Calling authorizeToScrap');
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      // var feedId = new ObjectId(req.swagger.params.id.value)
      if(req.headers.access_token) {
        facebookUtils.getLongLivedAccessToken(req.headers.access_token).then(function(longLivedToken) {
          var feedAuth = new FeedAuth();
          feedAuth.authentication = JSON.parse(longLivedToken);
          FeedAuth.update(
            {
              uid: authentication.uid, 
              feedHandle: req.swagger.params.id.value
            }, feedAuth, 
            function(err, num, raw) {
              if(err) console.log(err);
              console.log(raw);
              console.log(num);
              // var result = { recordsAffected: num.nModified, message: num.nModified + ' record updated' };
              res.send({message: 'Scrapping is authorized on this feed'});
              // res.json(result);
            }
          );
        }).catch(function(err) {
          console.log(err);
          return res.send(err);
        });
      } else {
        res.send({message: 'Access token required to authenticate scrapping'});
      }
    });  
}