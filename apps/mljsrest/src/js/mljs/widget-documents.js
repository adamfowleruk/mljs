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
 * Shows an editable list of document properties from the document's properties fragment.
 *
 * @constructor
 * @param {string} container - ID of the HTML element to draw the widget within
 */
com.marklogic.widgets.docproperties = function(container) {
  this.container = container;

  this.documentcontext = null;
  this._properties = new Array();

  this._config = {
    showEditControls: false
  };

  this._uriHandlers = new Array();

  this._init();
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.docproperties.getConfigurationDefinition = function() {
  var self = this;
  return {
    showEditControls: {type: "boolean", default:false, title: "Show Edit Controls", description: "Allow editing of properties. Still requires permissions."}
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.docproperties.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }
};

/**
 * Sets the document context for this widget
 *
 * @param {documentcontext} ctx - The document context instance
 */
com.marklogic.widgets.docproperties.prototype.setDocumentContext = function(ctx) {
  this.documentcontext = ctx;
};

/**
 * Gets the document context for this widget
 */
com.marklogic.widgets.docproperties.prototype.getDocumentContext = function() {
  return this.documentcontext;
};

com.marklogic.widgets.docproperties.prototype._init = function() {
  var id = this.container + "-docproperties";
  var html = "<div id='" + id + "' class='mljswidget panel panel-info docproperties'>" +
  // TODO action button bar
  // TODO allow iriHandler for inline editing
      "<div id='" + id + "-properties' class='docproperties-properties'></div>" +
      "<div id='" + id + "-editor' class='docproperties-editor'></div>" +
    "</div>";
  document.getElementById(this.container).innerHTML = html;
};

/**
 * Called my a document context to indicate the document properties have been updated and should
 * be redrawn
 *
 * @param {result} result - The MLJS result wrapper object
 */
com.marklogic.widgets.docproperties.prototype.updateDocumentProperties = function(result) {
  this._hidePropertyEditor();
  /*
  {
  "collections": ["mixed", "testdata"],
  "permissions": [{
    "role-name": "rest-writer",
    "capabilities": ["update"]
  }, {
    "role-name": "rest-reader",
    "capabilities": ["read"]
  }],
  "properties": {},
  "quality": 0
  }
  */
  this._docuri = result.docuri;
  var props = result.properties.properties;
  this._properties = props;

    s = "<div class='title panel-heading docproperties-title'>Document Properties</div>";
    s += "<div class='panel-body docproperties-content'>";

  // Show meta information
    s += "<table class='table table-striped docproperties-meta-table'>";
    var columns = 2;
    var count = 0;
    var propcount = 0;
    var width = 100 / (2 * columns);
    var firstRow = true;
    var propvalue, mreplace;
    var propsGot = new Array();
    var propMapping = new Array(); // [name] -> index


  var allprops = this.documentcontext.getAllowableProperties();
  var isEditable = function(propertyname) {
    for (var i = 0, max = allprops.length, prop, name;i < max;i++) {
      prop = allprops[i];
      name = prop.name;
      if (name == propertyname) {
        return true;
      }
    }
    return false;
  };

  for (var name in props) {
    propvalue = props[name];
    propsGot.push(name);
    propcount++;
    propMapping[name] = propcount;
        if (count >= columns) {
          s += "</tr><tr>";
          count = count % columns;
          firstRow = false;
        }
        count++;
        s += "<td";
        if (firstRow) {
          s += " style='width: " + (0.8 * width) + "%;'";
        }
        s += "><b id='" + this.container + "-docproperties-propname-" + propcount + "' class='docproperties-name";

        // use docproperties-name-editable class when property is editable class='docproperties-name-editable'
        if (isEditable(name)) {
          s +=" docproperties-name-editable";
        }
        s += "'>" + name + ":</b> </td><td";
        if (firstRow) {
          s += " style='width: " + (1.2*width) + "%;'";
        }
        s += ">";
        mreplace = this._uriHandlers[name];
        if (undefined != mreplace) {
          propvalue = "<a href='" + mreplace.replace("#URI#",encodeURI(propvalue)) + "'>" + propvalue + "</a>";
        }
        s += propvalue + "</td>";
    }
    if (0 == propcount) {
      s += "<td colspan='" + columns + "'><i>No Properties Found</i></td>";
    } else {
    for (;count < columns;count++) {
      s += "<td";
      if (firstRow) {
        s += " style='width: " + (0.8*width) + "%;'";
      }
      s += ">&nbsp;</td>";
      s += "<td";
      if (firstRow) {
        s += " style='width: " + (1.2*width) + "%;'";
      }
      s+= ">&nbsp;</td>";
    }
  }
    s += "</tr></table>";

  // add property control
  var missingProps = new Array();
  mljs.defaultconnection.logger.debug("docproperties._init: Allowable properties.length: " + allprops.length);
  for (var i = 0, max = allprops.length, prop, name;i < max;i++) {
    prop = allprops[i];
    name = prop.name;
    mljs.defaultconnection.logger.debug("docproperties._init: Evaluating allowable property: " + name);
    if (!propsGot.contains(name)) {
      missingProps.push(prop);
    }
  }

  s += "<div class='docproperties-addprop";
  /**
  if (0 == missingProps.length) {
    s += " hidden";
  }*/
  if (true !== this._config.showEditControls) {
    s += " hidden";
  }
  s += "'>Add Property: <select id='" + this.container + "-docproperties-addprop-select'>";
  for (var i = 0, max = missingProps.length, prop;i < max;i++) {
    prop = missingProps[i];
    mljs.defaultconnection.logger.debug("docproperties._init: Evaluating missing property: " + JSON.stringify(prop));
    s += "<option value='" + prop.name + "'>" + prop.title + "</option>";
  }
  s += "</select><input type='button' class='btn btn-primary' id='" + this.container + "-docproperties-addprop-button' value='Add' />";

  s += "</div></div>";


  var el = document.getElementById(this.container + "-docproperties-properties");
  el.innerHTML = s;

  // add click handlers now
  var self = this;
  document.getElementById(this.container + "-docproperties-addprop-button").onclick = function(e) {
    self._showPropertyEditor(document.getElementById(self.container + "-docproperties-addprop-select").value);

    e.stopPropagation();
    return false;
  };

  var addPropHandler = function(ourpc,prop) {
	  mljs.defaultconnection.logger.debug("*** ourpc: " + ourpc + ", prop: " + JSON.stringify(prop));
      // create onclick handler
      document.getElementById(self.container + "-docproperties-propname-" + ourpc).onclick = function(e) {
        self._showPropertyEditor(prop.name);

        e.stopPropagation();
        return false;
      };
  };

  // loop through allowable and add edit click handlers
  for (var i = 0, max = allprops.length,prop,propcount,ourpc;i < max;i++) {
    prop = allprops[i];
    if (propsGot.contains(prop.name)) {
      ourpc = propMapping[prop.name];

      addPropHandler(ourpc,prop);
    }
  }
};

com.marklogic.widgets.docproperties.prototype._showPropertyEditor = function(propname) {
  mljs.defaultconnection.logger.debug("docproperties._showPropertyEditor: propname: " + propname);

  var prop = this.documentcontext.getAllowableProperty(propname);
  this._propEditing = prop;


  var propvalue = this._properties[propname]; // TODO validate this comes back as either a single string property or an array

  var propcount = 0;

  // draw HTML edit box
  var s = "";
  var el = document.getElementById(this.container + "-docproperties-editor");
  //s += "<div class=\"overlay\"><div class=\"modaltable\"><div class=\"modalcell\"><div class=\"modalcontent\"> ";
  s += "<div class='semantic-content is-active' id='" + this.container + "-docproperties-container'><div class='modal-inner'>";
  s += "<h2 class=\"title modal-label\">Editing '" + prop.title + "'</h2><div id='" + this.container + "-docproperties-values' class='docproperties-values modal-content'>";

  // if cardinality is 1, show single textarea with current value
  // otherwise, show list of values with clickable x to remove a value, and an input box to add a value
  if ("*" == prop.cardinality) {
    if (null != propvalue && undefined != prop.join) {
      propvalue = propvalue.split(prop.join);
    }
    if ("string" == typeof propvalue) {
      propvalue = [propvalue]; // workaround the REST API returning either a single string or an array
    } else if (null == propvalue) {
      propvalue = [];
    }
    for (var i = 0, max = propvalue.length,value;i < max;i++) {
      value = propvalue[i];
      propcount++;
      s += this._genValueSpan(value,propcount);
    }
    if (0 == propvalue.length) {
      s += "<p id='" + this.container + "-docproperties-editor-none' class='docproperties-none'>Empty</p>";
    }
  }
  s += "</div>"; // end div.docproperties-values

  s += "<input type='text' size='40' id='" + this.container + "-docproperties-editor-input' class='docproperties-editor-input' value='";
  if (!("*" == prop.cardinality)) {
    s += encodeURI(propvalue);
  }
  s += "' />";
  if ("*" == prop.cardinality) {
    s += "<input type='button' class='btn btn-primary docproperties-editor-addbutton' id='" + this.container + "-docproperties-editor-addbutton' value='Add' />";
    // TODO set this button as the default so hitting enter adds a property
    //s += " <br/><i>Hint: You can also hit enter to add a keyword</i><br/>";
  }

  // show action buttons
  s += "<div style='text-align: center;'>";
  s += "  <input type='button' class='btn btn-primary docproperties-editor-save' id='" + this.container + "-docproperties-editor-save' value='Save' />";
  s += "  <input type='button' class='btn btn-secondary docproperties-editor-cancel' id='" + this.container + "-docproperties-editor-cancel' value='Cancel' />";
  s += "</div>";
  s += "</div>";

  //s += "</div></div></div></div>";
  s += "</div></div>";

  el.innerHTML = s;


  if ("*" == prop.cardinality) {
    for (var i = 0, max = propvalue.length,value;i < max;i++) {
      this._addValueSpanHandler(propvalue[i],i+1);
    }
  }

  // click handlers
  var self = this;
  var doAdd = function() {
    // get current value of input box
    var inel = document.getElementById(self.container + "-docproperties-editor-input");
    var val = inel.value;
    if (!(undefined == val || "" == val.trim())) {
      // add to keywords
      propcount++;
      var s = self._genValueSpan(val,propcount);
      com.marklogic.widgets.appendHTML(document.getElementById(self.container + "-docproperties-values"),s);
      self._addValueSpanHandler(val,propcount);
      // empty keyword box
      inel.value = "";
      // hide 'empty' message

      var noneel = document.getElementById(self.container + "-docproperties-editor-none");
      if (undefined != noneel) {
        com.marklogic.widgets.hide(noneel,true);
      }
    }
    // place focus on keyword box
    inel.focus(); // TODO validate this
  };
  document.getElementById(this.container + "-docproperties-editor-addbutton").onclick = function (e) {
    doAdd();
    e.stopPropagation();
    return false;
  };
  document.getElementById(this.container + "-docproperties-editor-save").onclick = function (e) {
    // see if input box has value, and add it
    doAdd(); // performs empty check

    // fetch value(s) from spans or input box
    var value = new Array();
    if ("*" == self._propEditing.cardinality) {
      var valel = document.getElementById(self.container + "-docproperties-values");
      var spans = valel.getElementsByTagName("span");
      if (0 == spans.length) {
        // remove this property
        value = undefined;
      } else {
        for (var i = 0, max = spans.length,span;i < max;i++) {
          span = spans[i];
          value.push(span.innerHTML);
        }
        if (undefined != self._propEditing.join) {
          var newvalue = "";
          for (var i = 0, max = value.length;i < max;i++) {
            if (i > 0) {
              newvalue += self._propEditing.join;
            }
            newvalue += value[i];
          }
          value = newvalue;
        }
      }
    } else {
      value = document.getElementById(self.container + "-docproperties-editor-input").value;
    }
    // mix in properties with existing properties
    self._properties[self._propEditing.name] = value;
    // save properties
    self.documentcontext.setProperties(self._docuri,{properties: self._properties}); // TODO validate this will work. E.g. for just properties and not all metadata
    self._hidePropertyEditor();
  };
  document.getElementById(this.container + "-docproperties-editor-cancel").onclick = function (e) {
    self._hidePropertyEditor(); // no need to clear editor - will refresh on its next display - WRONG
  };

  // make visible
  com.marklogic.widgets.hide(el,false);
  //var sc = document.getElementById(this.container + "-docproperties-container");
  //com.marklogic.widgets.hide(sc,false);
};

com.marklogic.widgets.docproperties.prototype._editProperty = function(propname) {

};

com.marklogic.widgets.docproperties.prototype._genValueSpan = function(value,index) {
  return "<span id='" + this.container + "-docproperties-editor-value-" + index + "' class='docproperties-value'>" + value + "</span> <a href='#' id='" + this.container + "-docproperties-editor-value-" + index + "-remove'>X</a> ";
  // TODO validate this can only be a string (JSON object too?)
};

com.marklogic.widgets.docproperties.prototype._addValueSpanHandler = function(value,index) {
  mljs.defaultconnection.logger.debug("docproperties._addValueSpanHander: value: " + value + ", index: " + index);

  var self = this;
  document.getElementById(this.container + "-docproperties-editor-value-" + index + "-remove").onclick = function(e) {
    var el = document.getElementById(self.container + "-docproperties-editor-value-" + index);
    el.parentNode.removeChild(el);
    el = document.getElementById(self.container + "-docproperties-editor-value-" + index + "-remove");
    el.parentNode.removeChild(el);

    e.stopPropagation();
    return false;
  };
};

com.marklogic.widgets.docproperties.prototype._addValueRemovalHandler = function(index) {
  document.getElementById(this.container + "-docproperties-editor-value-" + index).onclick = function (e) {
    // TODO HOW TO REMOVE HTML ELEMENT???

    e.stopPropagation();
    return false;
  };
};

com.marklogic.widgets.docproperties.prototype._hidePropertyEditor = function() {
  //com.marklogic.widgets.hide(document.getElementById(this.container + "-docproperties-editor"),true);
  document.getElementById(this.container + "-docproperties-editor").innerHTML = "";
};

/**
 * Called by the document context to indicate that a document is being updated through a MarkLogic server call
 * and that the UI should be disabled until complete.
 *
 * @param {object} msg - The operation description of what is happening to the document (e.g. setProperties called)
 */
com.marklogic.widgets.docproperties.prototype.updateOperation = function(msg) {
  if (msg.docuri == this._docuri) {
    if ("setProperties" == msg.operation) {
      // hide edit box
      this._hidePropertyEditor();

      // TODO display message until timeout
    }
  }
};









/**
 * Views the head section properties from an XHTML document. These properties are
 * always embedded within a document. This is distinct from MarkLogic document properties
 * which are held in the document properties fragment and are nothing to do with XHTML.
 *
 * @constructor
 * @param {string} container - ID of the HTML element to draw this widget in
 */
com.marklogic.widgets.docheadviewer = function(container) {
  this.container = container;

  this._uriHandlers = new Array(); // propertyname -> pattern string #URI#

  this._config = {};

  this._init();
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.docheadviewer.getConfigurationDefinition = function() {
  var self = this;
  return {
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.docheadviewer.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }
};

/**
 * Adds an action handler with a specified property name. A pattern is given that
 * indicates the page to navigate to when the property value is clicked.
 *
 * @param {string} name - The property name
 * @param {string} pattern - The string pattern to replace #DOCURI# in, in order to navigate to a new page
 */
com.marklogic.widgets.docheadviewer.prototype.addUriHandler = function(name,pattern) {
  this._uriHandlers[name] = pattern;
};

/**
 * Sets the document context for this widget
 *
 * @param {documentcontext} ctx - The document context instance
 */
com.marklogic.widgets.docheadviewer.prototype.setDocumentContext = function(ctx) {
  this.documentcontext = ctx;
};

/**
 * Gets the document context for this widget
 */
com.marklogic.widgets.docheadviewer.prototype.getDocumentContext = function() {
  return this.documentcontext;
};

com.marklogic.widgets.docheadviewer.prototype._init = function() {
  var id = this.container + "-docheadviewer";
  var html = "<div id='" + id + "' class='mljswidget panel panel-info docheadviewer'>" +
  // TODO action button bar
  // TODO allow iriHandler for inline editing
  //    "<div id='" + id + "-properties' class='docheadviewer-properties'>&nbsp;</div>" +
    "</div>";
  document.getElementById(this.container).innerHTML = html;
};

/**
 * Called by a document context to indicate that the document content has been reloaded, and should be redrawn
 *
 * @param {result} result - The MLJS result wrapper
 */
com.marklogic.widgets.docheadviewer.prototype.updateDocumentContent = function(result) {

  // If not XHTML or not head element, hide ourselves


  var hid = this.container + "-docheadviewer";
  var headel = document.getElementById(hid);

  var dohide = function() {
    headel.innerHTML = "";
    com.marklogic.widgets.hide(headel,true);
    return;
  };

    // TODO insert doc metadata fetch here too

  if (null == result || "boolean" === typeof result || null == result.doc) {
    dohide();
    return;
  }

    var xml = result.doc;
  this.docuri = result.docuri;

    var head = xml.getElementsByTagName("head")[0];


    if (null == head) {
      dohide();
      return;
    }


    var count = 0;

    var s = "";

    var titleEl = head.getElementsByTagName("title");
    var title = result.docuri;
    if (titleEl.length > 0 && null != titleEl[0] && null != titleEl[0].nodeValue) {
      title = titleEl[0].nodeValue;
    }
    var subjectEl = head.getElementsByTagName("Subject");
    if (subjectEl.length > 0 && null != subjectEl[0] && null != subjectEl[0].nodeValue) {
      title = subjectEl[0].nodeValue;
    }
    s += "<div class='title panel-heading docheadviewer-title'>" + title + " <span class='small docheadviewer-meta-title'>Document Extracted Metadata</span> </div>";
    s += "<div class='panel-body docheadviewer-content'>";

  // Show meta information
    s += "<table class='table table-striped docheadviewer-meta-table'><tr>";
    var metas = head.getElementsByTagName("meta");
    var columns = 2;
    var width = 100 / (2 * columns);
    var firstRow = true;
    var mname, mvalue, mreplace;
    for (var m = 0;m < metas.length;m++) {
      var meta = metas[m];
        if (count >= columns) {
          s += "</tr><tr>";
          count = count % columns;
          firstRow = false;
        }
        count++;
        s += "<td";
        if (firstRow) {
          s += " style='width: " + (0.8 * width) + "%;'";
        }
        mname = meta.getAttribute("name");
        s += "><b>" + mname + ":</b> </td><td"
        if (firstRow) {
          s += " style='width: " + (1.2*width) + "%;'";
        }
        mvalue = meta.getAttribute("content");
        mreplace = this._uriHandlers[mname];
        if (undefined != mreplace) {
          mvalue = "<a href='" + mreplace.replace("#URI#",encodeURI(mvalue)) + "'>" + mvalue + "</a>";
        }
        s += ">" + mvalue + "</td>";
    }
    for (;count < columns;count++) {
      s += "<td";
      if (firstRow) {
        s += " style='width: " + (0.8*width) + "%;'";
      }
      s += ">&nbsp;</td>";
      s += "<td";
      if (firstRow) {
        s += " style='width: " + (1.2*width) + "%;'";
      }
      s+= ">&nbsp;</td>";
    }
    s += "</tr></table>";

    s += "</div>";

    /*

    // Show top level classification
    s += "<h2 class='docheadviewer-security-title'>Document Security Information</h2> <div class='docheadviewer-security-rolecontainer'>";

    var readperm = "confidential-read"; // TODO read from doc metadata
    var updateperm = "confidential-write"; // TODO remove markings permissions we do not have as a user

    // render read permission selection
    var secinfo = "<label for='" + self.container + "-docheadviewer-security-read'>Role for Read access: </label>";
        secinfo += "<select id='" + self.container + "-docheadviewer-security-read'>";
        for (var p = 0;p < self._permissions.length;p++) {
          secinfo += "<option value='" + self._permissions[p];
          console.log("this perm: '" + self._permissions[p] + "'");
          if (readperm == self._permissions[p]) {
            secinfo += "' selected='selected";
          }
          secinfo += "'>" + self._permissions[p] + "</option>";
        }
        secinfo += "</select>";
    s += secinfo;

    // render update permission selection
    secinfo = "<label for='" + self.container + "-docheadviewer-security-update'>Role for Update access: </label>";
        secinfo += "<select id='" + self.container + "-docheadviewer-security-read'>";
        for (var p = 0;p < self._updatepermissions.length;p++) {
          secinfo += "<option value='" + self._updatepermissions[p];
          console.log("this perm: '" + self._updatepermissions[p] + "'");
          if (updateperm == self._updatepermissions[p]) {
            secinfo += "' selected='selected";
          }
          secinfo += "'>" + self._updatepermissions[p] + "</option>";
        }
        secinfo += "</select>";

    s += secinfo + "</div>";

    */

    headel.innerHTML = s;



};






















/**
 * Previews an (XHTML) document. Tries to introspect the document to use the most appropriate method.
 *
 * @constructor
 * @param {string} container - The HTML ID of the element to place this widget's content within.
 */
com.marklogic.widgets.docviewer = function(container) {
  this.container = container;
  this.errorPublisher = new com.marklogic.events.Publisher();

  this._config = {};

  this._init();
};

/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this widget
 *
 * @static
 */
com.marklogic.widgets.docviewer.getConfigurationDefinition = function() {
  var self = this;
  return {
  };
};

/**
 * Sets the configuration for this instance of a widget in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace widget configuration to apply
 */
com.marklogic.widgets.docviewer.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }
};

