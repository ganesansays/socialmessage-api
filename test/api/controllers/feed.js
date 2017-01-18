var should = require('should');
var request = require('supertest');
var server = require('../../../app');

describe('controllers', function() {
  describe('feed', function() {
    describe('GET /feeds', function() {
      it('should return a list of feeds', function(done) {
        request(server)
          .get('/feeds')
          .set('idtoken',  'eyJhbGciOiJSUzI1NiIsImtpZCI6ImQ0YTgwYTg0YjUzY2ZhMmEzNGRiMDBlNWNmYjAxMDA4ZjM2Y2U4MGMifQ.eyJpc3MiOiJodHRwczovL3NlY3VyZXRva2VuLmdvb2dsZS5jb20vc29jaWFsdHYtOGVmNTUiLCJhdWQiOiJzb2NpYWx0di04ZWY1NSIsImF1dGhfdGltZSI6MTQ4NDcxMzM5MywidXNlcl9pZCI6IjUwa3ZEZUVPbmFYNVFEcnI1Y3I1anZpaTFMTTIiLCJzdWIiOiI1MGt2RGVFT25hWDVRRHJyNWNyNWp2aWkxTE0yIiwiaWF0IjoxNDg0NzM3MjA1LCJleHAiOjE0ODQ3NDA4MDUsImVtYWlsIjoiZ2FuZXNhbnNheXNAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJmaXJlYmFzZSI6eyJpZGVudGl0aWVzIjp7ImVtYWlsIjpbImdhbmVzYW5zYXlzQGdtYWlsLmNvbSJdfSwic2lnbl9pbl9wcm92aWRlciI6InBhc3N3b3JkIn19.GHjZTAnFksHST3aHlmse7jlHFQU7NjlK2bkBTKmNvq3MgpcPnqYE4hj7TO9NT_Z2rZYDl6GdsaPLqKaNFruGHBmGZFH3m0N9wQHQzz9EwMP8c9SYRnAVqICLl0wfVvdpbMg7xGOSX6CUc5ckX6rnXB6NjS3P5msfd-TOZhAy9CLnSqqypcQCUqKArZDZfHgPj_g2421MYmjYEsk91HNJ3FFOrNZmdO7Lp0Y_jy-6zOeLtckAA6ZY8o_DOlSfBLAVMYgiH8bfTpaOn1Y70Ft5G5v33hhM32UUMiIR_8nxWO1nzXEfTyLOwO5gnyWCiVLdQ2-mFqPLWxqW3oTj2TVXSQ')
          .set('Accept', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
          .end(function(err, res) {
            should.not.exist(err);

            res.body.should.eql([]);

            done();
          });
      });

    //   it('should accept a name parameter', function(done) {

    //     request(server)
    //       .get('/hello')
    //       .query({ name: 'Scott'})
    //       .set('Accept', 'application/json')
    //       .expect('Content-Type', /json/)
    //       .expect(200)
    //       .end(function(err, res) {
    //         should.not.exist(err);

    //         res.body.should.eql('Hello, Scott!');

    //         done();
    //       });
    //   });

    });

  });

});
