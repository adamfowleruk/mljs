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
 * Provides a form builder widget to allow the creation of a document. Also includes file update widget and security widgets.
 * @constructor
 * @param {string} container - The HTML ID of the element to place this widget's content within.
 */
com.marklogic.widgets.create = function(container) {
  this.container = container;
  this.errorPublisher = new com.marklogic.events.Publisher();

  this.vertical = true; // vertical or horizontal first rendering

  this._collections = new Array();
  this._permissions = new Array(); // ?

  this.currentRow = 0;
  this.currentColumn = 0;

  this.completePublisher = new com.marklogic.events.Publisher();

  this.controlCount = 0;
  this.fileDrops = new Array();
  this.fileDropFiles = new Array();

  this.override = false;
  this.overrideEndManual = false;
  this.overrideElementId = "";

  this._doccontext = null;


  this._uriprefix = "/";

  this.controls = new Array();
  this.controlData = new Array();

  this._mode = "upload"; // upload or json or xml

  this._init();
};

com.marklogic.widgets.create.prototype.setDocumentContext = function(ctx) {
  this._doccontext = ctx;
};

com.marklogic.widgets.create.prototype.updateDocumentContent = function(json) {
  var uri = json.docuri;
  var content = json.doc;
  // update title
  var t = document.getElementById(this.container + "-title");
  t.innerHTML = "Editing document - <i>" + uri + "</i>";

  // TODO update fields on page (in case trigger has updated them)
};

/**
 * Adds an error listener to this widget
 *
 * @param {function(error)} fl - The error listener to add
 */
com.marklogic.widgets.create.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 *
 * @param {function(error)} fl - The error listener to remove
 */
com.marklogic.widgets.create.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};

com.marklogic.widgets.create.prototype._init = function() {
  var parentel = document.getElementById(this.container);
  parentel.innerHTML =
    "<div id='" + this.container + "-create' class='mljswidget panel panel-info create'>" +
      "<div id='" + this.container + "-title' class='panel-heading create-title'>Create a new Document</div>" +
      "<form id='" + this.container + "-create-form' class='panel-body form-horizontal create-form' role='form'>" +
        "<div class='create-row' id='" + this.container + "-create-row-0'>" +
          "<div class='create-col' id='" + this.container + "-create-row-0-col-0' style='float:left;'></div>" +
        "</div>" +
      "</form>"
    "</div><div style='";
};

// LAYOUT FUNCTIONS

com.marklogic.widgets.create.prototype._place = function(html,type,id) {
  if (this.override) {
    // override placement (allows containment within widget)
    com.marklogic.widgets.appendHTML(document.getElementById(this.overrideElementId),html);
  } else {
    // place the html in the 'current' position, and increment
    var cid = this.container + "-create-row-" + this.currentRow + "-col-" + this.currentColumn;
    var cel = document.getElementById(cid);
    cel.innerHTML = html;
    if (this.vertical) {
      this.endRow();
    } else {
      // incrememnt column
      this.currentColumn++;
      // append column div to row element
      var h = "<div class='create-col' id='" + this.container + "-create-row-" + this.currentRow + "-col-" + this.currentColumn + "' style='float:left;'></div>";
      com.marklogic.widgets.appendHTML(document.getElementById(this.container + "-create-row-" + this.currentRow),h);
    }
  }

  // add the control definition to our form references link - so save can process the form
  if (undefined != type && undefined != id) {
    this.controls.push({type: type,id: id});
  }
};

/**
 * Ends the current row run and starts a new row.
 */
com.marklogic.widgets.create.prototype.endRow = function() {
  // clear previous row
  com.marklogic.widgets.appendHTML(document.getElementById(this.container + "-create-row-" + this.currentRow),"<div style='clear:both'></div>");

    // create new row
    this.currentRow++;
    // reset column counter
    this.currentColumn = 0;
    // append div to form element
    var h =
        "<div class='create-row' id='" + this.container + "-create-row-" + this.currentRow + "'>" +
          "<div class='create-col' id='" + this.container + "-create-row-" + this.currentRow + "-col-" + this.currentColumn + "' style='float:left;'></div>" +
        "</div>";
    com.marklogic.widgets.appendHTML(document.getElementById(this.container + "-create-form"),h);

  return this;
};

