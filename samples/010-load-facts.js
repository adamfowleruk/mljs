
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  var logel = document.getElementById("log");
  var log = function(msg) {
    logel.innerHTML = "<p>" + msg + "</p>" + logel.innerHTML;
  };
  
  
                var load = function() {
                  log("Adding sample facts...");
                  
                  
                  
                  
                  
    var alldone = function() {
      log("ALL DONE. Click on one of the links above to use the demonstration.");
    };
    
    db.graph("mljs-test-graph-1", function(result) {
      if (result.inError) {
        log(" - Test graphs do not exist. Creating.");
        
        var triples1 = [
          {subject: "http://marklogic.com/semantic/targets/people/adam", predicate: "likes", object: "http://marklogic.com/semantic/targets/foodstuffs/cheese"},
          {subject: "http://marklogic.com/semantic/targets/people/adam", predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", object: "http://xmlns.com/foaf/0.1/Person"},
          {subject: "http://marklogic.com/semantic/targets/people/adam", predicate: "http://xmlns.com/foaf/0.1/name", string: "Adam Fowler", locale: "en"},
          {subject: "http://marklogic.com/semantic/targets/foodstuffs/cheese", predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", object: "http://marklogic.com/semantic/rdfTypes/foodstuff"},
          {subject: "http://marklogic.com/semantic/targets/foodstuffs/cheese", predicate: "foodname", string: "Cheese", locale: "en"},
          {subject: "/mixed/4", predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", object: "http://marklogic.com/semantics/ontology/Document"},
          {subject: "/mixed/4", predicate: "http://marklogic.com/semantics/ontology/Document#uri", string: "/mixed/4", locale: "en"}
        ];
        
        var triples2 = [
          {subject: "http://marklogic.com/semantic/targets/people/adam", predicate: "http://xmlns.com/foaf/0.1/knows", object: "http://marklogic.com/semantic/targets/people/wendy"},
          {subject: "http://marklogic.com/semantic/targets/people/wendy", predicate: "http://xmlns.com/foaf/0.1/knows", object: "http://marklogic.com/semantic/targets/people/adam"},
          {subject: "http://marklogic.com/semantic/targets/people/adam", predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", object: "http://xmlns.com/foaf/0.1/Person"},
          {subject: "http://marklogic.com/semantic/targets/people/wendy", predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", object: "http://xmlns.com/foaf/0.1/Person"},
          {subject: "http://marklogic.com/semantic/targets/people/wendy", predicate: "http://xmlns.com/foaf/0.1/name", string: "Wendy Fowler", locale: "en"},
          {subject: "http://marklogic.com/semantic/targets/people/wendy", predicate: "likes", object: "http://marklogic.com/semantic/targets/foodstuffs/cheese"},
          {subject: "http://marklogic.com/semantic/targets/people/wendy", predicate: "mentioned_in", object: "/mixed/4"},
          {subject: "http://marklogic.com/semantic/targets/foodstuffs/cheese", predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", object: "http://marklogic.com/semantic/rdfTypes/foodstuff"},
          {subject: "http://marklogic.com/semantic/targets/foodstuffs/cheese", predicate: "foodname", string: "Cheese", locale: "en"}
        ];
        
        var triples3 = [
          {subject: "http://marklogic.com/semantic/targets/movies/1", predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", object: "http://marklogic.com/semantic/rdfTypes/movie"},
          {subject: "http://marklogic.com/semantic/targets/movies/1", predicate: "hastitle", string: "The Goonies", locale: "en"},
          {subject: "http://marklogic.com/semantic/targets/movies/1", predicate: "hasactor", string: "Sean Astin", locale: "en"},
          {subject: "http://marklogic.com/semantic/targets/movies/1", predicate: "hasgenre", string: "Comedy", locale: "en"},
          {subject: "http://marklogic.com/semantic/targets/movies/1", predicate: "releasedin",  number: 1985},
          {subject: "http://marklogic.com/semantic/targets/movies/2", predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", object: "http://marklogic.com/semantic/rdfTypes/movie"},
          {subject: "http://marklogic.com/semantic/targets/movies/2", predicate: "hastitle", string: "Teenage Mutant Ninja Turtles", locale: "en"},
          {subject: "http://marklogic.com/semantic/targets/movies/2", predicate: "hasactor", string: "Sean Astin", locale: "en"},
          {subject: "http://marklogic.com/semantic/targets/movies/2", predicate: "hasgenre", string: "Adventure", locale: "en"},
          {subject: "http://marklogic.com/semantic/targets/movies/2", predicate: "releasedin",  number: 2013},
          {subject: "http://marklogic.com/semantic/targets/movies/3", predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", object: "http://marklogic.com/semantic/rdfTypes/movie"},
          {subject: "http://marklogic.com/semantic/targets/movies/3", predicate: "hastitle", string: "Kick-Ass 2", locale: "en"},
          {subject: "http://marklogic.com/semantic/targets/movies/3", predicate: "hasactor", string: "Jim Carrey", locale: "en"},
          {subject: "http://marklogic.com/semantic/targets/movies/3", predicate: "hasgenre", string: "Comedy", locale: "en"},
          {subject: "http://marklogic.com/semantic/targets/movies/3", predicate: "releasedin",  number: 2013},
          {subject: "http://marklogic.com/semantic/targets/movies/4", predicate: "http://www.w3.org/1999/02/22-rdf-syntax-ns#type", object: "http://marklogic.com/semantic/rdfTypes/movie"},
          {subject: "http://marklogic.com/semantic/targets/movies/4", predicate: "hastitle", string: "The Number 23", locale: "en"},
          {subject: "http://marklogic.com/semantic/targets/movies/4", predicate: "hasactor", string: "Jim Carrey", locale: "en"},
          {subject: "http://marklogic.com/semantic/targets/movies/4", predicate: "hasgenre", string: "Drama", locale: "en"},
          {subject: "http://marklogic.com/semantic/targets/movies/4", predicate: "releasedin",  number: 2007}
        ];
        
        db.saveGraph(triples1,"mljs-test-graph-1",function(result) {
          if (result.inError) {
            log("ERROR creating test graph 1: " + result.detail);
          } else {
            log(" - Created test graph 1");
            
            db.saveGraph(triples2,"mljs-test-graph-2",function(result) {
              if (result.inError) {
                log("ERROR creating test graph 2: " + result.detail);
              } else {
                log(" - Created test graph 2");
                
                db.saveGraph(triples3,"mljs-test-graph-3",function(result) {
                  if (result.inError) {
                    log("ERROR creating test graph 3: " + result.detail);
                  } else {
                    log(" - Created test graph 3");
                    alldone();
                  }
                });
              }
            });
          }
        });
      } else {
        alldone();
      }
    });
                  
                  
                  
              }; // end load
              
              load();
              
              
              
  } catch (err) {
    error.show(err.message);
  }
};