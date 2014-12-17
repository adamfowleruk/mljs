/*
Copyright 2012 MarkLogic Corporation

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
// global variable definitions
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};

/**
 * Creates a HighCharts wrapper widget. HighCharts is a commercial JavaScript graphing widget distributed with MarkLogic.
 * If you are using this widget against a MarkLogic application, you are licensed to use HighCharts
 *
 * This widget is MLJS Workplace enabled.
 *
 * @constructor
 * @param {string} container - HTML ID of the element to place this widget's content within.
 */
com.marklogic.widgets.highcharts = function(container) {
  this.container = container;

  // publicly settable properties
  this.aggregateFunction = "mean"; // sum, max, min, no avg (mean, median, mode instead)
  this.nameSource = "title"; // e.g. city name
  this.valueSource = "value"; // e.g. temperature
  this.categorySource = "category"; // E.g. month
  this.autoCategories = false;

  this._title = "Title";
  this._subtitle = "Subtitle";
  this._xTitle = "Categories";
  this._yTitle = "Values";
  this._type = "line";

  this._seriesNameToFacetName = {};

  this.ctx = mljs.defaultconnection.createSearchContext();


  // TODO expose the below as configuration
  this.categoryOrdering = "month";
  this.categories = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  // internal properties
  this.series = new Array();

  this.errorPublisher = new com.marklogic.events.Publisher();

  this._updateOptions();

  this._refresh();
};

/**
 * Sets the search context for this widget
 *
 * @param {searchcontext} c - The searchcontext to link to
 */
