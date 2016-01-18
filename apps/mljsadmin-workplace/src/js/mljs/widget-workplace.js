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
  this._configurationContext = new mljs.defaultconnection.configurationcontext(this);

  this._editable = false;

  this._contexts = new Array(); // contextname => contextObject instance
  this._widgets = {};
  this._classInstances = {};

  this._workplaceContext = new com.marklogic.widgets.workplacecontext();

  this._loadedPublisher = new com.marklogic.events.Publisher();

  this._init();

  this._workplaceContext.register(this);
};

/**
 * Returns the workplace context for this workplace
 */
com.marklogic.widgets.workplace.prototype.getWorkplaceContext = function() {
  return this._workplaceContext;
};

/**
 * Sets the workplace context for this workplace
 * @param {com.marklogic.widgets.workplacecontext} ctx - The Workplace Context to link to
 */
com.marklogic.widgets.workplace.prototype.setWorkplaceContext = function(ctx) {
  this._workplaceContext = ctx;
  this.updateWorkplace();
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

/**
 * Specifies whether this workplace page widget is editable. Default is false.
 *
 * @param {boolean} editme - Is this workplace editable?
 */
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

/**
 * Loads the specified configuration
 *
 * @param {json|string} jsonOrString - The JSON config object's URI, or json string representing the page configuration
 * @param {json} json_opt - Optional fall back JSON configuration, if remote workplace config does not exist. Useful for new applications.
 */
com.marklogic.widgets.workplace.prototype.loadPage = function(jsonOrString,json_opt) {
  this._workplaceContext.loadPage(jsonOrString,json_opt);
};

// configuration context methods
com.marklogic.widgets.workplace.prototype.getInstance = function(instanceName) {
  return this._widgets[instanceName] || this._contexts[instanceName];
};

com.marklogic.widgets.workplace.prototype.addPageLoadedListener = function(lis) {
  this._loadedPublisher.subscribe(lis);
};

com.marklogic.widgets.workplace.prototype.removePageLoadedListener = function(lis) {
  this._loadedPublisher.unsubscribe(lis);
};

/**
 * Redraws this workplace based on the configuration in the specified workplace context object.
 *
 * @param {workplacecontext} context - The Workplace context holding the configuration to render.
 */
com.marklogic.widgets.workplace.prototype.updateWorkplace = function(context) {
mljs.defaultconnection.logger.debug("workplace.updateWorkplace: UPDATING PAGE");
  var json = this._workplaceContext.getJson();

  // load top level layout for this page (or panel we are managing, at least)
  mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Creating layout");
  var layout = new (com.marklogic.widgets.layouts[json.layout] || com.marklogic.widgets.layoutsext[json.layout])(this.container + "-layout");

  // generate named areas for widgets to be contained
  mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Creating zones");
  layout.createZones(json.assignments);

  var self = this;
  var getInstance = function(widgetName) {
    return self.getInstance(widgetName);
  };

  var contexts = {}; //new Array(); // contextid => context object

  // create management contexts from connection object
  mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Creating contexts");
  for (var c = 0, max = json.contexts.length,ctx;c < max;c++) {
    ctx = json.contexts[c];
    mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Context: " + c + " is " + JSON.stringify(ctx));

    /*
    var creator = mljs.defaultconnection["create" + ctx.type];
    mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Is creator function of type function?: " + (typeof creator));
    var inst = creator.call(mljs.defaultconnection);
    */

    var inst = this._workplaceContext.getContextInstance(ctx.type);

    this._configurationContext.register(inst);
    contexts[ctx.context] = inst;
    mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Is context instance valid?: is object?: " + (typeof inst));
    var instances = this._classInstances[ctx.type];
    if (undefined == instances) {
      instances = [];
      this._classInstances[ctx.type] = instances;
    }
    instances.push(inst);


    // register widgets with contexts - now done in _createWidget instead
    //for (var wid = 0, widmax = ctx.register.length,widgetid;wid < widmax;wid++) {
    //  widgetid = ctx.register[wid];
    //  mljs.defaultconnection.logger.debug("registering widget: " + wid + " to " + widgetid);
    //  inst.register(widgets[widgetid]);
    //}
  }

  this._contexts = contexts;

  // separate out setting config so that getInstance() works
  for (var c = 0, max = json.contexts.length,ctx;c < max;c++) {
    ctx = json.contexts[c];
    var inst = contexts[ctx.context];
    // initialise context configuration
    mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Config: " + JSON.stringify(ctx.config));
    //mljs.defaultconnection.logger.debug("Context Obj: " + JSON.stringify(inst));
    if (undefined != inst.setConfiguration && undefined != ctx.config) {
      mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Setting context configuration");
      var nc = JSON.parse(JSON.stringify(ctx.config));
      nc.getInstance = getInstance;
      inst.setConfiguration(nc);
    }
  }


  var widgets = {}; //new Array(); // widgetid => wgt instance

  // initialise widgets in these areas
  mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Creating widget instances");
  for (var w = 0, max = json.widgets.length,widget;w < max;w++) {
    widget = json.widgets[w];
    mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Creating widget: " + w + " with: " + JSON.stringify(widget));

    var item = layout.getAssignmentByWidgetName(widget.widget).item;
    var elementid = item.elementid;

      var nc = JSON.parse(JSON.stringify(widget.config));
      nc.getInstance = getInstance;

    var wgt = this._createWidget(widget.type,elementid,nc,widget.widget);

    mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Create widget has returned");
    widgets[widget.widget] = wgt;
    var instances = this._classInstances[widget.type];
    if (undefined == instances) {
      instances = [];
      this._classInstances[widget.type] = instances;
    }
    instances.push(wgt);
  }

  this._widgets = widgets;


  // call onload actions in order
  if (undefined != json.actions && undefined != json.actions.onload) {
    mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Processing onload actions (" + json.actions.onload.length + ")");
    for (var a = 0, max = json.actions.onload.length,action;a < max;a++) {
      action = json.actions.onload[a];
      mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Processing onload action: " + JSON.stringify(action));
      var actionObject = new(com.marklogic.widgets.actions[action.type])();
      mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Got instance. Calling setConfiguration()...");
      var nc = JSON.parse(JSON.stringify(action.config));
      nc.getInstance = getInstance;
      actionObject.setConfiguration(nc);
      mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Finished configuring. Caling execute(this)...");
      var result = actionObject.execute(this);
      // CYCLIC mljs.defaultconnection.logger.debug("workplace.updateWorkplace: Got result: " + JSON.stringify(result));
      // TODO do something with result
    }
    mljs.defaultconnection.logger.debug("workplace.updateWorkplace: COMPLETE processing onload actions");
  }

  mljs.defaultconnection.logger.debug("workplace.updateWorkplace: finished loading page");

  this._loadedPublisher.publish(this._workplaceContext);
};

/**
 * Returns the specified json configuration named object from the workplace context. Used by page JavaScript to override default widget settings.
 *
 * @param {string} name - The Widget name from the configuration object. E.g. searchbar1
 */
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

com.marklogic.widgets.workplace.prototype._createWidget = function(type,elementid,config,name) {
  mljs.defaultconnection.logger.debug("workplace._createWidget: Creating widget: " + type + " in " + elementid + " with config: " + JSON.stringify(config));

  var wobj = com.marklogic.widgets.workplace._getWidgetClass(type);

  mljs.defaultconnection.logger.debug("workplace._createWidget: instantiating widget: " + JSON.stringify(wobj));
  var wgt = new wobj(elementid);

  mljs.defaultconnection.logger.debug("workplace._createWidget: has widget instance been created? type is object?: " + (typeof wgt));

  if (undefined !== this._configurationContext) {
    this._configurationContext.register(wgt);
  }

  var json = this._workplaceContext.getJson();
  var getContext = function(cn) {
    for (var c = 0,maxc = json.contexts.length,ct;c < maxc;c++) {
      ct = json.contexts[c];
      if (ct.context == cn) {
        return ct;
      }
    }
    return null;
  };

  // register with contexts first
  for (var ctxname in this._contexts) {
    var ctxconfig = getContext(ctxname);
    var ctx = this._contexts[ctxname];
    // check if reigster contains this widget's name
    if (ctxconfig.register.contains(name)) {
      ctx.register(wgt);
    }
  }

  // apply config to object
  if (undefined !== wgt.setConfiguration) { // backwards compatibility - widget may not have configuration
    wgt.setConfiguration(config);
  }

  return wgt;
};


com.marklogic.widgets.workplace.prototype.getInstance = function(name) {
  // get instance of widget/context and return to caller
  var ins = this._contexts[name];
  if (null == ins) {
    ins = this._widgets[name];
  }
  return ins;
};

com.marklogic.widgets.workplace.prototype.getInstancesOf = function(cname) {
  return this._classInstances[cname];
};



// LAYOUTS

// thinthick layout
com.marklogic.widgets.layouts = {};
/**
 * Layout helper object
 * @singleton
 */
com.marklogic.widgets.layouts.helper = {};
/**
 * Helper function to prune admin widgets out of a layout. Used to generate saveable position data for workplace pages
 *
 * @param {Array} assignmentArray - The assignment array to prune admin widgets from
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

/**
 * Applies generic layout mixins to the specified layout instance.
 * TODO page describing this mixin API
 * @param {layout} layoutInstance - The layout to apply mixin functions to
 * @param {string} container - The HTML ID of the container object for this layout
 * @param {Array} zones - An array of zone names from the JSON workplace configuration object
 */
com.marklogic.widgets.layouts.helper.extendLayout = function(layoutInstance,container,zones) {
  // mixin generic parameters and functions
  var self = layoutInstance;
  self.container = container;

  self.zones = {}; // "A" => [null, {elementid: ""},{widget: "searchbar1",...}, ... ] // ordered, also order: parameter holds the order (1 based)
  self.zoneNames = zones;
  for (var i = 0, max = zones.length, zone;i < max;i++) {
    zone = zones[i];
    self.zones[zone] = new Array();
  }
  self._nextID = 1;

  //self.assignments = new Array(); // [widgetname] => assignment json, with elementid for element linked to - WHY???

  // new
  /**
   * Layout mixin method to return the contained assignment by name
   */
  self.getAssignmentByWidgetName = function(widgetname) {
    return self._overZones(function(item) {
          if (undefined != item && "object" == typeof(item)) {
            // json assignment, not string placeholder
            if (item.widget == widgetname) {
              return true;
            }
          }
          return false;
    });
  };
  // new
  self._overZones = function(matcher) {
    for (var z in self.zones) {
      mljs.defaultconnection.logger.debug("_overZones: fetching zone named: " + z);
      var zone = self.zones[z];
      if (undefined != zone) {
        mljs.defaultconnection.logger.debug("_overZones: Looping through zone containers");
        mljs.defaultconnection.logger.debug("_overZones: typeof zone: " + typeof (zone));
        for (var i = 1, max = zone.length, item;i < max;i++) {
          item = zone[i];
          mljs.defaultconnection.logger.debug("_overZones: got container number " + i + " with item type: " + typeof(item));
          if ("object" == typeof(item)) {
            mljs.defaultconnection.logger.debug("_overZones: item json content: " + JSON.stringify(item));
          }
          if (matcher(item)) {
            var mj =  {item: item, zone: z, order: i};
            mljs.defaultconnection.logger.debug("_overZones: Container " + i + " matches. Returning match JSON: " + JSON.stringify(mj));
            return mj;
          }
        }
      }
    }
    mljs.defaultconnection.logger.debug("_overZones: No zone container matches at all. Returning null");
    return null;
  };
  // new
  self.getAssignmentByPlaceholder = function(elid) {
    mljs.defaultconnection.logger.debug("getAssignmentByPlaceholder: Called for elid: " + elid);
    return self._overZones(function(item) {
      mljs.defaultconnection.logger.debug("getAssignmentByPlaceholder: overzones matcher called for elid: " + elid);
      if (undefined != item) {
        if ("string" == typeof(item)) {
          mljs.defaultconnection.logger.debug("getAssignmentByPlaceholder: item is string");
          if (item == elid) {
            mljs.defaultconnection.logger.debug("getAssignmentByPlaceholder: string item '" + item + "' matches elid");
            return true;
          }
        } else {
          // json assignment
          mljs.defaultconnection.logger.debug("getAssignmentByPlaceholder: item is JSON config");
          if (item.elementid == elid) {
            mljs.defaultconnection.logger.debug("getAssignmentByPlaceholder: JSON config '" + item.elementid + "' matches elid");
            return true;
          }
        }
      } else {
        // undefined
      }
      mljs.defaultconnection.logger.debug("getAssignmentByPlaceholder: item not a match for elid. returning false");
      return false;
    })
  };
  // ok (less code than not caching)
  self.getZoneList = function() {
    return self.zoneNames;
  };

  // assigns assignments to this layout, then generates those assignments
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

  // WHY? When will it ever not exist?
  self._getZone = function(zone) {
    var z = self.zones[zone];
    if (undefined == z) {
      z = [];
      self.zones[zone] = z;
    }
    return z;
  };
  // ok
  self.printZoneInfo = function() {
    var l = mljs.defaultconnection.logger.debug;
    for (var z in self.zones) {
      var zone = self.zones[z];
      for (var i = 0, max = zone.length,element;i < max;i++) {
        element = zone[i];
        if (undefined != element) {
          if ("string" == typeof(element)) {
            l("layout.printZoneInfo: Zone: " + z + ", index: " + i + ", contains: Placeholder: " + element);
          } else {
            l("layout.printZoneInfo: Zone: " + z + ", index: " + i + ", contains: Widget: " + element.widget);
          }
        }
      }
    }
  };

  /**
   * Returns the widget assignment JSON
   * @private
   */
  // ok
  self._elementAt = function(zone,index) {
    var z = self.zones[zone];
    if (undefined == z) { // how?
      return null;
    }
    return z[index];
  };

  // TODO generate the JSON assignment config
  self.generateAssignments = function() {
    // export assignments we've been managing
    // NB this SHOULD be pruned - i.e. the order's should be halved (we assume previous element is a spacer)
    // Generating:-
    // assignments: [
    //   {widget: "searchfacets1", zone: "A", order: 1},
    //   {widget: "searchbar1", zone: "B", order: 1},
    //   {widget: "highcharts1", zone: "B", order: 2},
    //   {widget: "searchresults1", zone: "B", order: 3},
    //   {widget: "selection1", zone: "A", order: 2}
    // ],
    var ass = [];
    for (var zone in self.zones) {
      var z = self.zones[zone];
      var nextOrder = 1;
      self._eliminateBlanks(z); // should fix orders and gaps in new widget placements
      for (var o = 2, max = z.length, wgt;o < max;o += 2) {
        wgt = z[o];
        if (undefined != z[o]) {
          ass.push({widget: wgt.widget, zone: zone, order: (nextOrder++)});
        }
      }
    }
    return ass;
  };
  // ok
  self.createPlaceholder = function(zone) {
    var lastOrder = self.zones[zone].length;
    if (0 == lastOrder) {
      lastOrder = 1;
    }
    var elid = self.container + "-" + zone + "-" + self._nextID++;
    self.zones[zone][lastOrder] = elid; // gen new id

    // generate HTML
    if (undefined != self._createPlaceholderHTMLOverride) {
      self._createPlaceholderHTMLOverride(zone,elid);
    } else {
      var zoneel = document.getElementById(self.container + "-" + zone);
      var div = document.createElement("div");
      div.setAttribute("id",elid);
      //var toappend = div.firstChild; // assume one child only. Could use div.childNodes for all children
      zoneel.appendChild(div);
    }

    return elid;
  };
  // MUST call createPlaceholder first
  // ok
  self.registerAssignment = function(placeholderelid,assignmentJsonOrWidgetName) {
    var info = self.getAssignmentByPlaceholder(placeholderelid);
    if ("string" == typeof(assignmentJsonOrWidgetName)) {
      assignmentJsonOrWidgetName = {widget: assignmentJsonOrWidgetName};
    }
    self.zones[info.zone][info.order] = assignmentJsonOrWidgetName;
    assignmentJsonOrWidgetName.elementid = placeholderelid;
    assignmentJsonOrWidgetName.order = info.order;
    assignmentJsonOrWidgetName.zone = info.zone;
    return assignmentJsonOrWidgetName;
  };
  // deprecated - use _getAssignmentByWidgetName instead
  /*
  self.getElementID = function(widgetname) { // refactoring done
    mljs.defaultconnection.logger.debug("layout<class>: getElementID: for widgetid: " + widgetid);
    var elid = self.assignments[widgetid].elementid;
    mljs.defaultconnection.logger.debug("layout<class>: getElementID: widgetid: " + widgetid + " => " + elid);
    return elid;
  };
  */
  // deprecated - use createPlaceholder, widget constructor, and registerAssignment instead
  /*
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
  */
  // Generates assignments from the assignment array
  self._genZones = function(zone,arr) {
    mljs.defaultconnection.logger.debug("layout<class>._genZones: " + zone + " with array: " + JSON.stringify(arr));
    for (var i = 1, max = arr.length, ass;i < max;i++) {
      mljs.defaultconnection.logger.debug("layout<class>._genZones: zone: " + zone + " index: " + i);
      ass = arr[i];
      if (undefined != ass) {
        // create PlaceHolder HTML
        var elid = self.createPlaceholder(zone);
        // draw widget now? - NO (can be done afterwards safely as part of full page load)
        var newAss = self.registerAssignment(elid,ass);

        //s += self._ass(zone,ass);
      }
    }
    //self._replaceZone(zone,s);
  };
  /*
  self._replaceZone = function(zone,html) {
    if (undefined != self._replaceZoneOverride) {
      self._replaceZoneOverride(zone,html);
    } else {
      document.getElementById(self.container + "-" + zone).innerHTML = html;
    }
  };
  self.getCurrentElementPosition = function(elementid) {
    // fetch zone and order
    // find child element id
    var el = document.getElementById(elementid);
    var parentel = el.parentNode;
    // work up to find parent zone
    var zone = parentel.getAttribute("id").substring(self.container.length + 1);
    var info = { order: null, zone: zone};
    var found = false
    for (var i = 0, max = parentel.childNodes.length, child;i < max && !found;i++) {
      child = parentel.childNodes[i];
      if (child.getAttribute("id") == elementid) {
        found = true;
        info.order = i;
      }
    }
    return info;
  };
  */
  /*
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
  */
  /*
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
  */

  /*
  self._appendZone = function(zone,id,html) {
    // NB HTML could be blank! Perfectly legal (chicken and egg for element ids otherwise)
    if (undefined != self._appendZoneOverride) {
      self._appendZoneOverride(zone,id,html);
    } else {
    */
      //document.getElementById(this.container + "-" + zone).innerHTML += html; // TODO STOP THIS KILLING EVENT HANDLERS
      /*
      if (null != html && ""!=html) {
        var zoneel = document.getElementById(self.container + "-" + zone);
        var div = document.createElement("div");
        //if (null != id) {
        //  div.id = id;
        //}
        div.innerHTML = html;
        var toappend = div.firstChild; // assume one child only. Could use div.childNodes for all children
        zoneel.appendChild(toappend);
      }*/
      /*
        var zoneel = document.getElementById(self.container + "-" + zone);
        var div = document.createElement("div");
        //if (null != id) {
          div.setAttribute("id",id);
        //}
        div.innerHTML = html;
        //var toappend = div.firstChild; // assume one child only. Could use div.childNodes for all children
        zoneel.appendChild(div);

    }
  };*/
  self.remove = function(widgetName) {
    // remove widget and its drop zone
    var me = self.getAssignmentByWidgetName(widgetName).item;
    var spacer = self._elementAt(me.zone,me.order - 1); // TODO detect spacer
    // decrement by two each wiget after this in same zone
    var z = self.zones[me.zone];
    // remove widget and drop zone html elements
    var lastWWithWidget = 0;
    for (var w = 1, maxw = z.length,moveme; w < z.length;w++) {
      moveme = z[w];
      if (undefined != moveme) {
        lastWWithWidget = w;
        if (moveme.order > me.order) {
          z[w-2] = moveme;
          moveme.order = w - 2;
          z[w] = undefined;
        }
      }
    }
    // sanity check fix if widget being removed is last one in zone
    z[lastWWithWidget - 1] = undefined;
    z[lastWWithWidget] = undefined;
    // NB above commented out because if deleting more than one per workplace admin load, multiple undefined's are possible
    // - NEED above in case deleted item is at end of zone

    self._eliminateBlanks(z);
    // remove html
    var meel = document.getElementById(me.elementid);
    meel.parentNode.removeChild(meel);
    if (undefined != spacer) {
      var spacerel = document.getElementById(spacer.elementid);
      if (undefined != spacerel) {
        spacerel.parentNode.removeChild(spacerel);
      }
    }
  };
  // TODO make this not dependant upon spacers as per workplaceadmin
  self.moveToPosition = function(widgetName,newZone,newIndexOneBased) {
    var z = self.zones[newZone];

    // eliminate blanks now
    self._eliminateBlanks(z);

    // get element currently at position
    mljs.defaultconnection.logger.debug("layout<subclass>.moveToPosition: Entered");
    var wgt = self._elementAt(newZone,newIndexOneBased);
    var me = self.getAssignmentByWidgetName(widgetName).item;
    var spacer = self._elementAt(me.zone,me.order - 1); // TODO detect spacer
    var oldZone = me.zone;
    if (undefined != oldZone) {
      var zOldZone = self.zones[oldZone];
      self._eliminateBlanks(zOldZone);
    }
    var oldOrder = me.order;

    mljs.defaultconnection.logger.debug("layout<subclass>.moveToPosition: Got Widget at target position. Moving those afterwards");
    //var z = self._getZone(newZone);

    var lastWidget = null;
    // find last index with a widget in it
    for (var w = z.length - 1, min = 0, moveme;w >= min && null == lastWidget;w--) {
      moveme = z[w];
      if (undefined != moveme) {
        lastWidget = moveme;
      }
    }
    if (undefined == newIndexOneBased) {
      lastWidget = z[lastWidget.order - 2]; // new two elements at end right now

      wgt = lastWidget; // dropped on end of zone
      newIndexOneBased = wgt.order;

      var lastWidgetPos = wgt.order;

      // move last widget to end
      z[me.order + 1] = wgt;
      z[lastWidgetPos] = undefined;

      // move all back 1
      wgt.order = me.order + 1;
      z[lastWidgetPos] = spacer;
      spacer.order = lastWidgetPos;
      z[lastWidgetPos + 1] = me;
      me.order = lastWidgetPos + 1;
      z[lastWidgetPos + 2] = wgt;
      wgt.order = lastWidgetPos + 2;
      z[lastWidgetPos + 3] = undefined;
    } else {

    if (null != wgt) { // null if we're placing at the end
      // if not empty, increment order on all widgets at and after position
      if (null != lastWidget && lastWidget.elementid == wgt.elementid) {
        // NO IDEA WHY THIS IS NECESSARY
        /*
        // just move the last widget
        z[newIndexOneBased + 2] = z[newIndexOneBased];
        z[newIndexOneBased] = undefined;
        if (1 == z.length % 2) {
          z[newIndexOneBased + 1] = undefined; // spacer - corrects z.length later
        }
        lastWidget.order += 2; // LOOKS LIKE RUBBISH TO ME

        // blank out old positions
        self.zones[oldZone][oldOrder] = undefined;
        self.zones[oldZone][oldOrder - 1] = undefined; // spacer
        */
      } else {
        for (var w = z.length - 1, min = newIndexOneBased, moveme;w >= min;w--) {
          moveme = z[w];
          if (undefined != moveme) { // possible if something else previously re-ordered in this zone
            moveme.order += 2; // was ++
            z[w+2] = moveme; // plus 2 because we're moving the spacer too // validate this IS a spacer before moving -> no need, inferred
            z[w] = undefined;
          }
        }
      }
    }


    mljs.defaultconnection.logger.debug("layout<subclass>.moveToPosition: Getting widget to move");
    me.order = newIndexOneBased + 1; // +1 is so spacer is before this widget
    me.zone = newZone;
    spacer.order = newIndexOneBased;
    spacer.zone = newZone;
    // place widget at required position
    z[newIndexOneBased] = spacer; // assumes new index is valid
    z[newIndexOneBased + 1] = me;

    if (null == lastWidget || null == wgt || lastWidget.elementid != wgt.elementid) {
      // blank out old positions
      var diff = 0;
      if (newZone == oldZone) {
        //  -> will be 2 AFTER original position now, due to incrementing - only if original and destination zones the same
        diff = 2;
      }
      self.zones[oldZone][oldOrder + diff] = undefined;
      self.zones[oldZone][oldOrder - 1 + diff] = undefined; // spacer
    }

    } // end if new class dropped on end of zone if

    mljs.defaultconnection.logger.debug("layout<subclass>.moveToPosition: Moving (decrementing order) widgets passed original position");
    // decrement order's after this element's position - if oldzone different from newzone this is valid
    //if (newZone != oldZone) {
      //z = self._getZone(oldZone);
      z = self.zones[oldZone];

    // sanity check - loop through old zone. If any widgets where zone or order doesn't match, blank them
    // Horrible, horrible hack
    for (var w = 1,maxw = z.length,wtm;w < maxw;w++) {
      wtm = z[w];
      if (undefined != wtm) {
        if (wtm.zone != oldZone) {
          z[w] = undefined;
        } else {
          if (wtm.order != w) {
            z[w] = undefined;
          }
        }
      }
    }

    self._eliminateBlanks(z);
    self._eliminateBlanks(z); // horrible, horrible hack


    mljs.defaultconnection.logger.debug("layout<subclass>.moveToPosition: Moving HTML element");
    // ACTUALLY MOVE THE DAMNED HTML!!!
    self._moveElementToPosition(me,spacer,wgt);

    mljs.defaultconnection.logger.debug("layout<subclass>.moveToPosition: Ended");
  };
  self._eliminateBlanks = function(z) {
      // loop through all
      // decrement counts AFTER undefined encountered
      var foundGap = 0;
      var maxOrder = 0;
      for (var w = 1, max = z.length,moveme;w < max;w++) {
        moveme = z[w];
        if (undefined == moveme) {
          foundGap++;

          // move all afterwards up to this position, decrement max by 1
          for (var nw = w + 1,maxnw = max,newitem;nw < maxnw;nw++) {
            z[nw - 1] = z[nw];
            if (undefined != z[nw - 1]) {
              z[nw - 1].order = nw - 1;
            }
            z[nw] = undefined;
          }
          max--;

        } else {
          /*
          if (foundGap > 0) {
            moveme.order = w - foundGap; // safer than decrementing by 2
            // move element back 2 - can only happen when not undefined. i.e. after gap
            z[w - foundGap] = z[w];
            z[w] = undefined;
          }
          maxOrder = moveme.order; // new order only. Maximum is always at end of elements
          */
        }
      }
      maxOrder = max;
      /*
      for (var w = oldOrder + 3, max = z.length, moveme;w < max;w++) { // TODO handle +1 when no spacer present
        moveme = z[w];
        if (undefined != moveme) {
          moveme.order = moveme.order - 2;
        }
        z[w-2] = moveme; // minus 2 because we'll move the spacer too
        z[w] = undefined; // so we don't get duplicates at the end of the array
      }*/
      //console.log("z.length now: " + z.length);
      // NB following should be superfluous now
      for (var w = maxOrder + 1, max = z.length, moveme;w < max;w++) {
        z[w] = undefined; // could be 3 out if moved from end of one column to end of another column
      }
      //z[z.length - 1] = undefined;
      //z[z.length - 2] = undefined;
    //}
  };
  // ok (test)
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







/**
 * A thin thick layout. 960.css aware. Uses container_4 for the left (thin) side, and container_8 for the right (thick) side.
 * @constructor
 *
 * @param {string} container - The HTML ID of the container to render this layout within
 */
com.marklogic.widgets.layouts.thinthick = function(container) {
  com.marklogic.widgets.layouts.helper.extendLayout(this,container,["A","B"]);

  this._init();
};

com.marklogic.widgets.layouts.thinthick.prototype._init = function() {
  var s = "<div id='" + this.container + "-layout' class='container_12 row mljswidget layout thinthick'>";
  s += "<div id='" + this.container + "-A' class='grid_4 col-md-4 col-xs-12 thinthick-thin'></div>";
  s += "<div id='" + this.container + "-B' class='grid_8 col-md-8 col-xs-12 thinthick-thick'></div>";
  s += "</div>";
  var el = document.getElementById(this.container);
  if (undefined == el) {
    console.log("WARNING: ATTEMPTING TO SET NON EXISTENT LAYOUT ELEMENT: " + this.container);
  } else {
    el.innerHTML = s;
  }
};







/**
 * A thick thin layout. 960.css aware. Uses container_8 for the left (thick) side, and container_4 for the right (thin) side.
 * @constructor
 *
 * @param {string} container - The HTML ID of the container to render this layout within
 */
com.marklogic.widgets.layouts.thickthin = function(container) {
  com.marklogic.widgets.layouts.helper.extendLayout(this,container,["A","B"]);

  this._init();
};

com.marklogic.widgets.layouts.thickthin.prototype._init = function() {
  var s = "<div id='" + this.container + "-layout' class='container_12 row mljswidget layout thickthin'>";
  s += "<div id='" + this.container + "-A' class='grid_8 col-md-8 col-xs-12 thickthin-thick'></div>";
  s += "<div id='" + this.container + "-B' class='grid_4 col-md-4 col-xs-12 thickthin-thin'></div>";
  s += "</div>";
  var el = document.getElementById(this.container);
  if (undefined == el) {
    console.log("WARNING: ATTEMPTING TO SET NON EXISTENT LAYOUT ELEMENT: " + this.container);
  } else {
    el.innerHTML = s;
  }
};









/**
 * A single column layout. 960.css aware. Uses container_12 from 960.css.
 * @constructor
 *
 * @param {string} container - The HTML ID of the container to render this layout within
 */
com.marklogic.widgets.layouts.column = function(container) {
  com.marklogic.widgets.layouts.helper.extendLayout(this,container,["A"]);

  this._init();
};

com.marklogic.widgets.layouts.column.prototype._init = function() {
  var s = "<div id='" + this.container + "-layout' class='container_12 row mljswidget layout column'>";
  s += "<div id='" + this.container + "-A' class='column col-md-12 col-xs-12'></div>";
  s += "</div>";
  var el = document.getElementById(this.container);
  if (undefined == el) {
    console.log("WARNING: ATTEMPTING TO SET NON EXISTENT LAYOUT ELEMENT: " + this.container);
  } else {
    el.innerHTML = s;
  }
};


/**
 * A two column. uses bootstrap css.
 * @constructor
 *
 * @param {string} container - The HTML ID of the container to render this layout within
 */
com.marklogic.widgets.layouts.twocolumns = function(container) {
  com.marklogic.widgets.layouts.helper.extendLayout(this,container,["A","B"]);

  this._init();
};

com.marklogic.widgets.layouts.twocolumns.prototype._init = function() {
  var s = "<div id='" + this.container + "-layout' class='container_12 row mljswidget layout twocolumns'>";
  s += "<div id='" + this.container + "-A' class='grid_6 col-md-6 col-xs-12 twocolumns-left'></div>";
  s += "<div id='" + this.container + "-B' class='grid_6 col-md-6 col-xs-12 twocolumns-right'></div>";
  s += "</div>";
  var el = document.getElementById(this.container);
  if (undefined == el) {
    console.log("WARNING: ATTEMPTING TO SET NON EXISTENT LAYOUT ELEMENT: " + this.container);
  } else {
    el.innerHTML = s;
  }
};



/**
 * A three column. uses bootstrap css.
 * @constructor
 *
 * @param {string} container - The HTML ID of the container to render this layout within
 */
com.marklogic.widgets.layouts.threecolumns = function(container) {
  com.marklogic.widgets.layouts.helper.extendLayout(this,container,["A","B"]);

  this._init();
};

com.marklogic.widgets.layouts.threecolumns.prototype._init = function() {
  var s = "<div id='" + this.container + "-layout' class='container_12 row mljswidget layout threecolumns'>";
  s += "<div id='" + this.container + "-A' class='grid_4 col-md-4 col-xs-12 threecolumns-left'></div>";
  s += "<div id='" + this.container + "-B' class='grid_4 col-md-4 col-xs-12 threecolumns-center'></div>";
  s += "<div id='" + this.container + "-C' class='grid_4 col-md-4 col-xs-12 threecolumns-right'></div>";
  s += "</div>";
  var el = document.getElementById(this.container);
  if (undefined == el) {
    console.log("WARNING: ATTEMPTING TO SET NON EXISTENT LAYOUT ELEMENT: " + this.container);
  } else {
    el.innerHTML = s;
  }
};



/**
 * A thinthickthin layout. uses bootstrap css.
 * @constructor
 *
 * @param {string} container - The HTML ID of the container to render this layout within
 */
com.marklogic.widgets.layouts.thinthickthin = function(container) {
  com.marklogic.widgets.layouts.helper.extendLayout(this,container,["A","B"]);

  this._init();
};

com.marklogic.widgets.layouts.thinthickthin.prototype._init = function() {
  var s = "<div id='" + this.container + "-layout' class='container_12 row mljswidget layout thinthickthin'>";
  s += "<div id='" + this.container + "-A' class='grid_3 col-md-3 col-xs-12 thinthickthin-left'></div>";
  s += "<div id='" + this.container + "-B' class='grid_6 col-md-6 col-xs-12 thinthickthin-center'></div>";
  s += "<div id='" + this.container + "-C' class='grid_3 col-md-3 col-xs-12 thinthickthin-right'></div>";
  s += "</div>";
  var el = document.getElementById(this.container);
  if (undefined == el) {
    console.log("WARNING: ATTEMPTING TO SET NON EXISTENT LAYOUT ELEMENT: " + this.container);
  } else {
    el.innerHTML = s;
  }
};











// ACTIONS
com.marklogic.widgets.actions = {};
/**
 * Holds configuration for a JavaScript generic method call action. Used on page load/unload only. (Not related to a searchresult action bar)
 * @constructor
 */
com.marklogic.widgets.actions.javascript = function() {
  this._config = {
    target: null,
    method: null,
    parameters: []
  };
};

/**
 * Returns the Workplace configuration definition object
 */
com.marklogic.widgets.actions.javascript.getConfigurationDefinition = function() {
  // TODO config definition
};

/**
 * Sets the workplace widget instance configuration
 */
com.marklogic.widgets.actions.javascript.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }
};

