
window.onload = function() {
  var db = new mljs();
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  var optionsName = "page-charts-tempchart";
  var ob = db.createOptions();
  ob.jsonRangeConstraint("city","xs:string","http://marklogic.com/collation/",["item-order"])
    .jsonRangeConstraint("month","xs:string","http://marklogic.com/collation/",["item-order"]);
  ob.pageLength(100);
  //var options = ob.toJson();
  
  var tempchart = new com.marklogic.widgets.highcharts("tempchart");
  tempchart.addErrorListener(error.updateError);
  tempchart.setSeriesSources("city","month","reading.temp");
  tempchart.line().title("Line: City temperature means").subtitle("Degrees C").yTitle("C");
  
  var tempspline = new com.marklogic.widgets.highcharts("tempsplineline");
  tempspline.addErrorListener(error.updateError);
  tempspline.setSeriesSources("city","month","reading.temp");
  tempspline.spline().inverted().title("Spline Line: City temperature means").subtitle("Degrees C").yTitle("C");
  
  var tempbar = new com.marklogic.widgets.highcharts("tempbar");
  tempbar.addErrorListener(error.updateError);
  tempbar.setSeriesSources("city","month","reading.temp");
  tempbar.bar().title("Bar: City temperature means").subtitle("Degrees C").yTitle("C");
  
  var tempsbar = new com.marklogic.widgets.highcharts("tempstackedbar");
  tempsbar.addErrorListener(error.updateError);
  tempsbar.setSeriesSources("city","month","reading.temp");
  tempsbar.bar().stacked().title("Stacked Bar: City temperature means").subtitle("Degrees C").yTitle("C");
  
  var temparea = new com.marklogic.widgets.highcharts("temparea");
  temparea.addErrorListener(error.updateError);
  temparea.setSeriesSources("city","month","reading.temp");
  temparea.area().title("Area: City temperature means").subtitle("Degrees C").yTitle("C");
  
  var tempsarea = new com.marklogic.widgets.highcharts("tempstackedarea");
  tempsarea.addErrorListener(error.updateError);
  tempsarea.setSeriesSources("city","month","reading.temp");
  tempsarea.area({stacking: 'normal',lineColor: '#666666',lineWidth: 1,marker: {lineWidth: 1,lineColor: '#666666'}})
           .title("Stacked Area: City temperature means").subtitle("Degrees C").yTitle("C");
  
  var tempcolumn = new com.marklogic.widgets.highcharts("tempcolumn");
  tempcolumn.addErrorListener(error.updateError);
  tempcolumn.setSeriesSources("city","month","reading.temp");
  tempcolumn.column({pointPadding: 0.2,borderWidth: 0}).title("Column: City temperature means").subtitle("Degrees C").yTitle("C");
  
  var tempscolumn = new com.marklogic.widgets.highcharts("tempstackedcolumn");
  tempscolumn.addErrorListener(error.updateError);
  tempscolumn.setSeriesSources("city","month","reading.temp");
  tempscolumn.column({stacking: 'normal',dataLabels: {enabled: true,color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'}})
             .stackLabels({enabled: true,style: {fontWeight: 'bold',color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'}})
             .title("Stacked Column: City temperature means").subtitle("Degrees C").yTitle("C");
  
  var qb = db.createQuery();
  qb.query(qb.and([qb.collection("testdata"),qb.collection("temperatures")]));
  var query = qb.toJson();
  
  var context = db.createSearchContext();
  context.setOptions(optionsName,ob);
  context.register(tempchart);
  context.register(tempspline);
  context.register(tempbar);
  context.register(temparea);
  context.register(tempsarea);
  context.register(tempsbar);
  context.register(tempcolumn);
  context.register(tempscolumn);
  context.doStructuredQuery(query);
  
  /*
  // THE OLD WAY:-
  db.saveSearchOptions(optionsName,options,function(result) {
    db.structuredSearch(query,optionsName,function(result) {
      
      mljs.defaultconnection.logger.debug("Got result in page JS: " + JSON.stringify(result));
      
      tempchart.updateResults(result.doc);
      tempspline.updateResults(result.doc);
      tempbar.updateResults(result.doc);
      temparea.updateResults(result.doc);
      tempsarea.updateResults(result.doc);
      tempsbar.updateResults(result.doc);
      tempcolumn.updateResults(result.doc);
      tempscolumn.updateResults(result.doc);
    });
  });*/
  
  } catch (err) {
    error.show(err.message);
  }
  
};