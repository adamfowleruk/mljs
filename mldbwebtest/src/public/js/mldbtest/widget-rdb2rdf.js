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
 * A widget that performs a W3C RDB2RDF Direct mapping. This is a wizard that steps you through the ingestion process.
 * 
 * NB Requires the rdb2rdf.xqy REST API resource extension supported by mljs.sam* methods
 * 
 * @constructor
 * @param {string} container - The HTML ID of the element to place this widget's content within.
 */
com.marklogic.widgets.rdb2rdf = function(container) {
  this.container = container;
  
  this._refresh();
};

com.marklogic.widgets.rdb2rdf.prototype._refresh = function() {
  // perform initial HTML drawing
  var s = "";
  
  // tab bar - feel free to replace with a widget of your choice (preferably not a large library required like jQuery)
  s += "<div class='rdb2rdf-tabs'>";
  s += "  <span class='rdb2rdf-tab' id='" + this.container + "-step-1-tab' class='rdb2rdf-tab-selected'>Step 1. Specify database connection</span>";
  s += "  <span class='rdb2rdf-tab' id='" + this.container + "-step-2-tab'>Step 2. Select Schema &gt;&nbsp;&gt;&nbsp;&nbsp;&nbsp;</span>";
  s += "  <span class='rdb2rdf-tab' id='" + this.container + "-step-3-tab'>Step 3. Select tables &gt;&nbsp;&gt;&nbsp;&nbsp;&nbsp;</span>";
  s += "  <span class='rdb2rdf-tab' id='" + this.container + "-step-4-tab'>Step 4. Perform import &gt;&nbsp;&gt;&nbsp;&nbsp;&nbsp;</span>";
  s += "  <span class='rdb2rdf-tab' id='" + this.container + "-complete'>Complete</span>";
  s += "</div>";
  
  s += "<div class='rdb2rdf-steps'>";
  
  // Step panes
  s += "<div id='" + this.container + "-step-1'>"; // intro / enter SAM URL
  s += "  <p>Welcome to the MarkLogic RDBMS to RDF import wizard! Please enter a MarkLogic SAM endpoint URL that is connected to your database server.";
  s += "  <p><b>ML SAM URL:</b> <input size='100' type='text' id='" + this.container + "-mlsam' value='' /></p>";
  s += "  <p class='rdb2rdf-submit' id='" + this.container + "-step-1-next'>Next...</p>";
  s += "</div>";
  
  s += "<div id='" + this.container + "-step-2' class='hidden'>"; // list and select schema to import
  s += "  <p>Select a Schema to import and click Next.</p>";
  s += "  <p><select id='" + this.container + "-schema-select'><option value=''>None</option></select></p>";
  s += "  <p class='rdb2rdf-submit' id='" + this.container + "-step-2-next'>Next...</p>";
  s += "</div>";
  
  
  s += "<div id='" + this.container + "-step-3' class='hidden'>"; // list tables and relationships with metrics (row count), and select which tables to import (relationships are automatically added)
  
  s += "</div>";
  
  
  s += "<div id='" + this.container + "-step-4' class='hidden'>"; // Perform the import sequence, table by table, 100 rows at a time, showing a progress bar widget, or even better a list where green ticks appear when each step is done. NB steps must be done in order
  
  s += "</div></div>";
  
  document.getElementById(this.container).innerHTML = s; // single hit for DOM performance
  
  // Add onclick handlers as appropriate
  var self = this;
  document.getElementById(this.container + "-step-1-next").onclick = function(e) {self._processStep1();e.stopPropagation();return false;};
  
  document.getElementById(this.container + "-step-1-tab").onclick = function(e) {self._showStep1();e.stopPropagation();return false;};
  document.getElementById(this.container + "-step-2-tab").onclick = function(e) {self._showStep2();e.stopPropagation();return false;};
  document.getElementById(this.container + "-step-3-tab").onclick = function(e) {self._showStep3();e.stopPropagation();return false;};
  document.getElementById(this.container + "-step-4-tab").onclick = function(e) {self._showStep4();e.stopPropagation();return false;};
};

com.marklogic.widgets.rdb2rdf.prototype._processStep1 = function() {
  // do nothing now, just show step 2
  this._showStep2();
};

com.marklogic.widgets.rdb2rdf.prototype._showStep1 = function() {
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-1"),false);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-2"),true);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-3"),true);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-4"),true);
};

com.marklogic.widgets.rdb2rdf.prototype._showStep2 = function() {
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-1"),true);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-2"),false);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-3"),true);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-4"),true);
  
  // refresh schema list
  var self = this;
  mljs.defaultconnection.samListSchema(document.getElementById(this.container + "-mlsam").value,function(result) {
    var schemas = result.doc["list-schema"].schema;
    var s = "";
    for (var i = 0, max = schemas.length;i < max;i++) {
      s += "<option value='" + schemas[i] + "'>" + schemas[i] + "</option>";
    }
    document.getElementById(self.container + "-schema-select").innerHTML = s;
  });
};

com.marklogic.widgets.rdb2rdf.prototype._showStep3 = function() {
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-1"),true);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-2"),true);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-3"),false);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-4"),true);
  
  // TODO step 3 display actions
};

com.marklogic.widgets.rdb2rdf.prototype._showStep4 = function() {
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-1"),true);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-2"),true);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-3"),true);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-4"),false);
  
  // TODO step 4 display actions
};


  