/**
 * Executes this action
 *
 * @param {object} executionContext - The execution context. Holds environment configuration for this action.
 */
com.marklogic.widgets.actions.javascript.prototype.execute = function(executionContext) {
  if ((null == this._config.target) || (null == this._config.method)) {
    return {executed: false, details: "targetObject or methodName are null"};
  }
  var obj = executionContext.getInstance(this._config.target); // context or widget
  mljs.defaultconnection.logger.debug("Got target object?: " + obj);
  mljs.defaultconnection.logger.debug("Fetching method name: " + this._config.method);
  var func = (obj[this._config.method]);
  mljs.defaultconnection.logger.debug("Got target object function: " + func);

  // TODO create parameters array with type conversion
  var params = [];
  for (var p = 0,maxp = this._config.parameters.length,par;p < maxp;p++) {
    par = this._config.parameters[p];
    var parValue = null;
    if ("string" == par.type) {
      parValue = par.value;
    } else if ("number" == par.type) {
      parValue = 1 * par.value;
    } else if ("null" == par.type) {
      parValue = null;
    } else if ("queryStringParameter" == par.type) {
      var ins = com.marklogic.widgets.pagecontext.instance;
      if (undefined != ins) {
        parValue = ins.getParameter(par.value);
      }
    }
    params.push(parValue);
  }

  var result = func.apply(obj,params); // support parameters
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

  this._cachedPages = new Array();
  this._cached = false;

  this._instanceNames = {}; // [shortname] -> next available instance id or null

  this._linker = new com.marklogic.events.Linker();
  this.updatePublisher = new com.marklogic.events.Publisher(); // page loaded from server
  this._myPagesPublisher = new com.marklogic.events.Publisher(); // fires my pages updated event updateMyPages(pageArray)



  this._objectTypeMap = {};

  this._actions = [
    {targetClass: "SearchContext", methodName: "doSimpleQuery", parameters: [
      {title: "query", type: "string", default:"", description: "The query string for the current grammar."}
    ]},
    {targetClass: "SearchContext", methodName: "doStructuredQuery", parameters: [
      {title: "structuredQuery", type: "string",default:{"and-query": []}, description: "The structured query JSON."}
    ]},
    {targetClass: "com.marklogic.widgets.graphexplorer", methodName: "drawSubject", parameters: [
      {title: "subjectIri", type: "string",default:"", description: "The IRI of the subject to render."}
    ]},
    {targetClass: "SemanticContext", methodName: "subjectQuery", parameters: [
      {title: "sparql", type: "string", default: "SELECT ?s WHERE {}", description: "The SPARQL that returns a ?subject value."},
      {title: "offset", type: "integer", default: 0, description: "Which result to start at (for multi page results)."},
      {title: "limit", type: "integer", default: 10, description: "The number to return per page of results."}
    ]},
    {targetClass: "SemanticContext", methodName: "subjectFacts", parameters: [
      {title: "iri", type: "string", default: "", description: "The IRI of the subject to fetch facts for."}
    ]},
    {targetClass: "SemanticContext", methodName: "queryFacts", parameters: [
      {title: "sparql", type: "string", default:"SELECT ?s ?p ?o WHERE {}", description: "The SPARQL which returns the list of facts of interest."}
    ]},
    {targetClass: "GeoContext", methodName: "go", parameters: [
      {title: "lon", type: "decimal", minimum: -180, maximum: +180, default:"0", description: "The Longitude (East-West) of the point of interest in WGS84/EPSG4326 format."},
      {title: "lat", type: "decimal", minimum: -90, maximum: +90, default:"52", description: "The Latitude (North-South) of the point of interest in WGS84/EPSG4326 format."},
      {title: "zoom", type: "positiveInteger", minimum: 1, maximum: 15, default:"13", description: "Zoom level to use (13 is urban area)."}
    ]},
    {targetClass: "DocumentContext", methodName: "getContent", parameters: [
      {title: "docuri", type: "string", default:"", description: "The MarkLogic document URI to fetch content for."}
    ]},
    {targetClass: "DocumentContext", methodName: "getFilteredContentFor", parameters: [
      {title: "docuri", type: "string", default:"", description: "The MarkLogic document URI to fetch related content for."}
    ]},
    {targetClass: "DocumentContext", methodName: "getProperties", parameters: [
      {title: "docuri", type: "string", default:"", description: "The MarkLogic document URI to fetch properties for."}
    ]},
    {targetClass: "DocumentContext", methodName: "getFacets", parameters: [
      {title: "docuri", type: "string", default:"", description: "The MarkLogic document URI to fetch facets for."},
      {title: "optionsName", type: "string", default:"all", description: "The MarkLogic search options that specify the facets to load."},
    ]}

  ]; // TODO read this on instance creation from extensions library(ies)
};

com.marklogic.widgets.workplacecontext.prototype.getContextClass = function(type) {

      // get context class
      var wobj = com;
      var splits = type.split(".");
      if (1 == splits.length) {
        // old style short names - SearchConfig
        wobj = mljs.defaultconnection[splits[0].toLowerCase()];
      } else {
        // global style JS namespaces
        for (var i = 1, max = splits.length,split;i < max;i++) {
          split = splits[i];
          wobj = wobj[split];
          //mljs.defaultconnection.logger.debug("workplace._getWidgetClass: split: " + split + " has type: " + (typeof wobj) + " and value: " + JSON.stringify(wobj));
        }
      }
      return wobj;
};

com.marklogic.widgets.workplacecontext.prototype.getContextInstance = function(type) {
  var cls = this.getContextClass(type);
  var inst = new cls();
  mljs.defaultconnection.linkContext(inst);
  return inst;
};

