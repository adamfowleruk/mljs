
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
    var logZone = document.getElementById("logzone");
    var l = function(msg) {
      logZone.innerHTML = msg + "<br/>" + logZone.innerHTML;
    };
    var cb = function(data) {
      l("Got data Drop: " + JSON.stringify(data));
    };
    com.marklogic.widgets.dnd.accept("dropzone","basic",["dragclass1","dragclass2"],cb);
    
    com.marklogic.widgets.dnd.onto("drag1","dragclass1",["basic"],{data: "Drag 1 data"});
    com.marklogic.widgets.dnd.onto("drag2","dragclass2",["basic"],{data: "Drag 2 data"});
    com.marklogic.widgets.dnd.onto("drag3","dragclass3",["weird"],{data: "Drag 3 data"});
    
  } catch (err) {
    console.log(err);
    error.show(err);
  }
};