'use strict';

let pgQuery;

module.exports = function(pg) {
  pgQuery = pgQuery || pg.Client.prototype.query;

  return {
    name: 'pg',
    handler: function(req, res, next) {
      pg.Client.prototype.query = function(config, values, callback) {
        if (!req.miniprofiler || !req.miniprofiler.enabled)
          return pgQuery.apply(this, arguments);

        if (callback) {
          req.miniprofiler.timeQuery('sql', config.toString(), pgQuery.bind(this), config, values, callback);
          return;
        }

        const timing = req.miniprofiler.startTimeQuery('sql', config.toString());
        const query = pgQuery.call(this, config, values, callback);

        return query.then(result => {
          req.miniprofiler.stopTimeQuery(timing);
          return result;
        });
      };

      next();
    }
  };
};