com.marklogic.widgets.workplacecontext.prototype.getInstancesOf = function(cname) {
  var instances = new Array();
  for (var i = 0,maxi = this._json.widgets.length,wgt;i < maxi;i++) {
    wgt = this._json.widgets[i];
    if (wgt.type == cname) {
      instances.push(wgt.widget);
    }
  }
  for (var i = 0,maxi = this._json.contexts.length,wgt;i < maxi;i++) {
    wgt = this._json.contexts[i];
    if (wgt.type == cname) {
      instances.push(wgt.context);
    }
  }
  return instances;
};

com.marklogic.widgets.workplacecontext.prototype.getInstances = function() {
  var instances = new Array();
  for (var i = 0,maxi = this._json.widgets.length,wgt;i < maxi;i++) {
    wgt = this._json.widgets[i];
    instances.push(wgt.widget);
  }
  for (var i = 0,maxi = this._json.contexts.length,wgt;i < maxi;i++) {
    wgt = this._json.contexts[i];
    instances.push(wgt.context);
  }
  return instances;
};

com.marklogic.widgets.workplacecontext.prototype.setActionDescriptions = function(descs) {
  this._actions = descs;
};

com.marklogic.widgets.workplacecontext.prototype.getActionDescription = function(targetClass,methodName) {
  for (var a = 0,maxa = this._actions.length,config;a < maxa;a++) {
    config = this._actions[a];
    if (config.targetClass == targetClass && config.methodName == methodName) {
      return config;
    }
  }
  return null;
};

com.marklogic.widgets.workplacecontext.prototype.setActionList = function(listName,actionArray) {
  if (undefined == this._json.actions || Array.isArray(this._json.actions)) {
    this._json.actions = {};
  }
  this._json.actions[listName] = actionArray;
};

com.marklogic.widgets.workplacecontext.prototype.getActionDescriptions = function() {
  return this._actions;
};

com.marklogic.widgets.workplacecontext.prototype.getObjectType = function(objectName) {
  return this._objectTypeMap[objectName];
};

com.marklogic.widgets.workplacecontext.prototype.getObjectTypes = function() {
  return this._objectTypeMap;
};

com.marklogic.widgets.workplacecontext.prototype._calculateObjectTypeMap = function() { // TODO add call to this to new widget/context add routine
  var json = this._json;
  this._objectTypeMap = {};
  for (var i = 0,maxi = json.widgets.length,wgt;i < maxi;i++) {
    wgt = json.widgets[i];
    this._objectTypeMap[wgt.widget] = wgt.type;
  }
  i = 0;
  maxi = json.contexts.length;
  for (var ctx;i < maxi;i++) {
    ctx = json.contexts[i];
    this._objectTypeMap[ctx.context] = ctx.type;
  }
  // order object map
  bubbleSort(this._objectTypeMap,"name"); // sorts by name value
};

/**
 * Instructs this workplace context to load all workplace page definitions accessible for read by the current user.
 * Fires updateMyPages event handlers on registered widgets.
 */
com.marklogic.widgets.workplacecontext.prototype.loadMyPages = function() {
  // fetch available workplace pages asyncrhonously
  var self = this;
  var ob = this.db.createOptions();
  ob.collectionConstraint()
    .returnFacets(false)
    .returnResults(true)
    .pageLength(1000)
    .raw();
  var qb = this.db.createQuery();
  qb.query(qb.collection("/config/workplace/page"));
  var sc = this.db.createSearchContext();
  sc.setOptions("mljsMyWorkplacePages",ob); // will fail on multi user system - need to use combined query dynamically
  sc.addResultsListener(function(results) {
    if (true === results || false === results) {
      return;
    }
    var pages = new Array();
    for (var i = 0, maxi = results.results.length,page;i < maxi;i++) {
      page = results.results[i].content;
      pages.push({uri: results.results[i].uri,page: page});
    }
    // fire update event on return
    self._cachedPages = pages;
    self._myPagesPublisher.publish(pages);
  });
  sc.doStructuredQuery(qb.toJson());
};

/**
 * Returns the currently readable workplace pages for this user, cached from previous calls.
 * If the cache is empty, returns an empty array and loads readable pages in to cache asynchronously (via loadMyPages()).
 */
com.marklogic.widgets.workplacecontext.prototype.getCachedPages = function() {
  if (false === this._cachedPages) {
    this.loadMyPages();
  }
  return this._cachedPages;
};

com.marklogic.widgets.workplacecontext.prototype.createPage = function(pageJson) {
  // create page on server
  var self = this;
  this.db.save(pageJson,"/admin/workplace/" + this.__genid() + ".json",{collection: "/config/workplace/page"},function(result) {
    if (result.inError) {
      // TODO publish error
    } else {
      // add to cached pages
      self._cachedPages.push({uri: result.docuri,page: pageJson});
      // update page list
      self._myPagesPublisher.publish(self._cachedPages);
    }
  });
};


com.marklogic.widgets.workplacecontext.prototype.__genid = function() {
  return "" + ((new Date()).getTime()) + "-" + Math.ceil(Math.random()*100000000);
};

com.marklogic.widgets.workplacecontext.prototype.deletePage = function(uri) {
  var self = this;
  this.db.delete(uri,function(result) {
    if (result.inError) {
      // TODO handle result error
    } else {
      // remove page from cached pages
      var newcache = new Array();
      for (var p = 0,maxp = self._cachedPages.length,page;p < maxp;p++) {
        page = self._cachedPages[p];
        if (uri != page.uri) {
          newcache.push(page);
        }
      }
      self._cachedPages = newcache;
      // fire update event
      self._myPagesPublisher.publish(self._cachedPages);
    }
  });
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
 *
 * @param {string} classname - The class of the next widget or context to create a numeric index for.
 * @return {string} instanceName - The next available instance name, including number
 */
com.marklogic.widgets.workplacecontext.prototype.nextWidgetName = function(classname) {
  // get last . character
  var classString = classname.split(".").pop().toLowerCase(); // TODO check this works on all browsers

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
    if (next <= number) {
      this._instanceNames[classString] = number + 1;
    }
  } else {
    throw new TypeError("shortname: " + shortname + " not a valid widget short name - no number at end of name.");
  }
};

/**
 * Reverts all configuration changes to the last saved JSON configuration
 */
com.marklogic.widgets.workplacecontext.prototype.revert = function() {
  this._json = this._lastSaved;
  this._calculateObjectTypeMap();
};

/**
 * Set the persisting URI for this workplace. Useful if configuration loaded from page JSON, but edits need to be persisted to the server.
 * @param {string} uri - Workplace page document URI
 */
com.marklogic.widgets.workplacecontext.prototype.setWorkplaceUri = function(uri) {
  this._uri = uri;
};

/**
 * Saves this configuration, invoking the callback afterwards
 *
 * @param {function} callback - The callback function to invoke after save
 */
com.marklogic.widgets.workplacecontext.prototype.save = function(callback) { // TODO determine is we want to remove callbacks at this level (contexts)
  // NB admin widgets all update context before this function is called, so we just persist our current state, then update previously saved config variable too
  // NB only widget config held in context - no admin widgets referenced.
  // NB We assume the order in zones has been updated correctly via a call to setAssignments from the layout

  // NB this._uri may be blank if loaded from a JSON config object in page, not via doc URI
  var self = this;
  this.saveWorkplace(this._json,this._uri,null,function(result) {
    console.log("WORKPLACE SAVED");

    self.loadPageWithUri(self._uri); // tries to remove all internal config and reload
    //self._fireUpdate();
    callback();

    self.loadMyPages();
  });
};


// MLJS WORKPLACE

/**
 * TODO docs
 */
com.marklogic.widgets.workplacecontext.prototype.getWorkplace = function(name,callback) {
  if (undefined == name) {
    // loaded a page with default json and no name
    callback(this._json);
  }
  if (-1 == name.indexOf(".json")) {
    this.db.get("/admin/workplace/" + encodeURI(name) + ".json", callback);
  } else {
    this.db.get(name, callback);
  }
};


/**
 * TODO docs
 */
com.marklogic.widgets.workplacecontext.prototype.saveWorkplace = function(json,uri_opt,props_opt,callback) {
  var col = null;
  if (undefined != props_opt) {
    col = props_opt.collection;
  }
  var wpcols = "mljsInternalData,mljsWorkplacePages,/config/workplace/page";
  if (undefined == col) {
    col = wpcols;
  } else {
    col = col + "," + wpcols;
  }
  if (undefined == props_opt) {
    props_opt = {};
  }
  props_opt.collection = col;
  this.db.save(json,uri_opt || "/admin/workplace/" + this.__genid() + ".json",props_opt,callback);
};

com.marklogic.widgets.workplacecontext.prototype.loadWorkplace = function(uri) {
  var self = this;

  this.db.get(uri,function(result) {
    if (result.inError) {
      // TODO handle error
    } else {
      self._uri = uri;
      self._json = result.doc;

      self._lastSaved = self._json;
      self._processConfig();
      self._fireUpdate();
    }
  });
};

/**
 * TODO docs
 */
com.marklogic.widgets.workplacecontext.prototype.findWorkplace = function(pageurl,callback) {
  // query http://docs.marklogic.com/guide/search-dev/structured-query#id_47536
  // options http://docs.marklogic.com/guide/rest-dev/appendixa#id_62771
  // docs missing at the moment
  // TODO ensure we ask for RAW results, limit 1
  // TODO support multiple users (ASSUME: security handling visibility for same url, different config)
  var ob = this.db.createOptions();
  ob
    // V7: .valueConstraint("item","item",ob.JSON)
    // V8:-
    .jsonContainerConstraint("urls","urls")
    .returnFacets(false)
    .returnResults(true)
    .raw();
  var qb = this.db.createQuery();
  // V7: qb.query(qb.container("urls",qb.value("item",pageurl)));
  // V8:-
  qb.query(
    qb.and([
      qb.collection("mljsWorkplacePages")
      ,
      qb.value("urls",pageurl)
    ])
  );
  var sc = this.db.createSearchContext();
  sc.setOptions("mljsFindWorkplace",ob); // will fail on multi user system - need to use combined query dynamically
  sc.addResultsListener(function(results) {
    if (true === results || false === results) {
      return;
    }
    // pass single document as result to callback
    var found = false;
    for (var i = 0;!found && i < results.results.length;i++) {
      for (var j = 0;j < results.results[i].content.urls.length;j++) {
        if (results.results[i].content.urls[0] == pageurl) { // sanity check for range index snafu (no range index for urls configured)
          callback({inError: false,doc: results.results[i]});
        }
      }
    }
  });
  sc.doStructuredQuery(qb.toJson());
};

/**
 * TODO Sdocs
 */
com.marklogic.widgets.workplacecontext.prototype.listSharedWorkplaces = function(callback) {
  // query http://docs.marklogic.com/guide/search-dev/structured-query#id_47536
  // options http://docs.marklogic.com/guide/rest-dev/appendixa#id_62771
  // docs missing at the moment
  // TODO ensure we ask for RAW results, limit 1
};

/**
 * Returns the JSON configuration managed by this context
 */
com.marklogic.widgets.workplacecontext.prototype.getJson = function() {
  return this._json; // DO NOT EDIT the returned JSON - use context functions only
};

/**
 * Returns a summary for this JSON configuration object
 */
com.marklogic.widgets.workplacecontext.prototype.getSummary = function() {
  return {title: this._json.title,urls: this._json.urls,layout: this._json.layout,shared:this._json.shared};
};

/**
 * Sets the summary for this JSON configuration object
 *
 * @param {string} title - The title of this page
 * @param {Array} urls - A string array containing matching URLs for this page in the application
 * @param {string} layout - The fully qualified name of the Workplace layout to use
 * @param {boolean} shared - Whether this layout is intended to be shared with other users
 */
com.marklogic.widgets.workplacecontext.prototype.setSummary = function(title, urls, layout,shared) {
  this._json.title = title;
  this._json.urls = urls;
  this._json.layout = layout;
  this._json.shared = shared;
};

/**
 * Changes layout to that now specified. Does NOT update zone placements (done by workplace admin widget or your code)
 *
 * @param {string} newLayout - new layout class abbreviation (E.g. 'thinthick')
 */
com.marklogic.widgets.workplacecontext.prototype.setLayout = function(newLayout) {
  this._json.layout = newLayout;
};

/**
 * Changes page URLs to that now specified.
 *
 * @param {Array} urlArray - new url array
 */
com.marklogic.widgets.workplacecontext.prototype.setUrls = function(urlArray) {
  this._json.urls = urlArray;
};

/**
 * Returns all widget configuration
 */
com.marklogic.widgets.workplacecontext.prototype.getWidgets = function() {
  return this._json.widgets;
};

/**
 * Adds a widget to this configuration
 *
 * @param {string} name - The configuration name of the widget. E.g. searchbar1
 * @param {string} type - The fully qualified widget class name to create
 * @param {json} config - The JSON configuration object for this widget
 */
com.marklogic.widgets.workplacecontext.prototype.addWidget = function(name,type,config) {
  var wgt = {widget: name, type: type, config: config};
  this._addWidgetName(name);
  this._json.widgets.push(wgt);
  return wgt;
};

/**
 * Removes a named widget from this configuration
 *
 * @param {string} name - The configuration name of the widget. E.g. searchbar1
 */
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

/**
 * Returns the assignments in this configuration
 */
com.marklogic.widgets.workplacecontext.prototype.getAssignments = function() {
  return this._json.assignments;
};

/**
 * Sets the assignments in this configuration
 *
 * @param {Array} assignments - The assignments array for this page
 */
com.marklogic.widgets.workplacecontext.prototype.setAssignments = function(assignments) {
  this._json.assignments = assignments;
};

/**
 * Places the specified widget in to a particular layout zone and position
 *
 * @param {string} name - The configuration name of the widget. E.g. searchbar1
 * @param {string} zone - The named zone in the layout. E.g. "A"
 * @param {integer} order - The order in this layout. 1 based.
 */
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

/**
 * Returns the context object configuration for this page
 */
com.marklogic.widgets.workplacecontext.prototype.getContexts = function() {
  return this._json.contexts;
};

/**
 * Adds a context configuration to this page
 *
 * @param {string} name - The widget name. E.g. searchbar1
 * @param {string} type - The short name for the context to create
 * @param {json} config - Configuration of the context
 */
com.marklogic.widgets.workplacecontext.prototype.addContext = function(name,type,config) {
  this._json.contexts.push({context: name,type:type,config:config,register:[]});
};

/**
 * Removes a context from this configuration
 * @param {string} context - The context name (E.g. "searchcontext1")
 */
com.marklogic.widgets.workplacecontext.prototype.removeContext = function(context) {
  var pos = -1;
  for (var c = 0,maxc = this._json.contexts.length,ctx;c < maxc && (-1==pos);c++) {
    ctx = this._json.contexts[c];
    if (ctx.context == context) {
      pos = c;
    }
  }
  if (-1 != pos) {
    this._json.contexts.splice(pos,1);
  }
};

/**
 * Links a widget to a context (will invoke the register function on page loading)
 *
 * @param {string} widgetName - The configuration widget name. E.g. searchbar1
 * @param {string} contextName - The configuration context name. E.g. searchcontext1
 */
com.marklogic.widgets.workplacecontext.prototype.registerWidget = function(widgetName,contextName) {
  for (var i = 0, max = this._json.contexts.length,c;i < max;i++) {
    c = this._json.contexts[i];
    if (c.context == contextName) {
      if (!c.register.contains(widgetName)) {
        c.register.push(widgetName);
      }
      return;
    }
  }
};

/**
 * Sets a widget's configuration
 *
 * @param {string} widgetName - The name of the widget. E.g. searchbar1
 * @param {json} config - The JSON configuration for this widget
 */
com.marklogic.widgets.workplacecontext.prototype.setWidgetConfig = function(widgetName,config) {
  for (var i = 0, max = this._json.widgets.length,w;i < max;i++) {
    w = this._json.widgets[i];
    if (w.widget == widgetName) {
      w.config = config;
      return;
    }
  }
};

/**
 * Returns the configuration for the specified widget
 *
 * @param {string} widgetName - The widget name. E.g. searchbar1
 */
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

/**
 * Returns the actions in this page configuration
 */
com.marklogic.widgets.workplacecontext.prototype.getActions = function() {
  return this._json.actions;
};

/**
 * Adds an onload action
 *
 * @param {string} type - The action class name to create
 * @param {json} config - The JSON configuration to apply
 */
com.marklogic.widgets.workplacecontext.prototype.addOnloadAction = function(type, config) {
  this._json.actions.onload.push({type: type,config: config});
};

/**
 * Adds an on unload action
 *
 * @param {string} type - The action class name to create
 * @param {json} config - The JSON configuration to apply
 */
com.marklogic.widgets.workplacecontext.prototype.addOnUnloadAction = function(type,config) {
  this._json.actions.onunload.push({type: type,config: config});

};

/**
 * Adds an action to this configuration that responds to a context event. Equivalent of addResultsListener(function) et al
 * NB this method is not yet implemented
 *
 * @param {string} contextName - The name of this context. E.g. searchcontext1
 * @param {string} event - The name of the event. E.g. addResultsListener
 * @param {string} actiontype - The fully qualified action class name to invoke
 * @param {json} actionconfig - The JSON configuration for the action
 */
com.marklogic.widgets.workplacecontext.prototype.addContextAction = function(contextName,event,actiontype,actionconfig) {
  // TODO implement addContextAction
};

/**
 * Do any preprocessing required on the widget json config
 * @private
 */
com.marklogic.widgets.workplacecontext.prototype._processConfig = function() {
  if (undefined == this._json) {
    this._json = {};
  }
  if (undefined == this._json.widgets) {
    this._json.widgets = [];
  }
    for (var i = 0, max = this._json.widgets.length,wgt;i < max;i++) {
      wgt = this._json.widgets[i];
      this._addWidgetName(wgt.widget);
    }

  if (undefined == this._json.contexts) {
    this._json.contexts = [];
  }
    for (var i = 0, max = this._json.contexts.length,ctx;i < max;i++) {
      ctx = this._json.contexts[i];
      this._addWidgetName(ctx.context);
    }

  if (undefined == this._json.actions) {
    this._json.actions = {onload:[],onunload:[]};
  }
  if (undefined == this._json.assignments) {
    this._json.assignments = [];
  }
  if (undefined == this._json.layout) {
    this._json.layout = "thinthick";
  }
  if (undefined == this._json.urls) {
    this._json.urls = [];
  }
  this._calculateObjectTypeMap();
};

/**
 * Loads the specified JSON or json string page configuration in to this context
 *
 * @param {json|string} jsonOrString - The configuration to load - Either the Page's Document URI (NOT web URL), or JSON object definition
 * @param {json} json_opt - Optional fall back JSON configuration, if remote workplace config does not exist. Useful for new applications.
 */
com.marklogic.widgets.workplacecontext.prototype.loadPage = function(jsonOrString,json_opt) {
  mljs.defaultconnection.logger.debug("workplacecontext.loadPage: value: " + jsonOrString);
  if (typeof(jsonOrString) == "string") {
    mljs.defaultconnection.logger.debug("workplacecontext.loadPage: Got server URI workplace page definition");
    // doc uri
    var self = this;
    this.findWorkplace(jsonOrString,function(result) {
      mljs.defaultconnection.logger.debug("workplacecontext.loadPage: findWorkplace result: " + result);
      if (result.inError && undefined != json_opt) {
        mljs.defaultconnection.logger.debug("workplacecontext.loadPage: findWorkplace call resulted in error: " + result.detail);
        // fall back to default
        self._uri = null;
        self._json = json_opt;
      } else {
        // could have succeeded, but found none!
        if (undefined != result.doc) {
          mljs.defaultconnection.logger.debug("workplacecontext.loadPage: Found workplace with uri: " + result.doc.uri);
          // assume just one
          self._uri = result.doc.uri;
          self._json = result.doc.content;
        } else {
          mljs.defaultconnection.logger.debug("workplacecontext.loadPage: findWorkplace worked, but with no result");
          self._uri = null;
          self._json = json_opt;
        }
      }
      if (undefined != self._json) {
        mljs.defaultconnection.logger.debug("workplacecontext.loadPage: Processing page JSON");
        if ("string" == typeof (self._json)) {
          self._json = JSON.parse(self._json);
        }
        self._lastSaved = self._json;
        self._processConfig();
        self._fireUpdate();
      }
    });
  } else {
    mljs.defaultconnection.logger.debug("workplacecontext.loadPage: Got JSON string workplace page definition");
    this._json = jsonOrString;
    this._lastSaved = this._json;
    this._processConfig();
    this._fireUpdate();
  }
};

