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
 * @constructor
 * @param {string} container - The HTML ID of the element to place this widget's content within.
 */
com.marklogic.widgets.kratu = function(container) {
  this.container = container;
  this.errorPublisher = new com.marklogic.events.Publisher(); 
  
  this.results = null;
  this.facts = null;
  this.kratu = new Kratu();
  this.kratu.setRenderElement( document.getElementById(this.container) );
  
  this.render = "content"; // summary = top level ML search info, content = raw document info
  
  this._refresh();
};

/**
 * Specifies what to render within the search results.
 * summary = the search result summary. E.g. URI, score, etc.
 * content = the JSON content (default)
 * 
 * @param {string} render - What to render from the search result information
 */
com.marklogic.widgets.kratu.prototype.render = function(render) {
  this.render = render;
};

/**
 * Event target. Can be used with addResultsListener
 * 
 * @param {JSON} results - The REST API JSON results object to display. See GET /v1/search
 */
com.marklogic.widgets.kratu.prototype.updateResults = function(results) {
  this.results = results;
  
  if ("content" == this.render) {
    var content = new Array();
    for (var i = 0;i < this.results.results.length;i++) {
      content.push(this.results.results[i].content);
    }
    this.kratu.setEntities(content);
  } else {
    this.kratu.setEntities(this.results.results);
  }
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