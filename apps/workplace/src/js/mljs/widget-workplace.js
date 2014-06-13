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
 * @param {json|string} jsonOrString - The JSON config object, or json string, representing the page configuration
 * @param {json} json_opt - Optional fall back JSON configuration, if remote workplace config does not exist. Useful for new applications.
 */
com.marklogic.widgets.workplace.prototype.loadPage = function(jsonOrString,json_opt) {
  this._workplaceContext.loadPage(jsonOrString,json_opt);
};

/**
 * Redraws this workplace based on the configuration in the specified workplace context object.
 *
 * @param {workplacecontext} context - The Workplace context holding the configuration to render.
 */
com.marklogic.widgets.workplace.prototype.updateWorkplace = function(context) {
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

    var item = layout.getAssignmentByWidgetName(widget.widget).item;
    var elementid = item.elementid;

    var wgt = this._createWidget(widget.type,elementid,widget.config);
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
      for (var o = 2, max = z.length, wgt;o < max;o += 2) {
        wgt = z[o];
        if (undefined != z[o]) {
          ass.push({widget: wgt.widget, zone: zone, order: (o / 2)});
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
  // TODO make this not dependant upon spacers as per workplaceadmin
  self.moveToPosition = function(widgetName,newZone,newIndexOneBased) {
    // get element currently at position
    mljs.defaultconnection.logger.debug("layout<subclass>.moveToPosition: Entered");
    var wgt = self._elementAt(newZone,newIndexOneBased);
    var me = self.getAssignmentByWidgetName(widgetName).item;
    var spacer = self._elementAt(me.zone,me.order - 1); // TODO detect spacer
    var oldZone = me.zone;
    var oldOrder = me.order;

    mljs.defaultconnection.logger.debug("layout<subclass>.moveToPosition: Got Widget at target position. Moving those afterwards");
    //var z = self._getZone(newZone);
    var z = self.zones[newZone];

    var lastWidget = null;
    for (var w = z.length - 1, min = z.length - 3, moveme;w >= min && null == lastWidget;w--) {
      moveme = z[w];
      if (undefined != moveme) {
        lastWidget = moveme;
      }
    }
    self._eliminateBlanks(z);
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
        // just move the last widget
        z[newIndexOneBased + 2] = z[newIndexOneBased];
        z[newIndexOneBased] = undefined;
        if (1 == z.length % 2) {
          z[newIndexOneBased + 1] = undefined; // spacer - corrects z.length later
        }
        lastWidget.order += 2;

        // blank out old positions
        self.zones[oldZone][oldOrder] = undefined;
        self.zones[oldZone][oldOrder - 1] = undefined; // spacer
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

    if (null == lastWidget || lastWidget.elementid != wgt.elementid) {
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

    self._eliminateBlanks(z);


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
        } else {
          if (foundGap > 0) {
            moveme.order = w - foundGap; // safer than decrementing by 2
            // move element back 2 - can only happen when not undefined. i.e. after gap
            z[w - foundGap] = z[w];
            z[w] = undefined;
          }
          maxOrder = moveme.order; // new order only. Maximum is always at end of elements
        }
      }
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
  var s = "<div id='" + this.container + "-layout' class='container_12 mljswidget layout thinthick'>";
  s += "<div id='" + this.container + "-A' class='grid_4 thinthick-thin'></div>";
  s += "<div id='" + this.container + "-B' class='grid_8 thinthick-thick'></div>";
  s += "</div>";
  document.getElementById(this.container).innerHTML = s;
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
  var s = "<div id='" + this.container + "-layout' class='container_12 mljswidget layout thickthin'>";
  s += "<div id='" + this.container + "-A' class='grid_8 thickthin-thick'></div>";
  s += "<div id='" + this.container + "-B' class='grid_4 thickthin-thin'></div>";
  s += "</div>";
  document.getElementById(this.container).innerHTML = s;
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
  var s = "<div id='" + this.container + "-layout' class='container_12 mljswidget layout column'>";
  s += "<div id='" + this.container + "-A' class='column'></div>";
  s += "</div>";
  document.getElementById(this.container).innerHTML = s;
};










// ACTIONS
com.marklogic.widgets.actions = {};
/**
 * Holds configuration for a JavaScript generic method call action. Used on page load/unload only. (Not related to a searchresult action bar)
 * @constructor
 */
com.marklogic.widgets.actions.javascript = function() {
  this._config = {
    targetObject: null,
    methodName: null,
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
  this._config = config;
};

/**
 * Executes this action
 *
 * @param {object} executionContext - The execution context. Holds environment configuration for this action.
 */
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

  this._cachedPages = new Array();
  this._cached = false;

  this._instanceNames = {}; // [shortname] -> next available instance id or null

  this._linker = new com.marklogic.events.Linker();
  this.updatePublisher = new com.marklogic.events.Publisher(); // page loaded from server
  this._myPagesPublisher = new com.marklogic.events.Publisher(); // fires my pages updated event updateMyPages(pageArray)
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
      pages.push(page);
    }
    // fire update event on return
    self._myPagesPublisher.publish(pages);
  });
  sc.doStructuredQuery(qb.toJson());
};

