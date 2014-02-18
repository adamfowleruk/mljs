
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
    // 1. Create widgets
    
    // 2. Create Contexts and register widgets
    
    // 3. Configure page / contexts / search options
    
    // 4. Perform any initial operations (e.g. blank query)
  
  } catch (err) {
    error.show(err.message);
  }
};