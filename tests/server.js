'use strict';

const miniprofiler = require('miniprofiler');
const http = require('http');
const ip = require('docker-ip');

const pg = require('pg');
const connString = `postgres://docker:docker@${ip()}:5050/docker`;

const app = miniprofiler.express({
  enable: (req, res) => {
    return !req.url.startsWith('/unprofiled');
  }
});

const server = http.createServer((request, response) => {
  app(request, response, () => {
    require('../index.js')(pg).handler(request, response, () => {

      if (request.url == '/pg-select') {
        pg.connect(connString, function(err, client, done) {
          client.query('SELECT $1::int AS number', [ 3 ], function(err, result) {
            response.end('');
          });
        });
      }

      if (request.url == '/pg-select-event') {
        pg.connect(connString, function(err, client, done) {
          const query = client.query('SELECT $1::int AS number', [ 3 ]);
          query.on('end', function() {
            response.end('');
          });
        });
      }

      if (request.url == '/insert') {
        pg.connect(connString, function(err, client, done) {
          client.query('INSERT INTO logs (name, date) VALUES ($1, $2)', [ 'MiniProfiler', new Date() ], function(err, result) {
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
