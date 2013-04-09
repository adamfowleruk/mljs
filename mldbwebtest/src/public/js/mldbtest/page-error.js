$(document).ready(function() {
  // initialise MLDB
  var db = new mldb(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var errorBasic = new com.marklogic.widgets.error("error-basic");
  errorBasic.show("Some generic application error message here");
  
  var errorSummary = new com.marklogic.widgets.error("error-summary");
  
  var errorPointer = new com.marklogic.widgets.error("error-pointer");
  errorPointer.showFirstCodefile = true;
  
  var errorDetails = new com.marklogic.widgets.error("error-details");
  errorDetails.showFirstCodefile = true;
  errorDetails.allowDetails = true; 
  
  // try a structured search that has options that do not exist, to generate an error
  db.structuredSearch({},"flibblewibble",function(result) {
    if (result.inError) {
      document.getElementById("error").innerHTML = "Error: " + result.error + "<br />Details: " + 
        "<br/><pre>" + JSON.stringify(result.details,undefined,2) + "</pre>";
        
      // also show in first error summary widget
      errorSummary.show(result.details);
      errorPointer.show(result.details);
      errorDetails.show(result.details);
    } else {
      document.getElementById("error").innerHTML = "No errors";
    }
  });
});