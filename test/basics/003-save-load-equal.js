var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
    assert = require('assert'),
    winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
     new winston.transports.File({ filename: '../003-save-load-equal.log' })
  ],
  exceptionHandlers: [
     new winston.transports.File({ filename: '../003-save-load-equal.log' })
  ]
});


tests.equal = function(callback) {
  var db = new mldb(); // default options
  db.setLogger(logger);
  
  logger.debug("Testing basic json equal");

  var json = {first: 1, second: "two", third: 0.2345};

  db.save(json,"/equal/1", function(result) {
    db.get("/equal/1", function(result) {
      // now print it
      logger.debug("Doc content: " + JSON.stringify(result.doc));
      //assert.equal(undefined,result.doc,"/messages/1 exists, should not be found in DB.");
      callback(JSON.stringify(json) == JSON.stringify(result.doc));
    });
  });
};

tests.equal_ok = function(t) {
  assert.ok(t);
};

tests.equal_complex = function(callback) {
 var db = new mldb(); // default options

 logger.debug("Testing basic json equal");

 var json = {first: 1, second: "two", third: 0.2345, fourth: ["1","2","3"], fifth: { fivedotone: 9, fivedottwo: 8}};

 db.save(json,"/equal/2", function(result) {
   db.get("/equal/2", function(result) {
     // now print it
     logger.debug("Doc content: " + JSON.stringify(result.doc));
     //assert.equal(undefined,result.doc,"/messages/1 exists, should not be found in DB.");
     callback(JSON.stringify(json) == JSON.stringify(result.doc));
   });
 });
};

tests.equal_complex_ok = function(t) {
  assert.ok(t);
};


ensure(__filename, tests, module,process.argv[2]);
