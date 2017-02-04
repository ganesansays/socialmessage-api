var admin = require("firebase-admin");
var q = require('q');

module.exports.authenticate = function (idToken) {
  var deferred = q.defer();

  try {
    if(idToken) {
      admin.app().auth().verifyIdToken(idToken).then(function(decodedToken) {
          var uid = decodedToken.sub;
          if(uid) {
              deferred.resolve({uid: uid});
          } else {
              deferred.reject({message: 'Invalid authentication token'});
          }
          }).catch(function(error) {
              console.error('Error auth token ' + JSON.stringify(error));
              deferred.reject({message: 'Invalid authentication token'});
          });
      }
  } catch(ex) {
      console.error('auth->authenticate: Exception: ' + ex);
      deferred.reject({message: 'Server internal error'});
  }
  return deferred.promise;
}