com.marklogic.widgets.highcharts.prototype.setSearchContext = function(c) {
  this.ctx = c;
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.highcharts.getConfigurationDefinition = function() {
  return {

    title: {type: "string", default: "My Chart", title: "Chart Title", description: "Main chart title."},
    subtitle: {type: "string", default: "", title: "Chart Subtitle", description: "Chart Subtitle."},
    xTitle: {type: "string", default: "", title: "X Axis Title", description: "Category X Axis Title."},
    yTitle: {type: "string", default: "Values", title: "Y Axis Title", description: "Value Y Axis Title."},
    type: {type: "enum", default: "line",title: "Chart Type", description: "Which HighCharts chart to display",
      options: [
        {value: "line", title: "Line", description: "Line Chart"},
        {value: "spline", title: "Spline", description: "Spline Chart"},
        {value: "bar", title: "Bar", description: "Bar Chart"},
        {value: "area", title: "Area", description: "Area Chart"},
        {value: "column", title: "Column", description: "Column Chart"},
        {value: "pie", title: "Pie", description: "Pie Chart"}
        // TODO support stacking too
        // TODO support Hybrid charts
      ]},
    series: {type: "multiple", minimum: 1, default: [{
      nameSourceType: {value: "element"},
      nameSource: {value: "title"},
      autoCategories: {value: true},
      categorySourceType: {value: "element"},
      categorySource: {value: "category"},
      valueSourceType: {value: "element"},
      valueSource: {value: "value"},
      aggregateFunction: {value: "none"}
     }], title: "Data Series", description: "Data Series to show in the same chart",
      childDefinitions: {
        nameSourceType: {type: "enum", default: "element", title: "Name Source Type", description: "Where to get the Series name from",
          options: [
            {value: "element", title: "Element or JSON key", description: "XML Element value or JSON key value"},
            {value: "fixed", title: "Fixed value", description: "Fixed (Hardcoded) value"},
            {value: "facet", title: "Facet", description: "Facet value"}
          ]
        },
        nameSource: {type: "string", default: "title", title: "Name Source", description: "The element, JSON key, facet or hardcoded value to use to find the series name (dot delimited)."},
        autoCategories: {type: "boolean", default: true, title: "Auto Categories", description: "Whether to replace the default categories (month names) with values automatically calculated from the Category Source definition."},
        categorySourceType: {type: "enum", default: "element", title: "Category Source Type", description: "Where to get the Category from",
          options: [
            {value: "element", title: "Element or JSON key", description: "XML Element value or JSON key value"},
            {value: "facet", title: "Facet", description: "Facet value"}
          ]
        },
        categorySource: {type: "string", default: "category", title: "Category Source", description: "The element, JSON key or facet to group the results by (dot delimited)."},
        valueSourceType: {type: "enum", default: "element", title: "Value Source Type", description: "Where to get the Value from",
          options: [
            {value: "element", title: "Element or JSON key", description: "XML Element value or JSON key value"},
            {value: "facet", title: "Facet", description: "Facet value"}
          ]
        },
        valueSource: {type: "string", default: "value", title: "Value Source", description: "The element, JSON key or facet value to use for a data value (dot delimited)."},
        aggregateFunction: {type: "enum", default: "none", title: "Value Aggregation Function", description: "The client side aggregation function to use. E.g. if extracting value from a document's value. Should be set to 'none' for facet sourced values",
          options: [
            {value: "none", title: "None", description: "The value itself will be used"},
            {value: "count", title: "Count", description: "Use the count of the number of documents with this value"},
            {value: "mean", title: "Mean", description: "Use the mean average of all values"},
            {value: "sum", title: "Sum", description: "Use the sum of all values"},
            {value: "min", title: "Min", description: "Use the minimum value present"},
            {value: "max", title: "Max", description: "Use the maximum value present"}
          ]
        }
      }
    }
  }
  // TODO include facet name/value transform settings
  // TODO include facet settings (if applicable?)
  // TODO dataLabels enabled
  // TODO other internal HighCharts settings
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.highcharts.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    if (prop == "title" || prop == "subtitle" || prop == "xTitle" || prop == "yTitle" || prop == "type") {
      mljs.defaultconnection.logger.debug("Setting HighCharts options: " + prop + " to " + config[prop]);
      this["_" + prop] = config[prop];
    }
  }
  this._updateOptions();

  if (undefined != config && undefined != config.series && Array.isArray(config.series)) {

  for (var s = 0, max = config.series.length, series;s < max;s++) {
    // TODO handle multiple series rendering
    series = config.series[s];
    var name = "";
    var category = "";
    var values = "";
    switch (series.nameSourceType) {
      case "element":
        break;
      case "fixed":
        name = "#";
        break;
      case "facet":
        name = "!";
        break;
      default:
        break;
    }
    name += series.nameSource;
    switch (series.categorySourceType) {
      case "element":
        break;
      case "facet":
        category = "!";
        break;
      default:
        break;
    }
    category += series.categorySource;
    switch (series.valueSourceType) {
      case "element":
        break;
      case "facet":
        values = "!";
        break;
      default:
        break;
    }
    values += series.valueSource;

    mljs.defaultconnection.logger.debug("Series info: nameSource: " + name + ", categorySource: " + category + ", valueSource: " + values);

    this.setSeriesSources(name,category,values);
    this.aggregateFunction = series.aggregateFunction;
    this.autoCategories = series.autoCategories;

    // now execute type configuration
    this[config.type](); // no extra params by default
  }

} else {
  // show some intelligent message about no series defined
  this._title = "No series defined";
  this._subtitle = "Cannot render empty chart";
}

  // refresh display
  //this._refresh();
};

/**
 * Adds an error listener to this widget
 *
 * @param {function(error)} fl - The error listener to add
 */
com.marklogic.widgets.highcharts.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 *
 * @param {function(error)} fl - The error listener to remove
 */
com.marklogic.widgets.highcharts.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};

com.marklogic.widgets.highcharts.prototype._updateOptions = function() {
  var hc = this;
  this.options = {
    chart: {
        type: hc.type,
				renderTo : hc.container
            },
            title: {
                text: hc._title
            },
            subtitle: {
                text: hc._subtitle
            },
            xAxis: {
              categories: hc.categories,
              title: {
                text: hc._xTitle
              }
            },
            yAxis: {
                title: {
                    text: hc._yTitle
                }
            },
            tooltip: {
                enabled: true
            },
            plotOptions: {
                line: {

                    dataLabels: {
                        enabled: false
                    }/*,
                    enableMouseTracking: false*/
                }
            },
    series: this.series
  };
  this.line();
  /*
  if ("pie" == hc.options.chart.type) {
    this.options.tooltip.pointFormat = '<b>{point.y}</b>';
    console.log("I bet you any money this never gets invoked - always a 'line' chart at this point!!!");
  } else {
    mljs.defaultconnection.logger.debug("Chart using custom tooltip formatter");
    this.options.tooltip.formatter = function() {
      var str = '<b>'+ this.series.name +'</b><br/>';
      if (undefined != this.x) {
        str += this.x;
        str += ': ';
      }
      str += this.y;
      return str;
    };
  }*/

  mljs.defaultconnection.logger.debug("highcharts.prototype._updateOptions(): Options now: " + JSON.stringify(this.options));
};