/**
 * Executes a search in MarkLogic for the JSON configuration matching the specified URI
 *
 * @param {string} uri - The URI of the workplace configuration to load (NOT the web application URL)
 */
com.marklogic.widgets.workplacecontext.prototype.loadPageWithUri = function(uri) {
  this._uri = uri;
  var self = this;
  this.getWorkplace(uri,function(result) {
    self._json = result.doc;
    self._lastSaved = self._json;

    self._processConfig();

    // fire updatePage event
    self._fireUpdate();
  });
};

// Context event handling

/**
 * Registers a workplace admin widget with this context
 *
 * @param {object} widget - The widget to register
 */
com.marklogic.widgets.workplacecontext.prototype.register = function(widget) {
  if (undefined != widget.setWorkplaceContext) {
    widget.setWorkplaceContext(this);
  }
  if (undefined != widget.updateWorkplace) {
    var func = function(wp) {widget.updateWorkplace(wp);};
    this.addWorkplaceUpdateListener(func);
    this._linker.link(widget,"WorkplaceUpdateListener",func);
  }
  if (undefined != widget.updateMyPages) {
    var func = function(pages) {widget.updateMyPages(pages);};
    this._myPagesPublisher.subscribe(func);
    this._linker.link(widget,"myPagesPublisher",func);
  }
};

/**
 * Unregisters a workplace admin widget with this context
 *
 * @param {object} widget - The widget to unregister
 */
com.marklogic.widgets.workplacecontext.prototype.unregister = function(widget) {

  if (undefined != widget.updateWorkplace) {
    var func = this._linker.find(widget,"WorkplaceUpdateListener");
    this.removeWorkplaceUpdateListener(func);
  }
  if (undefined != widget.updateMyPages) {
    var func = this._linker.find(widget,"myPagesPublisher");
    this._myPagesPublisher.unsubscribe(func);
  }
};

/**
 * Workplace update fired whenever the configuration is loaded/changed on the server. (Not when saved to the server)
 * @private
 */
com.marklogic.widgets.workplacecontext.prototype._fireUpdate = function() {
  this.updatePublisher.publish(this);
};

/**
 * Adds a workplace update listener to this context
 *
 * @param {function} lis - The listener function to invoke
 */
com.marklogic.widgets.workplacecontext.prototype.addWorkplaceUpdateListener = function(lis) {
  this.updatePublisher.subscribe(lis);
};

/**
 * Removes a workplace update listener from this context
 *
 * @param {function} lis - The listener function to invoke
 */
com.marklogic.widgets.workplacecontext.prototype.removeWorkplaceUpdateListener = function(lis) {
  this.updatePublisher.unsubscribe(lis);
};














/**
 * The workplace admin widget
 * @constructor
 *
 * @param {string} container - The HTML ID to render this widget within
 */
com.marklogic.widgets.workplaceadmin = function(container) {
  this.container = container;

  this._workplaceContext = new com.marklogic.widgets.workplacecontext();

  this._config = {
    widgetList: [
      {title: "Address Bar", classname: "com.marklogic.widgets.addressbar", description: "Update geocontext home by looking up text address."},
      {title: "Co-occurence", classname: "com.marklogic.widgets.cooccurence", description: "Shows two way co-occurence between elements in a document."},
      {title: "Create Document", classname: "com.marklogic.widgets.create", description: "Form builder used to generate a new document on submission."},
      {title: "Document Properties", classname: "com.marklogic.widgets.docproperties", description: "Shows the MarkLogic Properties of a Document."},
      {title: "XHTML Head Viewer", classname: "com.marklogic.widgets.docheadviewer", description: "Shows the Meta data elements within an XHTML document."},
      {title: "XHTML Content Viewer", classname: "com.marklogic.widgets.docviewer", description: "Displays XHTML content inline within a page."},
      {title: "Graph Explorer", classname: "com.marklogic.widgets.graphexplorer", description: "HighCharts powered node diagram to explore semantic subjects and related document facets."},
      {title: "HighCharts", classname: "com.marklogic.widgets.highcharts", description: "HighCharts powered charting."},
      {title: "Google Kratu", classname: "com.marklogic.widgets.kratu", description: "Google Kratu tabular display of content and semantic search results."},
      /*
      {title: "Document Markings", classname: "com.marklogic.widgets.markings", description: "Allows an XHTML document to have in-document security set to paragraphs, and supports suggesting semantic triples too."},
      */
      {title: "OpenLayers Map", classname: "com.marklogic.widgets.openlayers", description: "OpenLayers powered map supporting multiple layer types and geospatial search"},
      /*
      {title: "RDB2RDF", classname: "com.marklogic.widgets.rdb2rdf", description: "Convert and RDBMS database to a set of triples in MarkLogic."},
      */
      {title: "Search Bar", classname: "com.marklogic.widgets.searchbar", description: "Content search query box supporting the default grammar."},
      {title: "Search Sorter", classname: "com.marklogic.widgets.searchsort", description: "Sort search results based on existing sorting options."},
      {title: "Search Pager", classname: "com.marklogic.widgets.searchpager", description: "Page through search results."},
      {title: "Search Facets", classname: "com.marklogic.widgets.searchfacets", description: "Show facets returned from a search, and allow their selection."},
      /* TODO add search metrics */
      {title: "Search Results", classname: "com.marklogic.widgets.searchresults", description: "Show search results. Supports built in and custom rendering."},
      {title: "Search Results Selection", classname: "com.marklogic.widgets.selection", description: "List documents selected in Search Results."},
      {title: "Refresh Search", classname: "com.marklogic.widgets.refreshsearch", description: "Refresh button for a search on this page."},
      {title: "Structured Search Selection", classname: "com.marklogic.widgets.searchselection", description: "Select a structured search to execute."},
      {title: "Semantic Search Bar", classname: "com.marklogic.widgets.sparqlbar", description: "Visually create a sophisticated SPARQL query."},
      {title: "Semantic Search Results", classname: "com.marklogic.widgets.sparqlresults", description: "Show a summary of Subjects returned from a SPARQL query."},
      {title: "Semantic Subject Facts", classname: "com.marklogic.widgets.entityfacts", description: "Show the list of facts about a specific subject."},

      {title: "Tag Cloud", classname: "com.marklogic.widgets.tagcloud", description: "Show facet values as text, varying their font size by frequency."}

    ],
    layoutList: [
      {title: "Thin Thick", classname: "com.marklogic.widgets.layouts.thinthick", description: "Sidebar column on left of main column"},
      {title: "Thick Thin", classname: "com.marklogic.widgets.layouts.thickthin", description: "Sidebar column on right of main column"},
      {title: "Column", classname: "com.marklogic.widgets.layouts.column", description: "Single column, content widgets are horizontal panels"},
      {title: "Two Columns", classname: "com.marklogic.widgets.layouts.twocolumns", description: "Two columns, equal widths"},
      {title: "Three columns", classname: "com.marklogic.widgets.layouts.threecolumns", description: "Three columns, equal widths"},
      {title: "Thin Thick Thin", classname: "com.marklogic.widgets.layouts.thinthickthin", description: "Three columns, center column wider"}
    ],
    contextList: [
      {title: "Search Context", shortname: "SearchContext", classname: null,description: "Content Search Context"},
      {title: "Semantic Context", shortname: "SemanticContext", classname: null,description: "Semantic Search Context"},
      {title: "Document Context", shortname: "DocumentContext", classname: null,description: "Individual Document properties and content Context"},
      {title: "Geo Context", shortname: "GeoContext", classname: null,description: "Geospatial position Context"},
      {title: "Alert Context", shortname: "AlertContext", classname: null,description: "Alert configuration and receiving Context"},
      {title: "Data Context", shortname: "DataContext", classname: null,description: "Data joining and processing context"}
    ]
  };

  // load in globally registered widgets and contexts and layouts too
  var exts = com.marklogic.widgets.workplaceadminext;
  if (undefined != exts) {
    var widgets = exts.widgets;
    if (undefined != widgets) {
      for (var module in widgets) {
        var mod = widgets[module];
        if (Array.isArray(mod)) {
          // mix these in
          for (var w = 0,maxw = mod.length,wgt;w < maxw;w++) {
            wgt = mod[w];
            this._config.widgetList.push(wgt);
          }
        }
      }
    }
    // TODO sort widget list by title
    var layouts = exts.layouts;
    if (undefined != layouts) {
      for (var module in layouts) {
        var mod = layouts[module];
        if (Array.isArray(mod)) {
          // mix these in
          for (var w = 0,maxw = mod.length,layout;w < maxw;w++) {
            layout = mod[w];
            this._config.layoutList.push(layout);
          }
        }
      }
    }
    // TODO sort layout list by title

    // mixin contexts
    var contexts = exts.contexts;
    if (undefined != contexts) {
      for (var module in contexts) {
        var mod = contexts[module];
        if (Array.isArray(mod)) {
          // mix these in
          for (var w = 0,maxw = mod.length,context;w < maxw;w++) {
            context = mod[w];
            this._config.contextList.push(context);
          }
        }
      }
    }
  }


  this.closePublisher = new com.marklogic.events.Publisher();

  this._currentTab = "page";

  this._nextID = 1;

  this._configWrappers = new Array();

  this._refresh();
};

/**
 * Adds a list of custom supported widgets to the MLJS defaults
 * @deprecated use global registration method instead
 * @param {Array} widgetDefArray - The JSON array of widget definitions
 */
com.marklogic.widgets.workplaceadmin.prototype.addSupportedWidgets = function(widgetDefArray) {
  for (var i = 0, max = widgetDefArray.length, def;i < max;i++) {
    def = widgetDefArray[i];
    this._config.widgetList.push(def);
  }
};

/**
 * Adds a list of custom supported layouts to the MLJS defaults
 * @deprecated use global registration method instead
 * @param {Array} layoutDefArray - The JSON array of layout definitions
 */
com.marklogic.widgets.workplaceadmin.prototype.addSupportedLayouts = function(layoutDefArray) {
  for (var i = 0, max = layoutDefArray.length, def;i < max;i++) {
    def = layoutDefArray[i];
    this._config.layoutList.push(def);
  }
};

/**
 * Returns a summary of the widget class specified
 * @param {string} widgetclass - The fully qualified class name for the widget
 */
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
 * Helper function to draw the workplace edit screen full screen.
 *
 * @param {com.marklogic.widgets.workplacecontext} workplaceContext - The workplace to edit full screen
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

/**
 * Adds a listener function to be invoked when the workplace admin widget is closed
 * @param {function} lis - Close listener function
 */
com.marklogic.widgets.workplaceadmin.prototype.addCloseListener = function(lis) {
  this.closePublisher.subscribe(lis);
};

/**
 * Remove a close listener function
 * @param {function} lis = Close listener function
 */
com.marklogic.widgets.workplaceadmin.prototype.removeCloseListener = function(lis) {
  this.closePublisher.unsubscribe(lis);
};

/**
 * Sets the workplace context for this widget
 * @param {com.marklogic.widgets.workplacecontext} ctx - Workplace context instance
 */
com.marklogic.widgets.workplaceadmin.prototype.setWorkplaceContext = function(ctx) {
  mljs.defaultconnection.logger.debug("workplaceadmin.setWorkplaceContext: called.");
  this._workplaceContext = ctx;
};

/**
 * Returns the workplace context used by this widget
 * @return {com.marklogic.widgets.workplacecontext} ctx - The Workplace context instance
 */
com.marklogic.widgets.workplaceadmin.prototype.getWorkplaceContext = function() {
  return this._workplaceContext;
};

com.marklogic.widgets.workplaceadmin.prototype._refresh = function() {
  var str = "<div id='" + this.container + "-workplaceadmin' class='mljswidget panel panel-default workplaceadmin'>";
  str += "  <div class='panel-body'>";
  str += "   <div id='" + this.container + "-panels' class='workplaceadmin-panels'>";
  str += "    <div class='well'>";

  str += "<div class='page-header workplaceadmin-panels-heading-outer'>";
  str += "  Edit Workplace Page";
  str += "</div>";

  str += "<div class='panel panel-primary' id='" + this.container + "-page-outer'>"; // page settings
  str += "  <div id='" + this.container + "-page-heading' class='panel-heading workplaceadmin-page-heading'>";
  str += "   Page Settings";
  str += "</div>";
  str += "  <div id='" + this.container + "-page-content' class='panel-body workplaceadmin-page-content'>";
  /*
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
  */

  //str += "<form role='form'>";
  str += " <div class='form-group'>";
  str += "  <label>Page Title</label>";
  str += "  <input type='text' id='" + this.container + "-page-title' class='form-control' placeholder='Title' />";
  str += " </div>";
  str += " <div class='form-group'>";
  str += "  <label>URL(s)</label>";
  str += "  <textarea class='form-control' placeholder='Title' id='" + this.container + "-page-urls'></textarea>";
  str += " </div>";
  str += " <div class='form-group'>";
  str += "  <label>Main Layout</label>";
  str += " <select id='" + this.container + "-page-layout' class='form-control'>";
  for (var i = 0, l, max = this._config.layoutList.length;i < max;i++) {
    l = this._config.layoutList[i];
    var splits = l.classname.split(".");
    var shortname = splits[splits.length - 1];
    str += "  <option value='" + shortname + "' title='" + l.description + "' id='" + this.container + "-layoutselect-" + shortname + "'>" + l.title + "</option>";
  }
  str += " </select>";
  str += " </div>";
  //str += "</form>";

  str += "  </div>"; // panel body
  str += "</div>"; // panel



  str += "<div class='panel panel-info' id='" + this.container + "-widgets-outer'>";
  str += "  <div id='" + this.container + "-widgets-heading' class='panel-heading workplaceadmin-widgets-heading'>Widgets</div>";
  str += "  <div id='" + this.container + "-widgets-content' class='panel-body workplaceadmin-widgets-content hidden'>";
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
  str += "  </div>"; // list
  str += "</div>"; // panel


  str += "<div class='panel panel-info' id='" + this.container + "-contexts-outer'>";
  str += "  <div id='" + this.container + "-contexts-heading' class='panel-heading workplaceadmin-contexts-heading'>Contexts</div>";
  str += "  <div id='" + this.container + "-contexts-content' class='panel-body workplaceadmin-contexts-content hidden'>";
  str += "   <div id='" + this.container + "-contexts-list' class='workplaceadmin-contexts-list'><i>None</i></div>";
  str += "   <div id='" + this.container + "-contexts-add' class='workplaceadmin-contexts-add'>";
  //str += "<table class='mljstable'>";
  //str += "<tr><td>Add:</td><td>";


  str += "<div role='form' class='form-inline' >";
  str += " <div class='form-group'>";
  //str += "<label>Add</label>";
  str += "<select id='" + this.container + "-contexts-add-dropdown' class='form-control workplaceadmin-contexts-add-dropdown'>";


  for (var i = 0, maxi = this._config.contextList.length,ctx;i < maxi;i++) {
    ctx = this._config.contextList[i];
    str += "<option value='" + (ctx.classname || ctx.shortname) + "' title='" + ctx.title + "' id='" +
      this.container + "-contextselect-" + (ctx.classname || ctx.shortname) + "'>" + ctx.title + "</option>";
  }

  /*
  str += "  <option value='SearchContext' title='Search Context' id='" + this.container + "-contextselect-searchcontext'>Search Context</option>";
  str += "  <option value='SemanticContext' title='Semantic Context' id='" + this.container + "-contextselect-semanticcontext'>Semantic Context</option>";
  str += "  <option value='DocumentContext' title='Document Context' id='" + this.container + "-contextselect-documentcontext'>Document Context</option>";
  str += "  <option value='GeoContext' title='Geo Context' id='" + this.container + "-contextselect-geocontext'>Geo Context</option>";
  str += "  <option value='AlertContext' title='Alert Context' id='" + this.container + "-contextselect-alertcontext'>Alert Context</option>";
  */

  str += "</select>";
  str += "</div>"; // form group
  str += "<button class='btn btn-default' id='" + this.container + "-contexts-add-button'>";
  str += "<span class='glyphicon glyphicon-plus workplaceadmin-contexts-addcontext btn-fix'></span>";
  str += "</button>";
  str += "</div>";
  //str += "</td></tr>";
  //str += "</table>";
  str += "   </div>";
  str += "  </div>";
  str += "</div>"; // panel



  str += "<div class='panel panel-info' id='" + this.container + "-actions-outer'>";
  str += "  <div id='" + this.container + "-actions-heading' class='panel-heading workplaceadmin-actions-heading '>Actions</div>";
  str += "  <div id='" + this.container + "-actions-content' class='panel-body workplaceadmin-actions-content hidden'>";
  str += "   <button id='" + this.container + "-actions-onload' class='btn btn-default workplaceadmin-actions-onload'>On page load</button>";
  str += "  </div>";
  str += "</div>"; // panel


  str += "  <div class='workplaceadmin-buttonbar'>";
  str += "   <input class='btn btn-primary' id='" + this.container + "-save' value='Save' type='submit' />";
  str += "   <input class='btn btn-secondary' id='" + this.container + "-cancel' value='Cancel' type='submit' />";
  str += "  </div>";
  str += " </div>";



  str += "</div>"; // well


  str += " <div id='" + this.container + "-config' class='workplaceadmin-config container_12'>";
  str += "  <div id='" + this.container + "-config-layout' class=' container-fluid'></div>";
  str += "  <div id='" + this.container + "-config-contexts' class='container_12 row'>";
  str += "   <div id='" + this.container + "-config-contexts-context' class='grid_6 col-md-6'></div>";
  str += "   <div id='" + this.container + "-config-contexts-links' class='grid_6 col-md-6'></div>";
  str += "  </div>";
  str += "  <div id='" + this.container + "-config-actions' class='container_12 col-md-12 hidden'>";
  str += "   <div class='panel panel-default'>";
  str += "    <div class='panel-heading'>Configure Actions</div>";
  str += "    <div class='panel-body'>";
  str += "     <div id='" + this.container + "-config-actions-new' class='container_12 col-md-12 col-sx-12'></div>";
  str += "     <div id='" + this.container + "-config-actions-list' class='container_12 col-md-12 col-sx-12'></div>";
  str += "    </div>";
  str += "   </div>";
  str += "  </div>";
  str += " </div>";
  str += "</div>"; // panels
  str += "</div>"; // panel body
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
  document.getElementById(this.container + "-actions-onload").onclick = function(evt) {
    // show onload action list
    // get onload action list
    var actions = self._workplaceContext.getJson().actions.onload;
    // call action drawing code
    self._drawActions("onload",actions);
  };
  document.getElementById(this.container + "-contexts-add-button").onclick = function(evt) {
    // add new context instance
    var json = self._workplaceContext.getJson();
    var className = document.getElementById(self.container + "-contexts-add-dropdown").value;
    var ctxName = self._workplaceContext.nextWidgetName(className);
    self._workplaceContext._addWidgetName(ctxName); // internal function call hackery - not nice
    json.contexts.push({
      context: ctxName, type: className, register:[], config: {}
    });
    // refresh contexts list
    self._updateContextsList();
  };

  var urlsEl = document.getElementById(this.container + "-page-urls");
  urlsEl.onchange = function() {
    var val = urlsEl.value;
    var urls = val.split(",");
    console.log("URLS: " + val);
    self._workplaceContext.setUrls(urls);
  };

  var layoutEl = document.getElementById(this.container + "-page-layout");
  layoutEl.onchange = function() {
    var val = layoutEl.value;

    // update layout
    // get new layout zones supported
    var newLayout = new (com.marklogic.widgets.layouts[val] || com.marklogic.widgets.layoutsext[val])(self.container + "-config-layout");
    var newZoneList = newLayout.getZoneList();
    var lastZone = newZoneList[newZoneList.length - 1];

    var json = self._workplaceContext.getJson();
    var lastZoneIndex = 1;
    for (var a = 0, maxa = json.assignments.length, ass;a < maxa;a++) {
      ass = json.assignments[a];
      if (ass.zone == lastZone && ass.index >= lastZoneIndex) {
        lastZoneIndex = ass.index + 2; // 2 because of config wrapper widgets
      }
    }

    var zoneList = self._layout.getZoneList();
    // check existing assignments
    var missingZones = new Array();
    for (var z = 0,maxz = zoneList.length,zone;z < maxz;z++) {
      zone = zoneList[z];
      if (!newZoneList.contains(zone)) {
        missingZones.push(zone);
      }
    }
    for (var a = 0, maxa = json.assignments.length, ass;a < maxa;a++) {
      ass = json.assignments[a];
      if (missingZones.contains(ass.zone)) {
        // if zone now doesn't exist, move widgets to last other zone
        ass.zone = lastZone;
        ass.index = lastZoneIndex++;
      }
    }
    // TODO remove last zone drop zone from new zone, move new zones below widgets before each move

    // update json.layout
    self._workplaceContext.setLayout(val);
    // fire workplace update event (refreshes entire admin interface - loses changes?)
    self.updateWorkplace(self._workplaceContext);
  };

  document.getElementById(this.container + "-cancel").onclick = function(evt) {
    self._workplaceContext.revert();
    self.closePublisher.publish(true);
  };
  document.getElementById(this.container + "-save").onclick = function(evt) {
    self._persistTabChanges();

    // Remove our listeners (so we can kill their UI safely)
    self._workplaceContext.unregister(self); // TODO widget config wrappers too (if applicable?)

    self._workplaceContext.save(function(result) {
      // TODO do something like show a save message
      self.closePublisher.publish(true);
    });
  };
};

