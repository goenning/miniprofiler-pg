'use strict';

var expect = require('chai').expect;
var request = require('request');
var server = require('./server.js');

describe('Postgres Tests', function() {

  before((done) => { server.listen(8080, done); });
  after((done) => { server.close(done); });

  for (let url of ['/pg-select', '/pg-select-event']) {

    it(`Should profile postgres SELECT command for url '${url}'`, function(done) {
      request(`http://localhost:8080${url}`, (err, response) => {
        var ids = JSON.parse(response.headers['x-miniprofiler-ids']);
        expect(ids).to.have.lengthOf(1);

        request.post({url: 'http://localhost:8080/mini-profiler-resources/results/', form: { id: ids[0], popup: 1 } }, (err, response, body) => {
          var result = JSON.parse(body);

          expect(result.Id).to.equal(ids[0]);
          expect(result.Name).to.equal(url);
          expect(result.Root.Children).to.be.empty;
          expect(result.Root.CustomTimings).to.have.property('sql');
          expect(result.Root.CustomTimings.sql).to.have.lengthOf(1);

          expect(result.Root.CustomTimings.sql[0].ExecuteType).to.be.equal('sql');
          expect(result.Root.CustomTimings.sql[0].CommandString).to.be.equal('SELECT $1::int AS number');
          expect(result.Root.CustomTimings.sql[0].DurationMilliseconds).to.be.below(result.DurationMilliseconds);
          done();
        });
      });
    });

  }

  it('should not break pg usage on unprofiled routes', function(done) {
    request('http://localhost:8080/unprofiled', (err, response, body) => {
      expect(response.headers).to.not.include.keys('x-miniprofiler-ids');
      expect(body).to.be.equal('123456');
      done();
    });
  });

});
