angular.module('myApp', ["mljs-angular"])
		.controller(
				'SampleCtrl',
				function($scope) {
  var db = new mljs();
  db.logger.setLogLevel("debug");
  
  $scope.mljs=db
  try {
  $scope.optionsName = "page-charts-tempchart";
  $scope.ob = db.createOptions();
  $scope.ob.jsonRangeConstraint("city","xs:string","http://marklogic.com/collation/",["item-order"])
    .jsonRangeConstraint("month","xs:string","http://marklogic.com/collation/",["item-order"]);
  $scope.ob.pageLength(100);
  //var options = ob.toJson();
  

  $scope.initSearch=function(widget){
	  var error = document.getElementById("errors").widget;
	  var tempchart = document.getElementById("tempchart").widget;
	  tempchart.setSeriesSources("city","month","reading.temp");
	  
	  
	  var tempspline = document.getElementById("tempsplineline").widget;
	  tempspline.addErrorListener(error.updateError);
	  tempspline.setSeriesSources("city","month","reading.temp");
	  tempspline.spline().inverted().title("Spline Line: City temperature means").subtitle("Degrees C").yTitle("C");
	  
	  var tempbar = document.getElementById("tempbar").widget;
	  tempbar.addErrorListener(error.updateError);
	  tempbar.setSeriesSources("city","month","reading.temp");
	  tempbar.bar().title("Bar: City temperature means").subtitle("Degrees C").yTitle("C");
	  
	  var tempsbar =document.getElementById("tempstackedbar").widget;
	  tempsbar.addErrorListener(error.updateError);
	  tempsbar.setSeriesSources("city","month","reading.temp");
	  tempsbar.bar().stacked().title("Stacked Bar: City temperature means").subtitle("Degrees C").yTitle("C");
	  
	  var temparea = document.getElementById("temparea").widget;
	  temparea.addErrorListener(error.updateError);
	  temparea.setSeriesSources("city","month","reading.temp");
	  temparea.area().title("Area: City temperature means").subtitle("Degrees C").yTitle("C");
	  
	  var tempsarea = document.getElementById("tempstackedarea").widget;
	  tempsarea.addErrorListener(error.updateError);
	  tempsarea.setSeriesSources("city","month","reading.temp");
	  tempsarea.area({stacking: 'normal',lineColor: '#666666',lineWidth: 1,marker: {lineWidth: 1,lineColor: '#666666'}})
	           .title("Stacked Area: City temperature means").subtitle("Degrees C").yTitle("C");
	  
	  var tempcolumn = document.getElementById("tempcolumn").widget;
	  tempcolumn.addErrorListener(error.updateError);
	  tempcolumn.setSeriesSources("city","month","reading.temp");
	  tempcolumn.column({pointPadding: 0.2,borderWidth: 0}).title("Column: City temperature means").subtitle("Degrees C").yTitle("C");
	  
	  var tempscolumn = document.getElementById("tempstackedcolumn").widget;
	  tempscolumn.addErrorListener(error.updateError);
	  tempscolumn.setSeriesSources("city","month","reading.temp");
	  tempscolumn.column({stacking: 'normal',dataLabels: {enabled: true,color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white'}})
	             .stackLabels({enabled: true,style: {fontWeight: 'bold',color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'}})
	             .title("Stacked Column: City temperature means").subtitle("Degrees C").yTitle("C");

	  	  
	  var qb = db.createQuery();
	  qb.query(qb.and([qb.collection("testdata"),qb.collection("temperatures")]));
	  var query = qb.toJson();
	  widget.context[0].doStructuredQuery(query);
	}

  
  } catch (err) {
    $scope.error.show(err.message);
  }
  
})