'use strict';

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
var mongoose = require('mongoose');

require('dotenv').load(); 
module.exports = app; // for testing

var config = {
  appRoot: __dirname // required config
};

// Connect to the socialPosts MongoDB
mongoose.connect(process.env.MONGODB_URI);

// if(!process.env.CI) {
  var admin = require('firebase-admin');
  var serviceAccount =  JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

  //console.log(JSON.stringify(serviceAccount));

  app.locals.defaultFirebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.FIREBASE_DATABASE_URL,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
  });
// }


SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);

  var port = process.env.PORT || 10010;
  app.listen(port);

  if (swaggerExpress.runner.swagger.paths['/hello']) {
    console.info('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
  }
});
