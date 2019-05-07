'use strict'
const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');

const runner = require('./test-runner.js');
const fccTestingRoutes = require('./routes/fcctesting.js');
const ApiRoutes = require('./routes/api.js');

// Security middleware
app.use(helmet.frameguard({action: 'sameorigin'}));
app.use(helmet.dnsPrefetchControl());
app.use(helmet.referrerPolicy({policy: 'same-origin'}));

app.use(express.static('/public'));

app.use(cors({origin: '*'}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

app.get('/b/:board', (req, res) => {
  res.sendFile(__dirname + '/views/board.html');
});

app.get('/b/:board/:threadid', (req, res) => {
  res.sendFile(__dirname + '/views/thread.html');
});


fccTestingRoutes(app);

ApiRoutes(app, mongoose);

// Unmatched routes middleware
app.use((req, res, next) => {
  res.status(404)
  .type('text')
  .send('Not found');
});

mongoose.connect(process.env.DB, {useNewUrlParser: true});

mongoose.connection.on('error', console.error.bind(console, 'connection error'));

mongoose.connection.on('open', () => {
  console.log('database is connected...');
  app.listen(process.env.PORT || 3000, () => {
    console.log('listening on port ' + process.env.PORT);
    if (process.env.NODE_ENV === 'test') {
      console.log('running tests...');
      setTimeout(() => {
        try {
          runner.run();
        } catch(e) {
          console.log('tests are not valid');
          console.log(e);
        }
      }, 1500);
    }
  })
})

module.exports = app;
