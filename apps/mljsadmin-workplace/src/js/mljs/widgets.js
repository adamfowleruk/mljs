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


com = window.com || {};
com.marklogic = window.com.marklogic || {};
com.marklogic.widgets = window.com.marklogic.widgets || {};





// generic useful functions (not namespaced)

function bubbleSort(a,jsonPath,reversed)
{
    var swapped;
    do {
        swapped = false;
        for (var i=0; i < a.length-1; i++) {
	  var leftValue = 0;
	  var rightValue = 0;
	  if (typeof a[i] == "object" && undefined != jsonPath) {
	    leftValue = jsonExtractValue(a[i],jsonPath);
	  } else {
	    leftValue = a[i];
	  }
	  if (typeof a[i+1] == "object" && undefined != jsonPath) {
	    rightValue = jsonExtractValue(a[i+1],jsonPath);
	  } else {
	    rightValue = a[i+1];
	  }
	  if (undefined != reversed && reversed == true) {
	    // reverse the order of sort
	    var t = leftValue;
	    leftValue = rightValue;
	    rightValue = t;
	    t = undefined;
	  }
            if (leftValue < rightValue) {
                var temp = a[i];
                a[i] = a[i+1];
                a[i+1] = temp;
                swapped = true;
            }
        }
    } while (swapped);
}




function msort(array, begin, end, comparisonValue)
{
	var size=end-begin;
	if(size<2) return;

	var begin_right=begin+Math.floor(size/2);

	msort(array, begin, begin_right, comparisonValue);
	msort(array, begin_right, end, comparisonValue);
	//merge_inplace(array, begin, begin_right, end, comparisonValue);
	array = merge_sort(array,function(left,right) {
	  var leftValue = 0;
	  var rightValue = 0;
	  if (typeof left == "object" && undefined != comparisonValue) {
	    leftValue = jsonExtractValue(left,comparisonValue);
	  } else {
	    leftValue = left;
	  }
	  if (typeof right == "object" && undefined != comparisonValue) {
	    rightValue = jsonExtractValue(right,comparisonValue);
	  } else {
	    rightValue = right;
	  }
	  leftValue = 1 * leftValue;
	  rightValue = 1 * rightValue; // numeric conversion - read from JSON as string TODO check for errors (e.g. actually a string)
    console.log("msort_inline_function-sort(): left value: " + leftValue + ", rightValue: " + rightValue);
	  if (leftValue == rightValue) {
	    console.log("returning 0");
	    return 0;
	  } else {
	    if (leftValue < rightValue) {
	      console.log("returning -1");
	      return -1;
	    } else if (rightValue < leftValue ){
	      console.log("returning 1");
	      return 1;
	    } else {
	      console.log("Typeof leftValue: " + (typeof leftValue));
	      console.log("Typeof rightValue: " + (typeof rightValue));
	      return -2;
	    }
	  }
	});
}

function merge_sort_inplace(array,comparison)
{
	msort(array, 0, array.length,comparison);
}

function merge_inplace(array, begin, begin_right, end, comparisonValue)
{
  console.log("merge_inplace(): array: " + JSON.stringify({array: array}));
  var leftValue, rightValue;
	for(;begin < begin_right; ++begin) {
	  leftValue = 0;
	  rightValue = 0;
	  if (typeof array[begin] == "object" && undefined != comparisonValue) {
	    leftValue = jsonExtractValue(array[begin],comparisonValue);
	  } else {
	    leftValue = array[begin];
	  }
	  if (typeof array[begin_right] == "object" && undefined != comparisonValue) {
	    rightValue = jsonExtractValue(array[begin_right],comparisonValue);
	  } else {
	    rightValue = array[begin_right];
	  }
    console.log("merge_inplace(): left value: " + leftValue + ", rightValue: " + rightValue);

		if(leftValue < rightValue) {
			var v=array[begin];
			array[begin]=array[begin_right];
			insert(array, begin_right, end, v);
		}
	}
  console.log("merge_inplace(): array NOW: " + JSON.stringify({array: array}));
}

function merge_sort(array,comparison)
{
	if(array.length < 2)
		return array;
	var middle = Math.ceil(array.length/2);
	return merge(merge_sort(array.slice(0,middle),comparison),
			merge_sort(array.slice(middle),comparison),
			comparison);
}

