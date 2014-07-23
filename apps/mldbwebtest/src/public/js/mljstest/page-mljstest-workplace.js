
window.onload = function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");

  var error = new com.marklogic.widgets.error("errors");

  //try {

  var ob = db.createOptions();
  ob.defaultCollation("http://marklogic.com/collation/en")
    .collectionConstraint() // default constraint name of 'collection'
    .jsonRangeConstraint("animal",["item-order"]) // constraint name defaults to that of the range element name
    .jsonRangeConstraint("family",["item-frequency"]); // constraint name defaults to that of the range element name

  var options = ob.toJson();

    var page = { title: "Workplace test page", layout: "thinthick", urls: ["/mljstest/workplace/","/mljstest/workplace","/mljstest/workplace.html","/workplace.html"], widgets: [
      {widget: "searchfacets1", type: "com.marklogic.widgets.searchfacets", config: {
        listSize: 5, extendedSize: 10, allowShowAll: true, hideEmptyFacets: true
      }},
      {widget: "searchbar1", type: "com.marklogic.widgets.searchbar", config: {}},
      {widget: "highcharts1", type: "com.marklogic.widgets.highcharts", config: {
        title: "Animal Family",
        subtitle: "",
        xTitle: "Family",
        yTitle: "Count",
        type: "pie",
        series: [{
          nameSourceType: "fixed",
          nameSource: "Family",
          autoCategories: true,
          categorySourceType: "facet", // Not used
          categorySource: "family", // Not used
          valueSourceType: "element",
          valueSource: null,
          aggregateFunction: "none"
       }]
      }},
      {widget: "searchresults1", type: "com.marklogic.widgets.searchresults", config: {selectionMode: "append"}},
      {widget: "selection1", type: "com.marklogic.widgets.selection", config: {}}
    ], assignments: [
      {widget: "searchfacets1", zone: "A", order: 1},
      {widget: "searchbar1", zone: "B", order: 1},
      {widget: "highcharts1", zone: "B", order: 2},
      {widget: "searchresults1", zone: "B", order: 3},
      {widget: "selection1", zone: "A", order: 2}
    ], contexts: [
      {context: "searchcontext1", type: "SearchContext", register: ["searchfacets1","searchbar1","highcharts1","searchresults1","selection1"], config: {
        options: options, optionsName: "mljs-search-pie-hybrid", sortWord: "sort",
        defaultQuery: "", collection: "animals,testdata", directory: null, transform: null, format: null
      }},
      {context: "semanticcontext1", type: "SemanticContext", register: [], config: {}},
      {context: "documentcontext1", type: "DocumentContext", register: [], config: {}}
    ], actions: {
      onload: [
        {action: "searchcontext1.doSimpleQuery1",type: "javascript", config: {target: "searchcontext1", method: "doSimpleQuery", parameters:[]}}
      ]
    }};

    var workplace = new com.marklogic.widgets.workplace("workplace");
    var ctx = workplace.getWorkplaceContext();
    var uri = "/mljstest/workplace/workplace.json";
    ctx.setWorkplaceUri(uri);
    workplace.editable();
    //workplace.saveable(false); // don't persist changes
    // NB first below is "try this first, then default to second"
    var pageurl = window.location.pathname; // TODO validate this works in all browsers
    workplace.loadPage(pageurl,page); // could instead use loadPage() to determine automatically via window.location, or loadPage("/my/path") to load via search in content database
 /*
  } catch (err) {
    console.log(JSON.stringify(err));
    error.show(err.message);
  }*/

};
