var Feed = require('../models/feed');
var FeedAuth = require('../models/feedAuth');
var authController = require('./auth');
var facebookUtils = require('../helpers/facebookUtils');
var ObjectId = require('mongoose').Types.ObjectId; 
var facebookScrapper = require('../modules/facebookScrapper');
var Feed = require('../models/feed');

// Create endpoint /api/socialPosts for POST
exports.postFeed = function(req, res) {
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      var feed = new Feed();
      var feedReq = req.body;

      // Set the socialPost properties that came from the POST data
      feed.uid = authentication.uid; //Multi Tenant
      feed.feedName = feedReq.feedName;
      feed.feedType = feedReq.feedType;
      feed.authentication = feedReq.authentication;
      feed.hashTag = feedReq.hashTag;

      // Save the socialPost and check for errors
      feed.save(function(err) {
        if (err) {
          console.log(err);
          return res.send(err);
        }

        if(req.headers.facebookaccesstoken) {
          facebookUtils.getLongLivedAccessToken(req.headers.facebookaccesstoken).then(function(longLivedToken) {
            console.log(longLivedToken);
            var feedAuth = new FeedAuth();
            feedAuth.feedId = feed._id;
            feedAuth.authentication = JSON.parse(longLivedToken);
            feedAuth.save(function(err){
              console.log(err);
              res.json(feed);
            });
          }).catch(function(err) {
            console.log(err);
            res.json(feed);
          });
        } else {
          res.json(feed);
        }
      });
    }
  ).catch(function(err) {
    res.status(403).send(err);
  });
};

// Create endpoint /api/socialPosts for GET
exports.getFeeds = function(req, res) {
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
        console.log(authentication);
        Feed.find({ uid: authentication.uid }, function(err, feeds) {
          console.log(feeds);
          if (err)
            return res.send(err);

          res.json(feeds);
        });
    }
  ).catch(function(err) {
    res.status(403).send(err);
  });
};

// Create endpoint /api/socialPost/:socialPost_id for GET
exports.getFeedById = function(req, res) {
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      console.log(authentication + ' ' + JSON.stringify(req.swagger.params.id));
      Feed.find({ uid: authentication.uid, _id: new ObjectId(req.swagger.params.id.value) }, function(err, feed) {
        console.log(feed);
        if (err)
          return res.send(err);

        if(feed && feed.length > 0) {
          res.json(feed);
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
exports.putFeedById = function(req, res) {
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      console.log(authentication);
      var feed = req.body;

      Feed.update(
        { 
          uid: authentication.uid,
          _id: new ObjectId(req.swagger.params.id.value) 
        }, 
        { 
          feedName: feed.feedName,
          feedType: feed.feedType,
          authentication: feed.authentication,
          feedStatus: feed.feedStatus,
          hashTag: feed.hashTag
        }, 
        function(err, num, raw) {
          console.log(err);
          if (err) {
            return res.send(err);
          } else {

            if(req.headers.facebookaccesstoken) {
              facebookUtils.getLongLivedAccessToken(req.headers.facebookaccesstoken).then(function(longLivedToken) {
                console.log(longLivedToken);
                var feedAuth = new FeedAuth();
                feedAuth.feedId = feed._id;
                feedAuth.authentication = JSON.parse(longLivedToken);
                FeedAuth.findOneAndUpdate({feedId: new ObjectId(req.swagger.params.id.value)}, feedAuth, {upsert:true}, function(err){
                  if(err) console.log(err);
                  var result = { recordsAffected: num.ok, message: num.ok + ' record updated' };
                  res.json(result);
                });
              }).catch(function(err) {
                if(err) console.log(err);
                var result = { recordsAffected: num.ok, message: num.ok + ' record updated' };
                res.json(result);
              });
            }
          }
        }
      );
    }
  ).catch(function(err) {
    res.status(403).send(err);
  });
  
};

// Create endpoint /api/socialPosts/:socialPost_id for DELETE
exports.deleteFeedById = function(req, res) {
  // Use the socialPost model to find a specific socialPost and remove it
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      Feed.remove({ uid: authentication.uid, _id: new ObjectId(req.swagger.params.id.value) }, function(err) {
        console.log(num);
        if (err)
          return res.send(err);

        res.json({message: 'Feed removed!'});
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
      Feed.find({ uid: authentication.uid, _id: new ObjectId(req.swagger.params.id.value) }, function(err, feeds) {
        if (err) {
          console.log(err);
          return res.send(err);
        }

        if(feeds.length > 0) {
          console.log('Feed found ...' + feeds);
          FeedAuth.find({ feedId: new ObjectId(req.swagger.params.id.value) }, function(err, feedAuths) {
            if(feedAuths.length > 0) {
              console.log('FeedAuths found ...' + feedAuths);
              if(feeds[0].feedType === 'facebook') {
                facebookScrapper.scrap(
                  feeds[0],
                  feedAuths[0]
                ).then(function(result) {
                  console.log('Scrapped ...' + JSON.stringify(result));
                  Feed.update(
                  {
                    uid: authentication.uid,
                    _id: new ObjectId(req.swagger.params.id.value) 
                  }, 
                  { 
                    scrappedSince: result.since
                  }, 
                  function(err, num, raw) {
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