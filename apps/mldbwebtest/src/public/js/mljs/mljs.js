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
var basic = null, digest = null, thru = null, noop = null, winston = null;//, jsdom = null;
var logger = null;
  if (typeof String.prototype.endsWith !== 'function') {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
  }
  if (typeof String.prototype.split !== 'function') {
    String.prototype.split = function(on) {
      var output = [];
      var lastPos = 0;
      var nextPos;
      while (-1 != (nextPos = this.indexOf(on,lastPos))) {
        output.push(this.substring(lastPos,nextPos));
        lastPos = nextPos + 1;
      }
      if (lastPos < (this.length - 1)) {
        output.push(this.substring(lastPos));
      }
      return output;
    };
  }
if (typeof(window) === 'undefined') {
  basic = require("./lib/basic-wrapper");
  digest = require("./lib/digest-wrapper");
  thru = require("./lib/passthrough-wrapper");
  noop = require("./lib/noop");
  winston = require('winston');
  //jsdom = require('jsdom');

  logger = new (winston.Logger)({
    transports: [
      new winston.transports.Console()
    ],
    exceptionHandlers: [
      new winston.transports.Console()
    ]
  });
} else {
  noop = function() {
    // do nothing
  };
  var cl = function() {
    // do nothing
    this.loglevels = ["debug", "info", "warn", "error"];
    this.loglevel = 0;
  };
  cl.prototype.setLogLevel = function(levelstring) {
    var l = 0;
    for (;l < this.loglevels.length;l++) {
      if (this.loglevels[l] == levelstring) {
        this.loglevel = l;
        l = this.loglevels.length;
      }
    }
  };
  cl.prototype.debug = function(msg) {
    if (this.loglevel == 0) {
      console.log("DEBUG: " + msg);
    }
  };
  cl.prototype.info = function(msg) {
    if (this.loglevel <= 1) {
      console.log("INFO:  " + msg);
    }
  };
  cl.prototype.warn = function(msg) {
    if (this.loglevel <= 2) {
      console.log("WARN:  " + msg);
    }
  };
  cl.prototype.error = function(msg) {
    if (this.loglevel <= 3) {
      console.log("ERROR: " + msg);
    }
  };
  logger = new cl();
}

// DEFAULTS


/**
 * MLJS connection configuration database options
 * @typedef {Object} mljs.dboptions
 * @property {string} host - The hostname or IP address of the MarkLogic server. Ignored for Browser use.
 * @property {integer} port - The port of the MarkLogic server. Ignored for Browser use.
 * @property {integer} adminport - The port of the MarkLogic server's admin access. Ignored for Browser use.
 * @property {boolean} ssl - Whether to use http or https. Ignored for browser use
 * @property {string} auth - How to authenticate to the server. Ignored for browser use. Valid options are "digest", "basic" and "none"
 * @property {string} username - Ther username to authenticate with. Ignored for browser use
 * @property {string} password - User's password. Ignored for browser use
 * @property {string} database - The database to query or create. Browser use on V8+
 * @property {json} searchoptions - Not used
 * @property {integer} fastthreads - Not used
 * @property {integer} fastports - Not used
 */

var defaultdboptions = {
  host: "localhost", port: 9090, adminport: 8002, ssl: false, auth: "digest", username: "admin",password: "admin", database: "mldbtest", searchoptions: {}, fastthreads: 10, fastparts: 100
}; // TODO make Documents the default db, automatically figure out port when creating new rest server


var stringhelper = {};

/**
 * Converts a value in to separate words, splitting the words by dash, underscore, and CamelCase
 *
 * @param {string} str - The value to process
 */
stringhelper.processValueAll = function(str) {
  return stringhelper.processValue(str,"all");
};

/**
 * Converts a value in to separate words, using the specified mode
 *
 * @param {string} str - The value to process
 * @param {string} mode - The mode ("all|splitdash|splitunderscore|camelcase")
 */
stringhelper.processValue = function(str,mode) {
  var name = str;
  name = stringhelper.splitdash(name,mode);
  name = stringhelper.splitunderscore(name,mode);
  name = stringhelper.camelcase(name,mode);
  return name;
};

/**
 * Generate a standard set of snippet HTML. Useful for integrating to custom search results renderers
 *
 * @param {result} result - REST result JSON. Should contain result.matches[{"match-text": ["", ... ]}, ... ]
 */
stringhelper.snippet = function(result) {
  var resStr = "";

        for (var i = 0;i < result.matches.length;i++) {
          resStr += "<div class='searchresults-snippet'>\"";
          for (var m = 0;m < result.matches[i]["match-text"].length;m++) {
            if ("string" == typeof result.matches[i]["match-text"][m]) {
              resStr += result.matches[i]["match-text"][m] ;
            } else {
              resStr += "<span class='searchresults-snippet-highlight'>" + result.matches[i]["match-text"][m].highlight + "</span>";
            }
          }
          resStr += "\"</div>";
        }

  return resStr;
};

/**
 * Splits a string in to words when it encounters a dash. Returns a string with spaces instead of dashes.
 *
 * @param {string} value - The original value
 * @param {string} mode - The mode. Function only operates is mode is "all" or "splitdash"
 */
stringhelper.splitdash = function(value,mode) {
  if (value == undefined || value == null) {
    mljs.defaultconnection.logger.warn("WARNING: splitdash(): value is " + value);
    return "";
  }
  if ("string" != typeof value) {
    mljs.defaultconnection.logger.warn("WARNING: splitdash(): value is not of type string, but of type '" + (typeof value) + "'");
    return "" + value; // return raw value - can be converted to string
  }
  var name = value;
  if ("all" == mode || "splitdash" == mode) {
    //mljs.defaultconnection.logger.debug("Apply splitdash transform to " + name);
    var parts = name.split("-");
    var nn = "";
    for (var i = 0;i < parts.length;i++) {
      nn += parts[i] + " ";
    }
    name = nn.trim();
  }
  return name;
};

/**
 * Splits a string in to words when it encounters an underscore. Returns a string with spaces instead of underscores.
 *
 * @param {string} value - The original value
 * @param {string} mode - The mode. Function only operates is mode is "all" or "splitdunderscore"
 */
stringhelper.splitunderscore = function(value,mode) {
  var name = value;
  if ("all" == mode || "splitunderscore" == mode) {
    //mljs.defaultconnection.logger.debug("Apply splitunderscore transform to " + name);
    var parts = name.split("_");
    var nn = "";
    for (var i = 0;i < parts.length;i++) {
      nn += parts[i] + " ";
    }
    name = nn.trim();
  }
  return name;
};

/**
 * Splits a string in to words when it encounters a capital letter. Returns a string with spaces before a capital letter.
 *
 * @param {string} value - The original value
 * @param {string} mode - The mode. Function only operates is mode is "all" or "camelcase"
 */
stringhelper.camelcase = function(value,mode) {
  var name = value;
  if ("all" == mode || "camelcase" == mode) {
    //mljs.defaultconnection.logger.debug("Apply camelcase transform to " + name);
    var parts = name.split(" ");
    var nn = "";
    for (var i = 0;i < parts.length;i++) {
      nn += parts[i].substring(0,1).toUpperCase() + parts[i].substring(1) + " ";
    }
    name = nn.trim();
  }
  return name;
};



/**
 * Converts the specified text to XML using the Browser's built in XML support
 * @param {string} text - The textual representation of the XML
 */
function textToXML(text){
  var doc = null;
  if (undefined == text) {
    text = "";
  }
  if (typeof window === "undefined") {
    // return plain text in nodejs
    //var jsdom = require("jsdom");
    //doc = jsdom.jsdom(text, null, { FetchExternalResources: false, ProcessExternalResources: false });
    //var parser = new (require('xmlshim').DOMParser)(); // xmlshim >
    //var parser = require("libxml");
    var parser = new (require('flat-xmldom').DOMParser)();
    doc = parser.parseFromString(text, "text/xml");
    console.log("TEXT: " + text);
    console.log("DOC: " + doc)
  } else {
	  if (window.ActiveXObject){
      doc=new ActiveXObject('Microsoft.XMLDOM');
      doc.async='false';
      doc.loadXML(text);
    } else {
      var parser=new DOMParser();
      doc=parser.parseFromString(text,'text/xml');
	  }
  }
	return doc;
};

function xmlToText(xml) {
  return (new XMLSerializer()).serializeToString(xml);
};

/**
 * This returns a simplified JSON structure, equivalent to merging text nodes
 * removing whitespace and merging elements with attributes. Namespaces are also removed.
 * Use xmlToJsonStrict instead if you want an exact JSON representation of an XML document.
 *
 * @param {string} xml - The XML Document object to conver to JSON
 */
function xmlToJson(xml) {
  if (typeof xml == "string") {
    throw new TypeError("XML parameter should be an XML Document. It is currently a string.");
    //xml = textToXML(xml);
  }
  //console.log("XML: " + JSON.stringify(xml));
  //console.log("XML: node type: " + xml.nodeType);
  //console.log("XML: node value: " + xml.nodeValue);
  if (null == xml || undefined == xml) {
    return {};
  }
  var obj = {};
  if (xml.nodeType == 1) { // element
    if (xml.attributes.length > 0) {
      //obj["@attributes"] = {};
      for (var j = 0; j < xml.attributes.length; j++) {
        var attribute = xml.attributes.item(j);
        var nodeName = attribute.nodeName;
        var pos = nodeName.indexOf(":");
        if (-1 != pos) {
          nodeName = nodeName.substring(pos + 1);
        }
        obj[nodeName] = attribute.value;
      }
    }
  } else if (xml.nodeType == 3) { // attribute
    obj = xml.nodeValue;
  }
  if (undefined != xml.childNodes) {
    var justText = true;
    for (var i = 0; i < xml.childNodes.length; i++) {
      var item = xml.childNodes.item(i);
      var nodeName = item.nodeName.toLowerCase(); // lowercase due to Node.js XML library always assuming uppercase for element names
      var pos = nodeName.indexOf(":");
      if (-1 != pos) {
        nodeName = nodeName.substring(pos + 1);
      }
      if (typeof (obj[nodeName]) == "undefined") {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof (obj[nodeName].push) == "undefined") {
          var old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
        // do text merge here
      }
      if (("#text" == nodeName)) {
        if (Array.isArray(obj[nodeName])) {
          var text = "";
          for (var a = 0;a < obj[nodeName].length;a++) {
            text += obj[nodeName][a];
          }
          text = text.replace("\n","").replace("\t","").replace("\r","").trim();
          if (0 != text.length) {
            obj[nodeName] = text;
          } else {
            obj[nodeName] = undefined;
          }
        } else if ("string" == typeof obj[nodeName]){
          var text = obj[nodeName];
          text = text.replace("\n","").replace("\t","").replace("\r","").trim();
          if (0 != text.length) {
            // check for a value of "\"\"", which MUST still be included in response (its a blank value, not XML whitespace)
            obj[nodeName] = text.replace("\"","").replace("\"","");
          } else {
            obj[nodeName] = undefined;
          }
        }
      }
      if (undefined != obj[nodeName]) {
        justText = justText && ("#text" == nodeName);
      }
    }
    // check all children to see if they are only text items
    // if so, merge text items
    // now replace #text child with just the merged text value
    if (justText && undefined != obj[nodeName]) {
      var text = "";
      for (var i = 0; i < obj[nodeName].length; i++) {
        if ("string" == typeof obj[nodeName][i]) {
          text += obj[nodeName][i];
        } else if (Array.isArray(obj[nodeName][i])) {
          // merge array then add to text
          // No need, done elsewhere above
          // WILL CAUSE AN ERROR IN NODE.JS mljd.defaultconnection.logger.warn("WARNING: #text is still an array. Should not happen.")
        }
      }
      obj = text; // removes whitespace as unimportant // TODO replace with check for all string is whitespace first
    }
  }
  return obj;
};


/**
 * This returns a simplified JSON structure, equivalent to merging text nodes
 * removing whitespace and merging elements with attributes. Namespaces are also removed.
 * Use xmlToJsonStrict instead if you want an exact JSON representation of an XML document.
 *
 * THIS ONE IS FOR XML RESULTS TO JSON RESULTS
 *
 * @param {string} xml - The XML Document to transform to JSON
 */
function xmlToJsonSearchResults(xml) {
  if (null == xml || xml == undefined) {
    return {};
  }

  var obj = {};
  if (xml.nodeType == 1) {
    if (xml.attributes.length > 0) {
      //obj["@attributes"] = {};
      for (var j = 0; j < xml.attributes.length; j++) {
        var attribute = xml.attributes.item(j);
        var nodeName = attribute.nodeName;
        var pos = nodeName.indexOf(":");
        if (-1 != pos) {
          nodeName = nodeName.substring(pos + 1);
        }
        obj[nodeName] = attribute.value;
      }
    }
  } else if (xml.nodeType == 3) {
    obj = xml.nodeValue;
  }
  if (undefined != xml.childNodes) {

    var justText = true;
    // check if parent name is 'result'. If so, return content json object with encoded string of all child nodes
    var isResultContent = false;
    if (null != xml.parentNode) {
      //console.log("parentNode is not null");
      var ourName = xml.parentNode.nodeName;
      var pos = ourName.indexOf(":");
      if (-1 != pos) {
        ourName = ourName.substring(pos + 1);
      }
      //console.log("ourName: " + ourName);
      if ("result"==ourName) {
        isResultContent = true;
      }
    }

    if (isResultContent) {
        //console.log("GOT RESULT");

        //var s = "";
        //for (var i = 0; i < xml.childNodes.length; i++) {
        //  s += (new XMLSerializer()).serializeToString(xml.childNodes.item(i));
        //}
        //obj.content = s;

        obj.content = xmlToText(xml);
    } else {

    for (var i = 0; i < xml.childNodes.length; i++) {
      var item = xml.childNodes.item(i);
      var nodeName = item.nodeName;
      if (typeof (obj[nodeName]) == "undefined") {
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof (obj[nodeName].push) == "undefined") {
          var old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
        // do text merge here
      }
      if (("#text" == nodeName)) {
        if (Array.isArray(obj[nodeName])) {
          var text = "";
          for (var a = 0;a < obj[nodeName].length;a++) {
            text += obj[nodeName][a];
          }
          text = text.replace("\n","").replace("\t","").replace("\r","").trim();
          if (0 != text.length) {
            obj[nodeName] = text;
          } else {
            obj[nodeName] = undefined;
          }
        } else if ("string" == typeof obj[nodeName]){
          var text = obj[nodeName];
          text = text.replace("\n","").replace("\t","").replace("\r","").trim();
          if (0 != text.length) {
            // check for a value of "\"\"", which MUST still be included in response (its a blank value, not XML whitespace)
            obj[nodeName] = text.replace("\"","").replace("\"","");
          } else {
            obj[nodeName] = undefined;
          }
        }
      }
      if (undefined != obj[nodeName]) {
        justText = justText && ("#text" == nodeName);
      }
    }

    // check all children to see if they are only text items
    // if so, merge text items
    // now replace #text child with just the merged text value
    if (justText && undefined != obj[nodeName]) {
      var text = "";
      for (var i = 0; i < obj[nodeName].length; i++) {
        if ("string" == typeof obj[nodeName][i]) {
          text += obj[nodeName][i];
        } else if (Array.isArray(obj[nodeName][i])) {
          // merge array then add to text
          // No need, done elsewhere above
          // WILL CAUSE AN ERROR IN NODE.JS: mljs.defaultconnection.logger.warn("WARNING: #text is still an array. Should not happen.")
        }
      }
      obj = text; // removes whitespace as unimportant // TODO replace with check for all string is whitespace first
    }

  }

  }
  return obj;

};


function jsonExtractValue(json,namePath) {
  if (undefined == json) {
    return null;
  }
  var paths = namePath.split(".");
  var obj = json;
  for (var i = 0;undefined != obj && i < paths.length;i++) {
    obj = obj[paths[i]]; // TODO handle documents with multiple result container elements (arrays of results within same doc)
  }
  //mljs.defaultconnection.logger.debug("jsonExtractValue(): Returning value: " + obj);
  return obj;
};

function xmlExtractValue(xmldoc,namePath,namespaces_opt) {
  // construct and apply XPath from namePath
  //var xpath = "/" + namePath.replace(/\./g,"/");
  var xpath = namePath;
  //xpath = xpath.replace(/\/.*:/g,"/*:"); // replace all namespaces with global namespace - temporary hack
  console.log("Final XPath now: " + xpath);

  // TODO apply xpath to extract document value
  var myfunc = function(prefix) {
    if (undefined != namespaces_opt) {
      return namespaces_opt[prefix];
    } else {
        if (prefix === "jb") {
          return "http://marklogic.com/xdmp/json/basic";
        } else if (prefix === "i") {
          return "http://www.marklogic.com/intel/intercept";
        }
    }
          return null;
    //return null; // assume always default namespace
    // TODO support namespaces globally somehow - global context? page context?
  };

  var evalResult = xmldoc.evaluate(xpath,xmldoc,myfunc,2,null); // 2=string

  if (null == evalResult) {
    return null;
  }
  return evalResult.stringValue;
};

function extractValue(jsonOrXml,namePath,namespaces_opt) {
  if (undefined == jsonOrXml) {
    return null;
  }
  if ('object' == typeof(jsonOrXml) && undefined == jsonOrXml.nodeType) {
    return jsonExtractValue(jsonOrXml,namePath);
  } else if ('string' == typeof(jsonOrXml)) {
    return xmlExtractValue(textToXML(jsonOrXml),namePath);
  } else if (undefined == jsonOrXml) {
    return null;
  } else {
    return xmlExtractValue(jsonOrXml,namePath,namespaces_opt);
  }
};

function jsonOrXml(jsonOrXmlOrString) {
  if ('object' == typeof(jsonOrXmlOrString) && undefined == jsonOrXml.nodeType) {
    return jsonOrXmlOrString;
  } else if ('string' == typeof(jsonOrXmlOrString)) {
    if (jsonOrXmlOrString.substring(0,1) == "{") {
      return JSON.parse(jsonOrXmlOrString);
    } else {
      return textToXML(jsonOrXmlOrString);
    }
  } else if (undefined == jsonOrXmlOrString) {
    return null;
  } else {
    return jsonOrXmlOrString;
  }
};

/**
 * Strictly converts the supplied XML document to a JSON representation
 * from http://stackoverflow.com/questions/7769829/tool-javascript-to-convert-a-xml-string-to-json
 *
 * @param {string} xml - The XML Document to convert to JSON
 */
function xmlToJsonStrict(xml) {
  if (null == xml || undefined == typeof xml) {
    return {};
  }
  var obj = {};
  if (xml.nodeType == 1) {
    if (xml.attributes.length > 0) {
      obj["@attributes"] = {};
      for (var j = 0; j < xml.attributes.length; j++) {
        var attribute = xml.attributes.item(j);
        obj["@attributes"][attribute.nodeName] = attribute.value;
      }
    }
  } else if (xml.nodeType == 3) {
    obj = xml.nodeValue;
  }
  if (xml.hasChildNodes()) {
    for (var i = 0; i < xml.childNodes.length; i++) {
      var item = xml.childNodes.item(i);
      var nodeName = item.nodeName;
      if (typeof (obj[nodeName]) == "undefined") {
        obj[nodeName] = xmlToJsonStrict(item);
      } else {
        if (typeof (obj[nodeName].push) == "undefined") {
          var old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJsonStrict(item));
      }
    }
  }
  return obj;
};



// INSTANCE CODE






// mljs DATABASE OBJECT

var self;
/**
 * Creates an mljs instance. Aliased to new mljs().
 * @constructor
 *
 * @tutorial 011-browser-create-app
 * @tutorial 999-samples
 */
var mljs = function() {
  this.configure();
};
var m = mljs;

// CONFIG METHODS

/**
 * MLJS REST result wrapper object
 * @typedef {Object} mljs.result - The MLJS Result wrapper object
 * @property {Object} doc - The document returned, if applicable. XMLDocument or JSON object instance, or text for text docs only
 * @property {boolean} inError - Whether the call returned an error condition
 * @property {string} statusCode - The HTTP response code - normally numeric, but some http servers return dot-codes
 * @property {string} format - The high level format of the response, can be XML, json, text, or binary
 * @property {string} mime - The MIME content type returned in the content type header of the response
 */


/**
 * Provide configuration information to this database. This is merged with the defaults.
 *
 * @param {mljs.dboptions} dboptions - The DB Options to merge with the default options for this connection.
 */
mljs.prototype.configure = function(dboptions) {
  self = this;
  if (undefined == this.logger) {
    this.logger = logger;
  }

  // TODO abandon transaction if one exists
  // TODO kill in process http requests

  this.dboptions = defaultdboptions;
  if (undefined != dboptions) {
    for (var a in dboptions) {
      this.dboptions[a] = dboptions[a];
    }
    //this.dboptions = this.__merge(defaultdboptions,dboptions);
    //this.logger.debug("MERGED: " + JSON.stringify(this.dboptions)); // TODO TEST
  }

  this._version = null; // unknown
  this._forceVersion = null; // E.g. "6.0.4"
  this._optionsCache = {}; // caching options when calling saveOptions

  this.dboptions.wrappers = new Array();


  // determine which context we're running in
  if (!(typeof window ==="undefined")) {
    // in a browser

    if (!(typeof jQuery == 'undefined') && (!(undefined == mljs.bindings || undefined == mljs.bindings.jquery))) {
      // is jquery defined?
      logger.debug("Wrapper: jQuery, Version: " + jQuery.fn.jquery);
      if (undefined == mljs.bindings || undefined == mljs.bindings.jquery) {
        logger.debug("ERROR SEVERE: mljs.bindings.jquery is not defined. Included mljs-jquery.js ?");
      } else {
        this.dboptions.wrapper = new mljs.bindings.jquery();
      }
    } else if (!(typeof Prototype == 'undefined') && !(undefined == mljs.bindings || undefined == mljs.bindings.prototypejs)) {
      // is prototypejs defined?
      logger.debug("Wrapper: Prototype, Version: " + Prototype.Version);
      if (undefined == mljs.bindings || undefined == mljs.bindings.prototypejs) {
        logger.debug("ERROR SEVERE: mljs.bindings.prototypejs is not defined. Included mljs-prototype.js ?");
      } else {
        this.dboptions.wrapper = new mljs.bindings.prototypejs();
      }
    } else {
      // fallback to XMLHttpRequest
      logger.debug("Wrapper: Falling back to XMLHttpRequest");
      if (undefined == mljs.bindings) {
        logger.debug("ERROR SEVERE: mljs.bindings.xhr or xhr2 is not defined. Included mljs-xhr(2).js ?");
      } else {
        if (undefined == mljs.bindings.xhr) {
          logger.debug("Wrapper: Using XmlHttpRequest 2");
          this.dboptions.wrapper = new mljs.bindings.xhr2();
        } else {
          logger.debug("Wrapper: Using XmlHttpRequest");
          this.dboptions.wrapper = new mljs.bindings.xhr();
        }
      }
    }

    // set up default connection (most browser apps will have 1 connection only)
    if (undefined == m.defaultconnection) {
      m.defaultconnection = this;
    }

    // configure appropriate browser wrapper
    this.__doreq_impl = this.__doreq_wrap;
  } else {
    // in NodeJS

    // TODO support curl like 'anyauth' option to determine auth mechanism automatically (via HTTP 401 Authenticate)
    if (this.dboptions.auth == "basic") {
      this.dboptions.wrapper = new basic();
    } else if (this.dboptions.auth == "digest") {
     this.dboptions.wrapper = new digest();
    } else if (this.dboptions.auth == "none"){
      // no auth - default user
      this.dboptions.wrapper = new thru();
    } else if (this.dboptions.auth == "basicdigest" || this.dboptions.auth == "basic+digest") {
      // TODO basic+digest authentication
    }

    this.__doreq_impl = this.__doreq_node;
  }
  this.dboptions.wrapper.configure(this.dboptions.username,this.dboptions.password,this.logger);
};

/**
 * Forces MLJS to assume the server is a particular version (rather than try to ascertain it itself).
 *
 * @param {string} ver - THe version string. E.g. 6.0-3 or 7.0-1
 */
mljs.prototype.forceVersion = function(ver) {
  this._forceVersion = ver;
};

/**
 * Set the logging object to be used by this class and all wrappers. Must provide as a minimum a debug and info method that takes a single string.
 *
 * @param {object} newlogger - The logger object to use. Must support debug, log and info methods taking single string parameters.
 */
mljs.prototype.setLogger = function(newlogger) {
  //logger = newlogger;
  this.logger = newlogger;
  if (this.dboptions.wrapper != undefined) {
    this.dboptions.wrapper.logger = newlogger;
  }
};

mljs.prototype.__d = function(msg) {
  this.logger.debug(msg);
};
mljs.prototype.__i = function(msg) {
  this.logger.info(msg);
};
mljs.prototype.__w = function(msg) {
  this.logger.warn(msg);
};
mljs.prototype.__e = function(msg) {
  this.logger.error(msg);
};

if (typeof window === 'undefined') {
  // NodeJS exports
  module.exports = function() {return new mljs()};
} else {
  //mljs = m;
}




// PRIVATE METHODS

mljs.prototype.__genid = function() {
  return m.__dogenid();
};

m.__dogenid = function() {
  return "" + ((new Date()).getTime()) + "-" + Math.ceil(Math.random()*100000000);
}

/**
 * Invokes the appropriate Browser AJAX connection wrapper. Not to be called directly.
 * @private
 */
mljs.prototype.__doreq_wrap = function(reqname,options,content,callback_opt) {
  this.dboptions.wrapper.request(reqname,options,content,function(result) {
    (callback_opt || noop)(result);
  });
};

/**
 * Invokes the appropriate Node.js connection wrapper (see DigestWrapper and BasicWrapper for more information). Not to be called directly.
 * @private
 */
mljs.prototype.__doreq_node = function(reqname,options,content,callback_opt) {
  var self = this;

  var wrapper = this.dboptions.wrapper;

  // if hostname and port are not this db (ie if admin port), then use new wrapper object (or one previously saved)
  if (options.host != this.dboptions.host || options.port != this.dboptions.port) {
    var name = options.host + ":" + options.port;
    this.logger.debug("WARNING: Not accessing same host as REST API. Accessing: " + name);
    if (undefined == this.dboptions.wrappers[name]) {
      this.logger.debug("Creating new wrapper");
      var nw = new digest();
      nw.configure(this.dboptions.username,this.dboptions.password,this.logger); // always digest to other ports
      this.dboptions.wrappers[name] = nw;
      wrapper = nw;
    } else {
      this.logger.debug("Reusing saved wrapper");
      wrapper = this.dboptions.wrappers[name];
    }
  }

  var completeRan = false; // declared here incase of request error

  // add Connection: keep-alive
  options.headers["Connection"] = "keep-alive";

  var ct = options.contentType;
  if (undefined == ct) {
    self.logger.debug("NODE: *********** CT UNDEFINED *************");
    ct = "application/json";
  }
  if (undefined != content) {
    options.headers["Content-Type", ct];
  }

  var httpreq = wrapper.request(options, function(res) {
    var body = "";
    //self.logger.debug("---- START " + reqname);
    //self.logger.debug(reqname + " In Response");
    //self.logger.debug(reqname + " Got response: " + res.statusCode);
    //self.logger.debug("Method: " + options.method);


    res.on('data', function(data) {
      body += data;
      //self.logger.debug(reqname + " Data: " + data);
    });
    var complete = function() {
      if (!completeRan) {
        completeRan = true; // idiot check - complete can be called from many places and events
        //self.logger.debug(reqname + " complete()");
        if (res.statusCode.toString().substring(0,1) == ("4")) {
          self.logger.error(reqname + " error: " + body);
          var details = body;
          if ("string" == typeof body) {
            details = textToXML(body);
          }
          if (undefined != details.nodeType) {
            details = xmlToJson(details);
          }
          (callback_opt || noop)({statusCode: res.statusCode,error: body,inError: true, details: details});
        } else {
          // 2xx or 3xx response (200=OK, 303=Other(content created) )
          var jsonResult = {body: body, statusCode: res.statusCode,inError: false};
          if (options.method == "GET" && undefined != body && ""!=body) {
            //self.logger.debug("Response (Should be JSON): '" + body + "'");
            try {
              jsonResult.doc = JSON.parse(body);
              jsonResult.format = "json";
            } catch (err) {
              // try XML
              jsonResult.doc = textToXML(body);
              jsonResult.format = "xml";
            }
          }
          if (res.statusCode == 303) {
            self.logger.debug("303 result headers: " + JSON.stringify(res.headers));
            var loc = res.headers["location"]; // NB all headers are lower case in the request library
            if ((options.method == "PUT" || options.method == "POST") && loc != undefined) {
              // check for Location header - used a fair bit to indicate location of created resource
              jsonResult.location = loc;
            }
          }
          (callback_opt || noop)(jsonResult);
        }
      }
    };
    res.on('end', function() {
      //self.logger.debug(reqname + " End. Body: " + body);
      complete();
    });
    res.on('close',function() {
      //self.logger.debug(reqname + " Close");
      complete();
    });
    res.on("error", function() {
      //self.logger.debug(reqname + " ERROR: " + res.statusCode);
      completeRan = true;
      (callback_opt || noop)({statusCode: res.statusCode,error: body,inError: true});
    });

    //self.logger.debug("Method: " + options.method);
    if (options.method == "PUT" || options.method == "DELETE") {
      complete();
    }
    //self.logger.debug(reqname + " End Response (sync)");
    //self.logger.debug("---- END " + reqname);

  });
  httpreq.on("error",function(e) {
    completeRan = true;
    self.logger.debug("__doreq: REQUEST ERROR: " + e);
    (callback_opt || noop)({inError: true,error: e}); // SHOULD THIS BE DETAIL INSTEAD OF ERROR?
  });
  if (undefined != content && null != content) {
    if ("string" == typeof (content)) {
      httpreq.write(content);
    } else if ("object" == typeof(content)) {
      if (undefined != content.nodeType) {
        // XML
        httpreq.write((new XMLSerializer()).serializeToString(content));
      } else {
        // JSON
        try {
          httpreq.write(JSON.stringify(content));
        } catch (err) {
          self.logger.error("Error serialising suspected JSON during PUT (falling back to raw (text) content): " + err);
          httpreq.write(content);
        }
      }
    }
  }
  httpreq.end();
};

/**
 * Handles management of all HTTP requests passed to the wrappers. Should never be invoked directly.
 * @private
 */
mljs.prototype.__doreq = function(reqname,options,content,callback_opt) {
  this.logger.debug("__doreq: reqname: " + reqname + ", method: " + options.method + ", uri: " + options.path);
  if (undefined == options.host) {
    options.host = this.dboptions.host;
  }
  if (undefined == options.port) {
    options.port = this.dboptions.port;
  }
  if (undefined == options.headers) {
    options.headers = {};
  } else {
    //this.logger.debug(reqname + " headers: " + JSON.stringify(options.headers))
  }
  // Convert format=json in to a content type header (increases performance for some reason)
  var pos = options.path.indexOf("format=json");
  if (-1 != pos) {
    //options.path = options.path.substring(0,pos - 1) + options.path.substring(pos+11);
    if (options.method !== "GET") {
      if (undefined !== typeof options.headers["Content-type"]) {
        options.headers["Content-type"] = "application/json";
      }
    }
    if (undefined !== typeof options.headers["Accept"]) {
      options.headers["Accept"] = "application/json"; // NB check this is not explicitly defined by calling method first
    }
    //this.logger.debug("Converted format=json to Content-Type header. Path now: " + options.path + " , headers now: " + JSON.stringify(options.headers));
  }

  this.__doreq_impl(reqname,options,content,callback_opt);
};





// PASS THROUGH




/**
 * Function allowing mljs's underlying REST invocation mechanism to be used for an arbitrary request.
 *
 * Useful for future proofing should some new functionality come out, or bug discovered that prevents
 * your use of a JavaScript Driver API call.
 *
 * @param {object} options_opt - {method: "GET|POST|PUT|DELETE", path: "/v1/somepath?key=value&format=json"}
 * @param {object} content_opt - undefined for GET, DELETE, json for PUT, whatever as required for POST
 * @param {object} callback_opt - the optional callback to invoke after the method has completed
 */
mljs.prototype.do = function(options_opt,content_opt,callback_opt) {
  if ((callback_opt == undefined) && (typeof(content_opt) === 'function')) {
    callback_opt = content_opt;
    content_opt = undefined;
  }
  this.__doreq("DO",options_opt,content_opt,callback_opt);
};






// DATABASE ADMINISTRATION FUNCTIONS




/**
 * Does this database exist? Returns an object, not boolean, to the callback
 *
 * @param {function} callback - The callback function to invoke
 */
mljs.prototype.exists = function(callback) {
  var options = {
    host: this.dboptions.host,
    port: this.dboptions.adminport,
    path: "/v1/rest-apis?database=" + encodeURI(this.dboptions.database) + "&format=json",
    method: "GET"
  };
  var self = this;
  this.__doreq("EXISTS",options,null,function(result) {
    self.logger.debug("EXISTS callback called... " + JSON.stringify(result));
    if (result.inError) {
      // if 404 then it's not technically in error
      self.logger.debug("exists: inError: " + JSON.stringify(result));
      result.exists = false; // assume 404 not found or connect exception
      result.inError = false;
      callback(result);
    } else {
      self.logger.debug("Returned rest api info: " + JSON.stringify(result.doc));
      //var ex = !(undefined == result.doc["rest-apis"] || (result.doc["rest-apis"].length == 0) ||undefined == result.doc["rest-apis"][0] || (undefined != result.doc["rest-apis"][0] && self.dboptions.database != result.doc["rest-apis"][0].database));
      var ex = false;
      if (undefined != result.doc["rest-apis"] && result.doc["rest-apis"].length > 0 && result.doc["rest-apis"][0].database == self.dboptions.database) {
        ex = true;
      }
      // NB can return http 200 with no data to mean that DB does not exist
      self.logger.debug("exists:? " + ex);
      callback({inError:false,exists:ex});
    }
  });
};
mljs.prototype.test = mljs.prototype.exists;


/**
 * Creates the database and rest server if it does not already exist
 *
 * @param {mljs.dboptions} options_opt - Optional separate database options. Defaults to normal connection options.
 * Useful to override if creating an app server for writing content to the modules database.
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.create = function(options_opt,callback_opt) {
  /*
  curl -v --anyauth --user admin:admin -X POST \
      -d'{"rest-api":{"name":"mldbtest-rest-9090","database": "mldbtest","modules-database": "mldbtest-modules","port": "9090"}}' \
      -H "Content-type: application/json" \
      http://localhost:8002/v1/rest-apis
  */
  if ("function" === typeof(options_opt)) {
    callback_opt = options_opt;
    options_opt = null;
  }
  var opts = options_opt || this.dboptions;

  var mdb = opts.database;
  if (-1 == mdb.indexOf("-modules")) {
    mdb += "-modules";
  }
  var json = {"rest-api": {"name": opts.appname || opts.database, "database": opts.database, "modules-database": opts.modulesdatabase || mdb, port: opts.port}};
  var options = {
    host: opts.host,
    port: opts.adminport,
    path: '/v1/rest-apis',
    method: 'POST',
    headers: {"Content-Type": "application/json", "Content-Length": JSON.stringify(json).length} // TODO refactor this in to __doreq
  };

  this.__doreq("CREATE",options,json,callback_opt);
};

/**
 * Destroys the database and rest api instance
 *
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.destroy = function(options_opt,callback_opt) {
  var self = this;
  if ("function" === typeof(options_opt)) {
    callback_opt = options_opt;
    options_opt = null;
  }
  var dodestroy = function() {
    // don't assume the dbname is the same as the rest api name - look it up
    var opts = options_opt || self.dboptions;

    var getoptions = {
      host: opts.host,
      port: opts.adminport,
      path: "/v1/rest-apis?database=" + encodeURI(opts.database) + "&format=json",
      method: "GET"
    };
    self.__doreq("DESTROY-EXISTS",getoptions,null,function(result) {
      self.logger.debug("Returned rest api info: " + JSON.stringify(result.doc));

      var ex = !(undefined == result.doc["rest-apis"] || undefined == result.doc["rest-apis"][0] || opts.database != result.doc["rest-apis"][0].database);

      if (!ex) {
        // doesn't exist already, so return success
        self.logger.debug("Rest server for database " + opts.database + " does not exist already. Returning success.");
        (callback_opt || noop)({inError: false, statusCode: 200});
      } else {
        var restapi = result.doc["rest-apis"][0].name;

        var options = {
          host: opts.host,
          port: opts.adminport,
          path: '/v1/rest-apis/' + encodeURI(restapi) + "?include=" + encodeURI("content"), // TODO figure out how to include ,modules too, and why error is never caught or thrown
          method: 'DELETE'
        };
        self.__doreq("DESTROY",options,null,callback_opt);
      }

    });
  }

  // abandon any transaction if it exists
  if (undefined != this.__transaction_id) {
    this.rollbackTransaction(function(result) {
      // no matter what the result, destroy the db
      dodestroy();
    });
  } else {
    dodestroy();
  }


};





// DOCUMENT AND SEARCH FUNCTIONS





/**
 * Fetches a document with the given URI.
 *
 * {@link https://docs.marklogic.com/REST/GET/v1/documents}
 *
 * options_opt currently supports these options:-
 *
 * - transform - the name of the installed transform to use when fetching the document</li>
 *
 * @param {string} docuri - The URI of the document to retrieve
 * @param {JSON} options_opt - Additional optional options to use
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.get = function(docuri,options_opt,callback_opt) {
  if (undefined == callback_opt && typeof(options_opt)==='function') {
    callback_opt = options_opt;
    options_opt = undefined;
  }
  var options = {
    path: '/v1/documents?uri=' + encodeURI(docuri) /* + "&format=json"*/,
    method: 'GET'
  };
  if (undefined != options_opt && undefined != options_opt.path) {
    options.path = this._applyTransformProperties(options_opt.path);
  }
  if (docuri.endsWith(".json")) {
    options.path += "&format=json";
  }

  this.__doreq("GET",options,null,function (result) {
    result.docuri = docuri;
    (callback_opt||noop)(result);
  });
};

/**
 * Fetches the metadata for a document with the given URI. Metadata document returned in result.doc
 *
 * {@link https://docs.marklogic.com/REST/GET/v1/documents}
 *
 * @param {string} docuri - The URI of the document whose metadata you want to retrieve.
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.metadata = function(docuri,callback_opt) {
  var options = {
    path: '/v1/documents?uri=' + encodeURI(docuri) + "&format=json&category=metadata",
    method: 'GET'
  };

  this.__doreq("METADATA",options,null,function (result) {
    result.docuri = docuri;
    (callback_opt||noop)(result);
  });
};

/**
 * Fetches the properties for a document with the given URI. Properties document returned in result.doc
 *
 * {@link https://docs.marklogic.com/REST/GET/v1/documents}
 *
 * @param {string} docuri - The URI of the document whose properties you want to retrieve.
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.properties = function(docuri,callback_opt) {
  var options = {
    path: '/v1/documents?uri=' + encodeURI(docuri) + "&format=json&category=properties",
    method: 'GET'
  };

  this.__doreq("PROPERTIES",options,null,function (result) {
    result.docuri = docuri;
    (callback_opt||noop)(result);
  });
};

/**
 * Save the properties for a document with the given URI.
 *
 * {@link https://docs.marklogic.com/REST/PUT/v1/documents}
 *
 * @param {string} docuri - The URI of the document whose properties you want to retrieve.
 * @param {JSON} properties - The JSON properties document.
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.saveProperties = function(docuri,properties,callback_opt) {
  var options = {
    path: '/v1/documents?uri=' + encodeURI(docuri) + "&format=json&category=properties",
    method: 'PUT',
    contentType: "application/json"
  };

  this.__doreq("SAVEPROPERTIES",options,properties,function (result) {
    result.docuri = docuri;
    (callback_opt||noop)(result);
  });
};

/**
 * <p>Saves new docs with GUID-timestamp, new docs with specified id, or updates doc with specified id
 * NB handle json being an array of multiple docs rather than a single json doc
 * If no docuri is specified, one is generated by using a combination of the time and a large random number.
 *
 * {@link https://docs.marklogic.com/REST/PUT/v1/documents}
 *
 * props_opt can be used to provide extra options. These are:-
 *
 * - collection - The comma delimited string of the collections to add the document to
 *
 * - contentType - The content type (MIME type) of the doc. Useful for uploaded binary documents.
 *
 * - format - The format of the response. Either json (default if not specified) or xml.
 *
 * - permissions - array of permission JSON objects to apply: E.g. [{role: 'secret-write', permissions: 'update|read|delete'}, ...]
 *
 * @param {json|xml|file} jsonXmlBinary - The document content to save
 * @param {string} docuri_opt - The optional URI of the document to create
 * @param {JSON} props_opt - The optional additional properties to use.
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.save = function(jsonXmlBinary,docuri_opt,props_opt,callback_opt) {
  if (undefined == callback_opt) {
    if (undefined != props_opt) {
      if (typeof(props_opt)==='function') {
        if (typeof(docuri_opt)==='string') {
          this.logger.debug("json,docuri,,callback");
          callback_opt = props_opt;
          props_opt = undefined;
        } else {
          this.logger.debug("json,,props,callback");
          callback_opt = props_opt;
          props_opt = docuri_opt;
          docuri_opt = undefined;
        }
      } else {
        this.logger.debug("json,docuri,props,");
        // do nothing
      }
    } else {
      if (undefined == docuri_opt) {
        this.logger.debug("json,,,");
        // do nothing
      } else {
        if(typeof(docuri_opt)=="function") {
          this.logger.debug("json,,,callback");
          callback_opt = docuri_opt;
          docuri_opt = undefined;
        } else {
          if (typeof(docuri_opt) === "string") {
            this.logger.debug("json,docuri,,");
            // do nothing
          } else {
            this.logger.debug("json,,props,");
            props_opt = docuri_opt;
            docuri_opt = undefined;
          }
        }
      }
    }
  } else {
   this.logger.debug("json,docuri,props,callback");
    // do nothing
  }

  if (undefined == docuri_opt) {
    // generate docuri and set on response object
    docuri_opt = this.__genid();
  }

  var format = "json";
  var contentType = null; // default to using format, above
  var url = "/v1/documents?uri=" + encodeURI(docuri_opt);
  if (undefined != props_opt) {
    if (undefined != props_opt.collection) {
      var cols = props_opt.collection.split(",");
      for (var c = 0;c < cols.length;c++) {
        url += "&collection=" + encodeURI(cols[c]);
      }
    }
    if (undefined != props_opt.contentType) {
      format = null;
      contentType = props_opt.contentType;
    }
    if (undefined != props_opt.format) {
      // most likely 'binary'
      format = props_opt.format;
    }
    if (undefined != props_opt.permissions) {
      // array of {role: name, permission: read|update|execute} objects
      for (var p = 0;p < props_opt.permissions.length;p++) {
        url += "&perm:" + props_opt.permissions[p].role + "=" + props_opt.permissions[p].permission;
      }
    }
  }

  var options = {
    path: url,
    method: 'PUT'
  };
  if (null != contentType) {
    options.contentType = contentType;
  } else {
    // determine content type from object itself
    if ("object" == typeof jsonXmlBinary) {
      if (undefined != jsonXmlBinary.nodeType) {
        // XML doc
        options.contentType = "text/xml";
        format = null; // overrides param override setting
      } else {
        this.logger.debug("MLJS.save: No contentType specified, falling back to blank (server deterined)"); // was application/json
        // assume JSON, but could easily be binary too
        //options.contentType = "application/json";
        format = null; // overrides param override setting

        try {
          var asString = JSON.stringify(jsonXmlBinary)
          if ("{" == asString.substring(0,1) && "}" == asString.substring(asString.length - 1,asString.length)) {
            // is a json object
            format = "json";
            options.contentType = "application/json";
          }
        } catch (err) {
          // default to null format, no type - not a JSON object if cant stringify
        }

        // NB binary support exists within wrappers
      }

    } else {
      // check is string
      if ("string" == typeof jsonXmlBinary) {
        options.contentType = "text/plain";
        format = null; // overrides param override setting
        // text doc
      } else {
        // binary blob or such like???
        throw new Exception("Unsupported file save type. Throwing error. typeof: " + (typeof(jsonXmlBinary)));
      }
    }
  }
  this.logger.debug("mljs.save(): Content Type now: " + options.contentType);
  //if (null != format) {
  //  options.path += "&format=" + format;
  //} // format not needed - this is the format of the results, not the content being sent, so dont pass all format settings in using this code
  // make transaction aware
  if (undefined != this.__transaction_id) {
    options.path += "&txid=" + encodeURI(this.__transaction_id);
  }

  this.__doreq("SAVE",options,jsonXmlBinary,function(result) {
    result.docuri = docuri_opt;
    (callback_opt||noop)(result);
  });
};

/**
 * Updates the document with the specified uri by only modifying the passed in properties.</p><p>
 * NB May not be possible in V6 REST API elegantly - may need to do a full fetch, update, save.
 *
 * KNOWN ISSUE: Does not work in 1.6 testing. Use patch() instead.
 *
 * @param {JSON} json - The JSON document to merge with the existing document
 * @param {string} docuri - The URI of the document to update
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.merge = function(json,docuri,callback_opt) {
  // make transaction aware - automatically done by save
  var self = this;
  this.get(docuri,function(result) {
    var merged = result.doc;
    var res = {};
    res = self.__merge(merged,json);
    //self.logger.debug("Merged JSON: " + JSON.stringify(res));
    //res = self.__merge(merged,json); // fix dboptions.concat in configure()
    self.save(res,docuri,callback_opt);
  });
};

mljs.prototype.__merge = function(json1,json2) {if (undefined == json1 && undefined != json2) {
    //this.logger.debug("JSON1 undefined, returning: " + json2);
    return json2;
  } else if (undefined == json2 && undefined != json1) {
    //this.logger.debug("JSON2 undefined, returning: " + json1);
    return json1;
  } else if (typeof(json1)==='object' && typeof(json2)==='object') {
    //this.logger.debug("Both 1&2 are JSON objects. json1: " + JSON.stringify(json1) + ", json2: " + JSON.stringify(json2));
    // can be merged
    var merged = {};
    for (var k in json1) {
      if (json1.hasOwnProperty(k) && 'function' != typeof(json1[k])) {
        merged[k] = json1[k];
      }
    }
    for (var k in json2) {
      if (json2.hasOwnProperty(k) && 'function' != typeof(json2[k])) {
        merged[k] = this.__merge(merged[k],json2[k]);
      }
    }
    return merged;
  } else if (undefined == json1 && undefined == json2) {
    return undefined;
  } else {
    //this.logger.debug("Both 1&2 are JSON values. json2 (newest): " + json2);
    // return the second (new) value
    return json2;
  }
}

mljs.prototype.__mergeold = function(json1,json2) {
  //this.logger.debug("__merge: JSON json1: " + JSON.stringify(json1) + ", json2: " + JSON.stringify(json2));
  if (undefined == json1 && undefined != json2) {
    //this.logger.debug("JSON1 undefined, returning: " + json2);
    return json2;
  } else if (undefined == json2 && undefined != json1) {
    //this.logger.debug("JSON2 undefined, returning: " + json1);
    return json1;
  } else if (typeof(json1)==='object' && typeof(json2)==='object') {
    //this.logger.debug("Both 1&2 are JSON objects. json1: " + JSON.stringify(json1) + ", json2: " + JSON.stringify(json2));
    // can be merged
    var merged = {};
    for (var k in json1) {
      if (json1.hasOwnProperty(k)) {
        merged[k] = json1[k];
      }
    }
    for (var k in json2) {
      if (json2.hasOwnProperty(k)) {
        merged[k] = this.__merge(merged[k],json2[k]);
      }
    }
    return merged;
  } else if (undefined == json1 && undefined == json2) {
    return undefined;
  } else {
    //this.logger.debug("Both 1&2 are JSON values. json2 (newest): " + json2);
    // return the second (new) value
    return json2;
  }
};

/**
 * Which nodes to select in the XML to replace
 * @typedef {Object} mljs.elementSelectionJson
 * @property {mljs.elementSelectionJsonNamespaces} namespaces - Namespaces to use
 * prefix, ns
 * @property {string} context - The context parameter for the rapi:replace-insert command
 * @property {string} select - The selection XPath for the element (property) to replace
 */

/**
 * Array of namespace objects, with below members
 * @typedef {Object} mljs.elementSelectionJsonNamespaces
 * @property {string} prefix - The text prefix to use. E.g. 'xhtml'
 * @property {string} ns - The namespace uri. E.g. 'http://w3.org/xhtml/1999'
 */

/**
 * Uses MarkLogic V7's Patch support to replace or insert a property for the specified document.
 *
 * {@link https://docs.marklogic.com/REST/POST/v1/documents}
 *
 * @param {string} docuri - The URI of the document to patch
 * @param {mljs.elementSelectJson} elementSelectJSON - JSON object containing a namespaces array with prefix and ns elements, an XPath 'context' (parent of the node to replace), and a 'select' XPath (remaining XPath to select child to replace) - {namespaces: [{prefix: "myns",ns: "http://myns.org/myns"}], context: "//myns:parent", select: "myns:child[1]"}
 * @param {xml|text} content - The document properties context to save
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.replaceProperty = function(docuri,elementSelectJSON,content,callback_opt) {
  /*
  <rapi:patch xmlns:rapi="http://marklogic.com/rest-api">
    <rapi:insert context="/inventory/history" position="last-child"><modified>2012-11-5</modified></rapi:insert>
    <rapi:delete select="saleExpirationDate"/>
    <rapi:replace select="price" apply="ml.multiply">1.1</rapi:replace>
</rapi:patch>
  */

  var s = "<rapi:patch xmlns:rapi=\"http://marklogic.com/rest-api\"";

  if (undefined != elementSelectJSON.namespaces) {
    for (var i = 0, max = elementSelectJSON.namespaces.length;i < max;i++) {
      s += " xmlns:" + elementSelectJSON.namespaces[i].prefix + "=\"" + elementSelectJSON.namespaces[i].ns + "\"";
    }
  }
  var theContent = content;
  if (content instanceof object) {
    // assume an XMLElement
    theContent = this.db.xmlToText(content);
  }

  s += ">";
  s += "  <rapi:replace-insert context=\"" + elementSelectJSON.context + "\" select=\"";
  s += elementSelectJSON.select + "\">" + theContent + "</rapi:replace>";
  s += "</rapi:patch>";

  var url = "/v1/documents?uri=" + encodeURI(docuri_opt) + "&category=properties";

  var options = {
    path: url,
    method: 'POST',
    contentType: "application/xml",
    headers: {
      "X-HTTP-Method-Override": "PATCH"
    }
  };

  if (undefined != this.__transaction_id) {
    options.path += "&txid=" + encodeURI(this.__transaction_id);
  }

  this.__doreq("REPLACEPROPERTY",options,s,function(result) {
    result.docuri = docuri;
    (callback_opt||noop)(result);
  });

};

/**
 * Deletes the specified document
 *
 * {@link https://docs.marklogic.com/REST/DELETE/v1/documents}
 *
 * @param {string} docuri - URI of the document to delete
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.delete = function(docuri,callback_opt) {
  var url = '/v1/documents?uri=' + encodeURI(docuri);

  // make transaction aware
  if (undefined != this.__transaction_id) {
    url += "&txid=" + encodeURI(this.__transaction_id);
  }

  var options = {
    path: url,
    method: 'DELETE'
  };

  this.__doreq("DELETE",options,null,callback_opt);
};
mljs.prototype.remove = mljs.prototype.delete; // Convenience method for people with bad memories like me

/**
 * Returns all documents in a collection, optionally matching against the specified fields
 *
 * {@link http://docs.marklogic.com/REST/GET/v1/search}
 *
 * @param {string} collection - The collection to list documents from
 * @param {string} fields_opt - Not used
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.collect = function(collection,fields_opt,callback_opt) {
  if (callback_opt == undefined && typeof(fields_opt)==='function') {
    callback_opt = fields_opt;
    fields_opt = undefined;
  }
  var options = {
    path: "/v1/search?collection=" + encodeURI(collection) + "&format=json&view=results",
    method: "GET"
  };
  this.__doreq("COLLECT",options,null,callback_opt);
};

/**
 * Lists all documents in a directory, to the specified depth (default: 1), optionally matching the specified fields
 *
 * {@link http://docs.marklogic.com/REST/GET/v1/search}
 *
 * @param {string} directory - The directory URI to list documents within
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.list = function(directory,callback_opt) {
  var options = {
    path: "/v1/search?directory=" + encodeURI(directory) + "&format=json&view=results",
    method: "GET"
  };
  this.__doreq("LIST",options,null,callback_opt);
};

/**
 * Performs a simple key-value search. Of most use to JSON programmers.
 *
 * {@link https://docs.marklogic.com/REST/GET/v1/keyvalue}
 *
 * @param {string} key - The JSON key to use for document retrieval
 * @param {string} value - The value of the JSON key to match against candidate documents
 * @param {string} keytype_opt - What type to use for the key type. Defaults to 'key'. (i.e. JSON key, not element)
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.keyvalue = function(key,value,keytype_opt,callback_opt) {
  if (undefined == callback_opt && typeof(keytype_opt) === 'function') {
    callback_opt = keytype_opt;
    keytype_opt = undefined;
  }
  if (undefined == keytype_opt) {
    keytype_opt = "key"; // also element, attribute for xml searches
  }
  var url = "/v1/keyvalue?" + keytype_opt + "=" + encodeURI(key) + "&value=" + encodeURI(value) + "&format=json";

  // make transaction aware
  if (undefined != this.__transaction_id) {
    url += "&txid=" + encodeURI(this.__transaction_id);
  }

  var options = {
    path: url,
    method: "GET"
  };
  this.__doreq("KEYVALUE",options,null,callback_opt);
};

/**
 * Deletes ALL documents and triples in the content database
 *
 * Uses deleteUsingSearch()
 *
 * @param {function} callback - The optional callback to invoke after the method completes
 */
mljs.prototype.deleteAll = function(callback) {
  this.deleteUsingSearch(callback);
};

/**
* Deletes ALL content matching a search
*
* {@link http://docs.marklogic.com/REST/DELETE/v1/search}
*
* See supported search grammar {@link http://docs.marklogic.com/guide/search-dev/search-api#id_41745}
*
* Supported values for sprops_opt:-
*
* - collection - The collection to restrict search results from
* - directory - The directory uri to restrict search results from
* - transform - The transform to apply to the top level results object on the server
* - format - The format of the response. json or xml. json is the default if not specified
*
* @param {string} query_opt - The query string. Optional. (Returns all documents if not supplied, or whatever returns from the additional-query in the json options used)
* @param {string} options_opt - The name of the installed options to use. Optional. In 0.7+ can also be a JSON options document, if used against MarkLogic 7
* @param {JSON} sprops_opt - Additional optional search properties
* @param {function} callback - The optional callback to invoke after the method completes
*/
mljs.prototype.deleteUsingSearch = function(query_opt,options_opt,sprops_opt,callback) {
  if (callback == undefined && typeof(sprops_opt) === 'function') {
    callback = sprops_opt;
    sprops_opt = undefined;
  } else {
      if (callback == undefined && typeof(options_opt) === 'function') {
        callback = options_opt;
        options_opt = undefined;
      } else {
        if (callback == undefined && typeof(query_opt) == 'function') {
          // DEVELOPER WARNING: ABOUT TO DELETE ALL DOCUMENTS IN THE CONTENT DATABASE!!!
          callback = query_opt;
          query_opt = undefined;
        }
      }
  }
  var self = this;

    var content = null;

    var q = "";
    var nextSep = "?";
    /*
    // TODO fix the below by checking out the REST API docs for valid query parameters
    if (undefined != query_opt) {
      q = "?q=" + encodeURI(query_opt);
      nextSep = "&";
    }
    */
    var url = "/v1/search" + q;
    if (options_opt != undefined) {
      if (typeof options_opt === "string") {
        url += nextSep + "options=" + encodeURI(options_opt);
        nextSep = "&";
      }/* else {
        // add as content document
        content = options_opt;
        method = "POST"; // verify
      }*/
    }

    url = self._applySearchProperties(url,sprops_opt);


    // TODO check options' type - if string, then pass as options param. If JSON object, then do POST to /v1/search to provide options dynamically

    // make transaction aware
    if (undefined != self.__transaction_id) {
      url += nextSep + "txid=" + encodeURI(self.__transaction_id);
    }

    var options = {
      path: url,
      method: "DELETE"
    };


    this.__doreq("DELETEUSINGQUERY",options,null,callback);

};

/**
 * Performs a search:search via REST
 *
 * {@link http://docs.marklogic.com/REST/GET/v1/search}
 *
 * See supported search grammar {@link http://docs.marklogic.com/guide/search-dev/search-api#id_41745}
 *
 * Supported values for sprops_opt:-
 *
 * - collection - The collection to restrict search results from
 * - directory - The directory uri to restrict search results from
 * - transform - The transform to apply to the top level results object on the server
 * - format - The format of the response. json or xml. json is the default if not specified
 *
 * @param {string} query_opt - The query string. Optional. (Returns all documents if not supplied, or whatever returns from the additional-query in the json options used)
 * @param {string} options_opt - The name of the installed options to use. Optional. In 0.7+ can also be a JSON options document, if used against MarkLogic 7
 * @param {positiveInteger} start_opt - Index of the first result to return in the page. First index is 1 (not 0). Defaults to 1 if not provided.
 * @param {JSON} sprops_opt - Additional optional search properties
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.search = function(query_opt,options_opt,start_opt,sprops_opt,callback) {
  this.logger.debug("*** start_opt: " + start_opt);
  if (callback == undefined && typeof(sprops_opt) === 'function') {
    callback = sprops_opt;
    sprops_opt = undefined;
  } else {
    if (callback == undefined && typeof(start_opt) === 'function') {
      callback = start_opt;
      start_opt = undefined;
    } else {
      if (callback == undefined && typeof(options_opt) === 'function') {
      callback = options_opt;
      options_opt = undefined;
      }
    }
  }
  var self = this;
  var v6func = function() {
  var content = null;
  var method = "GET";
  var url = "/v1/search?q=" + encodeURI(query_opt) ;
  if (options_opt != undefined) {
    if (typeof options_opt === "string") {
      url += "&options=" + encodeURI(options_opt);
    }/* else {
      // add as content document
      content = options_opt;
      method = "POST"; // verify
    }*/
  }

  url = self._applySearchProperties(url,sprops_opt);

  if (undefined != start_opt) {
    url += "&start=" + start_opt;
  }
  url += "&view=all";

  // TODO check options' type - if string, then pass as options param. If JSON object, then do POST to /v1/search to provide options dynamically

  // make transaction aware
  if (undefined != self.__transaction_id) {
    url += "&txid=" + encodeURI(self.__transaction_id);
  }

  var options = {
    path: url,
    method: method
  };
  self.__doreq("SEARCHV6",options,content,function(result) {
    // Horrendous V7 EA1 workaround...
    //if ("xml" == result.format) {
      //self.logger.debug("result currently: " + JSON.stringify(result));
      // convert to json for now (quick in dirty)
      // TODO replace this with 'nice' fix for V7 transforms
      //0result.doc = xmlToJsonSearchResults(result.doc);
      //1result.format = "json";
      //if (undefined == result.doc.result) {
        //2result.doc = result.doc.response;
        //3result.doc.results = result.doc.result;
        //4result.doc.result = undefined;
        /*
        for (var i = 0;i < result.doc.results.length;i++) {
          result.doc.results[i].content = {html: result.doc.results[i].html};
          result.doc.results[i].html = undefined;
        }*/
      //}
      //self.logger.debug("Result doc now: " + JSON.stringify(result.doc));
    //}
    (callback||noop)(result);
  });
  }; // end v6 func

  this.v7check(v6func,function() {
    var optionsdoc = self._optionsCache[options_opt || "all"];
    if (undefined == optionsdoc) {
      v6func();
    } else {
      var url = "/v1/search?q=" + encodeURI(query_opt) ;
      url = self._applySearchProperties(url,sprops_opt);

      if (undefined != start_opt) {
        url += "&start=" + start_opt;
      }
      url += "&view=all";

      // make transaction aware
      if (undefined != self.__transaction_id) {
        url += "&txid=" + encodeURI(self.__transaction_id);
      }

      var query = {search: {
        options: optionsdoc.options,
        qtext: query_opt
      }};

      var options = {
        path: url,
        method: "POST"
      };
      self.__doreq("SEARCHV7",options,query,function(result) {
        (callback||noop)(result);
      });
    } // end v7 options if
  });
};

/**
 * Performs a search:search via REST. Helper method for SEARCH.
 *
 * {@link http://docs.marklogic.com/REST/GET/v1/search}
 *
 * See supported search grammar {@link http://docs.marklogic.com/guide/search-dev/search-api#id_41745}
 *
 * @param {string} collection_opt - The optional collection to restrict the results to
 * @param {string} query_opt - The optional query string
 * @param {string} options_opt - The optional name of the installed query options to use
 * @param {JSON} sprops_opt - Additional optional search properties
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.searchCollection = function(collection_opt,query_opt,options_opt,sprops_opt,callback) {
  if (callback == undefined && typeof(options_opt) === 'function') {
    if (undefined == sprops_opt) {
      callback = options_opt;
      options_opt = undefined;
    } else {
      callback = sprops_opt;
      sprops_opt = undefined;
    }
  }
  var self = this;
  var v6func = function() {
    var url = "/v1/search?q=" + encodeURI(query_opt);
    if (undefined != collection_opt) {
      url += "&collection=" + encodeURI(collection_opt);
    }
    if (options_opt != undefined) {
      url += "&options=" + encodeURI(options_opt);
    }

    url = self._applySearchProperties(url,sprops_opt);

    // make transaction aware
    if (undefined != self.__transaction_id) {
      url += "&txid=" + encodeURI(self.__transaction_id);
    }

    var options = {
      path: url,
      method: "GET"
    };
    self.__doreq("SEARCHCOLLECTIONV6",options,null,callback);
  };
  this.v7check(v6func,function() {
    var optionsdoc = self._optionsCache[options_opt];
    if (undefined == optionsdoc) {
      v6func();
    } else {
      var url = "/v1/search";
      var gotQuestionMark = false;
      if (undefined != collection_opt) {
        gotQuestionMark = true;
        url += "?collection=" + encodeURI(collection_opt);
      }
      url = self._applySearchProperties(url,sprops_opt);

      // make transaction aware
      if (undefined != self.__transaction_id) {
        if (gotQuestionMark) {
          url += "&";
        } else {
          url += "?";
        }
        url += "txid=" + encodeURI(self.__transaction_id);
      }

      var query = {search: {
        options: optionsdoc.options,
        qtext: query_opt
      }};

      var options = {
        path: url,
        method: "POST"
      };
      self.__doreq("SEARCHCOLLECTIONV7",options,query,callback);
    }
  });
};

/**
 * Used to consistenly manage transform properties. Used by search and doc get functions. Application of the JavaScript Configuration Pattern (location 1734).
 * @private
 */
mljs.prototype._applyTransformProperties = function(url,sprops_opt) {
  if (undefined != sprops_opt) {
    if (undefined != sprops_opt.transform) {
      // MarkLogic 7.0+ only
      url += "&transform=" + sprops_opt.transform;
      if (undefined != sprops_opt.transformParameters) {
        for (var pname in sprops_opt.transformParameters) {
          url += "&trans:" + pname + "=" + encodeURI(sprops_opt.transformParameters[pname]);
        }
      }
    }
  }
  return url;
};

/**
 * Used to consistenly manage search properties. Application of the JavaScript Configuration Pattern (location 1734).
 * @private
 */
mljs.prototype._applySearchProperties = function(url,sprops_opt) {
  // apply properties
  var gotQM = (-1 != url.indexOf("?"));
  var prepend = function(param) {
    if (gotQM) {
      return "&" + param;
    } else {
      gotQM = true;
      return "?" + param;
    }
  };

  if (undefined != sprops_opt) {
    if (undefined != sprops_opt.collection) {
      var cols = sprops_opt.collection.split(",");
      for (var c = 0;c < cols.length;c++) {
        url += prepend("collection=" + encodeURI(cols[c]));
      }
    }
    if (undefined != sprops_opt.directory) {
      url += prepend("directory=" + sprops_opt.directory);
    }
    if (undefined != sprops_opt.transform) {
      url = this._applyTransformProperties(url,sprops_opt); // equals not append - the function returns the whole altered URL
    }
    if (undefined != sprops_opt.format) {
      url += prepend("format=" + sprops_opt.format);
    } else {
      url += prepend("format=json");
    }
    if (undefined != sprops_opt.start_opt) {
      url += prepend("start=" + sprops_opt.start_opt); // SHOULD THIS BE REMOVED? IT HAS _opt. IS A BIT RANDOM
    }
    if (undefined != sprops_opt.start) {
      this.logger.debug("mljs._applySearchProperties: start prop: " + sprops_opt.start);
      url += prepend("start=" + sprops_opt.start);
    }
  } else {
    url += prepend("format=json");
  }

  return url;
};

/**
 * Performs a structured search.
 *
 * {@link http://docs.marklogic.com/REST/GET/v1/search}
 *
 * Uses structured search instead of cts:query style searches. See {@link http://docs.marklogic.com/guide/search-dev/search-api#id_53458}
 *
 * Use this method in conjunction with the Query Builder {@see mljs.prototype.query}
 *
 * @param {JSON} query_opt - The optional structured query JSON to restrict the results by
 * @param {string} options_opt - The optional name of the installed query options to use
 * @param {JSON} sprops_opt - Additional optional search properties
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.structuredSearch = function(query_opt,options_opt,sprops_opt,callback) {
  if (callback == undefined) {
    if (typeof(options_opt) === 'function') {
      callback = options_opt;
      options_opt = undefined;
    } else {
      if (typeof(sprops_opt) === 'function') {
        callback = sprops_opt;
        sprops_opt = undefined;
      }
    }
  }
  var self = this;
  // IF ON V7 THEN DO COMBINED QUERY ALWAYS
  var v6func = function() {
    // V6 assume options already saved
    var url = "/v1/search?structuredQuery=" + encodeURI(JSON.stringify(query_opt));
    if (options_opt != undefined) {
      url += "&options=" + encodeURI(options_opt);
    }

    url = self._applySearchProperties(url,sprops_opt);

    // make transaction aware
    if (undefined != self.__transaction_id) {
      url += "&txid=" + encodeURI(self.__transaction_id);
    }
    var options = {
      path: url,
      method: "GET"
    };
    //console.log("OPTIONS: " + JSON.stringify(options));
    self.__doreq("STRUCTUREDSEARCHV6",options,null,callback);
  };
  this.v7check(v6func,function() {
    var optionsdoc = self._optionsCache[options_opt || "all"];
    if (undefined == optionsdoc) {
      // hopefully it'll be on the server
      v6func();
    } else {
      self.combinedQuery(query_opt,null,optionsdoc,sprops_opt,callback);
    }
  });
};
mljs.prototype.structuredQuery = mljs.prototype.structuredSearch;

/**
 * Performs a MarkLogic Server V7+ Combined query. This submits options along with the query term. It can also include both structured and plain text query terms in one call.
 *
 * {@link http://docs.marklogic.com/REST/GET/v1/search}
 *
 * Uses structured search instead of cts:query style searches. See {@link http://docs.marklogic.com/guide/search-dev/search-api#id_53458}
 *
 * Use this method in conjunction with the Query Builder {@see mljs.prototype.query}
 *
 * @param {JSON} structuredQuery_opt - The optional structured query JSON to restrict the results by
 * @param {string} textQuery_opt - The query string. Optional. (Returns all documents if not supplied, or whatever returns from the additional-query in the json options used)
 * @param {string} optionsdoc - The optional query options object to use (NOT the name of query options already saved)
 * @param {JSON} sprops_opt - Additional optional search properties
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.combined = function(structuredQuery_opt,textQuery_opt,optionsdoc,sprops_opt,callback) {
  var self = this;
  // V7 combined query
  var q = structuredQuery_opt || {query: {}};
  // V7, and we have local options
  var query = {"search":{
    "query": q.query,
    "qtext": textQuery_opt,
    "options": optionsdoc.options}
  };
  var url = "/v1/search";
  url = self._applySearchProperties(url,sprops_opt);

  // make transaction aware
  if (undefined != self.__transaction_id) {
    url += "&txid=" + encodeURI(self.__transaction_id);
  }
  var options = {
    path: url,
    method: "POST"
  };
  //console.log("OPTIONS: " + JSON.stringify(options));
  self.__doreq("COMBINEDQUERY",options,query,callback);
};
mljs.prototype.combinedQuery = mljs.prototype.combined;
mljs.prototype.combinedSearch = mljs.prototype.combined;

/**
 * Uses the version rest extension to verify if we're on V7+ or less than V7. First func is called if less than V7, second func called if V7 or above.
 * Typically used internally by MLJS functions, but also potentially useful to app developers (hence being a public method)
 *
 * @param {function} v6func - The function to call if MarkLogic is Version 6 (or unknown version)
 * @param {function} v7func - The function to call if MarkLogic is Version 7
 */
mljs.prototype.v7check = function(v6func,v7func) {
  // check version number first
  var self = this;
  var doit = function() {
    if (null == self._version || false === self._version || self._version.substring(0,self._version.indexOf(".")) < 7) {
      v6func();
    } else {
      v7func();
    }
  };
  if ((this._version == null || false === this._version) && null != this._forceVersion) {
    this.logger.debug("v7check: Forcing version: " + this._forceVersion);
    this._version = this._forceVersion;
  }
  if (this._version == null) {
    try {
      this.version(doit);
    } catch (err) {
      this.db.logger.debug("mljs.v7check: Failed to get version. Extension not installed? Assume V6.");
    }
  } else {
    doit();
  }
};

/**
* Saves search options with the given name. These are referred to by mljs.structuredSearch.
*
* {@link http://docs.marklogic.com/REST/PUT/v1/config/query/*}
*
* For structured search options see {@link http://docs.marklogic.com/guide/rest-dev/search#id_48838}
*
* Use this function in conjunction with the Search Options Builder. {@see mljs.prototype.options}
*
* @param {string} name - The name to install the search options under
* @param {JSON|XMLDocument} searchoptions - The search options JSON object. {@see mljs.prototype.options.prototype.toJson}
* @param {function} callback_opt - The optional callback to invoke after the method completes
*/
mljs.prototype.saveSearchOptions = function(name,searchoptions,callback_opt) {
  var format = "json";
  var ct = "application/json";
  if (("object" == typeof(searchoptions) && undefined != searchoptions.childNodes) || "string" == typeof (searchoptions)) {
    format = "xml";
    ct = "application/xml"; // JSON seems to be required, even if content is XML string
    //console.log("XML?: " + searchoptions);
  }
  var options = {
    path: "/v1/config/query/" + name,
    method: "PUT",
    contentType: ct
  };
  this._optionsCache[name] = searchoptions; // TODO only cache if JSON format
  this.__doreq("SAVESEARCHOPTIONS",options,searchoptions,callback_opt);
};

/**
 * Call this if you only want to save search options on versions of MarkLogic prior to V7, but want to use
 * Combined Query if executing on V7 and above.
 *
 * {@link http://docs.marklogic.com/REST/PUT/v1/config/query/*}
 *
 * For structured search options see {@link http://docs.marklogic.com/guide/rest-dev/search#id_48838}
 *
 * Use this function in conjunction with the Search Options Builder. {@see mljs.prototype.options}
 *
 * @param {string} name - The name to install the search options under
 * @param {JSON} searchoptions - The search options JSON object. {@see mljs.prototype.options.prototype.toJson}
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.saveSearchOptionsCheck = function(name,searchoptions,callback_opt) {
  var self = this;
  var v6func = function() {
    self.saveSearchOptions(name,searchoptions,callback_opt);
  };
  this.v7check(v6func, function() {
    // just cache them instead
    self._optionsCache[name] = searchoptions;

    (callback_opt || noop)({error: false});
  });
};

/**
 * Fetches search options, if they exist, for the given search options name
 *
 * {@link http://docs.marklogic.com/REST/PUT/v1/config/query/*}
 *
 * For structured serch options see {@link http://docs.marklogic.com/guide/rest-dev/search#id_48838}
 *
 * @param {string} name_opt - The name of the installed search options to retrieve as JSON. If none specified, lists them all
 * @param {mljs.optionsparams} - The parameters for the search options operation. E.g. {format: "xml"}
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.searchOptions = function(name_opt,params_opt,callback) {
  if (undefined == callback) {
    if ('function'==typeof(name_opt)) {
      callback = name_opt;
      name_opt = null;
    } else {
      callback = params_opt;
      params_opt = null;
    }
  }
  var path = "/v1/config/query";
  if (undefined != name_opt) {
    path += "/" + name_opt;
  }
  if (undefined != params_opt && undefined != params_opt.format) {
    if ("xml" == params_opt.format) {
      path += "?format=xml";
    } else {
      path += "?format=json";
    }
  } else {
    path += "?format=json";
  }
  var options = {
    path: path,
    method: "GET"
  };
  // don't cache on retrieve - if they're already on the server that's fine
  this.__doreq("SEARCHOPTIONS",options,null,callback);
};
mljs.prototype.searchoptions = mljs.prototype.searchOptions; // typo workaround for backwards compatibility

/**
 * Suggest query completion based on the given partial query
 *
 * {@link http://docs.marklogic.com/REST/GET/v1/suggest}
 *
 * @param {string} q - The partial query to generate suggestions for
 * @param {string} options_opt - The saved query options to use
 * @param {json} additional_properties_opt - Extra properties as a json object. E.g. q, limit, cursor-position
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.suggest = function(q,options_opt,additional_properties_opt,callback) {
  var options = {
    path: "/v1/suggest?format=json&partial-q=" + encodeURI(q) + "&options=" + encodeURI(options_opt),
    method: "GET"
  };
  if (undefined != additional_properties_opt) {
    for (var name in additional_properties_opt) {
      var val = additional_properties_opt[name];
      options.path += "&" + name + "=" + encodeURI(val); // TODO handle q value as array - at the moment only 1 q value is supported
    }
  }
  this.__doreq("SUGGEST",options,null,callback);
};

/**
 * Fetches values from a lexicon or computes 2-way co-occurence.
 *
 * {@link https://docs.marklogic.com/REST/GET/v1/values/*}
 *
 * @param {string|JSON} query - The query string (string) or structured query (object) to use to restrict the results
 * @param {string} tuplesname - The name of the tuples in the installed search options to return
 * @param {string} optionsname - The name of the installed search options to use
 * @param {JSON} sprops_opt - Additional optional search properties
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.values = function(query,tuplesname,optionsname,sprops_opt,callback_opt) {
  if (undefined == callback_opt && 'function' === typeof(sprops_opt)) {
    callback_opt = sprops_opt;
    sprops_opt = undefined;
  }
  var self = this;
  var v6func = function() {
    var options = {
      path: "/v1/values/" + tuplesname + "?options=" + encodeURI(optionsname),
      method: "GET"
    };
    if (typeof query == "string") {
      // plain text query
      options.path += "&q=" + encodeURI(query);
    } else if (typeof query == "object") {
      // structured query
      options.path += "&structuredQuery=" + encodeURI(JSON.stringify(query));
    }

    options.path = self._applySearchProperties(options.path,sprops_opt);

    self.__doreq("VALUESV6",options,null,callback_opt);
  };

  this.v7check(v6func,function() {
    // V7 combined query
    var optionsdoc = self._optionsCache[optionsname];
    if (undefined == optionsdoc) {
      // hopefully it'll be on the server
      v6func();
    } else {
      var options = {
        path: "/v1/values/" + tuplesname,
        method: "POST"
      };
      var search = { search:{
        options: optionsdoc.options
      }};
      if (typeof query == "string") {
        // plain text query
        search.search.qtext = query;
      } else if (typeof query == "object") {
        // structured query
        search.search.query = query.query;
      }

      options.path = self._applySearchProperties(options.path,sprops_opt); // WONT THIS BE IGNORED?

      self.__doreq("VALUESV7",options,search,callback_opt);
    }
  });
};

/**
 * Same functionality as values() but uses a combined search options and query mechanism.
 * This requires MarkLogic V7 EA 1 or above.
 *
 * {@link http://docs-ea.marklogic.com/REST/POST/v1/values/*}
 *
 * For structured serch options see {@link http://docs.marklogic.com/guide/rest-dev/search#id_48838}
 *
 * Executes the values configuration provided. The name 'shotgun' used below is not important. {@see mljs.prototype.subcollections} for an example usage.
 *
 * @param {JSON} search - The JSON structured search to use
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.valuesCombined = function(search,callback) {

  var options = {
    path: "/v1/values/shotgun?direction=ascending&view=values",
    method: "POST"
  };

  this.__doreq("VALUESCOMBINED",options,search,callback);
};

/**
 * Lists the collection URIS underneath the parent uri.
 * Helper method to fetch collections from the collection lexicon using mljs.valuesCombined().
 *
 * @param {string} parenturi_opt - The collection URI under which to retrieve the list of subcollections. Defaults to "/"
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.collections = function(parenturi_opt,callback) {
  var parenturi = "/";
  if (undefined == callback) {
    callback = parenturi_opt;
    parenturi_opt = undefined;
  }
  if (undefined != parenturi_opt) {
    parenturi = parenturi_opt;
  }
  var values = {
    search: {
      "query": {
        "collection-query" : {
          uri: [parenturi]
        }
      },
      "options": {
        "values": [
          {
            "name": "childcollectionsvalues",
            "constraint": [
              {
                "name": "childcollections",
                "collection": {
                  "prefix": parenturi
                }
              }
            ]
          }
        ]
      }
    }
  };

  var self = this;

  this.valuesCombined(values,function(result) {
    self.logger.debug("collection values result: " + JSON.stringify(result));
    if (result.inError) {
      callback(result);
    } else {
      // extract just the values collection and return that for simplicity
      var list = result["values-response"].value;
      var values = new Array();
      for (var i = 0;i < list.length;i++) {
        values.push(list[i][0]._value);
      }
      result.doc = {values: values};

      callback(result);
    }
  });
};
mljs.prototype.subcollections = mljs.prototype.collections;


// VERSION 7 SEMANTIC CAPABILITIES


/**
* MLJS graph functions extended configuration object.
* @typedef {Object} mljs.graphparams - MLJS graph functions extended configuration object.
* @property {string} format - The high level format of the response, can be turtle, ntriples, n3 (TODO verify this list)
*/

/**
 * Saves a set of triples as an n-triples graph. Allows you to specify a named graph (collection) or use the default graph.
 *
 * {@link http://docs.marklogic.com/REST/PUT/v1/graphs}
 *
 * I'm using an easy to interpret JSON triples format. This prevents the user of this function from having to know the
 * n-triples format. Here is an example:-
 * triples = [{subject: "http://someiri/#here", predicate: "http://someiri/#here", object: "http://someiri/#here"},... ]
 *
 * Note: We assume that the 'object' if provided as JSON triples is an IRI, not a string or other primitive value.
 * Construct your own N-triples if you need to provide raw primitive values.
 *
 * @param {string|JSON} triples - The raw N-triples (string) or JSON triples (object JSON array) to store
 * @param {string} uri_opt - The graph name to replace. If not provided, the default MarkLogic graph (all triples) will be replaced.
 * @param {mljs.graphparams} params_opt - JSON containing graph extended properties. E.g. format: "turtle"
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.saveGraph = function(triples,uri_opt,params_opt,callback_opt) {
  if (undefined == callback_opt) {
    if ("function" === typeof uri_opt) {
      callback_opt = uri_opt;
      uri_opt = undefined;
    } else {
      callback_opt = params_opt;
      params_opt = undefined;
    }
  }

  var options = {
    path: "/v1/graphs", // EA nightly URL
    contentType: "text/plain",
    method: "PUT"
  }
  if (undefined != uri_opt) {
    options.path += "?graph=" + encodeURI(uri_opt);
  } else {
    options.path += "?default";
  }
  // create a graph doc
  var graphdoc = "";
  if ("object" === typeof triples) {
    for (var i = 0;i < triples.length;i++) {
      // TODO handle simple (intrinsic type) objects
      graphdoc += "<" + triples[i].subject + "> <" + triples[i].predicate + "> ";

      if (undefined != triples[i].object) {
        graphdoc += "<" + triples[i].object + ">";
      } else if (undefined != triples[i].string) {
        graphdoc += "\"" + triples[i].string + "\"";
        if (undefined != triples[i].locale) {
          graphdoc += "@" + triples[i].locale;
        }
      } else if (undefined != triples[i].number) {
        graphdoc += "\"" + triples[i].number + "\"";
      } else {
        throw new Exception("Triples does not have an object, string or number value: " + JSON.stringify(triples[i]));
      }
      graphdoc += " .\n";
    }
  } else {
    graphdoc = triples; // raw text in n-triples format
    if (undefined != params_opt && undefined != params_opt.format) {
      if ("turtle" == params_opt.format) {
        options.contentType = "text/turtle";
      } // TODO other content types (N-triples already handled as text/plain bv )
    }
  }
  this.logger.debug("SAVEGRAPH triple content: " + graphdoc);
  this.__doreq("SAVEGRAPH",options,graphdoc,callback_opt);
};

/**
 * Merges a set of triples in to an n-triples graph. Allows you to specify a named graph (collection) or use the default graph.
 *
 * {@link http://docs.marklogic.com/REST/POST/v1/graphs}
 *
 * @param {string|JSON} triples - The raw N-triples (string) or JSON triples (object JSON array) to store
 * @param {string} uri_opt - The graph name to replace. If not provided, the default MarkLogic graph (all triples) will be merged.
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.mergeGraph = function(triples,uri_opt,callback_opt) {
  if (undefined == callback_opt && "function" === typeof uri_opt) {
    callback_opt = uri_opt;
    uri_opt = undefined;
  }

  var options = {
    path: "/v1/graphs",
    contentType: "text/plain",
    method: "POST"
  }
  if (undefined != uri_opt) {
    options.path += "?graph=" + encodeURI(uri_opt);
  } else {
    options.path += "?default";
  }
  // create a graph doc
  var graphdoc = "";
  if ("object" === typeof triples) {
    for (var i = 0;i < triples.length;i++) {
      graphdoc += "<" + triples[i].subject + "> <" + triples[i].predicate + "> <" + triples[i].object + "> .\n";
    }
  } else {
    graphdoc = triples; // raw text in n-triples format
  }
  this.__doreq("MERGEGRAPH",options,graphdoc,callback_opt);
};

/**
 * Returns the specified graph from MarkLogic Server, or the full default graph. USE CAREFULLY!
 * Returns the triples as a JSON {subject: "...", predicate: "...", object: "..."} array in result.triples, or the raw in result.doc
 *
 * {@link http://docs.marklogic.com/REST/GET/v1/graphs}
 *
 * @param {string} uri_opt - The name of the grah to return. If not provided, the default MarkLogic graph (all triples, not just triples not in a named graph) will be returned.
 * @param {mljs.graphparams} params_opt - JSON containing graph extended properties. E.g. format: "turtle"
 * @param {function} callback_opt - The optional callback to invoke after the method completes.
 */
mljs.prototype.graph = function(uri_opt,params_opt,callback_opt) {
  if (undefined == callback_opt) {
    if ("function" === typeof uri_opt) {
      callback_opt = uri_opt;
      uri_opt = undefined;
    } else {
      callback_opt = params_opt;
      params_opt = undefined;
    }
  }

  var options = {
    path: "/v1/graphs",
    method: "GET",
    headers: {Accept: "application/json"}
  }
  if (undefined != uri_opt) {
    options.path += "?graph=" + encodeURI(uri_opt);
  } else {
    options.path += "?default";
  }
  var format = "json";

  if (undefined != params_opt && undefined != params_opt.format) {
    format = params_opt.format;
    if ("turtle" == params_opt.format) {
      options.headers = {Accept:"text/turtle"};
    } // TODO other content types
  } else {
    options.headers = {Accept:"application/json"}; // TODO verify this works
  }

  this.__doreq("GETGRAPH",options,null,function(result) {
    if (result.inError) {
      (callback_opt||noop)(result);
    } else {
      if ("json" == format) {
        // convert to JSON array representation for convenience
        var lines = result.doc.split("\n");
        var triples = new Array();
        var spos,ppos,opos,send,pend,oend,line;
        for (var l = 0;l < lines.length;l++) {
          line = lines[l];
          spos = line.indexOf("<");
          send = line.indexOf(">",spos + 1);
          ppos = line.indexOf("<",send + 1);
          pend = line.indexOf(">",ppos + 1);
          opos = line.indexOf("<",pend + 1);
          oend = line.indexOf(">",opos + 1);
          triples.push({subject: line.substring(spos + 1,send), predicate: line.substring(ppos + 1,pend), object: line.substring(opos + 1,oend)});
        }
        result.triples = triples;
      }
      (callback_opt||noop)(result);
    }
  });
};

/**
 * Deletes the specified graph from MarkLogic Server
 *
 * {@link http://docs.marklogic.com/REST/DELETE/v1/graphs}
 *
 * @param {string} uri - The name of the graph to delete. Required. (Cannot be 'default')
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.deleteGraph = function(uri,callback_opt) {
  var options = {
    path: "/v1/graphs?graph=" + encodeURI(uri),
    method: "DELETE"
  };

  this.__doreq("DELETEGRAPH",options,null,callback_opt);
};

/**
 * Executes the specified sparql query.
 *
 * {@link http://docs.marklogic.com/REST/POST/v1/graphs/sparql}
 *
 * @param {string} sparql - The sparql query text
 * @param {function} callback - The callback to invoke after the method completes.
 */
mljs.prototype.sparql = function(sparql,callback) {
  var options = {
    path: "/v1/graphs/sparql",
    method: "POST",
    contentType: "text/plain",
    headers: []
    /*
    path: "/v1/graphs/sparql?query=" + encodeURI(sparql),
    method: "GET"
    */
  };
  options.headers["Accept"] = "application/sparql-results+json";
  //options.headers["Content-Type"] = "text/plain";

  this.__doreq("SPARQL",options,sparql,callback);
};





// TRANSFORMS


/**
 * Saves a transform to the MarkLogic REST API instance with the given name, content, type and optional properties.
 *
 * {@link http://docs.marklogic.com/REST/PUT/v1/config/transforms/[name]}
 *
 * @param {string} name - The internal name to use for the transform
 * @param {binary|xmldocument} transformbinary - The binary JavaScript implementation wrapper, or XML document instance, to persist
 * @param {string} type - Either 'xslt' or 'xquery' or 'application/xslt+xml' or 'application/xquery' - the mime type of the transform
 * @param {json} properties_opt - Optional properties document for transform metadata. See documentation for a list. E.g. title, transform parameters
 * @param {function} callback - Callback function to call after receiving a server response
 */
mljs.prototype.saveTransform = function(name,transformbinary,type,properties_opt,callback) {
  // optional properties check
  if (undefined == callback && 'function' == typeof(properties_opt)) {
    callback = properties_opt;
    properties_opt = undefined;
  }
  // MLJS shorthand check
  var type = type || "xslt";
  if ("xslt" == type) {
    type = "application/xslt+xml";
  } else if ("xquery" == type) {
    type = "application/xquery";
  }
  // sanity check
  if ("application/xquery" != type && "application/xslt+xml" != type) {
    throw new TypeError("type should be either 'xquery' or 'xslt' or 'application/xquery' or 'application/xslt+xml'");
  }
  var options = {
    path: "/v1/config/transforms/" + encodeURI(name),
    method: "PUT",
    contentType: type
  };
  // apply properties to URL
  var first = true;
  for (var prop in properties_opt) {
    if (first) {
      options.path += "?";
      first = false;
    } else {
      options.path += "&";
    }
    options.path += prop + "=" + encodeURI(properties_opt[prop]);
  }
  this.__doreq("SAVETRANSFORM",options,transformbinary,callback);
};

/**
 * Deletes the named transform
 *
 * {@link http://docs.marklogic.com/REST/DELETE/v1/config/transforms/[name]}
 *
 * @param {string} name - The internal name of the transform to delete
 * @Param {function} callback_opt - The optional callback function
 */
mljs.prototype.deleteTransform = function(name,callback_opt) {
  var options = {
    path: "/v1/config/transforms/" + encodeURI(name),
    method: "DELETE"
  };
  this.__doreq("DELETETRANSFORM",options,null,callback_opt);
};

/**
 * Fetches the transform XSLT or XQuery document.
 *
 * {@link http://docs.marklogic.com/REST/GET/v1/config/transforms/[name]}
 *
 * @param {string} name - The name of the transform to return
 * @param {function} callback - The callback function to call. Document will be contained within the JSON result.doc parameter
 */
mljs.prototype.getTransform = function(name,callback) {
  var options = {
    path: "/v1/config/transforms/" + encodeURI(name),
    method: "GET"
  };
  this.__doreq("GETTRANSFORM",options,null,callback);
};

/**
 * List all transforms available on the REST API instance. Returns their JSON description as per the REST API documentation.
 *
 * {@link http://docs.marklogic.com/REST/GET/v1/config/transforms}
 *
 * @param {function} callback - The callback function to invoke. Results in the JSON result.doc parameter
 */
mljs.prototype.listTransforms = function(callback) {
  var options = {
    path: "/v1/config/transforms?format=json",
    method: "GET"
  };
  this.__doreq("LISTTRANSFORMS",options,null,callback);
};







// TRANSACTION MANAGEMENT







/**
 * Opens a new transaction. Optionally, specify your own name.
 *
 * {@link http://docs.marklogic.com/REST/POST/v1/transactions}
 *
 * Note: Each mljs instance can only have one live transaction at a time. This is a limit imposed by myself by design, not by the underlying REST API.
 * Best to configure a connection per real user-application pair.
 *
 * @param {string} name_opt - The name of the transaction. If not provided, 'client-txn' will be used. Likely not safe on a multi user system.
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.beginTransaction = function(name_opt,callback) {
  if (undefined == callback && typeof(name_opt)==='function') {
    callback = name_opt;
    name_opt = undefined;
  }

  // ensure a transaction ID is not currently open
  if (undefined != this.__transaction_id) {
    var result = {inError:true,error: "This DB instance has an open transaction. Multiple transactions not supported in this version of mljs."};
    (callback||noop)(result);
  } else {
    // temporary workaround for not having a mechanism to retrieve the Location header
    if (undefined == name_opt) {
      name_opt = "client-txn"; // same as server default
    }
    var url = "/v1/transactions";
    if (undefined != name_opt) { /* always true. Kept for sanity check in case we alter preceding if statement. */
      url += "?name=" + encodeURI(name_opt);
      //this.__transaction_id = name_opt;
    }
    var options = {
      path: url,
      method: "POST"
    };
    var self = this;
    this.__doreq("BEGINTRANS",options,null,function(result){
      // if error, remove txid
      if (result.inError) {
        self.__transaction_id = undefined;
      } else {
        self.__transaction_id = result.location.substring(17); // txid is in the Location header after /v1/transactions/
        self.logger.debug("Created transaction id: " + result.location);
      }

      result.txid = self.__transaction_id;

      // call callback
      (callback||noop)(result);
    });
  }
};
mljs.prototype.begin = mljs.prototype.beginTransaction;

/**
 * Commits the open transaction</p><p>
 *
 * {@link http://docs.marklogic.com/REST/POST/v1/transactions/*}
 *
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.commitTransaction = function(callback) {
  var options = {
    path: "/v1/transactions/" + this.__transaction_id + "?result=commit",
    method: "POST"
  };
  this.__transaction_id = undefined;
  this.__doreq("COMMITTRANS",options,null,callback);
};
mljs.prototype.commit = mljs.prototype.commitTransaction;

/**
 * Rolls back the open transaction.</p><p>
 *
 * {@link http://docs.marklogic.com/REST/POST/v1/transactions/*}
 *
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.rollbackTransaction = function(callback) {
  var options = {
    path: "/v1/transactions/" + this.__transaction_id + "?result=rollback",
    method: "POST"
  };
  this.__transaction_id = undefined;
  this.__doreq("ABANDONTRANS",options,null,callback);
};
mljs.prototype.rollback = mljs.prototype.rollbackTransaction;







// CLIENT CONFIGURATION

/**
 * Checks whether the database contains indexes for all installed search options.
 *
 * {@link http://docs.marklogic.com/REST/GET/v1/config/indexes}
 *
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.indexes = function(callback) {
  var options = {
    path: "/v1/config/indexes?format=json",
    method: "GET"
  };
  this.__transaction_id = undefined;
  this.__doreq("INDEXES",options,null,callback);
};














// DRIVER HELPER FEATURES







/**
 * Generic wrapper to wrap any mljs code you wish to execute in parallel. E.g. uploading a mahoosive CSV file. Wrap ingestcsv with this and watch it fly!
 *
 * NOTE: By default all E-node (app server requests, like the ones issued by this JavaScript wrapper) are executed in a map-reduce style. That is to say
 * they are highly parallelised by the server, automatically, if in a clustered environment. This is NOT what the fast function does. The fast function
 * is intended to wrap utility functionality (like CSV upload) where it may be possible to make throughput gains by running items in parallel. This is
 * akin to ML Content Pump (mlcp)'s -thread_count and -transaction_size ingestion options. See defaultdboptions for details
 *
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.fast = function(callback_opt) {
  this.__fast = true;
  (callback_opt||noop)({inError:false,fast: true});
};







// UTILITY METHODS







/**
 * Takes a csv file and adds to the database.
 * fast aware method
 *
 * NOT YET IMPLEMENTED - Shell function only that will never call the callback
 *
 * @param {string} csvdata - The CSV text to ingest
 * @param {string} docid_opt - The optional URI of the document to store
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.ingestcsv = function(csvdata,docid_opt,callback_opt) {

};

/**
 * Inserts many JSON documents. FAST aware, TRANSACTION aware.
 *
 * @param {Array} doc_array - The array of document data to store. {@see mljs.prototype.save} for valid values
 * @param {Array} uri_array_opt - The optional array of URIs to store the documents as. Will generate if not provided
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.saveAll = function(doc_array,uri_array_opt,callback_opt) {
  if (callback_opt == undefined && typeof(uri_array_opt)==='function') {
    callback_opt = uri_array_opt;
    uri_array_opt = undefined;
  }
  if (undefined == uri_array_opt) {
    uri_array_opt = new Array();
    for (var i = 0;i < doc_array.length;i++) {
      uri_array_opt[i] = this.__genid();
    }
  }

  // TODO make fast aware
  var error = null;
  for (var i = 0;null == error && i < doc_array.length;i++) {
    this.save(doc_array[i],uri_array_opt[i],function(result) {
      if (result.inError) {
        error = result;
      }
    });
  }
  if (null == error) {
    (callback_opt||noop)({inError: false,docuris: uri_array_opt});
  } else {
    (callback_opt||noop)(error);
  }
};

var rv = function(totalruns,maxrunning,start_func,finish_func,complete_func) {
  this.running = 0;
  this.runnercount = 0;
  this.cancelled = false;
  this.maxrunning = maxrunning;
  this.sf = start_func;
  this.ff = finish_func;
  this.cf = complete_func;
  this.totalruns = totalruns;
};

rv.prototype.run = function() {
  this.cancelled = false;
  for (var i = 0;i < this.maxrunning;i++) {
    this._start();
  }
};

rv.prototype.cancel = function() {
  this.cancelled = true;
}

rv.prototype._start = function() {
  this.running++;
  var that = this;
  var mc = this.runnercount++;
  this.sf(mc,function(mc,result) {
    that.callback(mc,result,that);
  });
};

rv.prototype.callback = function(mc,result,that) {
  that.running--;
  that.ff(mc,result);
  if (that.runnercount == that.totalruns) {
    that.cf();
    that.runnercount++; // should never happen, but just ensuring an infinite loop does not happen if this is coded wrong somewhere
  } else if (!that.cancelled && that.running < that.maxrunning && that.runnercount < that.totalruns) {
    that._start();
  }
};

/**
 * Alternative saveAll function that throttles invoking MarkLogic to a maximum number of simultaneous 'parallel' requests. (JavaScript is never truly parallel)
 *
 * NB Uses an internal rv class defined in the mljs.js file.
 *
 * @param {Array} doc_array - The array of document data to store. {@see mljs.prototype.save} for valid values
 * @param {Array} uri_array_opt - The optional array of URIs to store the documents as. Will generate if not provided
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.saveAll2 = function(doc_array,uri_array_opt,callback_opt) {
  if (callback_opt == undefined && typeof(uri_array_opt)==='function') {
    callback_opt = uri_array_opt;
    uri_array_opt = undefined;
  }
  if (undefined == uri_array_opt) {
    uri_array_opt = new Array();
    for (var i = 0;i < doc_array.length;i++) {
      uri_array_opt[i] = this.__genid();
    }
  }

  // TODO make fast aware
  var error = null;
  //for (var i = 0;null == error && i < doc_array.length;i++) {
  var that = this;
  var start_func = function(mc,callback) {
    that.save(doc_array[mc],uri_array_opt[mc],callback);
  };
  var finish_func = function(result) {
    if (result.inError) {
      error = result;
    }
  };

  var complete_func = function() {
    if (null == error) {
      (callback_opt||noop)({inError: false,docuris: uri_array_opt});
    } else {
      (callback_opt||noop)(error);
    }
  };

  var myrv = new rv(doc_array.length,this.dboptions.fastparts,start_func,finish_func,complete_func);
  myrv.run();

};




// REST API EXTENSIONS



// START EXTENSION
/**
 * REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name,
 * and subscribe to alerts from them. Alerts sent to a given URL.
 *
 * Save a query as an XML document using the default search grammar (see search:search) with a given name
 *
 * @param {string} searchname - The name of the search
 * @param {boolean} shared - If false, the current user's username is prepended to the search name with a hyphen
 * @param {string} query - The search:search compatible query using the default grammar to use for the search
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.saveBasicSearch = function(searchname,shared,query,callback_opt) {
  this._doSaveBasicSearch(searchname,shared,query,"search",null,callback_opt);
};

mljs.prototype._doSaveBasicSearch = function(searchname,shared,query,createmode,notificationurl,callback_opt) {
  var url = "/v1/resources/subscribe?format=json&searchname=" + encodeURI(searchname) +
    "&create=" + encodeURI(createmode) + "&shared=" + encodeURI(shared) + "&query=" + encodeURI(query) + "&querytype=basic";
  if ("both" == createmode) {
    url += "&notificationurl=" + encodeURI(notificationurl);
  }
  var doc = {
    notificationurl: notificationurl,format:"json",searchname: searchname,create: createmode,shared:shared,query:query,
    querytype: "basic"
  };

  var options = {
    path: url,
    method: "PUT",
    contentType: "application/json"
  };
  this.__doreq("SAVEBASICSEARCH",options,doc,callback_opt);
};

/**
 * REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name,
 * and subscribe to alerts from them. Alerts sent to a given URL.
 *
 * Save a query that matches documents created within a collection, with a given name
 *
 * @param {string} searchname - The name of the search
 * @param {boolean} shared - If false, the current user's username is prepended to the search name with a hyphen
 * @param {string} collection - The collection to restrict search results to
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.saveCollectionSearch = function(searchname,shared,collection,callback_opt) {
  this._doSaveCollectionSearch(searchname,shared,collection,"search",null,callback_opt);
};

mljs.prototype._doSaveCollectionSearch = function(searchname,shared,collection,createmode,notificationurl,callback_opt) {
  var url = "/v1/resources/subscribe?format=json&searchname=" + encodeURI(searchname) +
    "&create=" + encodeURI(createmode) + "&shared=" + encodeURI(shared) + "&collection=" + encodeURI(collection) + "&querytype=collection";
  if ("both" == createmode) {
    url += "&notificationurl=" + encodeURI(notificationurl);
  }
  var doc = {
    notificationurl: notificationurl,format:"json",searchname: searchname,create: createmode,shared:shared,
    querytype: "collection",collection:collection
  };

  var options = {
    path: url,
    method: "PUT",
    contentType: "application/json"
  };
  this.__doreq("SAVECOLLECTIONSEARCH",options,doc,callback_opt);
};

/**
 * REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and
 * subscribe to alerts from them. Alerts sent to a given URL.
 *
 * Save a geospatial search based on a point and radius from it, with a given name</p><p>
 * TODO check if we need to include an alert module name in the options
 *
 * @param {string} searchname - The name of the search
 * @param {boolean} shared - If false, the current user's username is prepended to the search name with a hyphen
 * @param {JSON} conSpec - The constraint specification JSON. E.g. {type: "element",ns: "",element: "location"}
 * @param {decimal} latitude - The WGS84 latitude for the centre of the radius search
 * @param {decimal} longitude - The WGS84 longitude for the centre of the radius search
 * @param {decimal} radius - The radius in statue (nor nautical) miles
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.saveGeoNearSearch = function(searchname,shared,conSpec,latitude,longitude,radiusmiles,callback_opt) {
  this._doSaveGeoNearSearch(searchname,shared,conSpec,latitude,longitude,radiusmiles,"search",null,callback_opt);
};

mljs.prototype._doSaveGeoNearSearch = function(searchname,shared,conSpec,latitude,longitude,radiusmiles,createmode,notificationurl,callback_opt) {
  var url = "/v1/resources/subscribe?format=json&searchname=" + encodeURI(searchname) +
    "&create=" + encodeURI(createmode) + "&shared=" + encodeURI(shared) + "&lat=" + encodeURI(latitude)  +
    "&lon=" + encodeURI(longitude)  + "&radiusmiles=" + encodeURI(radiusmiles) + "&querytype=geonear";
  if ("both" == createmode) {
    url += "&notificationurl=" + encodeURI(notificationurl);
  }
  var doc = {
    notificationurl: notificationurl,format:"json",searchname: searchname,create: createmode,shared:shared,
    querytype: "geonear",lat:latitude,lon:longitude,radiusmiles:radiusmiles, constraint: conSpec
  };

  var options = {
    path: url,
    method: "PUT",
    contentType: "application/json"
  };
  this.__doreq("SAVEGEONEARSEARCH",options,doc,callback_opt);
};

/**
 * REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and
 * subscribe to alerts from them. Alerts sent to a given URL.
 *
 * Save an arbitrary search (any cts:query) already stored in the database, with a given name. Enables easy referencing and activation of alerts on this search.
 *
 * @param {string} searchname - The name of the search
 * @param {boolean} shared - If false, the current user's username is prepended to the search name with a hyphen
 * @param {string} searchdocuri - The URI to copy the search document from
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.saveExistingSearch = function(searchname,shared,searchdocuri,callback_opt) {
  this._doSaveExistingSearch(searchname,shared,searchdocuri,"search",null,callback_opt)
};

mljs.prototype._doSaveExistingSearch = function(searchname,shared,searchdocuri,createmode,notificationurl,callback_opt) {
  var url = "/v1/resources/subscribe?notificationurl=" + encodeURI(notificationurl) + "&format=json&searchname=" + encodeURI(searchname) +
    "&create=" + encodeURI(createmode) + "&shared=" + encodeURI(shared) + "&searchdocuri=" + encodeURI(searchdocuri) + "&querytype=uri";
  if ("both" == createmode) {
    url += "&notificationurl=" + encodeURI(notificationurl);
  }
  var doc = {
    notificationurl: notificationurl,format:"json",searchname: searchname,create: createmode,shared:shared,
    querytype: "uri",searchdocuri:searchdocuri
  };

  var options = {
    path: url,
    method: "PUT",
    contentType: "application/json"
  };
  this.__doreq("SAVEEXISTINGSEARCH",options,doc,callback_opt);
};

/*
 * TODO create-and-subscribe methods, subscribe to uri method
 */

/**
 * REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and
 * subscribe to alerts from them. Alerts sent to a given URL.
 *
 * Uses Adam Fowler's (me!) REST API extension for subscribing to searches. RESTful HTTP calls are sent with the new information to the specified url.
 *
 * @param {string} notificationurl - The RESTful URL to invoke with a PUT to send the matching document to
 * @param {string} searchname - The name of the search
 * @param {object} detail - The extra details to pass to the alert handler
 * @param {string} contenttype - Either json (default) or xml. If JSON, uses a basic V6 JSON configuration to convert all documents to.
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.subscribe = function(notificationurl,searchname,detail,contenttype,callback_opt) {
  var url = "/v1/resources/subscribe?notificationurl=" + encodeURI(notificationurl) + "&format=json&searchname=" + encodeURI(searchname) +
    "&detail=" + encodeURI(detail) + "&contenttype=" + encodeURI(contenttype);

  var options = {
    path: url,
    method: "POST",
    contentType: "application/json"
  };
  this.__doreq("SUBSCRIBE",options,null,callback_opt);
};

/**
 * REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and
 * subscribe to alerts from them. Alerts sent to a given URL.
 *
 * Unsubscribe a notificationurl from a named search. Uses Adam Fowler's (me!) REST API extension.
 *
 * @param {string} notificationurl - The RESTful URL to invoke with a PUT to send the matching document to
 * @param {string} searchname - The name of the search
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.unsubscribe = function(notificationurl,searchname,callback_opt) {
  var url = "/v1/resources/subscribe?notificationurl=" + encodeURI(notificationurl) + "&format=json&searchname=" + encodeURI(searchname) + "&delete=search";

  var options = {
    path: url,
    method: "DELETE"
  };
  this.__doreq("UNSUBSCRIBE",options,null,callback_opt);
};

/**
 * REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and
 * subscribe to alerts from them. Alerts sent to a given URL.
 *
 * Unsubscribe from an alert and delete the underlying saved search. Convenience method.
 *
 * @param {string} notificationurl - The RESTful URL to invoke with a PUT to send the matching document to
 * @param {string} searchname - The name of the search
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.unsubscribeAndDelete = function(notificationurl,searchname,callback_opt) {
  var url = "/v1/resources/subscribe?notificationurl=" + encodeURI(notificationurl) + "&format=json&searchname=" + encodeURI(searchname) + "&delete=both";

  var options = {
    path: url,
    method: "DELETE"
  };
  this.__doreq("UNSUBSCRIBE",options,null,callback_opt);
};

/**
 * REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and
 * subscribe to alerts from them. Alerts sent to a given URL.
 *
 * Delete the saved search. Assumes already unsubscribed from alerts used by it. (If not, alerts will still fire!)
 *
 * @param {string} searchname - The name of the search
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.deleteSavedSearch = function(searchname,callback_opt) {
  var url = "/v1/resources/subscribe?format=json&searchname=" + encodeURI(searchname) + "&delete=search";

  var options = {
    path: url,
    method: "DELETE"
  };
  this.__doreq("DELETESAVEDSEARCH",options,null,callback_opt);
};

// END EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and subscribe to alerts from them. Alerts sent to a given URL.


/**
 * REQUIRES CUSTOM REST API EXTENSION - whoami.xqy - Adam Fowler adam.fowler@marklogic.com - Fetches information on the name and roles of the
 * currently logged in client api user.
 *
 * Fetches information about the user behind the current session.
 *
 * Useful is your webapp performs the login so your javascript doesn't know your username. Also looks up roles.
 *
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.whoami = function(callback) {
  var options = {
    path: "/v1/resources/whoami",
    method: "GET"
  };
  this.__doreq("WHOAMI",options,null,callback);
};

/**
 * REQUIRES CUSTOM REST API EXTENSION - dls.xqy - Adam Fowler adam.fowler@marklogic.com - Declares documents as members of a DLS collection, and enables DLS management
 *
 * @param {string|Array} uri_or_uris - Documents to declare as records
 * @param {string} collection - New DLS collection to add documents to
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.dlsdeclare = function(uri_or_uris,collection,callback) {
  /*
  var path = "/v1/resources/dls?rs:collection=" + encodeURI("/records/" + decname) + "&rs:uri=";
  var dlsoptions = {
        path: path + encodeURI(lastResults.results[i].uri),
        method: "PUT"
      };
      this.__doreq("DLSDECLARE",dlsoptions,null,function(result) {
        if (result.inError) {
          console.log("ERROR: " + JSON.stringify(result.details));
        } else {
          declCount++;
        }
        if (declCount == total) {
          done();
        }
      });
      */
       // TODO FIX THIS MESS
};

/**
 * REQUIRES CUSTOM REST API EXTENSION - dls.xqy - Adam Fowler adam.fowler@marklogic.com - Lists all DLS collections
 *
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.dlscollections = function(callback) {
  var options = {
    path: "/v1/resources/dls",
    method: "GET"
  };
  this.__doreq("DLSCOLLECTIONS",options,null,callback);
};


/**
 * REQUIRES CUSTOM REST API EXTENSION - dls.xqy - Adam Fowler adam.fowler@marklogic.com - Fetching documents within specified DLS collection
 *
 * @param {string} collection - DLS collection to list documents who are members of
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.dlscollection = function(collection,callback) {
  var options = {
    path: "/v1/resources/dls?rs:collection=" + encodeURI(collection),
    method: "GET"
  };
  this.__doreq("DLSCOLLECTION",options,null,callback);
};


/**
 * REQUIRES CUSTOM REST API EXTENSION - dlsrules.xqy - Adam Fowler adam.fowler@marklogic.com - Lists all DLS retention rules
 *
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.dlsrules = function(callback) {
  var options = {
    path: "/v1/resources/dlsrules",
    method: "GET"
  };
  this.__doreq("DLSRULES",options,null,callback);
};


/**
 * REQUIRES CUSTOM REST API EXTENSION - dlsrules.xqy - Adam Fowler adam.fowler@marklogic.com - Fetches DLS retention rule
 *
 * @param {string} name - Name of the Rule to fetch configuration of
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.dlsrule = function(name,callback) {
  var options = {
    path: "/v1/resources/dlsrules?rs:rulename=" + encodeURI(name),
    method: "GET"
  };
  this.__doreq("DLSRULE",options,null,callback);
};


/**
 * Requires custom rest API Extension version.xqy - Adam Fowler adam.fowler@marklogic.com - Fetches output of xdmp:version(). E.g. 7.0-1
 *
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.version = function(callback) {
  /*
  var options = {
    path: "/v1/resources/version",
    method: "GET",
    headers: {Accept: "application/json"}
  };
  var that = this;
  this.__doreq("VERSION",options,null,function(result){
    if (!result.inError) {
      that._version = result.doc.version;
    } else {
      that._version = false; // indicates error
    }
    callback(result);
  });*/
  var options = {
    path: "/v1/graphs", method: "HEAD"
  };
  var that = this;
  this.__doreq("VERSION",options,null,function(result){
    if (!result.inError) {
      that._version = "7.0-1";
    } else {
      that._version = false; // indicates error
    }
    callback(result);
  });
};

/**
 * Returns the current version string (E.g. 7.0-1) or null if version() has not yet been called.
 */
mljs.prototype.getVersion = function() {
  return this._version;
};


/**
 * REQUIRES CURSTOM REST API EXTENSION - rdb2rdf.xqy - Adam Fowler adam.fowler@marklogic.com - List DB schema attached to an MLSAM URL endpoint.
 *
 * @param {string} samurl - The endpoint URL of the installed SAM service (uses a JDBC connection)
 * @param {function} callback - The callback function
 */
mljs.prototype.samListSchema = function(samurl,callback) {
  var options = {
    path: "/v1/resources/rdb2rdf?rs:samurl=" + encodeURI(samurl),
    method: "GET",
    headers: { Accept: "application/json"}
  };
  this.__doreq("SAMLISTSCHEMA",options,null,callback);
};


/**
 * REQUIRES CURSTOM REST API EXTENSION - rdb2rdf.xqy - Adam Fowler adam.fowler@marklogic.com - Describe tables and
 * relationships in the prescribed schema attached to an MLSAM URL endpoint.
 *
 * NB This method relies on ANSI DESCRIBE, COUNT and Information Schema support
 *
 * @param {string} samurl - The endpoint URL of the installed SAM service (uses a JDBC connection)
 * @param {string} schema - The database schema name.
 * @param {function} callback - The callback function
 */
mljs.prototype.samSchemaInfo = function(samurl,schema,callback) {
  var options = {
    path: "/v1/resources/rdb2rdf?rs:samurl=" + encodeURI(samurl) + "&rs:schema=" + encodeURI(schema),
    method: "GET",
    headers: { Accept: "application/json"}
  };
  this.__doreq("SAMSCHEMAINFO",options,null,callback);
};

/**
 * REQUIRES CURSTOM REST API EXTENSION - rdb2rdf.xqy - Adam Fowler adam.fowler@marklogic.com - Ingests an RDBMS schema
 * subset (limited rows per table) in to the MarkLogic Triplestore using W3C RDB2RDF direct mapping.
 *
 * NB This method relies on ANSI DESCRIBE, COUNT and Information Schema support
 *
 * @param {JSON} config - The JSON configuration of the database segment to ingest
{ingest: {
  database: {
    samurl: "http://kojak.demo.marklogic.com:8080/mlsam/mlsql",
    schema: "test2"
  },
  create: {
    graph: "mynamedgraph"
  },
  selection: {
    mode: "data",
    table: ["customers"], offset: 0, limit: 100, column: ["col1","col2"]
  }
}
}
 * @param {function} callback - The callback function
 */
mljs.prototype.samRdb2Rdf = function(config,callback) {
  var options = {
    path: "/v1/resources/rdb2rdf",
    method: "POST",
    headers: { Accept: "application/json"}
  };
  this.__doreq("SAMRDB2RDF",options,config,callback);
};


mljs.prototype.saveWorkplace = function(workplaceXml,callback) {
  var options = {
    path: "/v1/resources/workplace",
    method: "POST",
    contentType: "text/xml"
  };
  //console.log("CONTENT: " + workplaceXml);
  this.__doreq("SAVEWORKPLACE",options,workplaceXml,callback);
};

mljs.prototype.workplace = function(callback) {
  var options = {
    path: "/v1/resources/workplace",
    method: "GET",
    headers: { Accept: "application/xml"}
  };
  this.__doreq("GETWORKPLACE",options,null,callback);
};



mljs.prototype.installTrigger = function(triggerJson,callback) {
  var options = {
    path: "/v1/resources/triggers",
    method: "PUT",
    contentType: "application/json"
  };
  this.__doreq("INSTALLTRIGGER",options,triggerJson,callback);
};

mljs.prototype.removeTrigger = function(triggerName,triggerDatabase,callback) {
  /*var doc = {
    triggername: triggerName, triggersdatabase: triggerDatabase
  }
  this.logger.debug("DOC: " + JSON.stringify(doc));
  */
  var options = {
    path: "/v1/resources/triggers?rs:triggername=" + encodeURI(triggerName) + "&rs:triggersdatabase=" + encodeURI(triggerDatabase),
    method: "DELETE"/*,
    contentType: "application/json"*/
  };
  this.__doreq("REMOVETRIGGER",options,null,callback);
};


mljs.prototype.installExtension = function(name,methodArray,moduleContent,callback) {
  var options = {
    path: "/v1/config/resources/" + name,
    method: "PUT",
    contentType: "application/xquery"
  };
  for (var m = 0,maxm = methodArray.length,method;m < maxm;m++) {
    method = methodArray[m];
    if (0 == m) {
      options.path += "?"
    } else {
      options.path += "&"
    }
    options.path += "method=" + method;
  }
  this.__doreq("INSTALLEXTENSION",options,moduleContent,callback);
};

mljs.prototype.removeExtension = function(name,callback) {
  var options = {
    path: "/v1/config/resources/" + name,
    method: "DELETE"
  };
  this.__doreq("REMOVEEXTENSION",options,null,callback);
};


// Packaging API in V7

mljs.prototype.getDatabasePackage = function(database,callback) {
  var options = {
    host: this.dboptions.host,
    port: this.dboptions.adminport,
    path: "/manage/v2/databases/" + encodeURI(database) + "?view=package",
    method: "GET",
    headers: {"Accept": "application/xml"}
  };
  this.__doreq("GETDATABASECONFIGURATION",options,null,callback);
};

mljs.prototype.createPackageFromZip = function(pkgname,pkg,callback) {
  var options = {
    host: this.dboptions.host,
    port: this.dboptions.adminport,
    "path": "/manage/v2/packages?pkgname=" + encodeURI(pkgname) + "&format=json",
    "method": "POST",
    contentType: "application/zip"
  };
  this.__doreq("CREATEPACKAGEFORMZIP",options,pkg,function(result) {
    // new package ID in content (plain text) of response
    result.docuri = result.doc;
    callback(result);
  }); // Note returns Location as result.docuri
};

mljs.prototype.createPackage = function(pkgname,pkgdoc,callback) {
  var options = {
    host: this.dboptions.host,
    port: this.dboptions.adminport,
    "path": "/manage/v2/packages?pkgname=" + encodeURI(pkgname),
    "method": "POST",
    contentType: "application/xml"
  };
  this.__doreq("CREATEPACKAGE",options,pkgdoc,function(result) {
    // new package ID in content (plain text) of response
    result.docuri = result.doc;
    callback(result);
  }); // Note returns Location as result.docuri
};

mljs.prototype.deletePackage = function(pkgname, callback) {
  var options = {
    host: this.dboptions.host,
    port: this.dboptions.adminport,
    "path": "/manage/v2/packages/" + encodeURI(pkgname),
    "method": "DELETE"
  };
  this.__doreq("DELETEPACKAGE",options,null,callback);
};

mljs.prototype.addDatabaseToPackage = function(pkgname,dbname,pkgdoc,callback) {
  var options = {
    host: this.dboptions.host,
    port: this.dboptions.adminport,
    "path": "/manage/v2/packages/" + encodeURI(pkgname) + "/databases/" + encodeURI(dbname),
    "method": "POST",
    contentType: "application/xml"
  };
  this.__doreq("ADDDATABASETOPACKAGE",options,pkgdoc,callback);
};

mljs.prototype.createPackageFromDocument = function(pkgname,pkgdoc,callback) {
  var options = {
    host: this.dboptions.host,
    port: this.dboptions.adminport,
    "path": "/manage/v2/packages/" + encodeURI(pkgname),
    "method": "POST"
    // contentType sniffed from package (JSON or XML only)
  };
  this.__doreq("CREATEPACKAGEFROMDOCUMENT",options,pkgdoc,function(result) { // TODO replace with correct way to add a database to a package (AND rename database!!!)
    // new package ID in content (plain text) of response
    result.docuri = result.doc;
    callback(result);
  }); // Note returns Location as result.docuri
};

mljs.prototype.downloadPackage = function(pkgname,callback) {
  var options = {
    host: this.dboptions.host,
    port: this.dboptions.adminport,
    path: "/manage/v2/packages/" + encodeURI(pkgname) + "?view=package",
    method: "GET",
    headers: {"Accept": "application/zip"}
  };
  this.__doreq("DOWNLOADPACKAGE",options,null,callback);
};

mljs.prototype.installPackage = function(pkgname,callback) {
  var options = {
    host: this.dboptions.host,
    port: this.dboptions.adminport,
    path: "/manage/v2/packages/" + encodeURI(pkgname) + "/install",
    method: "POST"
  };
  this.__doreq("INSTALLPACKAGE",options,null,function(result) {
    // new package ID in content (plain text) of response
    result.docuri = result.doc;
    callback(result);
  });
};

mljs.prototype.installPackageProgress = function(pkguri,callback) {
  // pkguri could be a /uri or a ticket id
  var uri = pkguri;
  if ("/" != pkguri.substring(0,1)) {
    uri = "/manage/v2/tickets/" + pkguri; // should this be /transactions instead???
  }
  var options = {
    host: this.dboptions.host,
    port: this.dboptions.adminport,
    path: uri,
    method: "GET",
    headers: {Accept: "application/json"}
  };
  this.__doreq("INSTALLPACKAGEPROGRESS",options,null,callback);
};

// TODO forests, servers as a minimum

// TODO perhaps complex helper functions for a DB's security database dependent settings, triggers, CPF config, etc.





// Object creation and linking helpers (akin to Factory pattern)

/**
 * Factory pattern. Creates an options object referring back to the current database connection. Useful to link to the correct logger, and db settings.
 */
mljs.prototype.createOptions = function(name,callback) {
  var obj = new this.options(name,callback);
  obj.db = this;
  return obj;
};

/**
 * Factory pattern. Creates an options object referring back to the current database connection. Useful to link to the correct logger, and db settings.
 */
mljs.prototype.createQuery = function() {
  var obj = new this.query();
  obj.db = this;
  return obj;
};

/**
 * Links context instance to current DB (MLJS) connection instance.
 * Replaces all create<name>Context() functions
 */
mljs.prototype.linkContext = function(contextInstance) {
  contextInstance.db = this;
  return contextInstance;
};


/**
 * Factory pattern. Creates a content search context object referring back to the current database connection. Useful to link to the correct logger, and db settings.
 * @deprecated Instantiate externally (See Workplace Context) then call linkContext(contextInstance).
 */
mljs.prototype.createSearchContext = function() {
  var obj = new this.searchcontext();
  obj.db = this;
  return obj;
};


/**
 * Factory pattern. Creates a geo (locale) context object referring back to the current database connection. Useful to link to the correct logger, and db settings.
 * @deprecated Instantiate externally (See Workplace Context) then call linkContext(contextInstance).
 */
mljs.prototype.createGeoContext = function() {
  var obj = new this.geocontext();
  obj.db = this;
  return obj;
};


/**
 * Factory pattern. Creates an alert context object referring back to the current database connection. Useful to link to the correct logger, and db settings.
 * @deprecated Instantiate externally (See Workplace Context) then call linkContext(contextInstance).
 */
mljs.prototype.createAlertContext = function() {
  var obj = new this.alertcontext();
  obj.db = this;
  return obj;
};


/**
 * Factory pattern. Creates a content search context object referring back to the current database connection. Useful to link to the correct logger, and db settings.
 * @deprecated Instantiate externally (See Workplace Context) then call linkContext(contextInstance).
 */
mljs.prototype.createDocumentContext = function() {
  var obj = new this.documentcontext();
  obj.db = this;
  return obj;
};


/**
 * Factory pattern. Creates a semantic config object referring back to the current database connection. Useful to link to the correct logger, and db settings.
 * @deprecated Instantiate externally (See Workplace Context) then call linkContext(contextInstance) for semantic context, which has an instance of this.
 */
mljs.prototype.createTripleConfig = function() {
  var obj = new com.marklogic.semantic.tripleconfig();
  obj.db = this;
  return obj;
};


/**
 * Factory pattern. Creates a semantic context object referring back to the current database connection. Useful to link to the correct logger, and db settings.
 * @deprecated Instantiate externally (See Workplace Context) then call linkContext(contextInstance).
 */
mljs.prototype.createSemanticContext = function() {
  var obj = new this.semanticcontext();
  obj.db = this;
  return obj;
};


/**
 * Factory pattern. Creates a data context object referring back to the current database connection. Useful to link to the correct logger, and db settings.
 * @deprecated Instantiate externally (See Workplace Context) then call linkContext(contextInstance).
 */
mljs.prototype.createDataContext = function() {
  var obj = new this.datacontext();
  obj.db = this;
  return obj;
};




/**
 * Factory pattern. Creates a session context object referring back to the current database connection. Useful to link to the correct logger, and db settings.
 * @deprecated Instantiate externally (See Workplace Context) then call linkContext(contextInstance).
 */
mljs.prototype.createSessionContext = function() {
  var obj = new this.sessioncontext();
  obj.db = this;
  return obj;
};










// Search Options management

/**
 * Creates a new search options builder connected to this client database connection mljs instance. Each function returns a
 * reference to the option builder object to support chaining.
 *
 * @constructor
 * @deprecated Use var db = new mljs(); db.createOptions(); instead
 */
mljs.prototype.options = function() {
  this.options = {};
  this.options["concurrency-level"] = undefined;
  this.options.debug = false;
  this.options["extract-metadata"] = undefined; //extract-metadata
  this.options.forest = undefined; // unsigned long,
  this.options["fragment-scope"] = undefined; //string,
  this.options["searchable-expression"] = undefined; // { path-expression }
  this.options.term = undefined; // term-definition,
  this.options.tuples = undefined; // values-or-tuples,
  this.options.values = undefined; // values-or-tuples

  this.JSON = "http://marklogic.com/xdmp/json/basic";

  // general defaults
  this.defaults = {};
  this.defaults.datatype = "xs:string";
  this.defaults.collation = "http://marklogic.com/collation/";
  this.defaults.namespace = "http://marklogic.com/xdmp/json/basic";
  this.defaults.sortDirection = "ascending";
  this.defaults.facetOption = undefined; // limit=10

  // display text for where ML doesn't yet store annotations
  this.text = {};
  this.text.facets = {};
  // this.text.facets[facetname][facetvalue] => "Display String"
};

/**
 * Sets the matrix of facet values. Useful to translate codes on the fly to human readable values in facets.
 * This lives in the options object as a convenience for objects to populate strings and retrieve displayable values.
 * This is NOT a feature of the core REST API exposed in the Options object, but a convenience built over them.
 *
 * @param {string} facetname - The name of the facet (same as the constraint name by default) these values apply to
 * @param {json} valuehash - A JSON object with raw facet values as keys, and translated (for display) values as values - { "SOME/value": "Some value", ... }
 */
mljs.prototype.options.prototype.setFacetValueStrings = function(facetname,valuehash) {
  this.text.facets[facetname] = valuehash;
};

/**
 * Returns the translated value for a given facet raw value.
 *
 * @param {string} facetname - The name of the facet (same as the constraint name by default)
 * @param {string} facetvalue - The raw facet value returned by MarkLogic
 */
mljs.prototype.options.prototype.getFacetValueString = function(facetname,facetvalue) {
  //this.__d("options.getFacetValueString: name: " + facetname + ", value: " + facetvalue);
  var fvs = this.text.facets[facetname];
  if (undefined != fvs) {
    //this.__d("options.getFacetValueString: Got facet values object for: " + facetname);
    var val = fvs[facetvalue];
    //this.__d("options.getFacetValueString: Got facet translated value: " + val);
    return val;
  } else {
    //this.__d("options.getFacetValueString: NOT got facet values object for: " + facetname);
    return null;
  }
};

mljs.prototype.options.prototype._includeSearchDefaults = function() {
  // called by any functions that specify search features
  if (undefined == this.options["page-length"] || undefined == this.options.constraint) { // means none of these are defined
    if (undefined == this.options["transform-results"] || undefined == this.options["transform-results"].apply) {
      this.options["transform-results"] = {apply: "raw"}; // transform-results,
    }
    this.options.constraint = new Array(); // [constraint]
    this.options["default-suggestion-source"] = new Array(); // [suggestion-source]
    this.options["additional-query"] = new Array(); // [string]
    this.options.grammar = undefined; //grammar,
    this.options.operator = new Array(); // [ operator ],
    this.options["page-length"] = 10; //unsigned long,
    this.options["quality-weight"] = undefined;// double,
    //this.options["return-aggregates"] = false; // boolean,
    //this.options["return-constraints"] = false;// boolean,
    //this.options["return-facets"] = true; // boolean,
    //this.options["return-frequencies"] = false; // boolean,
    this.options["return-metrics"] = true; // boolean,
    //this.options["return-plan"] = false; // boolean,
    this.options["return-qtext"] = true; // boolean
    this.options["return-query"] = false; // boolean,
    this.options["return-results"] = true; // boolean,
    this.options["return-similar"] = false; // boolean,
    //this.options["return-values"] = false; // boolean,
    this.options["search-option"] = new Array(); // [ string ],
    this.options["sort-order"] = new Array(); // [ sort-order ],
    this.options["suggestion-source"] = new Array(); //[ suggestion-source ],

    this._buckets = {}; // has to be done like this due to multiple function levels - { constraint_name: [{_list = [{ge,lt,name,label}, ... ], ...}], ... }
    this._computedBuckets = {}; // has to be done like this due to multiple function levels - { constraint_name: [{_list = [{ge,lt,anchor,name,label}, ... ], ...}], ... }

    // defaults
    this.sortOrderScore();
  }
};

/**
 * Finds a constraint using its name
 * @private
 */
mljs.prototype.options.prototype._findConstraint = function(cname) {
  var con = null;
  this.__d("checking " + this.options.constraint.length + " constraints");
  for (var i = 0, max = this.options.constraint.length, c;i < max;i++) {
    c = this.options.constraint[i];
    this.__d("Checking constraint with name: " + c.name);

    if (c.name == cname) {
      this.__d("Name matches: " + cname + "!!!");
      return c;
    }
  }

  return null;
};

/**
 * Returns the JSON search options object needed by the REST API and generated by this class
 */
mljs.prototype.options.prototype.toJson = function() {
  // set empty arrays to undefined
  //  if (undefined != this.options[""])

  for (var cname in this._buckets) {
    var buckets = this._buckets[cname]; // returns JSON object with _list and bucket: function() members
    var constraint = this._findConstraint(cname);
    var nb = [];
    for (var i = 0,max = buckets._list.length,bucket;i < max;i++) {
      bucket = buckets._list[i];
      nb[i] = bucket;
    }
    constraint.range.bucket = nb; // TODO verify this cannot happen for other types of constraint
  }

  // TODO throw an error if computed bucket is not over a xs:dateTime constraint

  for (var cname in this._computedBuckets) {
    var buckets = this._computedBuckets[cname]; // returns JSON object with _list and bucket: function() members
    var constraint = this._findConstraint(cname);
    var nb = [];
    for (var i = 0,max = buckets._list.length,bucket;i < max;i++) {
      bucket = buckets._list[i];
      nb[i] = bucket;
    }
    constraint.range["computed-bucket"] = nb; // TODO verify this cannot happen for other types of constraint
  }

  // return options object
  return {options: this.options};
};

/**
 * Specifies the additional query to use to filter any search results
 *
 * @param {string} str - The additional query string (XML string of a CTS query) to use
 */
mljs.prototype.options.prototype.additionalQuery = function(str) {
  this._includeSearchDefaults();
  this.options["additional-query"] = str;
  return this;
};

/**
 * Sets additional query to one that ensures no DLS declared document versions are returned (except the latest version at the original URL).
 */
mljs.prototype.options.prototype.noDLSVersions = function() {
  this._includeSearchDefaults();
  // NB the registered query in the below is the dls-documents-query()
  // TODO test on other databases without changing IDs
  this.options["additional-query"] =
    "<cts:or-query xmlns:cts='http://marklogic.com/cts'><cts:not-query><cts:or-query><cts:properties-query><cts:registered-query><cts:id>17524193535823153377</cts:id></cts:registered-query></cts:properties-query>  <cts:properties-query><cts:not-query><cts:element-value-query><cts:element xmlns:dls='http://marklogic.com/xdmp/dls'>dls:annotation</cts:element></cts:element-value-query> </cts:not-query></cts:properties-query></cts:or-query></cts:not-query><cts:properties-query><cts:registered-query><cts:id>17524193535823153377</cts:id></cts:registered-query></cts:properties-query></cts:or-query>";
  return this;
};

/**
 * Specified the concurrency level option
 *
 * @param {string} level - REST API concurrency level to use
 */
mljs.prototype.options.prototype.concurrencyLevel = function(level) {
  this.options["concurrency-level"] = level;
  return this;
};

/**
 * Specified the debug level for the search
 *
 * @param {string} dbg - Search API debug level to use
 */
mljs.prototype.options.prototype.debug = function(dbg) {
  this.options.debug = dbg;
  return this;
};

/**
 * Specified the forest to search within
 *
 * @param {positiveInteger|Array} - Which forest(s) to use. (Note: MarkLogic internal IDs can overload JavaScript's numeric types so must be used with caution.)
 */
mljs.prototype.options.prototype.forest = function(forests) {
  if (Array.isArray(forests)) {
    this.options.forest = forests;
  } else {
    // assume single forest id
    this.options.forest = [forest];
  }
  return this;
};

/**
 * Specified the fragment scope
 *
 * @param {string} scope - Function scope to use
 */
mljs.prototype.options.prototype.fragmentScope = function(scope) {
  this.options["fragment-scope"] = scope;
  return this;
};

/**
 * Specified the quality weight
 *
 * @param {double} weight - Default search weight to use.
 */
mljs.prototype.options.prototype.qualityWeight = function(weight) {
  this.options["quality-weight"] = weight;
  return this;
};

/**
 * Specified whether to return aggregates
 *
 * @param {boolean} ret - Whether to return aggregate values.
 */
mljs.prototype.options.prototype.returnAggregates = function(ret) {
  if (undefined == ret) {
    ret = true;
  }
  this.options["return-aggregates"] = ret;
  return this;
};

/**
 * Specified whether to return constraints
 *
 * @param {boolean} ret - Whether to return query constraint settings in the response.
 */
mljs.prototype.options.prototype.returnConstraints = function(ret) {
  if (undefined == ret) {
    ret = true;
  }
  this.options["return-constraints"] = ret;
  return this;
};

/**
 * Specified whether to return facets
 *
 * @param {boolean} ret - Whether to return facets
 */
mljs.prototype.options.prototype.returnFacets = function(ret) {
  if (undefined == ret) {
    ret = true;
  }
  this.options["return-facets"] = ret;
  return this;
};

/**
 * Specified whether to return frequencies
 *
 * @param {boolean} ret - Whether to return Frequencies
 */
mljs.prototype.options.prototype.returnFrequencies = function(ret) {
  if (undefined == ret) {
    ret = true;
  }
  this.options["return-frequencies"] = ret;
  return this;
};

/**
 * Specified whether to return search metrics
 *
 * @param {boolean} ret - Whether to return search metrics.
 */
mljs.prototype.options.prototype.returnMetrics = function(ret) {
  if (undefined == ret) {
    ret = true;
  }
  this.options["return-metrics"] = ret;
  return this;
};

/**
 * Specifies whether to return the internal search plan generated by the search query (Useful to debug poorly performing queries)
 *
 * @param {boolean} ret - Whether to return the internal search API plan. Useful to debug search performance issues.
 */
mljs.prototype.options.prototype.returnPlan = function(ret) {
  if (undefined == ret) {
    ret = true;
  }
  this.options["return-plan"] = ret;
  return this;
};

/**
 * Specifies whether to return the query text with the search results
 *
 * @param {boolean} ret - Whether to returnthe query text with the response.
 */
mljs.prototype.options.prototype.returnQtext = function(ret) {
  if (undefined == ret) {
    ret = true;
  }
  this.options["return-qtext"] = ret;
  return this;
};

/**
 * Specifies whether to return the entire query with the search results
 *
 * @param {boolean} ret - Whether to return th query with the response.
 */
mljs.prototype.options.prototype.returnQuery = function(ret) {
  if (undefined == ret) {
    ret = true;
  }
  this.options["return-query"] = ret;
  return this;
};

/**
 * Specifies whether to return search result documents (or snippets thereof)
 *
 * @param {boolean} ret - Whether to return search results. (Useful if you're just doing a values() co-occurence or lexicon lookup)
 */
mljs.prototype.options.prototype.returnResults = function(ret) {
  if (undefined == ret) {
    ret = true;
  }
  this.options["return-results"] = ret;
  return this;
};

/**
 * Specifies whether to return cts:similar documents to those in the search results
 *
 * @param {boolean} ret - Whether to return cts:similar documents for each search match.
 */
mljs.prototype.options.prototype.returnSimilar = function(ret) {
  if (undefined == ret) {
    ret = true;
  }
  this.options["return-similar"] = ret;
  return this;
};

/**
 * Specifies whether to return values objects
 *
 * @param {boolean} ret - Whether to return values (co-occurence) matches with the response. (applies to /v1/values calls only)
 */
mljs.prototype.options.prototype.returnValues = function(ret) {
  if (undefined == ret) {
    ret = true;
  }
  this.options["return-values"] = ret;
  return this;
};

/**
 * Specifies the default collation applies to all string constraints and sorts, if not specified on constraint definition
 *
 * @param {string} col - The default collation URL spec to use
 */
mljs.prototype.options.prototype.defaultCollation = function(col) {
  this.defaults.collation = col;
  return this;
};

/**
 * Specifies the default sort order
 *
 * @param {string} sort - The default sort order. 'ascending' (default) or 'descending'.
 */
mljs.prototype.options.prototype.defaultSortOrder = function(sort) {
  this.defaults.sortDirection = sort;
  return this;
};

/**
 * Specifies the default constraint type
 *
 * @param {string} type - Sets the default type (default is xs:string)
 */
mljs.prototype.options.prototype.defaultType = function(type) {
  this.defaults.datatype = type;
  return this;
};

/**
 * Specifies the default element namespace to use
 *
 * @param {string} ns - Sets the default namespace value
 */
mljs.prototype.options.prototype.defaultNamespace = function(ns) {
  this.defaults.namespace = ns;
  return this;
};

/**
 * Adds a thesaurus constraint to these options. Uses a custom constraint.
 * NOTE: You MUST alter the custom constraint to specify your own thesaurus xml file. This should be only as large as your application requires.
 *
 * {@link https://github.com/adamfowleruk/mljs/tree/master/mldbwebtest/src/app/models/lib-thesaurus.xqy}
 *
 * @param {string} constraint_name - The name of the constraint to create
 * @param {json} additional_properties_opt - Additional rest api properties to apply to this constraint. Copied after constraint constructed. E.g. fragmentScope.
 */
mljs.prototype.options.prototype.thesaurusConstraint = function(constraint_name,annotation_opt,additional_properties_opt) {
  this.customConstraint(constraint_name || "thes","parse","http://marklogic.com/xdmp/thesaurus","/app/models/lib-thesaurus.xqy",null,null,null,null,null,null,
  annotation_opt,additional_properties_opt);
  return this;
};

/**
 * Extracts metadata from a json key value.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_41417}
 *
 * @param {string|Array} strings - Single string or string array containing json key names
 */
mljs.prototype.options.prototype.extractJsonMetadata = function(strings) {
  this.options["extract-metadata"] = this.options["extract-metadata"] || {};
  if (!Array.isArray(strings)) {
    strings = [strings];
  }
  var news = [];
  if (undefined != this.options["extract-metadata"]["json-key"]) {
    for (var i = 0;i < this.options["extract-metadata"]["json-key"].length;i++) {
      news.push(this.options["extract-metadata"]["json-key"][i]);
    }
  }
  for (var i = 0;i < strings.length;i++) {
    news.push(strings[i]);
  }
  this.options["extract-metadata"]["json-key"] = news;
  return this;
};

/**
 * Extracts metadata for a single constraint
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_41417}
 *
 * @param {string} constraint_name - The name of the constraint whose content should be extracted
 */
mljs.prototype.options.prototype.extractConstraintMetadata = function(constraint_name) {
  this.options["extract-metadata"] = this.options["extract-metadata"] || {};
  if (undefined == this.options["extract-metadata"]["constraint-value"]) {
    this.options["extract-metadata"]["constraint-value"] = [];
  }
  this.options["extract-metadata"]["constraint-value"].push({"ref": constraint_name});
  return this;
};

/**
 * Extracts metadata for a single element.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_41417}
 *
 * @param {string} elementname - Local name of the element to extract
 * @param {string} elementns - Namespace of the element to extract
 */
mljs.prototype.options.prototype.extractElementMetadata = function(elementname,elementns) {
  this.options["extract-metadata"] = this.options["extract-metadata"] || {};
  if (undefined == this.options["extract-metadata"]["qname"]) {
    this.options["extract-metadata"]["qname"] = [];
  }
  this.options["extract-metadata"]["qname"].push({"elem-ns": elementns, "elem-name": elementname});
  return this;
};


/**
 * Extracts metadata for a single element's attribrute.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_41417}
 *
 * @param {string} elementname - Local name of the element to extract
 * @param {string} elementns - Namespace of the element to extract
 * @param {string} attributename - Local name of the attribute
 * @param {string} attributens_opt - Optional namespace of the attribute to extract. Defaults if not specified to the element namespace
 */
mljs.prototype.options.prototype.extractAttributeMetadata = function(elementname,elementns,attributename,attributens_opt) {
  this.options["extract-metadata"] = this.options["extract-metadata"] || {};
  if (undefined == this.options["extract-metadata"]["qname"]) {
    this.options["extract-metadata"]["qname"] = [];
  }
  this.options["extract-metadata"]["qname"].push({"elem-ns": elementns, "elem-name": elementname, "attr-ns": attributens_opt || elementns, "attr-name": attributename});
  return this;
};

/**
 * Restricts all search parameters to the specified element.
 *
 * @deprecated See {@see #elementContainerConstraint} .
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_62771}
 *
 * @param {string} constraint_name - The name of the constraint to create
 * @param {string} elementname - The name of the element to match
 * @param {string} elementns - The namespace of the element to match
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 */
mljs.prototype.options.prototype.elementConstraint = function(constraint_name,elementname,elementns,annotation_opt) {
  this._includeSearchDefaults();
  var con = {name: constraint_name, "element": {name: elementname, ns: elementns}};
  if (undefined != annotation_opt) {
    if ("string" == typeof(annotation_opt)) {
      annotation_opt = [annotation_opt];
    }
    con.annotation = annotation_opt;
  }
  this.addConstraint(con);
  return this;
};
mljs.prototype.options.prototype.elementQuery = mljs.prototype.options.prototype.elementConstraint;

/**
 * Restricts all search parameters to the specified json key.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_62771}
 *
 * @param {string} constraint_name - The name of the constraint to create
 * @param {string} jsonkey - The name of the json property (key) to match
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 */
mljs.prototype.options.prototype.jsonContainerConstraint = function(constraint_name,jsonkey,annotation_opt) {
  this._includeSearchDefaults();
  var con = {
        "name": constraint_name,
        "container": {
          "json-key": jsonkey
        }
      };
  if (undefined != annotation_opt) {
    if ("string" == typeof(annotation_opt)) {
      annotation_opt = [annotation_opt];
    }
    con.annotation = annotation_opt;
  }
  this.addConstraint(con);
  return this;
};

/**
 * Restricts all search parameters to the specified element.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_62771}
 *
 * @param {string} constraint_name - The name of the constraint to create
 * @param {string} elementname - The name of the element to match
 * @param {string} elementns - The namespace of the element to match
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 */
mljs.prototype.options.prototype.elementContainerConstraint = function(constraint_name,elementname,elementns,annotation_opt) {
  this._includeSearchDefaults();
  var con = {
        "name": constraint_name,
        "container": {
          "element": {name: elementname, ns: elementns}
        }
      };
  if (undefined != annotation_opt) {
    if ("string" == typeof(annotation_opt)) {
      annotation_opt = [annotation_opt];
    }
    con.annotation = annotation_opt;
  }
  this.addConstraint(con);
  return this;
};



/**
 * Defines a custom constraint. To skip one of parse, start or finish, set the function parameter to null.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_87763}
 *
 * @param {string} constraint_name - The name of the constraint to create
 * @param {string} parsefunction - The function local name
 * @param {string} parsenamesapce - The namespace of the function
 * @param {string} parselibrary - The XQuery library path in the modules database for the function
 * @param {string} startfunction - The function local name
 * @param {string} startnamesapce - The namespace of the function
 * @param {string} startlibrary - The XQuery library path in the modules database for the function
 * @param {string} finishfunction - The function local name
 * @param {string} finishnamesapce - The namespace of the function
 * @param {string} finishlibrary - The XQuery library path in the modules database for the function
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 * @param {json} additional_properties_opt - Additional rest api properties to apply to this constraint. Copied after constraint constructed. E.g. fragmentScope.
 */
mljs.prototype.options.prototype.customConstraint = function(constraint_name,parsefunction,parsenamespace,parselibrary,startfunction,startnamespace,startlibrary, finishfunction,finishnamespace,finishlibrary,annotation_opt,additional_properties_opt) {
  this._includeSearchDefaults();
  var con = {name:constraint_name,
    "custom": {
    }
  };
  if (null != parsefunction) {
    con.custom.parse = {apply: parsefunction,ns:parsens,at:parselibrary};
  }
  if (null != startfunction) {
    con.custom.start = {apply: startfunction,ns:startns,at:startlibrary};
  }
  if (null != finishfunction) {
    con.custom.finish = {apply: finishfunction,ns:finishns,at:finishlibrary};
  }
  if (undefined != annotation_opt) {
    if ("string" == typeof(annotation_opt)) {
      annotation_opt = [annotation_opt];
    }
    con.annotation = annotation_opt;
  }
  // copy over additional properties
  for (var n in additional_properties_opt) {
    con["custom"][n] = additional_properties_opt[n];
  }
  this.addConstraint(con);
  this.suggest(constraint_name);
  return this;
};

/**
 * Generates a new Xpath constraint
 *
 * @param {string} constraint_name - The name of the constraint
 * @param {string} xpath - The XPath path
 * @param {json} namespaces - The {prefix: "http://name/space/", ...} JSON listing namespaces to use
 * @param {string} type_opt - The type of the XPath attribute/element pointed at. Defaults to xs:string. Must have xs: prefix.
 * @param {string} collation_opt - The collation to use (if an xs:string), defaults to the value of defaultCollation in this options builder instance
 * @param {boolean} facet_opt - Whether to use this in a facet. Defaults to true. NB CURRENTLY THE REST API DOES NOT SUPPORT XPATH FACETS
 * @param {Array} facet_options_opt - Additional string array XPath options - See {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_64714}
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 */
mljs.prototype.options.prototype.pathConstraint = function(constraint_name,xpath,namespaces,type_opt,collation_opt,facet_opt,facet_options_opt,annotation_opt) {
  var range = {name: constraint_name,
    range: {
      type: type_opt || this.defaults.datatype,
      "path-index": {
        text: xpath, namespaces : namespaces
      }
    }
  };
  if ("xs:string" == type_opt) {
    range.range.collation = collation_opt || this.defaults.collation;
  }
  if (undefined != facet_opt || undefined != facet_options_opt) {
    range.range.facet = facet_opt || true;
  }
  if (undefined != facet_options_opt) {
    range.range["facet-option"] = facet_options_opt;
  }
  if (undefined != annotation_opt) {
    if ("string" == typeof(annotation_opt)) {
      annotation_opt = [annotation_opt];
    }
    range.annotation = annotation_opt;
  }

  // Create sort orders automatically
  //this.sortOrder(this.defaultSortDirection,type_opt || this.defaults.datatype,element,collation_opt || this.defaults.collation);
  // TODO sort order - REST API V7 DOES NOT support ordering for path range indexes!!!
  // see http://docs-ea.marklogic.com/guide/rest-dev/appendixa#id_97031

  this.addConstraint(range);
  this.suggest(constraint_name);

  return this;
};
mljs.prototype.options.prototype.path = mljs.prototype.options.prototype.pathConstraint;


/**
 * Creates a new element attribute range constraint, and adds it to the search options object
 *
 * @param {string} constraint_name - Constraint name to use.
 * @param {string} elment - Element name to use
 * @param {string} namespace - Namespace to use.
 * @param {string} attr - Element attribute to use
 * @param {string} type_opt - XML Schema type. E.g. "xs:string". Optional. If not specified, default type is used.
 * @param {string} collation_opt - The optional string collation to used. If not specified, default collation is used (if of xs:string type)
 * @param {boolean} facet_opt - Whether to use this constraint as a facet
 * @param {JSON} facet_options_opt - The optional facet configuration JSON to use.
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 */
mljs.prototype.options.prototype.elemattrRangeConstraint = function(constraint_name,element,namespace,attr,type_opt,collation_opt,facet_opt,facet_options_opt,annotation_opt) {
  var range = {name: constraint_name,
    range: {
      type: type_opt || this.defaults.datatype,
      element: {
        name: element, ns : namespace || this.defaults.namespace
      },
      attribute: {
        name: attr,
        ns: namespace || this.defaults.namespace
      }
    }
  };
  if ("xs:string" == type_opt) {
    range.collation = collation_opt || this.defaults.collation;
  }
  if (undefined != facet_opt || undefined != facet_options_opt) {
    range.range.facet = true;
  }
  if (undefined != facet_options_opt) {
    range.range["facet-option"] = facet_options_opt;
  }
  if (undefined != annotation_opt) {
    if ("string" == typeof(annotation_opt)) {
      annotation_opt = [annotation_opt];
    }
    range.annotation = annotation_opt;
  }

  // Create sort orders automatically
  var elspec = {
    element: range.range.element.name, elementns: range.range.element.ns, attribute: range.range.attribute.name, attributens: range.range.attribute.ns
  }
  this.sortOrder(this.defaultSortDirection,type_opt || this.defaults.datatype,elspec,collation_opt || this.defaults.collation); // TODO verify this works with normal XML range indexes not json keys

  this.addConstraint(range);
  this.suggest(constraint_name);

  return this;
};

/**
 * Convenience method to create a range constraint for a JSON key (uses the MarkLogic basic JSON namespace)
 *
 * @param {string} name_or_key - JSON key to use
 * @param {string} type_opt - Whether to use 'json' (default) or 'xml' element matching
 * @param {string} collation_opt - The optional string collation to used. If not specified, default collation is used
 * @param {boolean} facet_opt - Include this constraint as a facet?
 * @param {JSON} facet_options_opt - The optional facet configuration JSON to use.
 * @param {string} fragmentScope_opt - The fragment to use (defaults to document)
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 */
mljs.prototype.options.prototype.jsonRangeConstraint = function(name_or_key,type_opt,collation_opt,facet_opt,facet_options_opt,fragmentScope_opt,annotation_opt) {
  if (Array.isArray(type_opt)) {
    facet_options_opt = type_opt;
    type_opt = undefined;
  } else if (Array.isArray(collation_opt)) {
    facet_options_opt = collation_opt;
    collation_opt = undefined;
  } else if (Array.isArray(facet_opt)) {
    facet_options_opt = facet_opt;
    facet_opt = undefined;
  }
  return this.rangeConstraint(name_or_key,name_or_key,"http://marklogic.com/xdmp/json/basic",type_opt || "xs:string",collation_opt, facet_opt || true, facet_options_opt,fragmentScope_opt,annotation_opt);
};

/**
 * Specifies a new range constraint, and adds it to the search options object
 *
 * @param {string} constraint_name_opt - Optional constraint name to use. Defaults to NULL
 * @param {string} name_or_key - Element name or JSON key to use
 * @param {string} ns_opt - Namespace to use. Optional. If not specified, default namespace is used. (If type is XML element)
 * @param {string} type_opt - Whether to use 'json' (default) or 'xml' element matching
 * @param {string} collation_opt - The optional string collation to used. If not specified, default collation is used
 * @param {boolean} facet_opt - Include this constraint as a facet?
 * @param {JSON} facet_options_opt - The optional facet configuration JSON to use.
 * @param {string} fragmentScope_opt - The fragment to use (defaults to document)
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 */
mljs.prototype.options.prototype.rangeConstraint = function(constraint_name_opt,name_or_key,ns_opt,type_opt,collation_opt,facet_opt,facet_options_opt,fragmentScope_opt,annotation_opt) {
  this._includeSearchDefaults();

  /*
  if (undefined == facet_options_opt) {
    if (undefined != facet_opt && Array.isArray(facet_opt)) {
      facet_options_opt = facet_opt;
      facet_opt = true;
    } else if (undefined != collation_opt && Array.isArray(collation_opt)) {
      facet_options_opt = collation_opt;
      collation_opt = undefined;
      facet_opt = true;
    } else if (undefined != typeof type_opt && Array.isArray(type_opt)) {
      facet_options_opt = type_opt;
      type_opt = undefined;
      facet_opt = true;
    } else if (undefined != typeof ns_opt && Array.isArray(ns_opt)) {
      facet_options_opt = ns_opt;
      ns_opt = undefined;
      facet_opt = true;
    }
  }
  if (undefined == facet_opt) {
    if (undefined != collation_opt && "boolean" === typeof collation_opt) {
      facet_opt = collation_opt;
      collation_opt = undefined;
    } else if (undefined !=  type_opt && "boolean" === typeof type_opt) {
      facet_opt = type_opt;
      type_opt = undefined;
    } else if (undefined !=  ns_opt && "boolean" === typeof ns_opt) {
      facet_opt = ns_opt;
      ns_opt = undefined;
    }
  }
  if (undefined ==  collation_opt) {
    if (undefined !=  type_opt && "string" === typeof type_opt && (type_opt.length < 4 || "xs:" == type_opt.substring(0,3))) { // DANGEROUS?
      collation_opt = type_opt;
      type_opt = undefined;
    } else if (undefined !=  ns_opt && "string" === typeof ns_opt && (ns_opt.length < 4 || "xs:" == ns_opt.substring(0,3))) { // DANGEROUS?
      collation_opt = ns_opt;
      ns_opt = undefined;
    }
  }
  if (undefined ==  type_opt) {
    if (undefined !=  ns_opt && "string" === typeof ns_opt && (ns_opt.length > 4 && "xs:" == ns_opt.substring(0,3))) { // DANGEROUS?
      type_opt = ns_opt;
      ns_opt = undefined;
    }
  }
  if ("string" == typeof constraint_name_opt && Array.isArray(name_or_key)) {
    facet_opt = name_or_key;
    name_or_key = constraint_name_opt;
  }*/
  if (undefined == name_or_key) {
    if (undefined !=  constraint_name_opt) {
      name_or_key = constraint_name_opt; // keep contraint name same as name or key (dont set to undefined)
    }
  }
  if (undefined == constraint_name_opt) {
    constraint_name_opt = name_or_key;
  }
  var thens = ns_opt;
  if (undefined == ns_opt) { // this allows "" blank namespace
    thens = this.defaults.namespace;
  }
  var thetype = type_opt;
  if (undefined ==  type_opt) {
    thetype = this.defaults.datatype;
  }
  // output values here
  this.__d("rangeConstraint(): cName: " + constraint_name_opt +
    ", name_or_key: " + name_or_key + ", ns_opt: " + ns_opt + ", type_opt: " + type_opt + ", collation_opt: " + collation_opt +
    ", facet_opt: " + facet_opt + ", facet_options_opt: " + facet_options_opt);
  // now use values
  var range = {name: constraint_name_opt,
    range: {
      type: thetype,
      element: {
        name: name_or_key, ns : thens // NB this means if default namespace is not json, you must specify NS for ALL json rangeConstraints to be marklogic/basic full URL spec
      }
    }
  };
  if (undefined != annotation_opt) {
    if ("string" == typeof(annotation_opt)) {
      annotation_opt = [annotation_opt];
    }
    range.annotation = annotation_opt;
  }
  if (range.range.type == "xs:string") {
    range.range.collation = collation_opt || this.defaults.collation;
  }
  if ((undefined != facet_opt && true===facet_opt) || undefined != facet_options_opt) {
    range.range.facet = true;
  } else {
    range.range.facet = false;
  }
  if (undefined != facet_options_opt) {
    range.range["facet-option"] = facet_options_opt;
  }
  if (undefined != fragmentScope_opt) {
    range.range["fragment-scope"] = fragmentScope_opt;
  }

  // Create sort orders automatically
  var elspec = name_or_key;
  if (undefined != ns_opt) {
    elspec = {
      element: range.range.element.name, elementns: range.range.element.ns
    };
  }
  this.sortOrder("ascending",type_opt || this.defaults.datatype,elspec,collation_opt || this.defaults.collation); // TODO verify this works with normal XML range indexes not json keys
  this.sortOrder("descending",type_opt || this.defaults.datatype,elspec,collation_opt || this.defaults.collation); // TODO verify this works with normal XML range indexes not json keys

  this.addConstraint(range);
  this.suggest(constraint_name_opt);

  return this;
};
mljs.prototype.options.prototype.range = mljs.prototype.options.prototype.rangeConstraint;

/**
 * Creates a new value Constraint, and adds it to the search options object
 *
 * MarkLogic does not support faceting or sorting for value constraints - add a range constraint and range index for this functionality.
 *
 * @param {string} constraint_name_opt - Optional constraint name to use. Defaults to NULL
 * @param {string} name_or_key - Element name or JSON key to use
 * @param {string} ns_opt - Namespace to use. Optional. If not specified, default namespace is used. (If type is XML element)
 * @param {string} fragmentScope_opt - The fragment to use (defaults to document)
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 */
mljs.prototype.options.prototype.valueConstraint = function(constraint_name_opt,name_or_key,ns_opt,fragmentScope_opt,annotation_opt) {
  this._includeSearchDefaults();

  if (undefined == name_or_key) {
    if (undefined !=  constraint_name_opt) {
      name_or_key = constraint_name_opt; // keep contraint name same as name or key (dont set to undefined)
    }
  }
  if (undefined == constraint_name_opt) {
    constraint_name_opt = name_or_key;
  }
  var thens = ns_opt;
  if (undefined == ns_opt) { // this allows "" blank namespace
    thens = this.defaults.namespace;
  }

  var con = {name: constraint_name_opt,
    value: {
      element: {
        name: name_or_key, ns : thens // NB this means if default namespace is not json, you must specify NS for ALL json rangeConstraints to be marklogic/basic full URL spec
      }
    }
  };
  if (undefined != annotation_opt) {
    if ("string" == typeof(annotation_opt)) {
      annotation_opt = [annotation_opt];
    }
    con.annotation = annotation_opt;
  }
  if (undefined != fragmentScope_opt) {
    con.value["fragment-scope"] = fragmentScope_opt;
  }

  // Create sort orders automatically - CAN THIS BE DONE ON VALUE CONSTRAINTS??? NO?
  /*
  var elspec = name_or_key;
  if (undefined != ns_opt) {
    elspec = {
      element: con.value.element.name, elementns: con.value.element.ns
    };
  }
  this.sortOrder("ascending",type_opt || this.defaults.datatype,elspec,collation_opt || this.defaults.collation); // TODO verify this works with normal XML range indexes not json keys
  this.sortOrder("descending",type_opt || this.defaults.datatype,elspec,collation_opt || this.defaults.collation); // TODO verify this works with normal XML range indexes not json keys
  */


  this.__d("valueConstraint(): Constraint JSON: " + JSON.stringify(con));

  this.addConstraint(con);
  //this.suggest(constraint_name_opt); // CAN THIS BE DONE WITH VALUE CONS??? NO?

  return this;
};
mljs.prototype.options.prototype.value = mljs.prototype.options.prototype.valueConstraint;

/**
 * Specifies a new field range constraint, and adds it to the search options object
 *
 * @param {string} constraint_name - Constraint name to use
 * @param {string} name - Field name to use
 * @param {string} type_opt - xs:string or similar
 * @param {string} collation_opt - The optional string collation to used. If not specified, default collation is used
 * @param {boolean} facet_opt - Use this constraint as a facet.
 * @param {JSON} facet_options_opt - The optional facet configuration JSON to use.
 * @param {string} fragmentScope_opt - The fragment to use (defaults to document)
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 */
mljs.prototype.options.prototype.fieldRangeConstraint = function(constraint_name,name,type_opt,collation_opt,facet_opt,facet_options_opt,fragmentScope_opt,annotation_opt) {
  var range = {name: constraint_name,
    range: {
      type: type_opt || this.defaults.datatype,
      field: {
        name: name
      },
      collation: collation_opt || this.defaults.collation
    }
  };
  if (undefined != annotation_opt) {
    if ("string" == typeof(annotation_opt)) {
      annotation_opt = [annotation_opt];
    }
    range.annotation = annotation_opt;
  }
  if ((undefined != facet_opt && true===facet_opt) || undefined != facet_options_opt) {
    range.range.facet = true;
  }
  if (undefined != facet_options_opt) {
    range.range["facet-option"] = facet_options_opt;
  }
  if (undefined != fragmentScope_opt) {
    range.range["fragment-scope"] = fragmentScope_opt;
  }

  // Create sort orders automatically
  var elspec = {
    field: range.range.field.name, collation: range.range.collation
  };
  this.sortOrder("ascending",type_opt || this.defaults.datatype,elspec,collation_opt || this.defaults.collation);
  this.sortOrder("descending",type_opt || this.defaults.datatype,elspec,collation_opt || this.defaults.collation);

  this.addConstraint(range);
  this.suggest(constraint_name);

  return this;
};
mljs.prototype.options.prototype.field = mljs.prototype.options.prototype.fieldRangeConstraint;

/**
 * Adds fixed buckets for the specified constraint. Returns a JSON object that has a bucket(lt,ge,name_opt,label_opt) method.
 * Used like this:-
 * ```javascript
 * var yearBuckets = ob.buckets(year);
 * yearBuckets.bucket(1920,1929,"1920s","The 1920s").bucket(...).bucket(...);
 * ```
 * Note: If you don't specify name, MLJS will create a string based on "gevalue-ltvalue".
 * If you don't specify label, it will default to the name specified or calculated by MLJS
 *
 * @param {string} constraint_name - The name of the constraint to define buckets for.
 */
mljs.prototype.options.prototype.buckets = function(constraint_name) {
  var bs = {
    _list: new Array(),
    bucket: function(ge,lt,name_opt,label_opt) {
      var b = {
        lt: lt, ge: ge
      };
      b.name = name_opt || (ge + "-" + lt);
      b.label = label_opt || b.name;
      bs._list.push(b);
      return bs;
    }
  };
  this._buckets[constraint_name] = bs;
  return bs;
};

/**
 * Add an annotation to a constraint after the constraint has been configured. Useful for lazy loading localised strings.
 *
 * @param {string} constraint_name - the name of the constraint in these options
 * @param {string|Array} annotation - the annotation string, or array of strings
 */
mljs.prototype.options.prototype.annotate = function(constraint_name,annotation) {
  if ("string" == typeof(annotation)) {
    annotation = [annotation];
  }
  this._findConstraint(constraint_name).annotation = annotation;
  return this;
};

/**
 * Adds Computed buckets for the specified constraint. Returns a JSON object that has a bucket(lt,ge,name_opt,label_opt) method.
 * Used like this:-
 * ```javascript
 * var timeBuckets = ob.buckets("updated");
 * timeBuckets.bucket("P0D","P1D","now","today","Today").bucket(...).bucket(...);
 * ```
 * Note: If you don't specify name, MLJS will create a string based on "gevalue-ltvalue".
 * If you don't specify label, it will default to the name specified or calculated by MLJS
 *
 * @param {string} constraint_name - The name of the constraint to define buckets for.
 */
mljs.prototype.options.prototype.computedBuckets = function(constraint_name) {
  var bs = {
    _list: new Array(),
    bucket: function(ge,lt,anchor,name_opt,label_opt) {
      var b = {
        lt: lt, ge: ge, anchor: anchor
      };
      b.name = name_opt || (ge + "-" + lt);
      b.label = label_opt || b.name;
      bs._list.push(b);
      return bs;
    }
  };
  this._computedBuckets[constraint_name] = bs;
  return bs;
};

/**
 * Adds any new constraint JSON to the search options object. Always called by the *Constraint methods themselves anyway.
 * This is for any constraints you wish to add that don't have their own method here.
 *
 * @param {JSON} con - Constraint JSON to add to these options.
 */
mljs.prototype.options.prototype.addConstraint = function(con) {
  if (undefined == this.options.constraint) {
    this.options.constraint = new Array(); // chicken and egg if just calling includeSearchDefaults first
    this._includeSearchDefaults();
  }
  this.options.constraint.push(con);
};

/**
 * Create a collection constraint, and adds it to the search options object
 *
 * @param {string} constraint_name_opt - Optional constraint name to use. Defaults to 'collection'
 * @param {string} prefix - Optional prefix (base collection) to use. Defaults to blank ''. I.e. all collections
 * @param {JSON} facet_option_opt - Optional JSON facet configureation. If not configured, will use the default facet configuration
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 */
mljs.prototype.options.prototype.collectionConstraint = function(constraint_name_opt,prefix_opt,facet_option_opt,annotation_opt) {
  this._includeSearchDefaults();
  var con = { name: constraint_name_opt || "collection", collection: {}};
  if (undefined != prefix_opt && null != prefix_opt) {
    con.collection.prefix = prefix_opt;
  } else {
    con.collection.prefix = "";
  }
  if (undefined != facet_option_opt && null != facet_option_opt) {
    con.collection["facet-option"] = facet_option_opt;
  } else if (undefined != this.defaults.facetOption) {
    con.collection["facet-option"] = this.defaults.facetOption;
  }
  if (undefined != annotation_opt) {
    if ("string" == typeof(annotation_opt)) {
      annotation_opt = [annotation_opt];
    }
    con.annotation = annotation_opt;
  }
  this.addConstraint(con);
  return this;
};
mljs.prototype.options.prototype.collection = mljs.prototype.options.prototype.collectionConstraint;

/**
 * Create a geospatial element pair constraint, and adds it to the search options object
 *
 * @param {string} constraint_name - Name of the constraint to create
 * @param {string} parent - Parent element name
 * @param {string} ns_opt - Optional namespace of the parent element. If not provided, uses the default namespace
 * @param {string} element - Element name of the geospatial pair element
 * @param {string} ns_el_opt - Optional namespace of the child geospatial element. If not configured will use the default namespace
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 * @param {json} additional_properties_opt - Additional rest api properties to apply to this constraint. Copied after constraint constructed. E.g. fragmentScope.
 */
mljs.prototype.options.prototype.geoElementConstraint = function(constraint_name,parent,ns_opt,element,ns_el_opt,annotation_opt,additional_properties_opt) {
  this._includeSearchDefaults();
  if (undefined == element) {
    if (undefined == ns_opt) {
      element = parent;
      parent = constraint_name;
      constraint_name_opt = undefined;
    } else {
      element = ns_opt;
      ns_opt = parent;
      parent = constraint_name;
      constraint_name_opt = undefined;
    }
  }
  /*
  if (undefined == parent) {
    constraint_name = parent;
    parent = ns_opt;
    ns_opt = undefined;
  }
  if (undefined == constraint_name_opt) {
    constraint_name_opt = element;
  }*/
  var con = { name: constraint_name, "geo-elem": {
    parent: {ns: ns_opt || this.defaults.namespace, name: parent},
    element: {ns: ns_el_opt || this.defaults.namespace, name: element}
  }};
  if (undefined != annotation_opt) {
    if ("string" == typeof(annotation_opt)) {
      annotation_opt = [annotation_opt];
    }
    con.annotation = annotation_opt;
  }
  // copy over additional properties
  for (var n in additional_properties_opt) {
    con["geo-elem"][n] = additional_properties_opt[n];
  }
  this.addConstraint(con);
  return this;
};
mljs.prototype.options.prototype.geoelem = mljs.prototype.options.prototype.geoElementConstraint;
mljs.prototype.options.prototype.geoelemConstraint = mljs.prototype.options.prototype.geoElementConstraint;

/**
 * Creates an element pair geo constraint.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_33146}
 * NB Requires WGS84 or RAW co-ordinates (depending on how you are storing your data) - See the proj4js project for conversions
 *
 * @param {string} constraint_name - Name of the constraint to create
 * @param {string} parentelement - Parent element name
 * @param {string} parentns - Optional namespace of the parent element. If not provided, uses the default namespace
 * @param {string} latelement - Element name of the latitude element within the parent
 * @param {string} latns - Namespace of the latitude element within the parent
 * @param {string} lonelement - Element name of the longitude element within the parent
 * @param {string} lonns - Namespace of the longitude element within the parent
 * @param {json} heatmap_opt - Optional heatmap json configuration
 * @param {Array} geo_options_opt - Optional array of strings to use as options for this geo constraint
 * @param {boolean} facet_opt - Whether to include this constraint as a facet
 * @param {json} facet_options_opt - Options for the facet based on this constraint
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 * @param {json} additional_properties_opt - Additional rest api properties to apply to this constraint. Copied after constraint constructed. E.g. fragmentScope.
 */
mljs.prototype.options.prototype.geoElementPairConstraint = function(constraint_name,parentelement,parentns,latelement,latns,lonelement,lonns,heatmap_opt,geo_options_opt, facet_opt,facet_options_opt,annotation_opt,additional_properties_opt) {
  var con = {name: constraint_name,
    "geo-elem-pair": {
      parent: {name: parentelement,ns: parentns},
      lat: {name: latelement,ns: latns},
      lon: {name: lonelement,ns: lonns}
    }
  };
  if (undefined != heatmap_opt && null != heatmap_opt) {
    con["geo-elem-pair"].heatmap = heatmap_opt;
  }
  if (undefined != geo_options_opt) {
    con["geo-elem-pair"]["geo-option"] = geo_options_opt;
  }
  if (undefined != facet_opt && true === facet_opt) {
    // NB why does a geo-elem-pair-constraint not have a facet_opt property like other range constraints???
  }
  if (undefined != annotation_opt) {
    if ("string" == typeof(annotation_opt)) {
      annotation_opt = [annotation_opt];
    }
    con.annotation = annotation_opt;
  }
  // copy over additional properties
  for (var n in additional_properties_opt) {
    con["geo-elem-pair"][n] = additional_properties_opt[n];
  }
  this.addConstraint(con);
  return this;
};
mljs.prototype.options.prototype.geoelempair = mljs.prototype.options.prototype.geoElementPairConstraint;
mljs.prototype.options.prototype.geoElemPair = mljs.prototype.options.prototype.geoElementPairConstraint;

/**
 * Specifies a geospatial element attribute pair constraint, and adds it to the search options object
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_41124}
 * NB Requires WGS84 or RAW co-ordinates (depending on how you are storing your data) - See the proj4js project for conversions
 *
 * @param {string} constraint_name - Name of the constraint to create
 * @param {string} parentelement - Parent element name
 * @param {string} parentns - Optional namespace of the parent element. If not provided, uses the default namespace
 * @param {string} latattr - Attribute name of the latitude attribute within the parent
 * @param {string} latns - Namespace of the latitude element within the parent
 * @param {string} lonattr - Attribute name of the longitude Attribute within the parent
 * @param {string} lonns - Namespace of the longitude element within the parent
 * @param {json} heatmap_opt - Optional heatmap json configuration
 * @param {Array} geo_options_opt - Optional array of strings to use as options for this geo constraint
 * @param {boolean} facet_opt - Whether to include this constraint as a facet
 * @param {json} facet_options_opt - Options for the facet based on this constraint
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 * @param {json} additional_properties_opt - Additional rest api properties to apply to this constraint. Copied after constraint constructed. E.g. fragmentScope.
 */
mljs.prototype.options.prototype.geoAttributePairConstraint = function(constraint_name,parentelement,parentns,latattr,latns,lonattr,lonns,heatmap_opt,geo_options_opt, facet_opt,facet_options_opt,annotation_opt,additional_properties_opt) {
  var con = {name: constraint_name,
    "geo-attr-pair": {
      parent: {name: parentelement,ns: parentns},
      lat: {name: latattr,ns: latns},
      lon: {name: lonattr,ns: lonns}
    }
  };
  if (undefined != heatmap_opt && null != heatmap_opt) {
    con["geo-attr-pair"].heatmap = heatmap_opt;
  }
  if (undefined != geo_options_opt) {
    con["geo-attr-pair"]["geo-option"] = geo_options_opt;
  }
  if (undefined != facet_opt && true === facet_opt) {
    // NB why does a geo-elem-pair-constraint not have a facet_opt property like other range constraints???
  }
  if (undefined != annotation_opt) {
    if ("string" == typeof(annotation_opt)) {
      annotation_opt = [annotation_opt];
    }
    con.annotation = annotation_opt;
  }
  // copy over additional properties
  for (var n in additional_properties_opt) {
    con["geo-attr-pair"][n] = additional_properties_opt[n];
  }
  this.addConstraint(con);
  return this;
};
mljs.prototype.options.prototype.geoattr = mljs.prototype.options.prototype.geoAttributePairConstraint;
mljs.prototype.options.prototype.geoattrpair = mljs.prototype.options.prototype.geoAttributePairConstraint;

/**
 * Creates a geospatial path range index constraint.
 *
 * Assumes the value of the element is "lat,lon". This can be reversed using the "long-lat-point" option. See the below URL for details.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_86685}
 * NB Requires WGS84 or RAW co-ordinates (depending on how you are storing your data) - See the proj4js project for conversions
 *
 * NOTE: Any namespaces used in the XPath must be specified as {a: "myns1", b: "myns2"} in namespace_json
 *
 * @param {string} constraint_name - Name of the constraint to create
 * @param {string} path - The XPath of the element containing the coordinates.
 * @param {json} namespace_json - The namespace json to use. null if no namespaces are used in the path
 * @param {string|Array} annotation_opt - The annotation to add to the constraint. MLJS uses annotation[0] as the display title, falling back to camel case constraint name if not specified
 * @param {json} additional_properties_opt - Additional rest api properties to apply to this constraint. Copied after constraint constructed. E.g. fragmentScope.
 */
mljs.prototype.options.prototype.geoPathConstraint = function(constraint_name,path,namespace_json,annotation_opt,additional_properties_opt) {
  var con = {name: constraint_name, "geo-path": {"path-index": {text: path, namespaces: namespace_json}}};
  if (undefined != annotation_opt) {
    if ("string" == typeof(annotation_opt)) {
      annotation_opt = [annotation_opt];
    }
    con.annotation = annotation_opt;
  }
  // copy over additional properties
  for (var n in additional_properties_opt) {
    con["geo-path"][n] = additional_properties_opt[n];
  }
  this.addConstraint(con);
  return this;
};
mljs.prototype.options.prototype.geoPath = mljs.prototype.options.prototype.geoPathConstraint;
mljs.prototype.options.prototype.geopath = mljs.prototype.options.prototype.geoPathConstraint;


/**
 * Adds a properties constraint to the search options. Forces the entire search to be constrained to the properties fragment only.
 *
 * @param {string} constraint_name_opt - Optional name of the constraint to create
 */
mljs.prototype.options.prototype.propertiesConstraint = function(constraint_name_opt) {
  var con = { name: "just-props", "properties": null };
  if (undefined != constraint_name_opt) {
    con.name = constraint_name_opt;
  }
  this.addConstraint(con);
  this.suggest(constraint_name_opt);

  return this;
};
mljs.prototype.options.prototype.properties = mljs.prototype.options.prototype.propertiesConstraint;



// Other options features

mljs.prototype.options.prototype._includeGrammar = function() {
  if (undefined == this.options.grammar) {
    this.options.grammar = {
      starter: [], joiner: [], quotation: "\"", "implicit": "<cts:and-query strength=\"20\" xmlns=\"http:\/\/marklogic.com\/appservices\/search\" xmlns:cts=\"http:\/\/marklogic.com\/cts\"\/>"
    };
  }
};

/**
 * Defines a Custom Grammar starter. This enables term grouping (E.g. ( and ) is a group) and prefixing (E.g. negation).
 * See also the convenience grouping() and prefix() methods.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_50275}
 *
 * @param {string} label - the first encountered character to indicate this is a starter (E.g. '(' or '-' characters)
 * @param {string} apply - Whether this should be a "grouping" or "prefix" starter
 * @param {integer} strength - Precedence of this starter over others
 * @param {json} additional_properties - Other properties to add. E.g. element, delimiter, ns, at, tokenize
 */
mljs.prototype.options.prototype.starter = function(label,apply,strength,additional_properties_opt) {
  this._includeGrammar();
  var st = {label: label, apply: apply, strength: strength};
  for (var n in additional_properties_opt) {
    st[n] = additional_properties_opt[n];
  }
  this.options.grammar.start.push(st); // TODO check this is start and not starter, as above
  return this;
};

/**
 * Convenience method for defining a custom grammar starter. See starter() also.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_50275}
 *
 * @param {string} label - the first encountered character to indicate this is a starter (E.g. '(' or '-' characters)
 * @param {string} element - Query to use. E.g. "cts:not-query"
 * @param {integer} strength - Precedence of this starter over others
 * @param {json} additional_properties - Other properties to add. E.g. element, delimiter, ns, at, tokenize
 */
mljs.prototype.options.prototype.prefix = function(label,element,strength,additional_properties_opt) {
  var json = {"element": element};
  for (var n in additional_properties_opt) {
    json[n] = additional_properties_opt[n];
  }
  return this.starter(label,"prefix",strength,json);
};

/**
 * Convenience method for defining a custom grammar starter. See starter() also.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_50275}
 *
 * @param {string} label - the first encountered character to indicate this is a starter (E.g. '(' or '-' characters)
 * @param {string} delimiter - The trailing character to denote the end of this group. E.g. the ')' character. (Start character defined in 'label')
 * @param {integer} strength - Precedence of this starter over others
 * @param {json} additional_properties - Other properties to add. E.g. element, delimiter, ns, at, tokenize
 */
mljs.prototype.options.prototype.grouping = function(label,delimiter,strength,additional_properties_opt) {
  var json = {"delimiter": delimiter};
  for (var n in additional_properties_opt) {
    json[n] = additional_properties_opt[n];
  }
  return this.starter(label,"grouping",strength,json);
};

/**
 * Adds a joiner configuration to the custom search grammar definition.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_37224}
 *
 * @param {string} label - The joiner word. E.g. "OR" or "AND"
 * @param {string} apply - Local name of the function. E.g. "infix"
 * @param {integer} strength - Precedence of this joiner over others
 * @param {json} additional_properties - Other properties to add. E.g. element, options, tokenize etc
 */
mljs.prototype.options.prototype.joiner = function(label,apply,strength,additional_properties_opt) {
  this._includeGrammar();
  var joiner = {label:label,apply:apply,strength:strength};
  for (var n in additional_properties_opt) {
    joiner[n] = additional_properties_opt[n];
  }
  this.options.grammar.joiner.push(joiner);
  return this;
};

/**
 * Specifies the quotation character for this custom grammar
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_13284}
 *
 * @param {string} quotation - Quotation character. E.g. "\""
 */
mljs.prototype.options.prototype.quotation = function(quotation) {
  this._includeGrammar();
  this.options.grammar.quotation = quotation;
  return this;
};

/**
 * The cts-query literal to use to join two terms together. See implicitAnd() and implicitOr() for convenience methods.
 * Defaults to and-query.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_13284}
 *
 * @param {string} ctsquery - The serialized CTS query to use to join two terms together. See REST API docs for example.
 */
mljs.prototype.options.prototype.implicit = function(ctsquery) {
  this._includeGrammar();
  this.options.grammar.implicit = ctsquery;
  return this;
};

/**
 * Convenience function to specify an and-query as a term joiner for a custom grammar.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_13284}
 */
mljs.prototype.options.prototype.implicitAnd = function() {
  return this.implicit("<cts:and-query strength=\"20\" xmlns=\"http:\/\/marklogic.com\/appservices\/search\" xmlns:cts=\"http:\/\/marklogic.com\/cts\"\/>");
};

/**
 * Convenience function to specify an or-query as a term joiner for a custom grammar.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_13284}
 */
mljs.prototype.options.prototype.implicitOr = function() {
  return this.implicit("<cts:or-query strength=\"20\" xmlns=\"http:\/\/marklogic.com\/appservices\/search\" xmlns:cts=\"http:\/\/marklogic.com\/cts\"\/>");
};

/**
 * Specifies the search options to configure. E.g. filtered, unfiltered, score-logtfidf.
 *
 * {@link http://docs.marklogic.com/6.0/cts:search?q=cts:search}
 *
 * @param {string|Array} searchOptions - A single string option, or string array, holding search options.
 */
mljs.prototype.options.prototype.searchOptions = function(searchOptions) {
  this._includeSearchDefaults();
  if (!Array.isArray(searchOptions)) {
    searchOptions = [searchOptions];
  }
  this.options["search-option"] = searchOptions;
  return this;
};

/**
 * Restricts the query to the specified XPath searchable expression.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_65046}
 *
 * NOTE: Any namespaces used in the XPath must be specified as {a: "myns1", b: "myns2"} in namespace_json
 *
 * @param {string} path - The XPath of the element to restrict search constraints to.
 * @param {json} namespace_json - The namespace json to use. null if no namespaces are used in the path
 */
mljs.prototype.options.prototype.searchableExpression = function(xpath,namespace_json) {
  this._includeSearchDefaults();
  this.options["searchable-expression"] = {
    text: path,
    namespaces: namespace_json
  };
  return this;
};

/**
 * Specifies the number of search results to return on each page
 *
 * @param {positiveInteger} length - Page length to use. If not specified, uses the default (10).
 */
mljs.prototype.options.prototype.pageLength = function(length) {
  this._includeSearchDefaults();
  this.options["page-length"] = length;
  return this;
};

/**
 * Specifies the results transformation options. Defaults to raw (full document returned).
 *
 * @param {string} apply - The XQuery function name
 * @param {string} ns_opt - The optional XQuery namespace of the module to invoke
 * @param {string} at_opt - The relative location in the REST modules database to find the transform to invoke
 */
mljs.prototype.options.prototype.transformResults = function(apply,ns_opt,at_opt) {
  this._includeSearchDefaults();
  //this.options["search-option"] = true;
  this.options["transform-results"].apply = apply;
  if (undefined != ns_opt && undefined != at_opt) {
    this.options["transform-results"].ns = ns_opt;
    this.options["transform-results"].at = at_opt;
  }
  return this;
};

/**
 * Uses RAW document snippeting mode.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_48012}
 */
mljs.prototype.options.prototype.raw = function() {
  this._includeSearchDefaults();
  this.options["transform-results"].apply = "raw";
  this.options["transform-results"].ns = undefined;
  this.options["transform-results"].at = undefined;
  return this;
};

/**
 * Uses default snippeting document snippeting mode.
 *
 * NB To configure default snippeting function use snippet(null,null,{"max-matches": 10}) or similar
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_48012}
 *
 * @param {string} ns_opt - The optional XQuery namespace of the snippeting module to invoke
 * @param {string} at_opt - The relative location in the REST modules database to find the snippeting module to invoke
 * @param {json} additional_opt - Map containing additional properties. E.g. "preferred-elements" or "max-matches"
 */
mljs.prototype.options.prototype.snippet = function(ns_opt,at_opt,additional_opt) {
  this._includeSearchDefaults();
  this.options["transform-results"].apply = "snippet";
  this.options["transform-results"].ns = ns_opt;
  this.options["transform-results"].at = at_opt;
  /*
  if (undefined != preferredElements_opt) {
    this.options["transform-results"]["preferred-elements"] = preferredElements_opt;
  }
  if (undefined != maxMatches_opt) {
    this.options["transform-results"]["max-matches"] = maxMatches_opt;
  }
  */
  if (undefined != additional_opt) {
    for (var p in additional_opt) {
      this.options["transform-results"][p] = additional_opt[p];
    }
  }
  return this;
};

/**
 * Uses empty snippet document snippeting mode.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_48012}
 */
mljs.prototype.options.prototype.empty = function() {
  this._includeSearchDefaults();
  this.options["transform-results"].apply = "empty-snippet";
  this.options["transform-results"].ns = undefined;
  this.options["transform-results"].at = undefined;
  return this;
};

/**
 * Uses metadata-snippet document snippeting mode.
 *
 * {@link http://docs.marklogic.com/guide/rest-dev/appendixa#id_48012}
 */
mljs.prototype.options.prototype.metadata = function() {
  this._includeSearchDefaults();
  this.options["transform-results"].apply = "metadata-snippet";
  this.options["transform-results"].ns = undefined;
  this.options["transform-results"].at = undefined;
  return this;
};

/**
 * Clears any default or specified sort order definitions
 */
mljs.prototype.options.prototype.sortOrderClear = function() {
  this._includeSearchDefaults();
  this.options["sort-order"] = new Array();
  return this;
};

/**
 * Specifies score as the sort order
 */
mljs.prototype.options.prototype.sortOrderScore = function() {
  this._includeSearchDefaults();
  // TODO add check to see if we already exist
  this.options["sort-order"].push({"direction": "descending",score: null, "annotation": ["Relevancy (Desc)"]});
  return this;
};
mljs.prototype.options.prototype.relevance = mljs.prototype.options.prototype.sortOrderScore; // common alias

/**
 * Restricts results (e.g. for snippeting) to those elements within the given XPath expression.
 * Facets still operate at the document level even if they are not within the searchable expression.
 *
 * {@link http://docs-ea.marklogic.com/guide/rest-dev/appendixa#id_65046}
 *
 * @param {string} expression - The XPath expression to return in the search results (E.g. for snippeting)
 * @param {string} namespaces_opt - A JSON object of {prefix: "namespace/string", ...} specifying namespaces used within the XPath (if any)
 */
mljs.prototype.options.prototype.searchableExpression = function(expression, namespaces_opt) {
  this._includeSearchDefaults();
  this.options["searchable-expression"] = {
    text: expression
  };
  if (undefined != namespaces_opt) {
    this.options["searchable-expression"].namespaces = namespaces_opt;
  }
  return this;
};

/**
 * Specifies the sort order. Automatically called for any of the range constraint constructor functions.
 *
 * @param {string} direction_opt - The direction (ascending or descending) to use. If not specified, uses the default direction.
 * @param {string} type_opt - The type of the sort element. If not specified uses the default type.
 * @param {string|JSON} keyOrJSON - The JSON key or XML index JSON description to use. {element: "year", elementns: "http://...", attribute: "gregorian", attributens: "http://" OR FOR FIELD: field: "myfield", collation: "http://..." OR JSON key: "key"    -     All support annotation: "" | ["","",...]  }
 * @param {string} collation_opt - The optional collation to use. Uses the default collation if not specified.
 */
mljs.prototype.options.prototype.sortOrder = function(direction_opt,type_opt,keyOrJSON,collation_opt) {
  this._includeSearchDefaults();
  // TODO check for unspecified type, direction, collation (and element + ns instead of key)
  var so = {direction: direction_opt || this.defaults.sortDirection,type:type_opt || this.defaults.datatype/*, score: "score-logtfidf"*/};
  if ("string" === typeof(keyOrJSON)) {
    so["json-key"] = keyOrJSON;
  } else {
    if (undefined != keyOrJSON.element) {
      so["element"] = {name: keyOrJSON.element};
      if (undefined != keyOrJSON.elementns) {
        so["element"].ns = keyOrJSON.elementns;
      } else {
        so["element"].ns = this.defaults.namespace;
      }
    }
    if (undefined != keyOrJSON.attribute) {
      so["attribute"] = {name: keyOrJSON.attribute};
      if (undefined != keyOrJSON.attributens) {
        so["attribute"].ns = keyOrJSON.attributens || so["element"].ns;
      } else {
        so["attribute"].ns = ""; // not using default in case attribute has actual no namespace
      }

    }
    if (undefined != keyOrJSON.field) {
      so["field"] = {name: keyOrJSON.field, collation: keyOrJSON.collation}; // might not be the default value, could be null (optional)
    }
    if (undefined != keyOrJSON.key) {
      so["json-key"] = keyOrJSON.key;
    }
    if (undefined != keyOrJSON.annotation) {
      if ("string" == typeof(keyOrJSON.annotation)) {
        so["annotation"] = [keyOrJSON.annotation];
      } else {
        so["annotation"] = keyOrJSON.annotation;
      }
    }
  }
  if ("xs:string" == type_opt) {
    so.collation = collation_opt || this.defaults.collation;
  }
  this.options["sort-order"].push(so);
  return this;
};
/*
    "options": {
      "tuples": [
        {
          "name": agName,
          "range": [
            {
              "type": "xs:string",
              "element": {
                "ns": "http://marklogic.com/xdmp/json/basic",
                "name": "actor"
              }
            },
            {
              "type": "xs:string",
              "element": {
                "ns": "http://marklogic.com/xdmp/json/basic",
                "name": "genre"
              }
            }
          ]
        }
      ]
    }
    */

mljs.prototype.options.prototype._quickRange = function(el) {
  if (typeof el == "string") {
    return {type: this.defaults.datatype, element: {ns: this.defaults.namespace, name: el}};
  } else {
    // json range object
    return el;
  }
};

/**
 * Returns a constraint definition based on constraint name.
 * @param {string} name - Constraint name for already defined constraint to return
 */
mljs.prototype.options.prototype.getConstraint = function(name) {
  var cons = this.options.constraint;
  if (undefined == cons) {
    return null;
  }
  for (var c = 0,maxc = cons.length,con;c < maxc;c++) {
    con = cons[c];
    if (con.name == name) {
      return con;
    }
  }
};

/**
 * Creates a tuples definition for returning co-occurence values
 *
 * @param {string} name - The name of the tuples configuration to create
 * @param {string|JSON} el - The json element for a co-occurence. Either a range constraint name, element/json key name (string) or a full REST API range type object (JSON). You can specify any number of these as required (minimum 2)
 */
mljs.prototype.options.prototype.tuples = function(name) { // TODO handle values-options and aggregate configuration
  var tuples = {name: name,range: new Array()};
  if (undefined == this.options.tuples) {
    this.options.tuples = new Array();
  }
  //tuples.range.push(this._quickRange(el));
  //tuples.range.push(this._quickRange(el2));
  //if (undefined != el3) {
  //  tuples.range.push(this._quickRange(el3));
  //}
  for (var i = 1;i < arguments.length;i++) {
    var con = this.getConstraint(arguments[i]);
    if (null == con || undefined == con.range) {
      tuples.range.push(this._quickRange(arguments[i]));
    } else {
      tuples.range.push(con.range);
    }
  }
  if (undefined != this.defaults.limit) {
    tuples["values-option"] = ["limit=" + this.defaults.limit]; // TODO validate this is a valid option for tuples (docs only mention values)
  }
  this.options.tuples.push(tuples);
  return this;
};

/**
 * Creates a values definition for returning lexicon values
 *
 * @param {string} name - The name of the values configuration to create
 * @param {string|JSON} el - The json element for a co-occurence. Either a range constraint name, element/json key name (string) or a full REST API range type object (JSON). You can specify any number of these as required
 */
mljs.prototype.options.prototype.values = function(name) { // TODO handle values-options and aggregate configuration
  var values = {name: name,range: new Array()};
  this.options["return-values"] = true;
  if (undefined == this.options.values) {
    this.options.values = new Array();
  }
  for (var i = 1;i < arguments.length;i++) {
    var con = this.getConstraint(arguments[i]);
    if (null == con || undefined == con.range) {
      values.range.push(this._quickRange(arguments[i]));
    } else {
      values.range.push(con.range);
    }
  }
  if (undefined != this.defaults.limit) {
    values["values-option"] = ["limit=" + this.defaults.limit];
  }
  this.options.values.push(values);
  return this;
};

/**
 * Sets the default limit for values and tuples lookups (co-occurence and lexicon value listing)
 * @param {postitiveInteger} num - The limit of the number of results to return
 */
mljs.prototype.options.prototype.defaultLimit = function(num) {
  this.defaults.limit = num;
  return this;
};


mljs.prototype.options.prototype.suggest = function(constraint,options_opt) {
  this.options["suggestion-source"].push({
    ref: constraint, "suggestion-option": options_opt
  });
};


/*
mljs.prototype.options = function() {
  return new mljs.prototype.options();
};
*/











// Structured Query Builder object

/**
 * Creates a structured query builder object
 *
 * @constructor
 * @deprecated Call var db = new mljs(); var qb = db.createQuery(); instead
 */
mljs.prototype.query = function() {
  this._query = {
    // TODO initialise query object with sensible settings
  };

  this.defaults = {};
  // TODO set defaults
};

/**
 * Returns the JSON object used in the REST API (and mljs functions) that this query builder represents
 */
mljs.prototype.query.prototype.toJson = function() {
  return {query: this._query};
};

// TOP LEVEL QUERY CONFIGURATION (returning this)

/**
 * Copies an existing query options object in to this object (pass a JSON structure query, not an mljs.query object).
 * Also used to set the top level query object (E.g. pass this function the result of query.and()).
 * MUST be called at least once in order for the query to be set, prior to calling toJson(). Otherwise you'll always
 * have a BLANK query!!!
 *
 * @param {JSON} query_opt - The query to copy child values of to this query
 */
mljs.prototype.query.prototype.query = function(query_opt) {
  for (var name in query_opt) {
    // copy {collection: ...} collection (or and-query, or-query) in to our query object - should work with any valid query type
    this._query[name] = query_opt[name];
  }
  return this;
};

// QUERY CREATION FUNCTIONS (returns query JSON)

/**
 * Creates an and query, and returns it
 *
 * @param {JSON} query - The query, or array of queries, to use within the constructed and query
 */
mljs.prototype.query.prototype.and = function(query_opt) {
  if (Array.isArray(query_opt)) {
    return { "and-query": query_opt};
  } else {
    // object
    return { "and-query": [query_opt]};
  }
};


/**
* Creates an or query, and returns it
*
* @param {JSON} query - The query, or array of queries, to use within the constructed or query
*/
mljs.prototype.query.prototype.or = function(query_opt) {
  if (Array.isArray(query_opt)) {
    return { "or-query": query_opt};
  } else {
    // object
    return { "or-query": [query_opt]};
  }
};


/**
* Creates a not query, and returns it
*
* @param {JSON} query - The query, or array of queries, to use within the constructed not query
*/
mljs.prototype.query.prototype.not = function(query_opt) {
  if (Array.isArray(query_opt)) {
    return { "not-query": query_opt};
  } else {
    // object
    return { "not-query": [query_opt]};
  }
};


/**
 * Creates an element constraint query, with optional query to be applied to the contents of that element.
 *
 * @param {string} constraint_name - The name of the constraint configured in the search options for this element.
 * @param {JSON} query - The query, or array of queries, to use within the constructed or query
 */
mljs.prototype.query.prototype.element = function(constraint_name,query_opt) {
  if (Array.isArray(query_opt)) {
    return { "element-constraint-query": {"constraint-name": constraint_name,"and-query": query_opt}};
  } else {
    // object
    return { "element-constraint-query": {"constraint-name": constraint_name,"and-query": [query_opt]}};
  }
};


/**
 * Creates an element value query.
 * http://docs.marklogic.com/guide/search-dev/structured-query#id_39758
 *
 * @param {string} elementname - The name of the element
 * @param {string} elementns - The namespace of the element
 * @param {string} value - The value of the element
 */
mljs.prototype.query.prototype.elementValue = function(elementname,elementns,value) {
  return { "value-query": {"element": {"name": elementname, "ns": elementns}, "text": value}};
};


/**
 * Creates an container (element or JSON key) constraint query, with optional query to be applied to the contents of that element.
 *
 * @param {string} constraint_name - The name of the constraint configured in the search options for this container.
 * @param {JSON} query - The query, or array of queries, to use within the constructed or query
 */
mljs.prototype.query.prototype.container = function(constraint_name,query_opt) {
  if (Array.isArray(query_opt)) {
    return { "container-constraint-query": {"constraint-name": constraint_name,"and-query": query_opt}};
  } else {
    // object
    return { "container-constraint-query": {"constraint-name": constraint_name,"and-query": [query_opt]}};
  }
};

/**
 * Creates a collection query, and returns it
 *
 * @param {string} uri_opt - The optional URI to use as the base. If not specified a blank '' value is used (i.e. all collections returned to the specified depth)
 * @param {integer} depth_opt - What depth in the child collections to include (defaults to infinite if not specified)
 */
mljs.prototype.query.prototype.collection = function(uri_opt,depth_opt) {
  if (undefined == uri_opt) {
    return {"collection-query": {uri: ""}}; // all collections by default
  } else if ("string" == typeof uri_opt) {
    // single uri
    return {"collection-query": {uri: uri_opt}}
  } else if (Array.isArray(uri_opt)) {
    // TODO handle array of uris
  } else {
    this.__d("WARNING: query.collection(): uri_opt not an array or string, but instead a '" + (typeof uri_opt) + "'");
  }
  return undefined;
};

// TODO geo example
/*
                        query: {
                          "and-query": {

                            "range-constraint-query": {
                              "constraint-name": "type",
                              "value": ["maptile"]
                            },

                            "range-constraint-query": {
                              "constraint-name": "layer",
                              "value": ["os"]
                            },

                            "geospatial-constraint-query": {
                              "constraint-name": "centre",
                              "circle": {
                                "radius": json.radiusmiles,
                                "point":[{"latitude":json.lat,"longitude":json.lon}]
                              }
                            }
                          }
                        }
*/
/**
 * Creates a geospatial circle query and returns it
 *
 * @param {string} constraint_name - Name of the matching constraint to restrict by these values
 * @param {integer} lat - WGS84 latitude
 * @param {integer} lon - WGS84 Longitude
 * @param {positiveInteger} radius - The radius from the circle centre to use. Defaults to statute (not nautical) miles. Supports "miles", "m" (metres), "km", "nm" (nautical miles), "degrees" (degrees longitude at the equator, or latitude)
 * @param {string} radiusmeasure_opt - The units used. Default is mi=statute miles. Also m=metres, km=kilometres, nm=nautical miles, degrees=degrees of rotation of the Earth
 */
mljs.prototype.query.prototype.geoRadius = function(constraint_name,lat,lon,radius,radiusmeasure_opt) {
  var self = this;
  var circ = this.circleDef(lat,lon,radius,radiusmeasure_opt);
  return {
    "geospatial-constraint-query" : {
      "constraint-name": constraint_name,
      "circle": circ.circle
    }
  }
};
mljs.prototype.query.prototype.georadius = mljs.prototype.query.prototype.geoRadius;

mljs.prototype.query.prototype.circleDef = function(lat,lon,radius,radiusmeasure_opt) {
  var radiusactual = this._convertRadius(radius,radiusmeasure_opt);
  return {
    "circle": {
      "radius": radiusactual,
      point: [{"latitude": lat,"longitude": lon}]
    }
  };
};

mljs.prototype.query.prototype._convertRadius = function(radius,radiusmeasure_opt) {
  var radiusactual = radius;
  if (undefined != radiusmeasure_opt) {
    if ("km" == radiusmeasure_opt) {
      radiusactual = radiusactual * 0.621371192;
    } else if ("m" == radiusmeasure_opt) {
      radiusactual = radiusactual * 0.000621371192;
    } else if ("nm" == radiusmeasure_opt) {
      radiusactual = radiusactual * 1.15078;
    } else if ("degrees" == radiusmeasure_opt) {
      // degrees of rotation - 1 minute (1/60 of a degree) is 1 nm
      radiusactual = radiusactual * 69.0468;
    }
  }
  return radiusactual;
};

/**
 * Creates a geospatial bounding box query and returns it
 *
 * @param {string} constraint_name - Name of the matching constraint to restrict by these values
 * @param {integer} north - WGS84 north latitude
 * @param {integer} east - WGS84 east longitude
 * @param {integer} wouth - WGS84 wouth latitude
 * @param {integer} west - WGS84 west longitude
 */
mljs.prototype.query.prototype.geoBox = function(constraint_name,north,east,south,west) {
  return {
    "geospatial-constraint-query" : {
      "constraint-name": constraint_name,
      "box": {
        north: north,east: east,south: south,west:west
      }
    }
  }
};

/**
 * Creates a geospatial polygon query and returns it
 *
 * @param {string} constraint_name - Name of the matching constraint to restrict by these values
 * @param {Array} points - Array of WGS 84 Points {latitude: , longitude: } JSON objects
 */
mljs.prototype.query.prototype.geoPolygon = function(constraint_name,points) {
  return {
    "geospatial-constraint-query" : {
      "constraint-name": constraint_name,
      "polygon": {point: points}
    }
  }
};

/**
 * Creates a geo element pair query. Useful for dynamically calculating relevance using distance from a known point.
 *
 * @param {string} parentelement - parent element name. E.g. <location> or location: {lat:...,lon:...}
 * @param {string} parentns - parent namespace (provide null if none, or "http://marklogic.com/xdmp/json/basic" if JSON)
 * @param {string} latelement - latitude element. E.g. &lt;lat&gt; or lat: 51.1234
 * @param {string} latns - latitude namespace (provide null if none, or "http://marklogic.com/xdmp/json/basic" if JSON)
 * @param {string} lonelement - longitude element. E.g. &lt;lon&gt; or lat: 0.1234
 * @param {string} lonns - longitude namespace (provide null if none, or "http://marklogic.com/xdmp/json/basic" if JSON)
 * @param {float} pointlat - longitude in WGS84 or RAW
 * @param {float} pointlon - longitude in WGS84 or RAW
 * @param {string} scoring_method_opt - Optional scoring method. Defaults zero (others in V7: "reciprocal" (nearest first) or "linear" (furthest first)). NB Just ignored on V6.
 */
mljs.prototype.query.prototype.geoElementPairPoint = function(parentelement,parentns,latelement,latns,lonelement,lonns,pointlat,pointlon,scoring_method_opt) {
  if (undefined == scoring_method_opt) {
    scoring_method_opt = "zero";
  }
  return {
    "geo-elem-pair-query": {
      "parent": {
        "name": parentelement,
        "ns": parentns
      },
      "lat": {
        "name": latelement,
        "ns": latns
      },
      "lon": {
        "name": lonelement,
        "ns": lonns
      },
      "geo-option": [ "score-function=" + scoring_method_opt ],
      "point": [
        {
          "latitude": pointlat,
          "longitude": pointlon
        }
      ]
    }
  };
};

/**
 * Creates a geo element pair query. Useful for dynamically calculating relevance using distance from a known point.
 *
 * @param {string} parentelement - parent element name. E.g. <location> or location: {lat:...,lon:...}
 * @param {string} parentns - parent namespace (provide null if none, or "http://marklogic.com/xdmp/json/basic" if JSON)
 * @param {string} latelement - latitude element. E.g. &gt;lat&lt; or lat: 51.1234
 * @param {string} latns - latitude namespace (provide null if none, or "http://marklogic.com/xdmp/json/basic" if JSON)
 * @param {string} lonelement - longitude element. E.g. &gt;lon&lt; or lat: 0.1234
 * @param {string} lonns - longitude namespace (provide null if none, or "http://marklogic.com/xdmp/json/basic" if JSON)
 * @param {float} pointlat - longitude in WGS84 or RAW
 * @param {float} pointlon - longitude in WGS84 or RAW
 * @param {double} radius - Radius
 * @param {double} radius_unit - Unit to use. Supports "miles", "m" (metres), "km", "nm" (nautical miles), "degrees" (degrees longitude at the equator, or latitude)
 * @param {string} scoring_method_opt - Optional scoring method. Defaults zero (others in V7: "reciprocal" (nearest first) or "linear" (furthest first)). NB Just ignored on V6.
 */
mljs.prototype.query.prototype.geoElementPairRadius = function(parentelement,parentns,latelement,latns,lonelement,lonns,pointlat,pointlon,radius,radius_unit_opt,scoring_method_opt) {
  if (undefined == scoring_method_opt) {
    scoring_method_opt = "zero";
  }
  var radiusactual = this._convertRadius(radius,radius_unit_opt);
  return {
    "geo-elem-pair-query": {
      "parent": {
        "name": parentelement,
        "ns": parentns
      },
      "lat": {
        "name": latelement,
        "ns": latns
      },
      "lon": {
        "name": lonelement,
        "ns": lonns
      },
      "geo-option": [ "score-function=" + scoring_method_opt, "units=" + radius_unit_opt ],
      "circle": {
        radius: radiusactual,
        "point": [
          {
            "latitude": pointlat,
            "longitude": pointlon
          }
        ]
      }
    }
  };
};

/**
 * Allows a query term to be changed on the fly, by returning a wrapper function that can be called with a JSON vars object.
 * See mldbwebtest's page-mljstest-openlayers.js sample file.
 *
 * @param {JSON} query - The query JSON object. E.g. returned by geoElementPair(...)
 * @return {function} func - the dynamic function to call with a JSON vars object: E.g. for a geoElementPair wrapper: {latitude: -51.2334, longitude: 0.345454}
 */
mljs.prototype.query.prototype.dynamic = function(query) {
  var func = null;

  if (undefined != query["geo-elem-pair-query"] && undefined != query["geo-elem-pair-query"]["point"]) {
    func = function(vars) {
      // alter point lon, lat
      query["geo-elem-pair-query"].point.latitude = vars.latitude;
      query["geo-elem-pair-query"].point.longitude = vars.longitude;
      var opts = query["geo-elem-pair-query"]["geo-option"];
      for (var i = 0, max = opts.length,opt;i < max;i++) {
        opt = opts[i];
        if (undefined != vars["score-function"] && opt.indexOf("score-function=") == 0) {
          opt = "score-function=" + vars["score-function"];
        }
        opts[i] = opt;
      }
      query["geo-elem-pair-query"]["geo-option"] = opts;

      return query;
    };
  }

  if (undefined != query["geo-elem-pair-query"] && undefined != query["geo-elem-pair-query"]["circle"]) {
    func = function(vars) {
      // alter point lon, lat, radius, radius units
      query["geo-elem-pair-query"].circle.point.latitude = vars.latitude;
      query["geo-elem-pair-query"].circle.point.longitude = vars.longitude;
      query["geo-elem-pair-query"].circle.radius = vars.radius;
      var opts = query["geo-elem-pair-query"]["geo-option"];
      for (var i = 0, max = opts.length,opt;i < max;i++) {
        opt = opts[i];
        if (undefined != vars["units"] && opt.indexOf("units=") == 0) {
          opt = "units=" + vars.units;
        }
        if (undefined != vars["score-function"] && opt.indexOf("score-function=") == 0) {
          opt = "score-function=" + vars["score-function"];
        }
        opts[i] = opt;
      }
      query["geo-elem-pair-query"]["geo-option"] = opts;

      return query;
    };
  }

  // TODO other dynamic query types

  return func;
};

/**
 * Creates a range constraint query and returns it
 *
 * @param {string} constraint_name - The constraint name from the search options for this constraint
 * @param {string} val - The value that matching documents must match
 * @param {string} range_operator_opt - The Optional operator to use. Default to EQ (=) if not provided. Valid values: LT, LE, GT, GE, EQ, NE
 * @param {Array} options_opt - The Optional String array options for the range index. E.g. ["score-function=linear","slope-factor=10"]
 */
mljs.prototype.query.prototype.range = function(constraint_name,val,range_operator_opt,options_opt) {
  var query = {
    "range-constraint-query": {
      "value": val,
      "constraint-name": constraint_name
    }
  };
  if (undefined != range_operator_opt) {
    // TODO sanity check value
    query["range-constraint-query"]["range-operator"] = range_operator_opt;
  }
  if (undefined != options_opt) {
    // TODO sanity check value
    query["range-constraint-query"]["range-option"] = options_opt;
  }

  return query;
};

/**
 * Creates a value constraint query and returns it
 *
 * @param {string} constraint_name - The constraint name from the search options for this constraint
 * @param {string} val - THe value that matching documents must match
 */
mljs.prototype.query.prototype.value = function(constraint_name,val) {
  var query = {
    "value-constraint-query": {
      "text": val,
      "constraint-name": constraint_name
    }
  };

  return query;
};

/**
 * Creates a document (uri list) query
 *
 * @param {string} constraint_name - The constraint name from the search options for this constraint
 * @param {string} uris - URI array for the documents to restrict search results to
 */
mljs.prototype.query.prototype.uris = function(constraint_name,uris) {
  return {
    "document-query": {
      "uri": uris
    }
  }
};

/**
 * Term (Word or phrase, anywhere in a document) query
 *
 * @param {string} wordOrPhrase - The word of phrase for the term query
 */
mljs.prototype.query.prototype.term = function(wordOrPhrase) {
  var tq = {
    "term-query": {
      "text": [wordOrPhrase]
    }
  };
  return tq;
};

/*
mljs.prototype.query = function() {
  return new mljs.prototype.query();
};*/




/**
 * Provides objects for generic event publish-subscribe workflows
 */
if (typeof(window) === 'undefined') {
  com = {};
  com.marklogic = {};
  com.marklogic.events = {};
  com.marklogic.semantic = {};

  var XMLSerializer = require('flat-xmldom').XMLSerializer;
} else {
  com = window.com || {};
  com.marklogic = window.com.marklogic || {};
  com.marklogic.events = window.com.marklogic.events || {};
  com.marklogic.semantic = window.com.marklogic.semantic || {};
}
com.marklogic.events = {};

// EVENT

com.marklogic.events.Event = function(type,data) {
  this.type = type;
  this.data = data;
};

// LINKER
com.marklogic.events.Linker = function() {
  this._links = new Array();
};

com.marklogic.events.Linker.prototype.link = function(widget,funcname,func) {
  var instance = this._find(widget,funcname);
  if (null == instance) {
    instance = {widget:widget,funcname:funcname,func:func};
    this._links.push(instance);
  }
};

com.marklogic.events.Linker.prototype._find = function(widget,funcname) {
    var instance = null;
    for (var i = 0, maxi = this._links.length;null == instance && i < maxi;i++) {
      var candidate = this._links[i];
      if (funcname == candidate.funcname && widget == candidate.widget) {
        instance = candidate;
      }
    }
    return instance;
};

com.marklogic.events.Linker.prototype.find = function(widget,funcname) {
  var instance = this._find(widget,funcname);
  if (null != instance) {
    return instance.func;
  }
  return null;
};

// PUBLISHER

/**
 * Creates an event publishing management object. This is used extensively by searchcontext and widgets.
 * One event publisher should be created for each event type.
 *
 * @constructor
 */
com.marklogic.events.Publisher = function() {
  this.listeners = new Array();
};

/**
 * Subscribes a listening function to this event publisher
 *
 * @param {function} listener - The function that is passed the event object
 */
com.marklogic.events.Publisher.prototype.subscribe = function(listener) {
  this.listeners.push(listener);
};

/**
 * Unsubscribes a listening function from this event publisher
 *
 * @param {function} listener - The function that should no longer receive events
 */
com.marklogic.events.Publisher.prototype.unsubscribe = function(listener) {
  var newArr = new Array();
  for (var i = 0;i < this.listeners.length;i++) {
    if (listener != this.listeners[i]) {
      newArr.push(this.listeners[i]);
    }
  }
  this.listeners = newArr;
};


/**
 * Publishes an event, calling all listener functions in turn with the event object.
 *
 * @param {object} event - The event object. Can be of any type.
 */
com.marklogic.events.Publisher.prototype.publish = function(event) {
  for (var i = 0;i < this.listeners.length;i++) {
    this.listeners[i](event);
  }
};












/**
 * A Search Context links together any objects affecting the query, sorting, facets or that
 * wants to be notified of changes to those, and to any new results or pages being retrieved.
 *
 * Defaults to operating against the /v1/search endpoint, but can be changed to operate against the /v1/values endpoint, depending on need.
 *
 * @constructor
 * @deprecated Use var db = new mljs(); db.createSearchContext(); instead
 */
mljs.prototype.searchcontext = function() {

  // Publicly accessible configuration
  this.sortWord = "sort";
  this.defaultQuery = ""; // should be set E.g. to "sort:relevance"
  this.optionsName = mljs.__dogenid();
  this._options = {
    options: {
      "return-results": true,
      "page-length": 10,
      "transform-results": {
        apply: "raw"/*, ns: "http://marklogic.com/rest-api/transform/transformresultsjson", at: "/modules/transform-results-json.xqy"*/
      },
      constraint: [
        {
          "name": "collection",
          "collection": {
            "prefix": ""
          }
        } // other constraints here
      ]
    }
  };
  this.collection = null;
  this.directory = null;
  this.transform = null;
  this.transformParameters = {};
  this.format = null;

  // Internal configuration
  this._optionsbuilder = new mljs.prototype.options();

  this._querybuilder = new mljs.prototype.query();

  this._query = {};
  this.simplequery = "";

  this._lastSearchFunction = "simple"; // either simple or structured or custom
  this._searchEndpoint = "search"; // either search or values or custom
  this._customEndpointFunction = null; // has a value of type function is lastSearchFunction = custom
  this._tuples = new Array(); // for values mode

  this.defaultSort = [];

  this.optionsExist = false;
  //this.optionssavemode = "persist"; // persist or dynamic (v7 only)

  this.structuredContrib = {};

  this._selectedResults = new Array(); // Array of document URIs
  this._highlightedResults = new Array(); // Array of document URIs

  this._facetSelection = new Array();

  this._nextRequestId = 1; // used to discard old requests that are returned by MarkLogic late. Also used by promise code to determine it's own request

  // set up event handlers
  this.optionsPublisher = new com.marklogic.events.Publisher(); // updated search options JSON object, for parsing not storing a copy
  this.resultsPublisher = new com.marklogic.events.Publisher(); // publishes search results (including facet values)
  this.valuesPublisher = new com.marklogic.events.Publisher(); // publishes co-occurence and lexicon values
  this.facetsPublisher = new com.marklogic.events.Publisher(); // publishese facets selection changes
  this.sortPublisher = new com.marklogic.events.Publisher(); // publishes sort changes (from query bar)
  this.errorPublisher = new com.marklogic.events.Publisher(); // errors occuring at search time
  this.simpleQueryPublisher = new com.marklogic.events.Publisher(); // simple query text
  this.selectionPublisher = new com.marklogic.events.Publisher(); // result selection uri array publisher
  this.highlightPublisher = new com.marklogic.events.Publisher(); // mouse over/highlight results
  this.suggestionPublisher = new com.marklogic.events.Publisher(); // search query completion suggestion handling

};

/**
 * Returns the MLJS Workplace Context Configuration definition JSON object
 */
mljs.prototype.searchcontext.getConfigurationDefinition = function() {
  return {
    options: {type: "string", default: "{}", title: "Options", description: "MarkLogic search options object."}, // TODO make this a JSON object
    optionsName: {type: "string", default: "my-search-options", title: "Options Name", description: "Name of your search options."},
    sortWord: {type: "string", default: "sort", title: "Sort Word", description: "The keyword in your search options for sorting."},
    defaultQuery: {type: "string", default: "", title: "Default Query", description: "Default text query to use."},
    collection: {type: "string", default: "", title: "Collection", description: "Collection to restrict results to."},
    directory: {type: "string", default: "", title: "Directory", description: "Directory (URI path) to restrict results to."},
    transform: {type: "string", default: "", title: "Transform", description: "Transform to apply to the search results object."},
    format: {type: "string", default: "", title: "Format", description: "Format of the result."} // TODO enum for format
    ,searchEndpoint: {type: "enum", default: "search", title: "Search Endpoint", description: "Whether to execute a values or content query",
      options: [
        {value: "search", title: "Search", description: "Default REST search endpoint."},
        {value: "values", title: "Values", description: "Default REST values endpoint."},
        {value: "custom", title: "Custom", description: "Custom REST endpoint."}
      ]},

    tuples: {type: "multiple", minimum: 0, default: [], title: "Tuples", description: "Tuples to load when executing search",
      childDefinitions: {
        name: {type: "string", default: "", title: "Tuple name", description: "Tuple name in search options"}
      }
    }
  };
};

/**
 * Sets the configuration of this context using the MLJS Workplace JSON format.
 *
 * @param {JSON} config - The JSON configuration of this context.
 */
mljs.prototype.searchcontext.prototype.setConfiguration = function(config) {
  this._options = config.options;
  this.optionsName = config.optionsName;
  this.defaultQuery = config.defaultQuery || "";
  this.sortWord = config.sortWord;
  this.collection = config.collection;
  this.directory = config.directory;
  this.transform = config.transform;
  this.transformParameters = config.transformParameters || {};
  this.format = config.format;
  this._searchEndpoint = config.searchEndpoint;
  this._tuples = [];
  if (undefined != config.tuples) {
    for (var t = 0,maxt = config.tuples.length,tuple;t < maxt;t++) {
      tuple = config.tuples[t];
      this._tuples.push(tuple.name);
    }
  }

  if (this.format == "") {
    this.format = null;
  }
  if ("" == this.directory) {
    this.directory = null;
  }
  if ("" == this.collection) {
    this.collection = null;
  }
  if ("" == this.transform) {
    this.transform = null;
  }
  if ("" == this.sortWord) {
    this.sortWord = "sort";
  }
  if ("" == this.optionsName) {
    this.optionsName = null;
  }
  if ("" == this._searchEndpoint) {
    this._searchEndpoint = "search";
  }
  if (null != this._options && "" != this._options) {
    this._options = JSON.parse(this._options); // saved as string currently - may change later
  }

  // if blank optionsName, set to 'all', and attempt to load it
  var self = this;
  var loadOptions = function(name) {

      self.db.searchOptions(name,function(result) {
        if (result.inError) {
          // don't exist
        } else {
          self.optionsName = name;
          self._options = result.doc;
        }
      });
  };
  if (null == this.optionsName) {
    this.optionsName = "all"; // in case of async issues on page load
    // assume they exist
    this.optionsExist = true;
    loadOptions("all");
  } else {
    if (null == this._options || null == this._options.options) {
      // assume they exist
      this.optionsExist = true;
      // name set, options not loaded yet
      loadOptions(this.optionsName);
    }
  }
};

/**
 * Sets the name of the search transform to use. See GET /v1/search
 *
 * @param {string} t - The transform name to use
 */
mljs.prototype.searchcontext.prototype.setTransform = function(t) {
  this.transform = t;
};

/**
 * Sets the name of the search transform parameters to use. See GET /v1/search
 *
 * @param {JSON} tps - The transform parameter JSON object {paramname: "value", ...} to use
 */
mljs.prototype.searchcontext.prototype.setTransform = function(tps) {
  this.transformParameters = tps;
};

/**
 * Instructs this context to use the /v1/search endpoint, and thus the search() or structuredSearch() methods on MLJS
 */
mljs.prototype.searchcontext.prototype.searchEndpoint = function() {
  this._searchEndpoint = "search";
};

/**
 * Instructs this context to use the /v1/values endpoint, and thus the values() method on MLJS
 *
 * @param {string} tuplesname - The name of the tuple to fetch lexicon (or co-occurence) values for. Multiple tuples name arguments allowed (not as an array).
 */
mljs.prototype.searchcontext.prototype.valuesEndpoint = function() {
  this._searchEndpoint = "values";
  for (var i = 0;i < arguments.length;i++) {
    this._tuples.push(arguments[i]);
  }
};

/**
 * Instructs this search context to use your own custom search handler. Useful if you have created your own REST endpoint to handle searching on the server.
 * Use the mljs.do method in your searchHandler function to invoke your extension.
 *
 * Note your function must have the signature: function(searchcontext,textQuery,structuredQueryJson,optionsName,startIndex,additionalSearchPropertiesJson)
 * See the tutorials on Github for one with a custom search context search function.
 *
 * @param {function} searchHandler - Your custom search handler function. Your function MUST invoke context.resultsPublisher, context.facetsPublisher and/or context.valuesPublisher.
 */
mljs.prototype.searchcontext.prototype.customEndpoint = function(searchHandler) {
  this._searchEndpoint = "custom";
  this._lastSearchFunction = "custom";
  this._customEndpointFunction = searchHandler;
};

/**
 * Sets the format to use. If not specified, defaults to json
 *
 * @param {string} format - The format to use (json or xml)
 */
mljs.prototype.searchcontext.prototype.setFormat = function(f) {
  this.format = f;
};

/**
 * Sets the collection to restrict search results by on the fly. See GET /v1/search
 *
 * @param {string} col - the collection name, or comma delimited collection names, to restrict the search results to
 */
mljs.prototype.searchcontext.prototype.setCollection = function(col) {
  this.collection = col;
};

/**
 * Restricts search results by the directory a document is within. See GET /v1/search
 *
 * @param {string} dir - Directory base uri
 */
mljs.prototype.searchcontext.prototype.setDirectory = function(dir) {
  this.directory = dir;
};

/**
 * Sets to options object to use. By default on V6 this will be persisted to the server.
 * In V7 this will be passed on the fly to MarkLogic.
 *
 * @param {string} name - The name of the options object to manage
 * @param {JSON} options - The REST API JSON search options object to use, or the MLJS search options builder object. (For caching for later modification or introspection. E.g. to use for translating facet values to human readable text)
 */
mljs.prototype.searchcontext.prototype.setOptions = function(name,options) {
  this.optionsName = name;
  var ob = null;
  if (undefined != options.toJson) {
    this.__d("searchcontext.setOptions: Got an options builder instead of options JSON");
    // is an options builder object
    ob = options;
    options = ob.toJson();
  }
  this._optionsbuilder = ob;
  this._options = {options: options};
  if (undefined != options.options) {
    this._options = options; // no object wrapper
  }
  this.optionsExist = false;

  this.defaultSort = this._options.options["sort-order"];

  this.optionsPublisher.publish(this._options.options);

  this.structuredContrib = {}; // setting named children so using JSON

  // TODO support V7 dynamic query options capability rather than always saving

  // check if options exist
  var self = this;
};

/**
 * If setOptions was passed an options builder instance instead of a JSON REST API options object, this function will return the options builder object.
 * This is useful when you want to introspect the options. E.g. to translate facet values to human readable text.
 */
mljs.prototype.searchcontext.prototype.getOptionsBuilder = function() {
  return this._optionsbuilder;
};

/**
 * Returns the raw options JSON object.
 */
mljs.prototype.searchcontext.prototype.getOptions = function() {
  // bit of clever mixin work as we no longer have an options builder reference here
  var opts = this._options;
  opts._findConstraint = function(cname) {

  var con = null;

  for (var i = 0, max = opts.options.constraint.length, c;i < max;i++) {
    c = opts.options.constraint[i];

    if (c.name == cname) {
      return c;
    }
  }

  return null;
  };
  return opts;
};

/**
 * Sets the default query. Should be set to non blank, E.g. "sort:relevance"
 *
 * @param {string} defQuery - Default string query to use
 */
mljs.prototype.searchcontext.prototype.setDefaultQuery = function(defQuery) {
  this.defaultQuery = defQuery;
  if (null == this.simplequery || undefined == this.simplequery || "".equals(this.simplequery.trim())) {
    this.simpleQueryPublisher.publish(this.defaultQuery); // don't search yet though
  } else {
    this.simpleQueryPublisher.publish(this.simplequery);
  }
};

/**
 * Sets the underlying mljs connection to use
 *
 * @param {mljs} connection - The mljs connection instance to use.
 */
mljs.prototype.searchcontext.prototype.setConnection = function(connection) {
  this.db = connection;
};

/**
 * Registers a search widget (visual or not) to this context.
 *
 * @param {object} searchWidget - The widget to register with this context. Will be introspected by this function.
 */
mljs.prototype.searchcontext.prototype.register = function(searchWidget) {
  // introspect widget for update functions
  if ('function' === typeof(searchWidget.setSearchContext)) {
    searchWidget.setSearchContext(this);
  }
  if ('function' === typeof(searchWidget.updatePage)) {
    this.resultsPublisher.subscribe(function (results) {searchWidget.updatePage(results);});
  }
  if ('function' === typeof(searchWidget.updateResults)) {
    this.resultsPublisher.subscribe(function (results) {searchWidget.updateResults(results);});
  }
  if ('function' === typeof(searchWidget.updateSort)) {
    this.sortPublisher.subscribe(function (sort) {searchWidget.updateSort(sort);});
  }
  if ('function' === typeof(searchWidget.updateSimpleQuery)) {
    this.simpleQueryPublisher.subscribe(function (q) {searchWidget.updateSimpleQuery(q);});
  }
  if ('function' === typeof(searchWidget.updateFacets)) {
    this.resultsPublisher.subscribe(function (results) {searchWidget.updateFacets(results);});
  }
  if ('function' === typeof(searchWidget.updateOptions)) {
    this.optionsPublisher.subscribe(function (options) {searchWidget.updateOptions(options);});
  }
  if ('function' === typeof(searchWidget.updateDocumentSelection)) { // from document context
    this.selectionPublisher.subscribe(function (selectionArray) {searchWidget.updateDocumentSelection(selectionArray);});
  }
  if ('function' === typeof(searchWidget.updateResultHighlight)) {
    this.highlightPublisher.subscribe(function (selectionArray) {searchWidget.updateResultHighlight(selectionArray);});
  }
  if ('function' === typeof(searchWidget.updateResultSelection)) {
    this.selectionPublisher.subscribe(function (selectionArray) {searchWidget.updateResultSelection(selectionArray);});
  }
  if ('function' === typeof(searchWidget.updateValues)) {
    this.valuesPublisher.subscribe(function (values) {searchWidget.updateValues(values);});
  }
  if ('function' === typeof(searchWidget.updateSuggestions)) {
    this.suggestionPublisher.subscribe(function (suggestions) {searchWidget.updateSuggestions(suggestions);});
  }
  var self = this;
  if ('function' === typeof(searchWidget.addSortListener)) {
    searchWidget.addSortListener(function (sort) {self.updateSort(sort);});
  }
  if ('function' === typeof(searchWidget.addFacetSelectionListener)) {
    searchWidget.addFacetSelectionListener(function (facet) {self.updateFacets(facet);});
  }
  if ('function' === typeof(searchWidget.addPageListener)) {
    searchWidget.addPageListener(function (page) {self.updatePage(page);});
  }
  if ('function' === typeof(searchWidget.addResultSelectionListener)) {
    searchWidget.addResultSelectionListener(function (selection) {self.updateSelection(selection);});
  }
  if ('function' === typeof(searchWidget.addResultHighlightListener)) {
    searchWidget.addResultHighlightListener(function (highlight) {self.updateHighlight(highlight);});
  }
  if ('function' === typeof(searchWidget.addGeoSelectionListener)) {
    // contribute term to query
    searchWidget.addGeoSelectionListener(function(selection){self.updateGeoSelection(selection);});
  }
};

mljs.prototype.searchcontext.prototype._parseQuery = function(q) {
  this.__d("searchcontext._parseQuery: q: " + q + " type: " + (typeof q));
  var text = "";
  var facets = new Array();
  var sort = null;
  var parts = q.trim().split(" "); // handles spaces in facet values
  for (var i = 0;i < parts.length;i++) {
    this.__d("searchcontext._parseQuery: parts[" + i + "]: " + parts[i]);
    var newIdx = i;
    var colonQuote = parts[i].indexOf(":\"");
    var finalQuote = parts[i].indexOf("\"",colonQuote + 2);
    this.__d("searchcontext._parseQuery: colonQuote: " + colonQuote + ", finalQuote: " + finalQuote);
    // We have found a start quote
    if (-1 != colonQuote && -1 == finalQuote) { // found first quote without end quote
      do {
        newIdx++;
        if (undefined != parts[newIdx]) {
          parts[i] = parts[i] + " " + parts[newIdx];
        }
      } while (newIdx < parts.length && parts[newIdx].indexOf("\"") != parts[newIdx].length - 1); // find the end quote before continuing
      this.__d("searchcontext._parseQuery: parts[" + i + "] now: " + parts[i]);
    }
      if (0 == parts[i].indexOf(this.sortWord + ":")) {
        sort = parts[i].substring(5);
      } else if (-1 != parts[i].indexOf(":")) {
        this.__d("searchcontext._parseQuery: FOUND A FACET IN QUERY: " + parts[i]);
        var fv = parts[i].split(":");
        if (fv.length > 2) {
          // value contains : so combine
          for (var fvi = 2;fvi < fv.length;fvi++) {
            fv[1] += ":" + fv[fvi];
          }
        }
        this.__d("searchcontext._parseQuery: Facet name: " + fv[0] + " value: " + fv[1]);
        if (0 == fv[1].indexOf("\"")) {
          fv[1] = fv[1].substring(1);
          if ((fv[1].length - 1) == fv[1].indexOf("\"")) {
            fv[1] = fv[1].substring(0,fv[1].length-1);
          }
        }
        this.__d("searchcontext._parseQuery: Facet info now name: " + fv[0] + " value: " + fv[1]);
        var found = false;
        for (var f = 0;f < facets.length;f++) {
          this.__d("searchcontext._parseQuery:  - testing FACET: " + facets[f].name + " = " + facets[f].value);
          if (facets[f].name == fv[0] && facets[f].value == fv[1]) {
            // mark as found so we don't add this again as a facet. NB multiples for same facet are allowed, but not multiples of same facet value
            this.__d("searchcontext._parseQuery:  - facets match, marking as found");
            found = true;
          }
        }
        if (!found) {
          facets.push({name: fv[0], value: fv[1]});
        }

    } else {
      if ("" != text) {
        text += " ";
      }
      text += parts[i];
    }
    i = newIdx;
  }
  var last = {q: text.trim(),facets: facets,sort: sort};
  this.lastParsed = last;
  return last;
};


mljs.prototype.searchcontext.prototype._queryToText = function(parsed) {
  var q = "" + parsed.q;
  if (null != parsed.sort) {
    q += " " + this.sortWord + ":" + parsed.sort;
  }
  for (var i = 0;i < parsed.facets.length;i++) {
    if (i > 0 || q.length > 0) {
      q += " ";
    }
    if (undefined != parsed.facets[i]) { // possible somehow. Not sure how.
      q += parsed.facets[i].name + ":\"" + parsed.facets[i].value + "\"";
    }
  }
  return q;
};

/**
 * Fetches suggestions based on the currently used options and the specified query
 *
 * @param {string} q - The partial query to suggest completion for
 * @param {json} additional_properties_opt - Any extra properties. E.g. q, limit,cursor-position
 */
mljs.prototype.searchcontext.prototype.doSuggest = function(q,additional_properties_opt) {
  var self = this;
  this.db.suggest(q,this.optionsName,additional_properties_opt,function(result){self._callbackOrDiscard(result,function(result) {
    self.suggestionPublisher.publish(result.doc);
  },self._nextRequestId++)});
};

mljs.prototype.searchcontext.prototype._callbackOrDiscard = function(data,callback,requestId) {
  if (this._nextRequestId - requestId != 1) {
    // old request
    // discard request (and discard associated promise)
    this.__d("searchcontext._callbackOrDiscard: Discarding old callback. It's requestId: " + requestId + ", nextRequestId: " + this._nextRequestId);
  } else {
    callback(data,requestId);
  }
};

/**
 * Generate a promise for use with frameworks like Angular JS. This method should be called prior to
 * any individual method that fires a search from a context. Note: Caller MUST use the object returned
 * by this function, which is a proxy for the underlying search context, rather than call this method
 * then another on the search context. I.e. use chaining like sc.promise().doStructuredQuery(...)
 *
 * @see {https://github.com/kriskowal/uncommonjs/blob/master/promises/specification.md}
 *
 * @param {object} prom - Promise object with notify, resolve, reject
 */
mljs.prototype.searchcontext.prototype.promise = function(prom) {
  var reqId = 0;
  var self = this;
  var retProm = function(retObject,requestId) {
    if (true === retObject) {
      return;
    }
    // this next line is the important promise magic part
    if (reqId != requestId) {
      self.__d("searchcontext.promise: Dropping return call - promiseId: " + reqId + ", requestId: " + requestId);
      return;
    }
    this.resultsPublisher.unsubscribe(retProm);
    this.valuesPublisher.unsubscribe(retProm);
    this.suggestionPublisher.unsubscribe(retProm);

    if (false === retObject) {
      prom.reject(retObject);
    } else {
      prom.resolve(retObject);
    }
  };

  this.resultsPublisher.subscribe(retProm);
  this.valuesPublisher.subscribe(retProm);
  this.suggestionPublisher.subscribe(retProm);

  return {
    doStructuredQuery: function(args) {
      reqId = self._nextRequestId;
      self.doStructuredQuery.apply(self, arguments);
    }, doCombinedQuery: function(args) {
      reqId = self._nextRequestId;
      self.doCombinedQuery.apply(self, arguments);
    }, contributeStructuredQuery: function(args) {
      reqId = self._nextRequestId;
      self.contributeStructuredQuery.apply(self, arguments);
    }, updateGeoHeatmap: function(args) {
      reqId = self._nextRequestId;
      self.updateGeoHeatmap.apply(self, arguments);
    }, updateGeoSelection: function(args) {
      reqId = self._nextRequestId;
      self.updateGeoSelection.apply(self, arguments);
    }, doSimpleQuery: function(args) {
      reqId = self._nextRequestId;
      self.doSimpleQuery.apply(self, arguments);
    }, deselectFacet: function(args) {
      reqId = self._nextRequestId;
      self.deselectFacet.apply(self, arguments);
    }, contributeFacet: function(args) {
      reqId = self._nextRequestId;
      self.contributeFacet.apply(self, arguments);
    }, contributeFacets: function(args) {
      reqId = self._nextRequestId;
      self.contributeFacets.apply(self, arguments);
    }, updateFacets: function(args) {
      reqId = self._nextRequestId;
      self.updateFacets.apply(self, arguments);
    }, updateSelection: function(args) {
      reqId = self._nextRequestId;
      self.updateSelection.apply(self, arguments);
    }, updateHighlight: function(args) {
      reqId = self._nextRequestId;
      self.updateHighlight.apply(self, arguments);
    }, updatePage: function(args) {
      reqId = self._nextRequestId;
      self.updatePage.apply(self, arguments);
    }, updateSort: function(args) {
      reqId = self._nextRequestId;
      self.updateSort.apply(self, arguments);
    }
  };
};


/**
 * Performs a structured query against this search context.
 *
 * @param {json} q - The structured query JSON representation
 * @param {integer} start - The start index (result number), starting at 1
 */
mljs.prototype.searchcontext.prototype.doStructuredQuery = function(q,start) {
  var self = this;

  this._lastSearchFunction = "structured";

  this._doQuery(q,null,null,start,null);
};
mljs.prototype.searchcontext.prototype.dostructuredquery = mljs.prototype.searchcontext.prototype.doStructuredQuery; // backwards compatibility

mljs.prototype.searchcontext.prototype.doCombinedQuery = function(structured,text,optionsdoc,start_opt) {
  this._lastSearchFunction = "combined";
  this._doQuery(structured,text,optionsdoc,start_opt,"combined");
};

mljs.prototype.searchcontext.prototype._doQuery = function(structured_opt,text_opt,optionsdoc_opt,start_opt,endpoint_override_opt) {
  var self = this;

  var ourstart = 1;
  if (0 != start_opt && undefined != start_opt) {
    ourstart = start_opt;
  }
  this.__d("searchcontext._doQuery: " + JSON.stringify(structured_opt) + ", ourstart: " + ourstart);

  var structuredF = function() {
      self.resultsPublisher.publish(true); // forces refresh glyph to show
      self.facetsPublisher.publish(true);

      self.db.structuredSearch(structured_opt,self.optionsName,{start: ourstart},function(result){self._callbackOrDiscard(result,function(result,requestId) {
        if (result.inError) {
          // report error on screen somewhere sensible (e.g. under search bar)
          self.__d(result.error);
          self.resultsPublisher.publish(false); // hides refresh glyth on error
          self.facetsPublisher.publish(false); // hides refresh glyth on error
        } else {
          self.resultsPublisher.publish(result.doc);
          self.facetsPublisher.publish(result.doc.facets);
        }
      },self._nextRequestId++)});
  };
  var valuesF = function() {
      self.valuesPublisher.publish(true);
      for (var i = 0;i < self._tuples.length;i++) {
        self.db.values(structured_opt,self._tuples[i],self.optionsName,null,function(result){self._callbackOrDiscard(result,function(result,requestId) {
          if (result.inError) {
            // report error on screen somewhere sensible (e.g. under search bar)
            self.__d(result.error);
            self.valuesPublisher.publish(false); // hides refresh glyth on error
          } else {
            self.valuesPublisher.publish(result.doc);
          }
        },self._nextRequestId++)});
      }

  };
  var combinedF = function() {
      self.resultsPublisher.publish(true); // forces refresh glyph to show
      self.facetsPublisher.publish(true);
      self.db.combined(structured_opt,text_opt,self._options,{start: ourstart},function(result){self._callbackOrDiscard(result,function(result,requestId) {
        if (result.inError) {
          // report error on screen somewhere sensible (e.g. under search bar)
          self.__d(result.error);
          self.resultsPublisher.publish(false); // hides refresh glyth on error
          self.facetsPublisher.publish(false); // hides refresh glyth on error
        } else {
          self.resultsPublisher.publish(result.doc);
          self.facetsPublisher.publish(result.doc.facets);
        }
      },self._nextRequestId++)});
  };
  var customF = function() {
      // custom endpoint - must perform all valuesPublisher and resultsPublisher calls itself!!!
      self._customEndpointFunction(self,null, q, self.optionsName, 1, null); // TODO make it support promises
  };

  var dos = function() {
    // check override first
    console.log("endpoint_override_opt: " + endpoint_override_opt);
    console.log("self._searchEndpoint: " + self._searchEndpoint);
    if (undefined != endpoint_override_opt) {
      if ("search" == endpoint_override_opt) {
        structuredF();
      } else if ("values" == endpoint_override_opt) { // values()
        valuesF();
      } else if ("combined" == endpoint_override_opt) {
        combinedF();
      } else if ("custom" == endpoint_override_opt) {
        customF();
      } else {
        throw new TypeError("searchcontext._doQuery: endpoint_override_opt must be 'values', 'combined' or 'custom'");
      }
    } else {
      // now check endpoint
      if ("search" == self._searchEndpoint) {
        structuredF();
      } else if ("values" == self._searchEndpoint) { // values()
        valuesF();
      } else if ("combined" == self._searchEndpoint) {
        combinedF();
      } else if ("custom" == self._searchEndpoint) {
        customF();
      } else {
        throw new TypeError("searchcontext._doQuery: searchEndpoint must be 'values', 'combined' or 'custom'");
      }
    }
  };

  this._persistAndDo(dos);
};

/**
 * For situations where many objects are contributing top level structured query terms that need AND-ing together.
 *
 * NOTE: queryTerm needs to be the result of queryBuilder.toJson().query[0] and not the top level query JSON itself - i.e. we need a term, not a full query object.
 *
 * @param {string} contributor - Unique name of the contributor (to prevent clashes)
 * @param {json|text} queryTerm - The query JSON for the REST API (E.g. an and-query instance). If text this function will do a combined query (V7) or add as a term query (V6)
 * @param {integer} start_opt - The optional first result to show (defaults to 1)
 */
mljs.prototype.searchcontext.prototype.contributeStructuredQuery = function(contributor,queryTerm,start_opt) {
  var qb = this.db.createQuery();

  var self = this;
  var calcTerms = function() {
    // build structure query from all terms
    var terms = new Array();
    for (var cont in self.structuredContrib) {
      self.__d("searchcontext.contributeStructuredQuery: Adding contribution from: " + cont);
      //if ("object" == typeof this.structuredContrib[cont]) {
      if (null != self.structuredContrib[cont]) {
        terms.push(self.structuredContrib[cont]);
      }
      //}
    }
    // execute structured query
    qb.query(qb.and(terms));

    return qb.toJson();
  };
  var doit = function() {
    var terms = calcTerms();
    //var allqueries = { query: {"and-query": terms}}; // TODO replace with query builder
    self.doStructuredQuery(terms,start_opt);
  };

  if (null == queryTerm || undefined == queryTerm) {
    self.__d("searchcontext.contributeStructuredQuery: Removing query term from contributor: " + contributor);
    this.structuredContrib[contributor] = undefined; // removes contribution to the query
    doit();
  } else {
    if ("string" == typeof(queryTerm)) {
      this.db.v7check(function() {
        // v6 func
        if ("" == queryTerm.trim()) {
          queryTerm = qb.and();
        } else {
          queryTerm = qb.term(queryTerm);
        }
        self.structuredContrib[contributor] = qb.term(queryTerm);
        doit();
      },
      function() {
        // v7 func
        var terms = calcTerms();
        // force combined query
        self.doCombinedQuery(terms,queryTerm,self._options,start_opt);
      });
      // determine whether V6 or V7
    } else {
    self.__d("searchcontext.contributeStructuredQuery: Setting query term from contributor: " + contributor + " to " + JSON.stringify(queryTerm));
      this.structuredContrib[contributor] = queryTerm;
      doit();
    }
  }
};

/**
 * Updates a geospatial searches heatmap configuration using the provided heatmap JSON configuration
 *
 * @param {string} constraint_name - The name of the constraint whose heatmap should be changed
 * @param {json} heatmap - The REST API heatmap configuration
 */
mljs.prototype.searchcontext.prototype.updateGeoHeatmap = function(constraint_name,heatmap) {

    // copy heatmap information in to search options
    var con = null;
    if (undefined == this._options || undefined == this._options.options || undefined == this._options.options.constraint) {
      return;
    }

    for (var i = 0, max = this._options.options.constraint.length;i < max && null == con;i++) {
      con = this._options.options.constraint[i];
      if (con.name == constraint_name) {
        // do nothing
      } else {
        con = null;
      }
    }
    if (null != con) {
      // found named constraint - now alter heatmap description
      if (undefined != con["geo-elem"]) {
        con["geo-elem"].heatmap = heatmap;
      } else if (undefined != con["geo-elem-pair"]) {
        con["geo-elem-pair"].heatmap = heatmap;
      } else if (undefined != con["geo-attr-pair"]) {
        con["geo-attr-pair"].heatmap = heatmap;
      } else if (undefined != con["geo-path"]) {
        con["geo-path"].heatmap = heatmap;
      }
    }

    // force save of options
    this.optionsExist = false;

    // perform search
  var qb = this.db.createQuery();
  this.contributeStructuredQuery("__heatmap",qb.and([]));
};

/**
 * Updates the selected area, be it a radius, polugon, or bounding box (or indeed empty - null)
 *
 * @param {JSON} selection - The JSON area selection object {contributor: "somename", type: "circle|polygon|box|null", "constraint_name": "name", box: {north:, south: , east:,  west:}, polygon: polygon-config, latitude: ,longitude: , radiusmiles: , heatmap: heatmap-json}
 */
mljs.prototype.searchcontext.prototype.updateGeoSelection = function(selection) {
  // create term and contribute to query
  var cont = selection.contributor;
  var qb = this.db.createQuery();

  var term = null;
  if ("circle" == selection.type) {
    term = qb.georadius(selection["constraint-name"],selection.latitude,selection.longitude,selection.radiusmiles); // TODO evaluate whether this should be inside a 'circle' json object
  } else {
    // TODO other types - bounding box and polygon
    if ("polygon" == selection.type) {
      term = qb.geoPolygon(selection["constraint-name"],selection.polygon);
    } else if ("box" == selection.type) {
      term = qb.geoBox(selection["constraint-name"],selection.box.north,selection.box.east,selection.box.south,selection.box.west);
    } else if (null == selection.type) {
      term = null;
    }
  }

  // alter search options first, as required
  if (undefined != selection.heatmap) { // n,s,e,w,latdivs,londivs
    this.updateGeoHeatmap(selection["constraint-name"],selection.heatmap);
  }

  var self = this;
  this._persistAndDo(function() {self.contributeStructuredQuery(cont,term)});
};

/**
 * Fires a simple query as specified, updating all listeners when the result is returned.
 *
 * @param {string} q - The simple text query using the grammar in the search options
 * @param {integer} start - The start index (result number), starting at 1
 */
mljs.prototype.searchcontext.prototype.doSimpleQuery = function(q,start) {
  if (null == q || undefined == q) {
    q = this.defaultQuery; // was ""
  }
  this._lastSearchFunction = "simple";


  var self = this;

  var ourstart = 1;
  if (0 != start && undefined != start) {
    ourstart = start;
  }

  // cleanse query value first
  this.__d("Query before: '" + q + "'");

  var parsed = self._parseQuery(q);

  this.__d("Query parsed: '" + JSON.stringify(parsed) + "'");
  var cq = self._queryToText(parsed);
  q = cq;
  this.__d("Query after: '" + cq + "'");

  // check for blank
  if ("" == cq.trim()) {
    this.simplequery = this.defaultQuery;
  } else {
    this.simplequery = cq;
  }

  this.simpleQueryPublisher.publish(this.simplequery);

  self.facetsPublisher.publish(parsed.facets);

  var dos = function() {
    // fetch results (and update facets, sort)
    var sprops = {};
    if (null != self.collection) {
      sprops.collection = self.collection;
    }
    if (null != self.directory) {
      sprops.directory = self.directory;
    }
    if (null != self.transform) {
      sprops.transform = self.transform;
      sprops.transformParameters = self.transformParameters;
    }
    if (null != self.format) {
      sprops.format = self.format;
    }

    if ("search" == self._searchEndpoint) {
      self.resultsPublisher.publish(true); // forces refresh glyph to show
      self.facetsPublisher.publish(true);
      self.db.search(q,self.optionsName,ourstart,sprops,function(result){self._callbackOrDiscard(result,function(result) {
        if (result.inError) {
          // report error on screen somewhere sensible (e.g. under search bar)
          self.__d(result.error);
          self.resultsPublisher.publish(false); // hides refresh glyth on error
          self.facetsPublisher.publish(false); // hides refresh glyth on error
        } else {
          self.resultsPublisher.publish(result.doc);
          self.facetsPublisher.publish(result.doc.facets);
        }
      },self._nextRequestId++)});
    } else if ("values" == self._searchEndpoint) { // values
      self.valuesPublisher.publish(true);
      for (var i = 0;i < self._tuples.length;i++) {
        self.db.values(q,self._tuples[i],self.optionsName,null,function(result){self._callbackOrDiscard(result,function(result) {
          if (result.inError) {
            // report error on screen somewhere sensible (e.g. under search bar)
            self.__d(result.error);
            self.valuesPublisher.publish(false); // hides refresh glyth on error
          } else {
            self.valuesPublisher.publish(result.doc);
          }
        },self._nextRequestId++)});
      }
    } else {
      // custom endpoint - must perform all valuesPublisher and resultsPublisher calls itself!!!
      self._customEndpointFunction(self,q, null, self.optionsName, ourstart || 1, sprops); // TODO support promises
    }
  };

  // check for options existance
  /*
  if (!this.optionsExist && "persist" == this.optionssavemode) {
    this.__d("searchbar: Saving search options prior to query");
    this.db.saveSearchOptions(this.optionsName,this._options,function(result) {
      if (result.inError) {
        self.__d("Exception saving results: " + result.details);
      } else {
        self.optionsExist = true; // to stop overwriting on subsequent requests
        dos();
      }
    });
  } else {
    dos();
  }*/

  this._persistAndDo(dos);

};
mljs.prototype.searchcontext.prototype.dosimplequery = mljs.prototype.searchcontext.prototype.doSimpleQuery; // backwards compatibility

/**
 * Update all listeners' results with the provided search results
 *
 * @param {json} msg - The results json (or true(result being refreshed) or false(results refresh failed) )
 */
mljs.prototype.searchcontext.prototype.updateResults = function(msg) {
  this.resultsPublisher.publish(msg);
};


mljs.prototype.searchcontext.prototype._persistAndDo = function(callback) {
  var self = this;
  var persistFunc = function() {
    // NB that.db._version MUST be set by now
   //if ("persist" == self.optionssavemode) { // REPLACED BY V7 CHECK IN CORE
    //self.db.searchoptions(this.optionsName,function(result) {
      //self.__d("RESULT: " + JSON.stringify(result.doc));
      //if (result.inError) {
      //  self.__d("Search options " + self.optionsName + " do not exist on the server. Search bar widget will auto create them on next search.");
      //  self.__d("ERROR: " + JSON.stringify(result.details));
      //} else {
        // no error, do nothing (dependant objects fetch options dynamically)
        // now save them
        self.__d("setOptions: saving search options: " + self.optionsName);
        if (self.optionsExist) {
          callback();
        } else {
          self.db.saveSearchOptionsCheck(self.optionsName,self._options,function(result) {
          if (result.inError) {
            self.__d("Error saving Search options " + self.optionsName);
          } else {
            self.optionsExist = true;
            self.__d("Saved Search options " + self.optionsName);

            callback();
          }
        });
      }
      //}
    //});
   //}
  };
  persistFunc();

};

/**
 * Specifies the sort word from the search options to use to sort the results on the next search
 *
 * @param {string} word - The sort option to use
 */
mljs.prototype.searchcontext.prototype.setSortWord = function(word) {
  this.sortWord = word;
};

/**
 * Add a results listener.
 *
 * @param {function} rl - Results listener to add
 */
mljs.prototype.searchcontext.prototype.addResultsListener = function(rl) {
  this.resultsPublisher.subscribe(rl);
};

/**
 * Remove a results listener
 *
 * @param {function} rl - The result listener function to remove.
 */
mljs.prototype.searchcontext.prototype.removeResultsListener = function(rl) {
  this.resultsPublisher.unsubscribe(rl);
};

/**
 * Adds a sort listener to this widget.
 *
 * @param {function} sl - The sort listener to add
 */
mljs.prototype.searchcontext.prototype.addSortListener = function(sl) {
  this.sortPublisher.subscribe(sl);
};

/**
 * Removes a sort listener
 *
 * @param {function} sl - The sort listener to remove
 */
mljs.prototype.searchcontext.prototype.removeSortListener = function(sl) {
  this.sortPublisher.unsubscribe(sl);
};

/**
 * Adds a facet listener to this widget. Normally you'd use a results listener instead in order to get more context.
 *
 * @param {function} fl - The Facet Listener to add
 */
mljs.prototype.searchcontext.prototype.addFacetsListener = function(fl) {
  this.facetsPublisher.subscribe(fl);
};

/**
 * Removes a facet listener
 *
 * @param {function} fl - The Facet Listener to remove
 */
mljs.prototype.searchcontext.prototype.removeFacetsListener = function(fl) {
  this.facetsPublisher.unsubscribe(fl);
};

/**
 * Adds an error listener to this widget
 *
 * @param {function} fl - The error listener to add
 */
mljs.prototype.searchcontext.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 *
 * @param {function} fl - The error listener to remove
 */
mljs.prototype.searchcontext.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};

/**
 * Deselects the specified facet, or facet value pair
 *
 * @param {string} facetName - The name of the facet to deselect
 * @param {string} facetValue_opt - The value to deselect. If undefined, all values of this facet are deselected.
 */
mljs.prototype.searchcontext.prototype.deselectFacet = function(facetName,facetValue_opt) {
  var newFacetSelection = new Array();
  for (var i = 0,fs;i < this._facetSelection.length;i++) {
    fs = this._facetSelection[i];
    if (fs.facetName == facetName) {
      if (undefined == facetValue_opt) {
        // don't add this facet to the new array
      } else {
        if (fs.facetValue = facetValue_opt) {
          // don't add
        } else {
          // keep it
          newFacetSelection.push(fs);
        }
      }
    } else {
      // keep it
      newFacetSelection.push(fs);
    }
  }
  this._facetSelection = newFacetSelection;

  this.updateFacets(this._facetSelection);
};

/**
 * Contributes a facet selection to the underlying query (simple or structured).
 *
 * @param {string} facetName - The name of the facet to contribute a selection for
 * @param {string} facetValue - The value selection to contribute
 */
mljs.prototype.searchcontext.prototype.contributeFacet = function(facetName,facetValue) {
  if (undefined == facetName || undefined == facetValue) {
    return;
  }
  this._facetSelection.push({name: facetName,value: facetValue});

  // rerun search
  this.updateFacets(this._facetSelection);
};

/**
 * Contributes an array of facet selections to the underlying query (simple or structured).
 *
 * @param {Array} facetArray - The facet values to restrict the search results by. [{name: "facetName", value: "facetValue"}, ... ]
 */
mljs.prototype.searchcontext.prototype.contributeFacets = function(facetArray) {
  if (undefined == facetArray) {
    return;
  }
  for (var i = 0, max = facetArray.length,facet;i < max;i++) {
    facet = facetArray[i];
    this._facetSelection.push(facet);
  }

  // rerun search
  this.updateFacets(this._facetSelection);
};


/**
 * Event target. Useful to call directly from a Search Facets widget upon selection of a facet value. Executes a new search.
 *
 * @param {Array} facetSelection - The facet values to restrict the search results by. [{name: "facetName", value: "facetValue"}, ... ]
 */
mljs.prototype.searchcontext.prototype.updateFacets = function(facetSelection) {
  if ("simple" == this._lastSearchFunction) {
    var parsed = this._parseQuery(this.simplequery);
    parsed.facets = facetSelection;

    var q = this._queryToText(parsed);

    this.dosimplequery(q);
  } else {
    // structured
    var qb = this.db.createQuery();

    // build query terms
    var terms = [];

    for (var i = 0;i < facetSelection.length;i++) {
      // check constraint type first!
      // find named facet's constraint
      // determine type
      // create relevant query
      var opts = this.getOptions();
      var con = opts._findConstraint(facetSelection[i].name);
      if (undefined != con["range"]) {
        // A. range constraint
        terms[i] = qb.range(facetSelection[i].name,facetSelection[i].value);
      } else if (undefined != con["collection"]) {
        // B. collection constraint
        terms[i] = qb.collection(facetSelection[i].value);
      } else {
        throw new Exception("Unknown constraint type for contributed facet: " + facetSelection[i].name + " , detail: " + JSON.stringify(con));
      }
      // TODO more constraint support - any others shown in facets???
    }

    this.contributeStructuredQuery("__facets",qb.and(terms));
  }
};

/**
 * Select the document specified. Depending upon the selection mode (append or replace) this will either
 * add the document to the selection, or replace the selection with this document. Useful for selecting
 * multiple search results over time (e.g. between pages of results).
 *
 * Fires an updateSelection event on selection listeners. (Only if the URI is not already selected)
 *
 * @param {json} resultSelection - The JSON object {mode: "append|replace", uri: "/some/uri"} for the selected document. Specifying null in replace mode clears the selection
 */
mljs.prototype.searchcontext.prototype.updateSelection = function(resultSelection) {
  if ("append" == resultSelection.mode) {
    // check doc is not already selected
    var found = false;
    for (var i = 0;i < this._selectedResults.length && !found;i++) {
      found = (this._selectedResults[i] == resultSelection.uri);
    }
    if (!found) {
      this._selectedResults.push(resultSelection.uri);
    }
  } else if ("replace" == resultSelection.mode) {
    this._selectedResults = new Array();
    if (null != resultSelection.uri) {
      this._selectedResults.push(resultSelection.uri);
    }
  } else {
    // should never happen
  }
  this.selectionPublisher.publish(this._selectedResults);
};

/**
 * Highlight the document specified. Depending upon the highlight mode (append or replace) this will either
 * add the document to the selection, or replace the selection with this document. Useful for selecting
 * multiple search results over time (e.g. between pages of results).
 *
 * Fires an updateSelection event on selection listeners. (Only if the URI is not already selected)
 *
 * @param {json} resultSelection - The JSON object {mode: "append|replace", uri: "/some/uri"} for the selected document. Specifying null in replace mode clears the selection
 */
mljs.prototype.searchcontext.prototype.updateHighlight = function(resultHighlight) {
  if ("append" == resultHighlight.mode) {
    // check doc is not already selected
    var found = false;
    for (var i = 0;i < this._highlightedResults.length && !found;i++) {
      found = (this._highlightedResults[i] == resultHighlight.uri);
    }
    if (!found) {
      this._highlightedResults.push(resultHighlight.uri);
    }
  } else if ("replace" == resultHighlight.mode) {
    this._highlightedResults = new Array();
    if (null != resultHighlight.uri) {
      this._highlightedResults.push(resultHighlight.uri);
    }
  } else {
    // should never happen
  }
  this.highlightPublisher.publish(this._highlightedResults);
};

/**
 * Event target. Useful to call directly from a search pager widget. Executes a new search
 * json = {show: number, start: number}
 *
 * @param {JSON} json - JSON representing the start result and the number of results to return per page.
 */
mljs.prototype.searchcontext.prototype.updatePage = function(json) {
  // example: {start: this.start, show: this.perPage}
  if (this._options.options["page-length"] != json.show) {
    this.optionsExist = false; // force re save of options
    this._options.options["page-length"] = json.show;
  }
  if ("simple" == this._lastSearchFunction) {
    this.dosimplequery(this.simplequery,json.start);
  } else {
    var qb = this.db.createQuery();
    this.contributeStructuredQuery("__page",qb.and([]),json.start);
  }
};

/**
 * Event Target. Useful for linking to a search sorter. Updates the sort word and executes a search.
 *
 * @param {JSON} sortSelection - The sort-order JSON object - E.g. {"json-key": year, direction: "ascending"}
 */
mljs.prototype.searchcontext.prototype.updateSort = function(sortSelection) {
  // remove any existing sort
  //this.simplequery += " " + this.sortWord + ":\"" + sortSelection + "\""; // move sort to query url param, not in grammar

  // alter options such that no update event is fired, but will be persisted
  if (undefined != sortSelection["json-key"] && "" == sortSelection["json-key"]) {
    //this._options.options["sort-order"] = [];
    this._options.options["sort-order"] = this.defaultSort;
  } else {
    this._options.options["sort-order"] = [sortSelection];
  }
  this.optionsExist = false; // force re save of options

  // now perform same query again
  this.dosimplequery(this.simplequery);
};

/**
 * Resets the search bar input box. Resets all dependant search results/facets/pager/sorters too.
 */
mljs.prototype.searchcontext.prototype.reset = function() {
  // clear search bar text
  // send update to results and facets and sort
  this.resultsPublisher.publish(null);
  this.facetsPublisher.publish(null); // verify this is the right element to send
  this.sortPublisher.publish(null); // order default sort
  this.simpleQueryPublisher.publish(this.defaultQuery);
};

/**
 * Returns a single metadata field value for the specified result and field.
 *
 * @param {json} result - REST API single search result
 * @param {string} fieldName - The field name to extract
 */
mljs.prototype.searchcontext.prototype.getMetadataValue = function(result,fieldName) {
  if (undefined == result.metadata) return null;
  for (var metai = 0, maxi = result.metadata.length, meta;metai < maxi;metai++) {
    meta = result.metadata[metai];
    //console.log("  meta instance: " + metai);
    for (var p in meta) {
      //console.log("    found param: " + param);
      // find our one
      // NB may be multiple of them - TODO support more than just last found
      if (p == fieldName) {
        //console.log("      found latsrc constraint param");
        return meta[p];

      }
    }
  }
  return null;
};

/**
 * Returns all metadata field values for the specified result and field.
 *
 * @param {json} result - REST API single search result
 * @param {string} fieldName - The field name to extract values for
 */
mljs.prototype.searchcontext.prototype.getMetadataValues = function(result,fieldName) {
  if (undefined == result.metadata) return null;
  var values = new Array();
  for (var metai = 0, maxi = result.metadata.length, meta;metai < maxi;metai++) {
    meta = result.metadata[metai];
    //console.log("  meta instance: " + metai);
    for (var p in meta) {
      //console.log("    found param: " + param);
      // find our one
      // NB may be multiple of them - TODO support more than just last found
      if (p == fieldName) {
        //console.log("      found latsrc constraint param");
        //return meta[p];
        values.push(meta[p]);
      }
    }
  }
  if (0 == values.length) {
    return null;
  } else {
    return values;
  }
};








/**
 * Class that wraps default text to query part parsing. Used by search context to extract facet and sort information from text query, and to fix bad text queries.
 * @constructor
 */
mljs.prototype.searchcontext.defaultparser = function(config) {
  this._config = config; // E.g. sort word
  this._root = new this.container("AND",[]);
};

/**
 * Use default grammar to parse this query string
 */
mljs.prototype.searchcontext.defaultparser.prototype.parse = function(q) {
  // go from L to R, checking for quotes and parenthesese as we go
  // if mid string, check for colon
  // check for end of value
  // TODO handle (A AND B AND C AND D) as single and, not multiple - i.e. not as (((A AND B) AND C) AND D) - same for OR and NOT
  // check if sort word encountered, otherwise is facet word
  // return set of top level clause wrappers
};




// OR, AND, NOT, (
mljs.prototype.searchcontext.defaultparser.prototype.container = function(type,children) {
  this._type = type;
  this._clauses = children;
};

mljs.prototype.searchcontext.defaultparser.prototype.container.prototype.toString = function() {
  // return string representation - NOTE Containers manage 1 parenthesis pair themselves
  var s = "";
  //if ("(" == this._type) {
    s += "(";
  //}

  // now for AND and OR and NOT
  for (var i = 0, max = this._clauses.length,clause;i < max;i++) {
    clause = this._clauses[i];
    if (i > 0) {
      s += " ";
    }
    s += clause.toString();
    if ("(" != this._type && i < (max - 1)) {
      s += " " + this._type;
    }
  }

  //if ("(" == this._type) {
    s += ")";
  //}
  return s;
};

mljs.prototype.searchcontext.defaultparser.prototype.container.prototype.append = function(clause) {
  this._clauses.push(clause);
};

mljs.prototype.searchcontext.defaultparser.prototype.container.prototype.getChildren = function() {
  return this._clauses;
};

mljs.prototype.searchcontext.defaultparser.prototype.container.prototype.getType = function() {
  return this._type;
};



mljs.prototype.searchcontext.defaultparser.prototype.near = function(distance,lhs,rhs) {
  this._left = lhs;
  this._right = rhs;
  this._distance = distance;
};

mljs.prototype.searchcontext.defaultparser.prototype.near.prototype.toString = function() {
  // return string representation
  return "(" + this._left + " NEAR/" + this._distance + " " + this._right + ")";
};

mljs.prototype.searchcontext.defaultparser.prototype.near.prototype.getLeft = function() {
  return this._left;
};

mljs.prototype.searchcontext.defaultparser.prototype.near.prototype.getRight = function() {
  return this._right;
};

mljs.prototype.searchcontext.defaultparser.prototype.near.prototype.getDistance = function() {
  return this._distance;
};




mljs.prototype.searchcontext.defaultparser.prototype.phrase = function(text) {
  this._text = text; // note: assumes text doesn't have "around it"
};

mljs.prototype.searchcontext.defaultparser.prototype.phrase.prototype.toString = function() {
  // return string representation
  return "\"" + this._text + "\"";
};

mljs.prototype.searchcontext.defaultparser.prototype.phrase.prototype.getText = function() {
  return this._text;
};



/**
 * Matches a fixed constraint value
 */
mljs.prototype.searchcontext.defaultparser.prototype.value = function(constraint_name,value) {
  this._constraint = constraint_name;
  this._value = value; // assumes no quotes
};

mljs.prototype.searchcontext.defaultparser.prototype.value.prototype.toString = function() {
  return this._constraint + ":\"" + this._value + "\"";
};

mljs.prototype.searchcontext.defaultparser.prototype.value.prototype.getConstraint = function() {
  return this._constraint;
};

mljs.prototype.searchcontext.defaultparser.prototype.value.prototype.getValue = function() {
  return this._value;
};





mljs.prototype.searchcontext.defaultparser.prototype.range = function(constraint_name,lowerBound,lowerBoundType,upperBound,upperBoundType) {
  this._constraint = constraint_name;
  this._lowerBound = lowerBound;
  this._lowerBoundType = lowerBoundType;
  this._upperBound = upperBound;
  this._upperBoundType = upperBoundType;
};

mljs.prototype.searchcontext.defaultparser.prototype.range.prototype.getConstraint = function() {
  return this._constraint;
};

mljs.prototype.searchcontext.defaultparser.prototype.range.prototype.getLowerBound = function() {
  return this._lowerBound;
};

mljs.prototype.searchcontext.defaultparser.prototype.range.prototype.getLowerBoundType = function() {
  return this._lowerBoundType;
};

mljs.prototype.searchcontext.defaultparser.prototype.range.prototype.getUpperBound = function() {
  return this._upperBound;
};

mljs.prototype.searchcontext.defaultparser.prototype.range.prototype.getUpperBoundType = function() {
  return this._upperBoundType;
};






/*
 * Relationships for content:-
 *  - http://marklogic.com/semantic/ontology/derived_from (graph as subject)
 *  - http://marklogic.com/semantic/ontology/defined_by (any entity as subject where triples were extracted)
 *
 */






/**
 * Holds configuration for object to triple mappings, and ontology information.
 * Has methods for easily building an ontology for use with MLJS widgets and semantic contexts.
 *
 * @constructor
 * @deprecated Instead use var db = new mljs(); db.createTripleConfig();
 */
com.marklogic.semantic.tripleconfig = function() {
  this.errorPublisher = new com.marklogic.events.Publisher();

  // TODO drastically simplify this data model

  //this.entities = new Array();

  this.validTriples = new Array();

  //this._predicates = new Array();

  // own extensions - need ontology somewhere for this!

  //this._predicatesShort = new Array();

  //this._iriPatterns = new Array();

  //this._rdfTypes = new Array();

  //this._rdfTypesShort = new Array();

  //this._commonNamePredicates = new Array();

  //this._properties = new Array(); // TODO other common properties, alpha order by name value

  // ANYTHING PAST THIS POINT IS REFACTORED AND AWESOME

  this._newentities = new Array(); // [name] => {name: "person", prefix: "http://xmlns.com/foaf/0.1/", iriPattern:, rdfTypeIri: , rdfTypeIriShort: , commonNamePredicate:
  // ..., properties: [{},{}, ...] }

  this._newPredicates = new Array(); // [commonname] => {iri: , iriShort: }

  // also keep _validTriples as-is

  // defaults
  this.addFoaf();
  this.addMarkLogic();
  this.addPlaces();
  this.addFoafPlaces();
  this.addOpenCalais();
  //this.addTest();
  this.addMovies();
};

/**
 * Adds an error listener to this widget
 *
 * @param {function} fl - The error listener to add
 */
com.marklogic.semantic.tripleconfig.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 *
 * @param {function} fl - The error listener to remove
 */
com.marklogic.semantic.tripleconfig.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};

/**
 * Adds a new set of semantic objects to this configuration
 *
 * @param {string} mapname - The unique name in this configuration for this entity
 * @param {json} entityJson - The Entity JSON
 * @param {Array} namedPredicateArray - An array with names (not integers) as position markers, with JSON predicate information
 * @param {Array} validTriplesArray - Any new triples associated with just this entity class (E.g. valid relationships between People) as JSON valid triples
 */
com.marklogic.semantic.tripleconfig.prototype.addMappings = function(mapname,entityJson,namedPredicateArray,validTriplesArray) {
  this._newentities[mapname] = entityJson;
  for (var i = 0;i < validTriplesArray.length;i++) {
    this.validTriples.push(validTriplesArray[i]);
  }
  for (var predname in namedPredicateArray) {
    //console.log("PREDNAME: " + predname);
    if ("object" == typeof namedPredicateArray[predname]) { // check this is a JSON object, not a function
      //console.log("ADDING PREDNAME: " + predname);
      this._newPredicates[predname] = namedPredicateArray[predname];
    }
  }
};

/**
 * Loads the ontology (mappings) from a SPARQL result set. Called by semantic context on initialisation.
 *
 * @param {mljs.SparqlResults} results - The SPARQL response as a JSON document.
 */
com.marklogic.semantic.tripleconfig.prototype.loadOntologyFromSparqlResults = function(results, defaults) {
  if (false === defaults) {
    // clear classes from configuration before proceeding
    this._newentities = new Array();
    this._newPredicates = new Array();
    this.validTriples = new Array();
  }

  var types = {}; // rdftype -> rdftype instance
  var properties = {} // rdftypeiri -> {domain: applicable class, range: to value class}
  var parentclasses = {}; // rdfsubtypeiri -> Array["parentclassiri1",...]
  var parentproperties = {}; // rdfsubpropertyiri -> Array["parentproperty1",...]
  var labelproperties = {} // rdfpropertyiri string -> true
  var classes = {}; // classiri -> true
  var classlabels = {}; // classiri -> labelprediri
  var predicates = {}; // rdftypeiri@@@predicateiri -> predicate instance
  var predinfo = {}; // rdfprdicateiri -> {title: ?}
  //  create JSON representation of all RDFS classes, their labels, and members
  if (undefined != results.head && undefined != results.head.vars && undefined != results.results) {
    this.__d("tripleconfig.loadOntologyFromSparqlResults: Found some results");
    // get list of entities returned in search
    var entities = results.head.vars; // E.g. person, organisation - these are the returned variable bindings from the query
    // s p o g for us

    // process results, showing common information where appropriate
      // title - get name eventually
      var s,p,o,g;
      var bindings = results.results.bindings;
      for (var b = 0,max = bindings.length, binding;b < max;b++) {
        binding = results.results.bindings[b];
        if (binding.p.value == "http://www.w3.org/2002/07/owl#equivalentProperty" && binding.o.value == "http://www.w3.org/2000/01/rdf-schema#label") {
          //this.__d("tripleconfig.loadOntologyFromSparqlResults: got equivalent label property: " + binding.s.value);
          //labelproperties.push(binding.s.value);
          labelproperties[binding.s.value] = true;
        } else if (binding.p.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && binding.o.value == "http://www.w3.org/2000/01/rdf-schema#Class") {
          //this.__d("tripleconfig.loadOntologyFromSparqlResults: found class: " + binding.s.value);
          classes[binding.s.value] = true;
        }
      }
      for (var b = 0,max = bindings.length, binding;b < max;b++) {
        binding = results.results.bindings[b];
        if (true === labelproperties[binding.s.value] && true === classes[binding.o.value] && binding.p.value == "http://www.w3.org/2000/01/rdf-schema#domain") {
          this.__d("tripleconfig.loadOntologyFromSparqlResults: Setting class instance label for " + binding.o.value + " to property: " + binding.s.value);
          classlabels[binding.o.value] = binding.s.value;
        }
      }
      for (var b = 0,max = bindings.length, binding;b < max;b++) {
        binding = results.results.bindings[b];

        //this.__d("tripleconfig.loadOntologyFromSparqlResults: BINDING: " + JSON.stringify(binding));
        if (binding.p.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && binding.o.value == "http://www.w3.org/2000/01/rdf-schema#Class") {
          // got an RDFS class

          this.__d("tripleconfig.loadOntologyFromSparqlResults: Found class: " + binding.s.value);
          var labelPredicate = classlabels[binding.s.value];

          //this.__d("tripleconfig.loadOntologyFromSparqlResults:   has label: " + labelPredicate);

          if (undefined == labelPredicate) {
            labelPredicate = "http://www.w3.org/2000/01/rdf-schema#label";
          }
          this.__d("tripleconfig.loadOntologyFromSparqlResults:   now has label: " + labelPredicate);

          types[binding.s.value] = this.rdftype(binding.s.value,labelPredicate);
        } else if (binding.p.value == "http://www.w3.org/1999/02/22-rdf-syntax-ns#type" && binding.o.value == "http://www.w3.org/2002/07/owl#DatatypeProperty") {
    //this.__d("tripleconfig.loadOntologyFromSparqlResults: got property: " + binding.s.value);
          properties[binding.s.value] = {}; // fill in range and domain later
        }
      } // binding for



    // TODO use rdftype and include as necessary
    // check for RDFS labels,to,from,name for class -> title()
      for (var b = 0,max = bindings.length, binding;b < max;b++) {
        binding = results.results.bindings[b];
        if (binding.p.value == "http://www.w3.org/2000/01/rdf-schema#label" /*|| labelproperties[binding.p.value] === true*/) {
          var type = types[binding.s.value];
          this.__d("tripleconfig.loadOntologyFromSparqlResults: property/class: " + binding.s.value + " with label property: " + binding.p.value + " has label: " + binding.o.value);
          if (undefined != type) {
            //this.__d("tripleconfig.loadOntologyFromSparqlResults: setting TYPE title VALUE");
            type.title(binding.o.value);
          }
          var pi = predinfo[binding.s.value];
          if (undefined == pi) {
            pi = {};
            predinfo[binding.s.value] = pi;
          }
          pi.title = binding.o.value;
        } else if ("http://www.w3.org/2000/01/rdf-schema#domain" == binding.p.value) {
          var prop = properties[binding.s.value];
          //this.__d("tripleconfig.loadOntologyFromSparqlResults: property: " + binding.s.value + " has domain: " + binding.o.value);
          if (undefined != prop) {
            prop.domain = binding.o.value;
          }
        } else if ("http://www.w3.org/2000/01/rdf-schema#range" == binding.p.value) {
          var prop = properties[binding.s.value];
          //this.__d("tripleconfig.loadOntologyFromSparqlResults: property: " + binding.s.value + " has range: " + binding.o.value);
          if (undefined != prop) {
            prop.range = binding.o.value;
          }
        } else if ("http://www.w3.org/2000/01/rdf-schema#subClassOf" == binding.p.value) {
          var clsinfo = parentclasses[binding.s.value];
          if (undefined == clsinfo) {
            clsinfo = [];
            parentclasses[binding.s.value] = clsinfo;
          }
          clsinfo.push(binding.o.value);
        } else if ("http://www.w3.org/2000/01/rdf-schema#subPropertyOf" == binding.p.value) {
          var propinfo = parentproperties[binding.s.value];
          if (undefined == propinfo) {
            propinfo = [];
            parentproperties[binding.s.value] = propinfo;
          }
          propinfo.push(binding.o.value);
        }
      } // binding for


    // check for predicates

    // check for rdfs label,type,local,name for predicates
      for (var b = 0,max = bindings.length, binding;b < max;b++) {
        binding = results.results.bindings[b];
        if (undefined != properties[binding.s.value] && binding.p.value == "http://www.w3.org/2000/01/rdf-schema#label") {
          var pred = predinfo[binding.s.value];
          if (undefined != pred) {
            pred.title = binding.o.value;
          }
    //this.__d("tripleconfig.loadOntologyFromSparqlResults: got property label '" + binding.o.value + "' for '" + binding.s.value + "'");
        }
      }

    // go through and process subclasses, starting with those whose subclasses are in top level (recursive)

    var processed = [];
    this._processClasses(processed,types,properties,parentclasses,parentproperties,predicates,predinfo);

    // ontology updated method? - no, handled in context

  // now add annotated rdftypes to ontology
  for (var typename in types) {
    //this.__d("tripleconfig.loadOntologyFromSparqlResults: calling include for: " + typename);
    var type = types[typename];
    this.include(type);
  }


  } else {
    this.__d("tripleconfig.loadOntologyFromSparqlResults: BLANK ONTOLOGY");
  }
};

com.marklogic.semantic.tripleconfig.prototype._processClasses = function(processed,types,properties,parentclasses,parentproperties,predicates,predinfo) {
  var done = processed.length;
  // find types where all parent classes are in processed
  var todo = new Array();
  for (pc in types) {
    this.__d("tripleconfig.loadOntologyFromSparqlResults: checking if we can process: " + pc);
    var ok = true;
    var parents = parentclasses[pc];
    if (undefined != parents) {
      this.__d("tripleconfig.loadOntologyFromSparqlResults:   parents: " + JSON.stringify(parents));
      for (var p = 0,maxp = parents.length,par;ok && p < maxp;p++) {
        par = parents[p];
        ok = ok && (processed.contains(par) || undefined == types[par]); // either parent is not defined in ontology, or we've already processed the parent
      }
    }
    // add them to the process list
    if (processed.contains(pc)) {
      //this.__d("tripleconfig.loadOntologyFromSparqlResults:   ALREADY DONE");
    }
    if (ok && !processed.contains(pc)) {
    //this.__d("tripleconfig.loadOntologyFromSparqlResults:   SUCCESS adding to processable list: " + pc);
      todo.push(pc);
      processed.push(pc);
    }
  }
  // process these in turn
  for (var t = 0,maxt = todo.length,to;t < maxt;t++) {
    to = todo[t];
    this.__d("tripleconfig.loadOntologyFromSparqlResults: processing rdfs class: " + to);
    // fetch parent classes
    var parents = parentclasses[to];
      // loop through all properties and see if domain is in parents array
      for (var pr in properties) {
        var prop = properties[pr];
        if ((undefined != parents && parents.contains(prop.domain)) || prop.domain == to) {
          //this.__d("tripleconfig.loadOntologyFromSparqlResults:     contains property: " + pr);
          // property applies to this class too, so apply it
          // is it a normal predicate or a TO relationship?
          if (undefined != prop.range && undefined != types[prop.range]) {
            // other rdfs class
            //this.__d("tripleconfig.loadOntologyFromSparqlResults:       linked to class: " + prop.range);
            types[to].to(prop.range,pr);
          } else {
            // property
            //this.__d("tripleconfig.loadOntologyFromSparqlResults:       which is an intrinsic property");
            this._processParentPredicate(to,pr,types,parentproperties,predicates,predinfo);

          } // end class or predicate if
        }
      }
//    } // end parents undefined if

      // check if parent has parent classes too (recursive) - NOT NEEDED - GOING DOWN TREE RECURSIVELY SO AVOIDS THIS
      // attach parent properties to this subclass

    //} // end parent for
  }

  // recursively call ourselves again if newlyprocessed > oldprocessed;
  if (processed.length > done) { // stops infinite loops
    this.__d("tripleconfig.loadOntologyFromSparqlResults: calling process classes again, " + processed.length + " completed so far.");
    this._processClasses(processed,types,properties,parentclasses,parentproperties,predicates,predinfo);
  }

};

com.marklogic.semantic.tripleconfig.prototype._processParentPredicate = function(to,pr,types,parentproperties,predicates,predinfo) {

          // property
          var pred = predicates[to + "@@@" + pr];
          if (undefined == pred) {
            pred = types[to].predicate(pr);
          //this.__d("tripleconfig._processParentPredicate: predinfo for: " + to + " , predicate: " + pr + " = " + JSON.stringify(predinfo[pr]));
            if (undefined != predinfo[pr] && undefined != predinfo[pr].title) {
              //this.__d("tripleconfig._processParentPredicate:   setting title");
              pred.title(predinfo[pr].title);
            }
            predicates[to + "@@@" + pr] = pred;
          }
          // if property has parent properties, apply them too, recursively (this is needed)
          var parents = parentproperties[pr];
          if (undefined != parents && Array.isArray(parents) && 0 != parents.length) {
            for (var p = 0,maxp = parents.length,par;p < maxp;p++) {
              par = parents[p];
              this._processParentPredicate(to,par,types,parentproperties,predicates,predinfo);
            }
          }
};

/**
 * Includes the specified MLJS RDF Type JavaScript object as an RDF Entity type in this Triple Config object.
 *
 * @param {JSON} rdftype - The RDFType description object to include in this configuration
 **/
com.marklogic.semantic.tripleconfig.prototype.include = function(rdftype) {
  // copy rdftype JSON _config structures to our own internal format

  // TODO SIMPLIFY INTERNAL FORMAT OR AT LEAST RENAME CONFUSING PARTS!

  var ent = rdftype._config;
  //this.__d("tripleconfig.include: Saving config: " + JSON.stringify(ent));
  //ent.name = ent.iri; // TODO auto value
  //ent.prefix = ent.iri; // TODO remove this entirely?
  //ent.iriPattern = ent.iri + "/#VALUE#"; // TODO remove this entirely?
  // DONE IN RDFTYPE OBJECT NOW ent.commonNamePredicate = "rdfs:label"; // TODO use long IRI version of this, which I currently can't remember!
  ent.properties = new Array();

  // create sparql varname and cache for speed - E.g. /myontology/Person becomes ?person1 or similar, so varname is person
  var hashPos = ent.iri.lastIndexOf("#");
  var slashPos = ent.iri.lastIndexOf("/");
  var pos = hashPos;
  if (slashPos > hashPos) {
    pos = slashPos;
  }
  var shortString = ent.iri.substring(pos + 1).toLowerCase().replace("-",""); // TODO other replaces as necessary
  ent.variable = shortString;

  // copy over predicates too
  for (var p = 0,max = rdftype._predicates.length,pred;p < max;p++) {
    pred = rdftype._predicates[p];
    var newpred = pred._config;
    mljs.defaultconnection.logger.debug("adding predicate: " + JSON.stringify(newpred));
    //newpred.name = newpred.iri;

    ent.properties.push(newpred);
    this._newPredicates[newpred.iri] = newpred; // TODO remove one of these - no point duplicating by default
  }

  this._newentities[rdftype._config.iri] = ent;

  for (var p = 0,max = rdftype._to.length,pred;p < max;p++) {
    pred = rdftype._to[p];
    var predArray = pred.predicates;
    if (typeof predArray == "string") {
      predArray = [pred.predicates];
    }
    this.validTriples.push({subjectType: ent.iri,objectType: pred.type,predicateArray: predArray});
  }

  for (var p = 0,max = rdftype._from.length,pred;p < max;p++) {
    pred = rdftype._from[p];
    var predArray = pred.predicates;
    if (typeof predArray == "string") {
      predArray = [pred.predicates];
    }
    this.validTriples.push({subjectType: pred.type,objectType: ent.iri,predicateArray: predArray});
  }
};

/**
 * Creates a chainable RDF type JavaScript object. Provides easy creation of a semantic config.
 *
 * @param {string} rdfTypeIri - The IRI of this RDF Type
 * @param {string} opt_commonNamePredicate - The optional predicate to use as the 'common name' for display. Defaults to rdfs:label
 */
com.marklogic.semantic.tripleconfig.prototype.rdftype = function(rdfTypeIri,opt_commonNamePredicate) {
  var self = this;
  var rdftype = {
    _config: {
      title: null,
      iri: rdfTypeIri,
      name: rdfTypeIri, // TODO remove - just use IRI instead internally
      prefix: rdfTypeIri, // TODO remove - just use IRI
      iriPattern: rdfTypeIri + "/#VALUE#",
      commonNamePredicate: opt_commonNamePredicate || "http://www.w3.org/2000/01/rdf-schema#label" // TODO replace this with full URL and check it works
    },
    _predicates: [], // predicate JSON
    _to: [], // {type: "*" or string, predicates: [] or "" }
    _from: [], // {type: "*" or string, predicates: [] or "" }
    predicate: function(predIri,opt_type) {
      // default to RDF Object type
      var pred = {
        _config: {
          iri: predIri,
          name: predIri, // TODO remove - just use predIri instead
          title: null,
          type: opt_type || "xs:string", // TODO verify this works as expected
          locale: null
        },
        title: function(theTitle) {
          pred._config.title = theTitle;
          return pred; // chaining
        },
        type: function(theType) {
          pred._config.type = theType;
          return pred; // chaining
        },
        locale: function(theLocale) {
          pred._config.locale = theLocale;
          return pred; // chaining
        },
        name: function(theName) {
          pred._config.name = theName;
          return pred; // chaining
        }
      }
      rdftype._predicates.push(pred);
      return pred;
    },
    title: function(theTitle) {
      rdftype._config.title = theTitle;
      return rdftype; // chaining
    },
    to: function(type,predicateOrArray) {
      rdftype._to.push({type: type, predicates: predicateOrArray});
      return rdftype; // chaining
    },
    from: function(type,predicateOrArray) {
      rdftype._from.push({type: type, predicates: predicateOrArray});
      return rdftype; // chaining
    },
    prefix: function(thePrefix) {
      rdftype._config.prefix = thePrefix;
      return rdftype; // chaining
    },
    pattern: function(thePattern) {
      rdftype._config.iriPattern = thePattern;
      return rdftype; // chaining
    },
    name: function(theName) {
      rdftype._config.name = theName;
      return rdftype; // chaining
    }
  };
  return rdftype; // chaining
};

/**
 * Adds new valid triples.
 *
 * @param {Array} validTriplesArray - Any new triples associated with multiple entity classes (E.g. relationships between people and places) as JSON valid triples
 */
com.marklogic.semantic.tripleconfig.prototype.addValidTriples = function(validTriplesArray) {
  for (var i = 0;i < validTriplesArray.length;i++) {
    this.validTriples.push(validTriplesArray[i]);
  }
};

/**
 * Adds Geonames Place subject type support. Includes some custom predicates to represent common relationships.
 */
com.marklogic.semantic.tripleconfig.prototype.addPlaces = function() {
  ////this.entities.push("placename");

  //this.validTriples.push({subjectType: "placename", objectType: "placename", predicateArray: ["located_within","contains_location"]});

  ////this._predicates["studies_at"] = "http://www.marklogic.com/ontology/0.1/studies_at";
  ////this._predicates["affiliated_with"] = "http://www.marklogic.com/ontology/0.1/affiliated_with";
  ////this._predicates["has_meetings_near"] = "http://www.marklogic.com/ontology/0.1/has_meetings_near";
  ////this._predicates["located_within"] = "http://www.marklogic.com/ontology/0.1/located_within";
  ////this._predicates["contains_location"] = "http://www.marklogic.com/ontology/0.1/contains_location";

  ////this._iriPatterns["placename"] = "http://marklogic.com/semantic/targets/placename/#VALUE#";
  ////this._rdfTypes["placename"] = "http://schema.org/Place"; // geonames features are an extension of Place
  ////this._rdfTypesShort["placename"] = "so:Place"; // geonames features are an extension of Place
  ////this._commonNamePredicates["placename"] = "http://www.geonames.org/ontology#name";
  ////this._properties["placename"] = [{name: "name", iri: "http://www.geonames.org/ontology#name", shortiri: "geonames:name"}];


  //this._newentities["place"] = {name: "place", title: "Place", prefix: "http://www.geonames.org/ontology#", iriPattern: "http://marklogic.com/semantic/targets/organisation/#VALUE#",
  //  rdfTypeIri: "http://schema.org/Place", rdfTypeIriShort: "foaf:Organization", commonNamePredicate: "http://www.geonames.org/ontology#name",
  //  properties: [{name: "name", iri: "http://www.geonames.org/ontology#name", shortiri: "geonames:name"}]};

  //this._newPredicates["studies_at"] = {name: "studies_at", title: "Studies at", iri: "http://www.marklogic.com/ontology/0.1/studies_at", shortiri: "ml:studies_at"};
  //this._newPredicates["affiliated_with"] = {name: "affiliated_with", title: "Affiliated with", iri: "http://www.marklogic.com/ontology/0.1/affiliated_with", shortiri: "ml:affiliated_with"};
  //this._newPredicates["has_meetings_near"] = {name: "has_meetings_near", title: "Meets near", iri: "http://www.marklogic.com/ontology/0.1/has_meetings_near", shortiri: "ml:has_meetings_near"};
  //this._newPredicates["located_within"] = {name: "located_within", title: "Located within", iri: "http://www.marklogic.com/ontology/0.1/located_within", shortiri: "ml:located_within"};
  //this._newPredicates["contains_location"] = {name: "contains_location", title: "Contains", iri: "http://www.marklogic.com/ontology/0.1/contains_location", shortiri: "ml:contains_location"};

  // NEW builder method
  var place = this.rdftype("http://schema.org/Place","http://www.geonames.org/ontology#name").title("Place").prefix("http://www.geonames.org/ontology#")
    .pattern("http://marklogic.com/semantic/targets/organisation/#VALUE#")
    .to("http://schema.org/Place",["http://www.marklogic.com/ontology/0.1/located_within","http://www.marklogic.com/ontology/0.1/contains_location"]);
  place.predicate("http://www.marklogic.com/ontology/0.1/studies_at").title("Studies at");
  place.predicate("http://www.marklogic.com/ontology/0.1/affiliated_with").title("Affiliated with");
  place.predicate("http://www.marklogic.com/ontology/0.1/has_meetings_near").title("Meets near");
  place.predicate("http://www.marklogic.com/ontology/0.1/located_within").title("Located within");
  place.predicate("http://www.marklogic.com/ontology/0.1/contains_location").title("Contains");

  this.include(place);
};

/**
 * Adds the MLJS sample Movies ontology support, and relationships to FOAF:Person subject (likes predicate)
 */
com.marklogic.semantic.tripleconfig.prototype.addMovies = function() {
  //this.validTriples.push({subjectType: "person", objectType: "movie", predicateArray: ["likesmovie"]});

  //this._newentities["movie"] = {name: "movie", title: "Movie", prefix: "http://marklogic.com/semantic/ns/movie", iriPattern: "http://marklogic.com/semantic/targets/movies/#VALUE#",
  //  rdfTypeIri: "http://marklogic.com/semantic/rdfTypes/movie", rdfTypeIriShort: "mov:movie", commonNamePredicate: "hastitle",
  //  properties: [
  //    {name: "hastitle", iri: "hastitle", shortiri: "mov:hastitle"},
  //    {name: "hasactor", iri: "hasactor", shortiri: "mov:hasactor"},
  //    {name: "hasgenre", iri: "hasgenre", shortiri: "mov:hasgenre"},
  //    {name: "releasedin", iri: "releasedin", shortiri: "mov:releasedin"}
  //  ]
  //};
  //this._newPredicates["likesmovie"] = {name: "likesmovie", title: "Likes movie", iri: "likesmovie", shortiri: "mov:likesmovie"};
  //this._newPredicates["hastitle"] = {name: "hastitle", title: "Has Title", iri: "hastitle", shortiri: "mov:hastitle"};
  //this._newPredicates["hasactor"] = {name: "hasactor", title: "Has Actor", iri: "hasactor", shortiri: "mov:hasactor"};
  //this._newPredicates["hasgenre"] = {name: "hasgenre", title: "Has Genre", iri: "hasgenre", shortiri: "mov:hasgenre"};
  //this._newPredicates["releasedin"] = {name: "releasedin", title: "Released In", iri: "releasedin", shortiri: "mov:releasedin"};

  var movie = this.rdftype("http://marklogic.com/semantic/rdfTypes/movie","hastitle").title("Movie")
    .prefix("http://marklogic.com/semantic/ns/movie")
    .pattern("http://marklogic.com/semantic/targets/movies/#VALUE#")
    .from("http://xmlns.com/foaf/0.1/Person","likesmovie");
  movie.predicate("likesmovie").title("Likes movie");
  movie.predicate("hastitle").title("Has Title");
  movie.predicate("hasactor").title("Has Actor");
  movie.predicate("hasgenre").title("Has Genre");
  movie.predicate("releasedin").title("Released In");
  this.include(movie);
};

/**
 * Adds other ontologies used for testing E.g. in the mldbwebtest sample project.
 * Defines a Foodstuff rdf type with foodname, linked to FOAF Person subjects (via likes predicate)
 */
com.marklogic.semantic.tripleconfig.prototype.addTest = function() {
  ////this.entities.push("foodstuff");

  //this.validTriples.push({subjectType: "person", objectType: "foodstuff", predicateArray: ["likes"]});

  //// no special predicates in foodstuffs

  ////this._iriPatterns["foodstuff"] = "http://marklogic.com/semantic/targets/foodstuffs/#VALUE#";
  ////this._rdfTypes["foodstuff"] = "http://marklogic.com/semantic/rdfTypes/foodstuff";
  ////this._rdfTypesShort["foodstuff"] = "fs:foodstuff";
  ////this._commonNamePredicates["foodstuff"] = "foodname";
  ////this._properties["foodstuff"] = [{name: "name", iri: "foodname", shortiri: "foodname"}];

  //this._newentities["foodstuff"] = {name: "foodstuff", title: "Foodstuff", prefix: "http://marklogic.com/semantic/ns/foodstuff", iriPattern: "http://marklogic.com/semantic/targets/foodstuffs/#VALUE#",
  //  rdfTypeIri: "http://marklogic.com/semantic/rdfTypes/foodstuff", rdfTypeIriShort: "fs:foodstuff", commonNamePredicate: "foodname",
  //  properties: [{name: "foodname", iri: "foodname", shortiri: "fs:foodname"}]};

  //this._newPredicates["foodname"] = {name: "foodname", title: "Named", iri: "foodname", shortiri: "foodname"};
  //this._newPredicates["likes"] = {name: "likes", title: "Likes food", iri: "likes", shortiri: "fs:likes"};


  var foodstuff = this.rdftype("http://marklogic.com/semantic/rdfTypes/foodstuff","foodname").title("Foodstuff")
    .from("http://xmlns.com/foaf/0.1/Person","likes");
  foodstuff.predicate("foodname").title("Named");
  foodstuff.predicate("likes").title("Likes");
  this.include(foodstuff);
};

/**
 * Adds links from FOAF:Person and Organisation objects to geonames Place objects.
 * TODO update this for IRI types instead of common names
 */
com.marklogic.semantic.tripleconfig.prototype.addFoafPlaces = function() {
  this.validTriples.push({subjectType: "person", objectType: "placename", predicateArray: ["based_near"]}); //NB based_near may not be a valid relationship class - may be lon/lat instead
  this.validTriples.push({subjectType: "organisation", objectType: "placename", predicateArray: ["based_near","has_meetings_near"]});
};

/**
 * Adds FOAF Person, Organisation, and common predicates support
 */
com.marklogic.semantic.tripleconfig.prototype.addFoaf = function() {
  //this.validTriples.push({subjectType: "person", objectType: "person", predicateArray: ["knows","friendOf","enemyOf","childOf","parentOf","fundedBy"]});
  //this.validTriples.push({subjectType: "person", objectType: "organisation", predicateArray: ["member","studies_at"]});
  //this.validTriples.push({subjectType: "organisation", objectType: "organisation", predicateArray: ["member","parentOf","affiliated_with","fundedBy"]});

  //this._newentities["person"] = {name: "person", title: "Person",prefix: "http://xmlns.com/foaf/0.1/", iriPattern: "http://marklogic.com/semantic/targets/person/#VALUE#",
  //  rdfTypeIri: "http://xmlns.com/foaf/0.1/Person", rdfTypeIriShort: "foaf:Person", commonNamePredicate: "http://xmlns.com/foaf/0.1/name",
  //  properties: [{name: "name", iri: "http://xmlns.com/foaf/0.1/name", shortiri: "foaf:name"}]};

  //this._newentities["organisation"] = {name: "organisation", title: "Organisation", prefix: "http://xmlns.com/foaf/0.1/", iriPattern: "http://marklogic.com/semantic/targets/organisation/#VALUE#",
  //  rdfTypeIri: "http://xmlns.com/foaf/0.1/Organization", rdfTypeIriShort: "foaf:Organization", commonNamePredicate: "http://xmlns.com/foaf/0.1/name",
  //  properties: [{name: "name", iri: "http://xmlns.com/foaf/0.1/name", shortiri: "foaf:name"}]};

  //this._newPredicates["knows"] = {name: "knows", title: "Knows", iri: "http://xmlns.com/foaf/0.1/knows", shortiri: "foaf:knows"};
  //this._newPredicates["friendOf"] = {name: "friendOf", title: "Friend", iri: "http://xmlns.com/foaf/0.1/friendOf", shortiri: "foaf:friendOf"};
  //this._newPredicates["enemyOf"] = {name: "enemyOf", title: "Enemy", iri: "http://xmlns.com/foaf/0.1/enemyOf", shortiri: "foaf:enemyOf"};
  //this._newPredicates["childOf"] = {name: "childOf", title: "Is a child of", iri: "http://xmlns.com/foaf/0.1/childOf", shortiri: "foaf:childOf"};
  //this._newPredicates["parentOf"] = {name: "parentOf", title: "Is a parent of", iri: "http://xmlns.com/foaf/0.1/parentOf", shortiri: "foaf:parentOf"};
  //this._newPredicates["fundedBy"] = {name: "fundedBy", title: "Funded by", iri: "http://xmlns.com/foaf/0.1/fundedBy", shortiri: "foaf:fundedBy"};
  //this._newPredicates["member"] = {name: "member", title: "Is a member of", iri: "http://xmlns.com/foaf/0.1/member", shortiri: "foaf:member"};
  //this._newPredicates["based_near"] = {name: "based_near", title: "Is based near", iri: "http://xmlns.com/foaf/0.1/based_near", shortiri: "foaf:based_near"};
  //this._newPredicates["name"] = {name: "name", title: "Name", iri: "http://xmlns.com/foaf/0.1/name", shortiri: "foaf:name"};

  var person = this.rdftype("http://xmlns.com/foaf/0.1/Person","http://xmlns.com/foaf/0.1/name").title("Person")
    .prefix("http://xmlns.com/foaf/0.1/").pattern("http://marklogic.com/semantic/targets/person/#VALUE#")
    .to("http://xmlns.com/foaf/0.1/Person",[
      "http://xmlns.com/foaf/0.1/knows","http://xmlns.com/foaf/0.1/friendOf","http://xmlns.com/foaf/0.1/enemyOf",
      "http://xmlns.com/foaf/0.1/childOf","http://xmlns.com/foaf/0.1/parentOf","http://xmlns.com/foaf/0.1/fundedBy"
    ])
    .to("http://xmlns.com/foaf/0.1/Organization",[
      "http://xmlns.com/foaf/0.1/member","http://www.marklogic.com/ontology/0.1/studies_at"
    ]);
  person.predicate("http://xmlns.com/foaf/0.1/knows").title("Knows");
  person.predicate("http://xmlns.com/foaf/0.1/friendOf").title("Friend");
  person.predicate("http://xmlns.com/foaf/0.1/enemyOf").title("Enemy");
  person.predicate("http://xmlns.com/foaf/0.1/childOf").title("Is a child of");
  person.predicate("http://xmlns.com/foaf/0.1/parentOf").title("Is a parent of");
  person.predicate("http://xmlns.com/foaf/0.1/fundedBy").title("Funded by");
  person.predicate("http://xmlns.com/foaf/0.1/member").title("Is a member of");
  person.predicate("http://xmlns.com/foaf/0.1/based_near").title("I based near");
  person.predicate("http://xmlns.com/foaf/0.1/name").title("Name");
  mljs.defaultconnection.logger.debug("Person predicate: " + JSON.stringify(person));
  this.include(person);

  var org = this.rdftype("http://xmlns.com/foaf/0.1/Organization","http://xmlns.com/foaf/0.1/name").title("Organisation")
    .prefix("http://xmlns.com/foaf/0.1/").pattern("http://marklogic.com/semantic/targets/organisation/#VALUE#")
    .to("http://xmlns.com/foaf/0.1/Organization",[
      "http://xmlns.com/foaf/0.1/member","http://xmlns.com/foaf/0.1/parentOf",
      "http://www.marklogic.com/ontology/0.1/affiliated_with","http://xmlns.com/foaf/0.1/fundedBy"
    ]);
  // has some predicates in common with person, so no need to define separately
  this.include(org);
};

/**
 * Adds MarkLogic document ontology support. This is an early formed idea, not a standard.
 *
 * {@link http://adamfowleruk.github.io/mljs/apidocs/core/tutorial-901-ontology.html}
 */
com.marklogic.semantic.tripleconfig.prototype.addMarkLogic = function() {
  //this.validTriples.push({subjectType: "*", objectType: "mldocument", predicateArray: ["uri"]});

  //this._newentities["mldocument"] = {name: "mldocument", title: "MarkLogic Document",prefix: "http://marklogic.com/semantics/ontology/Document", iriPattern: "http://marklogic.com/semantics/ontology/Document/#VALUE#",
  //  rdfTypeIri: "http://marklogic.com/semantics/ontology/Document", rdfTypeIriShort: "ml:Document", commonNamePredicate: "http://marklogic.com/semantics/ontology/Document#uri",
  //  properties: [{name: "uri", iri: "http://marklogic.com/semantics/ontology/Document#uri", shortiri: "ml:uri"}]};

  //this._newPredicates["uri"] = {name: "uri", title: "URI", iri: "http://marklogic.com/semantics/ontology/Document#uri", shortiri: "ml:uri"};

  var doc = this.rdftype("http://marklogic.com/semantics/ontology/Document",
      "http://marklogic.com/semantics/ontology/Document#uri").title("MarkLogic Document")
    .prefix("http://marklogic.com/semantics/ontology/Document")
    .pattern("http://marklogic.com/semantics/ontology/Document/#VALUE#")
    .from("*","http://marklogic.com/semantics/ontology/Document#uri")
    .from("*","http://www.w3.org/ns/prov#wasDerivedFrom")
    .from("*","http://marklogic.com/semantics/ontology/mentioned_in")
    .to("http://marklogic.com/semantics/ontology/Document",["http://www.w3.org/ns/prov#wasDerivedFrom",
      "http://marklogic.com/semantics/ontology/mentioned_in"])
    .to("*",["http://marklogic.com/semantics/ontology/mentions"])
    ;
  doc.predicate("http://marklogic.com/semantics/ontology/Document#uri").title("URI");
  doc.predicate("http://www.w3.org/ns/prov#wasDerivedFrom").title("Derived From");
  doc.predicate("http://marklogic.com/semantics/ontology/mentions").title("Mentions");
  doc.predicate("http://marklogic.com/semantics/ontology/mentioned_in").title("Mentioned In");
  this.include(doc);
};

/**
 * Adds common OpenCalais RDF types and their common names to the triple config.
 * (Organization, Person, City, Country, Continent, Province or State, Region, Facility)
 *
 * {@link http://www.opencalais.com/files/owl.opencalais-4.3a.xml}
 */
com.marklogic.semantic.tripleconfig.prototype.addOpenCalais = function() {
  //var cfg = semctx.getTripleConfiguration(); // used to be getConfiguration()
  var cfg = this;
  var org = cfg.rdftype("http://s.opencalais.com/1/type/em/e/Organization",
      "http://s.opencalais.com/1/pred/organization").title("Extracted Organisation");
  this.include(org);

  var person = cfg.rdftype("http://s.opencalais.com/1/type/em/e/Person",
      "http://s.opencalais.com/1/pred/person").title("Extracted Person");
  this.include(person);

  var city = cfg.rdftype("http://s.opencalais.com/1/type/em/e/City",
      "http://s.opencalais.com/1/pred/city").title("Extracted City");
  this.include(city);

  var country = cfg.rdftype("http://s.opencalais.com/1/type/em/e/Country",
      "http://s.opencalais.com/1/pred/country").title("Extracted Country");
  this.include(city);

  var continent = cfg.rdftype("http://s.opencalais.com/1/type/em/e/Continent",
      "http://s.opencalais.com/1/pred/continent").title("Extracted Continent");
  this.include(continent);

  var province = cfg.rdftype("http://s.opencalais.com/1/type/em/e/ProvinceOrState",
      "http://s.opencalais.com/1/pred/provinceorstate").title("Extracted Province/State");
  this.include(province);

  var region = cfg.rdftype("http://s.opencalais.com/1/type/em/e/Region",
      "http://s.opencalais.com/1/pred/region").title("Extracted Region");
  this.include(region);

  var facility = cfg.rdftype("http://s.opencalais.com/1/type/em/e/Facility",
      "http://s.opencalais.com/1/pred/facility").title("Extracted Facility");
  this.include(facility);

};

/**
 * Returns the valid predicates in the configured ontologies between the two subject RDF types shown (they could be the same values).
 * This function is useful when determining the possible object classes a Subject can be linked to. It does not list intrinsic valued
 * predicates.
 *
 * @param {string} from - IRI of the RDF type on which the predicate exists
 * @param {string} to - IRI of the RDF type to which the predicate points (The RDF type of the Object)
 * @return {Array} predicateArray - The full IRIs of the predicates that are valid between the two RDF types given
 */
com.marklogic.semantic.tripleconfig.prototype.getValidPredicates = function(from,to) {
  for (var i = 0;i < this.validTriples.length;i++) {
    this.__d("getValidPredicates: Checking validTriples: " + JSON.stringify(this.validTriples[i]));
    if ((this.validTriples[i].subjectType == from || "*" == this.validTriples[i].subjectType) &&
        (this.validTriples[i].objectType == to || "*" == this.validTriples[i].objectType)) {
      this.__d("getValidPredicates: got matching predicates: " + JSON.stringify(this.validTriples[i].predicateArray));
      return this.validTriples[i].predicateArray;
    }
  }
  return new Array();
};

/**
 * Returns the IRI of the predicate which represents the specified entity's commonNamePredicate
 *
 * @param {string} entity - The IRI of the RDF type for the entity
 * @return {JSON} property - The property JSON or null for the commonNamePredicate
 */
com.marklogic.semantic.tripleconfig.prototype.getNameProperty = function(entity) {
  this.__d("getNameProperty: entity=" + entity);
  var cnp = this._newentities[entity].commonNamePredicate;

  var self = this
  self.__d("Common name property: " + cnp);
  for (var i = 0;i < this._newentities[entity].properties.length;i++) {
    self.__d("Property: " + i + " is: " + JSON.stringify(this._newentities[entity].properties[i]));
    self.__d(" - IRI: " + this._newentities[entity].properties[i].iri);
    if (cnp == this._newentities[entity].properties[i].iri) {
      self.__d("MATCH: " + JSON.stringify(this._newentities[entity].properties[i]));
      return this._newentities[entity].properties[i];
    }
  }
  self.__d("getNameProperty: RETURNING NULL for entity: " + entity);
  return cnp; // TODO was null - find out why its insisting on returning an entity instead of an IRI as per the above docs
};

/**
 * Fetch entity info for top level entities (not properties of entities)
 *
 * @param {string} iri - The IRI of the rdf entity type to fetch
 * @return {JSON} entityInfo - The Internal MLJS JSON configuration of the specified entity
 */
com.marklogic.semantic.tripleconfig.prototype.getEntityFromIRI = function(iri) {
  return this._newentities[iri];
  /*
  for (var cn in this._newentities) {
    var p = this._newentities[cn];
    if (p.rdfTypeIri == iri) {
      return p;
    }
  }*/
};

/**
 * Fetches entity info based upon a shortened IRI.
 *
 * @deprecated use full IRI instead @see getEntityFromIRI
 *
 * @param {string} shortIri - The short IRI of the rdf entity type to fetch
 * @return {JSON} entityInfo - The Internal MLJS JSON configuration of the specified entity
 */
com.marklogic.semantic.tripleconfig.prototype.getEntityFromShortIRI = function(iri) {
  for (var cn in this._newentities) {
    var p = this._newentities[cn];
    if (p.rdfTypeIriShort == iri) {
      return p;
    }
  }
};

/**
 * Fetches entity info based upon a short name, internal to MLJS triple config objects.
 *
 * @deprecated use full IRI instead @see getEntityFromIRI
 *
 * @param {string} name - The short internal name of the rdf entity type to fetch
 * @return {JSON} entityInfo - The Internal MLJS JSON configuration of the specified entity
 */
com.marklogic.semantic.tripleconfig.prototype.getEntityFromName = function(name) {
  for (var cn in this._newentities) {
    var p = this._newentities[cn];
    if (p.name == name) {
      return p;
    }
  }
};

/**
 * Returns a predicate info JSON object for the full rdf predicate IRI specified.
 *
 * @param {string} iri - The IRI of the rdf predicate to fetch
 * @return {JSON} predicateInfo - The Internal MLJS JSON configuration of the specified predicate
 */
com.marklogic.semantic.tripleconfig.prototype.getPredicateFromIRI = function(iri) {
  /*
  for (var cn in this._newPredicates) {
    var p = this._newPredicates[cn];
    if (p.iri == iri) {
      return p;
    }
  }
  */
  return this._newPredicates[iri];
};

/**
 * Returns a predicate info JSON object for the full rdf predicate IRI specified.
 *
 * @deprecated use getPredicateFromIRI instead
 *
 * @param {string} shortIri - The short IRI of the rdf predicate to fetch
 * @return {JSON} predicateInfo - The Internal MLJS JSON configuration of the specified predicate
 */
com.marklogic.semantic.tripleconfig.prototype.getPredicateFromShortIRI = function(iri) {
  for (var cn in this._newPredicates) {
    var p = this._newPredicates[cn];
    if (p.shortiri == iri) {
      return p;
    }
  }
};

/**
 * Returns a predicate info JSON object for the full rdf predicate IRI specified.
 *
 * @deprecated use getPredicateFromIRI instead
 *
 * @param {string} name - The internal MLJS triple config name of the rdf predicate to fetch
 * @return {JSON} predicateInfo - The Internal MLJS JSON configuration of the specified predicate
 */
com.marklogic.semantic.tripleconfig.prototype.getPredicateFromName = function(name) {
  for (var cn in this._newPredicates) {
    var p = this._newPredicates[cn];
    if (p.name == name) {
      return p;
    }
  }
};

/**
 * Convenience method to loop through the JSON entityInfo object specified and rethrn the predicate information for the specified predicate IRI
 *
 * TODO validate this works as expected since change to create an ontologyBuilder set of functions. NB Remove if not used by any other code.
 *
 * @param {JSON} entity - The MLJS entityInfo object
 * @param {string} iri - The full IRI of the predicate whose info should be returned
 */
com.marklogic.semantic.tripleconfig.prototype.getEntityProperty = function(entity, iri) {
  self.__d("getEntityProperty: " + iri + " from entity: " + entity);
  for (var i = 0;i < entity.properties.length;i++) {
    if (iri == entity.properties[i].iri) {
      return entity.properties[i];
    }
  }
  self.__d("getEntityProperty: RETURNING NULL for " + iri + " from entity: " + entity);
  return null;
};
















/**
 * Semantic context object for finding entities and drilling down in to relationships. Abstracts performing SPARQL. Allows Caching of entity facts whilst browsing.
 *
 * @constructor
 * @deprecated Use var db = new mljs(); db.createSemanticContext(); instead
 */
mljs.prototype.semanticcontext = function() {
  // query modifiers
  this._offset = 0;
  this._limit = 10;
  this._ontologyGraph = null;
  this._includeDefaultOntology = true;
  //this._distinct = true; // defined within subjectQuery

  this._tripleconfig = null;

  this._subjectQuery = ""; // SPARQL to execute for selecting subject
  this._subjectResults = null; // SPARQL results JSON

  this._selectedSubject = ""; // IRI of selected subject
  //this._subjectFacts = new Array(); // IRI -> JSON SPARQL facts results object

  this._restrictSearchContext = null; // the searchcontext instance to update with a cts:triples-range-query when our subjectQuery is updated
  this._contentSearchContext = null; // The search context to replace the query for when finding related content to this SPARQL query (where a result IRI is a document URI)

  this._contentMode = "full"; // or "contribute" - whether to executed a structured query (full) or just provide a single term (contribute)

  this._theCache = {}; // subjectIri => {iri: "", typeNameString: "", nameString: "", namePredicate: "", all: false, facts: [{subject,predicate,object}]}

  this._subjectResultsPublisher = new com.marklogic.events.Publisher();
  this._subjectFactsPublisher = new com.marklogic.events.Publisher();
  this._suggestionsPublisher = new com.marklogic.events.Publisher();
  this._factsPublisher = new com.marklogic.events.Publisher(); // publish facts that can be associated to many subjects - normally for pulling back a result per subject, with many facts per 'row'
  this._errorPublisher = new com.marklogic.events.Publisher();
  this._ontologyPublisher = new com.marklogic.events.Publisher(); // sends tripleconfig object
};

/*mljs.prototype.semanticcontext.prototype._checktc = function() {
  if (null == this._tripleconfig && undefined != this.db) {
    this._tripleconfig = this.db.createTripleConfig();
  }
};*/

mljs.prototype.semanticcontext.prototype._cache = function(results,allFactsForAllSubjects) {
  //this._checktc();

  var bindings = results.results.bindings;
  for (var b = 0,maxb = bindings.length,bin,subject,si;b < maxb;b++) {
    bin = bindings[b];
    subject = bin.subject.value;
    si = this.getCachedFacts(subject);
    if (undefined == si) {
      si = {iri: subject, typeNameString: null, nameString: null,namePredicate: null, all:allFactsForAllSubjects || false, facts:[]};
      this._theCache[subject] = si;
    }
    //si.facts.push({subject: subject, predicate: bin.predicate.value, object: bin.object.value});
    si.facts.push(bin); // stay compatible

    // check if this subject has a name triple cached, and populate
    var type = this._cachedFact(si,"http://www.w3.org/1999/02/22-rdf-syntax-ns#type");
    if (undefined != type) {
      // Get the human readable name for this type
      /*si.typeNamePredicate = type;
      var typeInfo = this._tripleconfig.getEntityFromIRI(type);
      var nameprop = this._tripleconfig.getNameProperty(typeInfo.iri).iri;
      var name = this.getCachedFact(typeInfo.iri,nameprop);
      if (undefined != name) {
        si.typeNameString = name.object.value;
      }*/


      // get the human readable name for this type instance
      //if (null != this._tripleconfig) { // weird, but can happen
      mljs.defaultconnection.logger.debug("CF: type obj value: " + type.object.value);
        var typeInfo = this.getTripleConfiguration().getEntityFromIRI(type.object.value);
        if (undefined != typeInfo) {
          si.typeNameString = typeInfo.title;
          mljs.defaultconnection.logger.debug("CF: type info title: " + typeInfo.title);
          var nameProp = this._tripleconfig.getNameProperty(typeInfo.iri);
          mljs.defaultconnection.logger.debug("CF: type iri: " + typeInfo.iri);
          mljs.defaultconnection.logger.debug("CF: type name prop: " + nameProp);
          if (undefined != nameProp) {
            var subjectNameProp = nameProp.iri;
            mljs.defaultconnection.logger.debug("CF: subject name prop: " + subjectNameProp);
            if (undefined != subjectNameProp) {
              si.namePredicate = subjectNameProp;
              var subName = this._cachedFact(si,subjectNameProp);
              mljs.defaultconnection.logger.debug("CF: subject name: " + subName);
              if (undefined != subName) {
                mljs.defaultconnection.logger.debug("CF: subName value: " + subName.object.value);
                si.nameString = subName.object.value;
              }
            }
          }
        }
      //}
    } // end type undefined if
  } // end for
};

mljs.prototype.semanticcontext.prototype._cachedFact = function(si,predicateIri) {
  for (var f = 0,maxf = si.facts.length,fact;f < maxf;f++) {
    fact = si.facts[f];
    if (fact.predicate.value == predicateIri) {
      return fact;
    }
  }
  return null;
};

mljs.prototype.semanticcontext.prototype.getCachedFact = function(subjectIri,predicateIri) {
  var facts = this.getCachedFacts(subjectIri);
  // loop through facts
  return this._cachedFact(facts,predicateIri);
};

mljs.prototype.semanticcontext.prototype.getCachedFacts = function(subjectIri) {
  return this._theCache[subjectIri];
};

/**
 * Returns the MLJS Workplace Context Configuration definition JSON object
 */
mljs.prototype.semanticcontext.getConfigurationDefinition = function() {
  return {
    limit: {type: "positiveInteger", minimum: 1, default: 10, title: "Page size", description: "How many results to display (fetch) per page."},
    contentMode: {type: "enum", default: "full", title: "Content Mode", description: "How to contribute a document-query to a search context.",
      options: [
        {value: "full", title: "Replace", description: "Replace the search with this document (uri) query."},
        {value: "contribute", title: "Contribute", description: "Contribute this document (uri) query to the search."}
      ]
    },
    ontologyGraph: {type: "string", default: "", title: "Ontology Graph", description: "Which graph to load ontology from. Blank means loads all RDFS and OWL classes."},
    includeDefaultOntology: {type: "boolean", default: true, title: "Include default ontology", description: "Include default MLJS FOAF, geonames, open calais and marklogic document ontology."}

     /*,
    tripleConfig: {} // TODO serialization of the ontology configuration */
  };
};


/**
 * Sets the configuration of this context using the MLJS Workplace JSON format.
 *
 * @param {JSON} config - The JSON configuration of this context.
 */
mljs.prototype.semanticcontext.prototype.setConfiguration = function(config) {
  this._limit = config.limit;
  this._contentMode = config.contentMode;
  this._ontologyGraph = config.ontologyGraph;
  this._includeDefaultOntology = config.includeDefaultOntology;

  // load ontology now
  this._loadOntology();
};

mljs.prototype.semanticcontext.prototype._loadOntology = function() {
  var self = this;
  // TODO make the below inferencing aware on V8 - so we get correct child class properties
  var sparql = "SELECT ?s ?p ?o ?g WHERE {GRAPH ?g {?s ?p ?o . } ";
  if (null != this._ontologyGraph) {
    sparql += "FILTER(?g = <" + self._ontologyGraph + "> ) .";
  }
  sparql += "}";
  this.db.sparql(sparql, function(result) {
      var tc = self.getTripleConfiguration();
      tc.loadOntologyFromSparqlResults(result.doc,self._includeDefaultOntology);
      self._ontologyPublisher.publish(tc);
    }
  );
};

/**
 * Sets the mode for this context. This affects how this context updates a searhcontext's content search when it finds Subjects related to a MarkLogicDocument.
 * See details on the MarkLogic sample ontology for details. This context will take the #uri value of a subject(or subjects) and generate an or-query of
 * document-query(uri) within the target search context.
 *
 * @param {string} mode - The structured query builder mode - full (default) or 'contribute'. Affects whether this context calls searchcontext's doStructuredQuery or contributeStructuredQuery instead
 */
mljs.prototype.semanticcontext.prototype.setContentMode = function(mode) {
  this._contentMode = mode;
};

/**
 * Returns this context's content search contribution mode. Either 'full' (default) or 'contribute'.
 *
 * @return {string} contentMode - The mode of this semantic context's contribution to a search context's structured query
 */
mljs.prototype.semanticcontext.prototype.getContentMode = function() {
  return this._contentMode;
};

/**
 * Sets the content context to update (if any) with #uris via a document-query
 *
 * @param {searchcontext} ctx - The (Content) Search Context to update
 */
mljs.prototype.semanticcontext.prototype.setContentContext = function(ctx) {
  this._contentSearchContext = ctx;
};

/**
 * Returns the (content) search context instance (or null) that this semantic context is configured to update
 *
 * @return {searchcontext} context - The searchcontext instance (or null) that this semantic context will update
 */
mljs.prototype.semanticcontext.prototype.getContentContext = function() {
  return this._contentSearchContext;
};

/**
 * Determines whether this semantic context is set up to update a (content) search context.
 *
 * @return {boolean} hasContentContext - true if this context is configured to update a (content) search context
 */
mljs.prototype.semanticcontext.prototype.hasContentContext = function() {
  return (null != this._contentSearchContext);
};

/**
 * Returns the underlying triple config instance.
 *
 * @return {tripleconfig} config - The tripleconfig being used to generate SPARQL by this semanticcontext
 */
mljs.prototype.semanticcontext.prototype.getTripleConfiguration = function() {
  if (null == this._tripleconfig) {
    this._tripleconfig = this.db.createTripleConfig();
  }
  return this._tripleconfig;
};

/**
 * Sets the triple config instance to use for determining ontology information.
 *
 * @return {tripleconfig} config - The triple config instance used
 */
mljs.prototype.semanticcontext.prototype.setTripleConfiguration = function(conf) {
  this._tripleconfig = conf;
};

/**
 * Registers an object with this semantic context.
 * This checks for the following general methods: setSemanticContext
 * And event handlers: updateSubjectResults, updateSubjectFacts, updateFacts, updateSuggestions
 * And event firers: addSubjectSelectionListener
 *
 * Note that this context will automatically register the specified object with the dependant (content) search context, if one is configured.
 *
 * @param {object} obj - The object to register with this context
 */
mljs.prototype.semanticcontext.prototype.register = function(obj) {
  var self = this;

  if (undefined != obj.setSemanticContext) {
    obj.setSemanticContext(this);
  }

  // check if this object can respond to our emitted events
  if (undefined != obj.updateSubjectResults) {
    this._subjectResultsPublisher.subscribe(function(results) {obj.updateSubjectResults(results)});
  }
  if (undefined != obj.updateSubjectFacts) {
    this._subjectFactsPublisher.subscribe(function(facts) {obj.updateSubjectFacts(facts)});
  }
  if (undefined != obj.updateFacts) {
    this._factsPublisher.subscribe(function(facts) {obj.updateFacts(facts)});
  }
  if (undefined != obj.updateSuggestions) {
    this._suggestionsPublisher.subscribe(function(suggestions) {obj.updateSuggestions(suggestions)});
  }
  if (undefined != obj.updateOntology) {
    this._ontologyPublisher.subscribe(function(tc) {obj.updateOntology(tc)});
  }

  // Where we listen to others' events
  if (undefined != obj.addSubjectSelectionListener) {
    obj.addSubjectSelectionListener(function(subjectIri) {self.subjectFacts(subjectIri)});
  }


  // also register with the content search context, if it exists
  //if (null != this._contentSearchContext) {
  //  this._contentSearchContext.register(obj);
  //}
};


/**
 * Queries for a subject using the specified SPARQL and paging information. Fires updateSubjectResults.
 *
 * @param {string} sparql - the sparql string (not including OFFSET or LIMIT) to use for the search
 * @param {integer} offset_opt - the offset to use (defaults to 1)
 * @param {integer} limit_opt - the limit to use (defaults to 10)
 */
mljs.prototype.semanticcontext.prototype.subjectQuery = function(sparql,offset_opt,limit_opt) {
  this._subjectQuery = sparql;
  if (undefined != offset_opt) {
    this._offset = offset_opt;
    if (undefined != limit_opt) {
      this._limit = limit_opt;
    }
  }
  // perform query
  this._doSubjectQuery();
};

/**
 * Changes the configured search offset. Useful for paging
 *
 * @param {integer} offset - the search results paging offset
 */
mljs.prototype.semanticcontext.prototype.moveOffset = function(offset) {
  this._offset = offset;
  // TODO determine if LIMIT needs updating (is it a count, or result index?)
  this._doSubjectQuery();
};

mljs.prototype.semanticcontext.prototype._doSubjectQuery = function() {
  var self = this;

  var q = this._subjectQuery + " OFFSET " + this._offset + " LIMIT " + this._limit;
  // execute function defined in our properties
  this.db.sparql(q,function(result) {
    self.__d("RESPONSE: " + JSON.stringify(result.doc));
    if (result.inError) {
      self._subjectResultsPublisher.publish(false);
      self._errorPublisher.publish(result.error);
    } else {
      self._subjectResultsPublisher.publish(result.doc);
    }
  });
};

/**
 * Fetches facts that have the subjectIri specified as the 'subject' (but NOT the 'object - thus different to GET /v1/graphs/things)
 *
 * @param {string} subjectIri - The Subject iri to fetch facts for
 */
mljs.prototype.semanticcontext.prototype.subjectFacts = function(subjectIri) {
  this._selectedSubject = subjectIri;

  // subject SPARQL
  this.getFacts(subjectIri,true);
};

// NB subjectIri can be null if sparql contains multiple subjectIris
/**
 * Looks up related content to the specified Subject.
 * TODO update this to also check MarkLogicDocument #uri rather than just a docuri as an intrinsic string object value related to the graph.
 * NB Currently supports a maximum list of 10 document URIs, and doesn't use DISTINCT
 * NB only executes if a (content) search context has been configured on this semantic context instance
 *
 * @param {string} subjectIri - The IRI of the subject to fetch related content for
 * @param {string} docSparql_opt - The Sparql to use (should return a ?docuri binding) if not using the default sparql generation within this method
 */
mljs.prototype.semanticcontext.prototype.subjectContent = function(subjectIri,docSparql_opt) {
  // update the linked searchcontext with a query related to documents that the facts relating to this subjectIri were inferred from
  // TODO sparql query to fetch doc URIs (stored as derivedFrom IRIs)
  // execute sparql for all facts  to do with current entity
  var self = this;
  if (null != this._contentSearchContext) {
    this._contentSearchContext.updateResults(true);

    var sparql = "";
    if (undefined == docSparql_opt) {
      sparql += "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\nPREFIX rdfs: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
        "SELECT ?docuri {\n  GRAPH ?graph {\n    ";
      if (self.reverse) {
        sparql += "?obj ?pred <" + subjectIri + "> .";
      } else {
        sparql += "<" + subjectIri + "> ?pred ?obj .";
      }
      sparql += "\n  }\n  ?graph <http://marklogic.com/semantics/ontology/derived_from> ?docuri .\n" +
        "}";
    } else {
      sparql = docSparql_opt; // MUST return ?docuri somehow
    }
    sparql += " LIMIT 10";

    self.db.sparql(sparql,function(result) {
        if (result.inError) {
          self._contentSearchContext.updateResults(false);
          self.errorPublisher.publish(result.error);
        } else {
      // use docuris as a shotgun or structured search
      var qb = self.db.createQuery(); // TODO maintain link to parent connection instance
      var uris = new Array();
      for (var b = 0;b < result.doc.results.bindings.length;b++) {
        var res = result.doc.results.bindings[b];
        uris.push(res.docuri.value);
      }
      qb.query(qb.uris("uris",uris));
      var queryjson = qb.toJson();
      self.__d("SEMANTIC CONTENT JSON QUERY: " + JSON.stringify(queryjson));

      if (self._contentMode == "full") {
        self._contentSearchContext.dostructuredquery(queryjson,1);
      } else if (self._contentMode == "contribute") {
        self._contentSearchContext.contributeStructuredQuery("semanticcontext",queryjson.query); // only one sub query so don't treat it as an array
      }
      /*
      mljs.defaultconnection.structuredSearch(queryjson,self._options,function(result) {
        if (result.inError) {
          self._contentWidget.updateResults(false);
          self.errorPublisher.publish(result.error);
        } else {
          self._contentWidget.updateResults(result.doc);
        }
      });
      */
    }
    });
  }
};

/**
 * Looks up a single fact. Checks the fact cache first. Fires an updateSubjectFacts event.
 *
 * @param {string} subjectIri - The IRI of the subject whose fact we are looking for
 * @param {string} predicate - The predicate IRI of the fact to locate
 * @param {string} reload_opt - Whether to reload the fact, or use the cached value (if it exists) - defaults to false (use cache)
 */
mljs.prototype.semanticcontext.prototype.getFact = function(subjectIri,predicate,reload_opt) {
  if (false === reload_opt) {
    var facts = this.getCachedFacts(subjectIri);
    if (undefined != facts) {
      //self._subjectFactsPublisher.publish({subject: subjectIri,predicate:predicate, facts: [fact]}); // TODO validate this works
      self._subjectFactsPublisher.publish(
        {results: {bindings: facts}}
      );
      return;
    }
  }
  var self = this;
  /*
  var fireFact = function() {
    var results = [];
    for (var i = 0;i < bindings.length;i++) {
      if (undefined == bindings[i].predicate || predicate == bindings[i].predicate) { // if undefined, its a result of us asking for a specific predicate, and thus a matching predicate
        results.push(bindings[i].predicate); // pushes type, value, xml:lang (if applicable) as JSON object to results array
      }
    } // TODO WTF RESULTS DOES ABOVE, AND BINDINGS BELOW
    self._subjectFactsPublisher.publish({subject: subjectIri,predicate: predicate,facts: bindings})
  };*/

  if ((true==reload_opt) || undefined == facts) {
    //var sparql = "SELECT * WHERE {<" + subjectIri + "> <" + predicate + "> ?object .}";
    var sparql = "SELECT * WHERE {?subject ?predicate ?object . FILTER (?subject = <" + subjectIri + "> ) . FILTER (?predicate = <" + predicate + "> ) . }";

    // fetch info and refresh again
    self.db.sparql(sparql,function(result) {
      self.__d("RESPONSE: " + JSON.stringify(result.doc));
      if (result.inError) {
        self._errorPublisher.publish(result.error);
      } else {
        self._cache(result.doc);
        //bindings = result.doc.results.bindings;
        //fireFact();
        self._subjectFactsPublisher.publish(result.doc);
      }
    });
  }/* else {
    bindings = facts.results.bindings;
    fireFact();
  }*/
};

/**
 * Fetches all facts for a specified subject. Fires an updateSubjectFacts event.
 *
 * @param {string} subjectIri - The IRI of the subject whose fact we are looking for
 * @param {string} reload_opt - Whether to reload the fact, or use the cached value (if it exists) - defaults to false (use cache)
 */
mljs.prototype.semanticcontext.prototype.getFacts = function(subjectIri,reload_opt) {
  //var facts = this._subjectFacts[subjectIri];
  var facts = this.getCachedFacts(subjectIri); //.facts;
  if ((true==reload_opt) || undefined == facts) {
    var sparql = "SELECT * WHERE {";

    // check for bnodes
    /*if (!(subjectIri.indexOf("_:") == 0)) {
      sparql += "<";
    }
    sparql += subjectIri;
    if (!(subjectIri.indexOf("_:") == 0)) {
      sparql += ">";
    }*/
    sparql += " ?subject ?predicate ?object . FILTER (?subject = <" + subjectIri + "> ) .}";

    this._getFacts(sparql);
  } else {
    this._subjectFactsPublisher.publish(
      {results: {bindings: facts.facts}}
    );
  }
};

mljs.prototype.semanticcontext.prototype._getFacts = function(sparql,subjectIriOpt) {
  var self = this;
  // fetch info and refresh again
  self.db.sparql(sparql,function(result) {
    self.__d("RESPONSE: " + JSON.stringify(result.doc));
    if (result.inError) {
      self._subjectFactsPublisher.publish(false);
      self._errorPublisher.publish(result.error);
    } else {/*
      var res = {facts: result.doc};
      if (undefined != subjectIriOpt) {
        self._subjectFacts[subjectIriOpt] = result.doc;
        res.subject = subjectIriOpt;
      }*/
      self._cache(result.doc,true);
      self._subjectFactsPublisher.publish(result.doc);
    }
  });
};

/**
 * Get facts for the Subject where the given condition matches. MUST use ?subject for the subject of interest.
 * @param {string} whereSparql - The Sparql to embed within the where clause using ?subject
 */
mljs.prototype.semanticcontext.prototype.getFactsWhere = function(whereSparql) {
  var sparql = "select * where {" + whereSparql + " ?subject ?predicate ?object .}"
  this._getFacts(sparql);
};

/**
 * This seems to kick the sparql query cache in to action. Even doing this for a different RdfType seems to help.
 * This is really only applicable to demonstrations rather than production systems, as in production MarkLogic's
 * triple algorithms over time change algorithms to a near-best option, and caches this for 10 minutes.
 */
mljs.prototype.semanticcontext.prototype.primeSimpleSuggest = function() {
  this.__d("primeSimpleSuggest");
  var sparql = "SELECT DISTINCT ?suggestion WHERE {\n  ?s a <wibble> . \n  ?s <hasflibble> ?suggestion . \n  FILTER regex(?suggestion, \"Abc.*\", \"i\") \n} ORDER BY ASC(?suggestion) LIMIT 10";

  this.__d("primeSimpleSuggest: SPARQL: " + sparql);

  var self = this;

  this.db.sparql(sparql,function(result) {
    self.__d("primeSimpleSuggest: RESPONSE: " + JSON.stringify(result.doc));
    // do nothing - we're just priming the MarkLogic server's triple algorithm cache
  });
};

/**
 * Performs a suggestion lookup for a fact value using SPARQL. NB limited to 10 distinct suggestions.
 * NB only does a simple string match, so doesn't take in to account value type (E.g. Integer)
 * TODO update to use tripleconfig to determine type, if information is available.
 *
 * @param {string} subjectIri - The IRI of the subject whose fact we are looking for
 * @param {string} predicate - The predicate IRI of the fact to locate
 * @param {string} startString_opt - If specified, replaces the default FILTER part of the sparql generated
 */
mljs.prototype.semanticcontext.prototype.simpleSuggest = function(rdfTypeIri,predicateIri,startString_opt) {
  this.__d("simpleSuggest");
  var sparql = "SELECT DISTINCT ?suggestion WHERE {\n  ?s a <" + rdfTypeIri + "> . \n  ?s <" + predicateIri + "> ?suggestion . \n";
  if (undefined != startString_opt) {
    sparql += "  FILTER regex(?suggestion, \"" + startString_opt + ".*\", \"i\") \n";
  }

  sparql += "} ORDER BY ASC(?suggestion) LIMIT 10";

  this.__d("simpleSuggest: SPARQL: " + sparql);

  var self = this;
  this.db.sparql(sparql,function(result) {
    self.__d("RESPONSE: " + JSON.stringify(result.doc));
    if (result.inError) {
      self._errorPublisher.publish(result.error);
    } else {
      self._suggestionsPublisher.publish({rdfTypeIri: rdfTypeIri, predicate: predicateIri, suggestions: result.doc});
    }
  });
};

// now for generic triple search results
/**
 * Fetches arbitrary facts as requested by the specified sparql. Could return any bindings. Fires an updateFacts event.
 * NB this method does not specify its own OFFSET or LIMIT values.
 *
 * @param {string} sparql - The sparql to use to locate facts
 */
mljs.prototype.semanticcontext.prototype.queryFacts = function(sparql) {
  var self = this;
  self.db.sparql(sparql,function(result) {
    self.__d("semanticcontext: _queryFacts: RESPONSE: " + JSON.stringify(result.doc));
    if (result.inError) {
      self._errorPublisher.publish(result.error);
    } else {
      self._cache(result.doc);
      // pass facts on to listeners
      self._factsPublisher.publish(result.doc);
    }
  });
};










// Document Context




/**
 * A Document context can be used to fetch or update information on a single document in MarkLogic. E.g. fetching and updating properties.
 * This is useful when many widgets on a page are providing different views on a document. E.g. its content, its properties or its permissions.
 *
 * @deprecated use var db = new mljs(); var ctx = db.createDocumentContext(); instead of this constructor.
 *
 * @constructor
 */
mljs.prototype.documentcontext = function() {
  this._highlighted = null; // docuri
  this._selected = null; // docuri

  this._config = {
    template: {title: "Some title",content: "Some content"},
    uriPattern: null, // means decided by server entirely
    allowableProperties: [
      {name: "tag",namespace: "", title: "Tag",parentName: "tags",parentNamespace: "",type: "element", cardinality: "*"}
    ]
  };

  this._constructed = null; // holds the content of the document being constructed/edited
  this._properties = new Array(); // [{property: "" OR element: "", namespaces: [], content: ""}, ...]
  this._uri = null;

  this._highlightedPublisher = new com.marklogic.events.Publisher();
  this._selectedPublisher = new com.marklogic.events.Publisher();
  this._contentPublisher = new com.marklogic.events.Publisher();
  this._partPublisher = new com.marklogic.events.Publisher();
  this._propertiesPublisher = new com.marklogic.events.Publisher();
  this._errorPublisher = new com.marklogic.events.Publisher();
  this._confirmationPublisher = new com.marklogic.events.Publisher();
  this._facetsPublisher = new com.marklogic.events.Publisher();
};

/**
 * Returns the MLJS Workplace Context Configuration definition JSON object
 */
mljs.prototype.documentcontext.getConfigurationDefinition = function() {
  return {
    allowableProperties: {type: "multiple", minimum: 0, default: [
      {name: "tag",namespace: "", parentName: "tags",parentNamespace: "",type: "element", cardinality: "*"}
    ], title: "Allowable Properties", description: "Properties to allow adding/editing of.",
      childDefinitions: {
        name: {type: "string", default: "tag", title: "Name", description: "Element or attribute name of the property."},
        namespace: {type: "string", default: "", title: "Namespace", description: "XML namespace of element or attribute."},
        title: {type: "string", default: "", title: "Property Title", description: "Human readable property title"},
        parentName: {type: "string", default: "tags", title: "Parent Name", description: "Name of the parent element of this property."},
        parentNamespace: {type: "string", default: "", title: "Parent Namespace", description: "XML namespace of the parent of the element or attribute."},
        type: {type: "enum", default: "element", title: "Type", description: "Type of property",
          options: [
            {value: "element", title: "Element", description: "XML Element"},
            {value: "attribute", title: "Attribute", description: "XML Attribute"},
            {value: "property", title: "Property", description: "JSON Property"}
          ]
        },
        cardinality: {type:"enum",default:"1",title:"Cardinality", description: "Number of instances to allow",
          options: [
            {value: "1",title:"1",description:"One instance only"},
            {value: "*",title:"*",description:"Multiple instances"}
          ]
        }
        /*,
        source: {type: "enum", default: "none", title: "Source", description: "Where to list potential options from.",
          options: [
            {value: "none", title: "None", description: "A static text field."},
            {value: "lexicon", title: "Lexicon", description: "The lexicon associated with the field."}
          ]
        }*/
      }
    }
  };
};


/**
 * Sets the configuration of this context using the MLJS Workplace JSON format.
 *
 * @param {JSON} config - The JSON configuration of this context.
 */
mljs.prototype.documentcontext.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }
  /*

  this._config.allowableProperties = new Array();
  var props = config.allowableProperties;
  if (null != props) {
    for (var p, maxp = props.legth,prop;p < maxp;p++) {
      prop = props[p];
      if (undefined != prop) { // array could have been modified. Sanity check only.
        this._config.allowableProperties.push(prop);
      }
    }
  }
  */
};

/**
 * Specifies the subject of properties to use when fetching properties.
 *
 * @param {json} json - The properties JSON to use - [{name: "keyword",title: "Keyword", cardinality: 1 | "*"}, ... ]
 */
mljs.prototype.documentcontext.prototype.addAllowableProperty = function(json) {
  this._config.allowableProperties.push(json);
};

/**
 * Fetches the property configuration for the specified allowed property name
 *
 * @param {string} propname - The property name to lookup
 * @return {json} propertyJson - The available property JSON configuration
 */
mljs.prototype.documentcontext.prototype.getAllowableProperty = function(propname) {
  for (var i = 0, max = this._config.allowableProperties.length,prop;i < max;i++) {
    prop = this._config.allowableProperties[i];
    if (prop.name == propname) {
      return prop;
    }
  }
  return null;
};

/**
 * Returns an array of all allowable properties for this context.
 *
 * @return {Array} properties - An Array of allowable properties JSON objects
 */
mljs.prototype.documentcontext.prototype.getAllowableProperties = function() {
  return this._config.allowableProperties;
};

/**
 * Registers the specified object with this context. Introspects the object.
 * General methods checked for: setDocumentContext
 * Event handlers checked for: updateDocumentContent, updateDocumentProperties, updateOperation, updateDocumentFacets
 * Events listener for: addDocumentSelectionListener, addDocumentHighlightListener
 *
 * Note that updateOperation is a general catch all that is called whenever a document or its properties are updated (to allow page elements to refresh themselves independantly)
 *
 * @param {object} obj - The object to introspect and register with this context.
 */
mljs.prototype.documentcontext.prototype.register = function(obj) {
  var self = this;

  if (undefined != obj.setDocumentContext) {
    obj.setDocumentContext(this);
  }

  // check if this object can respond to our emitted events
  if (undefined != obj.updateDocumentContent) {
    this._contentPublisher.subscribe(function(results) {obj.updateDocumentContent(results)});
  }
  if (undefined != obj.updateDocumentPart) {
    this._partPublisher.subscribe(function(results) {obj.updateDocumentPart(results)});
  }
  if (undefined != obj.updateDocumentProperties) {
    this._propertiesPublisher.subscribe(function(results) {obj.updateDocumentProperties(results)});
  }
  if (undefined != obj.updateOperation) {
    this._confirmationPublisher.subscribe(function(msg) {obj.updateOperation(msg)});
  }
  if (undefined != obj.updateDocumentFacets) {
    this._facetsPublisher.subscribe(function(msg) {obj.updateDocumentFacets(msg)});
  }

  // Where we listen to others' events
  if (undefined != obj.addDocumentSelectionListener) {
    obj.addDocumentSelectionListener(function(docuri) {self.select(docuri)});
  }
  if (undefined != obj.addDocumentHighlightListener) {
    obj.addDocumentHighlightListener(function(docuri) {self.highlight(docuri)});
  }
};

/**
 * Set the highlighted document to the one in the specified URI. Fires NOTHING AT THE MOMENT TODO SHOULD BE updateDocumentHighlighted
 *
 * @param {string} docuri - The URI of the document highlighted (usually hovered over)
 */
mljs.prototype.documentcontext.prototype.highlight = function(docuri) {
  this._highlighted = docuri;

  this._highlightedPublisher.publish(docuri);
};

/**
 * Set the document selected.
 *
 * @param {string} docuri - The document to select
 */
mljs.prototype.documentcontext.prototype.select = function(docuri) {
  this._selected = docuri;

  this._selectedPublisher.publish(docuri);
};

/**
 * Fetches the content of the specified document uri.
 *
 * @param {string} docuri - The document
 */
mljs.prototype.documentcontext.prototype.getContent = function(docuri) {
  var self = this;

  if (undefined == docuri || ""==docuri || "string"!==typeof(docuri)) {
    return;
  }

  this.db.get(docuri,function(result) {
    if (result.inError) {
      self._errorPublisher.publish(result.detail);
    } else {
      self._constructed = result.doc;
      self._uri = docuri;
      self._contentPublisher.publish(result);
    }
  });
};

/**
 * Finds a document with an originalurl element the same as the given URI, and then call getContent for that document.
 *
 * @param {string} docuri - The document uri
 */
mljs.prototype.documentcontext.prototype.getFilteredContentFor = function(docuri) {
  // do a search for a doc with originalurl=docuri
  // now do getContent for that search result's uri
  var qb = this.db.createQuery();
  qb.query(qb.elementValue("originalurl","",docuri));
  var q = qb.toJson();
  var self = this;
  this.db.structuredQuery(q,function(result) {
    if (result.inError) {
      self._errorPublisher.publish(result.detail);
    } else {
      self.__d("result: " + JSON.stringify(result.doc));
      if (null != result.doc.results && result.doc.results.length > 0) {
        self.getContent(result.doc.results[0].uri);
      }
    }
  });
};

/**
 * Fetches all the properties for the specified docuri
 *
 * @param {string} docuri - The document
 */
mljs.prototype.documentcontext.prototype.getProperties = function(docuri) {
  var self = this;

  if (undefined == docuri || ""==docuri || "string"!==typeof(docuri)) {
    return;
  }

  this.db.properties(docuri,function(result) {
    if (result.inError) {
      self._errorPublisher.publish(result.detail);
    } else {
      this._uri = docuri;
      self._propertiesPublisher.publish({docuri: docuri, properties: result.doc});
    }
  });
};

/**
 * Sets the properties (merges using V7 functionality) of the specified document uri.
 *
 * @param {string} docuri - The document
 * @param {json} propertyJson - The property JSON to use (as per the REST API)
 */
mljs.prototype.documentcontext.prototype.setProperties = function(docuri,propertyJson) {
  // V6 PUT /v1/documents?mode=metadata
  var self = this;
  this.db.saveProperties(docuri,propertyJson, function(result) {

    self._confirmationPublisher.publish({docuri: docuri, operation: "setProperties", success: !result.inError, error: result.detail});

    // perform properties refetching (will refresh display after edit)
    self.getProperties(docuri);
  });


  // fire operation success so user knows on the UI that patch operation was successful - confirmationPublisher? Via operationId generated in this function, unique to this context?
};

/**
 * TODO does nothing at the moment. Should use V6's POST /v1/document?mode=metadata to patch the properties
 */
mljs.prototype.documentcontext.prototype.patchProperty = function(docuri,propertyXpath,propertXml) {
  // V7 POST /v1/documents?mode=metadata with HTTP PATCH EQUIV HEADER
  // perform patch

  // perform properties refetching (will refresh display after edit)

  // fire operation success so user knows on the UI that patch operation was successful - confirmationPublisher? Via operationId generated in this function, unique to this context?
};

/**
 * Loads the facets for the specified document and options. Affectively does a document-query. Requires that the options specified has a contraint named 'uriconstraint'.
 *
 * @param {string} docuri - The document
 * @param {string} optionsName - The pre saved options configuration to use
 */
mljs.prototype.documentcontext.prototype.getFacets = function(docuri,optionsName) {
  if (undefined == docuri || ""==docuri || "string"!==typeof(docuri)) {
    return;
  }
  // perform a search but just for a single document (uri constraint) in order to load all its facets that are relevant for the interested object/widget
  var b = this.db.createQuery();
  b.query(b.uris("uriconstraint",docuri));
  var qj = b.toJson();

  var self = this;
  this.db.structuredSearch(qj,optionsName,function(result) {

    if (undefined != result.doc.facets) {
      self._facetsPublisher.publish({docuri: docuri, facets: result.doc.facets});
    }
  });
};


/*
fieldDef = {
  title: "Main Heading", path: "/h:body/h:h1[1]", namespaces: {h: "http://whatever"}, // also path: "some.json.path"
  type: "string|datetime|date|positiveInteger|integer|float|double", // basically any xs: intrinsic type
  required: true, min: 1, max: 7, default: 5, multiple: true // min max for numeric types, multiple for multi instance selects (for example)
}

// title defaults to CamelCase and split of last path element, type to string, required to false, multiple false, no namespaces
// thus only required field is path.
*/

/**
 * Sets the value of a part (field aka property aka element aka attribute) within the document.
 * @param {json} fieldDef - The field definition
 * @param {string|number} - The raw JavaScript content
 */
mljs.prototype.documentcontext.prototype.setPart = function(fieldDef,content) {
  this.completeFieldDef(fieldDef);
 // TODO figure out generic replaceValue() function

   // construct and apply XPath from namePath
   //var xpath = "/" + namePath.replace(/\./g,"/");
   var xpath = fieldDef.path;
   //xpath = xpath.replace(/\/.*:/g,"/*:"); // replace all namespaces with global namespace - temporary hack
   console.log("Final XPath now: " + xpath);

  // TODO support JSON documents

   // TODO apply xpath to extract document value
  var myfunc = function(prefix) {
    if (undefined != fieldDef.namespaces) {
      return fieldDef.namespaces[prefix];
    } else {
      if (prefix === "jb") {
        return "http://marklogic.com/xdmp/json/basic";
      } else if (prefix === "i") {
        return "http://www.marklogic.com/intel/intercept";
      }
    }
    return null;
     //return null; // assume always default namespace
     // TODO support namespaces globally somehow - global context? page context?
  };

  // get node
  var iterator = this._constructed.evaluate(xpath,this._constructed,myfunc,XPathResult.ORDERED_NODE_ITERATOR_TYPE,null); // TODO WHY IS THIS NOT WORKING???
  var child = iterator.iterateNext();
  //for (var i = 0, max = children.length, child;i < max;i++) {
  if (child) { // first only (assume they forgot [1] on the end of the xpath)
    //child = children.item(i);
    // cannot execute xpath on child nodes
    // if has content, remove it
    for (var n = 0;n < child.childNodes.length;n++) {
      child.removeChild(child.childNodes.item(n));
    }
    // set content text node
    child.innerHTML = content; // TODO check for XML Node here too
    // TODO check the above works in Node.js without changes
  }

};

/**
 * Returns the value of the given part, or null if it doesn't exist yet
 * @param {json} fieldDef - The field definition
 */
mljs.prototype.documentcontext.prototype.getPart = function(fieldDef) {
  this.completeFieldDef(fieldDef);
  return this._getConstructedPart(fieldDef);
};

mljs.prototype.documentcontext.prototype._getConstructedPart = function(fieldDef) {
  var self = this;
  if (undefined == this._constructed) {
    this.__d("documentcontext._getConstructedPart: NO CONSTRUCTED CONTENT YET! CANNOT FETCH FIELD");
  }
  return this.db.extractValue(this._constructed,fieldDef.path,fieldDef.namespaces);
};

/**
 * Sets the template to use for a new document. WARNING: This does NOT call reset() to clear the currently saved document!
 * @param {string|XMLDocument|JSON} templateContent - The content to use in the template.
 */
mljs.prototype.documentcontext.prototype.setTemplate = function(templateContent) {
  this._config.template = templateContent;
  if (undefined == this._constructed) {
    this.reset();
  }
};

/**
 * Returns the current template value (WARNING: May be text if set via Workplace, not an XML Document or JSON object)
 */
mljs.prototype.documentcontext.prototype.getTemplate = function() {
  return this._config.template;
};

/**
 * Resets the content of this document to null or the template value. Converts to XML or JSON automatically.
 * Call this method when you've loaded a document, but now wish to work on a new document, without using the same URI or properties.
 * Forces a call to updateContent()
 */
mljs.prototype.documentcontext.prototype.reset = function() {
  this._constructed = null;
  this._properties = new Array();

  // generate new content from template
  if (undefined != this._config.template) {
    this._constructed = this._config.template;
    if ("string" == typeof(this._constructed)) {
      if (this._constructed.substring(0,1) == "<") {
        // XML
        this._constructed = this.db.textToXML(this._constructed);
      } else {
        // try JSON
        this._constructed = JSON.parse(this._constructed);
      }
    }
  }
  this._contentPublisher.publish({docuri: null,doc: this._constructed});
};


mljs.prototype.documentcontext.prototype.completeFieldDef = function(fieldDef) {
  // validate/fix/fill in field def
  if (undefined == fieldDef.title) {
    if ("/" == fieldDef.path.substring(0,1)) {
      // XPath
      var start = 0;
      var end = fieldDef.path.length;
      console.log("CFD: original: " + fieldDef.path);
      var lastIndex = fieldDef.path.lastIndexOf("/");
      console.log("CFD: last slash: " + lastIndex);
      if (-1 != lastIndex) {
        var lastColon = fieldDef.path.indexOf(":", lastIndex + 1);
        console.log("CFD: last colon: " + lastColon);
        if (-1 != lastColon) {
          start = lastColon + 1;
        } else {
          start = lastIndex + 1;
        }
      } else {
        // leave as start of string
      }
      console.log("CFD: start now: " + start);
      var square = fieldDef.path.indexOf("[",start);
      console.log("CFD: square: " + square);
      if (-1 != square) {
        end = square;
      } else {
        // leave as end of string
      }
      fieldDef.title = this.db.stringhelper.processValueAll(fieldDef.path.substring(start,end));
    } else {
      // JSON Path
      if (-1 != fieldDef.path.lastIndexOf(".")) {
        fieldDef.title = this.db.stringhelper.processValueAll(fieldDef.path.lastIndexOf("."));
      } else {
        fieldDef.title = this.db.stringhelper.processValueAll(fieldDef.path);
      }
    }
  }

  if (undefined == fieldDef.namespaces) {
    fieldDef.namespaces = {};
  }

  if (undefined == fieldDef.type) {
    fieldDef.type = "string";
  }

  if (undefined == fieldDef.required) {
    fieldDef.required = false;
  }

  if (undefined == fieldDef.multiple) {
    fieldDef.multiple = false;
  }

  if (undefined == fieldDef.default) {
    fieldDef.default = "";
  }
};

/**
 * Saves this document content, properties and permissions in one hit via a PUT to /v1/documents - mljs.save().
 * If a new document, sets the value of context._uri to the new document's URI.
 * Forces an immediate getContent() in order to load any changes by pre-commit triggers.
 * (This also gives you the URI via updateContent({docuri: "uri", doc: XML|JSON}); ).
 */
mljs.prototype.documentcontext.prototype.save = function() {
  var self = this;
  this.db.save(this._constructed,this._uri,{
    properties: self._properties
  }, function(result) {
    if (result.inError) {
      // uh oh

      self._errorPublisher.publish(result.detail);
    } else {
      if (null != result.docuri) {
        self._uri = result.docuri; // TODO check this is correct
      }

      self.getContent(self._uri); // forces content publish too
    }
  });
};












/**
 * IN DEVELOPMENT - A SparqlBuilder object for easy (and performant) sparql creation.
 *
 * var b = db.createSparqlBuilder()
 * b.subject("JointCustomer").with(
 *   b.subject("NKBCustomer").with(
 *     b.subject("NKBAccount").has("balance", "&lt;", 100).has("nkbaccountid")
 *   ),
 *   b.subject("NICClient").with(
 *     b.subject("MLDocument").has("docuri")
 *   ).has("nicclientid")
 * );
 * var sparql = b.toSparql();
 *
 * This would generate (using short form of IRIs for readability):-
 *
 * SELECT DISTINCT ?subject WHERE {
 *   ?subject rdf:type &lt;JointCustomer&gt; .
 *   ?subject ?pred1 ?nkbcustomer1 .
 *     ?nkbcustomer1 rdf:type &lt;NKBCustomer&gt; .
 *     ?nkbcustomer1 ?pred2 ?nkbaccount2 .
 *       ?nkbaccount2 rdf:type &lt;NKBAccount&gt; .
 *       ?nkbaccount2 ?balance ?value3 .
 *       FILTER (?balance &lt; "100"^^&lt;xs:integer&gt;) .
 *   ?subject ?pred4 ?nicclient4 .
 *     ?nicclient4 rdf:type &lt;NICClient&gt; .
 *     ?nicclient4 ?pred5 ?mldocument5 .
 *       ?mldocument5 rdf:type &lt;MLDocument&gt; .
 *       ?mldocument5 ?pred6 ?docuri .
 *     ?nicclient4 ?pred7 ?nicclientid
 * }
 *
 * @constructor
 */
mljs.prototype.sparqlbuilder = function() {
  this._exposedVariables = new Array(); // string variable names
  this._topTerms = new Array(); // {subject:, predicate: , object: , type: "property|rdftype|docuri|relationship"}
  this._allTerms = new Array(); // as topTerms above

  this._nextTermID = 1;
};

/**
 * Returns the sparql generated
 *
 * TODO complete method
 */
mljs.prototype.sparqlbuilder.prototype.toSparql = function() {
  // TODO
};


// TODO the following should be mixed in to new Term objects
/**
 * Generates a subject with the specified rdf type IRI
 *
 * TODO complete this method
 */
mljs.prototype.sparqlbuilder.subject = function(rdftype) {
  var tid = this._nextTermID++;
  return {termID: tid, sparql: "  ?s" + tid + " a <" + rdftype + "> .\n"};
};

/**
 * Includes the specified predicate IRI from the parent subject object
 *
 * TODO complete method
 */
mljs.prototype.sparqlbuilder.prototype.has = function(predicateIri) {
  var tid = this._nextTermID++;
  return {termID: tid, sparql: "  ?s" + tid + " <" + predicateIri + "> ?o" + tid + " .\n"};
};

/**
 * Includes the specified dependant (target of a relationship) Subject
 *
 * TODO complete this method, and include predicate specification (optional)
 */
mljs.prototype.sparqlbuilder.prototype.with = function(childTerm) {

};












/**
 * Handles widgets that respond to a change in the area or interest, or locale.
 * This could be a specific point on the Earth (lat,lon), town, county, area, or combination of these areas within an overall set of bounds.
 * E.g. think of an interactive system where several points or areas are selected to define the maximum bounded context, rather than a specific
 * part of the overall interface.
 *
 * From cambridge english dictionary:-
 * Locale Noun(c): an area or place, especially one where something special happens, such as the action in a book or a film:
 *  "The book's locale is a seaside town in the summer of 1958."
 *
 * @constructor
 * @deprecated use var db = new mljs(); var ctx = db.createGeoContext(); instead
 */
mljs.prototype.geocontext = function() {
  this._localePublisher = new com.marklogic.events.Publisher();

  this._areas = {}; // contribution_name => Array of ML point+radius/rect/polygons
  this._home = new Array(); // Array of ML point+radius/rect/polygons
  this._alwaysFallback = true; // by default always fall back to this location (probably normally a rect bounds of the entire earth/country)

  // info for updating related search context(s)
  this._searchContexts = new Array(); // array of {context: context, constraintName: null|value}
  this._defaultConstraintName = "location";

  this._configurationContext = null;

  this._config = {
    homelat: null, homelon: null, homeradius: null // convenience home configuration
  }; // TODO move configurations in to here
  // TODO add linked SC link here
};

mljs.prototype.geocontext.prototype.setConfigurationContext = function(cc) {
  this._configurationContext = cc;
};

mljs.prototype.geocontext.getConfigurationDefinition = function() {
  return {
    homelat: {type: "double", default: null, title: "Home Latitude", description: "Default location latitude WGS84."},
    homelon: {type: "double", default: null, title: "Home Longitude", description: "Default location longitude WGS84."},
    homeradius: {type: "double", default: null, title: "Home Radius", description: "Default location radius statute miles."}
  };
};

mljs.prototype.geocontext.prototype.setConfiguration = function(config) {
  this._config = config;
  if (undefined != this._config.homelat && undefined != this._config.homelon) {
    this.homeRadius(this._config.homelat,this._config.homelon,this._config.homeradius,this._alwaysFallback); // TODO update config reference for _config
  }
  // TODO lookup linked sc context instance via config context
};

// initialisation methods

/**
 * Registers a widget or class with this context. Introspects the parameter passed for methods and relevant event listeners
 *
 * @param {JSON} widget - The widget or javascript instance to register
 */
mljs.prototype.geocontext.prototype.register = function(widget) {
  if (undefined != widget.setGeoContext) {
    widget.setGeoContext(this);
  }
  // check event handlers
  if (undefined != widget.updateLocale) {
    this._localePublisher.subscribe(function(locale) {widget.updateLocale(locale);});
  }
};

// settings methods (chainable)
/**
 * Instructs this geocontext to contribute a structured query (and query of geo constraint queries) to a search context.
 *
 * @param {searchcontext} searchContext - The search context to call contributeStructuredQuery on
 * @param {string} name - The contributor name to use
 * @param {string} constraint_opt - The optional constraint name to use. Will default to this context's defaultConstraintName (see constraint() ) if not specified
 */
mljs.prototype.geocontext.prototype.inform = function(searchContext,name,constraint_opt) {
  this._searchContexts.push({context: searchContext, name:name, constraint: constraint_opt});
  return this;
};

/**
 * Clears the array of search contexts to be updated with queries for. Chainable.
 */
mljs.prototype.geocontext.prototype.clear = function() {
  this._searchContexts = new Array();
  return this;
};

/**
 * Chainable function that sets the default constraint for all search contexts, if they don't specify one themselves
 *
 * @param {string} defaultConstraintName - The name of the constraint to alter in the linked search context objects, if they do not specify their own constraint name
 */
mljs.prototype.geocontext.prototype.constraint = function(defaultConstraintName) {
  this._defaultConstraintName = defaultConstraintName;
  return this;
};

/**
 * Where this context should initially use as a location. Fires an update. Chainable.
 *
 * @param {JSON|Array} areaOrArray - area, or array of areas, to include as a base location
 * @param {boolean} alwaysFallback - Whether this should be used just as a start position (false), or always used as a default location when no areas have been contributed (true).
 */
mljs.prototype.geocontext.prototype.home = function(areaOrArray,alwaysFallback) {
  this._home = areaOrArray;
  if (undefined != alwaysFallback) {
    this._alwaysFallback = alwaysFallback;
  }
  return this;
};


/**
 * Convenience method for home() to set home location to a point with an optional radius (defaults to 20 miles).
 *
 * @param {number} lat - latitude of home point
 * @param {number} lon - longitude of home point
 * @param {number} radiusMiles_opt - optional radius of home point location (default 20 miles)
 * @param {boolean} alwaysFallback - Whether this should be used just as a start position (false), or always used as a default location when no areas have been contributed (true).
 */
mljs.prototype.geocontext.prototype.homeRadius = function(lat,lon,radiusMiles_opt,alwaysFallback_opt) {
  var qb = this.db.createQuery();
  this._home = qb.circleDef(lat,lon,radiusMiles_opt || 20);

  if (undefined != alwaysFallback_opt) {
    this._alwaysFallback = alwaysFallback_opt;
  }
  return this;
};

// public invocation methods

/**
 * Contributes an area definition. Areas can be a point, circle, box or polygon JSON, or an array of a mix of those.
 *
 * @param {string} contributor - The contributor of this area
 * @param {JSON|Array} areaOrArray - The area JSON, or array of them, to add
 */
mljs.prototype.geocontext.prototype.contributeArea = function(contributor,areaOrArray) {
  if (null == areaOrArray || false === areaOrArray) {
    this._areas[contributor] = [];
  } else {
    // ensure it is an array for later internal logic
    if (!Array.isArray(areaOrArray)) {
      areaOrArray = [areaOrArray];
    }
    this._areas[contributor] = areaOrArray;
  }

  this._refresh();
};

// internal methods

mljs.prototype.geocontext.prototype._refresh = function() {
  // if we have an associated search context, subject this all as an and-query to that context
  for (var i = 0, max = this._searchContexts.length, ctx;i < max;i++) {
    ctx = this._searchContexts[i];

    // must create this for each context as constraint names will differ
    var terms = new Array();
    var areas = this._areas;
    var addTerm = function(def) {
      var t = {"geospatial-constraint-query": { "constraint-name": ctx.constraint || this._defaultConstraintName}};
      for (var item in def) {
        t["geospatial-constraint-query"][item] = def[item]; // copies 'point' etc from definition to query
      }
      terms.push(t);
    };
    for (var areaName in areas) {
      var area = this._areas[areaName];
      for (var j = 0, max = area.length, def;j < max;j++) {
        def = area[j];
        addTerm(def);
      }
    }
    if (0 == terms.length && this._alwaysFallback) {
      addTerm(this._home);
    }
    var query = {"and-query": terms};
    ctx.context.contributeStructuredQuery(ctx.name,query);
  }

  // fire internal update events next (make the search look quicker if we do this whilst the search is processing)
  this._fireLocaleUpdate();
};

// event firing methods

mljs.prototype.geocontext.prototype._fireLocaleUpdate = function() {
  var update = {
    center: {latitude: 0, longitude: 0}, // required, defaults to NaN, NaN
    bounds: {north: 0, east: 0, south: 0, west: 0}, // required defaults to NaN, NaN, NaN, NaN
    areas: [] // required, but may be an empty array
  };
  // TODO copy over areas
  var areas = new Array();
  for (var areaName in this._areas) {
    var area = this._areas[areaName];
    for (var i = 0, max = area.length, def;i < max;i++) {
      def = area[i];
      areas.push(def);
    }
  }
  if (0 == areas.length && this._alwaysFallback) {
    areas.push(this._home);
  }
  update.areas = areas;
  // TODO calculate bounds, then center
  // for now, take first circle point encountered
  var found = false;
  for (var i = 0, max = areas.length, area;i < max && !found;i++) {
    area = areas[i];
    if (undefined != area.circle) {
      found = true;
      update.center = area.circle.point[0]; // always an array in ML JSON
    }
  }
  // fire event
  this._localePublisher.publish(update);
};



// NB SHOULD NOT BE USED DIRECTLY - SHOULD BE WRAPPED AS AN ABSTRACT CLASS
mljs.prototype.configurationcontext = function(parent) {
  var oldregister = parent.register;
  parent.register = function(widget) {
    if (undefined != widget.setConfigurationContext) {
      widget.setConfigurationContext(parent);
    }
    if (undefined != oldregister) {
      oldregister(widget); // incase we're part of another context with a register function - chaining function calls
    }
  };
  parent.getInstance = parent.getInstance || function(instanceName) {
    return null;
  };
  return parent;
};








/**
 * Supports the MLJS WebServer W3C WebSockets based alert channel capability. Requires Node.js running the MLJS web server.
 * This provides for real time alerting from the database directly to (multiple) browser clients.
 * This alert context is very low level, leaving higher level message unpacking to application specific plugins.
 */
mljs.prototype.alertcontext = function() {
  this.supported = false;
  this.state = "initialising"; // also testing, connected, disconnected, connection_error
  this.socket = null;

  this._config = {};

  this._alertPublisher = new com.marklogic.events.Publisher();
  this._statePublisher = new com.marklogic.events.Publisher();

  this._init();
};


/**
 * Returns the MLJS Workplace configuration definition listing config properties supported by this context
 *
 * @static
 */
mljs.prototype.alertcontext.getConfigurationDefinition = function() {
  return {
  }
};

/**
 * Sets the configuration for this instance of a context in an MLJS Workplace
 *
 * @param {json} config - The JSON Workplace context configuration to apply
 */
mljs.prototype.alertcontext.prototype.setConfiguration = function(config) {
  for (var prop in config) {
    this._config[prop] = config[prop];
  }

  // refresh display
  //this._refresh();
};

mljs.prototype.alertcontext.prototype._init = function() {

  if("WebSocket" in window) {  // TODO handle use within Node.js too
    //The user has WebSockets
    this.supported = true;
    this._connect();
  }
};

mljs.prototype.alertcontext.prototype._connect = function() { // TODO support Node.js native connections
  try {
    var self = this;
    //var host = "ws://localhost:8080/"; // choose same as current window host/port
    var host = window.location;
    var startPos = host.indexOf("://") + 3;
    var colonPos = host.indexOf(":",startPos);
    var port = 80;
    var slashPos = host.indexOf("/",startPos);
    if (-1 != colonPos) {
      if (-1 == slashPos) {
        // no ending slash or :, so assume port 80
        host = host.substring(startPos);
      } else {
        port = 1 * host.substring(colonPos + 1,slashPos);
        host = host.substring(startPos,colonPos);
      }
    } else {
      // assume port 80, find end of host
      if (-1 != slashPos) {
        host = host.substring(startPos,slashPos);
      } // else host is whole thing
      else {
        host = host.substring(startPos);
      }
    }
    host = "ws://" + host + ":" + port;

    this.socket = new WebSocket(host,"mljs-alerts"); // TODO handle use within Node.js too

  /* msg.data =
   {
     response: "test|alert|search",
     content: json | textAsxml
   }


  */



    //message('<p class="event">Socket Status: '+socket.readyState);
    this.socket.onopen = function() {
      //message('<p class="event">Socket Status: '+socket.readyState+' (open)');
      // send message to login once connected
      self.state = "testing";
      self.socket.send(JSON.stringify({request:"test"}));
    };
    this.socket.onmessage = function(msg) {
      //console.log("MSG: " + msg.data);

         // TODO anything else with msg.* ?

         var json = JSON.parse(msg.data);
         if (json.response == "test") {
           // test works - we're connected
           self._changeState("connected");
         } else {
           // fire message off to listeners
           self._alertPublisher.publish(json);
         }

    };
    this.socket.onclose = function(){
         //message('<p class="event">Socket Status: '+socket.readyState+' (Closed)');
         self._changeState("disconnected");
    };


  } catch(exception){
     //message('<p>Error'+exception);
     self._changeState("connection_error");
  }

};

mljs.prototype.alertcontext.prototype.getState = function() {
  return this.state;
};

mljs.prototype.alertcontext.prototype._changeState = function(newState) {
  this.state = newState;
  this._statePublisher.publish(newState);
};

mljs.prototype.alertcontext.prototype.register = function(wgt) {
  if (undefined != wgt.updateAlert) {
    this._alertPublisher.subscribe(function(alert) {wgt.updateAlert(alert);});
  }
  if (undefined != wgt.updateAlertState) {
    this._statePublisher.subscribe(function(state) {wgt.updateAlertState(state);});
  }
};










/**
 * Abstracts data collation from many sources, across multiple calls
 * E.g. one source may be facets from a document query, another triples relating to the subject (reference data),
 * another still may be cooccurence data.
 * This class is an extract of visual functionality in the highcharts and openlayers widgets.
 */
mljs.prototype.datacontext = function() {
  //this.TYPE_RESULTS_METRICS          = 1;
  this.TYPE_RESULTS_RESULTS          = 2;
  this.TYPE_RESULTS_DOCUMENT_FACETS  = 3;
  this.TYPE_COOCCURENCE              = 4;
  this.TYPE_TRIPLES                  = 5;

  this._config = {
    sources: [],
    splitby: "source", // "source"(default), "field"
    splitfield: "", // Could be any field name. Use "type" as a good automatic choice, blank for "source" splitby, or no series split
    fields: []
  };

  // 1. Store sources data
  this._sourceInfo = {}; // sourceName -> {data: [{field1:val1, field2:val2, ...}, ...], listener: lisFunc}

  // 2. join sources in to a single representation
  /*
   * Joined data merged from multiple sources -
   * {
   *   series: [
   *     {name:"", data: [
   *       {
   *         identity: "Derby", fields: {
   *           city: "Derby", high: 28, low: 18, county: "Derbyshire", readings: [18,27,45,34,1]
   *         }
   *       }, ...
   *     ]}, ...
   *   ]
   * }
   */
  this._joined = [];
  // 3. Work on the data. Perform aggregations where applicable, alter values, etc. Also calculate total fields present
  this._data = [] // as for joined
  this._fields = []; // {title: "City", field: "city"}, ... // was , "county", "high", "low", "readings"

  this._dataUpdatePublisher = new com.marklogic.events.Publisher();
};

/**
 * Gets the configuration properties supported by this context
 */
mljs.prototype.datacontext.getConfigurationDefinition = function() {
  return {
    splitby: {type: "enum", title: "Split Series by", description: "How to split data in to separate series",
      default: "source", options:[
        {value:"source", title: "Source name", description: "Use the Source name as the Series name"},
        {value:"field", title: "Field name", description: "Use a field's value as the Series name"}
      ]
    },
    splitfield: {type: "string", title: "Split Field", description: "The field to split in to series by (if field split mode)", default: ""},
    sources: {type: "multiple", title: "Sources", description: "Where to extract data from", minimum: 0, default: [],
      childDefinitions: {
        name: {type: "string", default: "", title: "Source name", description: "The unique name of the source"},
        sourceSearchContext: {type: "SearchContext", default: null, title: "Source Search Context", description: "Where to get the data from"},
        sourceSemanticContext: {type: "SemanticContext", default: null, title: "Source Semantic Context", description: "Where to get the data from"},
        type: {type: "enum", default: "2", title: "Type", description: "Type of data to place in to result set",
          options: [
            {value: "2", title: "Search Results", description: "Search result extracts, metadata, and content"},
            {value: "3", title: "Search Facets", description: "Search result facet information"},
            {value: "4", title: "Co-occurence", description: "Co-occurence values"},
            {value: "5", title: "Semantic Triples", description: "Semantic triples"}
          ]
        },
        identity: {type: "string", default: "", title: "Identity Field", description: "The optional field name to use as the record primary key ID for joining data sets"}
      }
    },
    fields: {type: "multiple", title: "Fields", description: "Field settings", minimum: 0, default: [
      {name: "_uri", type: "uri"}// , // default to extracting search context's uri field
      // {name: "_iri", type: "iri"} // TODO add this in future for semanticcontext extracts
    ],
      childDefinitions: {
        name: {type: "string", default: "", title: "Field name", description: "Short field name in the data series"},
        type: {type: "enum", default: "point", title: "Type", description: "Type override",
          options: [
            {value: "point", title: "Point", description: "XML point field, comma delimited WGS84 lat,lon point."},
            {value: "linestring", title: "Line String", description: "GML Line String field."},
            {value: "uri", title: "Document URI", description: "A string representation a MarkLogic document URI."},
            {value: "heatmap", title: "Heatmap facet", description: "Facet containing heatmap boxes."}
          ]
        }
      }
    }
  };

};

mljs.prototype.datacontext.prototype.getUriFieldData = function(row) {
  var data = {};
  for (var f = 0,maxf = this._config.fields.length,field;f < maxf;f++) {
    field = this._config.fields[f];
    if (field.type == "uri") {
      var rowfield = row.fields[field.name];
      if (undefined != rowfield) {
        data[field.name] = rowfield;
      }
    }
  }
  return data;
};

mljs.prototype.datacontext.prototype.getPointFieldData = function(row) {
  var data = {};
  for (var f = 0,maxf = this._config.fields.length,field;f < maxf;f++) {
    field = this._config.fields[f];
    if (field.type == "point") {
      var rowfield = row.fields[field.name];
      if (undefined != rowfield) {
        var value = rowfield.split(",");
        data[field.name] = {lat: value[0], lon: value[1]};
      }
    }
  }
  return data;
};

mljs.prototype.datacontext.prototype.getLineStringFieldData = function(row) {
  var data = {};
  for (var f = 0,maxf = this._config.fields.length,field;f < maxf;f++) {
    field = this._config.fields[f];
    if (field.type == "linestring") {
      var rowfield = row.fields[field.name];
      if (undefined != rowfield) {
        data[field.name] = rowfield;
      }
    }
  }
  return data;

};

mljs.prototype.datacontext.prototype.getHeatmapFieldData = function(row) {
  var data = {};
  for (var f = 0,maxf = this._config.fields.length,field;f < maxf;f++) {
    field = this._config.fields[f];
    if (field.type == "heatmap") {
      var rowfield = row.fields[field.name];
      if (undefined != rowfield) {
        data[field.name] = rowfield;
      }
    }
  }
  return data;

};

mljs.prototype.datacontext.prototype.getLineStringOrderedPoints = function(fielddata) {
  // TODO extract linestring value in to lon/lat points
  return [];
};


/**
 * Sets the configuration parameters for this context
 * @param {json} config - The JSON configuration for this context
 */
mljs.prototype.datacontext.prototype.setConfiguration = function(config) {
  for (var c in config) {
    this._config[c] = config[c];
  }
  for (var s = 0,maxs = this._config.sources.length,src;s < maxs;s++) {
    src = this._config.sources[s];
    var ctx = null;
    if (5 == src.type) {
      ctx = src.sourceSemanticContext;
    } else {
      ctx = src.sourceSearchContext;
    }
    this.addDataSource(src.name,src.type,config.getInstance(ctx), src.identity);
  }
  this.reprocess();
};

mljs.prototype.datacontext.prototype.splitBySource = function() {
  this._config.splitby = "source";
  return this;
};

mljs.prototype.datacontext.prototype.splitByField = function(fieldName) {
  this._config.splitby = "field";
  this._config.splitfield = fieldName;
  return this;
};

mljs.prototype.datacontext.prototype.getSplitBy = function() {
  return this._config.splitby;
};

mljs.prototype.datacontext.prototype.getSplitField = function() {
  return this._config.splitfield;
};

/**
 * Reprocess source data based on new settings. Fires data update event
 */
mljs.prototype.datacontext.prototype.reprocess = function() {
  this._join();
};

mljs.prototype.datacontext.prototype._findSource = function(sourceName) {
  for (var s in this._sourceInfo) {
    var source = this._sourceInfo[s];
    if (s == sourceName) {
      return source;
    }
  }
  var src = {data: [],listener: null};
  this._sourceInfo[sourceName] = src;
  return src;
};

mljs.prototype.datacontext.prototype._join = function() {
  this.__d("datacontext._join: entered function");

  // join data from sources
  var seriesData = [];

  var findSeries = function(seriesName) {
    for (var se = 0,maxse = seriesData.length,ser;se < maxse;se++) {
      ser = seriesData[se];
      if (ser.name == seriesName) {
        return ser;
      }
    }
    // no series yet
    var newSer = {name: seriesName, data: []};
    seriesData.push(newSer);
    return newSer;
  };

  var findIdentityData = function(seriesName,identity) {
    var series = findSeries(seriesName); // {identity: "Derby", fields: {high:28, low: 18}}
    var data = series.data;
    for (var i = 0, maxi = data.length,row;i < maxi;i++) {
      row = data[i];
      if (row.identity == identity) {
        return row;
      }
    }
    var r = {identity: identity, fields: {}};
    data.push(r);
    return r;
  };

  // loop over every source
  this.__d("datacontext._join: processing " + this._config.sources.length + " data sources");
  for (var s = 0,maxs = this._config.sources.length,sourceName,source,series;s < maxs;s++) {
    sourceName = this._config.sources[s].name;
    source = this._findSource(sourceName);
    series = "";
    if ("source" == this._config.splitby) {
      series = sourceName;
    }
    // for every data item, find the identity row
    this.__d("datacontext._join:   processing " + source.data.length + " rows of data in source");
    for (var d = 0,maxd = source.data.length,sourceData;d < maxd;d++) {
      sourceData = source.data[d]; // just a list of fields
      // get identity field value
      var identity = sourceData[source.identity];
      if (undefined == identity) {
        identity = ""; // valid
      }
      // copy over fields
      var row = findIdentityData(series,identity);
      for (var field in sourceData) {
        row.fields[field] = sourceData[field];
      }
    }
  }

  this._joined = seriesData;

  // process data
  this.__d("datacontext._join: joined data: " + JSON.stringify(this._joined));
  this.__d("datacontext._join: calling process function");
  this._process();
  this.__d("datacontext._join: exiting function");
};

mljs.prototype.datacontext.prototype._process = function() {
  this.__d("datacontext._process: entered function");
  // loop through already joined data
  var newFields = new Array();
  var newData = new Array();

  var self = this;
  var hasField = function(fname) {
    //self.__d("datacontext._process: hasField looping over " + newFields.length + " fields");
    for (var f = 0,maxf = newFields.length,fi;f < maxf;f++) {
      fi = newFields[f];
      if (fi.field == fname) {
        return true;
      }
    }
    return false;
  };

  this.__d("datacontext._process: processing " + this._joined.length + " rows of joined data");
  for (var s = 0,maxs = this._joined.length,series;s < maxs;s++) {
    series = this._joined[s];
    var newSeriesData = new Array();

    this.__d("datacontext._process: processing " + series.data.length + " rows in the " + series.name + " series");
    for (var j = 0,maxj = series.data.length,row;j < maxj;j++) {
      row = series.data[j];
      this.__d("datacontext._process:   row " + j + " data: " + JSON.stringify(row));

      // update master field list
      for (var field in row.fields) {
        if (!hasField(field)) {
          newFields.push({title: field, field: field}); // TODO see if a field configuration is available with a human readable title for the field
        }
      }

      // TODO process data values and perform aggregations where configured
      newSeriesData.push(row);
    }

    newData.push({name: series.name, data: newSeriesData});
  }
  // update data fields
  this._data = newData;
  this._fields = newFields;

  var self = this;

  this.__d("datacontext._process: processed fields: " + JSON.stringify(this._fields) + " with data: " + JSON.stringify(this._data));

  this.__d("datacontext._process: publishing new data");

  // fire data updated event
  this._dataUpdatePublisher.publish(this);

  this.__d("datacontext._process: exiting function");
};

/**
 * Add a new data source to this data context
 * @param {string} name - The name to give to this source
 * @param {integer} type - The type of data source - 2=results,3=facets,4=cooccurence,5=semantic triples
 * @param {object} sourceContext - The search or semantic context to pull data from
 * @param {string} identity - The field name in the context's data that is to be used for joining data sets
 */
mljs.prototype.datacontext.prototype.addDataSource = function(name,type,sourceContext,identity) {
  /*old params: ,titleSourceType,titleSource,categorySourceType,categorySource,valueSourceType,valueSource*/
  var source =  {
    name: name, type: type, sourceContext: sourceContext, identity: identity,
    /*titleSourceType: titleSourceType,
    titleSource: titleSource,categorySourceType: categorySourceType,valueSourceType: valueSourceType,
    valueSource: valueSource, */
    data: [] // {city: "Derby", county: "Derbyshire", high:28, low:18}
  };
  //this._sources.push(source);
  this._sourceInfo[source.name] = source;
  // set up listeners
  var self = this;
  if (this.TYPE_RESULTS_DOCUMENT_FACETS == type) {
    self.__d("datacontext.addDataSource: doc facets listener type");
    source.listener = {
      updateResults: function(results) {
        self.__d("datacontext.addDataSource: updateResults called");
        self._updateResultsFacets(source,results);
      }
    };
    sourceContext.register(source.listener);
  } else if (this.TYPE_RESULTS_RESULTS == type) { // TODO support this
    self.__d("datacontext.addDataSource: results listener type");
    source.listener = {
      updateResults: function(results) {
        self.__d("datacontext.addDataSource: updateResults called");
        self._updateResultsContent(source,results);
      }
    };
    sourceContext.register(source.listener);
  } else if (this.TYPE_COOCCURENCE == type) {
    self.__d("datacontext.addDataSource: co-occurence listener type");
    source.listener = {
      updateValues: function(results) {
        self._updateValuesCooccurence(source,results);
      }
    };
    sourceContext.register(source.listener);
  } else if (this.TYPE_TRIPLES == type) {
    self.__d("datacontext.addDataSource: triples listener type");
    source.listener = {
      updateFacts: function(facts) {
        self._updateSubjectFacts(source,facts); // TODO verify correct method signature - updateFacts
      }
    };
    sourceContext.register(source.listener);
    // TODO other source types
  } else {
    self.__d("datacontext.addDataSource: unknown listener type: " + type);
  }

  return this;
};

mljs.prototype.datacontext.prototype._updateSubjectFacts = function(facts) {
  this.__d("datacontext._updateSubjectFacts: entering function");
  // TODO support rdf response JSON from SPARQL
  // pull back human readable named from OWL?

  this._join();
};

mljs.prototype.datacontext.prototype._updateResultsFacets = function(source,results) {
  this.__d("datacontext._updateResultsFacets: entering function");
  var rows = new Array();

  // now process facets
  for (var facetName in results.facets) {
    var values = results.facets[facetName];
    if (undefined != values.facetValues) {
      // normal facet
      for (var f = 0,maxf = values.facetValues.length,fv;f < maxf;f++) {
        fv = values.facetValues[f];
        var row = {};
        row._index = f;
        row.facet = facetName;
        row.count = fv.count;
        row.name = fv.name;
        row.value = fv.value;
        rows.push(row);
      }

    } else if (undefined != values.boxes) {
      // heatmap facet
      for (var b = 0,maxb = values.boxes.length,box;b < maxb;b++) {
        box = values.boxes[b];
        var row = {};
        row._index = b;
        row.facet = facetName;
        row.count = box.count;
        row.e = box.e;
        row.n = box.n;
        row.s = box.s;
        row.w = box.w;
        rows.push(row);
      }
    } else {
      // unknown facet type
    }
  }

  source.data = rows;

  this._join();
};

mljs.prototype.datacontext.prototype._updateResultsContent = function(source,results) {
  this.__d("datacontext._updateResultsContent: entering function");
  if (true === results || false === results) {
    this.__d("datacontext._updateResultsContent: not processing function");
    return; // clearing of results
  }
  var rows = new Array();

  this.__d("datacontext._updateResultsContent: processing " + results.results.length + " results");
  for (var r = 0,maxr = results.results.length,result,row;r < maxr;r++) {
    result = results.results[r];
    row = {};

    // process extracted fields first
    for (var m = 0,maxm = result.metadata.length,meta;m < maxm;m++) {
      meta = result.metadata[m];
      for (var param in meta) {
        if ("metadata-type" != param) {
          var cparam = param;
          if ("{" == param.substring(0,1)) {
            cparam = param.substring(param.indexOf("}") + 1);
          }
          var pv = meta[param];
          row[cparam] = pv;
        }
      }
    }

    // then process result summary fields
    row["_confidence"] = result["confidence"];
    row["_fitness"] = result["fitness"];
    row["_format"] = result["format"];
    row["_href"] = result["href"];
    row["_index"] = result["index"];
    row["_mimetype"] = result["mimetype"];
    row["_score"] = result["score"];
    row["_uri"] = result["uri"];
    row["_path"] = result["path"];

    // TODO then process in-content fields

    rows.push(row);
  }

  source.data = rows;

  this.__d("datacontext._updateResultsContent: calling join function");
  this._join();
  this.__d("datacontext._updateResultsContent: exiting function");
};

mljs.prototype.datacontext.prototype._updateValuesCooccurence = function(source,results) {
  // TODO support co-occurence values
  // ISSUE: the field names are NOT included in response JSON - needs to be looked up via URL contents and options
  // WORKAROUND: Is there a way to replay options in the response?
  // Aren't options on the source context anyway???

  this._join();
};

/**
 * Register a data listening widget with this context
 * @param {object} widget - The object to introspect for a setDataContext(datacontext) and/or updateData(datacontext) methods
 */
mljs.prototype.datacontext.prototype.register = function(widget) {
  if (undefined != widget.setDataContext) {
    widget.setDataContext(this);
  }

  var self = this;
  if (undefined != widget.updateData) {
    this._dataUpdatePublisher.subscribe(function() {
      widget.updateData(self);
    });
  }
};

mljs.prototype.datacontext.prototype.getSeriesNames = function() {
  var names = new Array();
  for (var s = 0,maxs = this._data.length,series;s < maxs;s++) {
    series = this._data[s];
    names.push(series.name);
  }
  return names;
};

/**
 * Returns the processed matched data rows as an array of json with field names as properties
 * @param {Array} ensuredFields_opt - Only return data rows that have all of the specified fields. A String array of field names.
 */
mljs.prototype.datacontext.prototype.getData = function(seriesName,ensuredFields_opt) {
  if (null == seriesName) {
    if (undefined == this._data || this._data.length == 0) {
      seriesName = "";
    } else {
      seriesName = this._data[0].name; // first name, likely "" if no series extraction taking place
    }
  }
  var series = null;
  for (var s = 0,maxs = this._data.length;s < maxs && null == series;s++) {
    series = this._data[s];
    if (series.name != seriesName) {
      series = null;
    }
  }
  if (null == series) {
    return [];
  }

  if (undefined != ensuredFields_opt) {
    var matching = new Array();
    for (var r = 0,maxr = series.data.length,row,allok;r < maxr;r++) {
      row = series.data[r];
      allok = true;
      for (var f = 0,maxf = ensuredFields_opt.length,fieldName;f < maxf;f++) {
        fieldName = ensuredFields_opt[f];
        allok = allok && (undefined != row.fields[fieldName]);
      }
      if (allok) {
        matching.push(row);
      }
    }
    return matching;
  } else {
    return series.data;
  }
};

/**
 * Returns the list of field names present in the data
 */
mljs.prototype.datacontext.prototype.getFields = function() {
  return this._fields;
};






mljs.prototype.sessioncontext = function() {
  mljs.prototype.sessioncontext.instance = this; // static instance for all callers in current webapp context
  this._sessionPublisher = new com.marklogic.events.Publisher();
};

mljs.prototype.sessioncontext.prototype.register = function(wgt) {
  if (undefined != wgt.setSessionContext) {
    wgt.setSessionContext(this);
  }
  if (undefined != wgt.updateSession) {
    this._sessionPublisher.subscribe(function(session) {wgt.updateSession(session);});
  }
};

mljs.prototype.sessioncontext.prototype.login = function(user,pass) {
  var params = {path: "/v1/resources/auth" /*?rs:username=" + user + "&rs:pass=" + pass*/, method: "POST"};
  var self = this;
  this.db.do(params,{user: user, password: pass},function(result) {
    if (result.inError) {
      self._sessionPublisher.publish({authenticated: false});
    } else {
      self._sessionPublisher.publish(result.doc);
    }
  });
};

mljs.prototype.sessioncontext.prototype.status = function() {
  // TODO status
};

mljs.prototype.sessioncontext.prototype.logout = function() {
  // TODO logout
};




com.marklogic.util = {};

com.marklogic.util.linkedlistitem = function(name,value) {
  this._name = name;
  this._value = value;
  this._next = null;
  this._previous = null;
};

com.marklogic.util.linkedlistitem.prototype.getName = function() {
  return this._name;
};

com.marklogic.util.linkedlistitem.prototype.getValue = function() {
  return this._value;
};

com.marklogic.util.linkedlistitem.prototype.setNext = function(nextItem) {
  this._next = nextItem;
};

com.marklogic.util.linkedlistitem.prototype.getNext = function() {
  return this._next;
};

com.marklogic.util.linkedlistitem.prototype.setPrevious = function(previousItem) {
  this._previous = previousItem;
};

com.marklogic.util.linkedlistitem.prototype.getPrevious = function() {
  return this._previous;
};




com.marklogic.util.linkedlist = function() {
  this._first = null;
  this._last = null; // helps append run fast
  this._length = 0;
};

com.marklogic.util.linkedlist.prototype.append = function(name,value) {
  var end = new com.marklogic.util.linkedlistitem(name,value);
  if (null != this._last) {
    this._last.setNext(end);
  }
  end.setPrevious(this._last);
  if (null == this._first) {
    this._first = end;
  }
  this._last = end;
  this._length++;
  return end;
};

com.marklogic.util.linkedlist.prototype.getLength = function() {
  return this._length;
};

com.marklogic.util.linkedlist.prototype._getItemByName = function(name) {
  var item = this._first;
  while (null != item) {
    if (item.getName() == name) {
      return item;
    }
    item = item.getNext();
  }
  return null;
};


com.marklogic.util.linkedlist.prototype._getItemByPosition = function(pos) {
  var item = this._first;
  for (var i = 0;i < pos;i++) {
    item = item.getNext();
  }
  return item;
};

com.marklogic.util.linkedlist.prototype.forEach = function(callback) {
  var item = this._first;
  while (null != item) {
    callback(item);
    item = item.getNext();
  }
};

com.marklogic.util.linkedlist.prototype.moveTo = function(name,newPos) {
  var curItem = this._getItemByName(name);
  var itemNext = this._getItemByPosition(newPos);

  // remove from current position
  var curPrev = curItem.getPrevious();
  var curNext = curItem.getNext();
  if (null != curPrev) {
    curPrev.setNext(curNext);
  }
  if (null != curNext) {
    curNext.setPrevious(curPrev);
  }

  // place at new position
  var itemNextPrev = itemNext.getPrevious();
  if (null != itemNextPrev) {
    itemNextPrev.setNext(curItem);
  }
  curItem.setPrevious(itemNextPrev);
  curItem.setNext(itemNext);
  itemNext.setPrevious(curItem);

  if (this._last.getName() == name) {
    this._last = curPrev;
  }
  if (this._first.getName() == name) {
    this._first = curNext;
  }
};

com.marklogic.util.linkedlist.prototype.insertAt = function(name,value,pos) {
  var item = this.append(name,value);
  this.moveTo(name,pos);
  return item;
};

com.marklogic.util.linkedlist.prototype.remove = function(name) {
  var item = this._getItemByName(name);
  var prev = item.getPrevious();
  var next = item.getNext();
  if (null != prev) {
    prev.setNext(next);
  }
  if (null != next) {
    next.setPrevious(prev);
  }
  if (this._first.getName() == name) {
    this._first = next;
  }
  if (this._last.getName() == name) {
    this._last = prev;
  }

  this._length--;
};

com.marklogic.util.linkedlist.prototype.getOrderedItems = function() {
  var ordered = new Array();
  var item = this._first;
  while (null != item) {
    ordered.push(item);
    item = item.getNext();
  }
  return ordered;
};







/**
 * Functional mixin pattern for easier logging. Could be used for other functions too.
 * See {@link http://javascriptweblog.wordpress.com/2011/05/31/a-fresh-look-at-javascript-mixins/} for pattern details.
 **/
(function () { // first IIFE definition ensures asLogSink does not end up as a global variable
  var asLogSink = (function() {
    function __d(msg) {
      this.db.logger.debug(msg);
    };
    function __i(msg) {
      this.db.logger.info(msg);
    };
    function __w(msg) {
      this.db.logger.warn(msg);
    };
    function __e(msg) {
      this.db.logger.error(msg);
    };
    return function() {
      this.__d = __d;
      this.__i = __i;
      this.__w = __w;
      this.__e = __e;

      return this;
    };
  })(); // second IIFE immediate call instantiates each function only once

  asLogSink.call(mljs.prototype.options.prototype);
  asLogSink.call(mljs.prototype.query.prototype);
  asLogSink.call(mljs.prototype.searchcontext.prototype);
  asLogSink.call(mljs.prototype.geocontext.prototype);
  asLogSink.call(mljs.prototype.documentcontext.prototype);
  asLogSink.call(com.marklogic.semantic.tripleconfig.prototype);
  asLogSink.call(mljs.prototype.semanticcontext.prototype);
  asLogSink.call(mljs.prototype.datacontext.prototype);
  asLogSink.call(mljs.prototype.sessioncontext.prototype);
})();






/**
 * Node JS mljs namespace function mappings
 **/
mljs.prototype.textToXML = textToXML;
mljs.prototype.xmlToJson = xmlToJson;
mljs.prototype.xmlToText = xmlToText;
mljs.prototype.jsonOrXml = jsonOrXml;
mljs.prototype.extractValue = extractValue;
mljs.prototype.jsonExtractValue = jsonExtractValue;
mljs.prototype.xmlExtractValue = xmlExtractValue;
mljs.prototype.stringhelper = stringhelper;
