var should = require('should');
var request = require('supertest');
var server = require('../../../app');
var mongoose = require("mongoose");
var Feed = require("../../../api/models/feed");

describe('controllers', function() {
  describe('feed', function() {
    describe('GET /feeds', function() {
      Feed.collection.drop();

      var newFeed = new Feed({
        'uid': 'ANOTHERAUTHORIZEDUSER',
        'feedName': 'Feed Name',
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
    describe('PUT /feed', function() {
      Feed.collection.drop();

      var newFeed = {
        'uid': 'ANOTHERAUTHORIZEDUSER',
        'feedName': 'Feed Name',
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
          .put('/feed/' + mongooseFeed._id)
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
      it('should not updated any feed', function(done) {
        request(server)
          .put('/feed/' + mongooseFeed._id)
          .set('idtoken',  'AUTHORIZEDUSER')
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
        'feedType': 'none',
        'authentication': {}
      };

      var mongooseFeed = new Feed(newFeed);

      beforeEach(function(done){
        mongooseFeed.save(function(err) {
          done();
        });
      });
      
      it('should update the specific feed', function(done) {
        request(server)
          .put('/feed/' + mongooseFeed._id)
          .set('idtoken',  'AUTHORIZEDUSER')
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
  });
});
