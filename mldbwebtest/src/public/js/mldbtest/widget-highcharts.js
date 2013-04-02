// global variable definitions
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};

com.marklogic.widgets.highcharts = function(container) {
  this.container = container;
  
  this.aggregateFunction = "mean"; // sum, max, min, no avg (mean, median, mode instead)
  this.nameSource = "title"; // e.g. city name
  this.valueSource = "value"; // e.g. temperature
  this.categorySource = "category"; // E.g. month
  this.categoryOrdering = "month";
  this.autoCategories = false;
  this.categories = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  this.series = new Array();
  
  this._updateOptions();
  
  this._refresh();
};

com.marklogic.widgets.highcharts.prototype._updateOptions = function() {
  this.options = {
    chart: {
                type: 'line',
				renderTo : this.container,
            },
            title: {
                text: 'Title'
            },
            subtitle: {
                text: 'Subtitle'
            },
            xAxis: {
              categories: this.categories
            },
            yAxis: {
                title: {
                    text: 'Y Axis'
                }
            },
            tooltip: {
                enabled: true,
                formatter: function() {
                    return '<b>'+ this.series.name +'</b><br/>'+
                        this.x +': '+ this.y;
                }
            },
            plotOptions: {
                line: {
                    dataLabels: {
                        enabled: true
                    },
                    enableMouseTracking: false
                }
            },
    series: this.series
  };
  mldb.defaultconnection.logger.debug("highcharts.prototype._updateOptions(): Options now: " + JSON.stringify(this.options));
};

com.marklogic.widgets.highcharts.prototype.setAggregateFunction = function(fn) {
  this.aggregateFunction = fn; // TODO sanity check value
};

com.marklogic.widgets.highcharts.prototype._refresh = function() {
  // draw data points
  
  mldb.defaultconnection.logger.debug("Options: " + JSON.stringify(this.options));
  
  //$("#" + this.container).highcharts(this.options);
  this.chart = new Highcharts.Chart(this.options);
};

com.marklogic.widgets.highcharts.prototype.setAutoCategories = function(bv) {
  this.autoCategories = bv;
};

com.marklogic.widgets.highcharts.prototype.setSeriesSources = function(nameSource,categorySource,valueSource) {
  this.nameSource = nameSource;
  this.categorySource = categorySource;
  this.valueSource = valueSource;
};

com.marklogic.widgets.highcharts.prototype.updateResults = function(results) {
  // go through each results and extract name and values, grouping by name
  var seriesNames = new Array();
  var seriesValues = new Array(); // name -> array(category) -> array(values)
  var seriesCounts = new Array(); // name -> array(category) -> count of values
  
  var allCategories = new Array();
  
  if (undefined != results && undefined == results.results) {
    results = { results: results};
  }
  
  for (var r = 0;r < results.results.length;r++) {
    var result = results.results[r].content;
    // get name value
    var name = "";
    if (this.nameSource.startsWith("#")) {
      // hardcoded value
      name = this.nameSource.substring(1);
    } else {
      name = jsonExtractValue(result,this.nameSource);
    }
    // get data value
    var value = this.jsonExtractValue(result,this.valueSource);
    
    var category = this.jsonExtractValue(result,this.categorySource);
    if (!allCategories.contains(category)) {
      allCategories.push(category);
    }
    
    // see if name is already known
    if (!seriesNames.contains(name)) {
      seriesNames.push(name);
      seriesValues[name] = new Array();
      seriesCounts[name] = new Array();
    }
    // append to values array
    var categoryValueArray = seriesValues[name][category];
    if (undefined == categoryValueArray) {
      seriesValues[name][category] = new Array();
      seriesCounts[name][category] = 0;
    }
    seriesValues[name][category].push(value);
    seriesCounts[name][category] += 1;
  }
  
  if (this.autoCategories) {
    mldb.defaultconnection.logger.debug("updateResults(): Auto categories enabled");
    this.categories = allCategories;
    // TODO sort categories alphabetically
  }
  
  mldb.defaultconnection.logger.debug("Series names: " + JSON.stringify(seriesNames));
  mldb.defaultconnection.logger.debug("Series Values: " + JSON.stringify(seriesValues));
  
  // now aggregate by looping through each name then each category, applying appropriate function
  var sum = function(arr) {
    var sum = 0;
    for (var i = 0;i < arr.length;i++) {
      sum += arr[i];
    }
    return sum;
  };
  var mean = function(arr) {
    if (undefined == arr) {
      return 0; // TODO replace with whatever null is for highcharts, incase a particular category has no value
    }
    var sum = 0;
    for (var i = 0;i < arr.length;i++) {
      sum += arr[i];
    }
    return sum / arr.length;
  };
  var min = function(arr) {
    var min = arr[0];
    for (var i = 1;i < arr.length;i++) {
      if (arr[i] < min) {
        min = arr[i];
      }
    }
    return min;
  };
  var max = function(arr) {
    var max = arr[0];
    for (var i = 1;i < arr.length;i++) {
      if (arr[i] > max) {
        max = arr[i];
      }
    }
    return max;
  };
  var count = function(arr) {
    return arr.length;
  };
  
  var func = sum;
  if ("mean" == this.aggregateFunction) {
    func = mean;
  } else if ("min" == this.aggregateFunction) {
    func = min;
  } else if ("max" == this.aggregateFunction) {
    func = max;
  } else if ("count" == this.aggregateFunction) {
    func = count;
  }
  
  // now loop over names, categories, and create values array
  // allow order of categories to be specified (in future this could be automatic. E.g. if a whole number range such as age)
  var series = new Array();
  for (var n = 0;n < seriesNames.length;n++) {
    var name = seriesNames[n];
    // create new categories values arrays
    var orderedData = new Array();
    for (var p = 0;p < this.categories.length;p++) {
      orderedData[p] = func(seriesValues[name][this.categories[p]]);
    }
    series[n] = { name: name, data: orderedData};
  }
  
  // now set chart's option's series values
  this.options.series = series;
  this.options.xAxis.categories = this.categories;
  
  this._refresh();
};
