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

var admin = require('firebase-admin');

if(!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  throw new Error('Firebase service account not found');
}

if(!process.env.FIREBASE_API_KEY) {
  throw new Error('Firebase api key not found');
}

var serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);

app.locals.defaultFirebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID
});

app.get('/api-docs', function(req, res){
    res.sendFile('swagger.yaml', {root: './api/swagger'});
});

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }

  // install middleware
  swaggerExpress.register(app);

  // var port = process.env.PORT || 10010;
  // app.listen(port);

  // if (swaggerExpress.runner.swagger.paths['/hello']) {
  //   console.info('try this:\ncurl http://127.0.0.1:' + port + '/hello?name=Scott');
  // }
  // console.info('Server started on port: ' + port);
});
