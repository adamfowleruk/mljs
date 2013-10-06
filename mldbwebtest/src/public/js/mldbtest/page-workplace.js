
$(document).ready(function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  //try {
  
    var page = { title: "Workplace test page", layout: "thinthick", urls: ["/mldbtest/workplace/","/mldbtest/workplace","/mldbtest/workplace.html"], widgets: [
      {widget: "searchfacets1", type: "com.marklogic.widgets.searchfacets", config: {}},
      {widget: "searchbar1", type: "com.marklogic.widgets.searchbar", config: {}},
      {widget: "highcharts1", type: "com.marklogic.widgets.highcharts", config: {}},
      {widget: "searchresults1", type: "com.marklogic.widgets.searchresults", config: {}}
    ], assignments: [
      {widget: "searchfacets1", zone: "A", order: 1},
      {widget: "searchbar1", zone: "B", order: 1},
      {widget: "highcharts1", zone: "B", order: 2},
      {widget: "searchresults1", zone: "B", order: 3}
    ], contexts: [
      {context: "searchcontext1", type: "SearchContext", register: ["searchfacets1","searchbar1","highcharts1","searchresults1"]}
    ]};
    
    var workplace = new com.marklogic.widgets.workplace("workplace");
    workplace.editable();
    workplace.loadPage(page); // could instead use loadPage() to determine automatically via window.location, or loadPage("/my/path") to load via search in content database
 /* 
  } catch (err) {
    console.log(JSON.stringify(err));
    error.show(err.message);
  }*/
  
});