function merge(left,right,comparison)
{
	var result = new Array();
	while((left.length > 0) && (right.length > 0))
	{
		if(comparison(left[0],right[0]) <= 0)
			result.push(left.shift());
		else
			result.push(right.shift());
	}
	while(left.length > 0)
		result.push(left.shift());
	while(right.length > 0)
		result.push(right.shift());
	return result;
}

function insert(array, begin, end, v)
{
	while(begin+1<end && array[begin+1]<v) {
		array.swap(begin, begin+1);
		++begin;
	}
	array[begin]=v;
}



// EXTRA ARRAY FUNCTIONS

if (undefined == Array.prototype.swap) {
  Array.prototype.swap=function(a, b)
  {
	  var tmp=this[a];
	  this[a]=this[b];
	  this[b]=tmp;
  };
}

// TODO remove the below and replace with sensible default / check
if (undefined == Array.prototype.contains) {
  Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
      if (this[i] === obj) {
        return true;
      }
    }
    return false;
  };
}

Array.prototype.position = function(value) {
  for (var i = 0;i < this.length;i++) {
    if (this[i] == value) {
      return i;
    }
  }
  return -1;
};

// Following is required on Safari on the Mac (required by charts result parsing)
if (undefined == String.prototype.startsWith) {
  String.prototype.startsWith = function(str) {
    if (undefined == this || this.length == 0) return false;
    return (this.substring(0,str.length) == str);
  };
}

if (undefined == String.prototype.replaceAll) {
  String.prototype.replaceAll = function(str1, str2, ignoreCase) {
	  return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignoreCase?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
  };
}

String.prototype.htmlEscape = function() {
  return String(this).replaceAll("&", '&amp;').replaceAll("\"", '&quot;').replaceAll("'", '&#39;').replaceAll("<", '&lt;').replaceAll(">", '&gt;');
};



com.marklogic.widgets.hide = function(el,isHidden) {
  if (isHidden) {
    com.marklogic.widgets.addClass(el,"hidden");
  } else {
    com.marklogic.widgets.removeClass(el,"hidden");
  }
};

com.marklogic.widgets.getSelectValues = function(select) {
  var result = new Array();
  var options = select && select.options;
  var opt;

  for (var i=0, iLen=options.length; i<iLen; i++) {
    opt = options[i];

    if (opt.selected) {
      result.push(opt.value || opt.text);
    }
  }
  return result;
};

com.marklogic.widgets.addClass = function(el,classname) {
    var found = false;
    var attr = el.getAttribute("class");
    if (undefined != attr) {
      var attrs = attr.split(" ");
      for (var i = 0;!found && i < attrs.length;i++) {
        found = (classname == attrs[i]);
      }
    }
    if (!found) {
      el.setAttribute("class",attr + " " + classname);
    }
};

com.marklogic.widgets.removeClass = function(el,classname) {
    var attr = el.getAttribute("class");
    var newClass = "";
    if (undefined != attr) {
      var attrs = attr.split(" ");
      for (var i = 0;i < attrs.length;i++) {
        if (classname != attrs[i]) {
          newClass += attrs[i] + " ";
        }
      }
    }
    el.setAttribute("class",newClass);
};

// our own global widgets here
/**
 * An error display wrapper widget
 *
 * @constructor
 */
com.marklogic.widgets.error = function(container) {
  this.container = container;

  this.error = null;

  this.allowDetails = false; // shows 'show details' button
  this.showFirstCodefile = false; // shows first file name,line number and column

  this._refresh();
};

com.marklogic.widgets.error.prototype.show = function(message) {
  this.error = message;
  this._refresh();
};

com.marklogic.widgets.error.prototype.updateError = com.marklogic.widgets.error.prototype.show;

com.marklogic.widgets.error.prototype.clear = function() {
  this.show(null);
};

/**
 * Detect Javascript built in errors - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
 * For available properties also see - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/prototype
 * @private
 */
