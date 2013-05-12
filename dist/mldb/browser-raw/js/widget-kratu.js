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
  
  this.results = null;
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
 * @param {results} results - The REST API JSON results object to display. See GET /v1/search
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

com.marklogic.widgets.kratu.prototype._refresh = function() {
  if (null == this.results || undefined == this.results || "boolean" == this.results) {
    return; // draw nothing
  }
  this.kratu.renderReport();
};