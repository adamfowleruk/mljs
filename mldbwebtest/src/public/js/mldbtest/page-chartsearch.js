$(document).ready(function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var optionsName = "page-charts-search";
  
  var tempspline = new com.marklogic.widgets.highcharts("splineline");
  tempspline.setSeriesSources("#Animals","animal","age");
  tempspline.setAggregateFunction("mean");
  tempspline.setAutoCategories(true);
  tempspline.options.title.text = "Average animal age";
  tempspline.options.subtitle.text = "Years";
  tempspline.options.yAxis.title.text = "Years";
  tempspline.options.chart.type = 'spline';
  tempspline.options.plotOptions = { spline: { dataLabels: { enabled: false }},tooltip:
                {formatter: function() {
                    return Highcharts.numberFormat(this.y,1);
                } } };
  
  var tempcolumn = new com.marklogic.widgets.highcharts("column");
  tempcolumn.setSeriesSources("#Animals","animal","animal");
  tempcolumn.setAggregateFunction("count");
  tempcolumn.setAutoCategories(true);
  tempcolumn.options.title.text = "Animal Popularity";
  tempcolumn.options.subtitle.text = "";
  tempcolumn.options.yAxis.title.text = "Count";
  tempcolumn.options.chart.type = "column";
  tempcolumn.options.plotOptions = {column: {pointPadding: 0.2,borderWidth: 0,
    dataLabels: { enabled: true, style: { fontWeight: 'bold' } } } };
  
  var ob = new db.options();
  ob.defaultCollation("http://marklogic.com/collation/en")
    .pageLength(100)
    .collectionConstraint() // default constraint name of 'collection' 
    .rangeConstraint("animal",["item-order"]) // constraint name defaults to that of the range element name 
    .rangeConstraint("family",["item-frequency"]); // constraint name defaults to that of the range element name 
    
  var options = ob.toJson();
  console.log("Created options: " + JSON.stringify(options));
  
  var bar = new com.marklogic.widgets.searchbar("cs-bar");
  bar.setOptionsName(optionsName);
  bar.setCollection("animals"); // restrict all search results
  
  bar.addResultsListener(function(results) {
    tempspline.updateResults(results);
    tempcolumn.updateResults(results);
  });
  
  db.saveSearchOptions(optionsName,options,function(result) {
    console.log("search options saved");
    bar.execute(); // show some search results by default
  });
});