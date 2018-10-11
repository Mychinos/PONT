
const fs = require('fs');
const { join } = require('path');
const express = require('express');
const app = express();
//const https = require('https');
const http = require('http').Server(app);
const io = require('socket.io')(http);
var basicAuth = require('express-basic-auth')
const dataBackend = require('./backends/data/lowdb');
const dataset = require('./testData.json');
/*
// returns an instance of node-greenlock with additional helper methods
var lex = require('greenlock-express').create({
  // set to https://acme-v01.api.letsencrypt.org/directory in production
  server: 'staging'

// If you wish to replace the default plugins, you may do so here
//
, challenges: { 'http-01': require('le-challenge-fs').create({ webrootPath: '/tmp/acme-challenges' }) }
, store: require('le-store-certbot').create({ webrootPath: '/tmp/acme-challenges' })

// You probably wouldn't need to replace the default sni handler
// See https://git.daplie.com/Daplie/le-sni-auto if you think you do
//, sni: require('le-sni-auto').create({})

, approveDomains: approveDomains
});

function approveDomains(opts, certs, cb) {
  // This is where you check your database and associated
  // email addresses with domains and agreements and such


  // The domains being approved for the first time are listed in opts.domains
  // Certs being renewed are listed in certs.altnames
  if (certs) {
    opts.domains = certs.altnames;
  }
  else {
    opts.domains = ["www.shadowbase.ddns.net", "shadowbase.ddns.net", "localhost"];
    opts.email = 'e.funkfeuer@gmail.com';
    opts.agreeTos = true;
  }

  // NOTE: you can also change other options such as `challengeType` and `challenge`
  // opts.challengeType = 'http-01';
  // opts.challenge = require('le-challenge-fs').create({});

  cb(null, { options: opts, certs: certs });
}
*/

app.use(basicAuth({
  users: { 'admin': 'test' },
  challenge: true,
  realm: 'shadowbase.ddns.net',
}));
app.use(express.static('static'));

app.get('/', function (req, res) {
  res.sendFile(join(__dirname, 'static', 'index.html'));
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('getDataSet', (cb) => {
    cb(dataset);
  });
  socket.on('getElement', (id, cb) => {
    console.log('send element');
    return dataBackend.getElementData(id, cb);
  });
});

http.listen(80, () => {
  console.log('Server Listening to HTTP');
});

/*
http.createServer(lex.middleware(require('redirect-https')())).listen(80, function () {
  console.log("Listening for ACME http-01 challenges on", this.address());
});

// handles your app
https.createServer(lex.httpsOptions, lex.middleware(app)).listen(443, function () {
  console.log("Listening for ACME tls-sni-01 challenges and serve app on", this.address());
});
*/
