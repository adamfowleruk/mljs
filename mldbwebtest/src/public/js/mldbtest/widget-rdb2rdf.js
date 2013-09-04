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


com.marklogic.widgets.rdb2rdf.prototype._highlightTab = function(tabId) {
  // remove highlight of currently selected tab 
  var currentHighlightSpan = $("#highlightedTab")
  var priorTabText = currentHighlightSpan.text();
  currentHighlightSpan.parent().html(priorTabText);
  
 // add highlight to newTab
  var tab = $("#" + tabId);
  var tabText = tab.text();
  tab.html("<span id='highlightedTab' class='label label-success'>" + tabText + "</span>")
};


com.marklogic.widgets.rdb2rdf.prototype._refresh = function() {
  // perform initial HTML drawing
  var s = "";
  
  // tab bar - feel free to replace with a widget of your choice (preferably not a large library required like jQuery)
  
  s += "<div class='row'>";
  s += "  <div class='row'>";     
  s += "    <div class='col-md-10 col-md-offset-1'>";  
  s += "      <ol class='rdb2rdf-tabs breadcrumb'>";
  s += "        <li class='rdb2rdf-tab' id='" + this.container + "-step-1-tab' class='rdb2rdf-tab-selected active'><span id='highlightedTab' class='label label-success'>Specify database connection</span></li>";
  s += "        <li class='rdb2rdf-tab' id='" + this.container + "-step-2-tab'>Select Schema</li>";
  s += "        <li class='rdb2rdf-tab' id='" + this.container + "-step-3-tab'>Select RDB Objects</li>";
  s += "        <li class='rdb2rdf-tab' id='" + this.container + "-step-4-tab'>Perform import</li>";
  s += "        <li class='rdb2rdf-tab' id='" + this.container + "-complete'>Complete</li>";
  s += "      </ol>";
  s += "    </div>";
  s += "  </div>";  
  s += "</div>";
  
  s += "<div class='rdb2rdf-steps row'>";
  
  // Step panes
  
  // ----- content for step 1
    
  s += "<div id='" + this.container + "-step-1' class='col-md-10 col-md-offset-1'>"; // intro / enter SAM URL
  s += " <p class='lead row'>Please enter a MarkLogic SAM endpoint URL that is connected to your database server...</p>";

  s += " <form role='form'>";
  s += "   <div class='form-group row'>";
  s += "     <div class='row'>";
  s += "       <label for='" + this.container + "-mlsam' class='col-md-9 control-label'>MarkLogic SAM URL:</label>";
  s += "     </div>";  
  s += "     <div class='row'>";
  s += "       <div class='col-md-9'>";    
  s += "         <input type='url' class='form-control' id='" + this.container + "-mlsam' placeholder='MarkLogic SAM URL...'>";
  s += "       </div>";
  s += "     </div>";
  s += "   </div>";
  s += "   <div class='form-group row'>";
  s += "     <div class='row'>"; 
  s += "       <div class='col-md-4'>";
  s += "         <button type='submit' id='" + this.container + "-step-1-next' class='btn btn-primary'>Next &rarr;</button>";
  s += "       </div>";
  s += "     </div>";  
  s += "   </div>";
  s += " </form>";
  s += "</div>";
 
  // ------ content for step 2
  s += "<div id='" + this.container + "-step-2' class='hidden col-md-10 col-md-offset-1'>"; // list and select schema to import
  s += "  <p class='lead row'>Select a Database Schema to import ...</p>";
  s += " <form role='form'>";
  s += "   <div class='form-group row'>";
  s += "     <div class='row'>"; 
  s += "       <label for='" + this.container + "-schema-select' class='col-md-9 control-label'>Available Database Schemas:</label>";
  s += "     </div>";
  s += "     <div class='row'>"; 
  s += "       <div class='col-md-9'>";
  s += "         <select class='form-control' id='" + this.container + "-schema-select'>";
  s += "           <option value=''>Loading ...</option>";    
  s += "         </select>";
  s += "       </div>";
  s += "     </div>";  
  s += "   </div>";
  s += "   <div class='form-group row'>";
  s += "     <div class='row'>";   
  s += "       <div class='col-md-4'>";
  s += "         <button type='submit' id='" + this.container + "-step-2-next' class='btn btn-primary'>Next &rarr;</button>";
  s += "       </div>";
  s += "     </div>";  
  s += "   </div>";
  s += " </form>";
  s += "</div>";

  // -------- content for step 3
  s += "<div id='" + this.container + "-step-3' class='hidden col-md-10 col-md-offset-1'>"; // list and select schema to import
  s += " <p class='lead row lead-smaller'>Specify the name of the graph and select one or more tables and relationships in Schema <strong class='selected-schema'>&nbsp;</strong> ...</p>";
  s += " <form role='form'>";
  s += "   <div class='form-group row'>";
  s += "     <div class='row'>";  
  s += "       <label for='" + this.container + "-named-graph' class='col-md-9 control-label'>Named Graph:</label>";
  s += "     </div>";
  s += "     <div class='row'>";  
  s += "       <div class='col-lg-2'>";
  s += "         <input type='text' class='form-control col-md-6' id='" + this.container + "-named-graph' placeholder='Named Graph...'>";
  s += "       </div>";
  s += "     </div>";  
  s += "   </div>";  
  s += "   <div class='form-group row'>";
  s += "     <div class='row'>";  
  s += "       <label for='" + this.container + "-table-select' class='col-md-9 control-label'>Tables in schema <strong class='selected-schema'>&nbsp;</strong></label>";
  s += "     </div>";
  s += "     <div class='row'>";  
  s += "       <div class='col-md-9'>";
  s += "         <select multiple='true' size='6' class='form-control' id='" + this.container + "-table-select'>";
  s += "           <option value=''>Loading...</option>";    
  s += "         </select>";
  s += "       </div>";
  s += "     </div>";
  s += "   </div>";
  s += "   <div class='form-group row'>";
  s += "     <div class='row'>";  
  s += "       <label for='" + this.container + "-relationship-select' class='col-md-9 control-label'>Relationships in schema <strong class='selected-schema'>&nbsp;</strong></label>";
  s += "     </div>";
  s += "     <div class='row'>";   
  s += "       <div class='col-md-9'>";
  s += "         <select multiple='true' size='6' class='form-control' id='" + this.container + "-relationship-select'>";
  s += "           <option value=''>Loading...</option>";    
  s += "         </select>";
  s += "       </div>";
  s += "     </div>";
  s += "   </div>";  
  s += "   <div class='form-group row'>";
  s += "     <div class='row'>";   
  s += "       <div class='col-md-4'>";
  s += "         <button type='submit' id='" + this.container + "-step-3-next' class='btn btn-primary'>Perform Import</button>";
  s += "       </div>";
  s += "     </div>";
  s += "   </div>";
  s += " </form>";
  s += "</div>";  
    
//------ content for step 4  
//Perform the import sequence, table by table, 100 rows at a time, showing a progress bar widget, or even better a list where green ticks appear when each step is done. NB steps must be done in order  
  s += "<div id='" + this.container + "-step-4' class='hidden col-md-9 col-md-offset-1'>"; // list and select schema to import
  s += "  <p class='lead row'>Processing the import ...</p>";

  s += " <form role='form'>";
  s += "   <div class='row'>";
  s += "     <div class='row'>"; 
  s += "       <label for='" + this.container + "-schema-import-tables' class='col-md-9 control-label'>Selected tables:</label>";
  s += "     </div>";
  s += "     <div>";
  s += "        <ul class='list-group col-md-9' id='" + this.container + "-schema-import-tables'>";
  s += "        </ul>";
  s += "     </div>";  
  s += "   </div>";
  s += "   <div class='form-group row'>";
  s += "     <div class='row'>";   
  s += "       <div class='col-md-4'>";
  s += "         <button type='submit' id='" + this.container + "-step-2-next' class='btn btn-primary'>Close</button>";
  s += "       </div>";
  s += "     </div>";  
  s += "   </div>";
  s += " </form>";
  s += "</div></div>";
  
  document.getElementById(this.container).innerHTML = s; // single hit for DOM performance
  
  // Add onclick handlers as appropriate
  var self = this;
  document.getElementById(this.container + "-step-1-next").onclick = function(e) {self._processStep1();e.stopPropagation();return false;};
  document.getElementById(this.container + "-step-2-next").onclick = function(e) {self._processStep2();e.stopPropagation();return false;};
  document.getElementById(this.container + "-step-3-next").onclick = function(e) {self._processStep3();e.stopPropagation();return false;};
  
  document.getElementById(this.container + "-step-1-tab").onclick = function(e) {self._showStep1();e.stopPropagation();return false;};
  document.getElementById(this.container + "-step-2-tab").onclick = function(e) {self._showStep2();e.stopPropagation();return false;};
  document.getElementById(this.container + "-step-3-tab").onclick = function(e) {self._showStep3();e.stopPropagation();return false;};
  document.getElementById(this.container + "-step-4-tab").onclick = function(e) {self._showStep4();e.stopPropagation();return false;};
};