/**
 * Sets the document context for this widget
 *
 * @param {documentcontext} ctx - The document context instance
 */
com.marklogic.widgets.docviewer.prototype.setDocumentContext = function(ctx) {
  this.documentcontext = ctx;
};

/**
 * Gets the document context for this widget
 */
com.marklogic.widgets.docviewer.prototype.getDocumentContext = function() {
  return this.documentcontext;
};


/**
 * Adds an error listener to this widget
 *
 * @param {function(error)} fl - The error listener to add
 */
com.marklogic.widgets.docviewer.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 *
 * @param {function(error)} fl - The error listener to remove
 */
com.marklogic.widgets.docviewer.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};


com.marklogic.widgets.docviewer.prototype._init = function() {
  var id = this.container + "-docviewer";
  var html = "<div id='" + id + "' class='mljswidget panel panel-info docviewer'>" +
  // TODO action button bar
  //    "<div id='" + id + "-doccontent' class='docviewer-doccontent'>&nbsp;</div>" +
    "</div>";
  document.getElementById(this.container).innerHTML = html;
};


/**
 * Loads the specified document content from MarkLogic and processes it (if required) for display.
 *
 * @param {mljs.result} result - Document content to show
 */
com.marklogic.widgets.docviewer.prototype.updateDocumentContent = function(result) {
  this.docuri = result.docuri;

  // TODO check document type for display

  // XHTML - view body inline

  // show loading messages
  var cid = this.container + "-docviewer";
  var content = "<div class='title panel-heading docviewer-content-title'>Document Content</div>";
  content += "<div class='panel-body docviewer-content'>";
  mljs.defaultconnection.logger.debug("docviewer.updateDocumentContent: Result format: " + result.format);

  if ("xml" == result.format) {
    var xml = result.doc;
    // Turns out the REST API reports text/html for custom XML too!!! Sanity check it now.
    var root = xml.firstChild;
    var nn = root.nodeName;
    var nnidx = nn.indexOf(":");
    if (-1 != nnidx) {
      nn = nn.substring(nnidx + 1);
    }
    var isXHTML = (nn == "html") && (root.namespaceURI == "http://www.w3.org/1999/xhtml");

    mljs.defaultconnection.logger.debug("docviewer.updateDocumentContent: root namespace: " + root.namespaceURI + ", nodeName: " + nn);
    mljs.defaultconnection.logger.debug("docviewer.updateDocumentContent: Result mime: " + result.mime);
    if (/*0 == ("" + result.mime).indexOf("text/html") &&*/ isXHTML) {
      mljs.defaultconnection.logger.debug("docviewer.updateDocumentContent: Showing HTML");


      var s = "";

      // get contents of Body tag
      var body = xml.getElementsByTagName("body")[0];


      // TODO Check to see if contents are all <div class="secure-section ...
      //var topContent = body.childNodes;

      var divs = null;

      if (undefined == body) {
        content += "<p><b>Document has no content</b></p>";
      } else {
        content += "<div class='docviewer-content-display'>";
        // get its content only
        for (var c = 0,child,maxc = body.childNodes.length;c < maxc;c++) {
          child = body.childNodes[c];
          content += (new XMLSerializer()).serializeToString(child);
        }
        content += "</div>";
      }
    } else {
      mljs.defaultconnection.logger.debug("docviewer.updateDocumentContent: Showing generic XML");
      // generic XML - pretty print response somehow
      content += com.marklogic.widgets.searchhelper.xmltohtml(result.doc);
    }

  } else if ("json" == result.format) {
    mljs.defaultconnection.logger.debug("docviewer.updateDocumentContent: Showing generic JSON");
    // generic JSON - pretty print response somehow
    content += com.marklogic.widgets.searchhelper.jsontohtml(result.doc);
  } else if ("text" == result.format) {
    mljs.defaultconnection.logger.debug("docviewer.updateDocumentContent: Showing generic text");
    content += result.doc;
  } else {
    mljs.defaultconnection.logger.debug("docviewer.updateDocumentContent: Showing unknown binary");
    // binary / unknown - download, or view as image
    if ((0 == ("" + result.mime).indexOf("image/"))) {
      mljs.defaultconnection.logger.debug("docviewer.updateDocumentContent: Showing as image");
      content += "<img src='/v1/documents?uri=" + encodeURI(result.docuri) + "' />";
    } else {
      mljs.defaultconnection.logger.debug("docviewer.updateDocumentContent: Showing as link for download");
      // binary download link
      content += "Document is of type '" + result.mime +
        "' - <a href='/v1/documents?uri=" + encodeURI(result.docuri) + "'>click to download</a>";
    }
  }

  content += "</div>";
  document.getElementById(cid).innerHTML = content;

};
