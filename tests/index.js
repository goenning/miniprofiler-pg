'use strict';

const expect = require('chai').expect;
const request = require('request');
const server = require('./server.js');

describe('Postgres Tests', function() {

  before((done) => { server.listen(8080, done); });
  after((done) => { server.close(done); });

  for (const url of ['/pg-select', '/pg-select-event']) {

    it(`Should profile postgres SELECT command for url '${url}'`, function(done) {
      request(`http://localhost:8080${url}`, (err, response) => {
        const ids = JSON.parse(response.headers['x-miniprofiler-ids']);

        request.post({url: 'http://localhost:8080/mini-profiler-resources/results/', form: { id: ids[0], popup: 1 } }, (err, response, body) => {
          const result = JSON.parse(body);

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

  it('Should profile postgres NonQuery commands', function(done) {
    request('http://localhost:8080/insert', (err, response) => {
      const ids = JSON.parse(response.headers['x-miniprofiler-ids']);

      request.post({url: 'http://localhost:8080/mini-profiler-resources/results/', form: { id: ids[0], popup: 1 } }, (err, response, body) => {
        const result = JSON.parse(body);

        expect(result.Root.CustomTimings).to.have.property('sql');
        expect(result.Root.CustomTimings.sql).to.have.lengthOf(1);

        expect(result.Root.CustomTimings.sql[0].ExecuteType).to.be.equal('sql');
        expect(result.Root.CustomTimings.sql[0].CommandString).to.be.equal('INSERT INTO logs (name, date) VALUES ($1, $2)');
        expect(result.Root.CustomTimings.sql[0].DurationMilliseconds).to.be.below(result.DurationMilliseconds);
        done();
      });
    });
  });

  it('should not break pg usage on unprofiled routes', function(done) {
    request('http://localhost:8080/unprofiled', (err, response, body) => {
      expect(response.headers).to.not.include.keys('x-miniprofiler-ids');
      expect(body).to.be.equal('123456');
      done();
    });
  });

});
