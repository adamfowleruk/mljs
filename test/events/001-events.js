var mljs = require("mljs"),
    tests = exports,
    assert = require('chai').assert,
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/001-events.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/001-events.log' })
       ]
     });

describe("001-events",function() {
  
  describe("new Publisher()", function(){
   
    it("Should complete entirely",function(done){
      
      var textPublisher = new com.marklogic.events.Publisher();
      
      textPublisher.subscribe(function(evt) {
        assert.equal("some event",evt,"evt should be string equal to 'some event'");
        
        done();
      });
      
      textPublisher.publish("some event");
      
    }); // it
  });// describe plain
  
});