// Configuration methods for create widget - MUST be called before control creation methods

/**
 * Specifies the creation mode for the widget. Can be "upload", "json" or "xml". If upload, the underlying browser's mime type support determines the type to send the document to MarkLogic as.
 *
 * @param {string} newMode - The new mode to use
 */
com.marklogic.widgets.create.prototype.mode = function(newMode) {
  this._mode = newMode;

  return this;
};

/**
 * Specifies the URI prefix of the newly generated document.
 *
 * @param {string} prefix - The document URI prefix to use.
 */
com.marklogic.widgets.create.prototype.uriPrefix = function(prefix) {
  this._uriprefix = prefix;

  return this;
};
com.marklogic.widgets.create.prototype.uriprefix = com.marklogic.widgets.create.prototype.uriPrefix; // backwards compatibility

/**
 * Specifies that the next created 'cell' should be to the right of the current one. Difference between a table layout and a vertical div layout.
 * Vertical is the default.
 */
com.marklogic.widgets.create.prototype.horizontal = function() {
  // draw new controls horizontally, not vertically
  this.vertical = false;

  return this;
};

/**
 * Specifies that the resultant document should also be added to a collection with the name 'user-USERID'.
 * TODO will call mljs's whoami extension to determine username, if not already known.
 */
com.marklogic.widgets.create.prototype.collectionUser = function() {
  // add user- and this user's id to the collection list

  return this;
};

/**
 * Adds the resultant document(s) to the specified collection. May be called multiple times if multiple collections are required.
 *
 * @param {string} col - Collection name to add the new document(s) to.
 */
com.marklogic.widgets.create.prototype.collection = function(col) {
  this._collections.push(col);

  return this;
};

// FORM CONTROLS

/**
 * Places a drag and drop upload control within the current cell, and creates a new cell.
 */
com.marklogic.widgets.create.prototype.dnd = function() {
  // check for browser support
  if (window.File && window.FileReader && window.FileList && window.Blob) {
    // Great success! All the File APIs are supported.
    console.log("File API is supported by this browser");
  } else {
    console.log('The File APIs are not fully supported in this browser.');
  }

  // create a drag and drop widget
  var id = this.container + "-dnd-" + ++this.controlCount;
  /*
  var html = "<div id='" + id + "' class='create-dnd'></div>";

  this._place(html,"dnd",id);

  var fd = new FileDrop(id,{dragOverClass: "create-dnd-hover"});
  this.fileDrops[id] = fd;
  this.fileDropFiles[id] = new Array();

  var self = this;
  fd.on.send = function (files) {
    // store file objects until user clicks save
    for (var f = 0;f < files.length;f++) {
      self.fileDropFiles[id].push(files[f]);
    }
  };

  this.controlData[id] = {filedrop: fd};
  */

  var html = "<input type='file' id='" + id + "' class='span2 form-control btn btn-default create-file' />";
  this._place(html,"dnd",id);

  var self = this;
  document.getElementById(id).onchange = function(evt) {
    console.log("file onchange fired");
    self.controlData[id] = {files: evt.target.files};
    console.log("Saved file data");
  };

  return this;
};

/**
 * Ensures that the resultant document has the specified permission object applied, in addition to those from any embedded permissions widgets.
 *
 * @param {JSON} permObject - The permission specification to use. E.g. {role: "topsecret", permission: "read"}
 */
com.marklogic.widgets.create.prototype.forcePermission = function(permObject) {
  this._permissions.push(permObject);

  return this;
};

/**
 * Adds a permissions drop down widget to the current cell, and creates a new cell.
 *
 * @param {boolean} allowMultiple - Whether to allow multiple roles to be selected. NOT SUPPORTED (i.e. always false)
 * @param {string[]} firstRoleArray - The lists of roles to allow selection of. Lowest access first. Normally all are in the same security compartment.
 * @param {string} title_opt - The optional title text to show next to the control. E.g. 'Role for Read'
 * @param {string} privilege - The privliege to grant to the selected role. E.g. read, update, delete
 */