com.marklogic.widgets.error.prototype._isJSError = function() {
  //console.log("_isJSError: typeof: " + typeof this.error);
  //console.log("_isJSError: content: " + JSON.stringify(this.error));
  if (null == this.error) { return false; }

  var jserr = false;
  this.jserrortype = null;
  if (this.error instanceof EvalError) {
    jserr = true;
    this.jserrortype = "EvalError";
  } else if (this.error instanceof RangeError) {
    jserr = true;
    this.jserrortype = "RangeError";
  } else if (this.error instanceof ReferenceError) {
    jserr = true;
    this.jserrortype = "ReferenceError";
  } else if (this.error instanceof SyntaxError) {
    jserr = true;
    this.jserrortype = "SyntaxError";
  } else if (this.error instanceof TypeError) {
    jserr = true;
    this.jserrortype = "TypeError";
  } else if (this.error instanceof URIError) {
    jserr = true;
    this.jserrortype = "URIError";
  } else if (this.error instanceof Error) {
    jserr = true;
    this.jserrortype = "Error";
    // generic handler
  } else if (typeof this.error == "object" && undefined != this.error.fileName) {
    jserr = true;
    this.jserrortype = "JSONError";
  }
  return jserr;
};

com.marklogic.widgets.error.prototype._refresh = function() {
  //if (null == this.error || undefined == this.error) { return; }

  if (this._isJSError()) {
    // gen JS html error message
    this._genjshtml();
  } else
  if (null != this.error && "object" == typeof this.error) {
    // check if a result object or a error frame set, or an XML document
    if (undefined != this.error.inError) { // an operation response from MLJS
      // mljs results object
      if (this.error.inError) { // an operation response from MLJS that IS in error
        if (this.error.format == "json") {
          mljs.defaultconnection.logger.debug("Error object is result, and json");
          this._genhtml(this.error);
        } else {
          mljs.defaultconnection.logger.debug("Error object is result, and xml");
          mljs.defaultconnection.logger.debug("ERROR CURRENTLY: " + JSON.stringify(this.error));
          this._genhtml(xmlToJson(this.error.doc));
        }
        return true;
      } else {
        mljs.defaultconnection.logger.debug("Error object is result, and not in error");
        return false; // doing this allows you to do one if statement rather than if and call
      }
    } else {
      mljs.defaultconnection.logger.debug("Error document is not an mljs response document");
        if (undefined == this.error.nodeType) {
          mljs.defaultconnection.logger.debug("Error object is error doc, and json");
          this._genhtml(this.error);
        } else {
          mljs.defaultconnection.logger.debug("Error object is error doc, and xml");
          this._genhtml(xmlToJson(this.error.doc));
        }
      //this._genhtml(this.error);
    }
    // display pretty print JSON error
  } else { // not an object - string? or null (blank)
    mljs.defaultconnection.logger.debug("Error object is simple string");
    // assume string
    if (null != this.error && undefined != this.error) {
      var str = "<div class='mljswidget panel panel-danger error-inner' id='" + this.container + "-error-inner'>"
      str += "<div class='panel-heading error-message'>" + this.error + "</div>";
      str += "</div>";
      var el = document.getElementById(this.container);
      el.innerHTML = str;
    } else {
      document.getElementById(this.container).innerHTML = ""; // blank error
    }
  }
};

com.marklogic.widgets.error.prototype._genjshtml = function() {
  mljs.defaultconnection.logger.debug("_genjshtml");
  var e = this.error;
  var t = this.jserrortype;
  mljs.defaultconnection.logger.debug("_genjshtml: error type: " + t);

  // Standard fields: message, name
  // MS fields: description, number
  // Firefox fields: fileName, lineNumber, columnName, stack (object)

  var str = "<div class='mljswidget panel panel-danger error-inner' id='" + this.container + "-error-inner'>";
  // do header
  str += "<div class='panel-heading error-title'>" + e.name + ": " + e.message + "</div>";
  str += "<div class='panel-body error-content'>";

  mljs.defaultconnection.logger.debug("_genjshtml: e info: " + e);
  mljs.defaultconnection.logger.debug("_genjshtml: e info json: " + JSON.stringify(e));

  // further details, line num, etc
  if (this.showFirstCodefile) {
    // FIREFOX SPECIFIC
    if (undefined != e.lineNumber && undefined != e.fileName) {
      str += "<div class='error-pointer'>";
      str += "<p>Error occured at " + e.fileName + ":" + e.lineNumber + "</p>";
      str += "</div>";
    }
    // MICROSOFT SPECIFIC
    if (undefined != e.description && undefined != e.number) {
      str += "<div class='error-pointer'>";
      str += "<p>Error Number: " + e.number + ", Description: " + e.description + "</p>";
      str += "</div>";
    }
  }

  if (this.allowDetails && undefined != e.stack) {
    str += "<div id='" + this.container + "-frame-details'><a class='error-show' id='" + this.container + "-frame-show' href='#'>Show Details</a><a class='hidden error-hide' id='" + this.container + "-frame-hide' href='#'>Hide Details</a></div><div id='" + this.container + "-error-details-frames' class='hidden'></div>";
  }

  str += "</div></div>";
  document.getElementById(this.container).innerHTML = str;
  var self = this;
  if (this.allowDetails) {
    document.getElementById(this.container + "-frame-show").onclick = function(evt) {
      self._showJSDetails();
    };
  }
};

