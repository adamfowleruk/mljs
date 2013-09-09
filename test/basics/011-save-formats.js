var mljs = require("../../mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('assert'),
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
   
  it("Should complete entirely",function(done){
  var db = new mljs(); // default options
  configurator.configure(db);
  db.setLogger(logger);
  
  logger.debug("****** Creating doc");
  db.save({from: "test", to: "all", body: "wibble"}, {collection: "messages"},function(result) {
        logger.debug("result: " + JSON.stringify(result));
    assert.equal(result.inError,false,"save() JSON should not be in error");
    
    var uri = result.docuri;
    logger.debug("TEST: Generated docuri: " + uri);
    
    // now fetch it
    logger.debug("****** Doc created. Fetching doc.");
    var doc = db.get(uri, function(result) {
      assert.equal(result.inError,false,"get() JSON should not be in error");
      // now print it
      logger.debug("****** Doc content: " + JSON.stringify(result.doc));
      
      // now delete it
      logger.debug("****** deleting doc");
      db.delete(uri, function(result) {
        assert.equal(result.inError,false,"delete() JSON should not be in error");
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
   
  it.skip("Should complete entirely",function(done){
  var db = new mljs(); // default options
  db.setLogger(logger);
  configurator.configure(db);
  
    var text = "<mydoc><someel>title</someel><otherel>description</otherel></mydoc>";
    var xml = db.textToXML(text);
    
  
  logger.debug("****** Creating doc");
  db.save(xml, {collection: "messages"},function(result) {
        logger.debug("result: " + JSON.stringify(result));
    assert.equal(result.inError,false,"save() XML should not be in error");
    
    var uri = result.docuri;
    logger.debug("TEST: Generated docuri: " + uri);
    
    // now fetch it
    logger.debug("****** Doc created. Fetching doc.");
    var doc = db.get(uri, function(result) {
      assert.equal(result.inError,false,"get() XML should not be in error");
      // now print it
      logger.debug("****** Doc content: " + result.doc);
      
      // now delete it
      logger.debug("****** deleting doc");
      db.delete(uri, function(result) {
        assert.equal(result.inError,false,"delete() XML should not be in error");
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
   
    it.skip("Should complete entirely",function(done){
      var text = "This is a plain text document";
    
      var db = new mljs(); // default options
      db.setLogger(logger);
  
      logger.debug("****** Creating doc");
      db.save(text, {collection: "messages"},function(result) {
        logger.debug("result: " + JSON.stringify(result));
        assert.equal(result.inError,false,"save() plain should not be in error");
    
        var uri = result.docuri;
        logger.debug("TEST: Generated docuri: " + uri);
    
        // now fetch it
        logger.debug("****** Doc created. Fetching doc.");
        var doc = db.get(uri, function(result) {
          assert.equal(result.inError,false,"get() plain should not be in error");
          // now print it
          logger.debug("****** Doc content: " + result.doc);
      
          // now delete it
          logger.debug("****** deleting doc");
          db.delete(uri, function(result) {
            assert.equal(result.inError,false,"delete() plain should not be in error");
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
   
    it.skip("TODO Binary test not written yet",function(done){
      done();
    });
  });
 
});
 