com.marklogic.widgets.create.prototype.permissions = function(allowMultiple,firstRoleArray,title_opt,privilege) {
  if (undefined == privilege) {
    privilege = title_opt;
    title_opt = undefined;
  }

  // add permissions control
  var id = this.container + "-permissions-" + (++this.controlCount);
  var html = "<div id='" + id + "' class='form-group input-prepend create-permissions'>";
  if (undefined != title_opt) {
    html += "<label for='" + id + "-select' class='col-sm-2 control-label create-select-title'>" + title_opt + "</label> ";
  }
  html += "<div class='col-sm-10'>";
  html += "<select id='" + id + "-select' class='form-control create-select'>";

  for (var i = 0;i < firstRoleArray.length;i++) {
    html += "<option value='" + firstRoleArray[i] + "'>" + firstRoleArray[i] + "</option>";
  }

  html += "</select></div></div>";

  this._place(html,"permissions",id);
  this.controlData[id] = {privilege:privilege};
  return this;
};

/**
 * Generates a button bar as a full row below the current row.
 */
com.marklogic.widgets.create.prototype.bar = function() {
  var id = this.container + "-bar-" + ++this.controlCount;
  var html = "<div id='" + id + "' class='create-bar'></div>";
  this._place(html,"bar",id);

  // override placement strategy
  this.override = true;
  this.overrideElementId = id;
  this.overrideEndManual = true;

  return this;
};

/**
 * Ends the current bar, and adds any subsequent content to a new row.
 */
com.marklogic.widgets.create.prototype.endBar = function() {
  this.override = false;
  this.overrideEndManual = false;
  this.overrideElementId = "";

  //this._place("");

  return this;
};

/**
 * Generates a save button control at the current position.
 *
 * @param {string} title_opt - Optional string title to show on the button. (Defaults to 'Save')
 */
com.marklogic.widgets.create.prototype.save = function(title_opt) {
  var id = this.container + "-create-save-" + ++this.controlCount;
  var title = "Save";
  if (undefined != title_opt) {
    title = title_opt;
  }

  var html = "<div class='col-sm-offset-2 col-sm-10'><button class='btn btn-primary create-save' type='submit' id='" + id + "'>" + title + "</button></div>";
  this._place(html,"save",id);

  var self = this;
  //document.getElementById(id).onclick = function(e) {console.log("got onclick");self._onSave(self);console.log("done onsave");e.stopPropagation();console.log("done stop prop");return false;}; // TODO Check this is valid
  document.getElementById(this.container + "-create-form").onsubmit = function() {
    try {
      self._onSave();
    } catch (ex) {
      console.log("ERROR ON SAVE: " + ex);
    }
    return false;
  };
  // TODO find a way to do this without working at the form level

  return this;
};

// OTHER FIELD TYPES SUPPORTED

/*
fieldDef = {
  title: "Main Heading", path: "/h:body/h:h1[1]", namespaces: {h: "http://whatever"}, // also path: "some.json.path"
  type: "string|datetime|date|positiveInteger|integer|float|double", // basically any xs: intrinsic type
  required: true, min: 1, max: 7, default: 5, multiple: true // min max for numeric types, multiple for multi instance selects (for example)
}

// title defaults to CamelCase and split of last path element, type to string, required to false, multiple false, no namespaces
// thus only required field is path.
*/

com.marklogic.widgets.create.prototype.defaults = function(settings) {
  // set defaults used when creating shell fieldDef
    return this;
};

com.marklogic.widgets.create.prototype.text = function(fieldDef) {
  var id = this.container + "-text-" + ++this.controlCount;

  this._doccontext.completeFieldDef(fieldDef);

  var value = this._doccontext.getPart(fieldDef);
  if (null == value) {
    value = "";
  }
  var s = "<div id='" + id + "' class='form-group input-prepend create-text-outer'>";
  s += "<label for='" + id + "-input' class='col-sm-2 control-label create-text-label'>" + fieldDef.title + "</label>";
  s += "<div class='col-sm-10'>";
  s += "<input id='" + id + "-input' value='" + value + "' class='form-control create-text-input' />"; // TODO encode value for embedding in HTML
  s += "</div>";
  s += "</div>";

  // TODO if vertical, start row with label on left, field on right
  // TODO if horizontal, place label above field

  this._place(s,"text",id);

  // change event handler
  var el = document.getElementById(id + "-input");
  var self = this;
  el.onchange = function(evt) {
    self._doccontext.setPart(fieldDef,el.value);
  };

  return this;
};

