var mldb = require("../../mldb"),
    tests = exports,
    ensure = require('ensure'), 
    assert = require('assert'),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/002-saveall2.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/002-saveall2.log' })
       ]
     });

tests.perf = function(callback) {
  var db = new mldb(); // default options
  db.setLogger(logger);
  
  var docs = [
    {from: "test1", to: "all", body: "wibble"},
    {from: "test2", to: "all", body: "wibble"},
    {from: "test3", to: "all", body: "wibble"},
    {from: "test4", to: "all", body: "wibble"}
  ];
  var dc = 0;
  
  var alldocs = new Array();
  var numdocs = 10000;
  for (var i = 0;i < numdocs;i++) {
    alldocs.push(docs[dc++ % 4]);
  }
  
  logger.debug("****** Creating docs");
  var st = new Date().getTime();
  db.saveAll2(alldocs,function(result) {
    var ft = new Date().getTime();
    var tt = ((ft - st) / 1000);
    // now fetch it
    logger.debug("****** ALL Docs created in " + tt + " seconds at a rate of " + (numdocs/tt) + " docs per second.");
    //logger.debug("****** Doc URIs: " + result.docuris);
    logger.debug("Result: " + JSON.stringify(result));
    callback(!result.inError);
  });
};

tests.perf_ok = function(t) {
  assert.ok(t);
};


ensure(__filename, tests, module,process.argv[2]);