com.marklogic.widgets.highcharts.prototype._selectCategory = function(facetName,facetValue) {
  //this.ctx.updateFacets([{name: facetName, value: facetValue}]);
  this.ctx.contributeFacet(facetName, facetValue);
};

/**
 * Specifies the client side aggregation function to apply to the search results (not the search facet results)
 *
 * @param {function} fn - The aggregate function to use. Should accept a results object
 */
com.marklogic.widgets.highcharts.prototype.setAggregateFunction = function(fn) {
  this.aggregateFunction = fn; // TODO sanity check value
};

com.marklogic.widgets.highcharts.prototype._refresh = function() {
  // draw data points

  mljs.defaultconnection.logger.debug("Options on refresh: " + JSON.stringify(this.options));

  //$("#" + this.container).highcharts(this.options);
  this.chart = new Highcharts.Chart(this.options);
};

/**
 * Specifies that the widget should automatically use the categories found in the search results.
 * Do not use this if you want to show a category with a '0' result even if it does not exist in search results.
 *
 * @param {boolean} bv - Whether to use automatic category mode (default is true)
 */
com.marklogic.widgets.highcharts.prototype.setAutoCategories = function(bv) {
  this.autoCategories = bv;
};

/**
 * Sets the JSON source in Parent.Child.Accessor format of where in the search result's content: JSON parameter to use for the Series name, category name and value
 *
 * @param {string} nameSource - The JSON path to use for the series name
 * @param {string} categorySource - The JSON path to use for the category name
 * @param {string} valueSource - The JSON path to use for values
 */
com.marklogic.widgets.highcharts.prototype.setSeriesSources = function(nameSource,categorySource,valueSource) {
  // TODO change this to addSeriesSource(nameSource,categorySource,valueSource,primaryAxis=true) - supports multiple series
  this.nameSource = nameSource;
  this.categorySource = categorySource;
  this.valueSource = valueSource;
};

/**
 * Sets the data context for this widget
 * @param {mljs.prototype.datacontext} datacontext - The data context to use
 */
com.marklogic.widgets.highcharts.prototype.setDataContext = function(dc) {
  this._dataContext = dc;
};

/**
 * Updates this widget based on Data Context data
 * @param {mljs.prototype.datacontext} datacontext - The data context with data
 */
com.marklogic.widgets.highcharts.prototype.updateData = function(datacontext) {

  var valSource = "";
  if (this.valueSource.startsWith("#") || this.valueSource.startsWith("!") ) {
    // hardcoded value
    valSource = this.valueSource.substring(1);
  } else {
    valSource = this.valueSource;
  }
  var seriesNames = new Array();
  var seriesCounts = {};
  var seriesVaues = {};
  var allCategories = new Array();

  var sn = datacontext.getSeriesNames();
  for (var s = 0,maxs = sn.length,seriesName;s < maxs;s++) {
    seriesName = sn[s];
    mljs.defaultconnection.logger.debug("highcharts.updateData: reading series: " + seriesName);

    seriesNames.push(seriesName); // TODO extract from data or specification
    seriesValues[seriesName] = new Array();
    seriesCounts[seriesName] = new Array();

    // make each series a layer
    var data = datacontext.getData(seriesName);
    // for each series, loop over data rows
    for (var r = 0,maxr = data.length,row;r < maxr;r++) {
      row = data[r];

      var category = row.identity;
      var value = row.fields[valSource];

      allCategories.push(category);
      var categoryValueArray = seriesValues[seriesName][category];
      if (undefined == categoryValueArray) {
        seriesValues[seriesName][category] = new Array();
        seriesCounts[seriesName][category] = 0;
      }
      seriesValues[seriesName][category].push(value);
      seriesCounts[seriesName][category] += 1;

    } // end data row for


  } // end series for

  this._displayResults(seriesNames,seriesCounts,seriesValues,allCategories);

};

/**
 * Updates the widget with the specified values JSON object. (top level element is "values-response").
 * See GET /v1/values
 *
 * @param {JSON} values - the values returned as a values response JSON object.
 */