com.marklogic.widgets.create.prototype.largeText = function(fieldDef) {
    var id = this.container + "-largetext-" + ++this.controlCount;

    this._doccontext.completeFieldDef(fieldDef);

    var value = this._doccontext.getPart(fieldDef);
    if (null == value) {
      value = "";
    }
    var s = "<div id='" + id + "' class='form-group input-prepend create-largetext-outer'>";
    s += "<label for='" + id + "-input' class='col-sm-2 control-label create-largetext-label'>" + fieldDef.title + "</label>";
    s += "<div class='col-sm-10'>";
    s += "<textarea id='" + id + "-input' class='form-control create-largetext-input'>" + value + "</textarea>"; // TODO encode value for embedding in HTML
    s += "</div>";
    s += "</div>";

    // TODO if vertical, start row with label on left, field on right
    // TODO if horizontal, place label above field

    this._place(s,"largetext",id);

    // change event handler
    var el = document.getElementById(id + "-input");
    var self = this;
    el.onchange = function(evt) {
      self._doccontext.setPart(fieldDef,el.value);
    };

    return this;
};

com.marklogic.widgets.create.prototype.largeHTML = function(fieldDef) {
    var id = this.container + "-largehtml-" + ++this.controlCount;

    this._doccontext.completeFieldDef(fieldDef);

    var value = this._doccontext.getPart(fieldDef);
    if (null == value) {
      value = "";
    }
    var s = "<div id='" + id + "' class='form-group input-prepend create-largehtml-outer'>";
    s += "<label for='" + id + "-input' class='col-sm-2 control-label create-largehtml-label'>" + fieldDef.title + "</label>";
    s += "<div class='col-sm-10'>";
    s += "<textarea id='" + id + "-input' class='form-control create-largehtml-input'>" + value + "</textarea>"; // TODO encode value for embedding in HTML
    s += "</div>";
    s += "</div>";

    // TODO if vertical, start row with label on left, field on right
    // TODO if horizontal, place label above field

    this._place(s,"largehtml",id);

    // initialise CKEditor
    var editor = CKEDITOR.replace(id + "-input");
    //fieldDef._html_editor = editor;

    // change event handler
    var self = this;
    /*
    var el = document.getElementById(id + "-input");
    el.onchange = function(evt) {
      self._doccontext.setPart(fieldDef,el.value);
    };*/
    editor.on('change', function() {
      self._doccontext.setPart(fieldDef,editor.getData());
    });

    return this;
};

com.marklogic.widgets.create.prototype.dropdown = function(fieldDef) {
  return this;

};

com.marklogic.widgets.create.prototype.date = function(fieldDef) {
  return this;

};

com.marklogic.widgets.create.prototype.dateTime = function(fieldDef) {
  return this;

};

com.marklogic.widgets.create.prototype.multiple = function(fieldDef) {
  return this;

};



// EVENT HANDLERS


/**
 * Adds a function as a listener to be called when this widget successfully generates a new document, passing in the new document's URI. If multiple documents are created, passes an array of string uris.
 *
 * @param {function} lis - The listener function to add. Function should accept a string uri
 */
com.marklogic.widgets.create.prototype.addCompleteListener = function(lis) {
  this.completePublisher.subscribe(lis);
};

/**
 * Removes a completion listener from this widget.
 *
 * @param {function} lis - The listener function to remove. Function should accept a string uri
 */
com.marklogic.widgets.create.prototype.removeCompleteListener = function(lis) {
  this.completePublisher.unsubscribe(lis);
};

