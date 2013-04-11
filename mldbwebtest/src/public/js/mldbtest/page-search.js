$(document).ready(function() {
  var db = new mldb(); 
  
  var wgt = new com.marklogic.widgets.searchpage("search-page");
  wgt.results.addProcessor("animals", function(result) {
    return ("object" == typeof result.content && undefined != result.content.animal && undefined != result.content.title && undefined != result.content.summary);
  }, function (result) {
    return "<div class='searchresults-result'><h3>" + result.index + ". " + result.content.title + "</h3>" +
      "<div class='searchresults-snippet'>I am " + result.content.title + ". A " + result.content.animal + " fact is: " + result.content.summary + "</div></div>";
  });
  wgt.results.addProcessor("movies", function(result) {
    if ("object" == typeof result.content && undefined != result.content.actor && undefined != result.content.genre && undefined != result.content.year) {
      return true;
    }
    return false;
  }, function (result) {
    return "<div class='searchresults-result'><h3>" + result.index + ". " + result.content.title + "(" + result.content.year + ")</h3>" +
      "<div class='searchresults-snippet'>Starring " + result.content.actor + ". A " + result.content.genre + " film.</div></div>";
  });
  wgt.results.addProcessor("svg", function(result) {
    var xml = null;
    if ("string" == typeof result.content) {
      xml = textToXML(result.content);
    } else if ("object" == typeof result.content && undefined != result.content.nodeType) {
      xml = result.content; // should never happen - always returned as string
    }
    if (null != xml) {
      // check namespace and root element
      mldb.defaultconnection.logger.debug("Potential SVG nodeName: " + xml.childNodes[0].nodeName);
      mldb.defaultconnection.logger.debug("Potential SVG nodeType: " + xml.childNodes[0].nodeType);
      if (xml.childNodes[0].nodeName == "svg") {
        return true;
      } else {
        return false;
      }
    }
    return false;
  }, function (result) {
    return "<div class='searchresults-result'><h3>" + result.index + ". " + result.uri + "</h3>" +
      "<div style='height: 200px;position:relative;'>" + result.content + "</div></div>"; // returns the full xml to be applied within the document as SVG
  });
  
  var ob = db.options();
  ob.defaultCollation("http://marklogic.com/collation/en")
    .collectionConstraint() // default constraint name of 'collection' 
    .rangeConstraint("animal",["item-order"]) // constraint name defaults to that of the range element name 
    .rangeConstraint("family",["item-frequency"]) // constraint name defaults to that of the range element name 
    .rangeConstraint("actor",["item-frequency"],"http://marklogic.com/collation/")
    .rangeConstraint("year",["item-order"],"http://marklogic.com/collation/")
    .rangeConstraint("city",["item-order"],"http://marklogic.com/collation/")
    .rangeConstraint("month",["item-order"],"http://marklogic.com/collation/");
  var options = ob.toJson();
  
  wgt.setOptions("mldbtest-page-search-options",options);
  wgt.execute();
  
});