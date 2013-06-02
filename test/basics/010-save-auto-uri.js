var mldb = require("../../mldb"),
    tests = exports,
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

describe("010-save-auto-uri",function() {
  it("Should complete entirely",function(done){
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
        assert(undefined == result.doc,"result doc should not be undefined");
        done();
      });
    });
  });
  
});});