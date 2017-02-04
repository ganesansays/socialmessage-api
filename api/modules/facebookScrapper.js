var https = require('https');
var socialPostController = require('../controllers/socialPost');
var SocialPost = require('../models/socialPost');
var q = require('q');

//****************************************************************************//
//  1) scrap - Function to scrap content from facebook page/feed
//     Input:
//       1. Feed to be scrapped
//       2. FeedAuth - Authorization for the feed
//     Output:
//       Returns a promise
//     Resolve: JSON({since:XXX, error: xxx})
//       since - current epoch time in seconds;
//       error - any error while retriving information
//       count - post scrapped
//****************************************************************************//
exports.scrap = function(feed, feedAuth) {
  var uid = feed.uid;
  var feedId = feed.feedHandle; 
  var facebookAccessToken = feedAuth.authentication.access_token; 
  var pageId = feed.feedHandle;
  var since = feed.scrappedSince;
  
  var deferred = q.defer();
  if(!uid) {
    deferred.resolve({error: 'User Id is missing!'});
  }

  if(!feedId) {
    deferred.resolve({error: 'Feed Id is missing!'});
  }
  
  if(!facebookAccessToken) {
    deferred.resolve({error: 'Facebook access token missing!'});
  }

  if(!pageId) {
    deferred.resolve({error: 'Facebook pageId missing!'});
  }

  if(!since) {
    since = 0;
  }

  var FACEBOOK_API_FEED_FIELDS='id,name,picture,message,source,type,from,created_time'


  var url = '/' + process.env.FACEBOOK_API_VERSION + 
            '/' + pageId + '/feed/?fields=' + FACEBOOK_API_FEED_FIELDS + 
            '&limit=' + process.env.FACEBOOK_API_FEED_LIMIT + 
            '&access_token=' + facebookAccessToken + 
            '&since=' + since;

  getAllData(uid, feedId, url, 0, deferred);
  
  return deferred.promise;
}

//Get all the data from facebook since last time
function getAllData(uid, feedId, url, totalCount, deferred) {
  var promise = getData(uid, feedId, url);

  promise.then(function(result) {
      if(result.count > 0 && result.url) {
        getAllData(uid, feedId, result.url, totalCount+result.count, deferred);
      } else {
        var response = {}
        
        response.message = totalCount + result.count + ' post scrapped!';

        if(result.error) {
          response.error = result.error;
        } else {
          response.since = Math.floor(new Date().getTime() / 1000);
        }

        deferred.resolve(response);
      }
    }
  )
}

//Get 100 feeds per call
//Another level of promise is used to handle recursive call to get all the data
//from facebook until the data returned is blank
var getData = function(uid, feedId, url) {
  var deferred = q.defer();

  var options = {
    host: 'graph.facebook.com',
    path: url
  };

  callback = function(response) {
    var str = ''
    response.on('data', function (chunk) {
      str += chunk;
    });

    response.on('end', function () {
      var content = JSON.parse(str);
      if(content && content.data) {
        createPosts(uid, feedId, content.data, function(result) {
          var next = '';
          if(content.paging && content.paging.next) {
            next = content.paging.next;
            deferred.resolve({count: content.data.length, url: next});
          } else {
            deferred.resolve({count: content.data.length});
          }
        });
      } else if(content && content.error) {
        console.error('Resolve Error: ' + content.error);
        deferred.resolve({count: 0, error: content.error.message});
      }
      else {
        deferred.resolve({count: 0});
      }
    });
  }

  console.log(options);

  var fbReq = https.request(options, callback);

  fbReq.on('error', function(err) {
    console.log(err);
    deferred.resolve({count: 0});
  });

  fbReq.end();

  return deferred.promise;
}

var createPosts = function(uid, feedId, data, cb) {
  var posts = [];

  if(data && data.length > 0) {
    for (var i = 0, len = data.length; i < len; i++) {
      var socialPost = {};
      socialPost.feedHandle = feedId;
      socialPost.uid = uid;
      socialPost.profileId = data[i].id; 
      socialPost.profileName =  data[i].from.name;
      socialPost.profileImageUrl = 'http://graph.facebook.com/' + socialPost.profileId + '/picture?type=square'; 
      socialPost.postText = data[i].message; 

      if(data[i].type === 'video') {
        socialPost.postMediaUrl = data[i].source;
        socialPost.postMediaType = 'video';
      } else if(data[i].picture || data[i].type === 'photo') {
        socialPost.postMediaUrl = data[i].picture; 
        socialPost.postMediaType = 'image';
      } 

      socialPost.postedOn = data[i].created_time; 
      socialPost.rawPost = data[i];
      posts.push(socialPost);
    }

    SocialPost.batchPut(posts, function(err, socialPosts) {
      if (err) {
        console.log(err);
        cb(null);
      } else {
        cb(socialPosts);
      }
    });
  } else {
    cb(null);
  }
}