com.marklogic.widgets.error.prototype._showJSDetails = function() {
  var details = document.getElementById(this.container + "-error-details-frames");

  var e = this.error;

  var str = "";
  //str += "<div>Stack info: " + JSON.stringify(e.stack) + "</div>";
  //for (var i = 0;i < e.stack.length;i++) {
  //  str += e.stack[i] + "<br/>";
  //}
  str = e.stack.replace(/$/mg,"<br/>");

  details.innerHTML = str;

  console.log("setting details class");
  details.setAttribute("class","error-details-frames");

  console.log("setting show to invisible")
  var show = document.getElementById(this.container + "-frame-show");
  show.setAttribute("class","error-show hidden");
  console.log("setting hide to visible");
  var hide = document.getElementById(this.container + "-frame-hide");
  hide.setAttribute("class","error-hide");
  var self = this;
  document.getElementById(this.container + "-frame-hide").onclick = function(evt) {
    console.log("hide clicked");
    self._hideDetails(); // same hide function as normal details box
    console.log("hide clicked complete");
  };

};

/**
 * Generates a HTML summary of a MarkLogic error XML document. Error object must have been converted to JSON using xmlToJson()
 * @private
 */
com.marklogic.widgets.error.prototype._genhtml = function(obj) {
  mljs.defaultconnection.logger.debug("_genhtml: Called with: " + JSON.stringify(obj));

  var str = "<div class='error-inner' id='" + this.container + "-error-inner'>";
  // do header
  str += "<div class='error-title'>" + obj.error["format-string"] + "</div>";
  // further details, line num, etc
  if (this.showFirstCodefile) {
    if (undefined != obj.error.stack.frame[0]) {
      var frame = obj.error.stack.frame[0];
      str += "<div class='error-pointer'>" + frame.uri + ":" + frame.line + " column " + frame.column + " - operation " + frame.operation + "</div>";
    }
  }
  // then provide link for more details (if allowDetails is true)
  if (this.allowDetails) {
    str += "<div id='" + this.container + "-frame-details'><a class='error-show' id='" + this.container + "-frame-show' href='#'>Show Details</a><a class='hidden error-hide' id='" + this.container + "-frame-hide' href='#'>Hide Details</a></div>";
  }
  str += "</div>";
  document.getElementById(this.container).innerHTML = str;
  var self = this;
  if (this.allowDetails) {
    document.getElementById(this.container + "-frame-show").onclick = function(evt) {
      self._showDetails();
    };
  }
};

/**
 * Display MarkLogic server error frame details
 * @private
 */
com.marklogic.widgets.error.prototype._showDetails = function() {
  var details = document.getElementById(this.container + "-error-details-frames");
  if (undefined == details) {
    // generate HTML
    var str = "<div id='" + this.container + "-error-details-frames'>";
    // NB error.error may not exist - response could be plain text
    if (undefined == this.error.error) {
      // plain text
      str += "Error details are plain text. No frames exist. Full details below:-<br/>" + this.error.doc;
    } else {
      for (var f = 0;f < this.error.error.error.stack.frame.length;f++) {
        var frame = this.error.error.error.stack.frame[f];
        str += "<div class='error-frame'>";

        // show frame details
        str += frame.uri + ":" + frame.line + "." + frame.column;
        if (undefined != frame.operation) {
          str += " " + frame.operation;
        }

        str += "</div>";
      }
    }
    str += "</div>";
    var parent = document.getElementById(this.container + "-frame-details");
    parent.innerHTML = parent.innerHTML + str; // TODO REPLACE THIS AS BAD PRACTICE

    details = document.getElementById(this.container + "-error-details-frames");
  }
  console.log("setting details class");
  details.setAttribute("class","error-details-frames");

  console.log("setting show to invisible")
  var show = document.getElementById(this.container + "-frame-show");
  show.setAttribute("class","error-show hidden");
  console.log("setting hide to visible");
  var hide = document.getElementById(this.container + "-frame-hide");
  hide.setAttribute("class","error-hide");
  var self = this;
  document.getElementById(this.container + "-frame-hide").onclick = function(evt) {
    console.log("hide clicked");
    self._hideDetails();
    console.log("hide clicked complete");
  };
};

