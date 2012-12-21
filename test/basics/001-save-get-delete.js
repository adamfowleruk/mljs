var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
    assert = require('assert'),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/001-save-get-delete.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/001-save-get-delete.log' })
       ]
     });

tests.basics = function(callback) {
  var db = new mldb(); // default options
  db.setLogger(logger);
  
  logger.debug("****** Creating doc");
  db.save({from: "test", to: "all", body: "wibble"},"/messages/1", {collection: "messages"},function(result) {
    // now fetch it
    logger.debug("****** Doc created. Fetching doc.");
    db.get("/messages/1", function(result) {
      // now print it
      logger.debug("****** Doc content: " + JSON.stringify(result.doc));
      
      // now delete it
      logger.debug("****** deleting doc");
      db.delete("/messages/1", function(result) {
        logger.debug("****** Doc deleted");
        //assert.isNull(result.doc);
        callback(!result.inError);
      });
    });
  });
};

tests.basics_ok = function(t) {
  assert.ok(t);
};


ensure(__filename, tests, module,process.argv[2]);
