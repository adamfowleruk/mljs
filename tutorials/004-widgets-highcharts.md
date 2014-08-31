[Back to All Tutorials list](all.md)
# HighCharts

MarkLogic comes with the JavaScript HighCharts widget library free of charge for use with MarkLogic based applications. This
includes applications using MLJS as the intermediary layer. MLJS comes with a thin highcharts wrapper helper class in
the widget-highcharts.js file.

This widget supports the full range of High Charts options. So far Line, Column, Spline, Bar, stacked column, stacked bar,
area, stacked area, and Pie charts have been extensively tested. (See the highcharts page in the sample application for
an example of each).

As with all other widgets that react to search results, this widget includes an updateResults method. To link this widget
to a search context call searchcontext.register(chartwidget) once for your chart widget instance. Note that for
some source modes you will either need to enable facets on your search options or RAW result documents mode (as opposed
to snippeting). Read below for more details.

## Source information modes

When you define a chart you specify where MLJS should find the data from. In most cases this will be aggregations
calculated as facet values by MarkLogic. To do this for your own data you call this method:-

```javascript
wgt.setSeriesSources("#Family","!family");
```

This tells the widget that the series name is hardcoded (because of the # wildcard) to 'Family' and that the category
information and values should be automatically loaded from the family facet (because of the ! wildcard).

There are some instances, however, where you want to pull back the documents and extract the value directly from the
document. You may also perform some sort of manual aggregation over the result set. In this case you can do the
following:-

```javascript
wgt.setSeriesSources("#Animals","animal","animal");
wgt.setAggregateFunction("count");
```

In the above example we're still hard coding a single series called 'Animals' but we are extracting the XML or JSON
category name 'animal' and counting the number of results (hence also passing 'animal' as a values source).

WARNING: Your JSON options document MUST have a page size greater than the total result set for you to receive
accurate aggregations using in-document values. If the page size is set to the default 10, for example, then the
aggregations will only be ran on the first 10 documents. Note you must also be in search options RAW result mode.

This can be extended to create several series automatically. Effectively this works like a group by in sql but in chart
form. This can be seen in the following example:-

```javascript
  var tempcolumn = new com.marklogic.widgets.highcharts("tempcolumn");
  tempcolumn.addErrorListener(error.updateError);
  tempcolumn.addErrorListener(error.updateError);
  tempcolumn.setSeriesSources("city","month","reading.temp");
  tempcolumn.column({pointPadding: 0.2,borderWidth: 0}).title("Column: City temperature means").subtitle("Degrees C").yTitle("C");
```

Here you see that a series is created per city returned in the result document. These are then split in to month
categories. This category set is automatically resolved by the highcharts widget to short months. E.g. Jan, Feb etc.
Note the value is from the temp property in the child reading JSON object of each result JSON document. (Note: XML
support is included which basically turns each . in to a / in XPath, and adds a leading /).

WARNING: Your JSON options document MUST have a page size greater than the total result set for you to receive
accurate aggregations using in-document values. If the page size is set to the default 10, for example, then the
aggregations will only be ran on the first 10 documents. Note you must also be in search options RAW result mode.

As you can also see from the above example, you can access the highcharts options JSON object directly to specify low
level information. This means that the widget should be adaptable to any HighChart configuration available.

## Workplace support

All the above series options are now visually configurable in the MLJS Workplace widget.

- - - -

[Back to All Tutorials list](all.md)
