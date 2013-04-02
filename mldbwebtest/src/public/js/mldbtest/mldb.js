var basic = null, digest = null, thru = null, noop = null, winston = null;
var logger = null;
if (typeof window === 'undefined') {
  basic = require("./lib/basic-wrapper"),
  digest = require("./lib/digest-wrapper"),
  thru = require("./lib/passthrough-wrapper"),
  noop = require("./lib/noop"),
  winston = require('winston');

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
    this.loglevels = ["debug","info","warn","error"];
    this.loglevel = 2;
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

function textToXML(text){
	if (window.ActiveXObject){
    var doc=new ActiveXObject('Microsoft.XMLDOM');
    doc.async='false';
    doc.loadXML(text);
  } else {
    var parser=new DOMParser();
    var doc=parser.parseFromString(text,'text/xml');
	}
	return doc;
}

// from http://stackoverflow.com/questions/7769829/tool-javascript-to-convert-a-xml-string-to-json
function xmlToJson(xml) {
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
        obj[nodeName] = xmlToJson(item);
      } else {
        if (typeof (obj[nodeName].push) == "undefined") {
          var old = obj[nodeName];
          obj[nodeName] = [];
          obj[nodeName].push(old);
        }
        obj[nodeName].push(xmlToJson(item));
      }
    }
  }
  return obj;
};



// INSTANCE CODE






// MLDB DATABASE OBJECT

var self;
var m = function() {
  this.configure();
};

// CONFIG METHODS

/**
 * Provide configuration information to this database. This is merged with the defaults.
 */
