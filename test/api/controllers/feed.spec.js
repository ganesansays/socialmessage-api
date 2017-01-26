var should = require('should');
var request = require('supertest');
var server = require('../../../app');
var mongoose = require("mongoose");
var Feed = require("../../../api/models/feed");
var ObjectId = require('mongoose').Types.ObjectId;
var nock = require('nock');
var sinon = require('sinon');
var auth = require('../../../api/controllers/auth');
var q = require('q');
var admin = require("firebase-admin");

describe('controllers', function() {
  beforeEach(function(done){
    sinon.stub(admin, 'app', function(){
      return {
        auth: function() {
          return {
            verifyIdToken: function(idToken) {
              var deferred = q.defer();
              if(idToken === 'UNAUTHORIZEDUSER') {
                deferred.reject({message: 'Invalid authentication token'});
              } else {
                deferred.resolve({sub: idToken});
              }
              return deferred.promise;
            }
          }
        }
      }
    });
   done();
  });
  describe('feed', function() {
    describe('GET /feeds', function() {
      Feed.collection.drop();

      var newFeed = new Feed({
        'uid': 'ANOTHERAUTHORIZEDUSER',
        'feedName': 'Feed Name',
        'feedHandle': 'feedHandle',
        'feedType': 'none',
        'authentication': {}
      });

      beforeEach(function(done){
        newFeed.save(function(err) {
          done();
        });
      });

      it('should return 403 - Invalid authentication token', function(done) {
        request(server)
          .get('/feeds')
          .set('idtoken',  'UNAUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end(function(err, res) {
            res.body.should.eql({ message: 'Invalid authentication token' });
            done();
          });
      });

      it('should not return any feeds for this user', function(done) {
        request(server)
          .get('/feeds')
          .set('idtoken',  'AUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql([]);
            
            done();
          });
      });

      afterEach(function(done){
        Feed.collection.drop();
        done();
      });
    });
    describe('GET /feeds', function() {
      Feed.collection.drop();

      var newFeed = {
        'uid': 'AUTHORIZEDUSER',
        'feedName': 'Feed Name',
        'feedHandle': 'feedHandle',
        'feedType': 'none',
        'authentication': {}
      };

      beforeEach(function(done){
        (new Feed(newFeed)).save(function(err) {
          done();
        });
      });
      
      it('should return a list of feeds', function(done) {
        request(server)
          .get('/feeds')
          .set('idtoken',  'AUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.length.should.eql(1);
            res.body[0]._id.should.not.eql(undefined);
            res.body[0]._id.should.not.eql('');
            res.body[0].uid.should.eql(newFeed.uid);
            res.body[0].feedName.should.eql(newFeed.feedName);
            res.body[0].feedHandle.should.eql(newFeed.feedHandle);
            res.body[0].feedType.should.eql(newFeed.feedType);
            res.body[0].feedStatus.should.eql('scheduled');

            done();
          });
      });

      afterEach(function(done){
        Feed.collection.drop();
        done();
      });

    });
    describe('POST /feeds', function() {
      Feed.collection.drop();

      var newFeed = new Feed({
        'feedName': 'Feed Name',
        'feedHandle': 'feedHandle',
        'feedType': 'none',
        'authentication': {}
      });

      beforeEach(function(done) {
        nock('https://graph.facebook.com')
          .get('/' + process.env.FACEBOOK_API_VERSION + 
            '/oauth/access_token' +           
            '?grant_type=fb_exchange_token' +           
            '&client_id=' + process.env.FACEBOOK_APP_ID + 
            '&client_secret=' + process.env.FACEBOOK_APP_SECRET +
            '&fb_exchange_token=dummyToken')
          .reply(200, {access_token: 'dummyToken'});
        done();
      })

      it('should return 403 - Invalid authentication token', function(done) {
        request(server)
          .post('/feeds')
          .set('idtoken',  'UNAUTHORIZEDUSER')
          .set('facebookaccesstoken', 'dummyToken')
          .set('Accept', 'application/json')
          .send(newFeed)
          .expect('Content-Type', /json/)
          .expect(403)
          .end(function(err, res) {
            res.body.should.eql({ message: 'Invalid authentication token' });
            done();
          });
      });

      it('should create a feed for this user', function(done) {
        request(server)
          .post('/feeds')
          .set('idtoken',  'AUTHORIZEDUSER')
          .set('facebookaccesstoken', 'dummyToken')
          .set('Accept', 'application/json')
          .send(newFeed)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            res.body._id.should.not.eql(undefined);
            res.body.uid.should.eql('AUTHORIZEDUSER');
            done();
          });
      });

      afterEach(function(done){
        Feed.collection.drop();
        done();
      });
    });
    describe('GET /feed', function() {
      Feed.collection.drop();

      var newFeedId = '';

      beforeEach(function(done){
        var newFeed = new Feed({
          'uid': 'AUTHORIZEDUSER',
          'feedName': 'Feed Name',
          'feedHandle': 'feedHandle',
          'feedType': 'none',
          'authentication': {}
        });
        newFeed.save(function(err) {
          newFeedId = newFeed._id;
          Feed.find({}, function(err, feeds) {
            done();
          })
        });
      });

      it('should return 403 - Invalid authentication token', function(done) {
        request(server)
          .get('/feed/' + newFeedId)
          .set('idtoken',  'UNAUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(403)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql({ message: 'Invalid authentication token' });
            done();
          });
      });
      
      it('should get the feed requested', function(done) {
        request(server)
          .get('/feed/' + newFeedId)
          .set('idtoken', 'AUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            var feeds = res.body;
            feeds.length.should.eql(1);
            new ObjectId(feeds[0]._id).should.eql(newFeedId);
            done();
          });
      });
      afterEach(function(done){
        Feed.collection.drop();
        done();
      });
    });
    describe('PUT /feed', function() {
      Feed.collection.drop();

      var newFeed = {
        'uid': 'ANOTHERAUTHORIZEDUSER',
        'feedName': 'Feed Name',
        'feedHandle': 'feedHandle',
        'feedType': 'none',
        'authentication': {}
      };

      var mongooseFeed = new Feed(newFeed);

      beforeEach(function(done){
        nock('https://graph.facebook.com')
          .get('/' + process.env.FACEBOOK_API_VERSION + 
            '/oauth/access_token' +           
            '?grant_type=fb_exchange_token' +           
            '&client_id=' + process.env.FACEBOOK_APP_ID + 
            '&client_secret=' + process.env.FACEBOOK_APP_SECRET +
            '&fb_exchange_token=dummyToken')
          .reply(200, {access_token: 'dummyToken'});

        mongooseFeed.save(function(err) {
          done();
        });
      })

      it('should return 403 - Invalid authentication token', function(done) {
        request(server)
          .put('/feed/' + mongooseFeed._id)
          .set('idtoken',  'UNAUTHORIZEDUSER')
          .set('facebookaccesstoken', 'dummyToken')
          .set('Accept', 'application/json')
          .send(newFeed)          
          .expect('Content-Type', /json/)
          .expect(403)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql({ message: 'Invalid authentication token' });
            done();
          });
      });
      it('should not updated any feed', function(done) {
        request(server)
          .put('/feed/' + mongooseFeed._id)
          .set('idtoken',  'AUTHORIZEDUSER')
          .set('facebookaccesstoken', 'dummyToken')
          .set('Accept', 'application/json')
          .send(newFeed)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.recordsAffected.should.eql(0);
            
            done();
          });
      });
      afterEach(function(done){
        Feed.collection.drop();
        done();
      });
    });
    describe('PUT /feed', function() {
      Feed.collection.drop();

      var newFeed = {
        'uid': 'AUTHORIZEDUSER',
        'feedName': 'Feed Name',
        'feedHandle': 'feedHandle',
        'feedType': 'none',
        'authentication': {}
      };

      var mongooseFeed = new Feed(newFeed);

      beforeEach(function(done){
        nock('https://graph.facebook.com')
          .get('/' + process.env.FACEBOOK_API_VERSION + 
            '/oauth/access_token' +           
            '?grant_type=fb_exchange_token' +           
            '&client_id=' + process.env.FACEBOOK_APP_ID + 
            '&client_secret=' + process.env.FACEBOOK_APP_SECRET +
            '&fb_exchange_token=dummyToken')
          .reply(200, {access_token: 'dummyToken'});

        mongooseFeed.save(function(err) {
          done();
        });
      })
      
      it('should update the specific feed', function(done) {
        request(server)
          .put('/feed/' + mongooseFeed._id)
          .set('idtoken',  'AUTHORIZEDUSER')
          .set('facebookaccesstoken', 'dummyToken')
          .set('Accept', 'application/json')
          .send(newFeed)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.recordsAffected.should.eql(1);

            done();
          });
      });

      afterEach(function(done){
        Feed.collection.drop();
        done();
      });

    });
    describe('DELETE /feed', function() {
      Feed.collection.drop();

      var newFeed = {
        'uid': 'ANOTHERAUTHORIZEDUSER',
        'feedName': 'Feed Name',
        'feedHandle': 'feedHandle',
        'feedType': 'none',
        'authentication': {}
      };

      var mongooseFeed = new Feed(newFeed);

      beforeEach(function(done){
        mongooseFeed.save(function(err) {
          done();
        });
      });

      it('should return 403 - Invalid authentication token', function(done) {
        request(server)
          .delete('/feed/' + mongooseFeed._id)
          .set('idtoken',  'UNAUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .send(newFeed)          
          .expect('Content-Type', /json/)
          .expect(403)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql({ message: 'Invalid authentication token' });
            done();
          });
      });

      it('should not delete any feed', function(done) {
        request(server)
          .delete('/feed/' + mongooseFeed._id)
          .set('idtoken',  'AUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .send(newFeed)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql({message: 'Record not found!'});
            done();
          });
      });
    });
    describe('DELETE /feed', function() {
      Feed.collection.drop();

      var newFeed = {
        'uid': 'AUTHORIZEDUSER',
        'feedName': 'Feed Name',
        'feedHandle': 'feedHandle',
        'feedType': 'none',
        'authentication': {}
      };

      var mongooseFeed = new Feed(newFeed);

      beforeEach(function(done){
        mongooseFeed.save(function(err) {
          done();
        });
      });
      
      it('should delete the specific feed', function(done) {
        request(server)
          .delete('/feed/' + mongooseFeed._id)
          .set('idtoken',  'AUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .send(newFeed)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql({message: 'Record deleted sucessfully!'});
            done();
          });
      });
    });
    describe('POST /feed/{id}/scrapNewPostFromSource', function() {
      Feed.collection.drop();

      var newFeed = {
        'uid': 'AUTHORIZEDUSER',
        'feedName': 'testFeed',
        'feedHandle': 'feedHandle',
        'feedType': 'facebook',
        'authentication': {}
      };

      var message = {
        message: 'This is a test message'
      };

      var mongooseFeed = new Feed(newFeed);

      beforeEach(function(done) {
        nock('https://graph.facebook.com')
          .get('/' + process.env.FACEBOOK_API_VERSION + 
            '/oauth/access_token' +           
            '?grant_type=fb_exchange_token' +           
            '&client_id=' + process.env.FACEBOOK_APP_ID + 
            '&client_secret=' + process.env.FACEBOOK_APP_SECRET +
            '&fb_exchange_token=dummyToken')
          .reply(200, {access_token: 'dummyToken'});

        nock('https://graph.facebook.com')
          .get('/' + process.env.FACEBOOK_API_VERSION + 
            '/' + newFeed.feedHandle + '/feed/?fields=' + process.env.FACEBOOK_API_FEED_FIELDS + 
            '&limit=' + process.env.FACEBOOK_API_FEED_LIMIT + 
            '&access_token=dummyToken' + 
            '&since=0')
          .reply(200, {data: [
            {
              id: 'facebookPostId', 
              from: {name: 'facebookPostFrom'}, 
              message: 'facebook post message',
              type: 'photo',
              source: 'https://source.of.the/image.jpg',
              created_time: new Date(),
            }
          ]});

        mongooseFeed.save(function(err) {
          console.log(mongooseFeed._id);
          done();
        })
      })

      it('should return 403 - Invalid authentication token', function(done) {
        request(server)
          .post('/feed/' + mongooseFeed._id + '/scrapNewPostsFromSource')
          .set('idtoken',  'UNAUTHORIZEDUSER')
          .set('facebookaccesstoken', 'dummyToken')
          .set('Accept', 'application/json')
          .send(message)
          .expect('Content-Type', /json/)
          .expect(403)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql({ message: 'Invalid authentication token' });
            done();
          });
      });

      it('should scrap new posts from facebook feed', function(done) {
        request(server)
          .post('/feeds')
          .set('idtoken',  'AUTHORIZEDUSER')
          // .set('facebookaccesstoken', 'dummyToken')
          .set('Accept', 'application/json')
          .send(newFeed)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            var feed_id = res.body._id;
            request(server)
              .post('/feed/' + feed_id + '/authorizeToScrap')
              .set('idtoken',  'AUTHORIZEDUSER')
              .set('access_token', 'dummyToken')
              .set('Accept', 'application/json')
              .send(message)
              .expect('Content-Type', /json/)
              .expect(200)
              .end(function(err, res) {
                should.not.exist(err);
                console.log(err);
                request(server)
                  .post('/feed/' + feed_id + '/scrapNewPostsFromSource')
                  .set('idtoken',  'AUTHORIZEDUSER')
                  .set('facebookaccesstoken', 'dummyToken')
                  .set('Accept', 'application/json')
                  .send(message)
                  .expect('Content-Type', /json/)
                  .expect(200)
                  .end(function(err, res) {
                    should.not.exist(err);
                    res.body.message.should.eql('1 post scrapped!');    
                    done();
                  });
              });
            //should.not.exist(err);
            
          });
        
      });

      afterEach(function(done){
        Feed.collection.drop();
        done();
      });
    });
  });
  afterEach(function(done) {
    admin.app.restore();
    done();
  });
});
