$(document).ready(function() {
  // initialise MLDB
  var db = new mldb(); // calls default configure
  db.logger.setLogLevel("debug");
  
  // try a structured search that has options that do not exist, to generate an error
  db.structuredSearch({},"flibblewibble",function(result) {
    if (result.inError) {
      document.getElementById("error").innerHTML = "Error: " + result.error + "<br />Details: " + 
        "<br/><pre>" + JSON.stringify(result.details,undefined,2) + "</pre>";
    } else {
      document.getElementById("error").innerHTML = "No errors";
    }
  });
});