com.marklogic.widgets.create.prototype._onSave = function() {
  console.log("onSave called");
  // loop through controls
  // create uploaded or new json/xml document with those fields
  // save document with specified uri or uri prefix, collection(s), permissions
  if ("upload" == this._mode) {
    // find file upload control and get document
    var uploadCtl = null;
    var perms = new Array();
    for (var i = 0;i < this.controls.length;i++) {
      var ctl = this.controls[i];
      console.log("control: " + JSON.stringify(ctl));
      if ("dnd" == ctl.type) {
        uploadCtl = ctl;
      }
      // TODO extract other properties about this document
      if ("permissions" == ctl.type) {
        var ctlData = this.controlData[ctl.id];
        var e = document.getElementById(ctl.id + "-select");
        //console.log("selected value: " + e.value);
        //console.log("selected perm: " + e.selectedIndex);
        //console.log("selected perm value: " + e.options[e.selectedIndex]);
        //var str = e.options[e.selectedIndex].text;
        //console.log("adding permission: " + e.value + " = read");
        perms.push({role: e.value, permission: ctlData.privilege});
        //perms.push({role: e.value + "-write", permission: "insert"});
        //perms.push({role: e.value + "-write", permission: "update"});
        //perms.push({role: "can-read", permission: "read"});
      }
    }

    // add forced permissions
    for (var p = 0;p < this._permissions.length;p++) {
      perms.push(this._permissions[p]);
    }

    if (null != uploadCtl) {
      console.log("got uploadCtl");


      /*
      // get file info for upload
      var reader = new FileReader();
      //var files = this.controlData[uploadCtl.id].files;
      //var file = files[0]; // TODO handle multiple, none
      console.log("fetching file")
      var fileel = document.getElementById(uploadCtl.id);
      var file = fileel.files[0];
      console.log("reading file");

      var self = this;

      reader.onload = (function(theFile) {

      var bin = reader.readAsArrayBuffer(theFile);
      console.log("BIN RESULT: " + bin);
      console.log("Reader info: " + JSON.stringify(reader));

        return function(e) {
          var res = e.target.result; // WRONG - THIS IS SENDING BYTE LENGTH ONLY
          console.log("TARGET JSON: " + JSON.stringify(e));
          //
          for (var n in fileel) {
            console.log(" " + n);
            console.log("  " + n + ": " + typeof(fileel[n]));
          }//
          console.log("result: " + JSON.stringify(res));
          var cols = "";
          for (var i = 0;i < self._collections.length;i++) {
            if (0 != i) {
              cols += ",";
            }
            cols += self._collections[i];
          }
          // send as octet stream, filename for after URI prefix
          console.log("calling mljs save");
          var props = {
            contentType: file.type,
            collection: cols,
            permissions: perms
          }
          console.log("mime type: " + file.type);
          console.log("Request properties: " + JSON.stringify(props));
          mljs.defaultconnection.save(res,self._uriprefix + file.name,props,function(result) {
            if (result.inError) {
              console.log("ERROR: " + result.doc);
            } else {
              console.log("SUCCESS: " + result.docuri);
              self.completePublisher.publish(result.docuri);
            }
          });
        }
      })(file);

      */





    var files = document.getElementById(uploadCtl.id).files;
    if (!files.length) {
      alert('Please select a file!');
      return;
    }

    var file = files[0];
    var start = 0;
    var stop = file.size - 1;


          var cols = "";
          for (var i = 0;i < this._collections.length;i++) {
            if (0 != i) {
              cols += ",";
            }
            cols += this._collections[i];
          }

          var props = {
            contentType: file.type,
            //contentType: false,
            format: "binary",
            collection: cols,
            permissions: perms
          }
          console.log("mime type: " + file.type);
          console.log("Request properties: " + JSON.stringify(props));

    var reader = new FileReader();
    var self = this;
    console.log("got file reader instance");

    // If we use onloadend, we need to check the readyState.
    reader.onloadend = function(evt) {
      console.log("in reader.onloadend with status: " + evt.target.readyState);
      if (evt.target.readyState == FileReader.DONE) { // DONE == 2
        //document.getElementById('byte_content').textContent = evt.target.result;

        console.log("file content: " + evt.target.result);

        // save to ML

        console.log("calling mljs save");
          /*
          var arrBuff = new ArrayBuffer(evt.target.result.length);
          var writer = new Uint8Array(arrBuff);
          for (var i = 0, len = evt.target.result.length; i < len; i++) {
              writer[i] = evt.target.result.charCodeAt(i);
          }*/

          // TODO use doc context instead
          mljs.defaultconnection.save(file,self._uriprefix + file.name,props,function(result) {
            if (result.inError) {
              console.log("ERROR: " + result.doc);
            } else {
              console.log("SUCCESS: " + result.docuri);
              self.completePublisher.publish(result.docuri);
            }
          });




        /*document.getElementById('byte_range').textContent =
            ['Read bytes: ', start + 1, ' - ', stop + 1,
             ' of ', file.size, ' byte file'].join('');*/
      }
    };

    var blob = null;
    if (file.webkitSlice) {
      blob = file.webkitSlice(start, stop + 1);
    } else if (file.mozSlice) {
      blob = file.mozSlice(start, stop + 1);
    } else {
      blob = file; // test
    }
    //reader.readAsBinaryString(blob);
    console.log("reading as array: file: " + blob);
    reader.readAsArrayBuffer(blob);
    //reader.readAsText(file);
    console.log("after read as array");

    } else {
      // TODO
      console.log("upload ctl null");
    }
  } else if (this._mode == "xml" || this._mode == "json") {
    // call doccontext save (assume all fields already updated)
    this._doccontext.save();
  } else {
    // TODO
    console.log("unknown mode: " + this._mode);
  }
};