// processStepX function defines the actions when StepX in the wizard is submitted

com.marklogic.widgets.rdb2rdf.prototype._processStep1 = function() {
  // change the selected tab  
  this._highlightTab(this.container + "-step-2-tab");
	
  this._showStep2();
};

com.marklogic.widgets.rdb2rdf.prototype._processStep2 = function() {
  // change the selected tab  
  this._highlightTab(this.container + "-step-3-tab");
		
  this._showStep3();
};


com.marklogic.widgets.rdb2rdf.prototype._processStep3 = function() {
	  // change the selected tab  
	  this._highlightTab(this.container + "-step-4-tab");
			
	  this._showStep4();
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

  console.log("show step 3");
  
  var self = this;
  var mlsamUrl = $("#" + this.container + "-mlsam").val();
  var schemaName = $("#" + this.container + "-schema-select").val();
  $(".selected-schema").html(schemaName);
  
  mljs.defaultconnection.samSchemaInfo(mlsamUrl,schemaName,function(result) {
	    var tables = result.doc["schema-info"].table;
	    var s = "";
	    for (var i = 0, max = tables.length;i < max;i++) {
	      console.log(tables[i].name);
	      s += "<option selected='true' value='" + tables[i].name + "'>" + tables[i].name + "</option>";
	    }
	    document.getElementById(self.container + "-table-select").innerHTML = s;

	    var relationships = result.doc["schema-info"].relationship;
	    s = "";
	    for (var i = 0, max = relationships.length;i < max;i++) {
	      console.log(relationships[i].constraint);
	      s += "<option value='" + relationships[i].constraint + "'>" + relationships[i].constraint + "</option>";
	    }
	    document.getElementById(self.container + "-relationship-select").innerHTML = s;
  });

  
  
};