com.marklogic.widgets.highcharts.prototype.updateValues = function(values) {
  if ("boolean" == typeof(values)) {
    return;
  }
  var seriesNames = new Array();
  var seriesCounts = {};
  var seriesVaues = {};
  var defName = "Co-occurrence";
  seriesNames.push(defName); // TODO extract from data or specification
  seriesValues[defName] = new Array();
  seriesCounts[defName] = new Array();
  var allCategories = new Array();

  if (undefined != values["values-response"] && undefined != values["values-response"].tuple) {

    // show data as a chart
    // TODO allow specification of category and value facets
    // get each tuple in order
    var tuplesOriginal = values["values-response"].tuple;
    //msort(tuplesOriginal,0,tuplesOriginal.length,"frequency"); // REQUIRES widgets.js. Sorts in place (doesn't return a new array)
    bubbleSort(tuplesOriginal,"frequency");
    var tuples = tuplesOriginal;
    for (var i = 0, t, category;i < tuples.length;i++) {
      t = tuples[i];
      category = "";
      // extract category name from tuple
      // TODO if specific, extract series name from tuple
      // else, show category name as field1, field2, fieldX
      for (var v = 0;v < t["distinct-value"].length;v++) {
        var val = t["distinct-value"][v];
        category += val["_value"];
        if (v != t["distinct-value"].length - 1) {
          category += ", ";
        }
      }
      // use value on Y axis - always numeric (count by default, also sum, avg, median, etc.)
      var value = t.frequency; // TODO validate name is same for avg, median, UDFs etc.

      allCategories.push(category);

      var categoryValueArray = seriesValues[defName][category];
      if (undefined == categoryValueArray) {
        seriesValues[defName][category] = new Array();
        seriesCounts[defName][category] = 0;
      }
      seriesValues[defName][category].push(value);
      seriesCounts[defName][category] += 1;
    }

  } else {
    // TODO show empty chart
  }

  this._displayResults(seriesNames,seriesCounts,seriesValues,allCategories);
};

/**
 * Event handler. Intended as a parameter for an addSubjectFactsListener.
 * Takes triple facts and extracts in to chart
 *
 * @param {object} facts - The MLJS result wrapper. result.doc.facts contains the sparql result returned in a JSON expression.
 */
com.marklogic.widgets.highcharts.prototype.updateSubjectFacts = function(facts) {
  if (false == facts || true == facts ) {
    // TODO show/hide refresh image based on value of this.results (true|false)
    return;
  }

  mljs.defaultconnection.logger.debug("in highcharts.updateSubjectFacts()");
  //mljs.defaultconnection.logger.debug(" - results: " + JSON.stringify(results));



  mljs.defaultconnection.logger.debug(" - looping over facts");
  for (var r = 0;r < facts.facts.bindings.length;r++) {
    var result = facts.facts.bindings[r];
    //mljs.defaultconnection.logger.debug(" - - result " + r + ": " + result);
    // get name value
    var name = "";
    var resdoc = jsonOrXml(result);
    //mljs.defaultconnection.logger.debug(" -  -  - resdoc: " + resdoc);
    //mljs.defaultconnection.logger.debug(" -  -  - this.nameSource: " + this.nameSource);
    //mljs.defaultconnection.logger.debug(" -  -  - startsWith defined?: " + (undefined != this.nameSource.startsWith));
    if (this.nameSource.startsWith("#")) {
      // hardcoded value
      name = this.nameSource.substring(1);
    } else {
      name = extractValue(resdoc,this.nameSource);
    }
    //mljs.defaultconnection.logger.debug(" -  -  - name: " + name);
    // get data value
    var value = extractValue(resdoc,this.valueSource);
    //mljs.defaultconnection.logger.debug(" -  -  - value: " + value);

    var category = extractValue(resdoc,this.categorySource);
    //mljs.defaultconnection.logger.debug(" -  -  - category: " + category);
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
    //mljs.defaultconnection.logger.debug(" -  - next...");
  }
  mljs.defaultconnection.logger.debug(" - finished looping over facts");

  this._displayResults(seriesNames,seriesCounts,seriesValues,allCategories);
};

/**
 * Event handler. Intended as a parameter for an addResultsListener method.
 *
 * @param {results} results - REST API JSON Results object, as from GET /v1/search
 */