com.marklogic.widgets.workplaceadminext = window.com.marklogic.widgets.workplaceadminext || {};
com.marklogic.widgets.workplaceadminext.widgets = window.com.marklogic.widgets.workplaceadminext.widgets || {};
com.marklogic.widgets.workplaceadminext.widgets["widget-docbuilder.js"] = [
  {title: "Upload", classname: "com.marklogic.widgets.upload", description: "Document upload widget."}
];




com.marklogic.widgets.upload = function(container) {
  this.container = container;

  this._config = {
    forwardUrl: "/view.html5?uri=#URI#",
    readClasses: [],
    writeClasses: [],
    uriPrefix: "/uploads/",
    collections: [{collection: "uploads"}]
  };

  this._documentContext = null;
  this._createWidget = null;

  this._init();
};

com.marklogic.widgets.upload.getConfigurationDefinition = function() {
  return {
    uriPrefix: {type: "string", default: "/uploads/", title: "URI Prefix", description: "The URI prefix to give to the uploaded file."},
    collections: {type: "multiple", minimum: 0, default: [{collection: "uploads"}], title: "Collections", description: "The collections to add uploaded documents to.",
          childDefinitions: {
            //title,searchcontext,latsrc,lonsrc,titlesrc,summarysrc,icon_source_opt,heatmap_constraint
            collection: {type: "string", default: "", title: "Collection", description: "Collection name."}
          }
    },
    readClasses: {type: "multiple", minimum: 0, default: [], title: "Read Roles", description: "Roles permitted to read this document.",
          childDefinitions: {
            //title,searchcontext,latsrc,lonsrc,titlesrc,summarysrc,icon_source_opt,heatmap_constraint
            role: {type: "string", default: "", title: "Role", description: "The MarkLogic Server role name."}
          }
    },
    writeClasses: {type: "multiple", minimum: 0, default: [], title: "Update Roles", description: "Roles permitted to update this document.",
          childDefinitions: {
            //title,searchcontext,latsrc,lonsrc,titlesrc,summarysrc,icon_source_opt,heatmap_constraint
            role: {type: "string", default: "", title: "Role", description: "The MarkLogic Server role name."}
          }
    },
    forwardUrl: {type: "string", default: "/view.html5?uri=#URI#", title: "Forward URL", description: "Where to send the user on successful upload."}
  };
};


com.marklogic.widgets.upload.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }

  this._refresh();

  if (null != this._createWidget && null != this._documentContext) {
    this._documentContext.register(this._createWidget);
  }
};

