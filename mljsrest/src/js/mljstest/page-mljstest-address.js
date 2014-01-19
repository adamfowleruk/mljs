window.onload = function() {
  var db = new mljs();
  db.logger.setLogLevel("debug");
  
  var errors = new com.marklogic.widgets.error("errors");
  errors.showFirstCodefile = true;
  errors.allowDetails = true; 
  
  try {
    var sc = db.createSearchContext();
    var ob = db.createOptions();
    ob.defaultCollation("http://marklogic.com/collation")
      .rangeConstraint("stars","stars",null,"xs:int",null)
      .geoElementPairConstraint("location","location","http://marklogic.com/xdmp/json/basic",
        "lat","http://marklogic.com/xdmp/json/basic","lon","http://marklogic.com/xdmp/json/basic",null,["units=miles","coordinate-system=wgs84"]);
    sc.setOptions("attractions",ob.toJson());
    
    var address = new com.marklogic.widgets.addressbar("addressbar");
    address.radius(1,"miles");
    
    var geocontext = db.createGeoContext();
    geocontext.register(address);
    
    var results = new com.marklogic.widgets.searchresults("results");
    sc.register(results);
    
    var ol = new com.marklogic.widgets.openlayers("map");
    geocontext.register(ol);
    sc.register(ol);
    ol.setGeoSelectionConstraint("location"); // DO NOT replace this with geocontext support - geocontext gives area of interest generally. Like an overall view within which this area is being selected. Linking would cause a map selection to zoom the map to the bounds of that selection
    ol.go(51.5112139, -0.1198244, 13); // lat, lon, zoom level (openlayers level) // TODO replace this with geocontext support
    ol.setHeatmapGranularity(ol.LOW);
    ol.addSeries("Attractions",sc,"location.lat","location.lon",undefined,undefined,undefined,"location"); // draw features for search results on configured search context
    
    var qb = db.createQuery();
    sc.contributeStructuredQuery("base",qb.collection("attractions"));
    
    // now initialise home location
    geocontext.inform(sc,"locale","location").home(qb.circleDef(51.5112139,-0.1198244,20)); 
    // 2nd parameter to home() defaults to true, meaning always goes back to this location when empty
    
  } catch (err) {
    errors.show(err);
  }
  
  
};
