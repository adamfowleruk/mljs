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
  
  this._workplaceContext = new com.marklogic.widgets.workplacecontext();
  this._workplaceContext.register(this);
  
  this._init();
};

com.marklogic.widgets.workplace.prototype._init = function() {
  // create two divs, one transparent in front of the other. When hover over top right, show an edit button if editable.
  var str = "<div id='" + this.container + "-container' class='workplace-container'>";
  str += " <div id='" + this.container + "-layout'></div>";
  str += " <div id='" + this.container + "-mask' class='workplace-mask'>";
  str += "  <div class='workplace-mask-icon' ><img id='" + this.container + "-link' src='/images/mljs/setting-small.png' title='Edit this Workplace' class='workplace-edit-link' /></div>";
  str += " </div>";
  str += "</div>";
  document.getElementById(this.container).innerHTML = str;
  
  // add click event handler
  var self = this;
  document.getElementById(this.container + "-link").onclick = function(evt) {
    com.marklogic.widgets.workplaceadmin.renderFullscreen(self._workplaceContext);
  };
};

com.marklogic.widgets.workplace.prototype.editable = function(editme) {
  if (undefined == editme) {
    editme = true;
  }
  this._editable = editme;
  
  // show editable div within page
  if (this._editable) {
    document.getElementById(this.container + "-mask").style.display = "block";
  } else {
    document.getElementById(this.container + "-mask").style.display = "none";
  }
};

com.marklogic.widgets.workplace.prototype.loadPage = function(jsonOrString) {
  this._workplaceContext.loadPage(jsonOrString);
};

