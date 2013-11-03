window.onload = function() {
  var db = new mljs();
  db.logger.setLogLevel("debug");
  
  var errors = new com.marklogic.widgets.error("errors");
  errors.showFirstCodefile = true;
  errors.allowDetails = true; 
  
  try {
    var sc = db.createSearchContext();
    
    var results = new com.marklogic.widgets.searchresults("results");
    sc.register(results);
    
    var ol = new com.marklogic.widgets.openlayers("map");
    sc.register(ol);
    
    // NB ol widget defaults to Open Street Map (OSM) 
    ol.go(51.5112139, -0.1198244, 13); // lat, lon, zoom level (openlayers level)
    
  } catch (err) {
    errors.show(err);
  }
  
  
};