com.marklogic.widgets.highcharts.prototype.updateResults = function(results) {
  mljs.defaultconnection.logger.debug("in highcharts.updateResults()");

  if (false == results || true == results ) {
    // TODO show/hide refresh image based on value of this.results (true|false)
    return;
  }

  mljs.defaultconnection.logger.debug(" - results: " + JSON.stringify(results));

  // go through each results and extract name and values, grouping by name
  var seriesNames = new Array();
  var seriesValues = new Array(); // name -> array(category) -> array(values)
  var seriesCounts = new Array(); // name -> array(category) -> count of values

  var allCategories = new Array();

  //if (undefined != results && undefined == results.results) {
  //  results = { results: results};
  //}

  if (this.categorySource.startsWith("!")) {
    mljs.defaultconnection.logger.debug("Loading series data from facet");
    this.aggregateFunction = "none";

    // Source name hardcoded, category name is facet, category value is facet name, and count is values
    var name = this.nameSource.substring(1);
    var facetName = this.categorySource.substring(1);
    mljs.defaultconnection.logger.debug(" - Facet title: " + name + ", facet name: " + facetName);
    seriesNames.push(facetName);

    var facetValues = results.facets[facetName].facetValues;
    seriesValues[facetName] = new Array();
    seriesCounts[facetName] = new Array();

    mljs.defaultconnection.logger.debug(" - Number of facet values: " + facetValues.length);
    for (var i = 0;i < facetValues.length;i++) {
      seriesValues[facetName][facetValues[i].name] = new Array();
      seriesValues[facetName][facetValues[i].name].push(facetValues[i].count);
      if (!allCategories.contains(facetValues[i].name)) {
        allCategories.push(facetValues[i].name);
      }
      seriesCounts[facetName][facetValues[i].name] = 1;
    }

  } else {


  mljs.defaultconnection.logger.debug(" - looping over results");
  for (var r = 0;r < results.results.length;r++) {
    var result = results.results[r].content;
    //mljs.defaultconnection.logger.debug(" - - result " + r + ": " + result);
    // get name value
    var name = "";
    var resdoc = jsonOrXml(result);
    //mljs.defaultconnection.logger.debug(" -  -  - resdoc: " + resdoc);
    //mljs.defaultconnection.logger.debug(" -  -  - this.nameSource: " + this.nameSource);
    //mljs.defaultconnection.logger.debug(" -  -  - startsWith defined?: " + (undefined != this.nameSource.startsWith));
    if (this.nameSource.startsWith("#")) {
      // hardcoded value
      name = this.nameSource.substring(1);
    } else {
      name = extractValue(resdoc,this.nameSource);
    }
    //mljs.defaultconnection.logger.debug(" -  -  - name: " + name);
    // get data value
    var value = extractValue(resdoc,this.valueSource);
    //mljs.defaultconnection.logger.debug(" -  -  - value: " + value);

    // series name (highcharts) to facet name (categorySource) mapping
    if (this.categorySource.startsWith("!")) {
      this._seriesNameToFacetName[name] = this.categorySource.substring(1); // assume facet
    } else {
      // assume from a value, and facet name is same as property name (json)
      this._seriesNameToFacetName[name] = this.categorySource;
    }

    var category = extractValue(resdoc,this.categorySource);
    //mljs.defaultconnection.logger.debug(" -  -  - category: " + category);
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
    //mljs.defaultconnection.logger.debug(" -  - next...");
  }
  mljs.defaultconnection.logger.debug(" - finished looping over results");

  } // end if is not facet value as category source

  this._displayResults(seriesNames,seriesCounts,seriesValues,allCategories);
};

com.marklogic.widgets.highcharts.prototype._displayResults = function(seriesNames,seriesCounts,seriesValues,allCategories) {

  if (this.autoCategories) {
    mljs.defaultconnection.logger.debug("updateResults(): Auto categories enabled");
    this.categories = allCategories;
    // TODO sort categories alphabetically
  }

  mljs.defaultconnection.logger.debug("Series names: " + JSON.stringify(seriesNames));
  mljs.defaultconnection.logger.debug("Series Values: " + JSON.stringify(seriesValues));

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
  var none = function(arr) {
    return arr[0];
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
  } else if ("none" == this.aggregateFunction) {
    func = none;
  }

  // now loop over names, categories, and create values array
  // allow order of categories to be specified (in future this could be automatic. E.g. if a whole number range such as age)
  var series = new Array();
  for (var n = 0;n < seriesNames.length;n++) {
    var name = seriesNames[n];
    // create new categories values arrays
    if ("pie" == this.options.chart.type) {
      var data = new Array();
      for (var p = 0;p < this.categories.length;p++) {
        /*
        var arr = new Array();
        arr.push(this.categories[p]);
        arr.push(seriesValues[name][this.categories[p]][0]);
        data.push(arr);
        */
        var json = {name: this.categories[p], y: seriesValues[name][this.categories[p]][0]};
        data.push(json);
      }

      series[n] = {type: "pie", name: name,data: data};
    } else {
      var orderedData = new Array();
      for (var p = 0;p < this.categories.length;p++) {
        orderedData[p] = func(seriesValues[name][this.categories[p]]);
      }
      series[n] = { name: name, data: orderedData};
    }
  }

  // now set chart's option's series values
  this.options.series = series;
  this.options.xAxis.categories = this.categories;

  this._refresh();
};

