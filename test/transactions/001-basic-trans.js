var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
    assert = require('assert'),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/001-basic-trans.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/001-basic-trans.log' })
       ]
     });

tests.commit = function(callback) {
  var db = new mldb(); // default options
  db.setLogger(logger);
  
  logger.debug("----------------");
  logger.debug("TEST: COMMIT");
  db.beginTransaction(function(result) {
    var txid = result.txid;
    logger.debug("TEST: COMMIT: Transaction ID: " + txid);
    
    assert(!result.inError,"begin transaction should not be in error: " + JSON.stringify(result));
    
    // now create doc
    logger.debug("TEST: COMMIT: Creating document within transaction.");
    var uri = "/trans/commit/1";
    var json = {title: "Transaction commit test doc"};
    db.save(json,uri,function(result) {
      
      // now commit
      logger.debug("TEST: COMMIT: Committing transaction");
      db.commitTransaction(function(result) {
        if (result.inError) {
          logger.debug("TEST: COMMIT: ERROR IN COMMIT: " + JSON.stringify(result));
          callback(false);
          
        } else {
          logger.debug("TEST: COMMIT: Fetching committed Doc.");
      
          db.get(uri, function(result) {
            // now print it
            logger.debug("TEST: COMMIT: Doc content: " + JSON.stringify(result.doc));
            if (JSON.stringify(json) == JSON.stringify(result.doc)) {
      
              // now delete it
              logger.debug("TEST: COMMIT: deleting doc");
              db.delete(uri, function(result) {
                logger.debug("TEST: COMMIT: Doc deleted");
                logger.debug("----------------");
                callback(false==result.inError);
              });
            } else {
              logger.debug("TEST: COMMIT: ERROR: Retrieved document is not same as that saved");
              callback(false);
            }
          });
        }
      });
    });
  });
};

tests.commit_ok = function(t) {
  assert.ok(t);
};


ensure(__filename, tests, module,process.argv[2]);
