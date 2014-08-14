var mljs = require("mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('chai').assert,
    winston = require('winston');

 var logger = new (winston.Logger)({
   transports: [
      new winston.transports.File({ filename: 'logs/002-get-not-found.log' })
   ],
   exceptionHandlers: [
      new winston.transports.File({ filename: 'logs/002-get-not-found.log' })
   ]
 });


describe("002-get-not-found",function() {
  it("Should complete entirely",function(done){
  var db = new mljs(); // default options
  configurator.configure(db);
  db.setLogger(logger);

  logger.debug("Testing digest get");

  var doc = db.get("/messages/flibble", function(result) {
    // now print it
    logger.debug("Doc content: " + JSON.stringify(result.doc));
    //assert.equal(undefined,result.doc,"/messages/1 exists, should not be found in DB.");
    assert(result.inError,"Result should be in error (it doesn't exist)");
    
    done();
  });
  
});});