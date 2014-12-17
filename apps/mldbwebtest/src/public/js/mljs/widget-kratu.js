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
 * A wrapper for the Google Kratu tabular data exploration widget
 *
 * @constructor
 * @param {string} container - The HTML ID of the element to place this widget's content within.
 */
com.marklogic.widgets.kratu = function(container) {
  this.container = container;
  this.errorPublisher = new com.marklogic.events.Publisher();

  this.results = null;
  this.facts = null;
  this.kratu = new Kratu();
  document.getElementById(container).innerHTML = "<div id='" + container + "-inner' class='mljswidget'></div>"
  this.kratu.setRenderElement( document.getElementById(this.container + "-inner") );

  this._config = {
    render: "content" // summary = top level ML search info, content = raw document info
  };

  this._refresh();
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.kratu.getConfigurationDefinition = function() {
  var self = this;
  return {
    render: {type:"enum", default: "content", title: "Render", description: "Whether to render the document content or the search result summary.",
      options: [
        {value: "content", title: "Content", description: "Content of the result document."},
        {value: "summary", title: "Summary", description: "Summary of the search result metadata."}
      ]
    }
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.kratu.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }

  this._refresh();
};

/**
 * Specifies what to render within the search results.
 * summary = the search result summary. E.g. URI, score, etc.
 * content = the JSON, csv or XML content - determined automatically from REST API results
 *
 * @param {string} render - What to render from the search result information. "content|properties"
 */
com.marklogic.widgets.kratu.prototype.render = function(render) {
  this._config.render = render;
};

/**
 * Event target. Can be used with addResultsListener
 *
 * @param {JSON} results - The REST API JSON results object to display. See GET /v1/search. Could include CSV, XML or JSON content (even mixed results too!).
 */
com.marklogic.widgets.kratu.prototype.updateResults = function(results) {
  mljs.defaultconnection.logger.debug("kratu.updateResults called");
  if (typeof (results) != "boolean" && undefined != results && null != results) {
    mljs.defaultconnection.logger.debug("kratu.updateResults: Got real results");
    this.results = results;

    if ("content" == this._config.render) {
      mljs.defaultconnection.logger.debug("kratu.updateResults: Rendering search result contents");
      var content = new Array();
      for (var i = 0,r;i < this.results.results.length;i++) {
        r = this.results.results[i];
        mljs.defaultconnection.logger.debug("kratu.updateResults: Parsing result " + i + "=" + r.content);
        if (typeof(r.content) == "string") {
          // support csv text, json, xml text
          try {
            var res = JSON.parse(this.results.results[i].content);
            content.push(res);
          } catch (ex) {
            // must be text. Try CSV parsing
            var csvProvider = new KratuCSVProvider();
            var self = this;
            csvProvider.parse(this.results.results[i].content, function (csvdata) {
              mljs.defaultconnection.logger.debug("kratu.updateResults: parsed CSV data: " + csvdata);
              res = csvdata;
              content.push(csvdata);
              self.kratu.setEntities(content);
              self._refresh();
            });
          }
        } else if (typeof(r.content) == "object") {
          // xml or JSON
          if (undefined != r.content.nodeType) {
            // support XML object
            var json = xmlToJson(r.content); // MLJS Core utility library - Kratu has no XML provider!!!
            content.push(json);
          } else {
            content.push(r.content);
          }
        }
      }
      this.kratu.setEntities(content);
    } else {
      mljs.defaultconnection.logger.debug("kratu.updateResults: Rendering search result statistics");
      this.kratu.setEntities(this.results.results);
    }
    this._refresh();
  }
};


/**
 * Updates this widget based on Data Context data
 * @param {mljs.prototype.datacontext} datacontext - The data context with data
 */
com.marklogic.widgets.kratu.prototype.updateData = function(datacontext) {

  var kratuData = new Array();

  var sn = datacontext.getSeriesNames();
  for (var s = 0,maxs = sn.length,seriesName;s < maxs;s++) {
    seriesName = sn[s];

    // make each series a layer
    var data = datacontext.getData(seriesName);
    // for each series, loop over data rows
    for (var r = 0,maxr = data.length,row,kratuRow;r < maxr;r++) {
      row = data[r];
      kratuRow = {};
      kratuRow.series = seriesName;
      kratuRow.identity = row.identity;
      for (var f in row.fields) {
        kratuRow[f] = row.fields[f];
      }

      kratuData.push(kratuRow);
    } // end data row for


  } // end series for

  this.kratu.setEntities(kratuData);
  this._refresh();

};

/**
 * Draw sparql facts results as a table
 *
 * @param {JSON} facts - the response from the REST API (W3C SPARQL Protocol) sparql endpoint, passed usually by the semanticcontext
 */
com.marklogic.widgets.kratu.prototype.updateFacts = function(facts) {
  this.facts = facts;

  // build simpler JSON results object - rows
  var rows = new Array();
  for (var r = 0, max = facts.results.bindings.length;r < max;r++) {
    var result = facts.results.bindings[r];
    var res = {};
    // one for each binding
    for (var b = 0, maxb = facts.head.vars.length;b < maxb;b++) {
      var varname = facts.head.vars[b];
      res[varname] = result[varname].value;
    }
    rows.push(res);
  }

  // show in Kratu
  this.kratu.setEntities(rows);
  this._refresh();
};

/**
 * Adds an error listener to this widget
 *
 * @param {function(error)} fl - The error listener to add
 */
com.marklogic.widgets.kratu.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 *
 * @param {function(error)} fl - The error listener to remove
 */
com.marklogic.widgets.kratu.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};

com.marklogic.widgets.kratu.prototype._refresh = function() {
  if ( (null == this.results || undefined == this.results || "boolean" == typeof this.results) && (null == this.facts || undefined == this.facts || "boolean" == typeof this.facts)) {
    return; // draw nothing
  }
  this.kratu.renderReport();
};