com.marklogic.widgets.rdb2rdf.prototype._showStep4 = function() {
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-1"),true);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-2"),true);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-3"),true);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-step-4"),false);
  
  var graphName = $("#" + this.container + "-named-graph").val();
  var samUrl = $("#" + this.container + "-mlsam").val();
  var tableNameList = [];
  var ulElemSelector = "#" + this.container + "-schema-import-tables";
  var selectId = this.container + "-table-select";  
  $("#" + selectId + " option").each(function() {
	  tableNameList.push($(this).val());
	  $(ulElemSelector).append("<li id='" + $(this).val() + "' class='list-group-item'>" + $(this).val() + "</li>");
  });
  console.log(tableNameList);
  console.log(graphName);
  console.log(samUrl);
   
  var config =   
  {
    "ingest": {
	  "database": {
	    "samurl": samUrl
	  },
	  "create": {
	    "graph": graphName
	  },
	  "selection": {
	    "mode": "data", // Creates interdependencies between tables
	    "tables": tableNameList, offset: 1, limit: 100
	  }
	}
  };  
  
  /*
    var saveCount = 0;
    var nextSave0 = function() {
      if (saveCount == alloptions.length) {
        complete0();
      } else {
        db.saveSearchOptions(alloptions[saveCount],alloptions[saveCount + 1], function(result) { // REPLACE WITH CALL TO RDB2RDF
          saveCount+=2;
          nextSave0();
        });
      }
    };
  
    var complete0 = function() {
      log("- Done.");
      // SHOW 'FINISHED' HERE
    };
   */
  
	  
	  
	  
  // TODO step 4 display actions
};


  


