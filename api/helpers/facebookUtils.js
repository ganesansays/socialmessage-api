var https = require('https');
var q = require('q');

exports.getLongLivedAccessToken = function(facebookAccessToken) {
  var deferred = q.defer();

  var url = '/' + process.env.FACEBOOK_API_VERSION + 
            '/oauth/access_token' +           
            '?grant_type=fb_exchange_token' +           
            '&client_id=' + process.env.FACEBOOK_APP_ID + 
            '&client_secret=' + process.env.FACEBOOK_APP_SECRET +
            '&fb_exchange_token=' + facebookAccessToken; 

  var options = {
    host: 'graph.facebook.com',
    path: url,
    method: 'GET'
  };

  callback = function(response) {
    var str = ''
    response.on('data', function (chunk) {
      str += chunk;
    });

    response.on('end', function () {
      var result = JSON.parse(str);
      if(!result || result.error) {
        deferred.reject(result.error);
      } else {
        deferred.resolve(str);
      }
    });
  }

  var fbReq = https.request(options, callback);

  fbReq.on('error', function(err) {
    deferred.reject(err);
  });

  fbReq.end();

  return deferred.promise;
}