/**
 * Hide MarkLogic error frame details
 * @private
 */
com.marklogic.widgets.error.prototype._hideDetails = function() {
  var details = document.getElementById(this.container + "-error-details-frames");
  details.setAttribute("class","error-details-frames hidden");

  var show = document.getElementById(this.container + "-frame-show");
  show.setAttribute("class","error-show");
  var hide = document.getElementById(this.container + "-frame-hide");
  hide.setAttribute("class","error-hide hidden");
  var self = this;
  document.getElementById(this.container + "-frame-show").onclick = function(evt) {
    self._showDetails();
  };
};









/**
 *  Static functions that provide other widgets with useful, consistent elements.
 *
 * @namespace
 */
com.marklogic.widgets.bits = {
  _base: "/images"
};

com.marklogic.widgets.bits.base = function(newbase) {
  com.marklogic.widgets.bits._base = newbase;
}

/**
 * Creates a loading message or image
 *
 * @param {string} elid - The element for this widget's top level container
 */
com.marklogic.widgets.bits.loading = function(elid) {
  var s = "<img id='" + elid + "' class='bits-loading' src='" + com.marklogic.widgets.bits._base + "/mljs/loading.gif' style='width: 30px; height: 30px;' alt='Loading...' title='Loading...' />";

  return s;
};

/**
 * Creates a failure message or image
 *
 * @param {string} elid - The element for this widget's top level container
 */
com.marklogic.widgets.bits.failure = function(elid) {
  var s = "<img id='" + elid + "' class='bits-failure' src='" + com.marklogic.widgets.bits._base + "/mljs/failure.png' alt='Failed to complete operation' title='Failed to complete operation' /> Failed to complete operation";

  return s;
};

/**
 * Creates a complete message
 *
 * @param {string} elid - The element for this widget's top level container
 */
com.marklogic.widgets.bits.done = function(elid,message_opt) {
  var s = "<span id='" + elid + "' class='bits-done'>";
  if (undefined == message_opt) {
    s += "Done.";
  } else {
    s += message_opt;
  }
  s += "</span>";
  return s;
};

/**
 * Appends HTML safely to a DOM node. Avoids using innerHTML += which redraws ALL innerHTML content
 * @param {DOMElement} el - The element to append the HTML to
 * @param {string} s - The HTML String of the HTML to append to the element
 */
com.marklogic.widgets.appendHTML = function(el,s) {
  var newcontent = document.createElement('div');
  newcontent.innerHTML = s;

  while (newcontent.firstChild) {
    el.appendChild(newcontent.firstChild);
  }
};







/**
 * DRAG AND DROP GENERIC SUPPORT HELPER FUNCTIONS
 * See http://stackoverflow.com/questions/15775440/javascript-drag-drop-a-div-on-a-web-page?lq=1
 * and http://www.w3schools.com/html/html5_draganddrop.asp#gsc.tab=0
 */
com.marklogic.widgets.dnd = {
  droppables: {}, // droppables["elid"] = {classname: "myclass", accept: [class1,class2,...] }
  draggables: {} // draggables["elid"] = {classname: "myclass", onto: [class1,...] }
};

/**
 * Call this to indicate the specified element should be a drop zone.
 */
