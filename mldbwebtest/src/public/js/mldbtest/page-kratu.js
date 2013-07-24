
$(document).ready(function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  var ob = new db.options();
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
  wgt.addErrorListener(error.updateError);
  
  
  var query = {
    query: {
      "collection-query": {
        "uri": ["animals"]
      }
    }
  };
  
  db.saveSearchOptions(optionsName,options,function(result) {
    if (result.inError) {
      error.show(result.details);
    } else {
      db.structuredSearch(query,optionsName,function(result) {
    if (result.inError) {
      error.show(result.details);
    } else {
        wgt.updateResults(result.doc);
      }
      });
    }
  });
  
  } catch (err) {
    error.show(err.message);
  }
  
});