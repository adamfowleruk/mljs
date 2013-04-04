
$(document).ready(function() {
  // initialise MLDB
  var db = new mldb(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var ob = new com.marklogic.widgets.options();
  ob.pageLength(100);
  var options = ob.toJson();
  /*
  var options = 
    {
      options: {
        "return-results": true,
        "page-length": 100,
        "transform-results": {
          apply: "raw"
        }
      }
    };*/
  var optionsName = "page-kratu";
  
  var wgt = new com.marklogic.widgets.kratu("el-kratu");
  
  
  var query = {
    query: {
      "collection-query": {
        "uri": ["animals"]
      }
    }
  };
  
  db.saveSearchOptions(optionsName,options,function(result) {
    db.structuredSearch(query,optionsName,function(result) {
      wgt.updateResults(result.doc);
    });
  });
  
});