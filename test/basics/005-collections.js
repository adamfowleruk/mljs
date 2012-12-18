var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
    assert = require('assert'),
    winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.File({ filename: '../005-collections.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: '../005-collections.log' })
  ]
});

tests.collections = function(callback) {
  var db = new mldb(); // default options
  db.setLogger(logger);
  
  // add three docs to the collection
  var col = {collection: "testcol"};
  var uris = ["/collections/1","/collections/2","/collections/3"];
  db.save({name:"first"},uris[0],col,function(result) {
    db.save({name:"second"},uris[1],col,function(result) {
      db.save({name:"third"},uris[2],col,function(result) {
      logger.debug("TEST: collections() Third save complete. Results object: " + JSON.stringify(result));
        // get docs in collection
        db.collect(col.collection,function(result) {
          // ensure there are 3
          logger.debug("TEST: collections() collect results object: " + JSON.stringify(result));
          assert(3==result.results.length,"There should only be three documents in " + col.collection);
          
          // now remove docs in collection
          db.delete(uris[0],function(result) {
            db.delete(uris[1],function(result) {
              db.delete(uris[2],function(result) {
                logger.debug("TEST: collections() returning true for success");
                callback(true);
              });
            });
          });
        });
      });
    });
  });
};

tests.collections_ok = function(t) {
  assert.ok(t);
};

ensure(__filename, tests, module,process.argv[2]);
  