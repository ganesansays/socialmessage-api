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

        // if(req.headers.facebookaccesstoken) {
        //   facebookUtils.getLongLivedAccessToken(req.headers.facebookaccesstoken).then(function(longLivedToken) {
        //     var feedAuth = new FeedAuth();
        //     feedAuth.feedId = feed._id;
        //     feedAuth.authentication = JSON.parse(longLivedToken);
        //     feedAuth.save(function(err){
        //       console.error(err);
        //       res.json(feed);
        //     });
        //   }).catch(function(err) {
        //     console.error(err);
        //     res.json(feed);
        //   });
        // } else {
        //   res.json(feed);
        // }
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
        Feed.find({ uid: authentication.uid }, function(err, feeds) {
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
exports.readById = function(req, res) {
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      console.log(JSON.stringify(authentication) + ' ' + JSON.stringify(req.swagger.params.id));
      Feed.find({}, function(err, feed) {
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
exports.updateById = function(req, res) {
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      var feed = req.body;

      var feedToUpdate = {
        feedName: feed.feedName,
        feedHandle: feed.feedHandle,
        feedType: feed.feedType,
        feedStatus: feed.feedStatus,
        feedHandle: feed.feedHandle
      };

      var unset = {};

      if(feed.hashTag) feedToUpdate.hashTag = feed.hashTag;
      else unset.hashTag = 1;

      Feed.update(
        { 
          uid: authentication.uid,
          _id: new ObjectId(req.swagger.params.id.value) 
        }, 
        feedToUpdate, 
        {
          $unset: unset
        },
        function(err, num, raw) {
          if (err) {
            return res.send(err);
          } else {
            // if(req.headers.facebookaccesstoken) {
            //   facebookUtils.getLongLivedAccessToken(req.headers.facebookaccesstoken).then(function(longLivedToken) {
            //     var feedAuth = new FeedAuth();
            //     feedAuth.feedId = feed._id;
            //     feedAuth.authentication = JSON.parse(longLivedToken);
            //     FeedAuth.findOneAndUpdate({feedId: new ObjectId(req.swagger.params.id.value)}, feedAuth, {upsert:true}, function(err){
            //       if(err) console.log(err);
            //       var result = { recordsAffected: num.nModified, message: num.nModified + ' record updated' };
            //       res.json(result);
            //     });
            //   }).catch(function(err) {
            //     if(err) console.log(err);
            //     var result = { recordsAffected: num.nModified, message: num.nModified + ' record updated' };
            //     res.json(result);
            //   });
            // } else {
            //   //console.log(num);
            //   var result = { recordsAffected: num.nModified, message: num.nModified + ' record updated' };
            //   res.json(result);
            // }
            var result = { recordsAffected: num.nModified, message: num.nModified + ' record updated' };
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
  // Use the socialPost model to find a specific socialPost and remove it
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      Feed.remove({ uid: authentication.uid, _id: new ObjectId(req.swagger.params.id.value) }, function(err, num, raw) {
        if (err) {
          res.json(err); 
        }
          
        
        if(num.result.n > 0) {
          res.json({message: 'Record deleted sucessfully!'});
        } else {
          res.json({message: 'Record not found!'});
        }
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
                  console.log(authentication.uid);
                  console.log(req.swagger.params.id.value);
                  Feed.update(
                  {
                    uid: authentication.uid,
                    _id: new ObjectId(req.swagger.params.id.value) 
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
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      var feedId = new ObjectId(req.swagger.params.id.value)
      if(req.headers.access_token) {
        facebookUtils.getLongLivedAccessToken(req.headers.access_token).then(function(longLivedToken) {
          var feedAuth = new FeedAuth();
          feedAuth.uid = authentication.uid;
          feedAuth.feedId = feedId;
          feedAuth.authentication = JSON.parse(longLivedToken);
          FeedAuth.findOneAndUpdate(
            {
              uid: authentication.uid, 
              feedId: new ObjectId(req.swagger.params.id.value)
            }, feedAuth, 
            { upsert: true }, 
            function(err, num, raw) {
            if(err) console.log(err);
              // var result = { recordsAffected: num.nModified, message: num.nModified + ' record updated' };
              res.send({message: 'Scrapping is authorized on this feed'});
              // res.json(result);
            }
          );
        }).catch(function(err) {
          return res.send(err);
        });
      } else {
        res.send({message: 'Access token required to authenticate scrapping'});
      }
    });  
}