com.marklogic.widgets.upload.prototype.setDocumentContext = function(dc) {
  this._documentContext = dc;
  if (null != this._createWidget) {
    this._documentContext.register(this._createWidget);
  }
};

com.marklogic.widgets.upload.prototype._init = function() {
  var s = "<div class='mljswidget upload' id='" + this.container + "-outer'><div id='" + this.container + "-notifications'></div><div id='" + this.container + "-inner'></div></div>";
  document.getElementById(this.container).innerHTML = s;

  this._refresh();
};

com.marklogic.widgets.upload.prototype._refresh = function() {
  if (window.File && window.FileReader && window.FileList && window.Blob) {
  // Great success! All the File APIs are supported.
} else {
  document.getElementById(this.container + "-notifications").innerHTML = '<p>The File APIs are not fully supported in this browser.</p>';
}

  /*
  var writeclasses = new Array();
  writeclasses.push("unclassified");
  writeclasses.push("protect");
  writeclasses.push("restricted");
  writeclasses.push("confidential");
  writeclasses.push("secret");
  writeclasses.push("topsecret");
  */

  var wgt = new com.marklogic.widgets.create(this.container + "-inner");
  var writeClasses = new Array();
  var readClasses = new Array();
  for (var r = 0,maxr = this._config.readClasses.length,cl;r < maxr;r++) {
    cl = this._config.readClasses[r];
    readClasses.push(cl.role);
  }
  for (var r = 0,maxr = this._config.writeClasses.length,cl;r < maxr;r++) {
    cl = this._config.writeClasses[r];
    writeClasses.push(cl.role);
  }
  this._createWidget = wgt;
  wgt.uriprefix(this._config.uriPrefix)
     .collectionUser()
     .horizontal()
     .dnd()
     .permissions(false,readClasses,"Reader Level","read")
     .permissions(false,writeClasses,"Modifier Level","update")
     .endRow()
     .bar()
     .save("Upload")
     .endBar()
     .endRow();

  for (var c = 0,maxc = this._config.collections.length,col;c < maxc;c++) {
    col = this._config.collections[c];
      /* Adds to a collection of the current user. E.g. user-afowler */
    wgt.collection(col.collection);
     // TODO defaultPermission(s) too that may be overrided by the UI (top secret read, for example)
     /*
     .forcePermission({role: "can-read", permission: "read"})
     .forcePermission({role: "can-read", permission: "update"})
     .forcePermission({role: "confidential-write", permission: "read"}) */

  }
  var self = this;
  wgt.addCompleteListener(function(evt) {
    document.getElementById(self.container + "-notifications").innerHTML = "<p>Created doc with uri: " + evt + "</p>";
    // now wait for our xhtml version to exist - 10 seconds maximum
    // persist options first
  /*
    var ob = db.options();
    ob.elemattrRangeConstraint("basedoc","meta","http://www.w3.org/1999/xhtml","content","xs:string");
    var options = ob.toJson();

    var optionsName = "options-1234"; // TODO replace with valid name based on doc uri (must be unique)

    var qb = db.query();
    qb.query(qb.range("basedoc",evt));
    var query = qb.toJson();
    */
    /*
    //db.saveSearchOptions(optionsName,options,function(result) {
      var found = false;
      var startTime = new Date().getTime();
      var timeout = 10000; // 10 secs in millis
      var endTime = startTime + timeout;
      var func = function() {
        setTimeout(function() {
          // perform search
          console.log("searching for new rendering for: " + evt);
          db.structuredSearch(query,optionsName,function(result) {
            console.log("got doc response: " + JSON.stringify(result.doc));
            // TODO extract total, if not 0, get first full result (XHTML) and display
          });
          if (!found && (endTime > (new Date().getTime()))) {
            func();
          } else {
            // do nothing - we just wont do another timeout
          }
        },1000);
      };
      func();
    //});
    */
    if (null != self._config.forwardUrl && "" != self._config.forwardUrl.trim()) {
      var loc = self._config.forwardUrl.replace("#URI#",encodeURI(evt));
      window.location = loc; // send user to document markings editor
    }

  });
};
