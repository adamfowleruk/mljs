var mljs = require("mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('chai').assert,
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/001-create-transform.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/001-create-transform.log' })
       ]
     });
  
  var indent = function(level) {
    var str = "";
    for (var i = 0;i < level;i++) {
      str += "  ";
    }
    return str;
  };
  var circularPrint = function(level,cutoff,json) {
    if (level > cutoff) return "";
    var str = "";
    for (var o in json) {
      logger.debug(indent(level) + o + ": ");
      if ("object" == typeof(json[o])) {
        logger.debug(indent(level) + "{\n");
        circularPrint(level + 1,cutoff,json[o]);
        logger.debug(indent(level) + "}\n");
      } else {
        logger.debug(json[o]);
      }
    }
    return str;
  };

describe("001-create-transform",function() {
  it("Should complete entirely",function(done){
  var db = new mljs(); // default options
  configurator.configure(db);
  db.setLogger(logger);
  
  logger.debug("****** Creation Transform");
  var txslt = "<someel><other>wei</other></someel>";
  var txsltdoc = db.textToXML(txslt);
  var props = {title: "My Test XSLT", provider: "Adam Fowler", version: "1.0", description: "Some XSLT description", "trans:firstparam": "xs:string?"};
  var name = "testxslt";
  db.saveTransform(name,txsltdoc,"xslt",props,function(result) {
    // check not in error
    assert(!result.inError,"Save transform result should not be in error: " + result.error);
    
    // get transform and check not empty or in error
    db.getTransform(name,function(result) {
      assert(!result.inError,"Get transform result should not be in error: " + result.error);
      logger.debug("result.doc:-");
      circularPrint(0,2,result.doc);
      assert(null != result.doc,"Transform content should not be null");
      
      // list transforms
      db.listTransforms(function(result) {
        assert(!result.inError,"List transform result should not be in error: " + result.error);
        assert(null != result.doc,"Transform list should not be null");
        
        // delete transform
        db.deleteTransform(name,function(result) {
          assert(!result.inError,"Delete transform result should not be in error: " + result.error);
          done();
        });
      });
    });
  });
  
});});