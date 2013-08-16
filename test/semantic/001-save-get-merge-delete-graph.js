var mljs = require("../../mljs"),
    tests = exports,
    assert = require('assert'),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/001-save-get-merge-delete-graph.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/001-save-get-merge-delete-graph.log' })
       ]
     });

      var db = new mljs(); // default options
      db.setLogger(logger);
      

describe("001-save-get-merge-delete-graph",function() {
  
  describe("#save() N-triples string", function(){
   
    it.skip("V7: Should complete entirely",function(done){
      var ntriples = "</people/adam> <likes> </objects/cheese> .\n</objects/cheese> <foodtype> \"fatty\".\n";
      
      db.saveGraph(ntriples,"mytesttriples",function(result) {
        logger.debug("RESULT: " + JSON.stringify(result));
        assert.equal(result.inError,false,"saveGraph() should not be in error");
        
        db.graph("mytesttriples",function(result) {
          logger.debug("RESULT: " + JSON.stringify(result));
          assert.equal(result.inError,false,"graph() should not be in error");
          
          var triples = result.triples;
          assert(undefined != triples,"result.triples should not be undefined");
          
          logger.debug("TRIPLES: " + JSON.stringify(triples));
          assert.equal(2,triples.length,"Should be two triples returned");
          
          done();
        });
      });
      
    }); // it
  });// describe plain
  
  describe("#merge() JSON", function(){
   
    it.skip("V7: Should complete entirely",function(done){
      var triplejson = [
        {subject: "/people/adam", predicate: "name", object: "Adam Fowler"},
        {subject: "/objects/cheese", predicate: "cheesefamily", object: "Wensleydale"},
        {subject: "/people/wendy", predicate: "likes", object: "cheese"},
      ];
      db.mergeGraph(triplejson,"mytesttriples",function(result) {
        logger.debug("RESULT: " + JSON.stringify(result));
        assert.equal(result.inError,false,"mergeGraph() should not be in error");
        
        db.graph("mytesttriples",function(result) {
          logger.debug("RESULT: " + JSON.stringify(result));
          assert.equal(result.inError,false,"graph() should not be in error");
          
          var triples = result.triples;
          assert(undefined != triples,"result.triples should not be undefined");
          
          logger.debug("TRIPLES: " + JSON.stringify(triples));
          assert.equal(5,triples.length,"Should be five triples returned");
          
          done();
        });
      });
      
    }); // it
  });// describe plain
  
  
  
  describe("#sparql()", function(){
   
    it.skip("V7: Should complete entirely",function(done){
      db.sparql("SELECT ?s, ?p, o FROM {?s ?p ?o. ?p=<likes>}",function(result) {
        logger.debug("RESULT: " + JSON.stringify(result));
        assert.equal(result.inError,false,"deleteGraph() should not be in error");
        
        db.graph("mytesttriples",function(result) {
          logger.debug("RESULT: " + JSON.stringify(result));
          assert.equal(result.inError,false,"graph() should not be in error");
          
          var triples = result.triples;
          assert(undefined != triples,"result.triples should not be undefined");
          
          logger.debug("TRIPLES: " + JSON.stringify(triples));
          assert.equal(0,triples.length,"Should be zero triples returned");
          
          done();
        });
      });
      
    }); // it
  });// describe plain
  
  
  describe("#deleteGraph()", function(){
   
    it.skip("V7: Should complete entirely",function(done){
      db.deleteGraph("mytesttriples",function(result) {
        logger.debug("RESULT: " + JSON.stringify(result));
        assert.equal(result.inError,false,"deleteGraph() should not be in error");
        
        db.graph("mytesttriples",function(result) {
          logger.debug("RESULT: " + JSON.stringify(result));
          assert.equal(result.inError,false,"graph() should not be in error");
          
          var triples = result.triples;
          assert(undefined != triples,"result.triples should not be undefined");
          
          logger.debug("TRIPLES: " + JSON.stringify(triples));
          assert.equal(0,triples.length,"Should be zero triples returned");
          
          done();
        });
      });
      
    }); // it
  });// describe plain
  
  
  
  
});