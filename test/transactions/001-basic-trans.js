var mljs = require("mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('chai').assert,
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/001-basic-trans.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/001-basic-trans.log' })
       ]
     });

describe("001-basic-trans",function() {
  it("Should complete entirely",function(done){
  var db = new mljs(); // default options
  configurator.configure(db);
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
            //logger.debug("TEST: COMMIT: Doc content: " + JSON.stringify(result.doc));
            //if (JSON.stringify(json) == JSON.stringify(result.doc)) {
      
              // now delete it
              logger.debug("TEST: COMMIT: deleting doc");
              db.delete(uri, function(result) {
                logger.debug("TEST: COMMIT: Doc deleted");
                logger.debug("----------------");
                assert(false==result.inError);
                done();
              });
            //} else {
            //  logger.debug("TEST: COMMIT: ERROR: Retrieved document is not same as that saved");
            //  done();
            //}
          });
        }
      });
    });
  });
  
});});