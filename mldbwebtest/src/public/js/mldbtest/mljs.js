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
var basic = null, digest = null, thru = null, noop = null, winston = null, jsdom = null;
var logger = null;
if (typeof(window) === 'undefined') {
  basic = require("./lib/basic-wrapper");
  digest = require("./lib/digest-wrapper");
  thru = require("./lib/passthrough-wrapper");
  noop = require("./lib/noop");
  winston = require('winston');
  jsdom = require('jsdom');

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

var defaultdboptions = {
  host: "localhost", port: 9090, adminport: 8002, ssl: false, auth: "digest", username: "admin",password: "admin", database: "mldbtest", searchoptions: {}, fastthreads: 10, fastparts: 100
}; // TODO make Documents the default db, automatically figure out port when creating new rest server

/**
 * Converts the specified text to XML using the Browser's built in XML support
 * @param {string} text - The textual representation of the XML
 */
function textToXML(text){
  var doc = null;
  if (typeof window === "undefined") {
    // return plain text in nodejs
    doc = jsdom.jsdom(text, null, { FetchExternalResources: false, ProcessExternalResources: false });
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

/**
 * This returns a simplified JSON structure, equivalent to merging text nodes
 * removing whitespace and merging elements with attributes. Namespaces are also removed.
 * Use xmlToJsonStrict instead if you want an exact JSON representation of an XML document.
 *
 * @param {string} xml - The XML Document object to conver to JSON
 */
function xmlToJson(xml) {
  if (null == xml || undefined == xml) {
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
    for (var i = 0; i < xml.childNodes.length; i++) {
      var item = xml.childNodes.item(i);
      var nodeName = item.nodeName;
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
          mljs.defaultconnection.logger.warn("WARNING: #text is still an array. Should not happen.")
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
      console.log("parentNode is not null");
      var ourName = xml.parentNode.nodeName;
      var pos = ourName.indexOf(":");
      if (-1 != pos) {
        ourName = ourName.substring(pos + 1);
      }
      console.log("ourName: " + ourName);
      if ("result"==ourName) {
        isResultContent = true;
      }
    }
      
    if (isResultContent) {
        console.log("GOT RESULT");
        /*
        var s = "";
        for (var i = 0; i < xml.childNodes.length; i++) {
          s += (new XMLSerializer()).serializeToString(xml.childNodes.item(i));
        }
        obj.content = s;
        */
        obj.content = (new XMLSerializer()).serializeToString(xml);
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
          mljs.defaultconnection.logger.warn("WARNING: #text is still an array. Should not happen.")
        }
      }
      obj = text; // removes whitespace as unimportant // TODO replace with check for all string is whitespace first
    }
    
  }
    
  }
  return obj;
 
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
 * Provide configuration information to this database. This is merged with the defaults.
 *
 * @param {JSON} dboptions - The DB Options to merge with the default options for this connection.
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
    this.dboptions = this.__merge(defaultdboptions,dboptions);
    this.logger.debug("MERGED: " + JSON.stringify(this.dboptions)); // TODO TEST
  }
  
  
  
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
      nw.configure(this.dboptions.username,this.dboptions.password,this.logger);
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
    var complete =  function() { 
      if (!completeRan) {
        completeRan = true; // idiot check - complete can be called from many places and events
        self.logger.debug(reqname + " complete()");
        if (res.statusCode.toString().substring(0,1) == ("4")) {
          self.logger.debug(reqname + " error: " + body);
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
            self.logger.debug("Response (Should be JSON): '" + body + "'");
            jsonResult.doc = JSON.parse(body);
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
      self.logger.debug(reqname + " End. Body: " + body);
      complete();
    });
    res.on('close',function() {
      self.logger.debug(reqname + " Close");
      complete();
    });
    res.on("error", function() {
      self.logger.debug(reqname + " ERROR: " + res.statusCode);
      completeRan = true;
      (callback_opt || noop)({statusCode: res.statusCode,error: body,inError: true});
    });
    
    self.logger.debug("Method: " + options.method);
    if (options.method == "PUT" || options.method == "DELETE") {
      complete();
    }
    self.logger.debug(reqname + " End Response (sync)");
    self.logger.debug("---- END " + reqname);
    
  });
  httpreq.on("error",function(e) {
    completeRan = true;
    self.logger.debug("__doreq: REQUEST ERROR: " + e);
    (callback_opt || noop)({inError: true,error: e}); 
  });
  if (undefined != content && null != content) {
    httpreq.write(JSON.stringify(content));
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
    this.logger.debug(reqname + " headers: " + JSON.stringify(options.headers))
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
    this.logger.debug("Converted format=json to Content-Type header. Path now: " + options.path + " , headers now: " + JSON.stringify(options.headers));
  }
  
  this.__doreq_impl(reqname,options,content,callback_opt);
};





// PASS THROUGH