/**
 * Removes click handler from the points on a highchart. Only works before chart is refreshed with data.
 */
com.marklogic.widgets.highcharts.prototype.noclick = function() {
  this.options.plotOptions[this.options.chart.type].point.events.click = function() {};
  return this;
};

com.marklogic.widgets.highcharts.prototype._addPointClickHandler = function(charttype) {
  var self = this;
  this.options.plotOptions[charttype].point = {
    events: {
      click: function() {
        // this = data object
        var data = this.series.data[this.x].name;
        console.log("Point clicked: x:" + this.x + ", series name:'" + this.series.name + "', y:" + this.y, " data name: " + data);
        if (undefined == data) {
          // non pie chart
          data = this.category; // category axis => x value
          /*if (!self.autoCategories) {
            // translate to hard coded month category value
            var myd = null;
            for (var i = 0;i > self.categories.length;i++) {
              myd = self.categories[i];
              if (myd == data) {
                data = i;
              }
            }
          }*/
          self._selectCategory(self._seriesNameToFacetName[this.series.name],data);

        } else {
          // likely a pie chart
          self._selectCategory(this.series.name,data);
        }
      }
    }
  };
};





// CHAINING METHODS FOR HIGHCHARTS CONFIGURATION

// chart types

/**
 * Creates a line chart
 *
 * @param {json} extra_params_opt - Optional extra configuration parameters for plotOptions.charttype
 */
com.marklogic.widgets.highcharts.prototype.line = function(extra_params_opt) {
  this.options.chart.type = 'line';
  this._type = "line";

  this.options.plotOptions.line = {
    dataLabels: {
      enabled: false
    }/*,
    enableMouseTracking: false*/
  };
  /*
  this.options.tooltip.enabled = true;
  //this.options.tooltip.shared = true;

  this.options.tooltip.formatter = function() {
    return Highcharts.numberFormat(this.y,1);
  };
  */
  for (var n in extra_params_opt) {
    this.options.plotOptions.line[n] = extra_params_opt[n];
  }
  this._addPointClickHandler(this.options.chart.type);
  return this;
};

/**
 * Creates a spline chart
 *
 * @param {json} extra_params_opt - Optional extra configuration parameters for plotOptions.charttype
 */
com.marklogic.widgets.highcharts.prototype.spline = function(extra_params_opt) {
  this.options.chart.type = 'spline';
  this._type = "spline";
  this.options.plotOptions.line = undefined;
  this.options.plotOptions.spline = { dataLabels: { enabled: false }};
  for (var n in extra_params_opt) {
    this.options.plotOptions.spline[n] = extra_params_opt[n];
  }
  /*
  this.options.plotOptions.tooltip = {
    formatter: function() {
      return Highcharts.numberFormat(this.y,1);
    }
  };
  */
  this._addPointClickHandler(this.options.chart.type);
  return this;
};

/**
 * Creates a column chart
 *
 * @param {json} extra_params_opt - Optional extra configuration parameters for plotOptions.charttype
 */
com.marklogic.widgets.highcharts.prototype.column = function(extra_params_opt) {
  this.options.chart.type = "column";
  this._type = "column";
  this.options.plotOptions.line = undefined;
  this.options.plotOptions.column = {pointPadding: 0.2,borderWidth: 0, dataLabels: { enabled: true, style: { fontWeight: 'bold' } } };
  for (var n in extra_params_opt) {
    this.options.plotOptions.column[n] = extra_params_opt[n];
  }
  this._addPointClickHandler(this.options.chart.type);
  return this;
};

