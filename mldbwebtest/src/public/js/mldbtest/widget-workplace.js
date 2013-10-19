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
 * A virtual page, or workplace, with dynamically set out areas
 *
 * @constructor
 * @param {string} container - The HTML ID of the element to place this widget's content within.
 */
com.marklogic.widgets.workplace = function(container) {
  this.container = container;
  
  this._editable = false;
  
  this._contexts = new Array(); // contextname => contextObject instance
  
  this._init();
};

com.marklogic.widgets.workplace.prototype._init = function() {
  // TODO create editable div container at bottom of document, hidden
};

com.marklogic.widgets.workplace.prototype.editable = function(editme) {
  if (undefined == editme) {
    this._editable = true;
    return;
  }
  this._editable = editme;
  
  // TODO show editable div within page, minimised
};

com.marklogic.widgets.workplace.prototype.loadPage = function(jsonOrString) {
  var json = jsonOrString; // TODO lookup json config if nothing or path specified
  
  // load top level layout for this page (or panel we are managing, at least)
  mljs.defaultconnection.logger.debug("Creating layout");
  var layout = new (com.marklogic.widgets.layouts[json.layout])(this.container);
  
  // generate named areas for widgets to be contained
  mljs.defaultconnection.logger.debug("Creating zones");
  layout.createZones(json.assignments);
  
  var widgets = new Array(); // widgetid => wgt instance
  
  // initialise widgets in these areas
  mljs.defaultconnection.logger.debug("Creating widget instances");
  for (var w = 0, max = json.widgets.length,widget;w < max;w++) {
    widget = json.widgets[w];
    mljs.defaultconnection.logger.debug("Creating widget: " + w + " with: " + JSON.stringify(widget));
    var wgt = this._createWidget(widget.type,layout.getElementId(widget.widget),widget.config);
    mljs.defaultconnection.logger.debug("Create widget has returned");
    widgets[widget.widget] = wgt;
  }
  
  var contexts = new Array(); // contextid => context object
  
  // create management contexts from connection object
  mljs.defaultconnection.logger.debug("Creating contexts");
  for (var c = 0, max = json.contexts.length,ctx;c < max;c++) {
    ctx = json.contexts[c];
    mljs.defaultconnection.logger.debug("Context: " + c + " is " + JSON.stringify(ctx));
    
    var creator = mljs.defaultconnection["create" + ctx.type];
    mljs.defaultconnection.logger.debug("Is creator function of type function?: " + (typeof creator));
    var inst = creator.call(mljs.defaultconnection);
    contexts[ctx.context] = inst;
    mljs.defaultconnection.logger.debug("Is context instance valid?: is object?: " + (typeof inst));
    
    // initialise context configuration
    mljs.defaultconnection.logger.debug("Config: " + JSON.stringify(ctx.config));
    mljs.defaultconnection.logger.debug("Context Obj: " + JSON.stringify(inst));
    if (undefined != inst.setConfiguration && undefined != ctx.config) {
      mljs.defaultconnection.logger.debug("Setting context configuration");
      inst.setConfiguration(ctx.config);
    }
    
    // register widgets with contexts
    for (var wid = 0, widmax = ctx.register.length,widgetid;wid < widmax;wid++) {
      widgetid = ctx.register[wid];
      mljs.defaultconnection.logger.debug("registering widget: " + wid + " to " + widgetid);
      inst.register(widgets[widgetid]);
    }
  }
  
  this._contexts = contexts;
  
  // call onload actions in order
  if (undefined != json.actions && undefined != json.actions.onload) {
    mljs.defaultconnection.logger.debug("Processing onload actions");
    for (var a = 0, max = json.actions.onload.length,action;a < max;a++) {
      action = json.actions.onload[a];
      mljs.defaultconnection.logger.debug("Processing onload action: " + JSON.stringify(action));
      var actionObject = new(com.marklogic.widgets.actions[action.type])();
      mljs.defaultconnection.logger.debug("Got instance. Calling setConfiguration()...");
      actionObject.setConfiguration(action.config);
      mljs.defaultconnection.logger.debug("Finished configuring. Caling execute(this)...");
      var result = actionObject.execute(this);
      mljs.defaultconnection.logger.debug("Got result: " + JSON.stringify(result));
      // TODO do something with result
    }
    mljs.defaultconnection.logger.debug("COMPLETE processing onload actions");
  }
  
  mljs.defaultconnection.logger.debug("finished loading page");
};

com.marklogic.widgets.workplace.prototype.getContextObject = function(name) {
  return this._contexts[name];
};