com.marklogic.widgets.workplace.prototype.updateWorkplace = function(context) {
  //var json = jsonOrString; // TODO lookup json config if nothing or path specified
  
  var json = this._workplaceContext.getJson();
  
  // load top level layout for this page (or panel we are managing, at least)
  mljs.defaultconnection.logger.debug("Creating layout");
  var layout = new (com.marklogic.widgets.layouts[json.layout])(this.container + "-layout");
  
  // generate named areas for widgets to be contained
  mljs.defaultconnection.logger.debug("Creating zones");
  layout.createZones(json.assignments);
  
  var widgets = new Array(); // widgetid => wgt instance
  
  // initialise widgets in these areas
  mljs.defaultconnection.logger.debug("Creating widget instances");
  for (var w = 0, max = json.widgets.length,widget;w < max;w++) {
    widget = json.widgets[w];
    mljs.defaultconnection.logger.debug("Creating widget: " + w + " with: " + JSON.stringify(widget));
    var wgt = this._createWidget(widget.type,layout.getElementID(widget.widget),widget.config);
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

com.marklogic.widgets.workplace._getWidgetClass = function(type) {
  var wobj = com;
  var splits = type.split(".");
  for (var i = 1, max = splits.length,split;i < max;i++) {
    split = splits[i];
    wobj = wobj[split];
    //mljs.defaultconnection.logger.debug("workplace._getWidgetClass: split: " + split + " has type: " + (typeof wobj) + " and value: " + JSON.stringify(wobj));
  }
  //mljs.defaultconnection.logger.debug("workplace._getWidgetClass: returning: " + wobj);
  return wobj;
};

com.marklogic.widgets.workplace.prototype._createWidget = function(type,elementid,config) {
  mljs.defaultconnection.logger.debug("workplace._createWidget: Creating widget: " + type + " in " + elementid + " with config: " + JSON.stringify(config));
  
  var wobj = com.marklogic.widgets.workplace._getWidgetClass(type);
  
  mljs.defaultconnection.logger.debug("workplace._createWidget: instantiating widget: " + JSON.stringify(wobj));
  var wgt = new wobj(elementid);
  
  mljs.defaultconnection.logger.debug("workplace._createWidget: has widget instance been created? type is object?: " + (typeof wgt));
  
  
  // apply config to object
  if (undefined !== wgt.setConfiguration) { // backwards compatibility - widget may not have configuration
    wgt.setConfiguration(config);
  }
  
  return wgt;
};







// LAYOUTS

// thinthick layout
com.marklogic.widgets.layouts = {};
com.marklogic.widgets.layouts.helper = {};
/**
 * Helper function to prune admin widgets out of a layout. Used to generate saveable position data for workplace pages
 */
com.marklogic.widgets.layouts.helper.prune = function(assignmentArray) {
  // assume if widget name has a leading underscore, it's an admin widget. E.g. _dropzone1234
  // keep track of lastValidPosition 1 based
  // loop through assignments
  // if widget is valid, give it lastValidPosition as order, and add to new array, increment lastValidOrder
  // otherwise, do nothing
  // return new valid array
  // DO NOT alter assignments in the original array passed in as an argument
};

com.marklogic.widgets.layouts.helper.extendLayout = function(layoutInstance,container,zones) {
  // mixin generic parameters and functions
  var self = layoutInstance;
  self.container = container;
  self.assignments = new Array();
  self.zones = {};
  self.zoneNames = zones;
  for (var i = 0, max = zones.length, zone;i < max;i++) {
    zone = zones[i];
    self.zones[zone] = new Array();
  }
  self._nextID = 1;
  
  self.assignments = new Array(); // [widgetname] => assignment json, with elementid for element linked to
  
  self.getZoneList = function() {
    return self.zoneNames;
  };
  self.createZones = function(assignments) {
    mljs.defaultconnection.logger.debug("Creating zones in thinthick layout");
    // group by zones, order by order
    
    if (undefined != assignments) {
      for (var i = 0, max = assignments.length,ass;i < max;i++) {
        mljs.defaultconnection.logger.debug("layout<class>.createZones: i: " + i); 
        ass = assignments[i];
        mljs.defaultconnection.logger.debug("layout<class>.createZones: i: " + i + " has ass: " + JSON.stringify(ass));
        self.zones[ass.zone][ass.order] = ass;
      }
    }
    
    // do zone A then zone B
    for (var zone in self.zones) {
      self._genZones(zone, self.zones[zone]);
    }
  }; // REQUIRES instance._genZones() function
  
  self._getZone = function(zone) {
    var z = self.zones[zone];
    if (undefined == z) {
      z = [];
      self.zones[zone] = z;
    }
    return z;
  };
  
  /**
   * Returns the widget assignment JSON
   * @private
   */
  self._elementAt = function(zone,index) {
    return self.zones[zone][index];
  };
  self._getWidget = function(widgetName) {
    for (var zone in self.zones) {
      var widgets = self.zones[zone];
      for (var i = 1, max = widgets.length, wgt;i < max;i++) {
        wgt = widgets[i];
        if (wgt.widget == widgetName) {
          return wgt;
        }
      }
    }
    return null;
  };
  self.generateAssignments = function() {
    // export assignments we've been managing
    // DO NOT prune - this is done by the caller only (E.g. using the prune() helper method)
  };
  self.getElementID = function(widgetid) {
    mljs.defaultconnection.logger.debug("layout<class>: getElementID: for widgetid: " + widgetid);
    var elid = self.assignments[widgetid].elementid;
    mljs.defaultconnection.logger.debug("layout<class>: getElementID: widgetid: " + widgetid + " => " + elid);
    return elid;
  };
  self.appendToZone = function(widgetName,zone,html) {
    var idnum = self._nextID++;
    var id = self.container + "-" + zone + "-" + idnum;
    var z = self._getZone(zone);
    var placeAt = z.length;
    if (0 == placeAt) {
      placeAt = 1;
    }
    var wgt = {widget: widgetName, zone: zone, order: placeAt, elementid: id};
    z[placeAt] = wgt;
    self._appendZone(zone,id,html);
    return wgt;
  };
  self._genZones = function(zone,arr) {
    mljs.defaultconnection.logger.debug("layout<class>._genZones: " + zone + " with array: " + JSON.stringify(arr));
    var s = "";
    for (var i = 1, max = arr.length, ass;i < max;i++) {
      mljs.defaultconnection.logger.debug("layout<class>._genZones: zone: " + zone + " index: " + i); 
      ass = arr[i];
      s += self._ass(zone,ass);
    }
    self._replaceZone(zone,s);
  };
  self._replaceZone = function(zone,html) {
    if (undefined != self._replaceZoneOverride) {
      self._replaceZoneOverride(zone,html);
    } else {
      document.getElementById(self.container + "-" + zone).innerHTML = html;
    }
  };
  self._ass = function(zone,ass) {
    mljs.defaultconnection.logger.debug("layout<class>._ass: zone: " + zone + " has ass: " + JSON.stringify(ass));
    if (undefined != ass) {
      var id = self.container + "-" + zone + "-" + self._nextID++;
      ass.elementid = id;
      self.assignments[ass.widget] = ass;
      var z = self._getZone(zone);
      ass.order = z.length;
      var placeAt = z.length;
      if (0 == placeAt) {
        placeAt = 1;
      }
      z[placeAt] = ass;
      return self._wrapAssignment(zone,ass,id,"<div id='" + id + "'></div>");
    }
    return "";
  };
  self._wrapAssignment = function(zone,ass,id,html) {
    if (undefined != self._wrapAssignmentOverride) {
      self._wrapAssignmentOverride(zone,ass,id,html);
    } else {
      // by default just return same html - no special wrapper for layout
      return html;
    }
  };
  self.generateId = function(zone,ass) {
    var s = self._ass(zone,ass); // ass = {widget: widgetName, ... } - adds elementid to ass
    self._appendZone(zone,null,s); // null as _ass generates a parent div with the elementid specified anyway
  };
  self._appendZone = function(zone,id,html) {
    if (undefined != self._appendZoneOverride) {
      self._appendZoneOverride(zone,id,html);
    } else {
      //document.getElementById(this.container + "-" + zone).innerHTML += html; // TODO STOP THIS KILLING EVENT HANDLERS
      
      var zoneel = document.getElementById(self.container + "-" + zone);
      var div = document.createElement("div");
      if (null != id) {
        div.id = id;
      }
      div.innerHTML = html;
      zoneel.appendChild(div);
    }
  };
  // TODO make this not dependant upon spacers as per workplaceadmin
  self.moveToPosition = function(widgetName,newZone,newIndexOneBased) {
    // get element currently at position
    mljs.defaultconnection.logger.debug("layout<subclass>.moveToPosition: Entered");
    var wgt = self._elementAt(newZone,newIndexOneBased);
    
    mljs.defaultconnection.logger.debug("layout<subclass>.moveToPosition: Got Widget at target position. Moving those afterwards");
    var z = self._getZone(newZone);
    if (null != wgt) {
      // if not empty, increment order on all widgets at and after position
      for (var w = z.length - 1, min = newIndexOneBased, moveme;w >= min;w--) {
        moveme = z[w];
        moveme.order++;
        z[w+2] = moveme; // plus 2 because we're moving the spacer too
      }
    }
    mljs.defaultconnection.logger.debug("layout<subclass>.moveToPosition: Getting widget to move");
    var me = self._getWidget(widgetName);
    var spacer = self._elementAt(me.zone,me.order);
    var oldZone = me.zone;
    var oldOrder = me.order;
    me.order = newIndexOneBased + 1;
    me.zone = newZone;
    spacer.order = newIndexOneBased;
    spacer.zone = newZone;
    // place widget at required position
    z[newIndexOneBased] = me; // assumes new index is valid
    
    mljs.defaultconnection.logger.debug("layout<subclass>.moveToPosition: Moving (decrementing order) widgets passed original position");
    // decrement order's after this element's position - if oldzone, or newzone this is valid
    //if (newZone != oldZone) {
    z = self._getZone(oldZone);
    for (var w = oldOrder + 1, max = z.length, moveme;w < max;w++) {
      moveme = z[w];
      moveme.order--;
      z[w-2] = moveme; // minus 2 because we'll move the spacer too
    }
    //}
    
    mljs.defaultconnection.logger.debug("layout<subclass>.moveToPosition: Moving HTML element");
    // ACTUALLY MOVE THE DAMNED HTML!!!
    self._moveElementToPosition(me,spacer,wgt);
    
    mljs.defaultconnection.logger.debug("layout<subclass>.moveToPosition: Ended");
  };
  self._moveElementToPosition = function(me,spacer,wgt) {
    mljs.defaultconnection.logger.debug("layout<subclass>._moveElementToPosition: Entered");
    if (undefined != self._moveElementToPositionOverride) {
      mljs.defaultconnection.logger.debug("layout<subclass>._moveElementToPosition: Caling override");
      self._moveElementToPositionOverride(me,spacer,wgt);
    } else {
      mljs.defaultconnection.logger.debug("layout<subclass>._moveElementToPosition: Moving element position");
      var movingel = document.getElementById(me.elementid);
      var currentel = document.getElementById(wgt.elementid);
      mljs.defaultconnection.logger.debug("layout<subclass>._moveElementToPosition: movingelid: " + me.elementid + ", currentelid: " + wgt.elementid);
      currentel.parentNode.insertBefore(movingel,currentel);
      if (null != spacer) { // future proofing
        mljs.defaultconnection.logger.debug("layout<subclass>._moveElementToPosition: Moving spacer with html elid: " + spacer.elementid);
        var spacerel = document.getElementById(spacer.elementid);
        currentel.parentNode.insertBefore(spacerel,movingel);
      }
    }
    mljs.defaultconnection.logger.debug("layout<subclass>._moveElementToPosition: Ended");
  };
};








com.marklogic.widgets.layouts.thinthick = function(container) {
  com.marklogic.widgets.layouts.helper.extendLayout(this,container,["A","B"]);
  
  this._init();
};

com.marklogic.widgets.layouts.thinthick.prototype._init = function() {
  var s = "<div id='" + this.container + "-layout' class='container_12 mljswidget layout thinthick'>";
  s += "<div id='" + this.container + "-A' class='grid_4 thinthick-thin'></div>";
  s += "<div id='" + this.container + "-B' class='grid_8 thinthick-thick'></div>";
  s += "</div>";
  document.getElementById(this.container).innerHTML = s;
};







com.marklogic.widgets.layouts.thickthin = function(container) {
  com.marklogic.widgets.layouts.helper.extendLayout(this,container,["A","B"]);
  
  this._init();
};

com.marklogic.widgets.layouts.thickthin.prototype._init = function() {
  var s = "<div id='" + this.container + "-layout' class='container_12 mljswidget layout thickthin'>";
  s += "<div id='" + this.container + "-A' class='grid_8 thickthin-thick'></div>";
  s += "<div id='" + this.container + "-B' class='grid_4 thickthin-thin'></div>";
  s += "</div>";
  document.getElementById(this.container).innerHTML = s;
};









com.marklogic.widgets.layouts.column = function(container) {
  com.marklogic.widgets.layouts.helper.extendLayout(this,container,["A"]);
  
  this._init();
};

com.marklogic.widgets.layouts.column.prototype._init = function() {
  var s = "<div id='" + this.container + "-layout' class='container_12 mljswidget layout column'>";
  s += "<div id='" + this.container + "-A' class='column'></div>";
  s += "</div>";
  document.getElementById(this.container).innerHTML = s;
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









/**
 * Acts as a co-ordinating context for a single MLJS Workplace Page configuration
 * 
 * @constructor
 */
com.marklogic.widgets.workplacecontext = function() {
  this._json = {
    shared: false,
    widgets: [], assignments: [], contexts: [], actions: {
      onload: [], onunload: []
    },
    layout: "thinthick",
    title: "New Workplace",
    urls: []
  };
  this._lastSaved = this._json;
  this._uri = null;
  
  this.db = mljs.defaultconnection;
  
  this._instanceNames = {}; // [shortname] -> next available instance id or null
  
  this.updatePublisher = new com.marklogic.events.Publisher(); // page loaded from server
};

/**
 * Resets the list of widgets, their configuration, and their assignments. Used by the Workplace Admin widget.
 */
com.marklogic.widgets.workplacecontext.prototype.resetWidgetConfig = function() {
  this._json.widgets = [];
  this._json.assignments = [];
};

/**
 * Returns the next instance name for a class. E.g. com.marklogic.widgets.searchbar may return searchbar2
 */
com.marklogic.widgets.workplacecontext.prototype.nextWidgetName = function(classname) {
  // get last . character
  var classString = classname.split(".").pop(); // TODO check this works on all browsers
  
  var next = this._instanceNames[classString];
  if (undefined == next) {
    next = 1;
    this._instanceNames[classString] = 2;
  }
  return classString + next;
};

com.marklogic.widgets.workplacecontext.prototype._addWidgetName = function(shortname) {
  // extract numeric from end
  var matches = shortname.match(/\d+$/);
  if (matches) {
    // correct
    var number = matches[0];
    var endPos = shortname.indexOf(number);
    var classString = shortname.substring(0,endPos);
    number = parseInt(number, 10);
    
    var next = this._instanceNames[classString];
    if (undefined == next) {
      next = 0;
    }
    if (next < number) {
      this._instanceNames[classString] = number + 1;
    }
  } else {
    throw new TypeError("shortname: " + shortname + " not a valid widget short name - no number at end of name.");
  }
}

com.marklogic.widgets.workplacecontext.prototype.revert = function() {
  this._json = this._lastSaved;
};

com.marklogic.widgets.workplacecontext.prototype.save = function(callback) {
  // TODO
};

com.marklogic.widgets.workplacecontext.prototype.getJson = function() {
  return this._json; // DO NOT EDIT the returned JSON - use context functions only
};

com.marklogic.widgets.workplacecontext.prototype.getSummary = function() {
  return {title: this._json.title,urls: this._json.urls,layout: this._json.layout,shared:this._json.shared};
}
com.marklogic.widgets.workplacecontext.prototype.setSummary = function(title, urls, layout,shared) {
  this._json.title = title;
  this._json.urls = urls;
  this._json.layout = layout;
  this._json.shared = shared;
};

com.marklogic.widgets.workplacecontext.prototype.getWidgets = function() {
  return this._json.widgets;
};

com.marklogic.widgets.workplacecontext.prototype.addWidget = function(name,type,config) {
  var wgt = {widget: name, type: type, config: config};
  this._addWidgetName(name);
  this._json.widgets.push(wgt);
  return wgt;
};

com.marklogic.widgets.workplacecontext.prototype.removeWidget = function(name) {
  var wgts = [];
  for (var i = 0;i < this._json.widgets.length;i++) {
    if (this._json.widgets[i].name == name) {
      // do nothing
    } else {
      wgts.push(this._json.widgets[i]);
    }
  }
  this._json.widgets = wgts;
};

com.marklogic.widgets.workplacecontext.prototype.getAssignments = function() {
  return this._json.assignments;
};

com.marklogic.widgets.workplacecontext.prototype.setAssignments = function(assignments) {
  this._json.assignments = assignments;
};

com.marklogic.widgets.workplacecontext.prototype.placeWidget = function(name,zone,order) {
  // get other widgets in zone
  var zoneWidgets = [];
  var otherWidgets = [];
  var maxo = 0;
  for (var i = 0,w, max = this._json.assignments.length;i < max;i++) {
    w = this._json.assignments[i];
    if (w.zone == zone) {
      zoneWidgets[w.order-1] = w;
      maxo = w.order;
    } else {
      otherWidgets.push(w);
    }
  }
  // increment indexes on this and subsequent widget placements
  for (var i = maxo-1; i > order - 1;i--) {
    zoneWidgets[maxo] = zoneWidgets[maxo - 1];
    zoneWidgets[maxo].order++;
    zoneWidgets[maxo - 1] = undefined;
  }
  // now add in our widget
  zoneWidgets[order - 1] = {widget: name,zone:zone,order:order};
  
  var places = [];
  for (var i = 0;i < otherWidgets.length;i++) {
    places.push(otherWidgets[i]);
  }
  for (var i = 0;i < zoneWidgets.length;i++) {
    places.push(zoneWidgets[i]);
  }
  this._json.assignments = places;
};

com.marklogic.widgets.workplacecontext.prototype.getContexts = function() {
  return this._json.contexts;
};

com.marklogic.widgets.workplacecontext.prototype.addContext = function(name,type,config) {
  this._json.contexts.push({context: name,type:type,config:config,register:[]});
};

com.marklogic.widgets.workplacecontext.prototype.registerWidget = function(widgetName,contextName) {
  for (var i = 0, max = this._json.contexts.length,c;i < max;i++) {
    c = this._json.contexts[i];
    if (c.context == contextName) {
      c.register.push(widgetName);
      return;
    }
  }
};

com.marklogic.widgets.workplacecontext.prototype.setWidgetConfig = function(widgetName,config) {
  for (var i = 0, max = this._json.widgets.length,w;i < max;i++) {
    w = this._json.widgets[i];
    if (w.widget == widgetName) {
      w.config = config;
      return;
    }
  }
};

com.marklogic.widgets.workplacecontext.prototype.getWidgetInfo = function(widgetName) {
  mljs.defaultconnection.logger.debug("workplacecontext.getWidgetInfo: Finding config for: " + widgetName);
  for (var i = 0, max = this._json.widgets.length,w;i < max;i++) {
    mljs.defaultconnection.logger.debug("workplacecontext.getWidgetInfo: Checking widget with pos: " + i);
    w = this._json.widgets[i];
    mljs.defaultconnection.logger.debug("workplacecontext.getWidgetInfo: widget: " + JSON.stringify(w));
    if (w.widget == widgetName) {
      mljs.defaultconnection.logger.debug("workplacecontext.getWidgetInfo: Match!");
      return w;
    }
  }
  return null;
};

com.marklogic.widgets.workplacecontext.prototype.getActions = function() {
  return this._json.actions;
};

com.marklogic.widgets.workplacecontext.prototype.addOnloadAction = function(type, config) {
  this._json.actions.onload.push({type: type,config: config});
};

com.marklogic.widgets.workplacecontext.prototype.addOnunloadAction = function(type,config) {
  this._json.actions.onunload.push({type: type,config: config});
  
};

com.marklogic.widgets.workplacecontext.prototype.addContextAction = function(context_name,event,actiontype,actionconfig) {
  // TODO
};

/**
 * Do any preprocessing required on the widget json config
 * @private
 */
com.marklogic.widgets.workplacecontext.prototype._processConfig = function() {
  for (var i = 0, max = this._json.widgets.length,wgt;i < max;i++) {
    wgt = this._json.widgets[i];
    this._addWidgetName(wgt.widget);
  }
};

com.marklogic.widgets.workplacecontext.prototype.loadPage = function(jsonOrString) {
  mljs.defaultconnection.logger.debug("workplacecontext.loadPage: value: " + jsonOrString);
  if (typeof(jsonOrString) == "string") {
    mljs.defaultconnection.logger.debug("workplacecontext.loadPage: Got server URI workplace page definition");
    // doc uri
    var self = this;
    this.db.findWorkplace(url,function(result) {
      // assume just one
      self._uri = result.doc.results[0].uri;
      self._json = result.doc.results[0].content;
      if ("string" == typeof (self._json)) {
        self._json = JSON.parse(self._json);
      }
      self._lastSaved = self._json;
      self._processConfig();
      self._fireUpdate();
    });
  } else {
    mljs.defaultconnection.logger.debug("workplacecontext.loadPage: Got JSON string workplace page definition");
    this._json = jsonOrString;
    this._lastSaved = this._json;
    this._processConfig();
    this._fireUpdate();
  }
};

com.marklogic.widgets.workplacecontext.prototype.loadPageWithUri = function(uri) {
  this._uri = uri;
  var self = this;
  this.db.getWorkplace(uri,function(result) {
    self._json = result.doc;
    self._lastSaved = self._json;
    
    self._processConfig();
    
    // fire updatePage event
    self._fireUpdate();
  });
};

// Context event handling

com.marklogic.widgets.workplacecontext.prototype.register = function(widget) {
  if (undefined != widget.setWorkplaceContext) {
    widget.setWorkplaceContext(this);
  }
  if (undefined != widget.updateWorkplace) {
    this.addWorkplaceUpdateListener(function(wp) {widget.updateWorkplace(wp);});
  }
};

/**
 * Workplace update fired whenever the configuration is loaded/changed on the server. (Not when saved to the server)
 * @private
 */
com.marklogic.widgets.workplacecontext.prototype._fireUpdate = function() {
  this.updatePublisher.publish(this);
};

com.marklogic.widgets.workplacecontext.prototype.addWorkplaceUpdateListener = function(lis) {
  this.updatePublisher.subscribe(lis);
};


com.marklogic.widgets.workplacecontext.prototype.removeWorkplaceUpdatelistener = function(lis) {
  this.updatePublisher.unsubscribe(lis);
};















com.marklogic.widgets.workplaceadmin = function(container) {
  this.container = container;
  
  this._workplaceContext = new com.marklogic.widgets.workplacecontext();

  this._config = {
    widgetList: [
      /*
      {title: "Co-occurence", classname: "com.marklogic.widgets.cooccurence", description: "Shows two way co-occurence between elements in a document."},
      {title: "Create Document", classname: "com.marklogic.widgets.create", description: "Form builder used to generate a new document on submission."},
      {title: "Document Properties", classname: "com.marklogic.widgets.docproperties", description: "Shows the MarkLogic Properties of a Document."},
      {title: "XHTML Head Viewer", classname: "com.marklogic.widgets.docheadviewer", description: "Shows the Meta data elements within an XHTML document."},
      {title: "XHTML Content Viewer", classname: "com.marklogic.widgets.docviewer", description: "Displays XHTML content inline within a page."},
      {title: "Data Explorer", classname: "com.marklogic.widgets.explorer", description: "HighCharts powered node diagram to explore semantic subjects and related document facets."},
      */
      {title: "HighCharts", classname: "com.marklogic.widgets.highcharts", description: "HighCharts powered charting."},
      /*
      {title: "Google Kratu", classname: "com.marklogic.widgets.kratu", description: "Google Kratu tabular display of content and semantic search results."},
      {title: "Document Markings", classname: "com.marklogic.widgets.markings", description: "Allows an XHTML document to have in-document security set to paragraphs, and supports suggesting semantic triples too."},
      {title: "OpenLayers Map", classname: "com.marklogic.widgets.openlayers", description: "OpenLayers powered map supporting multiple layer types and geospatial search"},
      {title: "RDB2RDF", classname: "com.marklogic.widgets.rdb2rdf", description: "Convert and RDBMS database to a set of triples in MarkLogic."},
      */
      {title: "Search Bar", classname: "com.marklogic.widgets.searchbar", description: "Content search query box supporting the default grammar."},
      {title: "Search Sorter", classname: "com.marklogic.widgets.searchsort", description: "Sort search results based on existing sorting options."},
      {title: "Search Pager", classname: "com.marklogic.widgets.searchpager", description: "Page through search results."},
      {title: "Search Facets", classname: "com.marklogic.widgets.searchfacets", description: "Show facets returned from a search, and allow their selection."},
      {title: "Search Results", classname: "com.marklogic.widgets.searchresults", description: "Show search results. Supports built in and custom rendering."}
      /*
      {title: "Structured Search Selection", classname: "com.marklogic.widgets.searchselection", description: "Select a structured search to execute."},
      {title: "Semantic Search Bar", classname: "com.marklogic.widgets.sparqlbar", description: "Visually create a sophisticated SPARQL query."},
      {title: "Semantic Search Results", classname: "com.marklogic.widgets.sparqlresults", description: "Show a summary of Subjects returned from a SPARQL query."},
      {title: "Semantic Subject Facts", classname: "com.marklogic.widgets.entityfacts", description: "Show the list of facts about a specific subject."}
      */
    ],
    layoutList: [
      {title: "Thin Thick", classname: "com.marklogic.widgets.layouts.thinthick", description: "Sidebar column on left of main column"},
      {title: "Thick Thin", classname: "com.marklogic.widgets.layouts.thickthin", description: "Sidebar column on right of main column"},
      {title: "Column", classname: "com.marklogic.widgets.layouts.column", description: "Single column, content widgets are horizontal panels"}
    ]
  };
  
  this.closePublisher = new com.marklogic.events.Publisher();
  
  this._currentTab = "page";
  
  this._nextID = 1;
  
  this._configWrappers = new Array();
  
  this._refresh();
};

com.marklogic.widgets.workplaceadmin.prototype.addSupportedWidgets = function(widgetDefArray) {
  for (var i = 0, max = widgetDefArray.length, def;i < max;i++) {
    def = widgetDefArray[i];
    this._config.widgetList.push(def);
  }
};

com.marklogic.widgets.workplaceadmin.prototype.addSupportedLayouts = function(layoutDefArray) {
  for (var i = 0, max = layoutDefArray.length, def;i < max;i++) {
    def = layoutDefArray[i];
    this._config.layoutList.push(def);
  }
};

com.marklogic.widgets.workplaceadmin.prototype.getWidgetSummary = function(widgetclass) {
  for (var i = 0, max = this._config.widgetList.length, wc;i < max;i++) {
    wc = this._config.widgetList[i];
    if (wc.classname == widgetclass) {
      return wc;
    }
  }
  return null;
};


/**
 * Helper function to draw the edit screen full screen
 */
com.marklogic.widgets.workplaceadmin.renderFullscreen = function(workplacecontext) {
  // draw container
  // ensure main window is 960 pixels wide (for 960.css to ensure consistent rendering)
  // ensure main window has vertical scroll bar
  //str = " <div id='workplaceeditorcontainer'>Loading...</div>";
  
  var el = document.createElement("div");
  el.id = "workplaceeditormain";
  //el.innerHTML = str;
  document.body.appendChild(el);
  
  var admin = new com.marklogic.widgets.workplaceadmin("workplaceeditormain");
  workplacecontext.register(admin);
  admin.updateWorkplace(workplacecontext);
  
  // add event listener to workplace admin for closing admin widget
  admin.addCloseListener(function(wgt) {
    // destroy edit div on close
    document.body.removeChild(document.getElementById("workplaceeditormain"));
  });
};

com.marklogic.widgets.workplaceadmin.prototype.addCloseListener = function(lis) {
  this.closePublisher.subscribe(lis);
};

com.marklogic.widgets.workplaceadmin.prototype.removeCloseListener = function(lis) {
  this.closePublisher.unsubscribe(lis);
};

com.marklogic.widgets.workplaceadmin.prototype.setWorkplaceContext = function(ctx) {
  mljs.defaultconnection.logger.debug("workplaceadmin.setWorkplaceContext: called.");
  this._workplaceContext = ctx;
};

com.marklogic.widgets.workplaceadmin.prototype.getWorkplaceContext = function() {
  return this._workplaceContext;
};

com.marklogic.widgets.workplaceadmin.prototype._refresh = function() {
  var str = "<div id='" + this.container + "-workplaceadmin' class='mljswidget workplaceadmin'>";
  str += " <div id='" + this.container + "-panels' class='workplaceadmin-panels'>";
  
  str += "  <h2 class='title'>Edit Workplace Page</h2>";
  
  str += "  <div id='" + this.container + "-page-heading' class='workplaceadmin-page-heading subtitle active'>Page Settings</div>";
  str += "  <div id='" + this.container + "-page-content' class='workplaceadmin-page-content'>";
  str += "<table class='mljstable'>";
  str += "<tr><td>Page Title:</td><td><input type='text' size='25' id='" + this.container + "-page-title' /></td></tr>";
  str += "<tr><td>URL(s):</td><td><textarea cols='22' rows='4' id='" + this.container + "-page-urls'></textarea></td></tr>";
  str += "<tr><td>Main Layout:</td><td>";
  str += " <select id='" + this.container + "-page-layout'>";
  for (var i = 0, l, max = this._config.layoutList.length;i < max;i++) {
    l = this._config.layoutList[i];
    var splits = l.classname.split(".");
    var shortname = splits[splits.length - 1];
    str += "  <option value='" + shortname + "' title='" + l.description + "' id='" + this.container + "-layoutselect-" + shortname + "'>" + l.title + "</option>";
  }
  str += " </select>";
  str += "</td></tr>";
  str += "</table>";
  str += "  </div>";
  
  str += "  <div id='" + this.container + "-widgets-heading' class='workplaceadmin-widgets-heading subtitle active'>Widgets</div>";
  str += "  <div id='" + this.container + "-widgets-content' class='workplaceadmin-widgets-content hidden'>";
  str += "<table class='mljstable workplaceadmin-widgets-list'>"
  for (var i = 0, col = 0, max = this._config.widgetList.length,w;i < max;i++) {
    w = this._config.widgetList[i];
    
    col = i % 3;
    if (0 == col) {
      str += "<tr>";
    }
    
    str += "<td id='" + this.container + "-widgets-" + i + "' title='" + w.title + "'>";
    // replace text with image of widget
    str += "<div class='workplaceadmin-widgets-list-img' id='" + this.container + "-widgets-" + i + "-img'"
    if (undefined != w.icon && ""!=w.icon) {
      str += " style='background-image: url(" + w.icon + ");'";
    }
    str += " draggable='true'><div class='workplaceadmin-widgets-list-span'>" + w.title + "</div></div>";
    str += "</td>";
    
    if (2 == col) {
      str += "</tr>";
    }
  }
  if (col < 2 && i > 0) {
    str += "</tr>";
  }
  str += "</table>";
  str += "  </div>";
  
  str += "  <div id='" + this.container + "-contexts-heading' class='workplaceadmin-contexts-heading subtitle active'>Contexts</div>";
  str += "  <div id='" + this.container + "-contexts-content' class='workplaceadmin-contexts-content hidden'>TODO</div>";
  str += "  <div id='" + this.container + "-actions-heading' class='workplaceadmin-actions-heading subtitle active'>Actions</div>";
  str += "  <div id='" + this.container + "-actions-content' class='workplaceadmin-actions-content hidden'>TODO</div>";
  str += "  <div class='workplaceadmin-buttonbar'>";
  str += "   <input class='btn btn-primary' id='" + this.container + "-save' value='Save' type='submit' />";
  str += "   <input class='btn btn-secondary' id='" + this.container + "-cancel' value='Cancel' type='submit' />";
  str += "  </div>";
  str += " </div>";
  str += " <div id='" + this.container + "-config' class='workplaceadmin-config container_12'>";
  str += " </div>";
  str += "</div>";
  
  document.getElementById(this.container).innerHTML = str;
  
  // DND info
  
  for (var i = 0, col = 0, max = this._config.widgetList.length,w;i < max;i++) {
    w = this._config.widgetList[i];
    com.marklogic.widgets.dnd.onto(this.container + "-widgets-" + i + "-img","widgetclass",["layoutzone"],{type: "widgetclass", data: w.classname});
  }
  
  // TODO event handlers etc.
  // widget drag/drop/click
  var self = this;
  document.getElementById(this.container + "-page-heading").onclick = function(evt) {
    self._showTab("page");
  };
  document.getElementById(this.container + "-widgets-heading").onclick = function(evt) {
    self._showTab("widgets");
  };
  document.getElementById(this.container + "-contexts-heading").onclick = function(evt) {
    self._showTab("contexts");
  };
  document.getElementById(this.container + "-actions-heading").onclick = function(evt) {
    self._showTab("actions");
  };
  
  document.getElementById(this.container + "-cancel").onclick = function(evt) {
    self._workplaceContext.revert();
    self.closePublisher.publish(true);
  };
  document.getElementById(this.container + "-save").onclick = function(evt) {
    self._workplaceContext.save(function(result) {
      // TODO do something like show a save message
    });
  };
};


com.marklogic.widgets.workplaceadmin.prototype._showTab = function(tab) {
  if ("page" == this._currentTab) {
    // save page settings
    this._workplaceContext.setSummary(
      document.getElementById(this.container + "-page-title").value,
      document.getElementById(this.container + "-page-urls").innerHTML.split(","),
      document.getElementById(this.container + "-page-layout").value,
      false); // TODO get shared status from checkbox
  } else if ("widgets" == this._currentTab) {
    // save layout
    this._saveLayout();
  }
  mljs.defaultconnection.logger.debug("workplaceadmin._showTab: Showing " + tab);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-page-content"),("page" != tab));
  com.marklogic.widgets.hide(document.getElementById(this.container + "-widgets-content"),("widgets" != tab));
  com.marklogic.widgets.hide(document.getElementById(this.container + "-contexts-content"),("contexts" != tab));
  com.marklogic.widgets.hide(document.getElementById(this.container + "-actions-content"),("actions" != tab));
  this._currentTab = tab;
};

com.marklogic.widgets.workplaceadmin.prototype._saveLayout = function() {
  // clear context of widget configurations and assignments
  this._workplaceContext.resetWidgetConfig();
  
  // save each widget's config to the context
  for (var i = 0, max = this._configWrappers.length, wrapper;i < max;i++) {
    wrapper = this._configWrappers[i];
    this._workplaceContext.addWidget(wrapper.getWidgetName(),wrapper.getWidgetType(),wrapper.getWidgetConfig());
  }
  
  // generate assignments from layout
  var assignments = this._layout.generateAssignments();
  // save assignments to workplacecontext
  this._workplaceContext.setAssignments(assignments);
};

// Adds a new widget instance to the specified zone
com.marklogic.widgets.workplaceadmin.prototype._addClassToZone = function(widgetclass,zone) {
  var self = this;
  
  // create new layout dropzone
  var iAss = {widget: self.container + "-dropzone-" + zone + "-" + self._nextID++};
  this._layout.generateId(zone,iAss);
  var insert = new com.marklogic.widgets.dropzone(iAss.elementid);
  this._addDzAccept(insert, zone, iAss.order, iAss.elementid);
  
  // create new widget instance name
  var instanceName = self._workplaceContext.nextWidgetName(widgetclass); // data.data = widgetclassname
  var widget = self._workplaceContext.addWidget(instanceName,widgetclass,{});
  // add to layout
  var wid = self._layout.appendToZone(widget.widget,zone,"");
  
  // create new config wrapper
  var wgt = new com.marklogic.widgets.configwrapper(wid.elementid);
  this._configWrappers.push(wgt);
  wgt.setWorkplaceContext(this._workplaceContext);
  wgt.onto("widgetconfig",["layoutposition"],{type: "widgetconfig", data: widget}); // SHOULD THIS BE wid INSTEAD??? wid is a JSON assignment object
  // get json config for this widget
  var cfg = self._workplaceContext.getWidgetInfo(widget.widget);
  // get class of widget, and it's config description
  var cls = com.marklogic.widgets.workplace._getWidgetClass(cfg.type);
  if (undefined != cls.getConfigurationDefinition) {
    cls = cls.getConfigurationDefinition();
  } else {
    cls = {};
  }
  wgt.wrap(widget.widget,cls,cfg.config);
  
  // now move new widget up one (so it's before the drop zone it was dropped on to)
  this._layout.moveToPosition(widget.widget,zone,iAss.order - 1); // should move it's spacer too
  
  return widget;
};

// Adds drop action handlers and performs those actions
com.marklogic.widgets.workplaceadmin.prototype._addDzAccept = function(aDrop, zone, position,layoutelementid) {
  mljs.defaultconnection.logger.debug("addDzAccept called for: zone: " + zone + ", order: " + position + ", layoutelementid: " + layoutelementid);
  var self = this;
  // accept new widget classes being dropped
  aDrop.accept("layoutposition",["widgetclass"],function(data) {
    if ("widgetclass" == data.type) {
      // we've had a widget class image dropped on us
      mljs.defaultconnection.logger.debug("APPENDING INSERT WIDGET CLASS " + data + " ON TO DROP ZONE " + zone + " OF LAYOUT AT POSITION: " + position);
      
      var widget = self._addClassToZone(data.data,zone);
      
      // add to widgetconfig at this position
      self._layout.moveToPosition(widget.widget,zone,position);
    } else {
      // widget config wrapper
      mljs.defaultconnection.logger.debug("layout position widgetconfig drop handler called for: " + JSON.stringify(data));
      // data = { widget: widgetName, elementid: layoutHtmlId, ... } in layout
      // instruct layout to reposition html
      self._layout.moveToPosition(data.data.widget,zone,position); // data.data.widget = widget instance name
      // reconfigure widgetcontext appropriately
    }
  });
};

com.marklogic.widgets.workplaceadmin.prototype.updateWorkplace = function(ctx) {
  // do something with this._workplaceContext.getJson()
  
  // TODO blow away current layout
  
  // draw layout inside this container
  
  var json = this._workplaceContext.getJson();
  var self = this;
  
  // load top level layout for this page (or panel we are managing, at least)
  mljs.defaultconnection.logger.debug("workplaceadmin.updateWorkplace: Creating layout");
  mljs.defaultconnection.logger.debug("workplaceadmin.updateWorkplace: Got JSON: " + JSON.stringify(json));
  this._layout = new (com.marklogic.widgets.layouts[json.layout])(this.container + "-config");
  
  // Go through assignments, generate IDs for each widget in each area
  var zones = this._layout.getZoneList();
  var zoneWidgets = {}; // zoneWidgets[zone] => [{widget: widgetname, zone: "A", order: 1}, ...]
  for (var z = 0, maxz = zones.length, zone;z < maxz;z++) {
    zone = zones[z];
    // gen ordered widget list
    var zarray = zoneWidgets[zone];
    if (undefined == zarray) {
      zarray = [];
      zoneWidgets[zone] = zarray;
    }
    for (var a = 0, maxa = json.assignments.length, ass;a < maxa;a++) {
      ass = json.assignments[a];
      if (ass.zone == zone) {
        // match, add to list
        zarray.push(ass);
      }
    }
    // order each
    bubbleSort(zarray,"order",true); // reverse order means ascending (normally used for facet ordering, descending)
  }
  
  var addBottomDz = function(zone) {
    var bAss = {widget: "dropzone-" + zone};
    self._layout.generateId(zone,bAss);
    var bDrop = new com.marklogic.widgets.dropzone(bAss.elementid);
    bDrop.accept("layoutposition",["widgetclass"],function(data) {
      // we've had a widget class image dropped on us
      console.log("APPENDING WIDGET CLASS " + data + " ON TO DROP ZONE " + zone + " OF LAYOUT");
      
      self._addClassToZone(data.data,zone);
    });
  };
  
  // Create wrapper config widget for each widget in it's area
  for (var z = 0, maxz = zones.length, zone;z < maxz;z++) {
    zone = zones[z];
    
    // create wrapper for each widget
    for (var w = 0, maxw = zoneWidgets[zone].length, widget;w < maxw;w++) {
      widget = zoneWidgets[zone][w];
      
      // create insert zone before each widget
      
      var aAss = {widget: "dropzone-" + zone + "-" + self._nextID++};
      this._layout.generateId(zone,aAss);
      var aDrop = new com.marklogic.widgets.dropzone(aAss.elementid);
      this._addDzAccept(aDrop, zone, w, aAss.elementid); // w ok to use at this point
      
      // create widget
      var wid = this._layout.appendToZone(widget.widget,zone,"");
      var wgt = new com.marklogic.widgets.configwrapper(wid.elementid);
      this._configWrappers.push(wgt);
      wgt.setWorkplaceContext(this._workplaceContext);
      wgt.onto("widgetconfig",["layoutposition"],{type: "widgetconfig", data: widget}); // SHOULD THIS BE wid INSTEAD??? wid is a JSON assignment object
      // get json config for this widget
      var cfg = this._workplaceContext.getWidgetInfo(widget.widget);
      // get class of widget, and it's config description
      var cls = com.marklogic.widgets.workplace._getWidgetClass(cfg.type);
      if (undefined != cls.getConfigurationDefinition) {
        cls = cls.getConfigurationDefinition();
      } else {
        cls = {};
      }
      wgt.wrap(widget.widget,cls,cfg.config);
    }
    
    // now add 'add to zone' widget
    addBottomDz(zone);
  }
  
  // load information in to summary page
  document.getElementById(this.container + "-page-title").value = json.title;
  var str = "";
  for (var i = 0;i < json.urls.length;i++) {
    if (i > 0) {
      str += ",";
    }
    str += json.urls[i];
  }
  document.getElementById(this.container + "-page-urls").innerHTML = str;
  //document.getElementById(this.container + "-layoutselect-" + json.layout).selected = "selected"; // TODO check this works when switching pages
  document.getElementById(this.container + "-page-layout").value = json.layout;
  
  // TODO load other state information shown in left bar from JSON (is there any? Actions?)
  
  mljs.defaultconnection.logger.debug("workplaceadmin.updateWorkplace: Finished creating layout");
};











com.marklogic.widgets.dropzone = function(container) {
  this.container = container;
  this._accepted = [];
  this._callback = null;
  
  this._init();
};

com.marklogic.widgets.dropzone.prototype._init = function() {
  // draw widget
  var str = "<div class='mljswidget dropzone'>";
  str += " <div class='dropzone-target' id='" + this.container + "-target'>";
  //str += "  <img src='/images/mljs/dropzone.png' />";
  str += "  <p class='dropzone-text'>Drop here</p>";
  str += " </div>";
  str += "</div>";
  
  document.getElementById(this.container).innerHTML = str;
};

com.marklogic.widgets.dropzone.prototype.accept = function(dropzoneClass,draggableTypeAcceptArray,callback) {
  com.marklogic.widgets.dnd.accept(this.container + "-target",dropzoneClass,draggableTypeAcceptArray,callback);
};











com.marklogic.widgets.configwrapper = function(container) {
  this.container = container;
  mljs.defaultconnection.logger.debug("configwrapper: Constructor: Creating configwrapper within element with id: " + container);
  this._widgetName = "";
  this._configDescription = null;
  this._config = null;
  
  this._workplaceContext = null;
  this.__nextID = 1;
  
  this._init();
};

com.marklogic.widgets.configwrapper.prototype.getWidgetName = function() {
  return this._widgetName;
};

com.marklogic.widgets.configwrapper.prototype.getWidgetType = function() {
  return this._configDescription.type;
};

com.marklogic.widgets.configwrapper.prototype.getWidgetConfig = function() {
  return this._config;
};

com.marklogic.widgets.configwrapper.prototype.setWorkplaceContext = function(wpc) {
  this._workplaceContext = wpc;
};

com.marklogic.widgets.configwrapper.prototype.getWorkplaceContext = function() {
  return this._workplaceContext;
};

com.marklogic.widgets.configwrapper.prototype.onto = function(draggableClass,droppableTypeAcceptArray,dataOrCallback) {
  mljs.defaultconnection.logger.debug("configwrapper.onto: Adding drag handler for " + this.container + "-name");
  com.marklogic.widgets.dnd.onto(this.container + "-name",draggableClass,droppableTypeAcceptArray,dataOrCallback);
};
  
com.marklogic.widgets.configwrapper.prototype.wrap = function(widgetName,configDescription,currentConfig) {
  this._widgetName = widgetName;
  this._configDescription = configDescription;
  this._config = currentConfig;
  
  this._updateWidgetConfig();
};

com.marklogic.widgets.configwrapper.prototype._updateWidgetConfig = function() {
  // update UI for this configuration
  document.getElementById(this.container + "-name").innerHTML = this._widgetName;
  document.getElementById(this.container + "-cfg").innerHTML = this._genConfigHTML(this._config,this._configDescription,0);
};

com.marklogic.widgets.configwrapper.prototype._genConfigHTML = function(json,def,level) {
  var gotConfig = false;
  var str = "<table class='configwrapper-table'>";
  for (var name in json) {
    gotConfig = true;
    
    // get actual current config values (if specified, if not use defaults from definition)
    var c = json[name];
    // get config descriptor for this element - get type from there, not introspection (more exacting)
    var d = def[name];
    
    str += "<tr>";
    var addtitle = function() {
      str += "<td title='" + d.description + "'>" + d.title + "</td><td>";
    };
    
    var conf = {id: this.__nextID++, json: c, def: d};
    var self = this;
    
    if ("string" == d.type) {
      addtitle();
      var val = c || d.default;
      str += "<input type='text' id='" + this.container + "-" + conf.id + "' value='" + val.htmlEscape() + "' />";
      conf.addhandler = function() {
        var el = document.getElementById(this.container + "-" + conf.id);
        el.onchange = function() {
          json[name] = el.value;
        };
      };
    } else if ("enum" == d.type) {
      addtitle();
      var val = c || d.default;
      str += "<select id='" + this.container + "-" + conf.id + "' value='" + val.htmlEscape() + "'>"; // TODO check setting value here works
      for (var i = 0,opt,max=d.options.length; i < max;i++) {
        opt = d.options[i];
        str += "<option value='" + opt.value + "' title='" + opt.description + "' ";
        if (opt.value == val) {
          str += "selected='selected' ";
        }
        str += ">" + opt.title + "</option>"; // TODO selected=selected if select.value doesn't work
      }
      str += "</select>";
      conf.addhandler = function() {
        var el = document.getElementById(this.container + "-" + conf.id);
        el.onchange = function() {
          json[name] = el.value;
        };
      };
    } else if ("positiveInteger" == d.type) {
      addtitle();
      var val = "" + (c || d.default);
      // handle min/max - via event handlers on +/- and manual changing
      // handle invalid (E.g. text) values - try { 1* val} catch (oopsie) and ""+floor(val) == ""+val (integer not float)
      str += "<input type='text' id='" + conf.id + "' value='" + val.htmlEscape() + "' />";
      str += "<span class='configwrapper-increment' id='" + this.container + "-" + conf.id + "-increment'>&nbsp;</span>";
      str += "<span class='configwrapper-decrement' id='" + this.container + "-" + conf.id + "-decrement'>&nbsp;</span>";
      conf.addhandler = function() {
        var el = document.getElementById(this.container + "-" + conf.id);
        el.onchange = function() {
          // validate value. If crap, use current value
          var val = el.value;
          try {
            if ( (("" + val) == ("" + Math.floor(val))) && 
                 ((undefined == d.minimum) || (undefined != d.minimum && val >= d.minimum)) && 
                 ((undefined == d.maximum) || (undefined != d.maximum && val <= d.maximum)) ) {
              // valid value;
              json[name] = val;
            } else {
              el.value = json[name];
            }
          } catch (numberex) {
            // invalid value = reset
            el.value = json[name];
          }
        };
      };
    } else if ("boolean" == d.type) {
      addtitle();
      var val =  c || d.default;
      str += "<input type='checkbox' name='" + this.container + "-" + conf.id + "' id='" + this.container + "-" + conf.id + "' ";
      if (true === val) {
        str += "checked='checked' ";
      }
      str += ">" + "</input>"; // TODO verify true and false work as expected
      conf.addhandler = function() {
        var el = document.getElementById(this.container + "-" + conf.id);
        el.onchange = function() {
          json[name] = el.checked;
        };
      };
    } else if ("multiple" == d.type) {
      str += "<td colspan='2'><div class='configwrapper-multiple-firstrow'>";
      // TODO handle min/max - via event handlers
      str += "<span>" + d.title + ":-</span>&nbsp;&nbsp;&nbsp;&nbsp;";
      str += "<span class='configwrapper-addmultiple' id='" + this.container + "-" + conf.id + "-add'>&nbsp;</span></div>";
      str += "<div class='configwrapper-multiple-indent'>";
      str += "<table class='configwrapper-multiple-table' id='" + this.container + "-" + conf.id + "-table'>";
      if (Array.isArray(c)) {
        var gotrows = false;
        for (var i = 0; i < c.length;i++) {
          gotrows = true;
          str += "<tr><td>" + (i + 1) + ":&nbsp;<br/><span class='configwrapper-delmultiple' id='" + this.container + "-" + conf.id + "-del'>&nbsp;</span></td><td>";
          str += this._genConfigHTML(c[i],d.childDefinitions,level + 1);
          str += "</td></tr>";
        }
        if (!gotrows) {
          // show empty row, +/- buttons only
        }
      } else {
        // show empty row, +/- buttons only
      }
      str += "</table>";
      str += "</div>";
    }
    
    str += "</td></tr>";
  }
  if (!gotConfig) {
    str += "<tr><td><i>This widget cannot be configured</i></td></tr>";
  }
  str += "</table>";
  return str;
};

com.marklogic.widgets.configwrapper.prototype._init = function() {
  var str = "<div class='mljswidget configwrapper'>";
  
  str += " <h3 class='subtitle' draggable='true' id='" + this.container + "-name'>" + this._widgetName + "</h3>"; // TODO show widget type title here too
  // show config elements on page
  str += "<div id='" + this.container + "-cfg'>";
  str += this._genConfigHTML(this._config,this._configDescription,0);
  str += "</div>";
  
  str += "</div>";
  
  document.getElementById(this.container).innerHTML = str;
};

com.marklogic.widgets.configwrapper.prototype.updateWorkplace = function(json) {
  // extract this widget's config from json, set in the wrapper, and refresh
  this._updateWidgetConfig();
};







/**
 * Manages an ordered set of JavaScript action objects, and their configuration.
 */
com.marklogic.widgets.actionorderer = function(container) {
  this.container = container;
  this._actions = null;
  this._wrappers = {}; // HTML ID => actionconfigwrapper instance
  this._init();
};

com.marklogic.widgets.actionorderer.prototype._init = function() {
  var s = "<div class='mljswidget actionorderer' id='" + this.container + "-outer'>";
  s += "  <div class='actionorderer-actions' id='" + this.container + "-actions'></div>";
  s += "  <div class='actionorderer-drop' id='" + this.container + "-drop'></div>";
  s += "</div>";
  document.getElementById(this.container).innerHTML = s;
  
  // TODO Drop zone action handler
};

com.marklogic.widgets.actionorderer.prototype.wrap = function(actions) {
  this._actions = actions;
  
  // render in same order in display
};

com.marklogic.widgets.actionorderer.prototype.getActions = function() {
  // TODO return options in their current order as a config
  // TODO also update out internal config, just incase
  return this._actions;
};



// REPLACE THE BELOW WITH A REFACTORED CONFIG WRAPPER???
com.marklogic.widgets.actionconfig = function(container) {
  this.container = container;
  this._config = null;
  this._init();
};

com.marklogic.widgets.actionconfig.prototype._init = function() {
  
};

com.marklogic.widgets.actionconfig.prototype.wrap = function(config) {
  this._config = config;
  
  // TODO render config
};

com.marklogic.widgets.actionconfig.prototype.getConfig = function() {
  // TODO return updated config
  return this._config;
};
