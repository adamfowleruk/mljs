
$(document).ready(function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var errorBasic = new com.marklogic.widgets.error("error-basic");
  errorBasic.show("Some generic application error message here");
  
  
  // START SAME ERROR
  var errorSummary = new com.marklogic.widgets.error("error-summary");
  
  var errorPointer = new com.marklogic.widgets.error("error-pointer");
  errorPointer.showFirstCodefile = true;
  
  var errorDetails = new com.marklogic.widgets.error("error-details");
  errorDetails.showFirstCodefile = true;
  errorDetails.allowDetails = true; 
  
  // END SAME ERROR
  
  // try a structured search that has options that do not exist, to generate an error
  db.structuredSearch({},"flibblewibble",function(result) {
    if (result.inError) {
      document.getElementById("error").innerHTML = "Error: " + result.error + "<br />Details: " + 
        "<br/><pre>" + JSON.stringify(result.details,undefined,2) + "</pre>";
        
      // also show in first error summary widget
      errorSummary.show(result); // always call with full MLJS result so that we have the full info to display
      errorPointer.show(result);
      errorDetails.show(result);
    } else {
      document.getElementById("error").innerHTML = "No errors";
    }
  });
  
  
  
  var errorJS = new com.marklogic.widgets.error("error-js");
  errorJS.showFirstCodefile = true;
  errorJS.allowDetails = true; 
  
  try {
    var a = function(x) {
      return b(x * 3);
    };
    var b = function(p) {
      return y - 4; // Should result in a JS ReferenceError - y not defined
    };
    a(10);
  } catch (err) {
    console.log("CAUGHT PAGE ERROR");
    errorJS.show(err);
  }
});