/**
 * <p>Function allowing mljs's underlying REST invocation mechanism to be used for an arbitrary request. </p><p>
 * Useful for future proofing should some new functionality come out, or bug discovered that prevents
 * your use of a JavaScript Driver API call.
 * </p>
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
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.create = function(callback_opt) {
  /*
  curl -v --anyauth --user admin:admin -X POST \
      -d'{"rest-api":{"name":"mldbtest-rest-9090","database": "mldbtest","modules-database": "mldbtest-modules","port": "9090"}}' \
      -H "Content-type: application/json" \
      http://localhost:8002/v1/rest-apis
  */
  
  var json = {"rest-api": {"name": this.dboptions.database, "database": this.dboptions.database, "modules-database":this.dboptions.database + "-modules", port: this.dboptions.port}};
  var options = {
    host: this.dboptions.host,
    port: this.dboptions.adminport,
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
mljs.prototype.destroy = function(callback_opt) {
  var self = this;
  var dodestroy = function() {
    // don't assume the dbname is the same as the rest api name - look it up
  
    var getoptions = {
      host: self.dboptions.host,
      port: self.dboptions.adminport,
      path: "/v1/rest-apis?database=" + encodeURI(self.dboptions.database) + "&format=json",
      method: "GET"
    };
    self.__doreq("DESTROY-EXISTS",getoptions,null,function(result) {
      self.logger.debug("Returned rest api info: " + JSON.stringify(result.doc));
    
      var ex = !(undefined == result.doc["rest-apis"] || undefined == result.doc["rest-apis"][0] || self.dboptions.database != result.doc["rest-apis"][0].database);
    
      if (!ex) {
        // doesn't exist already, so return success
        self.logger.debug("Rest server for database " + this.dboptions.database + " does not exist already. Returning success.");
        (callback_opt || noop)({inError: false, statusCode: 200});
      } else {
        var restapi = result.doc["rest-apis"][0].name;
      
        var options = {
          host: self.dboptions.host,
          port: self.dboptions.adminport,
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
 * <p>
 * Fetches a document with the given URI.
 * </p><p>
 * https://docs.marklogic.com/REST/GET/v1/documents
 * </p><p>
 * options_opt currently supports these options:-</p>
 * <ul>
 *  <li>transform - the name of the installed transform to use when fetching the document</li>
 * </ul>
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
    path: '/v1/documents?uri=' + encodeURI(docuri) + "&format=json",
    method: 'GET'
  };
  if (undefined != options_opt) {
    if (undefined != options_opt.transform) {
      options.path += "&transform=" + encodeURI(options_opt.transform)
    }
  }
  
  this.__doreq("GET",options,null,function (result) {
    result.docuri = docuri;
    (callback_opt||noop)(result);
  });
};

/**
 * <p>Fetches the metadata for a document with the given URI. Metadata document returned in result.doc
 * </p><p>
 * https://docs.marklogic.com/REST/GET/v1/documents
 *</p>
 * @param {string} docuri - The URI of the document whose metadata you want to retrieve.
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.metadata = function(docuri,callback_opt) {
  if (undefined == callback_opt && typeof(docuri)==='function') {
    callback_opt = docuri;
    docuri = undefined;
  }
  var options = {
    path: '/v1/documents?uri=' + encodeURI(docuri) + "&format=json&category=metadata",
    method: 'GET'
  };
  
  this.__doreq("METADATA",options,null,callback_opt);
};

/**
 * <p>Saves new docs with GUID-timestamp, new docs with specified id, or updates doc with specified id
 * NB handle json being an array of multiple docs rather than a single json doc
 * If no docuri is specified, one is generated by using a combination of the time and a large random number.
 *</p><p>
 * https://docs.marklogic.com/REST/PUT/v1/documents
 *</p><p>
 * props_opt can be used to provide extra options. These are:-</p>
 <ul><li>collection - The comma delimited string of the collections to add the document to
 *</li><li>
 *contentType - The content type (MIME type) of the doc. Useful for uploaded binary documents.
 *</li><li>
 *format - The format of the response. Either json (default if not specified) or xml.
 *</li><li>
 *permissions - array of permission JSON objects to apply: E.g. [{role: 'secret-write', permissions: 'update|read|delete'}, ...]
 *</li></ul>
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
            this.logger.debug("son,docuri,,");
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
        this.logger.debug("MLJS.save: No contentType specified, falling back to application/json");
        // assume JSON, but could easily be binary too
        options.contentType = "application/json";
        format = null; // overrides param override setting
        
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
 * <p>Updates the document with the specified uri by only modifying the passed in properties.</p><p>
 * NB May not be possible in V6 REST API elegantly - may need to do a full fetch, update, save
 *</p>
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
    self.logger.debug("Merged JSON: " + JSON.stringify(res));
    //res = self.__merge(merged,json); // fix dboptions.concat in configure()
    self.save(res,docuri,callback_opt);
  });
};

mljs.prototype.__merge = function(json1,json2) {
  this.logger.debug("__merge: JSON json1: " + JSON.stringify(json1) + ", json2: " + JSON.stringify(json2));
  if (undefined == json1 && undefined != json2) {
    this.logger.debug("JSON1 undefined, returning: " + json2);
    return json2;
  } else if (undefined == json2 && undefined != json1) {
    this.logger.debug("JSON2 undefined, returning: " + json1);
    return json1;
  } else if (typeof(json1)==='object' && typeof(json2)==='object') {
    this.logger.debug("Both 1&2 are JSON objects. json1: " + JSON.stringify(json1) + ", json2: " + JSON.stringify(json2));
    // can be merged
    var merged = {};
    for (var k in json1) {
      merged[k] = json1[k];
    }
    for (var k in json2) {
      merged[k] = this.__merge(merged[k],json2[k]);
    }
    return merged;
  } else if (undefined == json1 && undefined == json2) {
    return undefined;
  } else {
    this.logger.debug("Both 1&2 are JSON values. json2 (newest): " + json2);
    // return the second (new) value
    return json2;
  }
};

/**
 * <p>Deletes the specified document
 * </p><p>
 * https://docs.marklogic.com/REST/DELETE/v1/documents
 *</p>
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
 * <p>Returns all documents in a collection, optionally matching against the specified fields
 * </p><p>http://docs.marklogic.com/REST/GET/v1/search
 * </p>
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
 * <p>Lists all documents in a directory, to the specified depth (default: 1), optionally matching the specified fields</p><p>
 * http://docs.marklogic.com/REST/GET/v1/search
 * </p>
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
 * <p>Performs a simple key-value search. Of most use to JSON programmers.
 * </p><p>
 * https://docs.marklogic.com/REST/GET/v1/keyvalue
 *</p>
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
 * <p>Performs a search:search via REST</p><p>
 * http://docs.marklogic.com/REST/GET/v1/search
 *</p><p>
 * See supported search grammar http://docs.marklogic.com/guide/search-dev/search-api#id_41745 
 * </p><p>
 * Supported values for sprops_opt:-</p>
 * <ul>
 *  <li>collection - The collection to restrict search results from</li>
 * <li>directory - The directory uri to restrict search results from</li>
 * <li>transform - The transform to apply to the top level results object on the server</li>
 * <li>format - The format of the response. json or xml. json is the default if not specified</li>
 *</ul>
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
  var format = "&format=json";
  if (undefined != sprops_opt) {
    if (undefined != sprops_opt.collection) {
      var cols = sprops_opt.collection.split(",");
      for (var c = 0;c < cols.length;c++) {
        url += "&collection=" + encodeURI(cols[c]);
      }
    }
    if (undefined != sprops_opt.directory) {
      url += "&directory=" + sprops_opt.directory;
    }
    if (undefined != sprops_opt.transform) {
      // MarkLogic 7.0+ only
      url += "&transform=" + sprops_opt.transform;
    }
    if (undefined != sprops_opt.format) {
      format = "&format=" + sprops_opt.format;
    }
  }
  url += format;
  if (undefined != start_opt) {
    url += "&start=" + start_opt;
  }
  url += "&view=all";
  
  // TODO check options' type - if string, then pass as options param. If JSON object, then do POST to /v1/search to provide options dynamically
  
  // make transaction aware
  if (undefined != this.__transaction_id) {
    url += "&txid=" + encodeURI(this.__transaction_id);
  }
    
  var options = {
    path: url,
    method: method
  };
  var self = this;
  this.__doreq("SEARCH",options,content,function(result) {
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
};

/**
 * <p>Performs a search:search via REST. Helper method for SEARCH.</p><p>
 * http://docs.marklogic.com/REST/GET/v1/search
 *</p><p>
 * See supported search grammar http://docs.marklogic.com/guide/search-dev/search-api#id_41745 
 *</p>
 * @param {string} collection_opt - The optional collection to restrict the results to
 * @param {string} query_opt - The optional query string
 * @param {string} options_opt - The optional name of the installed query options to use
 * @param {function} callback - The callback to invoke after the method completes
 */ 
mljs.prototype.searchCollection = function(collection_opt,query_opt,options_opt,callback) { 
  if (callback == undefined && typeof(options_opt) === 'function') {
    callback = options_opt;
    options_opt = undefined;
  }
  var url = "/v1/search?q=" + encodeURI(query_opt) + "&format=json";
  if (undefined != collection_opt) {
    url += "&collection=" + encodeURI(collection_opt);
  }
  if (options_opt != undefined) {
    url += "&options=" + encodeURI(options_opt);
  }
  
  // make transaction aware
  if (undefined != this.__transaction_id) {
    url += "&txid=" + encodeURI(this.__transaction_id);
  }
    
  var options = {
    path: url,
    method: "GET"
  };
  this.__doreq("SEARCHCOLLECTION",options,null,callback);
};

/**
 * <p>Performs a structured search.</p><p>
 * http://docs.marklogic.com/REST/GET/v1/search
 * </p><p>
 * Uses structured search instead of cts:query style searches. See http://docs.marklogic.com/guide/search-dev/search-api#id_53458
 * </p><p>
 * Use this method in conjunction with the Query Builder {@see mljs.prototype.query}
 *</p>
 * @param {string} query_opt - The optional query string to restrict the results by
 * @param {string} options_opt - The optional name of the installed query options to use
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.structuredSearch = function(query_opt,options_opt,callback) {
  if (callback == undefined && typeof(options_opt) === 'function') {
    callback = options_opt;
    options_opt = undefined;
  }
  var url = "/v1/search?structuredQuery=" + encodeURI(JSON.stringify(query_opt)) + "&format=json";
  if (options_opt != undefined) {
    url += "&options=" + encodeURI(options_opt);
  }
  
  // make transaction aware
  if (undefined != this.__transaction_id) {
    url += "&txid=" + encodeURI(this.__transaction_id);
  }
  
  var options = {
    path: url,
    method: "GET"
  };
  //console.log("OPTIONS: " + JSON.stringify(options));
  this.__doreq("STRUCTUREDSEARCH",options,null,callback);
};


/**
 * <p>Saves search options with the given name. These are referred to by mljs.structuredSearch.</p><p>
 * http://docs.marklogic.com/REST/PUT/v1/config/query/*
 *</p><p>
 * For structured search options see http://docs.marklogic.com/guide/rest-dev/search#id_48838
 * </p><p>
 * Use this function in conjunction with the Search Options Builder. {@see mljs.prototype.options}
 *</p>
 * @param {string} name - The name to install the search options under
 * @param {JSON} searchoptions - The search options JSON object. {@see mljs.prototype.options.prototype.toJson}
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.saveSearchOptions = function(name,searchoptions,callback_opt) {
  var options = {
    path: "/v1/config/query/" + name + "?format=json",
    method: "PUT"
  };
  this.__doreq("SAVESEARCHOPTIONS",options,searchoptions,callback_opt);
};

/**
 * <p>Fetches search options, if they exist, for the given search options name
 * http://docs.marklogic.com/REST/PUT/v1/config/query/*
 * </p><p>
 * For structured serch options see http://docs.marklogic.com/guide/rest-dev/search#id_48838
 *</p>
 * @param {string} name - The name of the installed search options to retrieve as JSON
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.searchoptions = function(name,callback) {
  var options = {
    path: "/v1/config/query/" + name + "?format=json",
    method: "GET"
  };
  this.__doreq("SEARCHOPTIONS",options,null,callback);
};

/**
 * <p>Fetches values from a lexicon or computes 2-way co-occurence.</p><p>
 * https://docs.marklogic.com/REST/GET/v1/values/*
 *</p>
 * @param {string|JSON} query - The query string (string) or structured query (object) to use to restrict the results
 * @param {string} tuplesname - The name of the tuples in the installed search options to return
 * @param {string} optionsname - The name of the installed search options to use
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.values = function(query,tuplesname,optionsname,callback_opt) {
  var options = {
    path: "/v1/values/" + tuplesname + "?format=json&options=" + encodeURI(optionsname),
    method: "GET"
  };
  if (typeof query == "string") {
    // plain text query
    options.path += "&q=" + encodeURI(query);
  } else if (typeof query == "object") {
    // structured query
    options.path += "&structuredQuery=" + encodeURI(JSON.stringify(query));
  }
  
  this.__doreq("VALUES",options,null,callback_opt);
};

/**
 * <p>Same functionality as values() but uses a combined search options and query mechanism.
 * This requires MarkLogic V7 EA 1 or above</p><p>
 * http://docs-ea.marklogic.com/REST/POST/v1/values/*
 * </p><p>
 * For structured serch options see http://docs.marklogic.com/guide/rest-dev/search#id_48838
 *</p><p>
 * Executes the values configuration provided. The name 'shotgun' used below is not important. {@see mljs.prototype.subcollections} for an example usage.
 *</p>
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
 * <p>Lists the collection URIS underneath the parent uri.
 * Helper method to fetch collections from the collection lexicon using mljs.valuesCombined().
 *</p>
 * @param {string} parenturi - The collection URI under which to retrieve the list of subcollections
 * @param {function} callback - The callback to invoke after the method completes
 */
mljs.prototype.subcollections = function(parenturi,callback) {
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



// VERSION 7 SEMANTIC CAPABILITIES
/**
 * <p>Saves a set of triples as an n-triples graph. Allows you to specify a named graph (collection) or use the default graph.
 * </p><p>
 * No documentation URL - still in Early Access, docs only available on internal MarkLogic wiki
 *</p><p>
 * I'm using an easy to interpret JSON triples format. This prevents the user of this function from having to know the
 * n-triples format. Here is an example:-
 * triples = [{subject: "http://someiri/#here", predicate: "http://someiri/#here", object: "http://someiri/#here"},... ]
 * </p><p>
 * Note: We assume that the 'object' if provided as JSON triples is an IRI, not a string or other primitive value.
 * Construct your own N-triples if you need to provide raw primitive values.
 *</p>
 * @param {string|JSON} triples - The raw N-triples (string) or JSON triples (object JSON array) to store
 * @param {string} uri_opt - The graph name to replace. If not provided, the default MarkLogic graph (all triples) will be replaced.
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.saveGraph = function(triples,uri_opt,callback_opt) {
  if (undefined == callback_opt && "function" === typeof uri_opt) {
    callback_opt = uri_opt;
    uri_opt = undefined;
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
  }
  this.__doreq("SAVEGRAPH",options,graphdoc,callback_opt);
};

/**
 * <p>Merges a set of triples in to an n-triples graph. Allows you to specify a named graph (collection) or use the default graph.
 * </p><p>
 * No documentation URL - still in Early Access
 *</p>
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
    path: "/v1/graph",
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
 * <p>Returns the specified graph from MarkLogic Server, or the full default graph. USE CAREFULLY!</p><p>
 * Returns the triples as a JSON {subject: "...", predicate: "...", object: "..."} array in result.triples, or the raw in result.doc
 *</p><p>
 * No documentation URL - still in Early Access
 *</p>
 * @param {string} uri_opt - The name of the grah to return. If not provided, the default MarkLogic graph (all triples, not just triples not in a named graph) will be returned.
 * @param {function} callback_opt - The optional callback to invoke after the method completes.
 */
mljs.prototype.graph = function(uri_opt,callback_opt) {
  if (undefined == callback_opt && "function" === typeof uri_opt) {
    callback_opt = uri_opt;
    uri_opt = undefined;
  }
  
  var options = {
    path: "/v1/graph",
    method: "GET"
  }
  if (undefined != uri_opt) {
    options.path += "?graph=" + encodeURI(uri_opt);
  } else {
    options.path += "?default";
  }
  
  this.__doreq("GETGRAPH",options,null,function(result) {
    if (result.inError) {
      (callback_opt||noop)(result);
    } else {
      // convert to JSON array representation
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
      (callback||noop)(result);
    }
  });
};

/**
 * <p>Deletes the specified graph from MarkLogic Server
 *</p><p>
 * No documentation URL - still in Early Access
 *</p>
 * @param {string} uri - The name of the graph to delete. Required. (Cannot be 'default')
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.deleteGraph = function(uri,callback_opt) {
  var options = {
    path: "/v1/graph?graph=" + encodeURI(uri),
    method: "DELETE"
  };
  
  this.__doreq("DELETEGRAPH",options,null,callback_opt);
};

/**
 * <p>Executes the specified sparql query.
 *</p><p>
 * No documentation URL - still in Early Access
 *</p>
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



// TRANSACTION MANAGEMENT







/**
 * <p>Opens a new transaction. Optionally, specify your own name.</p><p>
 * http://docs.marklogic.com/REST/POST/v1/transactions
 *</p><p>
 * Note: Each mljs instance can only have one live transaction at a time. This is a limit imposed by myself by design, not by the underlying REST API. 
 * Best to configure a connection per real user-application pair.
 *</p>
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
 * <p>Commits the open transaction</p><p>
 * http://docs.marklogic.com/REST/POST/v1/transactions/*
 *</p>
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
 * <p>Rolls back the open transaction.</p><p>
 * http://docs.marklogic.com/REST/POST/v1/transactions/*
 *</p>
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
 * <p>Checks whether the database contains indexes for all installed search options. </p><p>
 * http://docs.marklogic.com/REST/GET/v1/config/indexes
 * </p>
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
 * <p>Generic wrapper to wrap any mljs code you wish to execute in parallel. E.g. uploading a mahoosive CSV file. Wrap ingestcsv with this and watch it fly!</p><p>
 * NOTE: By default all E-node (app server requests, like the ones issued by this JavaScript wrapper) are executed in a map-reduce style. That is to say
 * they are highly parallelised by the server, automatically, if in a clustered environment. This is NOT what the fast function does. The fast function
 * is intended to wrap utility functionality (like CSV upload) where it may be possible to make throughput gains by running items in parallel. This is
 * akin to ML Content Pump (mlcp)'s -thread_count and -transaction_size ingestion options. See defaultdboptions for details
 * </p>
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.fast = function(callback_opt) {
  this.__fast = true;
  (callback_opt||noop)({inError:false,fast: true});
};







// UTILITY METHODS







/**
 * <p>Takes a csv file and adds to the database.
 * fast aware method
 *</p><p>
 * NOT YET IMPLEMENTED - Shell function only that will never call the callback
 * </p>
 * @param {string} csvdata - The CSV text to ingest
 * @param {string} docid_opt - The optional URI of the document to store
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.ingestcsv = function(csvdata,docid_opt,callback_opt) {
  
};

/**
 * <p>Inserts many JSON documents. FAST aware, TRANSACTION aware.
 *</p>
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
 * <p>Alternative saveAll function that throttles invoking MarkLogic to a maximum number of simultaneous 'parallel' requests. (JavaScript is never truly parallel)
 *</p><p>
 * NB Uses an internal rv class defined in the mljs.js file.
 *</p>
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
 * <p>REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and subscribe to alerts from them. Alerts sent to a given URL.
 *  </p><p>
 * Save a query as an XML document using the default search grammar (see search:search) with a given name
 *</p>
 * @param {string} searchname - The name of the search
 * @param {boolean} shared - If false, the current user's username is prepended to the search name with a hyphen
 * @param {string} query - The search:search compatible query using the default grammar to use for the search
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.saveBasicSearch = function(searchname,shared,query,callback_opt) {
  this._doSaveBasicSearch(searchname,shared,query,"search",null,callback_opt);
};

mljs.prototype._doSaveBasicSearch = function(searchname,shared,query,createmode,notificationurl,callback_opt) {
  var url = "/v1/resources/subscribe?notificationurl=" + encodeURI(notificationurl) + "&format=json&searchname=" + encodeURI(searchname) + 
    "&create=" + encodeURI(createmode) + "&shared=" + encodeURI(shared) + "&query=" + encodeURI(query) + "&querytype=basic";
  if ("both" == createmode) {
    url += "&notificationurl=" + encodeURI(notificationurl);
  }
    
  var options = {
    path: url,
    method: "PUT"
  };
  this.__doreq("SAVEBASICSEARCH",options,null,callback_opt);
};

/**
 * <p>REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and subscribe to alerts from them. Alerts sent to a given URL.
 *</p><p>
 * Save a query that matches documents created within a collection, with a given name
 *</p>
 * @param {string} searchname - The name of the search
 * @param {boolean} shared - If false, the current user's username is prepended to the search name with a hyphen
 * @param {string} collection - The collection to restrict search results to
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.saveCollectionSearch = function(searchname,shared,collection,callback_opt) {
  this._doSaveCollectionSearch(searchname,shared,collection,"search",null,callback_opt);
};

mljs.prototype._doSaveCollectionSearch = function(searchname,shared,collection,createmode,notificationurl,callback_opt) {
  var url = "/v1/resources/subscribe?notificationurl=" + encodeURI(notificationurl) + "&format=json&searchname=" + encodeURI(searchname) + 
    "&create=" + encodeURI(createmode) + "&shared=" + encodeURI(shared) + "&collection=" + encodeURI(collection) + "&querytype=collection";
  if ("both" == createmode) {
    url += "&notificationurl=" + encodeURI(notificationurl);
  }
    
  var options = {
    path: url,
    method: "PUT"
  };
  this.__doreq("SAVECOLLECTIONSEARCH",options,null,callback_opt);
};

/**
 * <p>REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and subscribe to alerts from them. Alerts sent to a given URL.
 *</p><p>
 * Save a geospatial search based on a point and radius from it, with a given name</p><p>
 * TODO check if we need to include an alert module name in the options
 *</p>
 * @param {string} searchname - The name of the search
 * @param {boolean} shared - If false, the current user's username is prepended to the search name with a hyphen
 * @param {decimal} latitude - The WGS84 latitude for the centre of the radius search
 * @param {decimal} longitude - The WGS84 longitude for the centre of the radius search
 * @param {decimal} radius - The radius in statue (nor nautical) miles
 * @param {function} callback_opt - The optional callback to invoke after the method completes
 */
mljs.prototype.saveGeoNearSearch = function(searchname,shared,latitude,longitude,radiusmiles,callback_opt) {
  this._doSaveGeoNearSearch(searchname,shared,latitude,longitude,radiusmiles,"search",null,callback_opt);
};

mljs.prototype._doSaveGeoNearSearch = function(searchname,shared,latitude,longitude,radiusmiles,createmode,notificationurl,callback_opt) {
  var url = "/v1/resources/subscribe?notificationurl=" + encodeURI(notificationurl) + "&format=json&searchname=" + encodeURI(searchname) + 
    "&create=" + encodeURI(createmode) + "&shared=" + encodeURI(shared) + "&lat=" + encodeURI(latitude)  + "&lon=" + encodeURI(longitude)  + "&radiusmiles=" + encodeURI(radiusmiles) + "&querytype=geonear";
  if ("both" == createmode) {
    url += "&notificationurl=" + encodeURI(notificationurl);
  }
    
  var options = {
    path: url,
    method: "PUT"
  };
  this.__doreq("SAVEGEONEARSEARCH",options,null,callback_opt);
};

/**
 * <p>REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and subscribe to alerts from them. Alerts sent to a given URL.
 *</p><p>
 * Save an arbitrary search (any cts:query) already stored in the database, with a given name. Enables easy referencing and activation of alerts on this search.
 *</p>
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
    
  var options = {
    path: url,
    method: "PUT"
  };
  this.__doreq("SAVEEXISTINGSEARCH",options,null,callback_opt);
};

/*
 * TODO create-and-subscribe methods, subscribe to uri method
 */

/**
 * <p>REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and subscribe to alerts from them. Alerts sent to a given URL.
 *</p><p>
 * Uses Adam Fowler's (me!) REST API extension for subscribing to searches. RESTful HTTP calls are sent with the new information to the specified url.
 *</p>
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
    method: "POST"
  };
  this.__doreq("SUBSCRIBE",options,null,callback_opt);
};

/**
 * <p>REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and subscribe to alerts from them. Alerts sent to a given URL.
 *</p><p>
 * Unsubscribe a notificationurl from a named search. Uses Adam Fowler's (me!) REST API extension.
 *</p>
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
 * <p>REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and subscribe to alerts from them. Alerts sent to a given URL.
 *</p><p>
 * Unsubscribe from an alert and delete the underlying saved search. Convenience method.
 *</p>
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
 * <p>REQUIRES CUSTOM REST API EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and subscribe to alerts from them. Alerts sent to a given URL.
 *</p><p>
 * Delete the saved search. Assumes already unsubscribed from alerts used by it. (If not, alerts will still fire!)
 *</p>
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
 * <p>REQUIRES CUSTOM REST API EXTENSION - whoami.xqy - Adam Fowler adam.fowler@marklogic.com - Fetches information on the name and roles of the currently logged in client api user.
 *</p><p>
 * Fetches information about the user behind the current session.
 *</p><p>
 * Useful is your webapp performs the login so your javascript doesn't know your username. Also looks up roles.
 *</p>
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
 * REQUIRES CURSTOM REST API EXTENSION - rdb2rdf.xqy - Adam Fowler adam.fowler@marklogic.com - List DB schema attached to an MLSAM URL endpoint.
 * 
 * @param {string} samurl - The endpoint URL of the installed SAM service (uses a JDBC connection)
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
 * REQUIRES CURSTOM REST API EXTENSION - rdb2rdf.xqy - Adam Fowler adam.fowler@marklogic.com - Describe tables and relationships in the prescribed schema attached to an MLSAM URL endpoint.
 * 
 * NB This method relies on ANSI DESCRIBE, COUNT and Information Schema support
 * 
 * @param {string} samurl - The endpoint URL of the installed SAM service (uses a JDBC connection)
 * @param {string} schema - The database schema name. 
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
 * REQUIRES CURSTOM REST API EXTENSION - rdb2rdf.xqy - Adam Fowler adam.fowler@marklogic.com - Ingests an RDBMS schema subset (limited rows per table) in to the MarkLogic Triplestore using W3C RDB2RDF direct mapping.
 * 
 * NB This method relies on ANSI DESCRIBE, COUNT and Information Schema support
 * 
 * @param {JSON} config - The JSON configuration of the database segment to ingest
{ingest: {
  database: {
    samurl: "http://kojak.marklogic.com:8080/mlsam/samurl"
  },
  create: {
    graph: "mynamedgraph"
  },
  selection: {
    // Either:
    mode: "schema", // Creates interdependencies between tables
    tables: ["customers","policies","address"] // Other RD info required here
    
    // Or: 
    mode: "data",
    tables: ["customers"], offset: 101, limit: 100
  }
}
}
 */
mljs.prototype.samRdb2Rdf = function(config,callback) {
  var options = {
    path: "/v1/resources/rdb2rdf",
    method: "POST",
    headers: { Accept: "application/json"}
  };
  this.__doreq("SAMRDB2RDF",options,config,callback);
};











/****
 * Search Options management
 ****/
 
/**
 * <p>Creates a new search options builder connected to this client database connection mljs instance. Each function returns a reference to the option builder object to support chaining.
 * </p><p><b>Note: I believe all search options are covered in the methods. If you find anything missing, or want a helper function, let me know.</b></p><p>
 * Applies the following sensible defaults:-</p>
 <ul>
 <li>  type = "xs:string"</li>
  <li> collation = "http://marklogic.com/collation/"</li>
  <li> namespace = "http://marklogic.com/xdmp/json/basic"</li>
  <li> sortDirection = "ascending"</li>
  <li> transform-results = "raw" (Note: Default elsewhere in marklogic is 'snippet' instead)</li>
  <li> page-length = 10</li>
 </ul>
 * 
  <h3>Sample usage 1: page-search.js:- (and page-chartsearch except without .pageLength(100) )</h3>
 <pre>
  var ob = new db.options();
  ob.defaultCollation("http://marklogic.com/collation/en")
    //.defaultType("xs:string"); // this should be the default anyway 
    //.defaultNamespace("http://marklogic.com/xdmp/json/basic") // this should be the default anyway 
    //.defaultSortDirection("ascending") // this should be the default anyway 
    //.sortOrderScore() // include by default? have .sortOrderClear() to remove? 
    //.sortOrder("family") // defaults to a json-key, type string, default collation, direction ascending 
    //.sortOrder("animal") // defaults to a json-key, type string, default collation, direction ascending. define sort order defaults anyway for each constraint??? 
    .collectionConstraint() // default constraint name of 'collection' 
    .rangeConstraint("animal",["item-order"]) // constraint name defaults to that of the range element name 
    .rangeConstraint("family",["item-frequency"]); // constraint name defaults to that of the range element name 
 </pre>
 *
  <h3>Sample usage 2: page-movies.js</h3>
  <pre>
  var ob = new db.options();
  ob.tuples("coag","actor","genre"); // first is tuple name. defaults to string, json namespace
  var ob2 = new db.options();
  ob2.tuples("coay","actor","year"); // first is tuple name. defaults to string, json namespace
  </pre>
 *
 * @constructor
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
  
  // general defaults
  this.defaults = {};
  this.defaults.type = "xs:string";
  this.defaults.collation = "http://marklogic.com/collation/";
  this.defaults.namespace = "http://marklogic.com/xdmp/json/basic";
  this.defaults.sortDirection = "ascending";
  this.defaults.facetOption = undefined; // limit=10
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
    this.options["return-aggregates"] = false; // boolean,
    this.options["return-constraints"] = false;// boolean,
    this.options["return-facets"] = true; // boolean,
    this.options["return-frequencies"] = false; // boolean,
    this.options["return-metrics"] = true; // boolean,
    this.options["return-plan"] = false; // boolean,
    this.options["return-qtext"] = true; // boolean
    this.options["return-query"] = false; // boolean,
    this.options["return-results"] = true; // boolean,
    this.options["return-similar"] = false; // boolean,
    this.options["return-values"] = false; // boolean,
    this.options["search-option"] = new Array(); // [ string ],
    this.options["sort-order"] = new Array(); // [ sort-order ],
    this.options["suggestion-source"] = new Array(); //[ suggestion-source ],
    
    // defaults
    this.sortOrderScore();
  }
};

/**
 * Returns the JSON search options object needed by the REST API and generated by this class
 */
mljs.prototype.options.prototype.toJson = function() {
  // set empty arrays to undefined
//  if (undefined != this.options[""])
  
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
  return true;
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
 * @param {boolean} ret - Whether to return values (co-occurence) matches with the response.
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
  this.defaults.type = type;
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
 * Generates a new Xpath constraint - TODO
 */
mljs.prototype.options.prototype.pathConstraint = function() {
  // TODO path range constraint
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
 * @param {JSON} facet_opt - The optional facet JSON to use.
 * @param {JSON} facet_options_opt - The optional facet configuration JSON to use.
 */
mljs.prototype.options.prototype.elemattrRangeConstraint = function(constraint_name,element,namespace,attr,type_opt,collation_opt,facet_opt,facet_options_opt) {
  var range = {name: constraint_name,
    range: {
      type: type_opt || this.defaults.type, 
      element: {
        name: element, ns : namespace || this.defaults.namespace
      },
      attribute: {
        name: attr,
        ns: namespace || this.defaults.namespace
      },
      collation: collation_opt || this.defaults.collation
    }
  };
  if (undefined != facet_opt || undefined != facet_options_opt) {
    range.range.facet = true;
  }
  if (undefined != facet_options_opt) {
    range.range["facet-options"] = facet_options_opt;
  }
  
  // Create sort orders automatically
  this.sortOrder(this.defaultSortDirection,type_opt || this.defaults.type,element,collation_opt || this.defaults.collation); // TODO verify this works with normal XML range indexes not json keys
  
  this.addConstraint(range);
  
  return this;
};

/**
 * Specifies a new range constraint, and adds it to the search options object
 * 
 * @param {string} constraint_name_opt - Optional constraint name to use. Defaults to NULL
 * @param {string} name_or_key - Element name or JSON key to use
 * @param {string} ns_opt - Namespace to use. Optional. If not specified, default namespace is used. (If type is XML element)
 * @param {string} type_opt - Whether to use 'json' (default) or 'xml' element matching
 * @param {string} collation_opt - The optional string collation to used. If not specified, default collation is used
 * @param {JSON} facet_opt - The optional facet JSON to use.
 * @param {JSON} facet_options_opt - The optional facet configuration JSON to use.
 */
mljs.prototype.options.prototype.rangeConstraint = function(constraint_name_opt,name_or_key,ns_opt,type_opt,collation_opt,facet_opt,facet_options_opt) {
  this._includeSearchDefaults();
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
    if (undefined !=  type_opt && "string" === typeof type_opt && (type_opt.length < 4 || "xs:" != type_opt.substring(0,3))) {
      collation_opt = type_opt;
      type_opt = undefined;
    } else if (undefined !=  ns_opt && "string" === typeof ns_opt && (ns_opt.length < 4 || "xs:" != ns_opt.substring(0,3))) {
      collation_opt = ns_opt;
      ns_opt = undefined;
    } 
  }
  if (undefined ==  type_opt) {
    if (undefined !=  ns_opt && "string" === typeof ns_opt && (ns_opt.length > 4 && "xs:" == ns_opt.substring(0,3))) {
      type_opt = ns_opt;
      ns_opt = undefined;
    }
  }
  if ("string" == typeof constraint_name_opt && Array.isArray(name_or_key)) {
    facet_opt = name_or_key;
    name_or_key = constraint_name_opt;
  }
  if (undefined == name_or_key) {
    if (undefined !=  constraint_name_opt) {
      name_or_key = constraint_name_opt; // keep contraint name same as name or key (dont set to undefined)
    }
  }
  if (undefined == constraint_name_opt) {
    constraint_name_opt = name_or_key;  
  }
  // output values here
  mljs.defaultconnection.logger.debug("rangeConstraint(): cName: " + constraint_name_opt + 
    ", name_or_key: " + name_or_key + ", ns_opt: " + ns_opt + ", type_opt: " + type_opt + ", collation_opt: " + collation_opt +
    ", facet_opt: " + facet_opt + ", facet_options_opt: " + facet_options_opt);
  // now use values
  var range = {name: constraint_name_opt,
    range: {
      type: type_opt || this.defaults.type, 
      element: {
        name: name_or_key, ns : ns_opt || this.defaults.namespace
      },
      collation: collation_opt || this.defaults.collation
    }
  };
  if (undefined != facet_opt || undefined != facet_options_opt) {
    range.range.facet = true;
  }
  if (undefined != facet_options_opt) {
    range.range["facet-options"] = facet_options_opt;
  }
  
  // Create sort orders automatically
  this.sortOrder("ascending",type_opt || this.defaults.type,name_or_key,collation_opt || this.defaults.collation); // TODO verify this works with normal XML range indexes not json keys
  this.sortOrder("descending",type_opt || this.defaults.type,name_or_key,collation_opt || this.defaults.collation); // TODO verify this works with normal XML range indexes not json keys
  
  this.addConstraint(range);
  
  return this;
};
mljs.prototype.options.prototype.range = mljs.prototype.options.prototype.rangeConstraint;

/**
 * <p>Adds any new constraint JSON to the search options object. Always called by the *Constraint methods themselves anyway. </p><p>
 * This is for any constraints you wish to add that don't have their own method here.
 * </p>
 * @param {JSON} con - Constraint JSON to add to these options.
 */
mljs.prototype.options.prototype.addConstraint = function(con) {
  this.options.constraint.push(con);
};

/**
 * Create a collection constraint, and adds it to the search options object
 * 
 * @param {string} constraint_name_opt - Optional constraint name to use. Defaults to 'collection'
 * @param {string} prefix - Optional prefix (base collection) to use. Defaults to blank ''. I.e. all collections
 * @param {JSON} facet_option_opt - Optional JSON facet configureation. If not configured, will use the default facet configuration
 */
mljs.prototype.options.prototype.collectionConstraint = function(constraint_name_opt,prefix_opt,facet_option_opt) {
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
 */
mljs.prototype.options.prototype.geoelemConstraint = function(constraint_name_opt,parent,ns_opt,element,ns_el_opt) {
  if (undefined == element) {
    if (undefined == ns_opt) {
      element = parent;
      parent = constraint_name_opt;
      constraint_name_opt = undefined;
    } else {
      element = ns_opt;
      ns_opt = parent;
      parent = constraint_name_opt;
      constraint_name_opt = undefined;
    }
  }
  if (undefined == parent) {
    constraint_name_opt = parent;
    parent = ns_opt;
    ns_opt = undefined;
  }
  if (undefined == constraint_name_opt) {
    constraint_name_opt = element;
  }
  var con = { name: constraint_name_opt, "geo-elem": {
    parent: {ns: ns_opt || this.defaults.namespace, name: parent, element: {ns: ns_el_opt || this.defaults.namespace, name: element}}
  }};
  this.addConstraint(con);
  return this;
};
mljs.prototype.options.prototype.geoelem = mljs.prototype.options.prototype.geoelemConstraint;

/**
 * TODO Specifies a geospatial element attribute pair constraint, and adds it to the search options object
 */
mljs.prototype.options.prototype.geoelemattrConstraint = function() {
  // TODO geoelem attr
};
mljs.prototype.options.prototype.geoelemattr = mljs.prototype.options.prototype.geoelemattrConstraint;

/**
 * TODO Specifies a geospatial element pair constraint, and adds it to the search options object
 */
mljs.prototype.options.prototype.geoelempairConstraint = function() {
  // TODO geoelem pair
};
mljs.prototype.options.prototype.geoelempair = mljs.prototype.options.prototype.geoelempairConstraint;

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
 * http://docs.marklogic.com/guide/rest-dev/appendixa#id_48012
 */
mljs.prototype.options.prototype.raw = function() {
  this._includeSearchDefaults();
  this.options["transform-results"].apply = "raw";
  this.options["transform-results"].ns = undefined;
  this.options["transform-results"].at = undefined;
};

/**
 * Uses default snippeting document snippeting mode.
 *
 * http://docs.marklogic.com/guide/rest-dev/appendixa#id_48012
 */
mljs.prototype.options.prototype.snippet = function() {
  this._includeSearchDefaults();
  this.options["transform-results"].apply = "snippet";
  this.options["transform-results"].ns = undefined;
  this.options["transform-results"].at = undefined;
};

/**
 * Uses empty snippet document snippeting mode.
 *
 * http://docs.marklogic.com/guide/rest-dev/appendixa#id_48012
 */
mljs.prototype.options.prototype.empty = function() {
  this._includeSearchDefaults();
  this.options["transform-results"].apply = "empty-snippet";
  this.options["transform-results"].ns = undefined;
  this.options["transform-results"].at = undefined;
};

/**
 * Uses metadata-snippet document snippeting mode.
 *
 * http://docs.marklogic.com/guide/rest-dev/appendixa#id_48012
 */
mljs.prototype.options.prototype.metadata = function() {
  this._includeSearchDefaults();
  this.options["transform-results"].apply = "metadata-snippet";
  this.options["transform-results"].ns = undefined;
  this.options["transform-results"].at = undefined;
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
  this.options["sort-order"].push({"direction": "descending","score": null});
  return this;
};

/**
 * Specifies the sort order. Automatically called for any of the range constraint constructor functions.
 * 
 * @param {string} direction_opt - The direction (ascending or descending) to use. If not specified, uses the default direction.
 * @param {string} type_opt - The type of the sort element. If not specified uses the default type.
 * @param {string} key - The key (JSON key or element name) to use.
 * @param {string} collation_opt - The optional collation to use. Uses the default collation if not specified.
 */
mljs.prototype.options.prototype.sortOrder = function(direction_opt,type_opt,key,collation_opt) {
  this._includeSearchDefaults();
  // TODO check for unspecified type, direction, collation (and element + ns instead of key)
  var so = {direction: direction_opt || this.defaults.sortDirection,type:type_opt || this.defaults.type,"json-key": key};
  if ("xs:string" == collation_opt) {
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
    return {type: this.defaults.type, element: {ns: this.defaults.namespace, name: el}};
  } else {
    // json range object
    return el;
  }
};

/**
 * Creates a tuples definition for returning co-occurence values
 * 
 * @param {string} name - The name of the tuples configuration to create
 * @param {string|JSON} el - The first element for a co-occurence. Either an element/json key name (string) or a full REST API range type object (JSON)
 * @param {string|JSON} el - The second element for a co-occurence. Either an element/json key name (string) or a full REST API range type object (JSON)
 */
mljs.prototype.options.prototype.tuples = function(name,el,el2) { // TODO handle infinite tuple definitions (think /v1/ only does 2 at the moment anyway)
  var tuples = {name: name,range: new Array()};
  if (undefined == this.options.tuples) {
    this.options.tuples = new Array();
  }
  tuples.range.push(this._quickRange(el));
  tuples.range.push(this._quickRange(el2));
  this.options.tuples.push(tuples);
  return this;
};

/**
 * Creates a values definition for returning lexicon values
 * 
 * @param {string} name - The name of the values configuration to create
 * @param {string|JSON} el - The first element for a co-occurence. Either an element/json key name (string) or a full REST API range type object (JSON)
 * @param {string|JSON} el - The second element for a co-occurence. Either an element/json key name (string) or a full REST API range type object (JSON)
 */
mljs.prototype.options.prototype.values = function(name,el,el2) {
  var values = {name: name,range: new Array()};
  if (undefined == this.options.values) {
    this.options.values = new Array();
  }
  values.range.push(this._quickRange(el));
  values.range.push(this._quickRange(el2));
  this.options.values.push(values);
  return this;
};


/*
mljs.prototype.options = function() {
  return new mljs.prototype.options();
};
*/











// Structured Query Builder object

/**
 * Creates a structured query builder object
 * @constructor
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
 * Copies an existing query options object in to this object (pass a JSON structure query, not an mljs.query object)
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
    mljs.defaultconnection.logger.debug("WARNING: query.collection(): uri_opt not an array or string, but instead a '" + (typeof uri_opt) + "'");
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
 * @param {positiveInteger} radiusmiles - The radius from the circle centre to use. Defaults to statute (not nautical) miles
 * @param {string} radiusmeasure_opt - The units used. Default is status miles. m=metres, km=kilometres, nm=nautical miles, degrees=degrees of rotation of the Earth
 */
mljs.prototype.query.prototype.georadius = function(constraint_name,lat,lon,radiusmiles,radiusmeasure_opt) {
  var radiusactual = radiusmiles;
  if (undefined != radiusmeasure_opt) {
    if ("km" == radiusmeasure_opt) {
    } else if ("m" == radiusmeasure_opt) {
    } else if ("nm" == radiusmeasure_opt) {
      // TODO conversion helper
    } else if ("degrees" == radiusmeasure_opt) {
      // degrees of rotation - 1 minute (1/60 of a degree) is 1 nm
    }
  }
  return {
    "geospatial-constraint-query" : {
      "constraint-name": constraint_name,
      "circle": {
        "radius": radiusactual,
        point: [{"latitude": lat,"longitude": lon}]
      }
    }
  }
};

/**
 * Creates a range constraint query and returns it
 * 
 * @param {string} constraint_name - The constraint name from the search options for this constraint
 * @param {string} val - The value that matching documents must match
 */
mljs.prototype.query.prototype.range = function(constraint_name,val) {
  return {
    
            "range-constraint-query": {
              "value": val,
              "constraint-name": constraint_name
            }
  }
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

// TODO bounding box query

// TODO within polygon query

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
 * @param {function} listener - The function that is passed the event object
 */
com.marklogic.events.Publisher.prototype.subscribe = function(listener) {
  this.listeners.push(listener);
};

/**
 * Unsubscribes a listening function from this event publisher
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
 * @constructor
 */
mljs.prototype.searchcontext = function() {
  this._optionsbuilder = new mljs.prototype.options();
  
  this._querybuilder = new mljs.prototype.query();
  
  this._query = {};
  this.simplequery = "";
  
  this.sortWord = "sort";
  this.defaultQuery = ""; // should be set E.g. to "sort:relevance"
  
  this.defaultSort = [];
  
  this.optionsName = mljs.__dogenid();
  this.optionsExists = false;
  this.optionssavemode = "persist"; // persist or dynamic (v7 only)
  
  this.collection = null;
  this.directory = null;
  this.transform = null;
  this.format = null;
  
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
  
  // set up event handlers
  this.optionsPublisher = new com.marklogic.events.Publisher(); // updated search options JSON object, for parsing not storing a copy
  this.resultsPublisher = new com.marklogic.events.Publisher(); // publishes search results (including facet values)
  this.facetsPublisher = new com.marklogic.events.Publisher(); // publishese facets selection changes
  this.sortPublisher = new com.marklogic.events.Publisher(); // publishes sort changes (from query bar)
  this.errorPublisher = new com.marklogic.events.Publisher(); // errors occuring at search time
  this.simpleQueryPublisher = new com.marklogic.events.Publisher(); // simple query text
  
  
  // set default connection
  this.db = mljs.defaultconnection;
};


/**
 * Sets the name of the search transform to use. See GET /v1/search
 * @param {string} t - The transform name to use
 */
mljs.prototype.searchcontext.prototype.setTransform = function(t) {
  this.transform = t;
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
 * @param {JSON} options - The REST API JSON search options object to use
 */
mljs.prototype.searchcontext.prototype.setOptions = function(name,options) {
  this.optionsName = name;
  this._options = {options: options};
  if (undefined != options.options) {
    this._options = options; // no object wrapper
  }
  this.optionsExists = false;
  
  this.defaultSort = this._options.options["sort-order"];
  
  this.optionsPublisher.publish(this._options.options);
  
  // TODO support V7 dynamic query options capability rather than always saving
  
  // check if options exist
  var self = this;
};

/**
 * Sets the default query. Should be set to non blank, E.g. "sort:relevance"
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
 * @param {object} searchWidget - The widget to register with this context. Will be introspected by this function.
 */
mljs.prototype.searchcontext.prototype.register = function(searchWidget) {
  // introspect widget for update functions
  if ('function' === typeof(searchWidget.setContext)) {
    searchWidget.setContext(this);
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
};

mljs.prototype.searchcontext.prototype._parseQuery = function(q) {
  var text = "";
  var facets = new Array();
  var sort = null;
  var parts = q.trim().split(" "); // handles spaces in facet values
  for (var i = 0;i < parts.length;i++) {
    this.db.logger.debug("searchbar._parseQuery: parts[" + i + "]: " + parts[i]);
    var newIdx = i;
    var colonQuote = parts[i].indexOf(":\"");
    var finalQuote = parts[i].indexOf("\"",colonQuote + 2);
    this.db.logger.debug("searchbar._parseQuery: colonQuote: " + colonQuote + ", finalQuote: " + finalQuote);
    if (-1 != colonQuote && -1 == finalQuote) { // found first quote without end quote
      do {
        newIdx++;
        if (undefined != parts[newIdx]) {
          parts[i] = parts[i] + " " + parts[newIdx];
        }
      } while (newIdx < parts.length && parts[newIdx].indexOf("\"") != parts[newIdx].length - 1);
      this.db.logger.debug("searchbar._parseQuery: parts[" + i + "] now: " + parts[i]);
    }
      if (0 == parts[i].indexOf(this.sortWord + ":")) {
        sort = parts[i].substring(5);
      } else if (-1 != parts[i].indexOf(":")) {
        this.db.logger.debug("FOUND A FACET IN QUERY: " + parts[i]);
        var fv = parts[i].split(":");
        this.db.logger.debug("Facet name: " + fv[0] + " value: " + fv[1]);
        if (0 == fv[1].indexOf("\"")) {
          fv[1] = fv[1].substring(1);
          if ((fv[1].length - 1) == fv[1].indexOf("\"")) {
            fv[1] = fv[1].substring(0,fv[1].length-1);
          }
        }
        this.db.logger.debug("Facet info now name: " + fv[0] + " value: " + fv[1]);
        var found = false;
        for (var f = 0;f < facets.length;f++) {
          this.db.logger.debug(" - testing FACET: " + facets[f].name + " = " + facets[f].value);
          if (facets[f].name == fv[0] && facets[f].value == fv[1]) {
            // mark as found so we don't add this again as a facet. NB multiples for same facet are allowed, but not multiples of same facet value
            this.db.logger.debug(" - facets match, marking as found");
            found = true;
          }
        }
        if (!found) {
          facets.push({name: fv[0], value: fv[1]});
        }
      
    } else {
      text += " " + parts[i];
    }
    i = newIdx;
  }
  var last = {q: text.trim(),facets: facets,sort: sort};
  this.lastParsed = last;
  return last;
};


mljs.prototype.searchcontext.prototype._queryToText = function(parsed) {
  var q = parsed.q;
  if (null != parsed.sort) {
    q += " " + this.sortWord + ":" + parsed.sort;
  }
  for (var i = 0;i < parsed.facets.length;i++) {
    q += " " + parsed.facets[i].name + ":\"" + parsed.facets[i].value + "\"";
  }
  return q;
};

/**
 * Performs a structured query against this search context.
 * 
 * @param {json} q - The structured query JSON representation
 * @param {integer} start - The start index (result number), starting at 1
 */
mljs.prototype.searchcontext.prototype.dostructuredquery = function(q,start) {
  var self = this;
  
  self.resultsPublisher.publish(true); // forces refresh glyph to show
  self.facetsPublisher.publish(true);
  
  var ourstart = 1;
  if (0 != start && undefined != start) {
    ourstart = start;
  }
  
  var dos = function() {
   self.db.structuredSearch(q,self.optionsName,function(result) { 
    if (result.inError) {
      // report error on screen somewhere sensible (e.g. under search bar)
      self.db.logger.debug(result.error);
      self.resultsPublisher.publish(false); // hides refresh glyth on error
    } else {
      self.resultsPublisher.publish(result.doc);
    }
   });
  };
  
  this._persistAndDo(dos);
};

/**
 * Fires a simple query as specified, updating all listeners when the result is returned.
 * @param {string} q - The simple text query using the grammar in the search options
 * @param {integer} start - The start index (result number), starting at 1
 */
mljs.prototype.searchcontext.prototype.dosimplequery = function(q,start) {
  if (null == q || undefined == q) {
    q = "";
  }
  
  
  var self = this;
  self.resultsPublisher.publish(true); // forces refresh glyph to show
  self.facetsPublisher.publish(true);
  var ourstart = 1;
  if (0 != start && undefined != start) {
    ourstart = start;
  }
  
  // cleanse query value first
  this.db.logger.debug("Query before: '" + q + "'");
  
  var parsed = self._parseQuery(q);
  
  this.db.logger.debug("Query parsed: '" + JSON.stringify(parsed) + "'");
  var cq = self._queryToText(parsed);
  q = cq;
  this.db.logger.debug("Query after: '" + cq + "'");
  
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
   }
   if (null != self.format) {
     sprops.format = self.format;
   }
   self.db.search(q,self.optionsName,ourstart,sprops,function(result) { 
    if (result.inError) {
      // report error on screen somewhere sensible (e.g. under search bar)
      self.db.logger.debug(result.error);
      self.resultsPublisher.publish(false); // hides refresh glyth on error
    } else {
      self.resultsPublisher.publish(result.doc);
    }
   });
  };
  
  // check for options existance
  /*
  if (!this.optionsExists && "persist" == this.optionssavemode) {
    this.db.logger.debug("searchbar: Saving search options prior to query");
    this.db.saveSearchOptions(this.optionsName,this._options,function(result) {
      if (result.inError) {
        self.db.logger.debug("Exception saving results: " + result.details);
      } else {
        self.optionsExists = true; // to stop overwriting on subsequent requests
        dos();
      }
    });
  } else {
    dos();
  }*/
  
  this._persistAndDo(dos);
  
};

mljs.prototype.searchcontext.prototype._persistAndDo = function(callback) {
  
  if ("persist" == this.optionssavemode) {
    //self.db.searchoptions(this.optionsName,function(result) {
      //self.db.logger.debug("RESULT: " + JSON.stringify(result.doc));
      //if (result.inError) {
      //  self.db.logger.debug("Search options " + self.optionsName + " do not exist on the server. Search bar widget will auto create them on next search.");
      //  self.db.logger.debug("ERROR: " + JSON.stringify(result.details));
      //} else {
        // no error, do nothing (dependant objects fetch options dynamically)
        // now save them
        self.db.logger.debug("setOptions: saving search options: " + self.optionsName);
        if (self.optionsExist) {
          callback();
        } else {
        self.db.saveSearchOptions(self.optionsName,self._options,function(result) {
          if (result.inError) {
            self.db.logger.debug("Error saving Search options " + self.optionsName); 
          } else {
            self.optionsExists = true;
            self.db.logger.debug("Saved Search options " + self.optionsName); 
            
            callback();
          }
        });
      }
      //}
    //});
  }
  
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
 * @param {function(results)} rl - Results listener to add
 */
mljs.prototype.searchcontext.prototype.addResultsListener = function(rl) {
  this.resultsPublisher.subscribe(rl);
};

/**
 * Remove a results listener
 * 
 * @param {function(results)} rl - The result listener function to remove.
 */
mljs.prototype.searchcontext.prototype.removeResultsListener = function(rl) {
  this.resultsPublisher.unsubscribe(rl);
};

/**
 * Adds a sort listener to this widget.
 * 
 * @param {function(string)} sl - The sort listener to add
 */
mljs.prototype.searchcontext.prototype.addSortListener = function(sl) {
  this.sortPublisher.subscribe(sl);
};

/**
 * Removes a sort listener
 * 
 * @param {function(string)} sl - The sort listener to remove
 */
mljs.prototype.searchcontext.prototype.removeSortListener = function(sl) {
  this.sortPublisher.unsubscribe(sl);
};

/**
 * Adds a facet listener to this widget. Normally you'd use a results listener instead in order to get more context.
 * 
 * @param {function(facetValues)} fl - The Facet Listener to add
 */
mljs.prototype.searchcontext.prototype.addFacetsListener = function(fl) {
  this.facetsPublisher.subscribe(fl);
};

/**
 * Removes a facet listener
 * 
 * @param {function(facetValues)} fl - The Facet Listener to remove
 */
mljs.prototype.searchcontext.prototype.removeFacetsListener = function(fl) {
  this.facetsPublisher.unsubscribe(fl);
};

/**
 * Adds an error listener to this widget
 * 
 * @param {function(error)} fl - The error listener to add
 */
mljs.prototype.searchcontext.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 * 
 * @param {function(error)} fl - The error listener to remove
 */
mljs.prototype.searchcontext.prototype.removeErrorListener = function(fl) {
  this.errorPublisher.unsubscribe(fl);
};

/**
 * Event target. Useful to call directly from a Search Facets widget upon selection of a facet value. Executes a new search.
 * facetSelection = {name: facetName, value: facetValue}
 * @param {facetSelection} facetSelection - The facet value to restrict the search results by. 
 */
mljs.prototype.searchcontext.prototype.updateFacets = function(facetSelection) {
  var parsed = this._parseQuery(this.simplequery);
  parsed.facets = facetSelection;
  
  var q = this._queryToText(parsed);
  
  this.dosimplequery(q);
};

/**
 * Event target. Useful to call directly from a search pager widget. Executes a new search
 * json = {show: number, start: number}
 * @param {JSON} json - JSON representing the start result and the number of results to return per page.
 */
mljs.prototype.searchcontext.prototype.updatePage = function(json) {
  // example: {start: this.start, show: this.perPage}
  if (this._options.options["page-length"] != json.show) {
    this.optionsExists = false; // force re save of options
    this._options.options["page-length"] = json.show;
  }
  this.dosimplequery(this.simplequery,json.start);
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
  this.optionsExists = false; // force re save of options
  
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
 * Relationships for content:-
 *  - http://marklogic.com/semantic/ontology/derived_from (graph as subject)
 *  - http://marklogic.com/semantic/ontology/defined_by (any entity as subject where triples were extracted)
 * 
 */






/**
 * Holds configuration for object to triple mappings
 * 
 * @constructor
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
  this.addPlaces();
  this.addFoafPlaces();
  this.addTest();
  this.addMovies();
};

/**
 * Adds an error listener to this widget
 * 
 * @param {function(error)} fl - The error listener to add
 */
com.marklogic.semantic.tripleconfig.prototype.addErrorListener = function(fl) {
  this.errorPublisher.subscribe(fl);
};

/**
 * Removes an error listener
 * 
 * @param {function(error)} fl - The error listener to remove
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
    if ("object" == typeof this._newPredicates[predname]) {
      this._newPredicates[predname] = namedPredicateArray;
    }
  }
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

com.marklogic.semantic.tripleconfig.prototype.addPlaces = function() {
  //this.entities.push("placename");
  
  this.validTriples.push({subjectType: "placename", objectType: "placename", predicateArray: ["located_within","contains_location"]}); 
  
  //this._predicates["studies_at"] = "http://www.marklogic.com/ontology/0.1/studies_at";
  //this._predicates["affiliated_with"] = "http://www.marklogic.com/ontology/0.1/affiliated_with";
  //this._predicates["has_meetings_near"] = "http://www.marklogic.com/ontology/0.1/has_meetings_near";
  //this._predicates["located_within"] = "http://www.marklogic.com/ontology/0.1/located_within";
  //this._predicates["contains_location"] = "http://www.marklogic.com/ontology/0.1/contains_location";
  
  //this._iriPatterns["placename"] = "http://marklogic.com/semantic/targets/placename/#VALUE#";
  //this._rdfTypes["placename"] = "http://schema.org/Place"; // geonames features are an extension of Place
  //this._rdfTypesShort["placename"] = "so:Place"; // geonames features are an extension of Place
  //this._commonNamePredicates["placename"] = "http://www.geonames.org/ontology#name";
  //this._properties["placename"] = [{name: "name", iri: "http://www.geonames.org/ontology#name", shortiri: "geonames:name"}];
  
  
  this._newentities["place"] = {name: "place", title: "Place", prefix: "http://www.geonames.org/ontology#", iriPattern: "http://marklogic.com/semantic/targets/organisation/#VALUE#", 
    rdfTypeIri: "http://schema.org/Place", rdfTypeIriShort: "foaf:Organization", commonNamePredicate: "http://www.geonames.org/ontology#name",
    properties: [{name: "name", iri: "http://www.geonames.org/ontology#name", shortiri: "geonames:name"}]};
  
  this._newPredicates["studies_at"] = {name: "studies_at", title: "Studies at", iri: "http://www.marklogic.com/ontology/0.1/studies_at", shortiri: "ml:studies_at"};
  this._newPredicates["affiliated_with"] = {name: "affiliated_with", title: "Affiliated with", iri: "http://www.marklogic.com/ontology/0.1/affiliated_with", shortiri: "ml:affiliated_with"};
  this._newPredicates["has_meetings_near"] = {name: "has_meetings_near", title: "Meets near", iri: "http://www.marklogic.com/ontology/0.1/has_meetings_near", shortiri: "ml:has_meetings_near"};
  this._newPredicates["located_within"] = {name: "located_within", title: "Located within", iri: "http://www.marklogic.com/ontology/0.1/located_within", shortiri: "ml:located_within"};
  this._newPredicates["contains_location"] = {name: "contains_location", title: "Contains", iri: "http://www.marklogic.com/ontology/0.1/contains_location", shortiri: "ml:contains_location"};
};

com.marklogic.semantic.tripleconfig.prototype.addMovies = function() {
  this.validTriples.push({subjectType: "person", objectType: "movie", predicateArray: ["likesmovie"]});
  
  this._newentities["movie"] = {name: "movie", title: "Movie", prefix: "http://marklogic.com/semantic/ns/movie", iriPattern: "http://marklogic.com/semantic/targets/movies/#VALUE#",
    rdfTypeIri: "http://marklogic.com/semantic/rdfTypes/movie", rdfTypeIriShort: "mov:movie", commonNamePredicate: "hastitle",
    properties: [
      {name: "hastitle", iri: "hastitle", shortiri: "mov:hastitle"},
      {name: "hasactor", iri: "hasactor", shortiri: "mov:hasactor"},
      {name: "hasgenre", iri: "hasgenre", shortiri: "mov:hasgenre"},
      {name: "releasedin", iri: "releasedin", shortiri: "mov:releasedin"}
    ]
  };
  this._newPredicates["likesmovie"] = {name: "likesmovie", title: "Likes movie", iri: "likesmovie", shortiri: "mov:likesmovie"};
  this._newPredicates["hastitle"] = {name: "hastitle", title: "Has Title", iri: "hastitle", shortiri: "mov:hastitle"};
  this._newPredicates["hasactor"] = {name: "hasactor", title: "Has Actor", iri: "hasactor", shortiri: "mov:hasactor"};
  this._newPredicates["hasgenre"] = {name: "hasgenre", title: "Has Genre", iri: "hasgenre", shortiri: "mov:hasgenre"};
  this._newPredicates["releasedin"] = {name: "releasedin", title: "Released In", iri: "releasedin", shortiri: "mov:releasedin"};
};

com.marklogic.semantic.tripleconfig.prototype.addTest = function() {
  //this.entities.push("foodstuff");
  
  this.validTriples.push({subjectType: "person", objectType: "foodstuff", predicateArray: ["likes"]});
  
  // no special predicates in foodstuffs
  
  //this._iriPatterns["foodstuff"] = "http://marklogic.com/semantic/targets/foodstuffs/#VALUE#";
  //this._rdfTypes["foodstuff"] = "http://marklogic.com/semantic/rdfTypes/foodstuff";
  //this._rdfTypesShort["foodstuff"] = "fs:foodstuff";
  //this._commonNamePredicates["foodstuff"] = "foodname";
  //this._properties["foodstuff"] = [{name: "name", iri: "foodname", shortiri: "foodname"}];
  
  this._newentities["foodstuff"] = {name: "foodstuff", title: "Foodstuff", prefix: "http://marklogic.com/semantic/ns/foodstuff", iriPattern: "http://marklogic.com/semantic/targets/foodstuffs/#VALUE#", 
    rdfTypeIri: "http://marklogic.com/semantic/rdfTypes/foodstuff", rdfTypeIriShort: "fs:foodstuff", commonNamePredicate: "foodname",
    properties: [{name: "foodname", iri: "foodname", shortiri: "fs:foodname"}]};
    
  this._newPredicates["foodname"] = {name: "foodname", title: "Named", iri: "foodname", shortiri: "foodname"};
  this._newPredicates["likes"] = {name: "likes", title: "Likes food", iri: "likes", shortiri: "fs:likes"};
};

com.marklogic.semantic.tripleconfig.prototype.addFoafPlaces = function() {
  this.validTriples.push({subjectType: "person", objectType: "placename", predicateArray: ["based_near"]}); //NB based_near may not be a valid relationship class - may be lon/lat instead
  this.validTriples.push({subjectType: "organisation", objectType: "placename", predicateArray: ["based_near","has_meetings_near"]}); 
};

com.marklogic.semantic.tripleconfig.prototype.addFoaf = function() {
  this.validTriples.push({subjectType: "person", objectType: "person", predicateArray: ["knows","friendOf","enemyOf","childOf","parentOf","fundedBy"]});
  this.validTriples.push({subjectType: "person", objectType: "organisation", predicateArray: ["member","studies_at"]});
  this.validTriples.push({subjectType: "organisation", objectType: "organisation", predicateArray: ["member","parentOf","affiliated_with","fundedBy"]});
  
  //this._predicates["knows"] = "http://xmlns.com/foaf/0.1/knows";
  //this._predicates["friendOf"] = "http://xmlns.com/foaf/0.1/friendOf";
  //this._predicates["enemyOf"] = "http://xmlns.com/foaf/0.1/enemyOf";
  //this._predicates["childOf"] = "http://xmlns.com/foaf/0.1/childOf";
  //this._predicates["parentOf"] = "http://xmlns.com/foaf/0.1/parentOf";
  //this._predicates["fundedBy"] = "http://xmlns.com/foaf/0.1/fundedBy";
  //this._predicates["member"] = "http://xmlns.com/foaf/0.1/member";
  //this._predicates["based_near"] = "http://xmlns.com/foaf/0.1/based_near";
  //this._predicatesShort["knows"] = "foaf:knows";
  //this._predicatesShort["friendOf"] = "foaf:friendOf";
  //this._predicatesShort["enemyOf"] = "foaf:enemyOf";
  //this._predicatesShort["childOf"] = "foaf:childOf";
  //this._predicatesShort["parentOf"] = "foaf:parentOf";
  //this._predicatesShort["fundedBy"] = "foaf:fundedBy";
  //this._predicatesShort["member"] = "foaf:member";
  //this._predicatesShort["based_near"] = "foaf:based_near";
  
  // DELETE THE FOLLOWING
  /*
  this.entities.push("person");
  this.entities.push("organisation");
  this._iriPatterns["person"] = "http://marklogic.com/semantic/targets/person/#VALUE#";
  this._iriPatterns["organisation"] = "http://marklogic.com/semantic/targets/organisation/#VALUE#";
  this._rdfTypes["person"] = "http://xmlns.com/foaf/0.1/Person";
  this._rdfTypes["organisation"] = "http://xmlns.com/foaf/0.1/Organization";
  this._rdfTypesShort["person"] = "foaf:Person";
  this._rdfTypesShort["organisation"] = "foaf:Organization";
  this._commonNamePredicates["person"] = "http://xmlns.com/foaf/0.1/name";
  this._commonNamePredicates["organisation"] = "http://xmlns.com/foaf/0.1/name";
  
  this._properties["person"] = [{name: "name", iri: "http://xmlns.com/foaf/0.1/name", shortiri: "foaf:name"}];
  this._properties["organisation"] = [{name: "name", iri: "http://xmlns.com/foaf/0.1/name", shortiri: "foaf:name"}];
  // END DELETE
  */
  
  this._newentities["person"] = {name: "person", title: "Person",prefix: "http://xmlns.com/foaf/0.1/", iriPattern: "http://marklogic.com/semantic/targets/person/#VALUE#", 
    rdfTypeIri: "http://xmlns.com/foaf/0.1/Person", rdfTypeIriShort: "foaf:Person", commonNamePredicate: "http://xmlns.com/foaf/0.1/name",
    properties: [{name: "name", iri: "http://xmlns.com/foaf/0.1/name", shortiri: "foaf:name"}]};
    
  this._newentities["organisation"] = {name: "organisation", title: "Organisation", prefix: "http://xmlns.com/foaf/0.1/", iriPattern: "http://marklogic.com/semantic/targets/organisation/#VALUE#", 
    rdfTypeIri: "http://xmlns.com/foaf/0.1/Organization", rdfTypeIriShort: "foaf:Organization", commonNamePredicate: "http://xmlns.com/foaf/0.1/name",
    properties: [{name: "name", iri: "http://xmlns.com/foaf/0.1/name", shortiri: "foaf:name"}]};
  
  this._newPredicates["knows"] = {name: "knows", title: "Knows", iri: "http://xmlns.com/foaf/0.1/knows", shortiri: "foaf:knows"};
  this._newPredicates["friendOf"] = {name: "friendOf", title: "Friend", iri: "http://xmlns.com/foaf/0.1/friendOf", shortiri: "foaf:friendOf"};
  this._newPredicates["enemyOf"] = {name: "enemyOf", title: "Enemy", iri: "http://xmlns.com/foaf/0.1/enemyOf", shortiri: "foaf:enemyOf"};
  this._newPredicates["childOf"] = {name: "childOf", title: "Is a child of", iri: "http://xmlns.com/foaf/0.1/childOf", shortiri: "foaf:childOf"};
  this._newPredicates["parentOf"] = {name: "parentOf", title: "Is a parent of", iri: "http://xmlns.com/foaf/0.1/parentOf", shortiri: "foaf:parentOf"};
  this._newPredicates["fundedBy"] = {name: "fundedBy", title: "Funded by", iri: "http://xmlns.com/foaf/0.1/fundedBy", shortiri: "foaf:fundedBy"};
  this._newPredicates["member"] = {name: "member", title: "Is a member of", iri: "http://xmlns.com/foaf/0.1/member", shortiri: "foaf:member"};
  this._newPredicates["based_near"] = {name: "based_near", title: "Is based near", iri: "http://xmlns.com/foaf/0.1/based_near", shortiri: "foaf:based_near"};
  
};

com.marklogic.semantic.tripleconfig.prototype.getValidPredicates = function(from,to) {
  for (var i = 0;i < this.validTriples.length;i++) {
    if (this.validTriples[i].subjectType == from && this.validTriples[i].objectType == to) {
      return this.validTriples[i].predicateArray;
    }
  }
  return new Array();
};

com.marklogic.semantic.tripleconfig.prototype.getNameProperty = function(entity) {
  mljs.defaultconnection.logger.debug("getNameProperty: entity=" + entity);
  var cnp = this._newentities[entity].commonNamePredicate;
  mljs.defaultconnection.logger.debug("Common name property: " + cnp);
  for (var i = 0;i < this._newentities[entity].properties.length;i++) {
    mljs.defaultconnection.logger.debug("Property: " + i + " is: " + JSON.stringify(this._newentities[entity].properties[i]));
    mljs.defaultconnection.logger.debug(" - IRI: " + this._newentities[entity].properties[i].iri);
    if (cnp == this._newentities[entity].properties[i].iri) {
      mljs.defaultconnection.logger.debug("MATCH: " + JSON.stringify(this._newentities[entity].properties[i]));
      return this._newentities[entity].properties[i];
    }
  }
  return null;
};

com.marklogic.semantic.tripleconfig.prototype.getEntityFromIRI = function(iri) {
  for (var cn in this._newentities) {
    var p = this._newentities[cn];
    if (p.rdfTypeIri == iri) {
      return p;
    }
  }
};

com.marklogic.semantic.tripleconfig.prototype.getEntityFromShortIRI = function(iri) {
  for (var cn in this._newentities) {
    var p = this._newentities[cn];
    if (p.rdfTypeIriShort == iri) {
      return p;
    }
  }
};

com.marklogic.semantic.tripleconfig.prototype.getEntityFromName = function(name) {
  for (var cn in this._newentities) {
    var p = this._newentities[cn];
    if (p.name == name) {
      return p;
    }
  }
};

com.marklogic.semantic.tripleconfig.prototype.getPredicateFromIRI = function(iri) {
  for (var cn in this._newPredicates) {
    var p = this._newPredicates[cn];
    if (p.iri == iri) {
      return p;
    }
  }
};

com.marklogic.semantic.tripleconfig.prototype.getPredicateFromShortIRI = function(iri) {
  for (var cn in this._newPredicates) {
    var p = this._newPredicates[cn];
    if (p.shortiri == iri) {
      return p;
    }
  }
};

com.marklogic.semantic.tripleconfig.prototype.getPredicateFromName = function(name) {
  for (var cn in this._newPredicates) {
    var p = this._newPredicates[cn];
    if (p.name == name) {
      return p;
    }
  }
};

com.marklogic.semantic.tripleconfig.prototype.getEntityProperty = function(entity, name) {
  for (var i = 0;i < entity.properties.length;i++) {
    if (name == entity.properties[i].name) {
      return entity.properties[i];
    }
  }
  return null;
};
















/**
 * Semantic context object for finding entities and drilling down in to relationships. Abstracts performing SPARQL. Allows Caching of entity facts whilst browsing.
 * @constructor
 */
mljs.prototype.semanticcontext = function() {
  // query modifiers
  this._offset = 0;
  this._limit = 10;
  //this._distinct = true; // defined within subjectQuery
  
  this._tripleconfig = new com.marklogic.semantic.tripleconfig();
  
  this._subjectQuery = ""; // SPARQL to execute for selecting subject
  this._subjectResults = null; // SPARQL results JSON
  
  this._selectedSubject = ""; // IRI of selected subject
  this._subjectFacts = new Array(); // IRI -> JSON SPARQL facts results object
  
  this._restrictSearchContext = null; // the searchcontext instance to update with a cts:triples-range-query when our subjectQuery is updated
  this._contentSearchContext = null; // The search context to replace the query for when finding related content to this SPARQL query (where a result IRI is a document URI)
  
  this._subjectResultsPublisher = new com.marklogic.events.Publisher();
  this._subjectFactsPublisher = new com.marklogic.events.Publisher();
  this._suggestionsPublisher = new com.marklogic.events.Publisher();
  this._errorPublisher = new com.marklogic.events.Publisher();
};

mljs.prototype.semanticcontext.prototype.setContentContext = function(ctx) {
  this._contentSearchContext = ctx;
};

mljs.prototype.semanticcontext.prototype.getContentContext = function() {
  return this._contentSearchContext;
};

mljs.prototype.semanticcontext.prototype.hasContentContext = function() {
  return (null != this._contentSearchContext);
};

mljs.prototype.semanticcontext.prototype.getConfiguration = function() {
  return this._tripleconfig;
};

mljs.prototype.semanticcontext.prototype.setConfiguration = function(conf) {
  this._tripleconfig = conf;
};

mljs.prototype.semanticcontext.prototype.register = function(obj) {
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
  if (undefined != obj.updateSuggestions) {
    this._suggestionsPublisher.subscribe(function(suggestions) {obj.updateSuggestions(suggestions)});
  }
  
  // Where we listen to others' events
  if (undefined != obj.addSubjectSelectionListener) {
    obj.addSubjectSelectionListener(function(subjectIri) {this.subjectFacts(subjectIri)});
  }
  
  
  // also register with the content search context, if it exists
  if (null != this._contentSearchContext) {
    this._contentSearchContext.register(obj);
  }
};

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

mljs.prototype.semanticcontext.prototype.moveOffset = function(offset) {
  this._offset = offset;
  this._doSubjectQuery();
};

mljs.prototype.semanticcontext.prototype._doSubjectQuery = function() {
  var self = this;
  
  var q = this._subjectQuery + " OFFSET " + this._offset + " LIMIT " + this._limit;
  // execute function defined in our properties
  mljs.defaultconnection.sparql(q,function(result) {
    mljs.defaultconnection.logger.debug("RESPONSE: " + JSON.stringify(result.doc));
    if (result.inError) {
      self._subjectResultsPublisher.publish(false);
      self._errorPublisher.publish(result.error);
    } else {
      self._subjectResultsPublisher.publish(result.doc);
    }
  });
};

mljs.prototype.semanticcontext.prototype.subjectFacts = function(subjectIri) {
  this._selectedSubject = subjectIri;
  
  // subject SPARQL
  this.getFacts(subjectIri,true);
};

mljs.prototype.semanticcontext.prototype.subjectContent = function(subjectIri) {
  // update the linked searchcontext with a query related to documents that the facts relating to this subjectIri were inferred from
  // TODO sparql query to fetch doc URIs (stored as derivedFrom IRIs)
  // execute sparql for all facts  to do with current entity
  var self = this;
  if (null != this._contentSearchContext) {
    self._contentSearchContext.updateResults(true);
    
    var sparql = "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\nPREFIX rdfs: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" + 
      "SELECT ?docuri {\n  GRAPH ?graph {\n    ";
    if (self.reverse) {
      sparql += "?obj ?pred <" + self.iri + "> .";
    } else {
      sparql += "<" + self.iri + "> ?pred ?obj .";
    }
    
    sparql += "\n  }\n  ?graph <http://marklogic.com/semantics/ontology/derived_from> ?docuri .\n" + 
      "} LIMIT 10";
    mljs.defaultconnection.sparql(sparql,function(result) {
        if (result.inError) {
          self._contentSearchContext.updateResults(false);
          self.errorPublisher.publish(result.error);
        } else {
      // use docuris as a shotgun or structured search
      var qb = new mljs.defaultconnection.query(); // TODO maintain link to parent connection instance
      var uris = new Array();
      for (var b = 0;b < result.doc.results.bindings.length;b++) {
        var res = result.doc.results.bindings[b];
        uris.push(res.docuri.value);
      }
      qb.query(qb.uris("uris",uris));
      var queryjson = qb.toJson();
      
      self._contentSearchContext.dostructuredquery(queryjson,1);
      
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

mljs.prototype.semanticcontext.prototype.getFact = function(subjectIri,predicate,reload_opt) {
  var facts = this._subjectFacts[subjectIri];
  var bindings
  var self = this;
  var fireFact = function() {
    var results = [];
    for (var i = 0;i < bindings.length;i++) {
      if (undefined == bindings[i].predicate || predicate == bindings[i].predicate) { // if undefined, its a result of us asking for a specific predicate, and thus a matching predicate
        results.push(bindings[i].predicate); // pushes type, value, xml:lang (if applicable) as JSON object to results array
      }
    }
    self._subjectFactsPublisher.publish({subject: subjectIri,predicate: predicate,facts: bindings})
  };
  
  if ((true==reload_opt) || undefined == facts) { 
    var sparql = "SELECT * WHERE {<" + subjectIri + "> <" + predicate + "> ?object .}";
  
    // fetch info and refresh again
    mljs.defaultconnection.sparql(sparql,function(result) {
      mljs.defaultconnection.logger.debug("RESPONSE: " + JSON.stringify(result.doc));
      if (result.inError) {
        self._errorPublisher.publish(result.error);
      } else {
        bindings = result.doc.results.bindings;
        fireFact();
      }
    });
  } else {
    bindings = facts.results.bindings;
    fireFact();
  }
};

mljs.prototype.semanticcontext.prototype.getFacts = function(subjectIri,reload_opt) {
  var self = this;
  var facts = this._subjectFacts[subjectIri];
  if ((true==reload_opt) || undefined == facts) { 
    var sparql = "SELECT * WHERE {<" + subjectIri + "> ?predicate ?object .}";
  
    // fetch info and refresh again
    mljs.defaultconnection.sparql(sparql,function(result) {
      mljs.defaultconnection.logger.debug("RESPONSE: " + JSON.stringify(result.doc));
      if (result.inError) {
        self._subjectFactsPublisher.publish(false);
        self._errorPublisher.publish(result.error);
      } else {
        self._subjectFacts[subjectIri] = result.doc;
        self._subjectFactsPublisher.publish({subject: subjectIri,facts: result.doc});
      }
    });
  } else {
    self._subjectFactsPublisher.publish({subject: subjectIri,facts: facts});
  }
};

/**
 * This seems to kick the sparql query cache in to action. Even doing this for a different RdfType seems to help.
 * This is really only applicable to demonstrations rather than production systems, as in production MarkLogic's
 * triple algorithms over time change algorithms to a near-best option, and caches this for 10 minutes.
 */
mljs.prototype.semanticcontext.prototype.primeSimpleSuggest = function() {
  mljs.defaultconnection.logger.debug("primeSimpleSuggest");
  var sparql = "SELECT DISTINCT ?suggestion WHERE {\n  ?s a <wibble> . \n  ?s <hasflibble> ?suggestion . \n  FILTER regex(?suggestion, \"Abc.*\", \"i\") \n} ORDER BY ASC(?suggestion) LIMIT 10";
  
  mljs.defaultconnection.logger.debug("primeSimpleSuggest: SPARQL: " + sparql);
  
  mljs.defaultconnection.sparql(sparql,function(result) {
    mljs.defaultconnection.logger.debug("primeSimpleSuggest: RESPONSE: " + JSON.stringify(result.doc));
    // do nothing - we're just priming the MarkLogic server's triple algorithm cache
  }); 
};

mljs.prototype.semanticcontext.prototype.simpleSuggest = function(rdfTypeIri,predicateIri,startString_opt) {
  mljs.defaultconnection.logger.debug("simpleSuggest");
  var sparql = "SELECT DISTINCT ?suggestion WHERE {\n  ?s a <" + rdfTypeIri + "> . \n  ?s <" + predicateIri + "> ?suggestion . \n";
  if (undefined != startString_opt) {
    sparql += "  FILTER regex(?suggestion, \"" + startString_opt + ".*\", \"i\") \n";
  }
  
  sparql += "} ORDER BY ASC(?suggestion) LIMIT 10";
  
  mljs.defaultconnection.logger.debug("simpleSuggest: SPARQL: " + sparql);
  
  var self = this;
  mljs.defaultconnection.sparql(sparql,function(result) {
    mljs.defaultconnection.logger.debug("RESPONSE: " + JSON.stringify(result.doc));
    if (result.inError) {
      self._errorPublisher.publish(result.error);
    } else {
      self._suggestionsPublisher.publish({rdfTypeIri: rdfTypeIri, predicate: predicateIri, suggestions: result.doc});
    }
  }); 
};