com.marklogic.widgets.workplaceadmin.prototype._persistTabChanges = function() {
  if ("page" == this._currentTab) {
    // save page settings
    this._workplaceContext.setSummary(
      document.getElementById(this.container + "-page-title").value,
      document.getElementById(this.container + "-page-urls").value.split(","),
      document.getElementById(this.container + "-page-layout").value,
      false); // TODO get shared status from checkbox
  }
  //if ("widgets" == this._currentTab) { // Can be adjusted whilst on page, widgets and contexts tab too
    // save layout
    this._saveLayout();
  //}
};

com.marklogic.widgets.workplaceadmin.prototype._showTab = function(tab) {
  this._persistTabChanges();
  mljs.defaultconnection.logger.debug("workplaceadmin._showTab: Showing " + tab);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-page-content"),("page" != tab));
  com.marklogic.widgets.hide(document.getElementById(this.container + "-widgets-content"),("widgets" != tab));
  if ("page" == tab || "widgets" == tab) {
    com.marklogic.widgets.hide(document.getElementById(this.container + "-config-layout"),false);
    com.marklogic.widgets.hide(document.getElementById(this.container + "-config-contexts"),true);
    com.marklogic.widgets.hide(document.getElementById(this.container + "-config-actions"),true);
  } else {
    if ("contexts" == tab) {
      com.marklogic.widgets.hide(document.getElementById(this.container + "-config-layout"),true);
      com.marklogic.widgets.hide(document.getElementById(this.container + "-config-contexts"),false);
      com.marklogic.widgets.hide(document.getElementById(this.container + "-config-actions"),true);
    } else {
      com.marklogic.widgets.hide(document.getElementById(this.container + "-config-layout"),true);
      com.marklogic.widgets.hide(document.getElementById(this.container + "-config-contexts"),true);
      com.marklogic.widgets.hide(document.getElementById(this.container + "-config-actions"),false);
    }
  }
  com.marklogic.widgets.hide(document.getElementById(this.container + "-contexts-content"),("contexts" != tab));
  com.marklogic.widgets.hide(document.getElementById(this.container + "-actions-content"),("actions" != tab));
  this._currentTab = tab;

  // styles
  var pagePanelEl = document.getElementById(this.container + "-page-outer");
  if ("page" == tab) {
    com.marklogic.widgets.removeClass(pagePanelEl,"panel-info");
    com.marklogic.widgets.addClass(pagePanelEl,"panel-primary");
  } else {
    com.marklogic.widgets.removeClass(pagePanelEl,"panel-primary");
    com.marklogic.widgets.addClass(pagePanelEl,"panel-info");
  }
  var widgetsPanelEl = document.getElementById(this.container + "-widgets-outer");
  if ("widgets" == tab) {
    com.marklogic.widgets.removeClass(widgetsPanelEl,"panel-info");
    com.marklogic.widgets.addClass(widgetsPanelEl,"panel-primary");
  } else {
    com.marklogic.widgets.removeClass(widgetsPanelEl,"panel-primary");
    com.marklogic.widgets.addClass(widgetsPanelEl,"panel-info");
  }
  var contextsPanelEl = document.getElementById(this.container + "-contexts-outer");
  if ("contexts" == tab) {
    com.marklogic.widgets.removeClass(contextsPanelEl,"panel-info");
    com.marklogic.widgets.addClass(contextsPanelEl,"panel-primary");
  } else {
    com.marklogic.widgets.removeClass(contextsPanelEl,"panel-primary");
    com.marklogic.widgets.addClass(contextsPanelEl,"panel-info");
  }
  var actionsPanelEl = document.getElementById(this.container + "-actions-outer");
  if ("actions" == tab) {
    com.marklogic.widgets.removeClass(actionsPanelEl,"panel-info");
    com.marklogic.widgets.addClass(actionsPanelEl,"panel-primary");
  } else {
    com.marklogic.widgets.removeClass(actionsPanelEl,"panel-primary");
    com.marklogic.widgets.addClass(actionsPanelEl,"panel-info");
  }
};

