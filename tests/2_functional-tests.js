/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  
  let deleteThread;
  let replyThread;

  suite('API ROUTING FOR /api/threads/:board', function() {
    
    test('POST', function(done) {
      chai.request(server)
      .post('/api/threads/test')
      .send({text: 'test text', delete_password: 'testDelete'})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.headers['content-type'], 'text/html; charset=UTF-8');
        
        done();
      })
    });
    
    test('GET', function(done) {
      chai.request(server)
      .get('/api/threads/test')
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.isArray(res.body);
        assert.isAtMost(res.body.length, 10);
        assert.isAtMost(res.body[0].replies.length, 3);
        assert.property(res.body[0], '_id');
        assert.property(res.body[0], 'text');
        assert.property(res.body[0], 'created_on');
        assert.property(res.body[0], 'bumped_on');
        
        deleteThread = res.body[0]._id;
        replyThread = res.body[1]._id;
        
        done();
      })
    });
    
     
    test('PUT', function(done) {
      chai.request(server)
      .put('/api/threads/test')
      .send({thread_id: deleteThread})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        
        done();
      })
    });
    
    test('DELETE', function(done) {
      chai.request(server)
      .delete('/api/threads/test')
      .send({thread_id: deleteThread, delete_password: 'testDelete'})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        
        done();
      })
    });
    
  });
  
  suite('API ROUTING FOR /api/replies/:board', function() {
    
    let replyID;
    
    test('POST', function(done) {
      chai.request(server)
      .post('/api/replies/test/')
      .send({thread_id: replyThread, text: 'test reply', delete_password: 'deleteReply'})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.headers['content-type'], 'text/html; charset=UTF-8');
        
        done();
      })
    });
    
    test('GET', function(done) {
      chai.request(server)
      .get('/api/replies/test/?thread_id=' + replyThread)
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.property(res.body, '_id');
        assert.property(res.body, 'text');
        assert.property(res.body, 'created_on');
        assert.property(res.body, 'bumped_on');
        assert.isArray(res.body.replies);
        assert.property(res.body.replies[0], '_id');
        assert.property(res.body.replies[0], 'text');
        assert.property(res.body.replies[0], 'created_on');
        
        replyID = res.body.replies[0]._id;
        
        done();
      })
    });
    
    test('PUT', function(done) {
      chai.request(server)
      .put('/api/replies/test')
      .send({thread_id: replyThread, reply_id: replyID})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        
        done();
      })
    });
    
    test('DELETE', function(done) {
      chai.request(server)
      .delete('/api/replies/test')
      .send({thread_id: replyThread, reply_id: replyID, delete_password: 'deleteReply'})
      .end((err, res) => {
        assert.equal(res.status, 200);
        assert.equal(res.text, 'success');
        
        done();
      })
    });
    
  });

});
