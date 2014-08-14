var mljs = require("mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('chai').assert,
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/011-save-formats.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/011-save-formats.log' })
       ]
     });

describe("011-save-formats",function() {
 describe("#save() JSON", function(){

  it.skip("Should complete entirely",function(done){
  var db = new mljs(); // default options
  configurator.configure(db);
  db.setLogger(logger);

  logger.debug("****** Creating doc");
  db.save({from: "test", to: "all", body: "wibble"},"/messages/111.json", {collection: "messages"},function(result) {
    logger.debug("result in error?: " + result.inError);
    logger.debug("result: " + JSON.stringify(result));
    assert.equal(result.inError,false,"save() JSON should not be in error: 1: result: " + JSON.stringify(result));

    var uri = result.docuri;
    logger.debug("TEST: Generated docuri: " + uri);

    // now fetch it
    logger.debug("****** Doc created. Fetching doc.");
    var doc = db.get(uri, function(result) {
      assert.equal(result.inError,false,"get() JSON should not be in error: 2");
      // now print it
      //logger.debug("****** Doc content: " + JSON.stringify(result.doc));

      // now delete it
      logger.debug("****** deleting doc");
      db.delete(uri, function(result) {
        assert.equal(result.inError,false,"delete() JSON should not be in error: 3");
        logger.debug("****** Doc deleted");
        //assert.isNull(result.doc);
        assert(undefined == result.doc,"result JSON doc should not be undefined");
        done();
      }); // delete
    }); // get
  }); // save
 }); // it
 }); // describe json


 describe("#save() XML", function(){

  it
    configurator = require('../../testconfig'),assert = require('chai').assert,("Should complete entirely",function(done){
  var db = new mljs(); // default options
  db.setLogger(logger);
  configurator.configure(db);

    var text = "<mydoc><someel>title</someel><otherel>description</otherel></mydoc>";
    var xml = db.textToXML(text);


  logger.debug("****** Creating doc");
  db.save(xml, {collection: "messages"},"/messages/111.xml",function(result) {
        logger.debug("result: " + JSON.stringify(result));
    assert.equal(result.inError,false,"save() XML should not be in error: 4");

    var uri = result.docuri;
    logger.debug("TEST: Generated docuri: " + uri);

    // now fetch it
    logger.debug("****** Doc created. Fetching doc.");
    var doc = db.get(uri, function(result) {
      assert.equal(result.inError,false,"get() XML should not be in error: 5");
      // now print it
      logger.debug("****** Doc content: " + result.doc);

      // now delete it
      logger.debug("****** deleting doc");
      db.delete(uri, function(result) {
        assert.equal(result.inError,false,"delete() XML should not be in error: 6");
        logger.debug("****** Doc deleted");
        //assert.isNull(result.doc);
        assert(undefined == result.doc,"result XML doc should not be undefined");
        done();
      }); // delete
    }); // get
  }); // save
 }); // it
 }); // describe xml


  describe("#save() plain", function(){

    it
    configurator = require('../../testconfig'),assert = require('chai').assert,("Should complete entirely",function(done){
      var text = "This is a plain text document";

      var db = new mljs(); // default options
  configurator.configure(db);
      db.setLogger(logger);

      logger.debug("****** Creating doc");
      db.save(text, {collection: "messages"},"/messages/111.txt",function(result) {
        logger.debug("result: " + JSON.stringify(result));
        assert.equal(result.inError,false,"save() plain should not be in error: 7");

        var uri = result.docuri;
        logger.debug("TEST: Generated docuri: " + uri);

        // now fetch it
        logger.debug("****** Doc created. Fetching doc.");
        var doc = db.get(uri, function(result) {
          assert.equal(result.inError,false,"get() plain should not be in error: 8");
          // now print it
          logger.debug("****** Doc content: " + result.doc);

          // now delete it
          logger.debug("****** deleting doc");
          db.delete(uri, function(result) {
            assert.equal(result.inError,false,"delete() plain should not be in error: 9");
            logger.debug("****** Doc deleted");
            //assert.isNull(result.doc);
            assert(undefined == result.doc,"result plain doc should not be undefined");
            done();
          }); // delete
        }); // get
      }); // save
    }); // it
  });// describe plain

  describe("#save() binary", function(){

    it
    configurator = require('../../testconfig'),assert = require('chai').assert,("TODO Binary test not written yet",function(done){
      done();
    });
  });

});
