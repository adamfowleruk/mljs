var mljs = require("../../mljs"),
    tests = exports,
    configurator = require('../../testconfig'),
    assert = require('assert'),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
          new winston.transports.File({ filename: 'logs/009-tuples.log' })
       ],
       exceptionHandlers: [
          new winston.transports.File({ filename: 'logs/009-tuples.log' })
       ]
     });

describe("009-tuples",function() {
  var db = new mljs(); // default options
  configurator.configure(db);
  db.setLogger(logger);
      
  var options = db.createOptions();
  options.rangeConstraint("actor",["item-frequency"],"http://marklogic.com/collation/")
      .rangeConstraint("year",["item-order"],"http://marklogic.com/collation/")
      .returnValues().tuples("mytuples","actor","year").values("actor");
  
            var docs = [
              {title: "The Goonies",actor: "Sean Astin", genre: "Comedy", year: "1985"},
              {title: "50 First Dates",actor: "Sean Astin", genre: "Comedy", year: "2004"},
              {title: "Kingdom Hearts",actor: "Sean Astin", genre: "Comedy", year: "2002"},
              {title: "The Sky Is Falling",actor: "Sean Astin", genre: "Comedy", year: "2001"},
              {title: "Dorothy and the Witches of Oz",actor: "Sean Astin", genre: "Fantasy", year: "2012"},
              {title: "The Lord of the Rings: The Return of the King",actor: "Sean Astin", genre: "Fantasy", year: "2003"},
              {title: "The Lord of the Rings: The Two Towers",actor: "Sean Astin", genre: "Fantasy", year: "2002"},
              {title: "The Lord of the Rings: The Fellowship of the Ring",actor: "Sean Astin", genre: "Fantasy", year: "2001"},
              {title: "Teenage Mutant Ninja Turtles",actor: "Sean Astin", genre: "Adventure", year: "2013"},
              {title: "Dumb and Dumber To",actor: "Jim Carrey", genre: "Comedy", year: "2014"},
              {title: "Kick-Ass 2",actor: "Jim Carrey", genre: "Comedy", year: "2013"},
              {title: "Mr. Popper's Penguins",actor: "Jim Carrey", genre: "Comedy", year: "2011"},
              {title: "I Love You Philip Morris",actor: "Jim Carrey", genre: "Comedy", year: "2009"},
              {title: "Ace Ventura: When Nature Calls",actor: "Jim Carrey", genre: "Comedy", year: "1995"},
              {title: "Ace Ventura: Pet Detective",actor: "Jim Carrey", genre: "Comedy", year: "1994"},
              {title: "A Christmas Carol",actor: "Jim Carrey", genre: "Drama", year: "2009"},
              {title: "The Number 23",actor: "Jim Carrey", genre: "Drama", year: "2007"}
            ];
            
  var optionsJson = options.toJson();
  logger.debug("options: " + JSON.stringify(optionsJson));
            
  before(function(done) {
    db.saveSearchOptions("tupleoptions",optionsJson,function(result) {
      
      // save docs
            
            var saveCount = 0;
            var nextSave2 = function() {
              if (saveCount == docs.length) {
                complete2();
              } else {
                db.save(docs[saveCount],"/movies/" + (saveCount+1),{collection: "movies,testdata"}, function(result) {
                  saveCount++;
                  nextSave2();
                });
              }
            };
  
            var complete2 = function() {
        done();
      };
    
    nextSave2();
    });
  });
  
  after(function(done) {
            
            var saveCount = 0;
            var nextSave2 = function() {
              if (saveCount == docs.length) {
                complete2();
              } else {
                db.delete("/movies/" + (saveCount+1), function(result) {
                  saveCount++;
                  nextSave2();
                });
              }
            };
  
            var complete2 = function() {
        done();
      };
    
    nextSave2();
    
  });
  
  
  
  describe("#values()", function(){
   
    it("Should complete entirely",function(done){
      
      // execute search and check values for co-occurence and values lexicon
      done();
      
    }); // it
  });// describe plain
  
});