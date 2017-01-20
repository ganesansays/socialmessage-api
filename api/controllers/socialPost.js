// Load required packages
var SocialPost = require('../models/socialPost');
var authController = require('./auth');
var ObjectId = require('mongoose').Types.ObjectId;

// Create endpoint /api/socialPosts for POST
exports.postSocialPost = function(req, res) {
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      if(req.body.constructor === Array) {
        var posts = req.body;

        insertMany(posts,authentication.uid, req.swagger.params.id.value, function(result) {
          res.send(result);
        }, function(err) {
          res.send(err);
        })
        
      } else {
        res.status(400).send({message: 'Invalid input'});
      }
    }
  ).catch(function(err) {
    res.status(403).send(err);
  });
};

var insertMany = function(posts, uid, feedId, scb, ecb) {
  for (var i = 0, len = posts.length; i < len; i++) {
    posts[i].feedId = feedId;
    posts[i].uid = uid;
  }

  SocialPost.insertMany(posts, function(err, socialPosts) {
    if (err) {
      ecb(err);
    } else {
      scb(socialPosts);
    }
  });
}

exports.insertMany = insertMany;

// Create endpoint /api/socialPosts for GET
exports.getSocialPosts = function(req, res) {
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      SocialPost.find({ uid: authentication.uid, feedId: new ObjectId(req.swagger.params.id.value) }, function(err, socialPosts) {
        if (err) {
          console.log(err);
          return res.send(err);
        }

        console.log(JSON.stringify(socialPosts));
        res.json(socialPosts);
      });
    }).catch(function(err) {
      console.log(err);
      res.status(403).send(err);
    });
};

// Create endpoint /api/socialPost/:socialPost_id for GET
exports.getSocialPostById = function(req, res) {
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
        console.log(authentication);
        SocialPost.find({ uid: authentication.uid, _id: new ObjectId(req.swagger.params.id.value) }, function(err, socialPost) {
          if (err)
            return res.send(err);
          console.log(socialPost);

          res.json(socialPost);
        });
    }
  ).catch(function(err) {
    res.status(403).send(err);
  });
};

// Create endpoint /api/socialPosts/:socialPost_id for PUT
exports.putSocialPostById = function(req, res) {
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
      var post = req.body;

      SocialPost.update(
        { 
          uid: authentication.uid,
          _id: new ObjectId(req.swagger.params.id.value)
        }, 
        { 
          profileId: post.profileId, 
          profileName: post.profileName,
          profileImageUrl: post.profileImageUrl, 
          postText: post.postText,
          postMediaUrl: post.postMediaUrl,
          postMediaType: post.postMediaType,
          postedOn: post.postedOn,
          tags: post.tags,
          metaData: post.metaData,
          approvalStatus: post.approvalStatus
        }, 
        function(err, num, raw) {
          if (err) {
            console.log(err);
            return res.send(err);
          } else {
            var result = { recordsAffected: num.nModified, message: num.nModified + ' record updated' };
            console.log(JSON.stringify(num));
            res.json(result);
          }
        }
      );
    }
  ).catch(function(err) {
    res.status(403).send(err);
  });
};

// Create endpoint /api/socialPosts/:socialPost_id for DELETE
exports.deleteSocialPostById = function(req, res) {
  authController.authenticate(req.headers.idtoken).then(
    function(authentication) {
        console.log(authentication);
        console.log(req.swagger.params.id);
        SocialPost.remove(
          { uid: authentication.uid, _id: new ObjectId(req.swagger.params.id.value) }, 
          function(err, num, raw) {
            if (err) {
              console.log(err);
              return res.send(err);
            }

            if(num.result.n > 0) {
              res.json({message: 'Record deleted sucessfully!'});
            } else {
              res.json({message: 'Record not found!'});
            }
          }
        );
    }
  ).catch(function(err) {
    console.log(err);
    res.status(403).send(err);
  });
};