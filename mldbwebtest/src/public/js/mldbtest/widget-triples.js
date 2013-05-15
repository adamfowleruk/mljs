// global variable definitions
com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};

/**
 * An interactive Sparql query builder
 * 
 * @constructor
 * @param {string} container - The HTML ID of the element to place this widget's content within.
 */
com.marklogic.widgets.sparqlbar = function(container) {
  this.container = container;
  
};

com.marklogic.widgets.sparqlbar.prototype._refresh = function() {
  var s = "";
  s += "<div id='" + this.container + "-sparqlbar' class='sparqlbar'>";
  // what to retrieve
  s += "  <div>Search for: ";
  s += "    <select>";
  s += "      <option selected='selected' value='all'>All Entities</option>";
  for (var i = 0;i < this._entities.length;i++) {
    s += "    <option value='" + this._entities[i].name + "'>" + this.entities.name + "</option>";
  }
  s += "</select>";
  
  // criteria
  //  - predicate list
  //  - interactive IRI suggestion list (base on what searching for and predicate value selected)
  // include general 'has a relationship with type'
  
  s += "</div>";
  document.getElementById(this.container).innerHTML = s;
};