/**
 * Returns the currently readable workplace pages for this user, cached from previous calls.
 * If the cache is empty, returns an empty array and loads readable pages in to cache asynchronously (via loadMyPages()).
 */
com.marklogic.widgets.workplacecontext.prototype.getCachedPages = function() {
  if (false === this._cached) {
    this.loadMyPages();
  }
  return this._cachedPages;
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
};

/**
 * Reverts all configuration changes to the last saved JSON configuration
 */
com.marklogic.widgets.workplacecontext.prototype.revert = function() {
  this._json = this._lastSaved;
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
    self.loadPage(self._uri); // tries to remove all internal config and reload
    //self._fireUpdate();
    callback();
  });
};


// MLJS WORKPLACE

/**
 * TODO docs
 */
com.marklogic.widgets.workplacecontext.prototype.getWorkplace = function(name,callback) {
  this.db.get("/admin/workplace/" + encodeURI(name) + ".json", callback);
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
  ob.valueConstraint("item","item",ob.JSON)
    .jsonContainerConstraint("urls","urls")
    .returnFacets(false)
    .returnResults(true)
    .raw();
  var qb = this.db.createQuery();
  qb.query(qb.container("urls",qb.value("item",pageurl)));
  var sc = this.db.createSearchContext();
  sc.setOptions("mljsFindWorkplace",ob); // will fail on multi user system - need to use combined query dynamically
  sc.addResultsListener(function(results) {
    if (true === results || false === results) {
      return;
    }
    // pass single document as result to callback
    callback({inError: false,doc: results.results[0]});
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
 * Links a widget to a context (will invoke the register function on page loading)
 *
 * @param {string} widgetName - The configuration widget name. E.g. searchbar1
 * @param {string} contextName - The configuration context name. E.g. searchcontext1
 */
com.marklogic.widgets.workplacecontext.prototype.registerWidget = function(widgetName,contextName) {
  for (var i = 0, max = this._json.contexts.length,c;i < max;i++) {
    c = this._json.contexts[i];
    if (c.context == contextName) {
      c.register.push(widgetName);
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
  for (var i = 0, max = this._json.widgets.length,wgt;i < max;i++) {
    wgt = this._json.widgets[i];
    this._addWidgetName(wgt.widget);
  }
};

/**
 * Loads the specified JSON or json string page configuration in to this context
 *
 * @param {json|string} jsonOrString - The configuration to load
 * @param {json} json_opt - Optional fall back JSON configuration, if remote workplace config does not exist. Useful for new applications.
 */
com.marklogic.widgets.workplacecontext.prototype.loadPage = function(jsonOrString,json_opt) {
  mljs.defaultconnection.logger.debug("workplacecontext.loadPage: value: " + jsonOrString);
  if (typeof(jsonOrString) == "string") {
    mljs.defaultconnection.logger.debug("workplacecontext.loadPage: Got server URI workplace page definition");
    // doc uri
    var self = this;
    this.findWorkplace(jsonOrString,function(result) {
      if (result.inError && undefined != json_opt) {
        mljs.defaultconnection.logger.debug("workplacecontext.loadPage: findWorkplace call resulted in error: " + result.detail);
        // fall back to default
        self._uri = jsonOrString;
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
          self._uri = jsonOrString;
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
    this._linker.link(widget,"WorkplaceUpdateListener",func);
    this.addWorkplaceUpdateListener(func);
  }
  if (undefined != widget.updateMyPages) {
    var func = function(pages) {widget.updateMyPages(pages);};
    this._linker.link(widget,"myPagesPublisher",func);
    this._myPagesPublisher.subscribe(func);
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
      {title: "Co-occurence", classname: "com.marklogic.widgets.cooccurence", description: "Shows two way co-occurence between elements in a document."},
      /*
      {title: "Create Document", classname: "com.marklogic.widgets.create", description: "Form builder used to generate a new document on submission."},
      */
      {title: "Document Properties", classname: "com.marklogic.widgets.docproperties", description: "Shows the MarkLogic Properties of a Document."},
      {title: "XHTML Head Viewer", classname: "com.marklogic.widgets.docheadviewer", description: "Shows the Meta data elements within an XHTML document."},
      {title: "XHTML Content Viewer", classname: "com.marklogic.widgets.docviewer", description: "Displays XHTML content inline within a page."},
      {title: "Data Explorer", classname: "com.marklogic.widgets.explorer", description: "HighCharts powered node diagram to explore semantic subjects and related document facets."},
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
      {title: "Search Results", classname: "com.marklogic.widgets.searchresults", description: "Show search results. Supports built in and custom rendering."},
      {title: "Search Results Selection", classname: "com.marklogic.widgets.searchselect", description: "List documents selected in Search Results."},
      {title: "Structured Search Selection", classname: "com.marklogic.widgets.searchselection", description: "Select a structured search to execute."},
      {title: "Semantic Search Bar", classname: "com.marklogic.widgets.sparqlbar", description: "Visually create a sophisticated SPARQL query."},
      {title: "Semantic Search Results", classname: "com.marklogic.widgets.sparqlresults", description: "Show a summary of Subjects returned from a SPARQL query."},
      {title: "Semantic Subject Facts", classname: "com.marklogic.widgets.entityfacts", description: "Show the list of facts about a specific subject."}

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

/**
 * Adds a list of custom supported widgets to the MLJS defaults
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
  str += "  <div id='" + this.container + "-contexts-content' class='workplaceadmin-contexts-content hidden'>";
  str += "   <div id='" + this.container + "-contexts-list' class='workplaceadmin-contexts-list'><i>None</i></div>";
  str += "   <div id='" + this.container + "-contexts-add' class='workplaceadmin-contexts-add'>";
  str += "<table class='mljstable'>";
  str += "<tr><td>Add:</td><td>";
  str += "<select id='" + this.container + "-contexts-add-dropdown'>";
  str += "  <option value='SearchContext' title='Search Context' id='" + this.container + "-contextselect-searchcontext'>Search Context</option>";
  str += "  <option value='SemanticContext' title='Semantic Context' id='" + this.container + "-contextselect-semanticcontext'>Semantic Context</option>";
  str += "  <option value='DocumentContext' title='Document Context' id='" + this.container + "-contextselect-searchcontext'>Document Context</option>";
  str += "</select>";
  str += "</td></tr>";
  str += "</table>";
  str += "   </div>";
  str += "  </div>";
  str += "  <div id='" + this.container + "-actions-heading' class='workplaceadmin-actions-heading subtitle active'>Actions</div>";
  str += "  <div id='" + this.container + "-actions-content' class='workplaceadmin-actions-content hidden'>TODO</div>";
  str += "  <div class='workplaceadmin-buttonbar'>";
  str += "   <input class='btn btn-primary' id='" + this.container + "-save' value='Save' type='submit' />";
  str += "   <input class='btn btn-secondary' id='" + this.container + "-cancel' value='Cancel' type='submit' />";
  str += "  </div>";
  str += " </div>";
  str += " <div id='" + this.container + "-config' class='workplaceadmin-config container_12'>";
  str += "  <div id='" + this.container + "-config-layout'></div>";
  str += "  <div id='" + this.container + "-config-contexts'></div>";
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
      document.getElementById(this.container + "-page-urls").innerHTML.split(","),
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
  com.marklogic.widgets.hide(document.getElementById(this.container + "-contexts-content"),("contexts" != tab));
  com.marklogic.widgets.hide(document.getElementById(this.container + "-actions-content"),("actions" != tab));
  this._currentTab = tab;
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
  var wAss = this._layout.registerAssignment(wgtElid,instanceName);
  this._configWrappers.push(wgt);

  // update workplace config and register event handlers

  wgt.setWorkplaceContext(this._workplaceContext);
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

  // load top level layout for this page (or panel we are managing, at least)
  mljs.defaultconnection.logger.debug("workplaceadmin.updateWorkplace: Creating layout");
  mljs.defaultconnection.logger.debug("workplaceadmin.updateWorkplace: Got JSON: " + JSON.stringify(json));
  this._layout = new (com.marklogic.widgets.layouts[json.layout])(this.container + "-config-layout");
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
      var wgtAss = this._layout.registerAssignment(wgtElid,widget.widget);

      // now reposition (not required - appending in order)


      this._addDzAccept(aDrop, zone, dzAss.order, dzElid); // w ok to use at this point

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
  var contextListEl = document.getElementById(this.container + "-contexts-list");
  var ctxStr = "";
  for (var c = 0, maxc = json.contexts.length,ctx;c < maxc;c++) {
    ctx = json.contexts[c];
    ctxStr += "<div id='" + this.container + "-context-" + ctx.context + "' class='workplaceadmin-contexts-listitem'>" + ctx.context + "</div>";
  }
  contextListEl.innerHTML = ctxStr;

  // Add click handlers for contexts
  var addCtxHandler = function(ctxEl,json) {
    ctxEl.onclick = function(event) {
      // Show context configuration in RHS pane
      // load content
      var wrapper = new com.marklogic.widgets.configwrapper(self.container + "-config-contexts");
      var classConfig = null;
      if ("SearchContext" == json.type) {
        classConfig = mljs.defaultconnection.searchcontext.getConfigurationDefinition();
      } else if ("SemanticContext" == json.type) {
        classConfig = mljs.defaultconnection.semanticcontext.getConfigurationDefinition();
      } else if ("DocumentContext" == json.type) {
        classConfig = mljs.defaultconnection.documentcontext.getConfigurationDefinition();
      }
      wrapper.wrap(json.context,json.type,classConfig,json.config);

      // make visible
      com.marklogic.widgets.hide(document.getElementById(self.container + "-config-layout"),true);
      com.marklogic.widgets.hide(document.getElementById(self.container + "-config-contexts"),false);

      // stop event propagation
      event.stopPropagation();
      return false;
    };
  };
  for (var c = 0, maxc = json.contexts.length,ctx;c < maxc;c++) {
    ctx = json.contexts[c];
    var ctxEl = document.getElementById(this.container + "-context-" + ctx.context);
    addCtxHandler(ctxEl,ctx);
  }


  // TODO load other state information shown in left bar from JSON (is there any? Actions?)



  this._layout.printZoneInfo();

  mljs.defaultconnection.logger.debug("workplaceadmin.updateWorkplace: Finished creating layout");
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
  var str = "<div class='mljswidget dropzone'>";
  str += " <div class='dropzone-target' id='" + this.container + "-target'>";
  //str += "  <img src='/images/mljs/dropzone.png' />";
  str += "  <p class='dropzone-text'>Drop here</p>";
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

  this._workplaceContext = null;
  this.__nextID = 1;

  this._init();
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

/**
 * Instructs this widget to wrap the specified action list
 */
com.marklogic.widgets.actionorderer.prototype.wrap = function(actions) {
  this._actions = actions;

  // render in same order in display
};

/**
 * Returns the action list
 */
com.marklogic.widgets.actionorderer.prototype.getActions = function() {
  // TODO return options in their current order as a config
  // TODO also update out internal config, just incase
  return this._actions;
};








// REPLACE THE BELOW WITH A REFACTORED CONFIG WRAPPER???

/**
 * An individual action configuration wrapper widget
 * @constructor
 * @param {string} container - The HTML ID of the element to render this widget within
 */
com.marklogic.widgets.actionconfig = function(container) {
  this.container = container;
  this._config = null;
  this._init();
};

com.marklogic.widgets.actionconfig.prototype._init = function() {

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
  // TODO return updated config
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
    s += "<div class='container-fluid'>"
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
  s += "<div class='navbar-collapse collapse'><ul class='nav navbar-nav'>";

  if (null != this._config.homeUrl && "" != this._config.homeUrl.trim()) {
    s += "<li class='active'><a href='" + this._config.homeUrl + "'>" + this._config.homeText + "</a></li>";
  }

  if (null != this._workplaceContext) {
    var pages = this._workplaceContext.getCachedPages();
    for (var i = 0, maxi = pages.length, page;i < maxi;i++) {
      page = pages[i];
      s += "<li><a href='" + page.url + "'>" + page.title + "</a></li>";
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
  if (true === this._config.showAppConfigureLink) {
    s += "<li><a id=" + this.container + "-workplacenavbar-configureapp' href='" + this._config.appConfigureUrl +
         "'>" + this._config.appConfigureLinkText + "</a></li>";
  }
  s += "<li><a href='#'>" + this._config.pageConfigureLinkText + "</a></li>";
  if (true === this._config.showLogoutLink) {
    s += "<li><a href='" + this._config.logoutUrl + "'>" + this._config.logoutLinkText + "</a></li>";
  }
  s += "</ul></div><!--/.nav-collapse --></div><!--/.container-fluid --></div>";
  document.getElementById(this.container).innerHTML = s;

  // TODO click event handlers
  // TODO Just the edit page link required - the rest are URL based

};