com.marklogic.widgets.workplaceadmin.prototype._saveLayout = function() {
  // NB This function is not dangerous because context maintains previously saved (to server) widget config too

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

com.marklogic.widgets.workplaceadmin.prototype._widgetRemoved = function(data) {
  // data = {widget: name, configwrapper: obj}
  this._layout.remove(data.widget);
  var pos = -1;
  for (var cw = 0,maxcw = this._configWrappers.length,wrapper;cw < maxcw && (-1 == pos);cw++) {
    wrapper = this._configWrappers[cw];
    if (wrapper.equals(data.configwrapper)) {
      pos = cw;
    }
  }
  if (-1 != pos) {
    this._configWrappers.splice(pos,1);
  }

  var json = this._workplaceContext.getJson();

  // remove widget from assignments
  pos = -1;
  for (var a = 0,maxa = json.assignments.length,ass;a < maxa && (-1 == pos);a++) {
    ass = json.assignments[a];
    if (ass.widget == data.widget) {
      pos = a;
    }
  }
  if (-1 != pos) {
    json.assignments.splice(pos,1);
  }
  /*

  // remove from zone wigets
  pos = -1;
  var thezone = null;
  for (var z = 0;maxz = this.zoneWidgets.length,zone;z < maxz && (-1==pos);z++) {
    zone = this.zoneWidgets[z];
    for (var w = 0,maxw = zone.length,wgt;w < maxw && (-1==pos);w++) {
      wgt = zone[w];
      if (wgt == data.widget) {
        pos = w;
        thezone = zone;
      }
    }
  }
  zone.splice(pos,1);
  */

  // remove widget from config
  pos = -1;
  for (var w = 0,maxw = json.widgets.length,wgt;w < maxw && -1 == pos;w++) {
    wgt = json.widgets[w];
    if (wgt.widget == data.widget) {
      pos = w;
    }
  }
  json.widgets.splice(pos,1);
  // remove widget from context registers
  for (var c = 0,maxc = json.contexts.length,ctx;c < maxc;c++) {
    ctx = json.contexts[c];
    pos = ctx.register.indexOf(data.widget);
    if (-1 != pos) {
      ctx.register.splice(pos,1);
    }
  }
};

// Adds a new widget instance to the specified zone
com.marklogic.widgets.workplaceadmin.prototype._addClassToZone = function(widgetclass,zone,order) {
  var self = this;

  // create new layout dropzone
  var dzElid = this._layout.createPlaceholder(zone);
  var insert = new com.marklogic.widgets.dropzone(dzElid);
  var iAss = this._layout.registerAssignment(dzElid,dzElid); // no 'widgetname' so re-use elid as widgetname
  this._addDzAccept(insert, iAss.zone, iAss.order, iAss.elementid);


  // create widget instance
  var wgtElid = this._layout.createPlaceholder(zone);
  var instanceName = self._workplaceContext.nextWidgetName(widgetclass); // data.data = widgetclassname
  var widget = self._workplaceContext.addWidget(instanceName,widgetclass,{});
  // add to layout
  //var wid = self._layout.appendToZone(widget.widget,zone,"");

  // create new config wrapper
  var wgt = new com.marklogic.widgets.configwrapper(wgtElid);
  wgt.setWorkplaceContext(this._workplaceContext);
  var wAss = this._layout.registerAssignment(wgtElid,instanceName);
  this._configWrappers.push(wgt);
  wgt.addWidgetRemovedListener(function(data){self._widgetRemoved(data);});

  // update workplace config and register event handlers

  wgt.onto("widgetconfig",["layoutposition"],{type: "widgetconfig", data: widget});
  // get json config for this widget
  var cfg = self._workplaceContext.getWidgetInfo(widget.widget);
  // get class of widget, and it's config description
  var cls = com.marklogic.widgets.workplace._getWidgetClass(cfg.type);
  if (undefined != cls.getConfigurationDefinition) {
    cls = cls.getConfigurationDefinition();
  } else {
    cls = {};
  }
  wgt.wrap(widget.widget,widgetclass,cls,cfg.config);

  // now move new widget up one (so it's before the drop zone it was dropped on to)
  //if (undefined == order) {
    // dropped at end of drop zone
  //  order = iAss.order - 1;
  //}
  this._layout.moveToPosition(widget.widget,zone,order); // should move it's spacer too
  // TODO move spacer and config wrapper widget independantly (don't rely on layout doing this for us - creates logical dependency)

  // Auto register widget with all contexts present
  var json = this._workplaceContext.getJson();
  for (var c = 0,maxc = json.contexts.length,ctx;c < maxc;c++) {
    ctx = json.contexts[c];
    if (undefined == ctx.register) {
      ctx.register = new Array();
    }
    if (!ctx.register.contains(widget.widget)) {
      ctx.register.push(widget.widget);
    }
    // should auto update UI when switch to context config tab
  }

  return widget;
};

// Adds drop action handlers and performs those actions
com.marklogic.widgets.workplaceadmin.prototype._addDzAccept = function(aDrop, zone, position,layoutelementid) {
  mljs.defaultconnection.logger.debug("addDzAccept called for: zone: " + zone + ", order: " + position + ", layoutelementid: " + layoutelementid);
  var self = this;
  // accept new widget classes being dropped
  aDrop.accept("layoutposition",["widgetclass"],function(data) {
    // determine current (not initial) position of drop zone
    var curPos = self._layout.getAssignmentByPlaceholder(layoutelementid).item; // fetch CURRENT order based on layout's stored ID value

    if ("widgetclass" == data.type) {

      // we've had a widget class image dropped on us
      mljs.defaultconnection.logger.debug("APPENDING INSERT WIDGET CLASS " + data + " ON TO DROP ZONE " + zone +
        " OF LAYOUT AT POSITION: " + position + ", WITH CURRENT ZONE: " + curPos.zone + " AND ORDER: " + curPos.order);

      var widget = self._addClassToZone(data.data,curPos.zone,curPos.order);

      // add to widgetconfig at this position
      // NB addClassToZone does the move for us
      //self._layout.moveToPosition(widget.widget,curPos.zone,curPos.order);
    } else {
      // widget config wrapper
      mljs.defaultconnection.logger.debug("layout position widgetconfig drop handler called for: " + JSON.stringify(data));
      // data = { widget: widgetName, elementid: layoutHtmlId, ... } in layout
      // instruct layout to reposition html
      self._layout.moveToPosition(data.data.widget,curPos.zone,curPos.order); // data.data.widget = widget instance name
      // reconfigure widgetcontext appropriately
    }
  });
};

/**
 * Instructs this workplace admin widget to redraw based on the current configuration in the workplace context
 */
com.marklogic.widgets.workplaceadmin.prototype.updateWorkplace = function(ctx) { // TODO remove ctx parameter???
  // do something with this._workplaceContext.getJson()

  // TODO blow away current layout

  // draw layout inside this container

  var json = this._workplaceContext.getJson();
  var self = this;

  if (undefined == json) {
    console.log("WARNING: workplaceadmin.updateWorkplace: ctx json null!");
    return; // sanity check for concurrent updates
  }

  // load top level layout for this page (or panel we are managing, at least)
  mljs.defaultconnection.logger.debug("workplaceadmin.updateWorkplace: Creating layout");
  mljs.defaultconnection.logger.debug("workplaceadmin.updateWorkplace: Got JSON: " + JSON.stringify(json));
  this._layout = new (com.marklogic.widgets.layouts[json.layout] || com.marklogic.widgets.layoutsext[json.layout])(this.container + "-config-layout");
  com.marklogic.widgets.hide(document.getElementById(this.container + "-config-layout"),false);
  com.marklogic.widgets.hide(document.getElementById(this.container + "-config-contexts"),true);

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
    var dzElid = self._layout.createPlaceholder(zone);
    var bDrop = new com.marklogic.widgets.dropzone(dzElid);
    self._layout.registerAssignment(dzElid,dzElid); // no widget name so re-use drop zone elid
    bDrop.accept("layoutposition",["widgetclass","widgetconfig"],function(data) {
      // we've had a widget class image dropped on us
      console.log("APPENDING WIDGET CLASS " + data + " ON TO DROP ZONE " + zone + " OF LAYOUT");

      if ("widgetclass" == data.type) { // <- should we use this?
      //if (typeof(data.data) == "string") {
        self._addClassToZone(data.data,zone);
      } else {
        // existing widget being re-ordered
        var curPos = self._layout.getAssignmentByPlaceholder(dzElid).item; // fetch CURRENT order based on layout's stored ID value

        self._layout.moveToPosition(data.data.widget,curPos.zone,curPos.order); // data.data.widget = widget instance name
      }
    });
  };

  // Create wrapper config widget for each widget in it's area
  for (var z = 0, maxz = zones.length, zone;z < maxz;z++) {
    zone = zones[z];

    // create wrapper for each widget
    for (var w = 0, maxw = zoneWidgets[zone].length, widget;w < maxw;w++) {
      widget = zoneWidgets[zone][w];

      // create insert zone before each widget

      //var aAss = {widget: "dropzone-" + zone + "-" + self._nextID++};
      //this._layout.generateId(zone,aAss);
      var dzElid = this._layout.createPlaceholder(zone);
      var aDrop = new com.marklogic.widgets.dropzone(dzElid);
      var dzAss = this._layout.registerAssignment(dzElid,dzElid); // no widgetname for drop zones, so re-use element id

      // create widget
      var wgtElid = this._layout.createPlaceholder(zone);
      var wgt = new com.marklogic.widgets.configwrapper(wgtElid);
      wgt.setWorkplaceContext(this._workplaceContext);
      var wgtAss = this._layout.registerAssignment(wgtElid,widget.widget);
      wgt.addWidgetRemovedListener(function(data){self._widgetRemoved(data);});

      // now reposition (not required - appending in order)


      this._addDzAccept(aDrop, zone, dzAss.order, dzElid); // w ok to use at this point

      this._configWrappers.push(wgt);
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
      wgt.wrap(widget.widget,cfg.type,cls,cfg.config);
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


  // CONTEXT CONFIGURATION AREA
  this._updateContextsList();


  // TODO load other state information shown in left bar from JSON (is there any? Actions?)



  this._layout.printZoneInfo();

  mljs.defaultconnection.logger.debug("workplaceadmin.updateWorkplace: Finished creating layout");
};


com.marklogic.widgets.workplaceadmin.prototype._updateContextsList = function() {
  var self = this;
  var json = this._workplaceContext.getJson();
  var contexts = json.contexts;

  var contextListEl = document.getElementById(this.container + "-contexts-list");
  var ctxStr = "";
  // TODO any need to save existing one, if shown? - NO? ConfigWrapper handles this live?
  for (var c = 0, maxc = contexts.length,ctx;c < maxc;c++) {
    ctx = contexts[c];
    ctxStr += "<div class='btn-toolbar'>";
    ctxStr += "<div id='" + this.container + "-context-" + ctx.context + "' class='btn-group workplaceadmin-contexts-listitem'>";
    ctxStr += "<button type='button' class='btn btn-danger' id='" + this.container + "-context-name-" + ctx.context + "-del'>";
    ctxStr += "<span class='glyphicon glyphicon-remove workplaceadmin-contexts-removecontext btn-fix'></span>";
    ctxStr += "</button>";
    ctxStr += "<button class='btn btn-default'>";
    ctxStr += "<span class='workplaceadmin-contexts-listitem-text'>";
    ctxStr += ctx.context;
    //ctxStr += " <small>(" + ctx.type + ")</small>"
    ctxStr += "</span> ";
    ctxStr += "</button>";
    ctxStr += "</div>";
    ctxStr += "</div>";
  }

  // Set output html
  contextListEl.innerHTML = ctxStr;

  var addDelHandler = function(ctx) {
    var divelid = self.container + "-context-" + ctx.context;

    var elid = self.container + "-context-name-" + ctx.context + "-del";
    var delel = document.getElementById(elid);
    delel.onclick = function(evt) {
      // TODO if this deleted context is showing on the RHS at the moment, change to blank 'select a context' pane

      // delete context from workplace context
      self._workplaceContext.removeContext(ctx.context);

      // delete html
      var thediv = document.getElementById(divelid);
      thediv.parentNode.removeChild(thediv);
    };
  };

  // Add click handlers for contexts
  var addCtxHandler = function(ctxEl,ctxjson) {
    ctxEl.onclick = function(event) {
      // Show context configuration in RHS pane
      // load content
      var wrapper = new com.marklogic.widgets.configwrapper(self.container + "-config-contexts-context");
      wrapper.setWorkplaceContext(self._workplaceContext);
      wrapper.hideRemoveButton();

      var widgetClass = self._workplaceContext.getContextClass(ctxjson.type);
      // get configuration definition
      var classConfig = widgetClass.getConfigurationDefinition();
      /*
      if ("SearchContext" == ctxjson.type) {
        classConfig = mljs.defaultconnection.searchcontext.getConfigurationDefinition();
      } else if ("SemanticContext" == ctxjson.type) {
        classConfig = mljs.defaultconnection.semanticcontext.getConfigurationDefinition();
      } else if ("DocumentContext" == ctxjson.type) {
        classConfig = mljs.defaultconnection.documentcontext.getConfigurationDefinition();
      } else if ("GeoContext" == ctxjson.type) {
        classConfig = mljs.defaultconnection.geocontext.getConfigurationDefinition();
      } else if ("AlertContext" == ctxjson.type) {
        classConfig = mljs.defaultconnection.alertcontext.getConfigurationDefinition();
      }
      */
      wrapper.wrap(ctxjson.context,ctxjson.type,classConfig,ctxjson.config);

      // NOW LINKED WIDGETS LIST
      var mine = new Array();
      var str = "<div class='mljswidget panel panel-default config-context-links'>"
      str += "<div class='panel-heading'>Widgets to Register</div>";
      str += "<div class='panel-body'>";
      str += "<select size='10' multiple='multiple' id='" + self.container + "-config-contexts-links-link'>";
      for (var w = 0, maxw = json.widgets.length,wgt;w < maxw;w++) {
        wgt = json.widgets[w];
        str += "<option ";
        if (ctxjson.register.contains(wgt.widget)) {
          str += "selected='selected' ";
        }
        str += "value='" + wgt.widget + "'>" + wgt.widget + "</widget>";
      }
      str += "</select></div></div>";
      document.getElementById(self.container + "-config-contexts-links").innerHTML = str;

      // action handlers
      var selEl = document.getElementById(self.container + "-config-contexts-links-link");
      selEl.onchange = function(evt) {
        ctxjson.register = com.marklogic.widgets.getSelectValues(selEl);
      };

      // make visible
      com.marklogic.widgets.hide(document.getElementById(self.container + "-config-layout"),true);
      com.marklogic.widgets.hide(document.getElementById(self.container + "-config-contexts"),false);

      // stop event propagation
      event.stopPropagation();
      return false;
    };
  };
  for (var c = 0, maxc = contexts.length,ctx;c < maxc;c++) {
    ctx = contexts[c];
    var ctxEl = document.getElementById(self.container + "-context-" + ctx.context);
    addCtxHandler(ctxEl,ctx);
    addDelHandler(ctx);
  }
};

com.marklogic.widgets.workplaceadmin.prototype._drawActions = function(actionListName,actions) {
  // Create action orderer widget
  var creator = new com.marklogic.widgets.actioncreator(this.container + "-config-actions-new");

  // create configwrapper set for actions
  var orderedconfig = new com.marklogic.widgets.orderedconfig(this.container + "-config-actions-list");
  var self = this;
  orderedconfig.addOrderChangeListener(function(oc) {
    // do something with new order (E.g. update workplaceContext)
    self._workplaceContext.setActionList(actionListName,oc);
  });
  // ensure the target and method and other such parameters managed by creator are not editable by hand
  orderedconfig.readOnly([{type: "javascript", readonly:["target","method"]}]);
  // no drop zone for new elements
  orderedconfig.dropzones(true,false); // first is re-arrange zones, second is append zone (last zone)
  // give array of items to draw, and json dot delimited path to id field
  var jsdefs = {javascript: {
    target: {type: "instance", default: null, title: "Target", description: "Class to call method on"},
    method: {type: "method", default: null, title: "Method", description: "Method name to call"},
    parameters: {type:"multiple",default:[], minimum:0,title: "Parameters",description: "Method Parameters",
      childDefinitions: {
        type: {type: "jstype", default: "string", title: "Type", description: "Parameter type"},
        value: {type: "jsvalue", default: null, title: "Value", description: "Parameter value"}
      }
    }
  }}; // only one type supported at the moment - javascript function call (perhaps raise/handle event, page change, in future)
  var actions = this._workplaceContext.getJson().actions;
  var actionList = [];
  if (undefined != actions) {
    var list = actions[actionListName];
    if (undefined != list && Array.isArray(list)) {
      actionList = list;
    }
  }
  this._workplaceContext.setActionList(actionListName,actionList);

  orderedconfig.configure(actionList,jsdefs,"action");


  creator.addActionCreatedListener(function(actionJson) {
    // add to workplace context json
    actionList.push(actionJson);
    self._workplaceContext.setActionList(actionListName,actionList);
    // add new configwrapper at end
    orderedconfig.append(actionJson);
  });

  creator.updateWorkplace(this._workplaceContext);
  orderedconfig.updateWorkplace(this._workplaceContext);
};














/**
 * Generic ordered config widget. Takes an array of config description objects (widgets, action list, etc) and
 * renders that list, with drop zones for re-ordering and new items.
 * @param {string} container - HTML id of the element this widget should be rendered within.
 */
com.marklogic.widgets.orderedconfig = function(container) {
  this.container = container;

  this._workplaceContext = null;

  this._title = "Actions";
//  this._configs = new Array(); // ??? get from context
  this._readonly = new Array(); // [{type: "objType", readonly:["item1","item2.path", ...]}, ...]
  this._drawOrderDropzones = true;
  this._drawNewDropzone = true;
  this._allowRemoval = true;
  this._nameJsonPath = "name";

  this._nextidx = 0;

  this._ordered = new com.marklogic.util.linkedlist();

  this._orderChangePublisher = new com.marklogic.events.Publisher();
};

com.marklogic.widgets.orderedconfig.prototype.updateWorkplace = function(ctx) {
  this._workplaceContext = ctx;
  this._refresh();
};

com.marklogic.widgets.orderedconfig.prototype.addOrderChangeListener = function(func) {
  this._orderChangePublisher.subscribe(func);
};

com.marklogic.widgets.orderedconfig.prototype.removeOrderChangeListener = function(func) {
  this._orderChangePublisher.unsubscribe(func);
};

com.marklogic.widgets.orderedconfig.prototype.readOnly = function(roArray) {
  this._readonly = roArray;
};

com.marklogic.widgets.orderedconfig.prototype.title = function(title) {
  this._title = title;
};

com.marklogic.widgets.orderedconfig.prototype.dropzones = function(drawOrderDropzones,drawNewDropzone) {
  this._drawOrderDropzones = drawOrderDropzones;
  this._drawNewDropzone = drawNewDropzone;
};

com.marklogic.widgets.orderedconfig.prototype.configure = function(instances,definitions,nameJsonPath) {
  //this._configs = configList; // get from context
  this._definitions = definitions;
  this._instances = instances;
  this._nameJsonPath = nameJsonPath;

  this._refresh();
};

com.marklogic.widgets.orderedconfig.prototype._fireNewOrder = function() {
  var oconfig = new Array();
  var ordered = this._ordered.getOrderedItems();
  for (var i = 0,maxi = ordered.length,item;i < maxi;i++) {
    item = ordered[i];
    oconfig.push(item.getValue().config);
  }
  this._orderChangePublisher.publish(oconfig);
};


com.marklogic.widgets.orderedconfig.prototype._refresh = function() {
  this._ordered = new com.marklogic.util.linkedlist();
  var s = "<div id='" + this.container + "-orderedconfig' class='mljswidget panel panel-default orderedconfig'>";
  s += "<div class='panel-heading'>" + this._title + "</div><div class='panel-body' id='" + this.container + "-list'>";


  // add configs to list
  if (null != this._workplaceContext) {
    // This returns classes NOT instances!
    for (var a = 0,maxa = this._instances.length,inst;a < maxa;a++) {
      inst = this._instances[a]; // {action: "searchcontext1.doSimpleQuery",type: "javascript", config: {target: "searchcontext1", method: "doSimpleQuery"}}

      var res = this._addConfig(inst,a);
      s += res.html;
    } // end action loop

    this._nextidx = maxa;

    if (true === this._drawNewDropzone) {
      s += " <div id='" + this.container + "-appenddz'></div>";
    }
    s += "</div></div>";
  }
  // save html
  document.getElementById(this.container).innerHTML = s;

  var self = this;
  var item = this._ordered.forEach(function(item) {
    // draw current order and dropzones
    // set up event handlers
    // render configs within their divs
    self._addWrapper(item);
  });
};


com.marklogic.widgets.orderedconfig.prototype.append = function(actionJson) {
  var item = this._addConfig(actionJson,this._nextidx++); // TODO make generic rther than just actions
  // APPEND CODE - item.html
  var el = document.getElementById(this.container + "-list");
  com.marklogic.widgets.appendHTML(el,item.html);

  this._addWrapper(item.item);
};


/* Returns item definition */
com.marklogic.widgets.orderedconfig.prototype._addConfig = function(json,idx) {
  var s = "";
  var inst = null;
      var def = this._definitions[json.type];
        // create outer div
        var elid = this.container + "-item-" + idx;
                // create parent for each dropzone AND config PAIR
                s += "<div id='" + elid + "'>";
                s += " <div id='" + elid + "-dz'></div>";
                s += " <div id='" + elid + "-config'></div>";
                s += "</div>";
        inst = { html:s, item: this._ordered.append(json[this._nameJsonPath],{config: json.config, type: json.type, def: def, element: elid})}; // TODO process path rather than use directly as a name

  return inst;
};

com.marklogic.widgets.orderedconfig.prototype._addWrapper = function(item) {
  var self = this;

  var value = item.getValue(); // value = {config: config, element: elid}
  var dz = new com.marklogic.widgets.dropzone(value.element + "-dz"); // TODO configure dropzone
  var wrapper = new com.marklogic.widgets.configwrapper(value.element + "-config");
  wrapper.addWidgetRemovedListener(function(data){
    //self._widgetRemoved(data);}
    self._ordered.remove(item.getName());
    var meel = document.getElementById(item.getValue().element);
    meel.parentNode.removeChild(meel);
    // fire order update
    self._fireNewOrder();
  });

  // update workplace config and register event handlers

  wrapper.setWorkplaceContext(this._workplaceContext);
  // TODO D&D repositioning config - wrapper.onto("widgetconfig",["layoutposition"],{type: "widgetconfig", data: widget});

  wrapper.wrap(item.getName(),value.type,value.def,value.config); // widgetName,classname,configDescription,currentConfig
};















/**
 * A generic drop zone widget. Used by workplace admin, and in future search results collector.
 * @constructor
 */
com.marklogic.widgets.dropzone = function(container) {
  this.container = container;
  this._accepted = [];
  this._callback = null;

  this._init();
};

com.marklogic.widgets.dropzone.prototype._init = function() {
  // draw widget
  var str = "<div class='mljswidget panel panel-info dropzone'>";
  str += " <div class='dropzone-target' id='" + this.container + "-target'>";
  str += "<p class='dropzone-text'><span class='glyphicon glyphicon-download'></span> Drop here</p>";
  //str += "  <img src='/images/mljs/dropzone.png' />";
  //str += "  <p class='dropzone-text'>Drop here</p>";
  str += " </div>";
  str += "</div>";

  document.getElementById(this.container).innerHTML = str;
};

/**
 * Instructs this widget to accept a particular set of JavaScript object classes when dropped on this widget
 * @param {string} dropzoneClass - This drop zone's object class (E.g. search results collector)
 * @param {Array} draggableTypeAcceptArray - String array of associated object classes to accept (E.g. search result)
 * @param {function} callback - The callback to fire upon a successful (permitted) drop
 */
com.marklogic.widgets.dropzone.prototype.accept = function(dropzoneClass,draggableTypeAcceptArray,callback) {
  com.marklogic.widgets.dnd.accept(this.container + "-target",dropzoneClass,draggableTypeAcceptArray,callback);
};




















/**
 * Widget to draw and allow interaction with a widget's configuration parameters. Used by the workplace admin widget only.
 * @constructor
 */
com.marklogic.widgets.configwrapper = function(container) {
  this.container = container;
  mljs.defaultconnection.logger.debug("configwrapper: Constructor: Creating configwrapper within element with id: " + container);
  this._widgetName = "";
  this._configDescription = null;
  this._config = null;
  this._type = null;
  this._deleteHidden = false;

  this._workplaceContext = null;
  this.__nextID = 1;

  this._removedPublisher = new com.marklogic.events.Publisher();

  this._init();
};

com.marklogic.widgets.configwrapper.prototype.equals = function(otherconfigwrapper) {
  return (this._widgetName == otherconfigwrapper._widgetName);
};

/**
 * Adds a listener for when the remove button is clicked
 * @param {function} func - The listener to add
 */
com.marklogic.widgets.configwrapper.prototype.addWidgetRemovedListener = function(func) {
  this._removedPublisher.subscribe(func);
};

/**
 * Removes a listener for when the remove button is clicked
 * @param {function} func - The listener to remove
 */
com.marklogic.widgets.configwrapper.prototype.removeWidgetRemovedListener = function(func) {
  this._removedPublisher.unsubscribe(func);
};


/**
 * Returns the human readable name for this widget
 */
com.marklogic.widgets.configwrapper.prototype.getWidgetName = function() {
  return this._widgetName;
};

/**
 * Returns the fully qualified widget class
 */
com.marklogic.widgets.configwrapper.prototype.getWidgetType = function() {
  return this._type;
};

/**
 * Returns the widget JSON configuration object
 */
com.marklogic.widgets.configwrapper.prototype.getWidgetConfig = function() {
  return this._config;
};

/**
 * Sets the workplace context
 */
com.marklogic.widgets.configwrapper.prototype.setWorkplaceContext = function(wpc) {
  this._workplaceContext = wpc;
};

/**
 * Returns the workplace context
 */
com.marklogic.widgets.configwrapper.prototype.getWorkplaceContext = function() {
  return this._workplaceContext;
};

/**
 * Allows this configuration UI widget to be dragged on to a configuration drop zone widget
 * @param {string} draggableClass - This widget's associated class (E.g. widget config)
 * @param {Array} droppableTypeAcceptArray - The widget's this config wrapper may be legally dropped upon
 * @param {json|function} dataOrCallback - The data to send to the drop zone handler function, or a function that returns this data object (JSON)
 */
com.marklogic.widgets.configwrapper.prototype.onto = function(draggableClass,droppableTypeAcceptArray,dataOrCallback) {
  mljs.defaultconnection.logger.debug("configwrapper.onto: Adding drag handler for " + this.container + "-name");
  com.marklogic.widgets.dnd.onto(this.container + "-name",draggableClass,droppableTypeAcceptArray,dataOrCallback);
};

/**
 * Refreshes this widget based on the specified widget config
 * @param {string} widgetName - The widget name to draw. E.g. searchbar1
 * @param {json} configDescription - The description (types, default value, legal config elements) for this widget's configuration
 * @param {json} currentConfig - The current JSON configuration object values
 */
com.marklogic.widgets.configwrapper.prototype.wrap = function(widgetName,classname,configDescription,currentConfig) {
  this._widgetName = widgetName;
  this._configDescription = configDescription;
  this._config = currentConfig;
  this._type = classname;

  this._updateWidgetConfig();
};

com.marklogic.widgets.configwrapper.prototype._updateWidgetConfig = function() {
  // update UI for this configuration
  document.getElementById(this.container + "-name").innerHTML = this._widgetName;
  this._genConfigHTML(this._config,this._configDescription,0,this.container + "-cfg");
};


com.marklogic.widgets.configwrapper.prototype._genConfigHTMLConf = function(json,def,level,name,confslist) {
  var str = "";

  // get actual current config values (if specified, if not use defaults from definition)
  var c = undefined;
  if (undefined != json) {
    c = json[name];
  }
  // get config descriptor for this element - get type from there, not introspection (more exacting)
  var d = def[name];

  //str += "<tr>";
  str += "<div class='form-group'>";
  var addtitle = function() {
  //  str += "<td title='" + d.description + "'>" + d.title + "</td><td>";
    str += "<label title='" + d.description + "'>" + d.title + "</label>";
  };

  var conf = {id: this.__nextID++, json: c, def: d,str: ""};
  var self = this;

  var usedDefault = false;

  if ("string" == d.type || "double" == d.type || "jsvalue" == d.type || "method" == d.type) {
    // text box for jsvalue

    addtitle();
    var val = c;
    if (undefined == c) {
      val = d.default;
      usedDefault = true;
    }
    if (null == c) {
      val = "";
      json[name] = "";
      usedDefault = false; // stops overriding with null default value
    }
    if ("object" == typeof(val)) {
      // json string
      val = JSON.stringify(val);
    }
    str += "<input class='form-control' type='text' id='" + this.container + "-" + conf.id + "' value='" + val.htmlEscape() + "' />";
    conf.addhandler = function() {
      var el = document.getElementById(self.container + "-" + conf.id);
      el.onchange = function() {
        // TODO if double, check is a valid double
        json[name] = el.value;
      };
    };
  } else if ("enum" == d.type) {
    addtitle();
    var val = c;
    if (undefined == c) {
      val = d.default;
      usedDefault = true;
    }
    var hasSelected = false;
    str += "<select class='form-control' id='" + this.container + "-" + conf.id + "'>";
    for (var i = 0,opt,max=d.options.length; i < max;i++) {
      opt = d.options[i];
      str += "<option value='" + opt.value + "' title='" + opt.description + "' ";
      if (opt.value === val) {
        str += "selected='selected' ";
        hasSelected = true;
      }
      str += ">" + opt.title + "</option>"; // TODO selected=selected if select.value doesn't work
    }
    if (!hasSelected /*&& null == d.default*/ && undefined != d.options[0]) {
      json[name] = d.options[0].value;
      usedDefault = false;
    }
    str += "</select>";
    conf.addhandler = function() {
      var el = document.getElementById(self.container + "-" + conf.id);
      el.onchange = function() {
        json[name] = el.value;
      };
    };
  } else if ("positiveInteger" == d.type || "integer" == d.type || "double" == d.type || "float" == d.type) {
    var checkers = {
      positiveInteger: function(value) {
        return (("" + value) == ("" + Math.floor(value))) &&
               ((undefined == d.minimum) || (undefined != d.minimum && value >= d.minimum)) &&
               ((undefined == d.maximum) || (undefined != d.maximum && value <= d.maximum)) &&
               value >= 0;
      },
      integer: function(value) {
        return (("" + value) == ("" + Math.floor(value))) &&
               ((undefined == d.minimum) || (undefined != d.minimum && value >= d.minimum)) &&
               ((undefined == d.maximum) || (undefined != d.maximum && value <= d.maximum));
      },
      double: function(value) {
          return ("" + (1.0 * value)) == value;
      },
      float: function(value) {
          return ("" + (1.0 * value)) == value;
      }
    };
    var myChecker = checkers[d.type];

    addtitle();
    var val = c;
    if (undefined == c) {
      val = "" + d.default;
      usedDefault = true;
    } else {
      val = "" + val;
    }
    // handle min/max - via event handlers on +/- and manual changing
    // handle invalid (E.g. text) values - try { 1* val} catch (oopsie) and ""+floor(val) == ""+val (integer not float)
    str += "<div class='input-group'>";
    str += "<input class='form-control' type='text' id='" + self.container + "-" + conf.id + "' value='" + val.htmlEscape() + "' />";
    str += "<div class='input-group-addon glyphicon glyphicon-minus configwrapper-decrement' id='" + self.container + "-" + conf.id + "-decrement'></div>";
    str += "<div class='input-group-addon glyphicon glyphicon-plus configwrapper-increment' id='" + self.container + "-" + conf.id + "-increment'></div>";
    str += "</div>";
    conf.addhandler = function() {
      var el = document.getElementById(self.container + "-" + conf.id);
      el.onchange = function() {
        // validate value. If crap, use current value
        var val = el.value;
        try {
          if ( myChecker(val) ) {
            // valid value;
            mljs.defaultconnection.logger.debug("configwrapper: positiveInteger.onchange: Valid valud: " + val + " for " + name);
            json[name] = val;
          } else {
            mljs.defaultconnection.logger.debug("configwrapper: positiveInteger.onchange: Invalid valid: " + val + " for " + name + ", resetting to: " + json[name]);
            el.value = json[name];
          }
        } catch (numberex) {
          // invalid value = reset
          mljs.defaultconnection.logger.debug("configwrapper: positiveInteger.onchange: Number exception: " + numberex + " for " + name);
          el.value = json[name];
        }
      };
    };
  } else if ("boolean" == d.type) {
    addtitle();
    var val = c;
    if (undefined == c) {
      val = d.default;
      usedDefault = true;
    }
    str += "<input class='form-control' type='checkbox' name='" + this.container + "-" + conf.id + "' id='" + this.container + "-" + conf.id + "' ";
    if (true === val) {
      str += "checked='checked' ";
    }
    str += "/>"; // TODO verify true and false work as expected
    conf.addhandler = function() {
      var el = document.getElementById(self.container + "-" + conf.id);
      el.onchange = function() {
        json[name] = el.checked;
      };
    };
  } else if ("multiple" == d.type) {
    //str += "<td colspan='2'>";
    str += "<div class='configwrapper-multiple-firstrow'>";

    // TODO handle min/max - via event handlers

    str += "<label>" + d.title + "</label>&nbsp;&nbsp;&nbsp;&nbsp;";
    str += "<button class='btn btn-default btn-sm' id='" + this.container + "-" + conf.id + "-add'>";
    str += "<span class='glyphicon glyphicon-plus btn-fix-sm configwrapper-addmultiple'></span>";
    str += "</button>";


    conf.addhandler = function() {
      var el = document.getElementById(self.container + "-" + conf.id + "-add");
      el.onclick = function() {
        // add a new row to this table
        var cjson = {};
        for (var didx = 0,maxdidx = conf.def.childDefinitions.length,defItem;didx < maxdidx;didx++) {
          defItem = conf.def.childDefinitions[didx];
          for (var item in defItem) {
            cjson[item] = defItem[item].default;
          }
        }
        json[name].push(cjson);
        // best to update workplace config json, then refresh entire widget
        self._updateWidgetConfig();
      };
    };

    str += "</div>";
    str += "<div class='configwrapper-multiple-indent'>";
    str += "<table class='configwrapper-multiple-table' id='" + this.container + "-" + conf.id + "-table'>";

    var dels = new Array();

    if (Array.isArray(c)) {
      var gotrows = false;
      for (var i = 0; i < c.length;i++) {
        gotrows = true;
        str += "<tr id='" + this.container + "-" + conf.id + "-row-" + i + "'><td>";

        str += "<button id='" + this.container + "-" + conf.id + "-del-" + i + "' class='btn btn-danger btn-sm'>";
        str += "<span class='glyphicon glyphicon-remove btn-fix-sm configwrapper-delmultiple' ></span>";
        str += "</button>" + (i + 1) + ": ";
        str += "</td><td>";
        str += this._genConfigHTMLInner(c[i],d.childDefinitions,level + 1,confslist);
        dels.push({
          elid: this.container + "-" + conf.id + "-del-" + i,
          json: c[i],
          def: d.childDefinitions,
          parentJson: c,
          index: i,
          id: conf.id
        });
        str += "</td></tr>";
      }
      if (!gotrows) {
        // empty series array
        // show empty row, +/- buttons only
      }

      self._addMultiHandler(c,d,conf,level,dels);


    } else {
      // no config value present (new widget?)
      // show empty row, +/- buttons only
      json[name] = [];
    }
    str += "</table>";
    str += "</div>";



  } else if ("jstype" == d.type) {
    var instances = ["null","string","number","instance","queryStringParameter"];

          addtitle();
          var val = c;
          var hasSelected = false;
          if (undefined == c) {
            val = d.default;
            usedDefault = true;
          }
          str += "<select class='form-control' id='" + this.container + "-" + conf.id + "'>";
          for (var i = 0,opt,max=instances.length; i < max;i++) {
            opt = instances[i];
            str += "<option value='" + opt + "' title='" + opt + "' ";
            if (opt === val) {
              str += "selected='selected' ";
              hasSelected = true;
            }
            str += ">" + opt + "</option>";
          }
          if (!hasSelected && /*null == d.default &&*/ undefined != instances[0]) {
            json[name] = instances[0];
            usedDefault = false;
          }
          str += "</select>";
          conf.addhandler = function() {
            var el = document.getElementById(self.container + "-" + conf.id);
            el.onchange = function() {
              json[name] = el.value;
            };
          };
  } else if ("instance" == d.type) {
    // get workplace instance names for drop down
    var instances = this._workplaceContext.getInstances(); // string array of instance names

      addtitle();
      var val = c;
      var hasSelected = false;
      if (undefined == c) {
        val = d.default;
        usedDefault = true;
      }
      str += "<select class='form-control' id='" + this.container + "-" + conf.id + "'>";
      for (var i = 0,opt,max=instances.length; i < max;i++) {
        opt = instances[i];
        str += "<option value='" + opt + "' title='" + opt + "' ";
        if (opt === val) {
          str += "selected='selected' ";
          hasSelected = true;
        }
        str += ">" + opt + "</option>";
      }
      if (!hasSelected && /*null == d.default &&*/ undefined != instances[0]) {
        json[name] = instances[0];
        usedDefault = false;
      }
      str += "</select>";
      conf.addhandler = function() {
        var el = document.getElementById(self.container + "-" + conf.id);
        el.onchange = function() {
          json[name] = el.value;
        };
      };


  } else {
    //else if ("SearchContext"==d.type||"GeoContext"==d.type||"DocumentContext" == d.type||"SemanticContext"==d.type||"AlertContext"==d.type) {

    // assume global class name - try to get context class name
    var cls = this._workplaceContext.getContextClass(d.type);
    if (null != cls) {
      // drop down of instances of correct context type
      var instances = this._workplaceContext.getInstancesOf(d.type); // returns string array of instance names

      addtitle();
      var val = c;
      var hasSelected = false;
      if (undefined == c) {
        val = d.default;
        usedDefault = true;
      }
      str += "<select class='form-control' id='" + this.container + "-" + conf.id + "'>";
      for (var i = 0,opt,max=instances.length; i < max;i++) {
        opt = instances[i];
        str += "<option value='" + opt + "' title='" + opt + "' ";
        if (opt === val) {
          str += "selected='selected' ";
          hasSelected = true;
        }
        str += ">" + opt + "</option>";
      }
      if (!hasSelected && /*null == d.default &&*/ undefined != instances[0]) {
        json[name] = instances[0];
        usedDefault = false;
      }
      str += "</select>";
      conf.addhandler = function() {
        var el = document.getElementById(self.container + "-" + conf.id);
        el.onchange = function() {
          json[name] = el.value;
        };
      };

    } else {
      console.log("WARNING: UNKNOWN d.type: " + d.type);
    } // null cls else
  } // end type else

  if (usedDefault) {
    json[name] = d.default;
  }
  //str += "</td></tr>";
  str += "</div>"; // form group
  confslist.push(conf);
  return str;
};

com.marklogic.widgets.configwrapper.prototype._addDelHandler = function(del,c) {
  var self = this;

  mljs.defaultconnection.logger.debug("In addDelHandler");
  var delEl = document.getElementById(del.elid);
  delEl.onclick = function(evt) {
    // delete instance in array (splice)
    c.splice(del.index,1);
    // update UI (delete row element)
    var row = document.getElementById(self.container + "-" + del.id + "-row-" + del.index);
    row.parentNode.removeChild(row);
  };
  mljs.defaultconnection.logger.debug("End addDelHandler");

};

com.marklogic.widgets.configwrapper.prototype._addMultiHandler = function(c,d,conf,level,dels) {
  var self = this;


  conf.addhandler = function() {
    mljs.defaultconnection.logger.debug("In multiple.addhandler");
    var addEl = document.getElementById(self.container + "-" + conf.id + "-add");
    addEl.onclick = function(evt) {
      // add element to array
      c.push({});

      // create element for row first
      var parentEl = document.getElementById(self.container + "-" + conf.id + "-table");

      // TODO Do we need to sanity check firefox editing table to include tbody element?

      var rowElId = self.container + "-" + conf.id + "-row-" + (c.length - 1);
      var elid = rowElId + "-content";
      var newStr = "<td>" + (c.length) +
        ":&nbsp;<br/><span class='configwrapper-delmultiple' id='" + self.container + "-" + conf.id + "-del-" + (c.length - 1) +
        "'>&nbsp;</span></td><td id='" + elid + "'></td>";
      var tr = document.createElement("tr");
      tr.setAttribute("id",rowElId);
      parentEl.appendChild(tr);
      tr.innerHTML = newStr;

      // add delete handler here
      self._addDelHandler({
        elid: self.container + "-" + conf.id + "-del-" + (c.length - 1),
        json: c[c.length - 1],
        def: d.childDefinitions,
        parentJson: c,
        index: c.length - 1,
        id: conf.id
      },c);
      mljs.defaultconnection.logger.debug("calling genconfightml with c: " + JSON.stringify(c[c.length - 1]) + ", d.childDefinitions: " +
        JSON.stringify(d.childDefinitions) + ", level: " + (level + 1) + ", elid: " + elid + ", d: " + JSON.stringify(d));


      // add new instance
      self._genConfigHTML(c[c.length - 1],d.childDefinitions,level + 1,elid);
    };


    // now do each delete
    for (var de = 0, maxd = dels.length,del;de < maxd;de++) {
      del = dels[de];
      self._addDelHandler(del,c);
    }


    mljs.defaultconnection.logger.debug("End multiple.addhandler");
  };
};

com.marklogic.widgets.configwrapper.prototype._genConfigHTML = function(json,def,level,elid) {

  var confslist = new Array();

  document.getElementById(elid).innerHTML = this._genConfigHTMLInner(json,def,level,confslist);

  // event handlers
  for (var c = 0,maxc = confslist.length,conf;c < maxc;c++) {
    conf = confslist[c];
    if (undefined != conf.addhandler) {
      conf.addhandler();
    }
  }

};

com.marklogic.widgets.configwrapper.prototype._genConfigHTMLInner = function(json,def,level,confslist) {
  var gotConfig = false;

  var str = "<table class='configwrapper-table'>";
  for (var name in def) {
    gotConfig = true;

    str += this._genConfigHTMLConf(json,def,level,name,confslist);

  }
  if (!gotConfig) {
    str += "<tr><td><i>This widget cannot be configured</i></td></tr>";
  }
  str += "</table>";
  return str;
};

/**
 * Whether to hide the delete button
 * @param {boolean} hideme - Optional. Whether to hide the button. If not specified, will be true (i.e. hide the button)
 */
com.marklogic.widgets.configwrapper.prototype.hideRemoveButton = function(hideme) {
  com.marklogic.widgets.hide(document.getElementById(this.container + "-name-del"),hideme || true);
};

com.marklogic.widgets.configwrapper.prototype._init = function() {
  var str = "<div class='mljswidget panel panel-default configwrapper'>";

  str += "<div class='panel-heading'>"
  str += " <button class='btn btn-danger btn-sm configwrapper-delete' id='" + this.container + "-name-del'>";
  str += "<span class='glyphicon glyphicon-remove btn-fix-sm'></span>";
  str += "</button> ";
  str += " <span class='configwrapper-heading' draggable='true' id='" + this.container + "-name'>";
  str += this._widgetName + "</span>"; // TODO show widget type title here too
  str += "</div>"; // panel heading

  // show config elements on page
  str += "<div id='" + this.container + "-cfg' class='panel-body'>";
  str += "</div>"; // panel body

  str += "</div>"; // panel

  document.getElementById(this.container).innerHTML = str;

  // action handler for delete button
  var delEl = document.getElementById(this.container + "-name-del");
  var self = this;
  delEl.onclick = function(evt) {
    self._removedPublisher.publish({widget: self._widgetName, configwrapper: self});
  };

  this._genConfigHTML(this._config,this._configDescription,0,this.container + "-cfg");
};

/**
 * Called by workplacecontext to indicate the workplace json object has been updated
 */
com.marklogic.widgets.configwrapper.prototype.updateWorkplace = function(json) { // TODO remove the json object???
  // extract this widget's config from json, set in the wrapper, and refresh
  this._updateWidgetConfig();
};







/**
 * Manages an ordered set of JavaScript Workplace action objects, and their configuration. NOT related to search result actions.
 * @constructor
 * @param {string} container - The HTML ID of the element to render this widget within
 */
com.marklogic.widgets.actionorderer = function(container) {
  this.container = container;

  this._workplaceContext = null;

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

com.marklogic.widgets.actionorderer.prototype.setWorkplaceContext = function(ctx) {
  this._workplaceContext = ctx;
};

com.marklogic.widgets.actionorderer.prototype.updateWorkplace = function(ctx) {
  this._workplaceContext = ctx;

  // TODO update anything internal
};

/**
 * Instructs this widget to wrap the specified action list
 */
com.marklogic.widgets.actionorderer.prototype.wrap = function(actions) {
  this._actions = actions;
  this._configs = configs; // TODO where's this variable come from???

  var el = document.getElementById(this.container + "-actions");
  el.innerHTML = ""; // reset
  var s = "";
  for (var a = 0,maxa = actions.length,action;a < maxa;a++) {
    action = actions[a];
    s += "<div id='" + this.container + "-action-" + a + "'></div>";
  }
  el.innerHTML = s;

  // E.g. [{action: "searchcontext1.doSimpleQuery",type: "javascript", config: {target: "searchcontext1", method: "doSimpleQuery", parameters: []}}, ...] // NB parameters is optional
  // render in same order in display
  for (var a = 0,maxa = actions.length,action;a < maxa;a++) {
    action = actions[a];
    var htmlid = this.container + "-action-" + a;
    var wrapper = new com.marklogic.widgets.configwrapper(htmlid);
    wrapper.setWorkplaceContext(this._workplaceContext);
    var desc = null;






    var actionClassType; // TODO fix this






    for (var c = 0,maxc = configs.length,config;c < maxc;c++) {
      config = configs[c];
      if (config.targetClass == action.config.target) { // TODO WARNING action.config.target is an instance name, not a class type name
        wrapper.wrap(action.action,action.type,desc,action.config); // TODO check these params
      }
    }

    // TODO add remove listener
  }
};

/**
 * Returns the action list
 */
com.marklogic.widgets.actionorderer.prototype.getActions = function() {
  // TODO return options in their current order as a config
  // TODO also update out internal config, just incase
  return this._actions;
};









com.marklogic.widgets.actioncreator = function(container) {
  this.container = container;

  this._workplaceContext = null;

  this._currentObject = null;
  this._currentFunction = null;

  this._init();

  this._newActionPublisher = new com.marklogic.events.Publisher();
};

com.marklogic.widgets.actioncreator.prototype._init = function() {
  var str = "<div class='mljswidget actioncreator' id='" + this.container + "-actioncreator'>";
  str += "    Object: <select class='actioncreator-object' id='" + this.container + "-object'></select> ";
  str += "    Function: <select class='actioncreator-function' id='" + this.container + "-function'></select> ";
  str += "    <button id='" + this.container + "-button' class='btn btn-default actioncreator-add'><span class='glyphicon glyphicon-plus btn-fix'></span></button>";
  str += "   </div>";

  document.getElementById(this.container).innerHTML = str;

  // event handlers
  var self = this;
  var objEl = document.getElementById(this.container + "-object");
  objEl.onchange = function(evt) {
    // TODO if 'Other...' selected, show text popup for free text object value

    // else...
    self._currentObject = objEl.value;
    // refresh function options from actions list
    // set current function to <none selected>
    self._refreshFunctionList(self._currentFunction);
  };
  var funcEl = document.getElementById(this.container + "-function");
  funcEl.onchange = function(evt) {
    self._currentFunction = funcEl.value;
  }

  // button click handler - with sanity check for blank object or function
  var but = document.getElementById(this.container + "-button");
  but.onclick = function(evt) {
    // add instance to config and redraw configwrapper
    var classInstance = document.getElementById(self.container + "-object").value;
    var funcName = document.getElementById(self.container + "-function").value;
    if (null == classInstance || null == funcName) {
      // do nothing? show message?
    } else {
      var name = classInstance + "." + funcName; // TODO add an extra number on the end to differentiate same method call (why would there be multiple? series add?)
      var json = {type: "javascript", action: name, config: {target: classInstance, method: funcName, parameters:[]}};
      self._newActionPublisher.publish(json);
    }
    evt.stopPropagation();
    return false;
  };
};

com.marklogic.widgets.actioncreator.prototype._refreshObjectList = function(toHighlight) {
  console.log("AC: _refreshObjectList");

  // NB add 'Other...' option to select
  var str = "";

  // draw object options
  var otm = this._workplaceContext.getObjectTypes();
  var curValue = null;
  for (var objname in otm) {
    obj = otm[objname];
    str += "<option value='" + objname + "'";
    if (objname == toHighlight) {
      str += " selected='selected'";
      curValue = objname;
    }
    str += ">" + objname + "</option>";
  }
  str == "<option value='__other'>Other...</option>";
  var el = document.getElementById(this.container + "-object");
  el.innerHTML = str;

  if (null == curValue) {
    curValue = el.value; // get highlighted value in html
  }

  this._currentObject = curValue; // force this so dont get an invalid value hidden in the json

  this._refreshFunctionList();
};

com.marklogic.widgets.actioncreator.prototype._refreshFunctionList = function(toHighlight) {
  console.log("AC: _refreshFunctionList");
  // reset function list
  var el = document.getElementById(this.container + "-function");
  if (null == this._currentObject) {
    return; // sanity check
  }
  var newFunc = null;

  // load functions (if object selected)
  var s = "";
  console.log("AC: Fetching object type for: " + this._currentObject);
  var typeHighlight = this._workplaceContext.getObjectType(this._currentObject);
  console.log("AC: type to highlight: " + typeHighlight);
  var actions = this._workplaceContext.getActionDescriptions();
  for (var t = 0,maxt = actions.length,action;t < maxt;t++) {
    action = actions[t];
    if (action.targetClass == typeHighlight) {
      s += "<option value='" + action.methodName + "' ";
      if (action.methodName == toHighlight) {
        s += "selected='selected' ";
        newFunc = action.methodName; // new class may not have this function, so blank if not
      }
      s += ">" + action.methodName + "</option>";
    }
  }
  el.innerHTML = s;
  this._currentFunc = newFunc;
  if (null == this._currentFunc) {
    this._currentFunc = el.value;
  }
};

com.marklogic.widgets.actioncreator.prototype.updateWorkplace = function(ctx) {
  this._workplaceContext = ctx;

  // TODO update list of type to widget/context variable name

  this._refreshObjectList(this._currentObject);
  this._refreshFunctionList(this._currentFunction);
};

com.marklogic.widgets.actioncreator.prototype.addActionCreatedListener = function(lisfunc) {
  this._newActionPublisher.subscribe(lisfunc);
};

com.marklogic.widgets.actioncreator.prototype.removeActionCreatedListener = function(lisfunc) {
  this._newActionPublisher.unsubscribe(lisfunc);
};






// NO NEED FOR THE BELOW NOW - USE CONFIG WRAPPER INSTEAD



/**
 * An individual action configuration wrapper widget
 * @constructor
 * @param {string} container - The HTML ID of the element to render this widget within
 */
com.marklogic.widgets.actionconfig = function(container) {
  this.container = container;
  this._config = null;
  this._type = null;

  //  {type: "javascript", config: {targetObject: "searchcontext1", methodName: "doSimpleQuery", parameters: []}}

  this._init();
};

com.marklogic.widgets.actionconfig.prototype._init = function() {
  var str = "<div class='mljswidget actionconfig' id='" + this.container + "-actionconfig'>";
  str +=    " <div class='actionconfig-header'>";
  str +=    "  <span>DEL</span>";
  str +=    "  <span class='subtitle' id='" + this.container + "-actionconfig-title'></span>";
  str +=    " </div>";
  str +=    " <div class='actionconfig-params'>";
  str +=    "  <i>No Parameters</i> <span>ADD</span>";
  str +=    " </div>";
  str +=    "</div>";

  document.getElementById(this.container).innerHTML = str;

  // TODO event handlers
};

/**
 * Instructs this widget to wrap the specified individual action
 * @param {json} config - The JSON configuration object for this action
 */
com.marklogic.widgets.actionconfig.prototype.wrap = function(config) {
  this._config = config;

  // TODO render config
};

/**
 * Returns this individual action's configuration
 */
com.marklogic.widgets.actionconfig.prototype.getConfig = function() {
  // return updated config
  return this._config;
};











/**
 * Provides a bootstrap compatible navigation bar widget for use in Workplace powered applications.
 * @constructor
 * @param {string} container - The HTML ID of the element to render this widget within
 */
com.marklogic.widgets.workplacenavbar = function(container) {
  this.container = container;
  this._workplaceContext = null;
  this._config = {
    appName: "Workplace", homeUrl: "/index.html5", homeText: "Home", showAppConfigureLink: true,
    appConfigureLinkText: "Configure App", appConfigureUrl: "/application.html5", showPageConfigureLink: true,
    pageConfigureLinkText: "Configure Page", showLogoutLink: false, logoutLinkText: "Logout", logoutUrl: "/logout"
  };
  //this._pages = new Array(); // pages full json documents content
  this._refresh();
};

/**
 * Sets the workplace context for this widget
 * @param {com.marklogic.widgets.workplacecontext} ctx - Workplace context instance
 */
com.marklogic.widgets.workplacenavbar.prototype.setWorkplaceContext = function(ctx) {
  mljs.defaultconnection.logger.debug("workplacenavbar.setWorkplaceContext: called.");
  this._workplaceContext = ctx;
};

/**
 * Returns the workplace context used by this widget
 * @return {com.marklogic.widgets.workplacecontext} ctx - The Workplace context instance
 */
com.marklogic.widgets.workplacenavbar.prototype.getWorkplaceContext = function() {
  return this._workplaceContext;
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.workplacenavbar.getConfigurationDefinition = function() {
  return {
    appName: {type:"string", default:"Workplace",title:"Application name", description: "Default application name (normally read from workplace app JSON)"},
    homeUrl: {type:"string",default: "/index.html5", title: "Home link URL", description: "Absolute URL of the home page. Blank for no home page link"},
    homeText: {type:"string", default:"Home",title:"Home link text", description: "The display text for the link"},
    showAppConfigureLink: {type:"boolean", default:true,title:"Show App Configure Link", description: "Show application configuration link"},
    appConfigureLinkText: {type:"string", default:"Configure App",title:"App Configure Link Text", description: "The display text for the link"},
    appConfigureUrl: {type:"string", default:"/application.html5",title:"Configure App Url", description: "The URL of the page managing app wide configuration"},
    showPageConfigureLink: {type:"boolean", default:true,title:"Show Page Configure Link", description: "Whether to show the link for this page's configuration"},
    pageConfigureLinkText: {type:"string", default:"Configure Page",title:"Page Configure Link Text", description: "The display text for the link"},
    showLogoutLink: {type:"boolean", default:false,title:"Show Logout Link", description: "Whether to show a link to the logout page"},
    logoutLinkText: {type:"string", default:"Logout",title:"Logout Link Text", description: "The display text for the link"},
    logoutUrl: {type:"string", default:"/logout",title:"Logout Link Url", description: "The URL for the logout handling server side process"}
  }
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.workplacenavbar.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }

  // refresh display
  this._refresh();
};

com.marklogic.widgets.workplacenavbar.prototype._refresh = function() {
  var s = "<div class='mljswidget navbar navbar-default workplacenavbar' role='navigation'>";

  if (null != this._config.homeUrl && "" != this._config.homeUrl.trim()) {
    s += "<div class='container'>"
    s +=    "<div class='navbar-header'>"
    s +=      "<button type='button' class='navbar-toggle' data-toggle='collapse' data-target='.navbar-collapse'>"
    s +=        "<span class='sr-only'>Toggle navigation</span>"
    s +=        "<span class='icon-bar'></span>"
    s +=        "<span class='icon-bar'></span>"
    s +=        "<span class='icon-bar'></span>"
    s +=      "</button>"
    s +=      "<a class='navbar-brand' href='" + this._config.homeUrl + "'>" + this._config.appName + "</a>"
    s +=    "</div>";
  }
  s += "<div class='navbar-collapse collapse'><ul class='nav navbar-nav' id='" + this.container + "-navbar'>";


  // TODO remove HACK for alert button
  s += "<li><a href='#'><span class='glyphicon glyphicon-bell'></span></li>";

  if (null != this._config.homeUrl && "" != this._config.homeUrl.trim()) {
    s += "<li";
    if (-1 != this._config.homeUrl.indexOf(window.location.pathname)) {
      s += " class='active'";
    }
    s += "><a href='" + this._config.homeUrl + "'>" + this._config.homeText + "</a></li>";
  }

  // compare window.path with url in order to determine active nav button

  if (null != this._workplaceContext) {
    var pages = this._workplaceContext.getCachedPages();
    for (var i = 0, maxi = pages.length, page;i < maxi;i++) {
      page = pages[i];
      if (undefined != page.page.urls && Array.isArray(page.page.urls) && page.page.urls.length > 0) {
        s += "<li";
        if (page.page.urls.contains(window.location.pathname)) {
          s += " class='active'";
        }
        s += "><a href='" + page.page.urls[0] + "'>" + page.page.title + "</a></li>";
      }
    }
  }
  // TODO support embedded pages in dropdown navigation
  /*
  s += "
  <!--
                <li><a href='#'>Link</a></li>
                <li class='dropdown'>
                  <a href='#' class='dropdown-toggle' data-toggle='dropdown'>Dropdown <b class='caret'></b></a>
                  <ul class='dropdown-menu'>
                    <li><a href='#'>Action</a></li>
                    <li><a href='#'>Another action</a></li>
                    <li><a href='#'>Something else here</a></li>
                    <li class='divider'></li>
                    <li class='dropdown-header'>Nav header</li>
                    <li><a href='#'>Separated link</a></li>
                    <li><a href='#'>Other</a></li>
                  </ul>
                </li>
  -->
  */

  s += "</ul><ul class='nav navbar-nav navbar-right'>";

  // next 2 are drop down admin code
  /*
  s += "<li class='dropdown'><a href='#' class='dropdown-toggle' id='adminaria' aria-expanded='false'>Admin <span class='caret'></span></a>";
  s += "<ul class='dropdown-menu' aria-labelledby='adminaria'>";
  */

  if (true === this._config.showAppConfigureLink) {
    s += "<li";

    if (-1 != this._config.appConfigureUrl.indexOf(window.location.pathname)) {
      s += " class='active'";
    }
    s += "><a id=" + this.container + "-workplacenavbar-configureapp' href='" + this._config.appConfigureUrl +
         "' title='" + this._config.appConfigureLinkText + "'><span class='glyphicon glyphicon-list-alt'></span></a></li>";
  }
  s += "<li><a href='#' id='" + this.container + "-workplacenavbar-configurepage' title='" + this._config.pageConfigureLinkText + "'><span class='glyphicon glyphicon-cog'></span></a></li>";
  if (true === this._config.showLogoutLink) {
    s += "<li";

    if (-1 != this._config.logoutUrl.indexOf(window.location.pathname)) {
      s += " class='active'";
    }
    s += "><a href='" + this._config.logoutUrl + "'>" + this._config.logoutLinkText + "</a></li>";
  }


  //s += "</ul></li>"; // drop down code

  s += "</ul></div><!--/.nav-collapse --></div><!--/.container-fluid --></div>";
  document.getElementById(this.container).innerHTML = s;

  var self = this;
  document.getElementById(this.container + "-workplacenavbar-configurepage").onclick = function(evt) {
    com.marklogic.widgets.workplaceadmin.renderFullscreen(self._workplaceContext);

    evt.stopPropagation();
    return false;
  };

};


com.marklogic.widgets.workplacenavbar.prototype.updateMyPages = function(pages) {
  // receive page array and draw nav bar
  //this._pages = pages;
  this._refresh();
};











com.marklogic.widgets.workplacepagelist = function(container) {
  this.container = container;
  this._workplaceContext = null;

  this._pages = new Array();

  this.updateWorkplace();
};

/**
 * Sets the workplace context for this widget
 * @param {com.marklogic.widgets.workplacecontext} ctx - Workplace context instance
 */
com.marklogic.widgets.workplacepagelist.prototype.setWorkplaceContext = function(ctx) {
  mljs.defaultconnection.logger.debug("workplacepagelist.setWorkplaceContext: called.");
  this._workplaceContext = ctx;
};

/**
 * Returns the workplace context used by this widget
 * @return {com.marklogic.widgets.workplacecontext} ctx - The Workplace context instance
 */
com.marklogic.widgets.workplacepagelist.prototype.getWorkplaceContext = function() {
  return this._workplaceContext;
};


com.marklogic.widgets.workplacepagelist.prototype.updateWorkplace = function() {
  // redraw navbar in case new page added / page deleted
  this.updateMyPages(); // use previous pages list provided
};

com.marklogic.widgets.workplacepagelist.prototype.updateMyPages = function(pages) {
  this._pages = pages || this._pages; // remember previous pages list if not specified

  var str = "<div class='panel panel-info'>";
  str += "<div class='panel-heading'>Pages</div>";
  str += "<div class='panel-body'>";

  for (var p = 0,maxp = this._pages.length,page;p < maxp;p++) {
    page = this._pages[p];

    // title and urls
    str += "<div class='btn-toolbar'>";
    str += "<div class='btn-group'>";
    str += " <button id='" + this.container + "-" + p + "-del' class='btn btn-danger'><span class='glyphicon glyphicon-remove btn-fix'></span></button>";
    str += " <button id='" + this.container + "-" + p + "-edit'  class='btn btn-default'><span class='glyphicon glyphicon-cog btn-fix'></span></button>";
    str += " <button id='" + this.container + "-" + p + "-name'  class='btn btn-default'><span class='btn-fix'>" + page.page.title + " @ ";
    if (undefined != page.page.urls) { // happens on creation of new page with just a title
      for (var u = 0,maxu = page.page.urls.length,url;u < maxu;u++) {
        url = page.page.urls[u];
        if (u > 0) {
          str += ", ";
        }
        str += url;
      }
    }
    str += "</span></button>";
    str += "</div>";
    str += "</div>";
  }
  if (0 == this._pages.length) {
    str += "<p><i>No pages to display</i></p>";
  }

  // Page add button - sets name only with random uri
  str += "<div class='form-group'>";
  str += " <label>New page name</label>";
  str += " <div class='input-group'>";
  str += "  <input id='" + this.container + "-pagename' class='form-control' type='text' placeholder='Page name'/>";
  str += "  <div id='" + this.container + "-addpage' class='input-group-addon glyphicon glyphicon-plus'></div>";
  str += " </div>"; // input group
  str += "</div>"; // form group

  str += "</div>"; // panel body
  str += "</div>"; // panel

  document.getElementById(this.container).innerHTML = str;

  // click event handlers
  var self = this;

  var addDelHandler = function(elid,page) {
    var el = document.getElementById(elid);
    el.onclick = function(evt) {
      self._workplaceContext.deletePage(page.uri);

      evt.stopPropagation();
      return false;
    };
  };
  var addEditHandler = function(elid,page) {
    var el = document.getElementById(elid);
    el.onclick = function(evt) {
      // show workplace admin popup
      com.marklogic.widgets.workplaceadmin.renderFullscreen(self._workplaceContext);
      self._workplaceContext.loadWorkplace(page.uri);

      evt.stopPropagation();
      return false;
    };
  };

  // remove and edit click handlers
  for (var p = 0,maxp = this._pages.length,page;p < maxp;p++) {
    page = this._pages[p];
    // add delete click handler
    addDelHandler(this.container + "-" + p + "-del",page);
    // add cog AND name click handlers
    addEditHandler(this.container + "-" + p + "-edit",page);
    addEditHandler(this.container + "-" + p + "-name",page);
  }

  // Add click handler
  document.getElementById(this.container + "-addpage").onclick = function(evt) {
    var json = {title: document.getElementById(self.container + "-pagename").value, actions: {onload:[],onunload:[]},
      contexts: [
        {context: "searchcontext1", type: "SearchContext",config:{}},
        {context: "semanticcontext1", type: "SemanticContext",config:{}},
        {context: "geocontext1", type: "GeoContext",config:{}},
        {context: "doccontext1", type: "DocumentContext",config:{}},
        {context: "alertcontext1", type: "AlertContext",config:{}},
        {context: "datacontext1", type: "DataContext",config:{}}
      ]
    };
    self._workplaceContext.createPage(json);
    evt.stopPropagation();
    return false;
  };
};









/**
 * A Page Context acts as a micro controller for a page - routing page invocation settings through to
 * a workplace context's page configuration.
 *
 * Use case is that a page has query string parameters which affect the run time configuration or actions of
 * a workplace page.
 *
 * A Page Context holds certain default mappings, but can be configured with a range of mappings. These mappings
 * are activated post workplace page draw - and thus are more useful to map to contexts which fire their own
 * update methods on listeners.
 *
 * Example 1. A ?docuri=SomeUri.json parameter is used to call doccontext.loadContent on the page to view a document.
 * Example 2. A ?iri=SomeIri parameters is used to call semanticcontext.subjectFacts(iri) to explore a Subject.
 */
com.marklogic.widgets.pagecontext = function() {
  this._workplaceContext = null;
  this._workplaceWidget = null;

  this._params = null; // lazy parse loading

  // new structure:-
  this._defaultConfig = {
    mappings: {
      /*
      iri: {querystring: "iri", targets: [
        {class: "com.marklogic.widgets.graphexplorer"} // TODO have focusSubject setting & update event on semantic context
      ]}
      */
    },
    calls : [
    /*
      {title: "Perform simple text query", target: {class: "SearchContext", method: "doSimpleQuery", params: [
        {querystring: "q", required: false}
      ]}} // optional instance: "widgetname", optional param config default: "someValue"
      ,
      {title: "Geo context radius search", target: {class: "GeoContext", method: "homeRadius", params: [
        {querystring: "lat", required: true},{querystring: "lon", required: true},{querystring: "radius", required: true}
      ]}}
      ,
      {title: "Display subject facts", target: {class: "SemanticContext", method: "subjectFacts", params: [
        {querystring: "iri", required: true}
      ]}}
      ,
      {title: "Display subject in graph", target: {class: "com.marklogic.widgets.graphexplorer", method: "drawSubject", params: [
        {querystring: "iri", required: true}
      ]}}
      ,
      {title: "Load document content", target: {class: "DocumentContext", method: "getContent", params: [
        {querystring: "docuri", required: true}
      ]}}
      ,
      {title: "Load document properties", target: {class: "DocumentContext", method: "getProperties", params: [
        {querystring: "docuri", required: true}
      ]}}
      */ // CAUSES ISSUES WITH SEARCH CONTEXT - OPTIONS NOT BEING LOADED BEFORE CALLING SEARCH
    ]
  };
  this._config = this._defaultConfig;

  com.marklogic.widgets.pagecontext.instance = this;
};

com.marklogic.widgets.pagecontext.prototype.setWorkplaceWidget = function(wgt) {
  this._workplaceWidget = wgt;
};

com.marklogic.widgets.pagecontext.prototype.setWorkplaceContext = function(ctx) {
  this._workplaceContext = ctx;
};

com.marklogic.widgets.pagecontext.prototype.setMappings = function(mappings) {
  this._config.mappings = mappings;
};

com.marklogic.widgets.pagecontext.prototype.process = function(ctx) {
  var params = this._parse();

  // OLD update object configuration
  var objects = {}; // classname => {widgetName => {param1: val1, param2: val2}}
  for (var name in this._config.mappings) {
    console.log("PC: found mapping name: " + name);
    var mapping = this._config.mappings[name];
    var value = params[mapping.querystring];
    console.log("PC: mapping has value: " + value);
    if (undefined != value) {
      // process value
      // check if object instances exist in context
      for (var t = 0,maxt = mapping.targets.length,target;t < maxt;t++) {
        target = mapping.targets[t];
        var classInstances = objects[target.class];
        console.log("PC: checking for instances of target class: " + target.class);
        if (undefined == classInstances) {
          classInstances = {};
          objects[target.class] = classInstances;
        }
        // get widget instance NAME and set parameters as appropriate (collect per object)
        var instances = this._workplaceContext.getInstancesOf(target.class);
        for (var i = 0,maxi = instances.length,ins;i < maxi;i++) {
          ins = instances[i];
          var iname = ins;
          console.log("PC: Found instance: " + iname);
          var cinstance = classInstances[iname];
          if (undefined == cinstance) {
            cinstance = {};
            classInstances[iname] = cinstance;
          }
          // TODO check if configuration parameter name is valid before setting
          console.log("PC: Setting instance config value " + name + "=" + value);
          cinstance[name] = value;
        }
      }
    }
  }

  // now loop through objects, setting appropriate configuration options (setConfiguration())
  console.log("PC: processing configs...");
  for (var cname in objects) {
    console.log("PC: Processing class: " + cname);
    var obj = objects[cname];
    for (var iname in obj) {
      console.log("PC: Loading instance name: " + iname);
      var config = obj[iname];
      // pass on override configuration parameter
      var wgt = this._workplaceWidget.getInstance(iname);
      console.log("PC: Got instance?: " + (undefined != wgt));
      wgt.setConfiguration(config);
    }
  }



  // NEW now process function calls too
  var json = ctx.getJson();
  if (undefined != json) {
  var pageMappings = json.pageMappings;
  if (undefined == pageMappings) {
    pageMappings = this._config;
  }
  var calls = pageMappings.calls;
  if (undefined != calls) {
    for (var c = 0, maxc = calls.length,cal;c < maxc;c++) {
      /*
      {title: "Perform simple text query", target: {class: "SearchContext", method: "doSimpleQuery", params: [
        {querystring: "q", required: false}
      ]}}
      */
      cal = calls[c];
      mljs.defaultconnection.logger.debug("pagecontext.process: processing call: " + cal.title);
      var instances = new Array();
      if (undefined != cal.target.instance) {
        // get named instance
        instances.push(this._workplaceWidget.getInstance(cal.target.instance));
      } else {
        // get all instances of named class
        if (undefined != cal.target.class) {
          var instanceNames = ctx.getInstancesOf(cal.target.class);
          for (var ini = 0,maxini = instanceNames.length, inn; ini < maxini;ini++) {
            inn = instanceNames[ini];
            instances.push(this._workplaceWidget.getInstance(inn));
          }
        }
      }

      for (var i = 0, maxi = instances.length, ins;i < maxi;i++) {
        ins = instances[i];
        if (undefined != ins) { // sanity check
          // check all required params exist
          var validCall = true;
          var paramValues = [];
          if (undefined != cal.target.params) {
            for (var p = 0,maxp = cal.target.params.length,param; p < maxp;p++) {
              param = cal.target.params[p];
              var paramValue = params[param.querystring];
              paramValues[p] = paramValue;

              mljs.defaultconnection.logger.debug("pagecontext.process: param value: " + paramValue);

              validCall = validCall && (!param.required || undefined != paramValue);
            } // end params for
          } // end params if

          // call method
          if (validCall) {
            mljs.defaultconnection.logger.debug("pagecontext.process: call is valid, checking target method: " + cal.target.method + " on instance: " + ins);
            var func = ins[cal.target.method];
            if (undefined != func) {
              mljs.defaultconnection.logger.debug("pagecontext.process: Calling " + JSON.stringify(cal));
              func.apply(ins,paramValues);
            }
          } else {
            mljs.defaultconnection.logger.debug("pagecontext.process: Not a valid call for: " + cal.target.instance + "(" + cal.target.class + ")." + cal.target.method);
          }
        } // end undefined ins if
      } // end instance for


    } // end calls for
  } // end calls if
  } // end json if
};

/*
com.marklogic.widgets.pagecontext.prototype.updateWorkplace = function(ctx) {
  // parse post workplace load
  this.process(ctx);
};*/ // DONE VIA WORKPLACE LOADED LISTENER INSTEAD TO ENSURE CORRECT LOADED ORDER

/**
 * Retrieve a named parameter from this page
 * @param {string} name - The parameter name to retreive
 */
com.marklogic.widgets.pagecontext.prototype.getParameter = function(name) {
  if (null == this._params) {
    this._params = this._parse();
  }
  return this._params[name];
};

com.marklogic.widgets.pagecontext.prototype._parse = function() {
  var result = {};
  var str = window.location.search.substring(1); // removes ? character
  var pos = str.indexOf("&");
  var op = 0;
  do {
    var np = pos;
    if (-1 == pos) {
      np = str.length;
    } else {
      pos = str.indexOf("&",np + 1);
    }
    var sub = str.substring(op,np);
    console.log("PC: Sub: " + sub);

    var qp = sub.indexOf("=");
    console.log("PC: qp: " + qp);
    var value = null;
    var name = null;
    if (-1 != qp) {
      name = sub.substring(0,qp);
      value = decodeURI(sub.substring(qp + 1));
    } else {
      name = sub;
    }
    console.log("PC: name: " + name + " = " + value);
    result[name] = value;

  } while (-1 != pos);
  return result;
};
