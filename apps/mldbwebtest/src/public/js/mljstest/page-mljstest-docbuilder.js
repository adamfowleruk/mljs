

window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  // create form frame
  
  // create elements within it
  
  
  } catch (err) {
    error.show(err.message);
  }
};