com.marklogic.widgets.dnd.accept = function(elid,droppableClass,draggableTypeArrayToAccept,actionCallback) {
  // assume caller does html generation (for speed)
  // add droppable configuration
  var dropzone = {classname: droppableClass,accept: draggableTypeArrayToAccept, action: actionCallback};
  com.marklogic.widgets.dnd.droppables[elid] = dropzone;
  // add event handlers
  var el = document.getElementById(elid);
  mljs.defaultconnection.logger.debug("dnd.onto: adding event handlers to: " + elid);
  el.addEventListener("dragover",function(ev) {
  //el.ondragover = function(ev) {
    mljs.defaultconnection.logger.debug("dnd.onto: ondragover: " + elid);
    //var match = com.marklogic.widgets.dnd._compatible(el,elid,droppable); // TODO find and pass draggable elid
    //if (match) {
      // TODO add dnd hover class to element
    //}
    ev.preventDefault();
    mljs.defaultconnection.logger.debug("dnd.accept: ondragover: returning false");
    return false;
  },false); // )
  // TODO on drag out?
  el.addEventListener("drop",function(ev) {
  //el.ondrop = function(ev) {
    mljs.defaultconnection.logger.debug("dnd.onto: ondrop: " + elid);
    //var match = com.marklogic.widgets.dnd._compatible(el,elid,droppable); // TODO find and pass draggable elid
    //if (match) {
      var data = JSON.parse(ev.dataTransfer.getData("application/javascript"));
    mljs.defaultconnection.logger.debug("dnd.accept: ondrop: calling action callback");
      dropzone.action(data);
    //}
    //ev.preventDefault();
    mljs.defaultconnection.logger.debug("dnd.accept: ondrop: returning false");
    //return false;
  },false); // )
  mljs.defaultconnection.logger.debug("dnd.onto: completed adding event handlers to: " + elid);
};

/**
 * Call this to set an element up as a draggable item.
 */
com.marklogic.widgets.dnd.onto = function(elid,draggableClass,droppableTypeArrayToMap,dataOrCallback) {
  // assume caller does html generation (for speed) (For HTML5 this element MUST have attribute draggable="true")
  // add draggable configuration
  var draggable = {classname: draggableClass, onto: droppableTypeArrayToMap, dataOrCallback: dataOrCallback};
  com.marklogic.widgets.dnd.draggables[elid] = draggable;
  // add event handlers
  var el = document.getElementById(elid);
  //el.ondragstart = function(ev) {
  mljs.defaultconnection.logger.debug("dnd.onto: adding ondragstart to: " + elid + " with el value: " + el);
  el.addEventListener("dragstart", function(ev) {
    mljs.defaultconnection.logger.debug("dnd.onto: ondragstart: " + elid);
    //var match = com.marklogic.widgets.dnd._draggableCompatible(el,elid,draggable); // TODO get elid of droppable and pass that too
    //if (match) {
      // send data
      var data = {};
      if ("function" === typeof(dataOrCallback)) {
        data = dataOrCallback();
      } else {
        data = dataOrCallback;
      }
      mljs.defaultconnection.logger.debug("dnd.onto: ondragstart: sending data");
      var sd = JSON.stringify(data);
      ev.dataTransfer.setData("application/javascript",sd);
      mljs.defaultconnection.logger.debug("dnd.onto: ondragstart: sent data: " + sd);
    //}
    //ev.preventDefault();
    mljs.defaultconnection.logger.debug("dnd.onto: ondragstart: returning false");
    //return false;
  },false);
};

com.marklogic.widgets.dnd._compatible = function(el,elid,droppable,draggableElid) {
  // check if the droppable matches the draggable being hovered over the top
  var dragClass = com.marklogic.widgets.dnd.draggables[draggableElid];
  if (null == dragClass || undefined == dragClass) {
    return false; // can't match if not in one of our lists
  }
  for (var i = 0, max = droppable.accept.length,dropClass;i < max;i++) {
    dropClass = droppable.accept[i];
    if (dragClass == dropClass || "*" == dropClass) {
      return true;
    }
  }
  return false;
};

com.marklogic.widgets.dnd._draggableCompatible = function(el,elid,draggable,droppableElid) {
  // check that this
  var dropClass = com.marklogic.widgets.dnd.droppables[droppableElid];
  if (null == dropClass || undefined == dropClass) {
    return false; // can't match if not in one of our lists
  }
  for (var i = 0, max = draggable.onto.length,dragClass;i < max;i++) {
    dragClass = draggable.onto[i];
    if (dragClass == dropClass || "*" == dragClass) {
      return true;
    }
  }
  return false;
};
