
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
    var workplaceadmin = new com.marklogic.widgets.workplaceadmin("workplaceadmin");
    
    // TODO options and save mode etc.
    
  } catch (err) {
    error.show(err);
  }
  
};