com.marklogic.widgets.workplace.prototype._createWidget = function(type,elementid,config) {
  mljs.defaultconnection.logger.debug("Creating widget: " + type + " in " + elementid + " with config: " + JSON.stringify(config));
  var wobj = com;
  var splits = type.split(".");
  for (var i = 1, max = splits.length,split;i < max;i++) {
    split = splits[i];
    wobj = wobj[split];
    mljs.defaultconnection.logger.debug("split: " + split + " has type: " + (typeof wobj) + " and value: " + JSON.stringify(wobj));
  }
  mljs.defaultconnection.logger.debug("instantiating widget: " + JSON.stringify(wobj));
  var wgt = new wobj(elementid);
  
  mljs.defaultconnection.logger.debug("has widget instance been created? type is object?: " + (typeof wgt));
  
  
  // apply config to object
  if (undefined !== wgt.setConfiguration) { // backwards compatibility - widget may not have configuration
    wgt.setConfiguration(config);
  }
  
  return wgt;
};







// LAYOUTS

// thinthick layout
com.marklogic.widgets.layouts = {};
com.marklogic.widgets.layouts.thinthick = function(container) {
  this.container = container;
  
  this.assignments = new Array(); // [widgetid] => assignment json, with elementid for element linked to
  
  this._init();
};

com.marklogic.widgets.layouts.thinthick.prototype._init = function() {
  var s = "<div id='" + this.container + "-layout' class='container_12 mljswidget layout thinthick'>";
  s += "<div id='" + this.container + "-A' class='grid_4 thinthick-thin'></div>";
  s += "<div id='" + this.container + "-B' class='grid_8 thinthick-thick'></div>";
  s += "</div>";
  document.getElementById(this.container).innerHTML = s;
};

com.marklogic.widgets.layouts.thinthick.prototype.createZones = function(assignments) {
  mljs.defaultconnection.logger.debug("Creating zones in thinthick layout");
  // group by zones, order by order
  var zones = new Array();
  zones["A"] = new Array();
  zones["B"] = new Array();
  
  for (var i = 0, max = assignments.length,ass;i < max;i++) {
    mljs.defaultconnection.logger.debug("createZones: i: " + i); 
    ass = assignments[i];
    mljs.defaultconnection.logger.debug("createZones: i: " + i + " has ass: " + JSON.stringify(ass));
    zones[ass.zone][ass.order] = ass;
  }
  
  // do zone A then zone B
  this._genZones("A",zones["A"]);
  this._genZones("B",zones["B"]);
  
};

com.marklogic.widgets.layouts.thinthick.prototype.getElementId = function(widgetid) {
  mljs.defaultconnection.logger.debug("thinthick: getElementId: for widgetid: " + widgetid);
  var elid = this.assignments[widgetid].elementid;
  mljs.defaultconnection.logger.debug("thinthick: getElementId: widgetid: " + widgetid + " => " + elid);
  return elid;
};

com.marklogic.widgets.layouts.thinthick.prototype._genZones = function(zone,arr) {
  mljs.defaultconnection.logger.debug("thinthick: _genZones: " + zone + " with array: " + JSON.stringify(arr));
  var s = "";
  for (var i = 1, max = arr.length, ass;i < max;i++) {
    mljs.defaultconnection.logger.debug("_genZones: zone: " + zone + " index: " + i); 
    ass = arr[i];
    mljs.defaultconnection.logger.debug("_genZones: zone: " + zone + " has ass: " + JSON.stringify(ass));
    if (undefined != ass) {
      var id = this.container + "-" + zone + "-" + i;
      ass.elementid = id;
      this.assignments[ass.widget] = ass;
      s += "<div id='" + id + "'></div>";
    }
  }
  document.getElementById(this.container + "-" + zone).innerHTML = s;
};











// ACTIONS
com.marklogic.widgets.actions = {};
com.marklogic.widgets.actions.javascript = function() {
  this._config = {
    targetObject: null,
    methodName: null,
    parameters: []
  };
};

com.marklogic.widgets.actions.javascript.getConfigurationDefinition = function() {
  // TODO config definition
};

com.marklogic.widgets.actions.javascript.prototype.setConfiguration = function(config) {
  this._config = config;
};

com.marklogic.widgets.actions.javascript.prototype.execute = function(executionContext) {
  if ((null == this._config.targetObject) || (null == this._config.methodName)) {
    return {executed: false, details: "targetObject or methodName are null"};
  }
  var obj = executionContext.getContextObject(this._config.targetObject);
  mljs.defaultconnection.logger.debug("Got target object?: " + obj);
  mljs.defaultconnection.logger.debug("Fetching method name: " + this._config.methodName);
  var func = (obj[this._config.methodName]);
  mljs.defaultconnection.logger.debug("Got target object function: " + func);
  var result = func.call(obj); // TODO support parameters
  return {executed:true, result: result, details: "Method executed successfully"};
};

