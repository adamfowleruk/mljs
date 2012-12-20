var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
    assert = require('assert'),
    winston = require('winston');

var logger = new (winston.Logger)({
  transports: [
    new winston.transports.File({ filename: 'logs/s001-code-style.log' })
  ],
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/s001-code-style.log' })
  ]
});

/**
 * This sample shows how to make the most readable coding style when using MLDB's event driven mechanism
 */

/**
 * Utility function to throw an exception on error - reduces the if (result.inError) code required
 */
var err = function(result,cb) {
  if (result.inError) {
    throw new Exception(result.error);
  } else {
    cb(result);
  }
};

/**
 * Creates a handler function based on res. Reduces number of } and ) in main code
 */
var cf = function(func) {
  return function(res) {err(res,func)};
};

try {
  var db = new mldb(); // defaults
  db.setLogger(logger);
  db.configure({database: "sampledb",port: 9092}); // don't need this, I use it so I don't interefere with my test db
  
  // create db
  db.create(cf(function (result) {
    
  // save 2 docs
  db.save({title: "first"},"/docs/1",{collection: "testdocs"}, cf(function(result) {
  db.save({title: "second"},"/docs/2",{collection: "testdocs"}, cf(function(result) {  
  
  // get collection listing
  db.collect("testdocs",cf(function(result) {
  
  // destroy db
  db.destroy(cf(function(result){
  
  logger.info("Sample complete. DB destroyed.");
  
  }))}))}))}))}));
} catch (err) {
  logger.info(err.message);
}
 