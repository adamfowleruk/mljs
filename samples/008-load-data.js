

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
                  log("Adding sample docs...");
              
                  docs = [
                    /*"I am a plain text file",*/
                    textToXML("<documentelement><title>I am an XML file</title><summary>Some XML summary</summary><dt:datereceived xmlns:dt='http://marklogic.com/ns/dt'>2013-01-25</dt:datereceived></documentelement>"),
                    textToXML("<documentelement2><name>I am a generic XML file</name><desc>Generic XML description</desc><dt:datereceived xmlns:dt='http://marklogic.com/ns/dt'>2013-01-18</dt:datereceived></documentelement2>"),
                    textToXML("<documentelement3><wibble>Generic XML wibble file</wibble><flibble>Generic XML flibble element</flibble><dt:datereceived xmlns:dt='http://marklogic.com/ns/dt'>2013-02-14</dt:datereceived></documentelement3>"),
                    textToXML("<html xmlns='http://www.w3.org/1999/xhtml'><head><title>XHTML test doc</title><meta name='Author' content='Adam Fowler'/></head><body><h1>XHTML doc h1</h1><p>Lorem ipsum dolar sit amet</p><h2>Consecutor</h2><p>Wibble de flibble</p></body></html>"),
                    {title: "Some JSON title", summary: "Some JSON summary"},
                    {name: "Generic JSON name", desc: "Generic JSON description"}
                  ];
              
                  saveCount = 0;
                  var nextSave1 = function() {
                    if (0 == docs.length || saveCount == docs.length) {
                      complete1();
                    } else {
                      db.save(docs[saveCount],"/mixed/" + (saveCount+1),{collection: "mixed,testdata"}, function(result) {
                        saveCount++;
                        nextSave1();
                      });
                    }
                  };
  
                  var complete1 = function() {
                    log("- Done.");
                    
                    log("Adding tourist attractions test data...");
                    // get points using address search at http://itouchmap.com/latlong.html - NB uses EPSG:900913 NOT WGS84(EPSG:4326)???
                    docs = [
                      {title: "Tower of London", location:{ lat: 51.508112,lon: -0.075949},stars: 4, description: "Home of the Crown Jewels"},
                      {title: "Houses of Parliament", location:{ lat:51.499503 ,lon: -0.124357},stars: 3, description: "Seat of power"},
                      {title: "Buckingham Palace", location:{ lat: 51.501364,lon: -0.141890},stars: 3, description: "Tours available"},
                      {title: "London Zoo", location:{ lat: 51.535736,lon: -0.155679},stars: 2, description: "Off the map, far from center."},
                      {title: "St Paul's Cathedral", location:{ lat: 51.513679,lon: -0.099560},stars: 2, description: "Big Cathedral"},
                      {title: "The London Eye", location:{ lat: 51.503400,lon: -0.119519},stars: 5, description: "Great views"},
                      {title: "Oxford Street", location:{ lat: 51.515220,lon: -0.141880},stars: 3, description: "Lots of Shops"}
                    ];
                    
                    
                    saveCount = 0;
                    var nextSave2 = function() {
                      if (0 == docs.length || saveCount == docs.length) {
                        complete2();
                      } else {
                        db.save(docs[saveCount],"/attractions/" + (saveCount+1),{collection: "attractions,testdata"}, function(result) {
                          saveCount++;
                          nextSave2();
                        });
                      }
                    };
    
                    var complete2 = function() {
                      log("- Done ALL.");
                      
                      // SCRIPT ENDS EXECUTION HERE
                  
                    };
                    
                    log("- Saving " + docs.length + " documents...");
                    nextSave2();
                    
                    
                }; // end completed 1
                
                log("- Saving " + docs.length + " documents...");
                nextSave1();
                
              }; // end load
              
              load();
              
              
              
  } catch (err) {
    error.show(err.message);
  }
};