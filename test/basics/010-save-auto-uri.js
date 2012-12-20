var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
    assert = require('assert'),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/010-save-auto-uri.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/010-save-auto-uri.log' })
       ]
     });

tests.uri = function(callback) {
  var db = new mldb(); // default options
  db.setLogger(logger);
  
  logger.debug("****** Creating doc");
  db.save({from: "test", to: "all", body: "wibble"}, {collection: "messages"},function(result) {
    var uri = result.docuri;
    logger.debug("TEST: Generated docuri: " + uri);
    
    // now fetch it
    logger.debug("****** Doc created. Fetching doc.");
    var doc = db.get(uri, function(result) {
      // now print it
      logger.debug("****** Doc content: " + JSON.stringify(result.doc));
      
      // now delete it
      logger.debug("****** deleting doc");
      db.delete(uri, function(result) {
        logger.debug("****** Doc deleted");
        //assert.isNull(result.doc);
        callback(undefined == result.doc);
      });
    });
  });
};

tests.uri_ok = function(t) {
  assert.ok(t);
};


ensure(__filename, tests, module,process.argv[2]);
