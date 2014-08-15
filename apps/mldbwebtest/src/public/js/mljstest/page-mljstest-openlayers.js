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

    var results = new com.marklogic.widgets.searchresults("results");
    sc.register(results);

    var geocontext = db.createGeoContext();

    var address = new com.marklogic.widgets.addressbar("addressbar");
    address.radius(20,"miles");
    geocontext.register(address);

    var ol = new com.marklogic.widgets.openlayers("map");
    sc.register(ol);
    geocontext.register(ol); // used to change center location of map

    /*
    ol.addGoogleStreet(); // add google street maps to the default Open Street Maps (OSM) base layer
    // removed because google's CDN is soooooo slowwwwww
    */
    ol.addArcGISOnline();
    ol.addAllBing();
    ol.setGeoSelectionConstraint("location");
    ol.go(51.5112139, -0.1198244, 13); // lat, lon, zoom level (openlayers level)
    ol.setHeatmapGranularity(ol.LOW);
    ol.addSeries("Attractions",sc,"location.lat","location.lon",undefined,undefined,undefined,"location"); // draw features for search results on configured search context

    // allow the query to be changed dynamically
    var qb = db.createQuery();
    var dynLocation = qb.dynamic(qb.geoElementPairRadius("location","http://marklogic.com/xdmp/json/basic","lat","http://marklogic.com/xdmp/json/basic",
      "lon","http://marklogic.com/xdmp/json/basic",51.5112139, -0.1198244,20,"miles","reciprocal" )); // includes initial position

    // WARNING: ALTHOUGH THIS WILL WORK ON V6, THE RANGE INDEX EFFECT ON RELEVANCY SCORE WONT BE APPLIED UNLESS YOU RUN ON V7

    var byDistance = function() {
      qb = db.createQuery(); // clear it out rather than alter
      qb.query(qb.and([
        qb.collection("attractions"),
        dynLocation({latitude: 51.5112139, longitude: -0.1198244, radius: 20, units: "miles", "score-function": "reciprocal"}) // TODO drive from the map's current center location
        // could add other dynamic query function calls, or static clauses, here
      ]));
      return qb.toJson();
    };
    var byRating = function() {
      qb = db.createQuery(); // clear it out rather than alter
      qb.query(qb.and([
        qb.collection("attractions"),
        qb.range("stars",0,"GT",["score-function=linear","slope-factor=10"]),
        dynLocation({latitude: 51.5112139, longitude: -0.1198244, radius: 20, units: "miles", "score-function": "zero"}) // Still include this to limit geography of results
        // NB in this query, instead of the above we could just use a georadius query
        // could add other dynamic query function calls, or static clauses, here
      ]));
      return qb.toJson();
    };

    // initialise display with default query - NB in reality this would occur from detecting user's browser's location or a manual address search
    sc.contributeStructuredQuery("selection",byDistance()); // This would normally be called elsewhere. E.g. when the map changes centered position, or a different 'address' is entered

    // create a structured query selection widget with title "Calculate relevancy by:" and values "Nearest First" and "Best Rating First"
    var selection = new com.marklogic.widgets.searchselection("selection");
    selection.setModeContributeStructured();
    sc.register(selection);

    selection.addQuery("Nearest First",byDistance);
    selection.addQuery("Best Rating First",byRating);

    geocontext.inform(sc,"locale","location").home(qb.circleDef(51.5112139,-0.1198244,20));

    // TODO remove concept of dynLocation and have it affected by the last address lookup (i.e. geocontext event) done

  } catch (err) {
    errors.show(err);
  }


};
