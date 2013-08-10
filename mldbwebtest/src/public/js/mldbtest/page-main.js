
$(document).ready(function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  var logel = document.getElementById("log");
  var log = function(msg) {
    logel.innerHTML = "<p>" + msg + "</p>" + logel.innerHTML;
  };
  
  // check if db needs initialising
  
  var ob = new db.options();
  ob.pageLength(100);
  ob.collection().returnResults(false);
  var options = ob.toJson();
  
  var optionsName = "mldbtest-content-options";
  
  var qb = new db.query();
  qb.query(qb.collection("testdata"));
  var query = qb.toJson();
  
  var doload = function() {
    logel.innerHTML = "";
    
    log("Installing search options...");
    var ob1 = new db.options();
    ob1.defaultCollation("http://marklogic.com/collation/en")
      .pageLength(100)
      .collectionConstraint() // default constraint name of 'collection' 
      .rangeConstraint("animal",["item-order"]) // constraint name defaults to that of the range element name 
      .rangeConstraint("family",["item-frequency"]); // constraint name defaults to that of the range element name 
    
    var ob2 = new db.options();
    ob2.tuples("actor-year","actor","year"); // first is tuple name. defaults to string, json namespace
    var ob3 = new db.options();
    ob3.tuples("actor-genre","actor","genre"); // first is tuple name. defaults to string, json namespace
    var ob4 = new db.options();
    ob4.defaultCollation("http://marklogic.com/collation/en")
      .collectionConstraint() // default constraint name of 'collection' 
      .rangeConstraint("animal",["item-order"]) // constraint name defaults to that of the range element name 
      .rangeConstraint("family",["item-frequency"]) // constraint name defaults to that of the range element name 
      .rangeConstraint("actor",["item-frequency"],"http://marklogic.com/collation/")
      .rangeConstraint("year",["item-order"],"http://marklogic.com/collation/")
      .rangeConstraint("city",["item-order"],"http://marklogic.com/collation/")
      .rangeConstraint("month",["item-order"],"http://marklogic.com/collation/");
    
    var alloptions = [
      "page-charts-search",ob1.toJson(),
      "actor-genre",ob3.toJson(),
      "actor-year",ob2.toJson(),
      "mljstest-page-search-options",ob4.toJson()
    ];
    
    var saveCount = 0;
    var nextSave0 = function() {
      if (saveCount == alloptions.length) {
        complete0();
      } else {
        db.saveSearchOptions(alloptions[saveCount],alloptions[saveCount + 1], function(result) {
          saveCount+=2;
          nextSave0();
        });
      }
    };
  
    var complete0 = function() {
      log("- Done.");
    
    
      log("Checking database for required indexes...");
      
      
      var donefunc = function(result) {
        // check result doc
        var indexes = result.doc["index-summaries"]["index-summary"];
        var missing = new Array();
        for (var i = 0;i < indexes.length;i++) {
          log("- Found index: " + JSON.stringify(indexes[i]));
          if (indexes[i].complete == "false") {
            missing.push(indexes[i]);
          }
        }
        
        if (missing.length > 0) {
          for (var i = 0;i < missing.length;i++) {
            var s = "- *** MISSING INDEX: " + JSON.stringify(missing[i]);
            /*
            if (undefined != missing[i].range) {
              s += "Range: Type: " + missing[i].range.type;
              if (undefined != missing[i].range["path-index"]) {
                
              }
              if (undefined != missing[i].range["element"]) {
                s += " Element: " + JSON
              }
            }
            */
            log(s);
          }
          log("- Abandoning content set up. Create indexes below then refresh page.");
          log("- NB for json-key, create an Element Range Index with the namespace http://marklogic.com/xdmp/json/basic and the local name the same as the json-key value, and the root collation (http://marklogic.com/collation/).");
          
        } else {
          log("- Done. All indexes present and correct");
        
        // if not indexes, then report index issues and stop processing
        
        // if indexes here, continue with checking content
    
          log("Adding test content to database...");
          log("[1 of 6] Adding temperature test data...");
          
          
          // save then get doc
          var docs = [
            {city: "London", month: "Jan", reading: { temp: 0}},
            {city: "London", month: "Jan", reading: { temp: 2}},
            {city: "London", month: "Jan", reading: { temp: 3}},
            {city: "London", month: "Jan", reading: { temp: -1}},
            {city: "London", month: "Jan", reading: { temp: -1}},
            {city: "London", month: "Feb", reading: { temp: 4}},
            {city: "London", month: "Feb", reading: { temp: 8}},
            {city: "London", month: "Mar", reading: { temp: 10}},
            {city: "London", month: "Mar", reading: { temp: 12}},
            {city: "London", month: "Apr", reading: { temp: 17}},
            {city: "London", month: "May", reading: { temp: 22}},
            {city: "London", month: "Jun", reading: { temp: 24}},
            {city: "London", month: "Jul", reading: { temp: 23}},
            {city: "London", month: "Aug", reading: { temp: 19}},
            {city: "London", month: "Sep", reading: { temp: 17.5}},
            {city: "London", month: "Oct", reading: { temp: 12}},
            {city: "London", month: "Nov", reading: { temp: 8}},
            {city: "London", month: "Dec", reading: { temp: 4}},
            {city: "Derby", month: "Jan", reading: { temp: -2}},
            {city: "Derby", month: "Jan", reading: { temp: -2}},
            {city: "Derby", month: "Feb", reading: { temp: 2}},
            {city: "Derby", month: "Feb", reading: { temp: 2}},
            {city: "Derby", month: "Mar", reading: { temp: 4}},
            {city: "Derby", month: "Mar", reading: { temp: 4}},
            {city: "Derby", month: "Apr", reading: { temp: 5}},
            {city: "Derby", month: "May", reading: { temp: 5.5}},
            {city: "Derby", month: "Jun", reading: { temp: 9}},
            {city: "Derby", month: "Jul", reading: { temp: 18}},
            {city: "Derby", month: "Aug", reading: { temp: 21}},
            {city: "Derby", month: "Sep", reading: { temp: 17}},
            {city: "Derby", month: "Oct", reading: { temp: 7}},
            {city: "Derby", month: "Nov", reading: { temp: 2.5}},
            {city: "Derby", month: "Dec", reading: { temp: -1}}
          ];
  
          saveCount = 0;
          var nextSave1 = function() {
            if (saveCount == docs.length) {
              complete1();
            } else {
              db.save(docs[saveCount],"/temp/" + (saveCount+1),{collection: "temperatures,testdata"}, function(result) {
                saveCount++;
                nextSave1();
              });
            }
          };
  
          var complete1 = function() {
            log("- Done.");
            log("[2 of 6] Adding movie test data...");
            
            docs = [
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
            saveCount = 0;
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
              log("- Done.");
              log("[3 of 6] Adding animals test data...");
              
              docs = [
                {title: "Polly the Penguin", summary: "Penguins are awesome", animal: "penguin", family: "bird", age: 15},
                {title: "Olly the Ostrich", summary: "Tasty and lean", animal: "ostrich", family: "bird", age: 12},
                {title: "Dave the MarkLogician", summary: "Sir Dave of Vanguard", animal: "homosapien", family: "marklogician",age: 21},
                {title: "Eric the MarkLogician", summary: "Sir Eric of the Community", animal: "homosapien", family: "marklogician", age: 21},
                {title: "Dilbert the Dog", summary: "Dogs are cool", animal: "dog", family: "pet", age: 7},
                {title: "Dogbert the Dog", summary: "I feel woof", animal: "dog", family: "pet", age: 3},
                {title: "Dizzie the Dog", summary: "Which way d'he go?", animal: "dog", family: "pet", age: 9},
                {title: "Charlie the Cat", summary: "Cats are boring", animal: "cat", family: "pet", age: 6},
                {title: "Hammy the Hamster", summary: "Do dah dee dee do dah do do", animal: "hamster", family: "pet", age: 3},
                {title: "Hetty the Hamster", summary: "He he he he he", animal: "hamster", family: "pet", age: 4},
                {title: "George the Gerbil", summary: "Tiny", animal: "gerbil", family: "pet", age:1},
                {title: "Gregory the Guinea Pig", summary: "Only live a couple of years", animal: "guinea pig", family: "pet", age: 5},
                {title: "Adam the MarkLogician", summary: "Adam has no imagination", animal: "homosapien", family: "marklogician", age: 21}
              ];
              
              // TODO save hurtbat.svg
              
              saveCount = 0;
              var nextSave3 = function() {
                if (0 == docs.length || saveCount == docs.length) {
                  complete3();
                } else {
                  db.save(docs[saveCount],"/animals/" + (saveCount+1),{collection: "animals,testdata"}, function(result) {
                    saveCount++;
                    nextSave3();
                  });
                }
              };
  
              var complete3 = function() {
                log("- Done.");
              
                log("[4 of 6] Adding semantic test data...");
                log("- N/A - no semantic data adding script written yet.");
                
                log("[5 of 6] Adding plain text test data...");
              
                docs = [
                  "There once was a poet named Fred.",
                  "Who wrote poems until he was dead.",
                  "They picked up his pencil.",
                  "And found his poem stencil.",
                  "And realised he had ran out of lead."
                ];
              
                saveCount = 0;
                var nextSave5 = function() {
                  if (0 == docs.length || saveCount == docs.length) {
                    complete5();
                  } else {
                    db.save(docs[saveCount],"/plaintext/" + (saveCount+1),{collection: "plaintext,testdata"}, function(result) {
                      saveCount++;
                      nextSave5();
                    });
                  }
                };
  
                var complete5 = function() {
                  log("- Done.");
                  log("[6 of 6] Adding mixed test data...");
              
                  docs = [
                    /*"I am a plain text file",*/
                    textToXML("<documentelement><title>I am an XML file</title><summary>Some XML summary</summary></documentelement>"),
                    textToXML("<documentelement2><name>I am a generic XML file</name><desc>Generic XML description</desc></documentelement2>"),
                    textToXML("<documentelement3><wibble>Generic XML wibble file</wibble><flibble>Generic XML flibble element</flibble></documentelement3>"),
                    textToXML("<html xmlns='http://www.w3.org/1999/xhtml/'><head><title>XHTML test doc</title></head><body><h1>XHTML doc h1</h1><p>Lorem ipsum dolar sit amet</p><h2>Consecutor</h2><p>Wibble de flibble</p></body></html>"),
                    {title: "Some JSON title", summary: "Some JSON summary"},
                    {name: "Generic JSON name", desc: "Generic JSON description"}
                  ];
              
                  saveCount = 0;
                  var nextSave6 = function() {
                    if (0 == docs.length || saveCount == docs.length) {
                      complete6();
                    } else {
                      db.save(docs[saveCount],"/mixed/" + (saveCount+1),{collection: "mixed,testdata"}, function(result) {
                        saveCount++;
                        nextSave6();
                      });
                    }
                  };
  
                  var complete6 = function() {
                    log("- Done.");
                
                
                    log("ALL DONE. Click on one of the links above to use the demonstration.");
                  };
                
                  log("- Saving " + docs.length + " documents...");
                  nextSave6();
                };
                
                log("- Saving " + docs.length + " documents...");
                nextSave5();
                
                
              }; // end complete 3
              
              log("- Saving " + docs.length + " documents...");
              nextSave3();
              
            }; // end complete 2
            
  
            log("- Saving " + docs.length + " documents...");
            nextSave2();
            
          } // end complete1
  
          log("- Saving " + docs.length + " documents...");
          nextSave1();
          
        }
        
      };
      
        
      db.indexes(donefunc);
    };
    
    nextSave0();
  };
  
  db.saveSearchOptions(optionsName,options,function(result) {
    db.structuredSearch(query,optionsName,function(result) {
      if (result.inError) {
        log("Error searching for test content:-");
      } else {
        log("Found " + result.doc.results.length + " documents in 'testdata' collection");
        if (result.doc.results.length == 74) {
          log("We have testdata - not adding more data to test database. End. Click on a link above to test mljs.");
        } else {
          doload();
        }
      }
    });
  });
  
  document.getElementById("forcereload").onclick = function(e) {
    doload();
  };
  
  } catch (err) {
    error.show(err.message);
  }
});