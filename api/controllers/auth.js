var admin = require("firebase-admin");
var q = require('q');

module.exports.authenticate = function (idToken) {
  var deferred = q.defer();

  try {
    if(idToken) {
      if(process.env.CI) { // Handle CI issues ...
        if(idToken !== "UNAUTHORIZEDUSER") {
          deferred.resolve({uid: idToken});
        } else {
          deferred.reject({message: 'Invalid authentication token'});
        }
      } else {
        admin.app().auth().verifyIdToken(idToken).then(function(decodedToken) {
            var uid = decodedToken.sub;
            if(uid) {
                deferred.resolve({uid: uid});
            } else {
                deferred.reject({message: 'Invalid authentication token'});
            }
            }).catch(function(error) {
                console.log('Error auth token ' + error);
                deferred.reject({message: 'Invalid authentication token'});
            });
        }
      } else {
        deferred.reject({message: 'idtoken is missing in header'});
      }
  } catch(ex) {
      console.log(ex);
      deferred.reject({message: 'Server internal error'});
  }
  return deferred.promise;
}