/**
 * Creates a pie chart
 *
 * @param {json} extra_params_opt - Optional extra configuration parameters for plotOptions.charttype
 */
com.marklogic.widgets.highcharts.prototype.pie = function(extra_params_opt) {
  this.options.chart.type = "pie";
  this.options.plotOptions.line = undefined;
  this.options.plotOptions.pie = {};
  for (var n in extra_params_opt) {
    this.options.plotOptions.pie[n] = extra_params_opt[n];
  }
  this._type = "pie";
  this._addPointClickHandler(this.options.chart.type);
  return this;
};

/**
 * Creates a bar chart
 *
 * @param {json} extra_params_opt - Optional extra configuration parameters for plotOptions.charttype
 */
com.marklogic.widgets.highcharts.prototype.bar = function(extra_params_opt) {
  this.options.chart.type = "bar";
  this.options.plotOptions.line = undefined;
  this.options.plotOptions.bar = {};
  for (var n in extra_params_opt) {
    this.options.plotOptions.bar[n] = extra_params_opt[n];
  }
  this._type = "bar";
  this._addPointClickHandler(this.options.chart.type);
  return this;
};

/**
 * Creates an area chart
 *
 * @param {json} extra_params_opt - Optional extra configuration parameters for plotOptions.charttype
 */
com.marklogic.widgets.highcharts.prototype.area = function(extra_params_opt) {
  this.options.chart.type = "area";
  this._type = "area";
  this.options.plotOptions.line = undefined;
  this.options.plotOptions.area = {};
  for (var n in extra_params_opt) {
    this.options.plotOptions.area[n] = extra_params_opt[n];
  }
  this._addPointClickHandler(this.options.chart.type);
  return this;
};

// chart parameters

/**
 * Enables crosshairs on the x and y axes
 */
com.marklogic.widgets.highcharts.prototype.crosshairs = function() {
  this.options.tooltip.crosshairs = [true,true]; //xaxis,yaxis
  return this;
};

/**
 * Disables the chart legend
 */
com.marklogic.widgets.highcharts.prototype.nolegend = function() {
  this.legend(false);
};

/**
 * Whether to enable or disable a legednd. Enabled by default below the chart
 *
 * @param {boolean} enabled - Enable the legend?
 */
com.marklogic.widgets.highcharts.prototype.legend = function(enabled) {
  if (undefined == enabled) {
    enabled = true;
  }
  if (enabled) {
    this.options.legend.enabled = true;
  } else {
    this.options.legend.enabled = false;
  }
};

/**
 * Inverts the X and Y axes
 */
com.marklogic.widgets.highcharts.prototype.inverted = function() {
  this.options.chart.inverted = true;
  return this;
};

/**
 * Produces a stacked chart
 */
com.marklogic.widgets.highcharts.prototype.stacked = function() {
  this.options.plotOptions.series = {stacking: 'normal'};
  return this;
};

/**
 * Sets highcharts stack label configuration
 *
 * @param {json} stackLabels - High charts stack label json configuration
 */
com.marklogic.widgets.highcharts.prototype.stackLabels = function(stackLabels) {
  this.options.yAxis.stackLabels = stackLabels;
  return this;
};


/**
 * Sets the chart title
 *
 * @param {string} title - The chart title
 */
com.marklogic.widgets.highcharts.prototype.title = function(title) {
  this.options.title.text = title;
  this._title = title;
  return this;
};

/**
 * Sets the chart subtitle
 *
 * @param {string} subtitle - The chart subtitle
 */
com.marklogic.widgets.highcharts.prototype.subtitle = function(subtitle) {
  this.options.subtitle.text = subtitle;
  this._subtitle = subtitle;
  return this;
};

/**
 * Sets the chart's y Axis title
 *
 * @param {string} yTitle - The chart y axis title
 */
com.marklogic.widgets.highcharts.prototype.yTitle = function(yTitle) {
  this.options.yAxis.title.text = yTitle;
  this._yTitle = yTitle;
  return this;
};

/**
 * Sets the chart's x Axis title
 *
 * @param {string} xTitle - The chart x axis title
 */
com.marklogic.widgets.highcharts.prototype.xTitle = function(xTitle) {
  this.options.xAxis.title.text = xTitle;
  this._xTitle = xTitle;
  return this;
};
