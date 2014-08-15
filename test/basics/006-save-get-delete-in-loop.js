var mljs = require("mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('chai').assert,
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/006-save-get-delete-in-loop.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/006-save-get-delete-in-loop.log' })
       ]
     });

describe("006-save-get-delete-in-loop",function() {
  it("Should complete entirely",function(done){
  var db = new mljs(); // default options
  configurator.configure(db);
  db.setLogger(logger);

  var results = new Array();

  for(var i = 0;i < 10;i++) {
    results[i] = "starting";
    logger.debug("****** Creating doc: " + i);
    db.save({from: "test", to: "all", body: "wibble"},"/messages/" + i + ".json", {collection: "messages"},function(result) {
      // now fetch it
      var uri = result.docuri;
      logger.debug("****** Doc created. Fetching doc.: " + uri);
      db.get(uri, function(result) {
        // now print it
        logger.debug("****** Doc content: " + result.docuri + ": " + JSON.stringify(result.doc));

        // now delete it
        logger.debug("****** deleting doc");
        var uri2 = result.docuri;
        var newi = 1*(uri2.substring(uri2.lastIndexOf("/") + 1));
        db.delete(uri2, function(result) {
          logger.debug("****** Doc deleted: " + newi + " : " + uri2);
          //assert.isNull(result.doc);
          results[newi] = !result.inError;
        });
      });
    });
  }

  // pause for 3 minutes (should be plenty)
  var sleep = require('sleep');
  sleep.sleep(10);

  var result = true;
  var truecount = 0;
  for (var i = 0;i < 10;i++) {
    result = result && (true == results[i]);
    if (true == results[i]) {
      truecount++;
    }
  }
  logger.debug("Complete truecount: " + truecount);
  done();

});});
