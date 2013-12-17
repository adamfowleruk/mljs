
window.onload = function() {
  var db = new mljs();
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
 
  var wgt = new com.marklogic.widgets.rdb2rdf("wizard");
  
  } catch (err) {
    error.show(err.message);
  }
};