'use strict'

const model = require('../dbschemas.js');

module.exports = (app, mongoose) => {
  const Board = model(mongoose);
  
  app.route('/api/threads/:board')
    .get((req, res, next) => {
    let msgBoard = req.params.board.toLowerCase();
    
    Board.aggregate([
      {$match: {name: msgBoard}},
      {$project: {'threads.reported': 0, 'threads.delete_password': 0, 'threads.replies.reported': 0, 'threads.replies.delete_password': 0}},
    ]).
    then(docs => {
      if (docs.length > 0) {
        let b = docs[0];
        let threadArr = b.threads.slice(0, 10);
        threadArr = threadArr.map(obj => {
          obj.replies = obj.replies.slice(0, 3);
          return obj;
        });
        
        res.json(threadArr);
      } else {
        res.json([]);
      }
    }).
    catch(e => {
      next(e);
    })
  })
    .post((req, res, next) => {
    let msgBoard = req.params.board.toLowerCase();
    if (!req.body.text) {return res.status(400).json({message: 'thread text required'});}
    if (!req.body.delete_password) {return res.status(400).json({message: 'delete password required'});}
    let threadAdded = {
      text: req.body.text,
      delete_password: req.body.delete_password
    };
    
    Board.findOne({name: msgBoard}, (err, doc) => {
      if (err) {return next(err);}
      if (doc) {
        doc.threads.unshift(threadAdded);
        doc.save((err, doc) => {
          if (err) {return next(err);}
          res.redirect('/b/' + msgBoard);
        })
      } else {
        let newBoard = new Board({
          name: msgBoard,
          threads: [threadAdded]
        });
        newBoard.save((err, doc) => {
          if (err) {return next(err);}
          res.redirect('/b/' + msgBoard);
        })
      }
    })
  })
    .put((req, res, next) => {
    let msgBoard = req.params.board.toLowerCase();
    let id = req.body.thread_id;
    if (!id) {return res.status(400).json({message: 'thread id required'});}
    Board.findOneAndUpdate({name: msgBoard},
                           {$set: {'threads.$[i].reported': true}}, 
                           {arrayFilters: [{'i._id': id}]}, 
                           (err, doc) => {
      if (err) {return next(err);}
      if (doc) {
        return res.send('success');
      } else {
        return res.send('could not report thread id: ' + id);
      }
    })
  })
    .delete((req, res, next) => {
    let msgBoard = req.params.board.toLowerCase();
    if (!req.body.thread_id) {return res.status(400).json({message: 'thread id required'});}
    if (!req.body.delete_password) {return res.status(400).json({message: 'delete password required'});}
    Board.findOne({name: msgBoard, 'threads._id': req.body.thread_id}, (err, doc) => {
      if (err) {return next(err);}
      if (doc) {
        let thread = doc.threads.id(req.body.thread_id);
        if (thread.delete_password === req.body.delete_password) {
          thread.remove();
          doc.save(err => {
            if (err) {return next(err);}
            res.send('success');
          })
        } else {
          res.send('incorrect password');
        }
      } else {
        res.send('thread or board doesn\'t exist');
      }
    })
  });
  
  app.route('/api/replies/:board')
    .get((req, res, next) => {
    let msgBoard = req.params.board.toLowerCase();
    if (!req.query.thread_id) {
      return res.status(400).json({message: 'thread id is requried'});
    }
    let threadID = req.query.thread_id;
    Board.findOne({name: msgBoard}, (err, doc) => {
      if (err) {return next(err);}
      if (doc) {
        let thread = doc.threads.id(threadID);
        if (!thread) {
          return res.status(404).json({message: 'thread id ' + threadID + 'not found'});
        }
        delete thread.reported;
        delete thread.delete_password;
        thread.replies = thread.replies.map(reply => {
          delete reply.reported;
          delete reply.delete_password;
          return reply;
        });
        
        res.json(thread);
      } else {
        res.status(404).json({message: 'board: ' + msgBoard + 'not found'});
      }
    })
  })
    .post((req, res, next) => {
    let msgBoard = req.params.board.toLowerCase();
    if (!req.body.thread_id) {
      return res.status(400).json({message: 'thread id is required'});
    }
    let threadID = req.body.thread_id;
    Board.findOne({name: msgBoard}, (err, doc) => {
      if (err) {return next(err);}
      if (doc) {
        let thread = doc.threads.id(threadID);
        if (!thread) {
          return res.status(404).json({message: 'thread id ' + threadID + 'not found'});
        }
        thread.replies.push({text: req.body.text, delete_password: req.body.delete_password});
        thread.bumped_on = new Date();
        doc.save(err => {
          if (err) {return next(err);}
          Board.findOneAndUpdate({name: msgBoard}, {$push: {threads: {$each: [], $sort: {bumped_on: -1}}}}, (err) => {
            if (err) {return next(err);}
            res.redirect('/b/' + msgBoard + '/' + threadID);
          }) 
        })
      } else {
        res.status(404).json({message: 'board: ' + msgBoard + 'not found'});
      }
    })
  })
    .put((req, res, next) => {
    let msgBoard = req.params.board.toLowerCase();
    if (!req.body.thread_id) {
      return res.status(400).json({message: 'thread id is required'});
    } else if (!req.body.reply_id) {
      return res.status(400).json({messge: 'reply id is required'});
    }
    
    Board.findOneAndUpdate({name: msgBoard}, 
                           {$set: {'threads.$[i].replies.$[j].reported': true}}, 
                           {arrayFilters: [{'i._id': req.body.thread_id}, {'j._id': req.body.reply_id}]},
                          (err, doc) => {
      if (err) {return next(err);}
      if (doc) {
        res.send('success');
      } else {
        res.send('could not delete reply id: ' + req.body.reply_id);
      }
    })
  })
    .delete((req, res, next) => {
    let msgBoard = req.params.board.toLowerCase();
    if (!req.body.thread_id) {
      return res.status(400).json({message: 'thread id is required'});
    } else if (!req.body.reply_id) {
      return res.status(400).json({message: 'reply id is required'});
    } else if (!req.body.delete_password) {
      return res.status(400).json({message: 'reply delete password is required'});
    }
    Board.findOne({name: msgBoard}, (err, doc) => {
      if (err) {return next(err);}
      if (doc) {
        let thread = doc.threads.id(req.body.thread_id);
        if (!thread) {
         return res.status(404).send('thread id ' + req.body.thread_id + 'does not exist');
        }
        let reply = thread.replies.id(req.body.reply_id);
        if (!reply) {
        return res.status(404).send('reply id ' + req.body.reply_id + 'does not exist');
        }
        if (reply.delete_password === req.body.delete_password) {
          reply.text = '[deleted]';
          doc.save(err => {
            if (err) {return next(err);}
            res.send('success');
          })
        } else {
          res.send('incorrect password');
        }
      } else {
        res.status(404).json({message: 'board does not exist'});
      }
    })
  });
}
            
            
