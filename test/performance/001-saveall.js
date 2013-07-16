var mljs = require("../../mljs"),
    tests = exports,
    assert = require('assert'),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/001-saveall.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/001-saveall.log' })
       ]
     });

describe("001-saveall",function() {
  it("Should complete entirely",function(done){
  var db = new mljs(); // default options
  db.setLogger(logger);
  
  var docs = [
    {from: "test1", to: "all", body: "wibble"},
    {from: "test2", to: "all", body: "wibble"},
    {from: "test3", to: "all", body: "wibble"},
    {from: "test4", to: "all", body: "wibble"}
  ];
  var dc = 0;
  
  var alldocs = new Array();
  var numdocs = 100;
  for (var i = 0;i < numdocs;i++) {
    alldocs.push(docs[dc++ % 4]);
  }
  
  logger.debug("****** Creating docs");
  var st = new Date().getTime();
  db.saveAll(alldocs,function(result) {
    var ft = new Date().getTime();
    var tt = ((ft - st) / 1000);
    // now fetch it
    logger.debug("****** ALL Docs created in " + tt + " seconds at a rate of " + (numdocs/tt) + " docs per second.");
    //logger.debug("****** Doc URIs: " + result.docuris);
    logger.debug("Result: " + JSON.stringify(result));
    done();
  });
  
});});