
$(document).ready(function() {
  // initialise mljs
  var db = new mljs(); // calls default configure
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  var optionsName = "page-charts-search";
  
  var tempspline = new com.marklogic.widgets.highcharts("splineline");
  tempspline.addErrorListener(error.updateError);
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
  tempcolumn.addErrorListener(error.updateError);
  tempcolumn.setSeriesSources("#Animals","animal","animal");
  tempcolumn.setAggregateFunction("count");
  tempcolumn.setAutoCategories(true);
  tempcolumn.options.title.text = "Animal Popularity";
  tempcolumn.options.subtitle.text = "";
  tempcolumn.options.yAxis.title.text = "Count";
  tempcolumn.options.chart.type = "column";
  tempcolumn.options.plotOptions = {column: {pointPadding: 0.2,borderWidth: 0,
    dataLabels: { enabled: true, style: { fontWeight: 'bold' } } } };
    
  var familypie = new com.marklogic.widgets.highcharts("pie");
  familypie.addErrorListener(error.updateError);
  familypie.setSeriesSources("#Family","!family");
  familypie.setAggregateFunction("none");
  familypie.setAutoCategories(true);
  familypie.options.title.text = "Animal Family";
  familypie.options.subtitle.text = "";
  familypie.options.yAxis.title.text = "Count";
  familypie.options.chart.type = "pie";
  //familypie.options.plotOptions = {pie: {pointPadding: 0.2,borderWidth: 0,
  //  dataLabels: { enabled: true, style: { fontWeight: 'bold' } } } };
  
  var ob = db.createOptions();
  ob.defaultCollation("http://marklogic.com/collation/en")
    .pageLength(100)
    .collectionConstraint() // default constraint name of 'collection' 
    .rangeConstraint("animal",["item-order"]) // constraint name defaults to that of the range element name 
    .rangeConstraint("family",["item-frequency"]); // constraint name defaults to that of the range element name 
    
  var options = ob.toJson();
  console.log("Created options: " + JSON.stringify(options));
  
  var context = db.createSearchContext();
  
  var bar = new com.marklogic.widgets.searchbar("cs-bar");
  context.register(bar);
  context.register(tempspline);
  context.register(tempcolumn);
  context.register(familypie);
  context.setOptions(optionsName,options);
  context.setCollection("animals,testdata"); // restrict all search results
  
  context.addErrorListener(error.updateError);
  
  context.dosimplequery();
  
  } catch (err) {
    error.show(err.message);
  }
});