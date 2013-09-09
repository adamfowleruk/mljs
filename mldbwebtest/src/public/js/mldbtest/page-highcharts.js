
$(document).ready(function() {
  var db = new mljs();
  db.logger.setLogLevel("debug");
  
  var error = new com.marklogic.widgets.error("errors");
  
  try {
  
  var optionsName = "page-charts-tempchart";
  var ob = db.createOptions();
  ob.pageLength(100);
  var options = ob.toJson();
  
  var tempchart = new com.marklogic.widgets.highcharts("tempchart");
  tempchart.addErrorListener(error.updateError);
  tempchart.setSeriesSources("city","month","reading.temp");
  tempchart.options.title.text = "Line: City temperature means";
  tempchart.options.subtitle.text = "Degrees C";
  tempchart.options.yAxis.title.text = "C";
  
  var tempspline = new com.marklogic.widgets.highcharts("tempsplineline");
  tempspline.addErrorListener(error.updateError);
  tempspline.setSeriesSources("city","month","reading.temp");
  tempspline.options.title.text = "Spline Line: City temperature means";
  tempspline.options.subtitle.text = "Degrees C";
  tempspline.options.yAxis.title.text = "C";
  tempspline.options.chart.type = 'spline';
  tempspline.options.chart.inverted = true;
  
  var tempbar = new com.marklogic.widgets.highcharts("tempbar");
  tempbar.addErrorListener(error.updateError);
  tempbar.setSeriesSources("city","month","reading.temp");
  tempbar.options.title.text = "Bar: City temperature means";
  tempbar.options.subtitle.text = "Degrees C";
  tempbar.options.yAxis.title.text = "C";
  tempbar.options.chart.type = "bar";
  
  var tempsbar = new com.marklogic.widgets.highcharts("tempstackedbar");
  tempsbar.addErrorListener(error.updateError);
  tempsbar.setSeriesSources("city","month","reading.temp");
  tempsbar.options.title.text = "Stacked Bar: City temperature means";
  tempsbar.options.subtitle.text = "Degrees C";
  tempsbar.options.yAxis.title.text = "C";
  tempsbar.options.chart.type = "bar";
  tempsbar.options.plotOptions = {series: {stacking: 'normal'}};
  
  var temparea = new com.marklogic.widgets.highcharts("temparea");
  temparea.addErrorListener(error.updateError);
  temparea.setSeriesSources("city","month","reading.temp");
  temparea.options.title.text = "Area: City temperature means";
  temparea.options.subtitle.text = "Degrees C";
  temparea.options.yAxis.title.text = "C";
  temparea.options.chart.type = "area";
  
  var tempsarea = new com.marklogic.widgets.highcharts("tempstackedarea");
  tempsarea.addErrorListener(error.updateError);
  tempsarea.setSeriesSources("city","month","reading.temp");
  tempsarea.options.title.text = "Stacked Area: City temperature means";
  tempsarea.options.subtitle.text = "Degrees C";
  tempsarea.options.yAxis.title.text = "C";
  tempsarea.options.chart.type = "area";
  tempsarea.options.plotOptions = {area: {stacking: 'normal',lineColor: '#666666',lineWidth: 1,marker: {lineWidth: 1,lineColor: '#666666'}}};
  
  var tempcolumn = new com.marklogic.widgets.highcharts("tempcolumn");
  tempcolumn.addErrorListener(error.updateError);
  tempcolumn.setSeriesSources("city","month","reading.temp");
  tempcolumn.options.title.text = "Column: City temperature means";
  tempcolumn.options.subtitle.text = "Degrees C";
  tempcolumn.options.yAxis.title.text = "C";
  tempcolumn.options.chart.type = "column";
  tempcolumn.options.plotOptions = {column: {pointPadding: 0.2,borderWidth: 0}};
  
  var tempscolumn = new com.marklogic.widgets.highcharts("tempstackedcolumn");
  tempscolumn.addErrorListener(error.updateError);
  tempscolumn.setSeriesSources("city","month","reading.temp");
  tempscolumn.options.title.text = "Stacked Column: City temperature means";
  tempscolumn.options.subtitle.text = "Degrees C";
  tempscolumn.options.yAxis.title.text = "C";
  tempscolumn.options.yAxis.stackLabels = {enabled: true,style: {fontWeight: 'bold',color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'}};
  tempscolumn.options.chart.type = "column";
  tempscolumn.options.plotOptions = {column: {stacking: 'normal',dataLabels: {enabled: true,color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'}}};
  
  var qb = new db.query();
  qb.query(qb.and([qb.collection("testdata"),qb.collection("temperatures")]));
  var query = qb.toJson();
  
  db.saveSearchOptions(optionsName,options,function(result) {
    db.structuredSearch(query,optionsName,function(result) {
      tempchart.updateResults(result.doc);
      tempspline.updateResults(result.doc);
      tempbar.updateResults(result.doc);
      temparea.updateResults(result.doc);
      tempsarea.updateResults(result.doc);
      tempsbar.updateResults(result.doc);
      tempcolumn.updateResults(result.doc);
      tempscolumn.updateResults(result.doc);
    });
  });
  
  } catch (err) {
    error.show(err.message);
  }
  
});