m.prototype.configure = function(dboptions) {
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
    
    if (!(typeof jQuery == 'undefined')) {
      // is jquery defined?
      logger.debug("Wrapper: jQuery, Version: " + jQuery.fn.jquery);
      if (undefined == mldb.bindings || undefined == mldb.bindings.jquery) {
        logger.debug("ERROR SEVERE: mldb.bindings.jquery is not defined. Included mldb-jquery.js ?");
      } else {
        this.dboptions.wrapper = new mldb.bindings.jquery();
      }
    } else if (!(typeof Prototype == 'undefined')) {
      // is prototypejs defined?
      logger.debug("Wrapper: Prototype, Version: " + Prototype.Version);
      if (undefined == mldb.bindings || undefined == mldb.bindings.prototypejs) {
        logger.debug("ERROR SEVERE: mldb.bindings.prototypejs is not defined. Included mldb-prototype.js ?");
      } else {
        this.dboptions.wrapper = new mldb.bindings.prototypejs();
      }
    } else {
      // fallback to XMLHttpRequest
      logger.debug("Wrapper: Falling back to XMLHttpRequest");
      if (undefined == mldb.bindings || undefined == mldb.bindings.xhr) {
        logger.debug("ERROR SEVERE: mldb.bindings.xhr is not defined. Included mldb-xhr.js ?");
      } else {
        this.dboptions.wrapper = new mldb.bindings.xhr();
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
 */
m.prototype.setLogger = function(newlogger) {
  //logger = newlogger;
  this.logger = newlogger;
  if (this.dboptions.wrapper != undefined) {
    this.dboptions.wrapper.logger = newlogger;
  }
};


if (typeof window === 'undefined') {
  // NodeJS exports
  module.exports = function() {return new m()};
} else {
  mldb = m;
}




// PRIVATE METHODS

m.prototype.__genid = function() {
  return m.__dogenid();
};

m.__dogenid = function() {
  return "" + ((new Date()).getTime()) + "-" + Math.ceil(Math.random()*100000000);
}

m.prototype.__doreq_wrap = function(reqname,options,content,callback_opt) {
  this.dboptions.wrapper.request(reqname,options,content,function(result) {
    (callback_opt || noop)(result);
  });
};

m.prototype.__doreq_node = function(reqname,options,content,callback_opt) {
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
          (callback_opt || noop)({statusCode: res.statusCode,error: body,inError: true, details: xmlToJson(body)});
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
          (callback_opt || noop)(jsonResult); // TODO probably pass res straight through, appending body data
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
 */
m.prototype.__doreq = function(reqname,options,content,callback_opt) {
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
    options.path = options.path.substring(0,pos - 1) + options.path.substring(pos+11);
    options.headers["Content-Type"] = "application/json";
    this.logger.debug("Converted format=json to Content-Type header. Path now: " + options.path + " , headers now: " + JSON.stringify(options.headers));
  }
  
  this.__doreq_impl(reqname,options,content,callback_opt);
};





// PASS THROUGH




/**
 * Function allowing MLDB's underlying REST invocation mechanism to be used for an arbitrary request. 
 * Useful for future proofing should some new functionality come out, or bug discovered that prevents
 * your use of a JavaScript Driver API call.
 * options = {method: "GET|POST|PUT|DELETE", path: "/v1/somepath?key=value&format=json"}
 * content = undefined for GET, DELETE, json for PUT, whatever as required for POST
 */
m.prototype.do = function(options_opt,content_opt,callback_opt) {
  if (callback_opt == undefined && typeof(content_opt)==='function') {
    callback_opt = content_opt;
    content_opt = undefined;
  }
  this.__doreq("DO",options_opt,content_opt,callback_opt);
};






// DATABASE ADMINISTRATION FUNCTIONS




/**
 * Does this database exist? Returns an object, not boolean, to the callback
 */
m.prototype.exists = function(callback) {
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
m.prototype.test = m.prototype.exists;


/**
 * Creates the database and rest server if it does not already exist
 */
m.prototype.create = function(callback_opt) {
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
 */
m.prototype.destroy = function(callback_opt) {
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
 * Fetches a document with the given URI.
 * 
 * https://docs.marklogic.com/REST/GET/v1/documents
 */
m.prototype.get = function(docuri,options_opt,callback_opt) {
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
 * Fetches the metadata for a document with the given URI. Metadata document returned in result.doc
 * 
 * https://docs.marklogic.com/REST/GET/v1/documents
 */
m.prototype.metadata = function(docuri,callback_opt) {
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
 * Saves new docs with GUID-timestamp, new docs with specified id, or updates doc with specified id
 * NB handle json being an array of multiple docs rather than a single json doc
 * If no docuri is specified, one is generated by using a combination of the time and a large random number.
 *
 * https://docs.marklogic.com/REST/PUT/v1/documents
 */
m.prototype.save = function(json,docuri_opt,props_opt,callback_opt) {
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
  
  
  var url = "/v1/documents?uri=" + encodeURI(docuri_opt) + "&format=json";
  if (props_opt) {
    if (props_opt.collection) {
      url += "&collection=" + encodeURI(props_opt.collection);
    }
  }
  
  // make transaction aware
  if (undefined != this.__transaction_id) {
    url += "&txid=" + encodeURI(this.__transaction_id);
  }
  
  var options = {
    path: url,
    method: 'PUT'
  };
  
  this.__doreq("SAVE",options,json,function(result) {
    result.docuri = docuri_opt;
    (callback_opt||noop)(result);
  });
};

/**
 * Updates the document with the specified uri by only modifying the passed in properties.
 * NB May not be possible in V6 REST API elegantly - may need to do a full fetch, update, save
 */
m.prototype.merge = function(json,docuri,callback_opt) { 
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

m.prototype.__merge = function(json1,json2) {
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
 * Deletes the specified document
 * 
 * https://docs.marklogic.com/REST/DELETE/v1/documents
 */ 
m.prototype.delete = function(docuri,callback_opt) { 
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
m.prototype.remove = m.prototype.delete; // Convenience method for people with bad memories like me

/**
 * Returns all documents in a collection, optionally matching against the specified fields
 * http://docs.marklogic.com/REST/GET/v1/search
 */
m.prototype.collect = function(collection,fields_opt,callback_opt) {
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
 * http://docs.marklogic.com/REST/GET/v1/search
 */
m.prototype.list = function(directory,callback_opt) { 
  var options = {
    path: "/v1/search?directory=" + encodeURI(directory) + "&format=json&view=results",
    method: "GET"
  };
  this.__doreq("LIST",options,null,callback_opt);
};

/**
 * Performs a simple key-value search. Of most use to JSON programmers.
 * 
 * https://docs.marklogic.com/REST/GET/v1/keyvalue
 */
m.prototype.keyvalue = function(key,value,keytype_opt,callback_opt) {
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
 * Performs a search:search via REST
 * http://docs.marklogic.com/REST/GET/v1/search
 *
 * See supported search grammar http://docs.marklogic.com/guide/search-dev/search-api#id_41745 
 */ 
m.prototype.search = function(query_opt,options_opt,start_opt,sprops_opt,callback) { 
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
  var url = "/v1/search?q=" + encodeURI(query_opt) + "&format=json";
  if (options_opt != undefined) {
    if (typeof options_opt === "string") {
      url += "&options=" + encodeURI(options_opt);
    }/* else {
      // add as content document
      content = options_opt;
      method = "POST"; // TODO verify
    }*/
  }
  if (undefined != sprops_opt) {
    if (undefined != sprops_opt.collection) {
      url += "&collection=" + sprops_opt.collection;
    }
    if (undefined != sprops_opt.directory) {
      url += "&directory=" + sprops_opt.directory;
    }
  }
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
  this.__doreq("SEARCH",options,content,callback);
};

/**
 * Performs a search:search via REST
 * http://docs.marklogic.com/REST/GET/v1/search
 *
 * See supported search grammar http://docs.marklogic.com/guide/search-dev/search-api#id_41745 
 */ 
m.prototype.searchCollection = function(collection_opt,query_opt,options_opt,callback) { 
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
  this.__doreq("SEARCH",options,null,callback);
};

/**
 * Performs a structured search.
 * http://docs.marklogic.com/REST/GET/v1/search
 * 
 * Uses structured search instead of cts:query style searches. See http://docs.marklogic.com/guide/search-dev/search-api#id_53458
 */
m.prototype.structuredSearch = function(query_opt,options_opt,callback) {
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
  this.__doreq("SEARCH",options,null,callback);
};


/**
 * Saves search options with the given name. These are referred to by mldb.structuredSearch.
 * http://docs.marklogic.com/REST/PUT/v1/config/query/*
 *
 * For structured serch options see http://docs.marklogic.com/guide/rest-dev/search#id_48838
 */
m.prototype.saveSearchOptions = function(name,searchoptions,callback_opt) {
  var options = {
    path: "/v1/config/query/" + name + "?format=json",
    method: "PUT"
  };
  this.__doreq("SAVESEARCHOPTIONS",options,searchoptions,callback_opt);
};

/**
 * Fetches values from a lexicon or computes 2-way co-occurence.
 * https://docs.marklogic.com/REST/GET/v1/values/*
 */
m.prototype.values = function(query,tuplesname,optionsname,callback_opt) {
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





// TRANSACTION MANAGEMENT







/**
 * Opens a new transaction. Optionally, specify your own name.
 * http://docs.marklogic.com/REST/POST/v1/transactions
 */
m.prototype.beginTransaction = function(name_opt,callback) {
  if (undefined == callback && typeof(name_opt)==='function') {
    callback = name_opt;
    name_opt = undefined;
  }
  
  // ensure a transaction ID is not currently open
  if (undefined != this.__transaction_id) {
    var result = {inError:true,error: "This DB instance has an open transaction. Multiple transactions not supported in this version of MLDB."};
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
m.prototype.begin = m.prototype.beginTransaction;

/**
 * Commits the open transaction
 * http://docs.marklogic.com/REST/POST/v1/transactions/*
 */
m.prototype.commitTransaction = function(callback) {
  var options = {
    path: "/v1/transactions/" + this.__transaction_id + "?result=commit",
    method: "POST"
  };
  this.__transaction_id = undefined;
  this.__doreq("COMMITTRANS",options,null,callback);
};
m.prototype.commit = m.prototype.commitTransaction;

/**
 * Rolls back the open transaction.
 * http://docs.marklogic.com/REST/POST/v1/transactions/*
 */
m.prototype.rollbackTransaction = function(callback) {
  var options = {
    path: "/v1/transactions/" + this.__transaction_id + "?result=rollback",
    method: "POST"
  };  
  this.__transaction_id = undefined;
  this.__doreq("ABANDONTRANS",options,null,callback);
};
m.prototype.rollback = m.prototype.rollbackTransaction;







// DRIVER HELPER FEATURES







/**
 * Generic wrapper to wrap any mldb code you wish to execute in parallel. E.g. uploading a mahoosive CSV file. Wrap ingestcsv with this and watch it fly!
 * NOTE: By default all E-node (app server requests, like the ones issued by this JavaScript wrapper) are executed in a map-reduce style. That is to say
 * they are highly parallelised by the server, automatically, if in a clustered environment. This is NOT what the fast function does. The fast function
 * is intended to wrap utility functionality (like CSV upload) where it may be possible to make throughput gains by running items in parallel. This is
 * akin to ML Content Pump (mlcp)'s -thread_count and -transaction_size ingestion options. See defaultdboptions for details
 */
m.prototype.fast = function(callback_opt) {
  this.__fast = true;
  (callback_opt||noop)({inError:false,fast: true});
};







// UTILITY METHODS







/**
 * Takes a csv file and adds to the database.
 * fast aware method
 */
m.prototype.ingestcsv = function(csvdata,docid_opt,callback_opt) {
  
};

/**
 * Inserts many JSON documents. FAST aware, TRANSACTION aware.
 */
m.prototype.saveAll = function(doc_array,uri_array_opt,callback_opt) {
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
  // TODO make transaction aware (auto by using save - need to check for error on return. pass error up for auto rollback)
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
 */
m.prototype.saveAll2 = function(doc_array,uri_array_opt,callback_opt) {
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
  // TODO make transaction aware (auto by using save - need to check for error on return. pass error up for auto rollback)
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

// START EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and subscribe to alerts from them. Alerts sent to a given URL.
/**
 * Save a query using the default search grammar (see search:search) with a given name
 */
m.prototype.saveBasicSearch = function(searchname,shared,query,callback_opt) {
  this._doSaveBasicSearch(searchname,shared,query,"search",null,callback_opt);
};

m.prototype._doSaveBasicSearch = function(searchname,shared,query,createmode,notificationurl,callback_opt) {
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
 * Save a query that matches documents created within a collection, with a given name
 */
m.prototype.saveCollectionSearch = function(searchname,shared,collection,callback_opt) {
  this._doSaveCollectionSearch(searchname,shared,collection,"search",null,callback_opt);
};

m.prototype._doSaveCollectionSearch = function(searchname,shared,collection,createmode,notificationurl,callback_opt) {
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
 * Save a geospatial search based on a point and radius from it, with a given name
 * TODO check if we need to include an alert module name in the options
 */
m.prototype.saveGeoNearSearch = function(searchname,shared,latitude,longitude,radiusmiles,callback_opt) {
  this._doSaveGeoNearSearch(searchname,shared,latitude,longitude,radiusmiles,"search",null,callback_opt);
};

m.prototype._doSaveGeoNearSearch = function(searchname,shared,latitude,longitude,radiusmiles,createmode,notificationurl,callback_opt) {
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
 * Save an arbitrary search (any cts:query) already stored in the database, with a given name. Enables easy referencing and activation of alerts on this search.
 */
m.prototype.saveExistingSearch = function(searchname,shared,searchdocuri,callback_opt) {
  this._doSaveExistingSearch(searchname,shared,searchdocuri,"search",null,callback_opt)
};

m.prototype._doSaveExistingSearch = function(searchname,shared,searchdocuri,createmode,notificationurl,callback_opt) {
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
 * Uses Adam Fowler's (me!) REST API extension for subscribing to searches. RESTful HTTP calls are sent with the new information to the specified url.
 */
m.prototype.subscribe = function(notificationurl,searchname,detail,contenttype,callback_opt) {
  var url = "/v1/resources/subscribe?notificationurl=" + encodeURI(notificationurl) + "&format=json&searchname=" + encodeURI(searchname) + 
    "&detail=" + encodeURI(detail) + "&contenttype=" + encodeURI(contenttype);
    
  var options = {
    path: url,
    method: "POST"
  };
  this.__doreq("SUBSCRIBE",options,null,callback_opt);
};

/**
 * Unsubscribe a notificationurl from a named search. Uses Adam Fowler's (me!) REST API extension.
 */
m.prototype.unsubscribe = function(notificationurl,searchname,callback_opt) {
  var url = "/v1/resources/subscribe?notificationurl=" + encodeURI(notificationurl) + "&format=json&searchname=" + encodeURI(searchname) + "&delete=search";
    
  var options = {
    path: url,
    method: "DELETE"
  };
  this.__doreq("UNSUBSCRIBE",options,null,callback_opt);
};

/**
 * Unsubscribe from an alert and delete the underlying saved search. Convenience method.
 */
m.prototype.unsubscribeAndDelete = function(notificationurl,searchname,callback_opt) {
  var url = "/v1/resources/subscribe?notificationurl=" + encodeURI(notificationurl) + "&format=json&searchname=" + encodeURI(searchname) + "&delete=both";
    
  var options = {
    path: url,
    method: "DELETE"
  };
  this.__doreq("UNSUBSCRIBE",options,null,callback_opt);
};

/**
 * Delete the saved search. Assumes already unsubscribed from alerts used by it. (If not, alerts will still fire!)
 */
m.prototype.deleteSavedSearch = function(searchname,callback_opt) {
  var url = "/v1/resources/subscribe?format=json&searchname=" + encodeURI(searchname) + "&delete=search";
    
  var options = {
    path: url,
    method: "DELETE"
  };
  this.__doreq("DELETESAVEDSEARCH",options,null,callback_opt);
};

// END EXTENSION - subscribe-resource.xqy - Adam Fowler adam.fowler@marklogic.com - Save searches by name, and subscribe to alerts from them. Alerts sent to a given URL.
