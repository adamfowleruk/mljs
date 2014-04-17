
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
    var wgt = new com.marklogic.widgets.collectionuris("collections");
    wgt.addErrorListener(error.updateError);
    wgt.list("/");
  
  } catch (err) {
    error.show(err.message);
  }
};