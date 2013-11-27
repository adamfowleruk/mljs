  
  // Normal page code before here
  
  var db = new mljs(); 
  
  var wgt = new com.marklogic.widgets.searchpage("search-page");
  // README NOW!!! If you don't know what addProcessor does, comment out the lines! MLJS provides default processors that may well work if using JSON, XHTML or some XML
  wgt.results.addProcessor("animals", function(result) {
    return ("object" == typeof result.content && undefined != result.content.animal && undefined != result.content.title && undefined != result.content.summary);
  }, function (result) {
    return "<div class='searchresults-result'><h3>" + result.index + ". " + result.content.title + "</h3>" +
      "<div class='searchresults-snippet'>I am " + result.content.title + ". A " + result.content.animal + " fact is: " + result.content.summary + "</div></div>";
  });
  // Note: If directly using a searchresults widget stored in a variable called results, use instead of the below: results.addProcessor...
  wgt.results.addProcessor("movies", function(result) {
    if ("object" == typeof result.content && undefined != result.content.actor && undefined != result.content.genre && undefined != result.content.year) {
      return true;
    }
    return false;
  }, function (result) {
    return "<div class='searchresults-result'><h3>" + result.index + ". " + result.content.title + "(" + result.content.year + ")</h3>" +
      "<div class='searchresults-snippet'>Starring " + result.content.actor + ". A " + result.content.genre + " film.</div></div>";
  });
  
  // ...