var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
    assert = require('assert'),
    winston = require('winston');

 var logger = new (winston.Logger)({
   transports: [
      new winston.transports.File({ filename: '../002-get-not-found.log' })
   ],
   exceptionHandlers: [
      new winston.transports.File({ filename: '../002-get-not-found.log' })
   ]
 });


tests.notfound = function(callback) {
  var db = new mldb(); // default options
  db.setLogger(logger);

  logger.debug("Testing digest get");

  var doc = db.get("/messages/1", function(result) {
    // now print it
    logger.debug("Doc content: " + JSON.stringify(result.doc));
    //assert.equal(undefined,result.doc,"/messages/1 exists, should not be found in DB.");
    callback(undefined == result.doc);
  });
};

tests.notfound_ok = function(t) {
  assert.ok(t);
};


ensure(__filename, tests, module,process.argv[2]);
