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
 * Displays co-occurence results from a searches values list, ordered by inverse score.
 * @constructor
 * @param {string} container - The HTML ID of the element to place this widget within.
 */
com.marklogic.widgets.cooccurence = function(container) {
  this.container = container;
  this.errorPublisher = new com.marklogic.events.Publisher();
  this.selectionPublisher = new com.marklogic.events.Publisher();

  this._config = {
    title: "Co-occurence",
    displayTuple: null
  };

  this.values = null;

  this.constraintArray = null;

  this._refresh();
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.cooccurence.getConfigurationDefinition = function() {
  var self = this;
  return {
    title: {type: "string", default: "Co-occurence", title: "Title",description: "Title for this widget."},
    displayTuple: {type: "string", default: null, title: "Display Tuple",description: "Tuple name to display."}
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.cooccurence.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }

  this._refresh();
};

/**
 * Specifies that this widget should only display a named tuple result, not any tuple to come back from an updateValues call
 *
 * @param {string} tuplename - The name of the tuple to only respond to
 */
com.marklogic.widgets.cooccurence.prototype.displayTuple = function(tuplename) {
  this._config.displayTuple = tuplename;
};

/**
 * Adds an error listener to this widget
 *
 * @param {function(error)} fl - The error listener to add
 */
com.marklogic.widgets.cooccurence.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 *
 * @param {function(error)} fl - The error listener to remove
 */
com.marklogic.widgets.cooccurence.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};

/**
 * Adds a facet selection listener to this widget
 *
 * @param {function(error)} fl - The facet selection listener to add
 */
com.marklogic.widgets.cooccurence.prototype.addFacetSelectionListener = function(fl) {
  this.selectionPublisher.subscribe(fl);
};

/**
 * Removes a facet selection listener
 *
 * @param {function(error)} fl - The facet selection listener to remove
 */
com.marklogic.widgets.cooccurence.prototype.removeFacetSelectionListener = function(fl) {
  this.selectionPublisher.unsubscribe(fl);
};

/**
 * Updates the widget with the specified values JSON object. (top level element is "values-response").
 * See GET /v1/values
 *
 * @param {JSON} values - the values returned as a values response JSON object.
 */
com.marklogic.widgets.cooccurence.prototype.updateValues = function(values) {
  if ("boolean" == typeof(values)) {
    return;
  }
  if (null == this._config.displayTuple || (undefined != values["values-response"] && this._config.displayTuple == values["values-response"].name)) {
    this.values = values;

    this._refresh();
  }
};

com.marklogic.widgets.cooccurence.prototype._refresh = function() {
  mljs.defaultconnection.logger.debug("cooccurence.refresh");
  // Sample: {"values-response":{"name":"actor-genre", "tuple":[
  // {"frequency":8, "distinct-value":[{"type":"xs:string", "_value":"Jim Carrey"},{"type":"xs:string", "_value":"Comedy"}]},
  // {"frequency":1, "distinct-value":[{"type":"xs:string", "_value":"Sean Astin"},{"type":"xs:string", "_value":"Adventure"}]},
  // {"frequency":4, "distinct-value":[{"type":"xs:string", "_value":"Sean Astin"},{"type":"xs:string", "_value":"Comedy"}]},
  // {"frequency":4, "distinct-value":[{"type":"xs:string", "_value":"Sean Astin"},{"type":"xs:string", "_value":"Fantasy"}]}  ],
  // "metrics":{"values-resolution-time":"PT0.153351S", "total-time":"PT0.174207S"}}}
  if (null == this.values || undefined == typeof this.values) {
    return; // draw nothing
  }
  mljs.defaultconnection.logger.debug("cooccurence.refresh: got results");
  var str = "<div class='mljswidget panel panel-info'>";
  str += "<div class='panel-heading cooccurence-title'>" + this._config.title + "</div>";
  str += "<div class='panel-body cooccurence-content'>";
  var tuples = null;
  if (undefined != this.values["values-response"] && undefined != this.values["values-response"].tuple) {
    var tuplesOriginal = this.values["values-response"].tuple;
    //msort(tuplesOriginal,0,tuplesOriginal.length,"frequency"); // REQUIRES widgets.js. Sorts in place (doesn't return a new array)
    bubbleSort(tuplesOriginal,"frequency");
    tuples = tuplesOriginal;
    for (var i = 0;i < tuples.length;i++) {
      str += "<div class='cooccurence-values'>";
      var t = tuples[i];
      for (var v = 0;v < t["distinct-value"].length;v++) {
        var val = t["distinct-value"][v];
        str += "<span class='cooccurence-value' id='" + this.container + "-tuple-" + i + "-value-" + v + "'>" + val["_value"] + "</span>";
        if (v != t["distinct-value"].length - 1) {
          str += ", ";
        }
      }
      // now show frequency
      str += " <span class='badge cooccurence-count'>" + t.frequency + "</span></div>";
    }
  }
  str += "</div></div>";
  document.getElementById(this.container).innerHTML = str;

  // add click handlers
  var addHandler = function(el,val,i,v) {

        el.onclick = function (e) {
          mljs.defaultconnection.logger.debug("cooccurence.refresh: facet selected: " + self.constraintArray[v] + "=" + val["_value"]);
          self._select(self.constraintArray[v],val["_value"]);
          e.stopPropagation();
          return false;
        };
  };
  mljs.defaultconnection.logger.debug("cooccurence.refresh: checking for click handler support");
  var self = this;
  if (null != this.constraintArray) {
  if (undefined != this.values["values-response"] && undefined != this.values["values-response"].tuple) {
    mljs.defaultconnection.logger.debug("cooccurence.refresh: Got constraint array. Adding click handlers");
    for (var i = 0;i < tuples.length;i++) {
      mljs.defaultconnection.logger.debug("cooccurence.refresh: tuple: " + i);
      var t = tuples[i];
      for (var v = 0;v < t["distinct-value"].length;v++) {
        mljs.defaultconnection.logger.debug("cooccurence.refresh: value: " + v);
        var val = t["distinct-value"][v];
        var el = document.getElementById(this.container + "-tuple-" + i + "-value-" + v);
        mljs.defaultconnection.logger.debug("cooccurence.refresh: Adding click handler");
        addHandler(el,val,i,v);
      }
    }
  }
  }
};

/**
 * Sets the names of the constraints in the right order to display and use to restrict queries on upon selection.
 *
 * @param {Array} constraintArray - The ordered names of constraints
 */
com.marklogic.widgets.cooccurence.prototype.setTupleConstraints = function(constraintArray) {
  this.constraintArray = constraintArray;
};

com.marklogic.widgets.cooccurence.prototype._select = function(facet,value) {
  // fire selection event
  var sel = {name: facet,value: value};

  // fire event to handlers
  this.selectionPublisher.publish([sel]);
};
