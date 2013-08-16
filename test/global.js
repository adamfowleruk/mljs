var mljs = require("../mljs"),
    tests = exports,
    assert = require('assert'),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/global.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/global.log' })
       ]
     });
  
  var db = new mljs(); // default options
  db.setLogger(logger);
      
  var options = new db.options();
  
before(function(done) {
  // This is where global DB setup happens
  
  db.saveSearchOptions("all",options.toJson(),function(result) {
    if (result.inError) {
      throw Exception(result);
    }
    done();
  });
});

after(function(done){
  // this is where global clean up happens
  done();
});