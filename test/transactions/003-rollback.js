var mljs = require("../../mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('chai').assert,
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/003-rollback.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/003-rollback.log' })
       ]
     });


describe("003-rollback",function() {
  it("Should complete entirely",function(done){
  var db = new mljs(); // default options
  configurator.configure(db);
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
              done();
            } else {
              // now print it
              logger.debug("TEST: ROLLBACK: Doc content: " + JSON.stringify(result.doc));
              assert(false,"Document should not exist after rollback");
              done();
            } // end else inError
          });
        }
      });
    });
  });
  
});});