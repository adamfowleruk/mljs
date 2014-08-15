
window.onload = function() {
  var db = new mljs();

  /**
   * WARNING: This page uses the convenience searchpage() widget. If you need changes to the position or number of widgets shown
   *          then DO NOT edit that widget, but instead use the same HTML as in the widget-search.js' searchpage() constructor directly
   *          in your page. You are then free to edit, in your page, whatever you like. searchpage is purely for convenience when
   *          you do not want to create this HTML manually.
   */


  //var wgt = new com.marklogic.widgets.searchpage("search-page");
  // README NOW!!! If you don't know what addProcessor does, comment out the lines! MLJS provides default processors that may well work if using JSON, XHTML or some XML
  var sc = db.createSearchContext();
  var results = new com.marklogic.widgets.searchresults("results");
  var facets = new com.marklogic.widgets.searchfacets("facets");
  var sorter = new com.marklogic.widgets.searchsort("sorter");
  var pager = new com.marklogic.widgets.searchpager("pager");
  var metrics = new com.marklogic.widgets.searchmetrics("metrics");
  var bar = new com.marklogic.widgets.searchbar("searchbar");

  sc.register(results);
  sc.register(facets);
  sc.register(sorter);
  sc.register(pager);
  sc.register(metrics);
  sc.register(bar);

  results.addProcessor("animals", function(result) {
    return ("object" == typeof result.content && undefined != result.content.animal && undefined != result.content.title && undefined != result.content.summary);
  }, function (result) {
    return "<div class='searchresults-result'><div class='h4'>" + result.index + ". " + result.content.title + "</div>" +
      "<div class='searchresults-snippet'>I am " + result.content.title + ". A " + result.content.animal + " fact is: " + result.content.summary + "</div></div>";
  });
  results.addProcessor("movies", function(result) {
    if ("object" == typeof result.content && undefined != result.content.actor && undefined != result.content.genre && undefined != result.content.year) {
      return true;
    }
    return false;
  }, function (result) {
    return "<div class='searchresults-result'><div class='h4'>" + result.index + ". " + result.content.title + "(" + result.content.year + ")</div>" +
      "<div class='searchresults-snippet'>Starring " + result.content.actor + ". A " + result.content.genre + " film.</div></div>";
  });

  var ob = db.createOptions();
  ob.defaultCollation("http://marklogic.com/collation/en") // you may not need this if using the default collation throughout
    .collectionConstraint() // default constraint name of 'collection'
    .rangeConstraint("Animal","animal",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"]) // constraint name defaults to that of the range element name
    .rangeConstraint("Family","family",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-frequency"]) // constraint name defaults to that of the range element name
    .rangeConstraint("Actor","actor",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-frequency"])
    .rangeConstraint("Year","year",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
    .rangeConstraint("City","city",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
    .rangeConstraint("Month","month",ob.JSON,"xs:string","http://marklogic.com/collation/",true,["item-order"])
    .rangeConstraint("Title","title","http://www.w3.org/1999/xhtml","xs:string","http://marklogic.com/collation/",true,["item-order"])
    .rangeConstraint("Heading","h1","http://www.w3.org/1999/xhtml","xs:string","http://marklogic.com/collation/",true,["item-order"])
    //.rangeConstraint("Summary","summary","","xs:string","http://marklogic.com/collation/",true,["item-order"])
    .rangeConstraint("DateReceived","datereceived","http://marklogic.com/ns/dt","xs:date",null,true,null,null,"Received At")
    //constraint_name_opt,name_or_key,ns_opt,type_opt,collation_opt,facet_opt,facet_options_opt,fragmentScope_opt,annotation_opt
    .annotate("DateReceived","Received On")
      .extractConstraintMetadata("Animal")
      //.extractConstraintMetadata("extract")
      .extractElementMetadata("title","http://www.w3.org/1999/xhtml")
      .extractConstraintMetadata("Year")
      .extractConstraintMetadata("DateReceived");
  var dateBuckets = ob.buckets("DateReceived");
  dateBuckets.bucket("2013-01-01","2013-01-31","jan2013","Jan 2013")
             .bucket("2013-02-01","2013-02-28","feb2013","Feb 2013")
             .bucket("2013-03-01","2013-03-31","mar2013","Mar 2013");

  // add facet value names for cities - just an example. Better example SOME/weirdValue -> "Nice Display Name"
  ob.setFacetValueStrings("City",{
    Derby: "City of Derby", London: "City of London"
  });
  //var options = ob.toJson();

  sc.setOptions("mljstest-page-search-options",ob);
  sc.doSimpleQuery(); // uses search context

};
