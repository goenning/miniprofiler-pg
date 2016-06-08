'use strict';

var miniprofiler = require('miniprofiler');
var http = require('http');
var ip = require('docker-ip');

var pg = require('pg');
var connString = `postgres://docker:docker@${ip()}:5050/docker`;

var server = http.createServer((request, response) => {
  miniprofiler.express((req, res) => { return !req.url.startsWith('/unprofiled'); })(request, response, () => {
    require('../index.js')(pg).handler(request, response, () => {

      if (request.url == '/pg-select') {
        pg.connect(connString, function(err, client, done) {
          client.query('SELECT $1::int AS number', ['1'], function(err, result) {
            response.end('');
          });
        });
      }

      if (request.url == '/pg-select-event') {
        pg.connect(connString, function(err, client, done) {
          var query = client.query('SELECT $1::int AS number', ['1']);
          query.on('end', function() {
            response.end('');
          });
        });
      }

      if (request.url == '/unprofiled') {
        pg.connect(connString, function(err, client, done) {
          client.query('SELECT $1::int AS number', ['123456'], function(err, result) {
            response.end(result.rows[0].number.toString());
          });
        });
      }

    });
  });
});

module.exports = server;