var should = require('should');
var request = require('supertest');
var server = require('../../../app');
var mongoose = require("mongoose");
var SocialPost = require("../../../api/models/socialPost");
var Feed = require("../../../api/models/feed");
var ObjectId = require('mongoose').Types.ObjectId;
var sinon = require('sinon');
var auth = require('../../../api/controllers/auth');
var q = require('q');

describe('controllers', function() {
  beforeEach(function(done){
    sinon.stub(auth, 'authenticate', function(idToken) {
      var deferred = q.defer();
      if(idToken === 'UNAUTHORIZEDUSER') {
        deferred.reject({message: 'Invalid authentication token'});
      } else {
        deferred.resolve({uid: idToken});
      }
      return deferred.promise;
    });
    done();
  });
  describe('social post', function() {
    describe('GET /socialPosts', function() {
      Feed.collection.drop();
      SocialPost.collection.drop();

      var newFeed = new Feed({
        'uid': 'ANOTHERAUTHORIZEDUSER',
        'feedName': 'Feed Name',
        'feedType': 'none',
        'authentication': {}
      });

      var newSocialPost = new SocialPost({
        uid: "ANOTHERAUTHORIZEDUSER", 
        feedId: new ObjectId(),
        profileId: "test profile",
        profileName: "test profile name",
        profileImageUrl: "http://this.is.a.test/image.jpg",
        postText: "test text",
        postMediaUrl: "http://this.is.a.test.media/image.jpg",
        postMediaType: 'image',
        postedOn: new Date(),
        rawPost: {},
        tags: [],
        metaData: {},
        approvalStatus: 'new'
      });

      beforeEach(function(done){
        newFeed.save(function(err) {
          newSocialPost.feedId = new ObjectId(newFeed._id);
          newSocialPost.save(function(err) {
            done();
          });
        });
      });

      it('should return 403 - Invalid authentication token', function(done) {
        request(server)
          .get('/feed/' + newFeed._id + '/socialPosts')
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

      it('should not return any feeds for this user', function(done) {
        request(server)
          .get('/feed/' + newFeed._id + '/socialPosts')
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
        SocialPost.collection.drop();
        done();
      });
    });
    describe('GET /socialPosts', function() {
      Feed.collection.drop();
      SocialPost.collection.drop();

      var newFeed = new Feed({
        'uid': 'AUTHORIZEDUSER',
        'feedName': 'Feed Name',
        'feedType': 'none',
        'authentication': {}
      });

      var newDate = new Date();

      var newSocialPost = new SocialPost({
        uid: "AUTHORIZEDUSER", 
        feedId: new ObjectId(),
        profileId: "test profile",
        profileName: "test profile name",
        profileImageUrl: "http://this.is.a.test/image.jpg",
        postText: "test text",
        postMediaUrl: "http://this.is.a.test.media/image.jpg",
        postMediaType: 'image',
        postedOn: newDate,
        rawPost: {dummy: 'dummy'},
        tags: [],
        metaData: {dummy: 'dummy'},
        approvalStatus: 'new'
      });

      beforeEach(function(done){
        newFeed.save(function(err) {
          newSocialPost.feedId = new ObjectId(newFeed._id);
          newSocialPost.save(function(err) {
            done();
          });
        });
      });
      
      it('should return a list of feeds', function(done) {
        request(server)
          .get('/feed/' + newFeed._id + '/socialPosts')
          .set('idtoken',  'AUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.length.should.eql(1);
            res.body[0]._id.should.not.eql(undefined);
            res.body[0]._id.should.not.eql('');
            res.body[0].uid.should.eql(newSocialPost.uid);
            res.body[0].uid.should.eql(newSocialPost.uid);
            res.body[0].profileId.should.eql("test profile");
            res.body[0].profileName.should.eql("test profile name");
            res.body[0].profileImageUrl.should.eql("http://this.is.a.test/image.jpg");
            res.body[0].postText.should.eql("test text");
            res.body[0].postMediaUrl.should.eql("http://this.is.a.test.media/image.jpg");
            res.body[0].postMediaType.should.eql('image');
            (new Date(res.body[0].postedOn)).should.eql(newDate);
            res.body[0].rawPost.should.eql({dummy: 'dummy'});
            res.body[0].tags.should.eql([]);
            res.body[0].metaData.should.eql({dummy: 'dummy'});
            res.body[0].approvalStatus.should.eql('new');
            done();
          });
      });

      afterEach(function(done){
        SocialPost.collection.drop();
        Feed.collection.drop();
        done();
      });

    });
    describe('GET /feed', function() {
            Feed.collection.drop();
      SocialPost.collection.drop();

      var newFeed = new Feed({
        'uid': 'AUTHORIZEDUSER',
        'feedName': 'Feed Name',
        'feedType': 'none',
        'authentication': {}
      });

      var newDate = new Date();

      var newSocialPost = new SocialPost({
        uid: "AUTHORIZEDUSER", 
        feedId: new ObjectId(),
        profileId: "test profile",
        profileName: "test profile name",
        profileImageUrl: "http://this.is.a.test/image.jpg",
        postText: "test text",
        postMediaUrl: "http://this.is.a.test.media/image.jpg",
        postMediaType: 'image',
        postedOn: newDate,
        rawPost: {dummy: 'dummy'},
        tags: [],
        metaData: {dummy: 'dummy'},
        approvalStatus: 'new'
      });

      beforeEach(function(done){
        newFeed.save(function(err) {
          newSocialPost.feedId = new ObjectId(newFeed._id);
          newSocialPost.save(function(err) {
            done();
          });
        });
      });

      it('should return 403 - Invalid authentication token', function(done) {
        request(server)
          .get('/socialPost/' + newSocialPost._id)
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
          .get('/socialPost/' + newSocialPost._id)
          .set('idtoken', 'AUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            var socialPosts = res.body;
            socialPosts.length.should.eql(1);
            new ObjectId(socialPosts[0]._id).should.eql(newSocialPost._id);
            done();
          });
      });
      afterEach(function(done){
        Feed.collection.drop();
        done();
      });
    });
    describe('POST /socialPost', function() {
      Feed.collection.drop();
      SocialPost.collection.drop();

      var newFeed = new Feed({
        'uid': 'AUTHORIZEDUSER',
        'feedName': 'Feed Name',
        'feedType': 'none',
        'authentication': {}
      });

      var newSocialPost = [{
        uid: "AUTHORIZEDUSER", 
        feedId: new ObjectId(),
        profileId: "test profile",
        profileName: "test profile name",
        profileImageUrl: "http://this.is.a.test/image.jpg",
        postText: "test text",
        postMediaUrl: "http://this.is.a.test.media/image.jpg",
        postMediaType: 'image',
        postedOn: new Date(),
        rawPost: {},
        tags: [],
        metaData: {},
        approvalStatus: 'new'
      }];

      beforeEach(function(done){
        newFeed.save(function(err) {
          
          done();
        });
      });

      it('should return 403 - Invalid authentication token', function(done) {
        // console.log(newFeed._id);
        request(server)
          .post('/feed/' + newFeed._id + '/socialPosts')
          .set('idtoken',  'UNAUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .send(newSocialPost)          
          .expect('Content-Type', /json/)
          //.expect(403)
          .end(function(err, res) {
            console.log(res.body);
            console.log(res.status);
            should.not.exist(err);
            res.body.should.eql({ message: 'Invalid authentication token' });
            done();
          });
      });
      it('should not updated any feed', function(done) {
        // console.log(newFeed._id);
        request(server)
          .post('/feed/' + newFeed._id + '/socialPosts')
          .set('idtoken',  'AUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .send(newSocialPost)          
          .expect('Content-Type', /json/)
          //.expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            // console.log(res);
            //res.body.recordsAffected.should.eql(0);
            done();
          });
      });
      afterEach(function(done){
        Feed.collection.drop();
        SocialPost.collection.drop();
        done();
      });
    });
    describe('PUT /socialPost', function() {
      Feed.collection.drop();
      SocialPost.collection.drop();

      var newFeed = new Feed({
        'uid': 'ANOTHERAUTHORIZEDUSER',
        'feedName': 'Feed Name',
        'feedType': 'none',
        'authentication': {}
      });

      var newSocialPost = new SocialPost({
        uid: "ANOTHERAUTHORIZEDUSER", 
        feedId: new ObjectId(),
        profileId: "test profile",
        profileName: "test profile name",
        profileImageUrl: "http://this.is.a.test/image.jpg",
        postText: "test text",
        postMediaUrl: "http://this.is.a.test.media/image.jpg",
        postMediaType: 'image',
        postedOn: new Date(),
        rawPost: {},
        tags: [],
        metaData: {},
        approvalStatus: 'new'
      });

      beforeEach(function(done){
        newFeed.save(function(err) {
          newSocialPost.feedId = new ObjectId(newFeed._id);
          newSocialPost.save(function(err) {
            done();
          });
        });
      });

      it('should return 403 - Invalid authentication token', function(done) {
        request(server)
          .put('/socialPost/' + newSocialPost._id)
          .set('idtoken',  'UNAUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .send(newSocialPost)          
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
          .put('/socialPost/' + newSocialPost._id)
          .set('idtoken',  'AUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .send(newSocialPost)          
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            // console.log(res.body);
            //res.body.recordsAffected.should.eql(0);
            done();
          });
      });
      afterEach(function(done){
        Feed.collection.drop();
        SocialPost.collection.drop();
        done();
      });
    });
    describe('PUT /socialPost', function() {
      Feed.collection.drop();
      SocialPost.collection.drop();

      var newFeed = new Feed({
        'uid': 'ANOTHERAUTHORIZEDUSER',
        'feedName': 'Feed Name',
        'feedType': 'none',
        'authentication': {}
      });

      var newSocialPost = new SocialPost({
        uid: "AUTHORIZEDUSER", 
        feedId: new ObjectId(),
        profileId: "test profile",
        profileName: "test profile name",
        profileImageUrl: "http://this.is.a.test/image.jpg",
        postText: "test text",
        postMediaUrl: "http://this.is.a.test.media/image.jpg",
        postMediaType: 'image',
        postedOn: new Date(),
        rawPost: {},
        tags: [],
        metaData: {},
        approvalStatus: 'new'
      });

      beforeEach(function(done){
        newFeed.save(function(err) {
          newSocialPost.feedId = new ObjectId(newFeed._id);
          newSocialPost.save(function(err) {
            done();
          });
        });
      });
      
      it('should update the specific feed', function(done) {
        request(server)
          .put('/socialPost/' + newSocialPost._id)
          .set('idtoken',  'AUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .send(newSocialPost)
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
        SocialPost.collection.drop();
        done();
      });

    });
    describe('DELETE /socialPost', function() {
      Feed.collection.drop();
      SocialPost.collection.drop();

      var newFeed = new Feed({
        'uid': 'ANOTHERAUTHORIZEDUSER',
        'feedName': 'Feed Name',
        'feedType': 'none',
        'authentication': {}
      });

      var newSocialPost = new SocialPost({
        uid: "AUTHORIZEDUSER", 
        feedId: new ObjectId(),
        profileId: "test profile",
        profileName: "test profile name",
        profileImageUrl: "http://this.is.a.test/image.jpg",
        postText: "test text",
        postMediaUrl: "http://this.is.a.test.media/image.jpg",
        postMediaType: 'image',
        postedOn: new Date(),
        rawPost: {},
        tags: [],
        metaData: {},
        approvalStatus: 'new'
      });

      beforeEach(function(done){
        newFeed.save(function(err) {
          newSocialPost.feedId = new ObjectId(newFeed._id);
          newSocialPost.save(function(err) {
            done();
          });
        });
      });

      it('should return 403 - Invalid authentication token', function(done) {
        request(server)
          .delete('/socialPost/' + newSocialPost._id)
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

      it('should not delete any socialPost', function(done) {
        request(server)
          .delete('/socialPost/' + newSocialPost._id)
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
      afterEach(function(done){
        Feed.collection.drop();
        SocialPost.collection.drop();
        done();
      });
    });
    describe('DELETE /socialPost', function() {
      Feed.collection.drop();
      SocialPost.collection.drop();

      var newFeed = new Feed({
        'uid': 'ANOTHERAUTHORIZEDUSER',
        'feedName': 'Feed Name',
        'feedType': 'none',
        'authentication': {}
      });

      var newSocialPost = new SocialPost({
        uid: "AUTHORIZEDUSER", 
        feedId: new ObjectId(),
        profileId: "test profile",
        profileName: "test profile name",
        profileImageUrl: "http://this.is.a.test/image.jpg",
        postText: "test text",
        postMediaUrl: "http://this.is.a.test.media/image.jpg",
        postMediaType: 'image',
        postedOn: new Date(),
        rawPost: {},
        tags: [],
        metaData: {},
        approvalStatus: 'new'
      });

      beforeEach(function(done){
        newFeed.save(function(err) {
          newSocialPost.feedId = new ObjectId(newFeed._id);
          newSocialPost.save(function(err) {
            done();
          });
        });
      });
      
      it('should delete the specific feed', function(done) {
        request(server)
          .delete('/socialPost/' + newSocialPost._id)
          .set('idtoken',  'AUTHORIZEDUSER')
          .set('Accept', 'application/json')
          .send(newFeed)
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.eql({message: 'Record deleted sucessfully!'});
            // console.log(res.body);
            done();
          });
      });

      // afterEach(function(done){
      //   Feed.collection.drop();
      //   SocialPost.collection.drop();
      //   done();
      // });
    });
  });
  afterEach(function(done) {
    auth.authenticate.restore();
    done();
  });
});