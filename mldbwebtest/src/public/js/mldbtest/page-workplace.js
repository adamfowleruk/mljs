
$(document).ready(function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  //try {
    
  var ob = db.createOptions();
  ob.defaultCollation("http://marklogic.com/collation/en")
    .collectionConstraint() // default constraint name of 'collection' 
    .rangeConstraint("animal",["item-order"]) // constraint name defaults to that of the range element name 
    .rangeConstraint("family",["item-frequency"]); // constraint name defaults to that of the range element name 
    
  var options = ob.toJson();
  
    var page = { title: "Workplace test page", layout: "thinthick", urls: ["/mldbtest/workplace/","/mldbtest/workplace","/mldbtest/workplace.html"], widgets: [
      {widget: "searchfacets1", type: "com.marklogic.widgets.searchfacets", config: {
        listSize: {value: 5}, extendedSize: {value: 10}, allowShowAll: {value: true}, hideEmptyFacets: {value:true}
      }},
      {widget: "searchbar1", type: "com.marklogic.widgets.searchbar", config: {}},
      {widget: "highcharts1", type: "com.marklogic.widgets.highcharts", config: {
        title: {value: "Animal Family"},
        subtitle: {value: ""},
        xTitle: {value: "Family"},
        yTitle: {value: "Count"},
        type: {value: "pie"},
        series: { value: [{
          nameSourceType: {value: "fixed"},
          nameSource: {value: "Family"},
          autoCategories: {value: true},
          categorySourceType: {value: "element"}, // Not used
          categorySource: {value: "category"}, // Not used
          valueSourceType: {value: "facet"},
          valueSource: {value: "family"},
          aggregateFunction: {value: "none"}
       }]}
      }},
      {widget: "searchresults1", type: "com.marklogic.widgets.searchresults", config: {}}
    ], assignments: [
      {widget: "searchfacets1", zone: "A", order: 1},
      {widget: "searchbar1", zone: "B", order: 1},
      {widget: "highcharts1", zone: "B", order: 2},
      {widget: "searchresults1", zone: "B", order: 3}
    ], contexts: [
      {context: "searchcontext1", type: "SearchContext", register: ["searchfacets1","searchbar1","highcharts1","searchresults1"], config: {
        options: {value: options}, optionsName: {value: "mljs-search-pie-hybrid"}, sortWord: {value: "sort"},
        defaultQuery: {value: ""}, collection: {value: "animals,testdata"}, directory: {value: null}, transform: {value: null}, format: {value: null}
      }}
    ], actions: {
      onload: [
        {type: "javascript", object: "searchcontext1", method: "doSimpleQuery", parameters: []}
      ]
    }};
    
    var workplace = new com.marklogic.widgets.workplace("workplace");
    workplace.editable();
    workplace.loadPage(page); // could instead use loadPage() to determine automatically via window.location, or loadPage("/my/path") to load via search in content database
 /* 
  } catch (err) {
    console.log(JSON.stringify(err));
    error.show(err.message);
  }*/
  
});