var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
    assert = require('assert'),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/003-rollback.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/003-rollback.log' })
       ]
     });


tests.rollback = function(callback) {
  var db = new mldb(); // default options
  db.setLogger(logger);
  
  logger.debug("----------------");
  logger.debug("TEST: ROLLBACK");
  db.beginTransaction(function(result) {
    var txid = result.txid;
    logger.debug("TEST: ROLLBACK: Transaction ID: " + txid);
    
    // now create doc
    logger.debug("TEST: ROLLBACK: Creating document within transaction.");
    var uri = "/trans/rollback/5";
    var json = {title: "Transaction commit test doc"};
    db.save(json,uri,function(result) {
      
      // now commit
      logger.debug("TEST: ROLLBACK: Abandoning transaction");
      db.rollbackTransaction(function(result) {
        if (result.inError) {
          logger.debug("TEST: ROLLBACK: ERROR IN COMMIT: " + JSON.stringify(result));
          callback(false);
          
        } else {
          logger.debug("TEST: ROLLBACK: Fetching abandoned Doc.");
      
          db.get(uri, function(result) {
            if (result.inError) {
              // this is a good thing here
              logger.debug("TEST: ROLLBACK: get in error: " + JSON.stringify(result.error));
              callback(true);
            } else {
              // now print it
              logger.debug("TEST: ROLLBACK: Doc content: " + JSON.stringify(result.doc));
              assert(false,"Document should not exist after rollback");
              callback(false);
            } // end else inError
          });
        }
      });
    });
  });
};

tests.rollback_ok = function(t) {
  assert.ok(t);
};

ensure(__filename, tests, module,process.argv[2]);
