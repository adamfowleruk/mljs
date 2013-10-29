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
  
  this.title = "Co-occurence";
  
  this.values = null;
  
  this._refresh();
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
 * Updates the widget with the specified values JSON object. (top level element is "values-response"). 
 * See GET /v1/values
 * 
 * @param {JSON} values - the values returned as a values response JSON object.
 */
com.marklogic.widgets.cooccurence.prototype.updateValues = function(values) {
  this.values = values;
  
  this._refresh();
};

com.marklogic.widgets.cooccurence.prototype._refresh = function() {
  // Sample: {"values-response":{"name":"actor-genre", "tuple":[
  // {"frequency":8, "distinct-value":[{"type":"xs:string", "_value":"Jim Carrey"},{"type":"xs:string", "_value":"Comedy"}]},
  // {"frequency":1, "distinct-value":[{"type":"xs:string", "_value":"Sean Astin"},{"type":"xs:string", "_value":"Adventure"}]},
  // {"frequency":4, "distinct-value":[{"type":"xs:string", "_value":"Sean Astin"},{"type":"xs:string", "_value":"Comedy"}]},
  // {"frequency":4, "distinct-value":[{"type":"xs:string", "_value":"Sean Astin"},{"type":"xs:string", "_value":"Fantasy"}]}  ], 
  // "metrics":{"values-resolution-time":"PT0.153351S", "total-time":"PT0.174207S"}}}
  if (null == this.values || undefined == typeof this.values) {
    return; // draw nothing
  }
  var str = "<div class='cooccurence-title'>" + this.title + "</div>";
  if (undefined != this.values["values-response"] && undefined != this.values["values-response"].tuple) {
    var tuplesOriginal = this.values["values-response"].tuple;
    //msort(tuplesOriginal,0,tuplesOriginal.length,"frequency"); // REQUIRES widgets.js. Sorts in place (doesn't return a new array)
    bubbleSort(tuplesOriginal,"frequency");
    var tuples = tuplesOriginal;
    for (var i = 0;i < tuples.length;i++) {
      str += "<div class='cooccurence-values'>";
      var t = tuples[i];
      for (var v = 0;v < t["distinct-value"].length;v++) {
        var val = t["distinct-value"][v];
        str += "<span class='cooccurence-value'>" + val["_value"] + "</span>";
        if (v != t["distinct-value"].length - 1) {
          str += ", ";
        }
      }
      // now show frequency
      str += " <span class='cooccurence-count'>(" + t.frequency + ")</span></div>";
    }
  }
  document.getElementById(this.container).innerHTML = str;
};