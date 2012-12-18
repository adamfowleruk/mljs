var basic = require("./lib/basic-wrapper"),
    digest = require("./lib/digest-wrapper"),
    noop = require("./lib/noop"),
    winston = require('winston');

     var logger = new (winston.Logger)({
       transports: [
         new winston.transports.Console()
       ],
       exceptionHandlers: [
         new winston.transports.Console()
       ]
     });

// DEFAULTS

var defaultdboptions = {
  host: "localhost", port: 9090, adminport: 8002, ssl: false, auth: "digest", username: "admin",password: "admin", database: "mldbtest", searchoptions: {}, fastthreads: 10, fastparts: 100
}; // TODO change auth to digest once digest wrapper is working, automatically figure out port when creating new rest server

// INSTANCE CODE

// MLDB DATABASE OBJECT

var self;
var m = function() {
  this.configure();
};

m.prototype.configure = function(dboptions) {
  self = this;
  if (undefined == this.logger) {
    this.logger = logger;
  }
  this.dboptions = defaultdboptions;
  if (undefined != dboptions) {
    this.dboptions = defaultdboptions.concat(dboptions);
  }
  
  this.dboptions.wrappers = new Array();
  if (this.dboptions.auth == "basic") {
    this.dboptions.wrapper = new basic(); 
  } else if (this.dboptions.auth == "digest") {
    this.dboptions.wrapper = new digest();
  } else {
    // TODO handle no auth (default user)
  }  
  this.dboptions.wrapper.configure(this.dboptions.username,this.dboptions.password,this.logger);
};

m.prototype.setLogger = function(newlogger) {
  //logger = newlogger;
  this.logger = newlogger;
  if (this.dboptions.wrapper != undefined) {
    this.dboptions.wrapper.logger = newlogger;
  }
};

module.exports = function() {return new m()};

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
  var self = this;
  
  var wrapper = this.dboptions.wrapper;
  
  // if hostname and port are not this db (ie if admin port), then use new wrapper object (or one previously saved)
  if (options.host != this.dboptions.host || options.port != this.dboptions.port) {
    var name = options.host + ":" + options.port;
    this.logger.debug("WARNING: Not accessing same host as REST API. Accessing: " + name);
    //if (undefined == this.dboptions.wrappers[name]) {
      this.logger.debug("Creating new wrapper");
      var nw = new digest();
      nw.configure(this.dboptions.username,this.dboptions.password,this.logger);
      this.dboptions.wrappers[name] = nw;
      wrapper = nw;
    /*} else {
      this.logger.debug("Reusing saved wrapper");
      wrapper = this.dboptions.wrappers[name];
    }*/ // TRYING TO ALWAYS FORCE NEW CONNECTION FOR ADMIN REQUESTS -> gets us past db.exists()->true, but not ECONNRESET
  }
  
  var httpreq = wrapper.request(options, function(res) {
    var body = "";
    self.logger.debug("---- START " + reqname);
    self.logger.debug(reqname + " In Response");
    self.logger.debug(reqname + " Got response: " + res.statusCode);
    self.logger.debug("Method: " + options.method);
    
    res.on('data', function(data) {
      body += data;
      self.logger.debug(reqname + " Data: " + data);
    });
    var complete =  function() { 
      self.logger.debug(reqname + " complete()");
      if (res.statusCode.toString().substring(0,1) == ("4")) {
        self.logger.debug(reqname + " error: " + body);
        (callback_opt || noop)({statusCode: res.statusCode,error: body,inError: true});
      } else {
        var jsonResult = {body: body, statusCode: res.statusCode,inError: false};
        if (options.method == "GET" && undefined != body && ""!=body) {
          jsonResult.doc = JSON.parse(body);
        }
        (callback_opt || noop)(jsonResult); // TODO probably pass res straight through, appending body data
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
    (callback_opt || noop)({inError: true,error: e}); 
  });
  if (undefined != content && null != content) {
    httpreq.write(JSON.stringify(content));
  }
  httpreq.end();
};


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
      callback(result);
    } else {
      self.logger.debug("Returned rest api info: " + JSON.stringify(result.doc));
      var ex = !(undefined == result.doc["rest-apis"] || undefined == result.doc["rest-apis"][0] || self.dboptions.database != result.doc["rest-apis"][0].database);
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
  
  // don't assume the dbname is the same as the rest api name - look it up
  
  var getoptions = {
    host: this.dboptions.host,
    port: this.dboptions.adminport,
    path: "/v1/rest-apis?database=" + encodeURI(this.dboptions.database) + "&format=json",
    method: "GET"
  };
  var self = this;
  this.__doreq("DESTROY-EXISTS",getoptions,null,function(result) {
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
  
};

/**
 * Fetches a document with the given URI
 * TODO convert uri in to URL safe string
 * 
 * https://docs.marklogic.com/REST/GET/v1/documents
 */
m.prototype.get = function(docuri,callback_opt) {
  var options = {
    path: '/v1/documents?uri=' + encodeURI(docuri) + "&format=json",
    method: 'GET'
  };
  
  /*
  var httpreq = this.dboptions.wrapper.request(options, function(res) {
    var body = "";
    this.logger.debug("GET Got response: " + res.statusCode);
    
    res.on('data', function(data) {
      body += data;
      this.logger.debug("GET Data: " + data);
    });
    var complete = function() { 
      this.logger.debug("GET req: complete");
      // check response code is in the 200s
      if (res.statusCode.toString().substring(0,1) == ("4")) {
        this.logger.debug("GET error: " + body);
        (callback_opt || noop)({statusCode: res.statusCode,error: body,inError: true});
      } else {
        (callback_opt || noop)({body: body, statusCode: res.statusCode, doc: JSON.parse(body) ,inError: false}); // TODO probably pass res straight through, appending body data
      }
    };
    res.on('end', function() {
      this.logger.debug("GET Body: " + body);
      complete();
    });
    res.on('close', complete);
    res.on("error", function() {
      this.logger.debug("GET error: " + res.headers.response);
      (callback_opt || noop)({statusCode: res.statusCode,error: body,inError: true});
    });
    
    //complete();
  });
  httpreq.end();
  */
  
  
  this.__doreq("GET",options,null,callback_opt);
};

/**
 * Saves new docs with GUID-timestamp, new docs with specified id, or updates doc with specified id
 * NB handle json being an array of multiple docs rather than a single json doc
 * 
 * https://docs.marklogic.com/REST/PUT/v1/documents
 */
m.prototype.save = function(json,docuri_opt,props_opt,callback_opt) {
  if (undefined == callback_opt && undefined == props_opt && typeof(docuri_opt)=="function") {
    callback_opt = docuri_opt;
    docuri_opt = undefined;
  } else {
    if (undefined == callback_opt && undefined != props_opt) {
      callback_opt = props_opt;
      props_opt = undefined;
    }
  }
  
  
  var url = "/v1/documents?uri=" + encodeURI(docuri_opt) + "&format=json";
  if (props_opt) {
    if (props_opt.collection) {
      url += "&collection=" + encodeURI(props_opt.collection);
    }
  }

    // TODO make transaction aware
  
  var options = {
    path: url,
    method: 'PUT'
  };
  
  /*
  var httpreq = this.dboptions.wrapper.request(options, function(res) {
    var body = "";
    this.logger.debug("SAVE Got response: " + res.statusCode);
    
    res.on('data', function(data) {
      body += data;
      this.logger.debug("SAVE Data: " + data);
    });
    res.on('end', function() {
      this.logger.debug("SAVE Body: " + body);
    });
    var complete = function() { 
      this.logger.debug("SAVE req: complete");
      
      (callback_opt || noop)({body: body, statusCode: res.statusCode,inError: false}); // TODO probably pass res straight through, appending body data
    };
    
    res.on('close', complete);
    res.on("error", function() {
      this.logger.debug("SAVE error: " + res.headers.response);
      (callback_opt || noop)({statusCode: res.statusCode,error: body,inError: true});
    });
    
    complete();
    
  });
  httpreq.write(JSON.stringify(json));
  httpreq.end();
  */
  
  
  this.__doreq("SAVE",options,json,callback_opt);
};

/**
 * Updates the document with the specified uri by only modifying the passed in properties.
 * NB May not be possible in V6 REST API elegantly - may need to do a full fetch, update, save
 */
m.prototype.merge = function(json,docuri,callback_opt) { 
 
 // TODO make transaction aware
 
  this.get(docuri,function(result) {
    var merged = result.doc;
    merged.concat(json);
    this.save(merged,docuri,callback_opt);
  });
};

/**
 * Deleted the specified document
 * 
 * https://docs.marklogic.com/REST/DELETE/v1/documents
 */ 
m.prototype.delete = function(docuri,callback_opt) {
  var options = {
    path: '/v1/documents?uri=' + encodeURI(docuri),
    method: 'DELETE'
  };

    // TODO make transaction aware
  
  /*
  var httpreq = this.dboptions.wrapper.request(options, function(res) {
    var body = "";
    this.logger.debug("Got response: " + res.statusCode);
    
    res.on('data', function(data) {
      body += data;
      this.logger.debug("DELETE Data: " + data);
    });
    var complete =  function() { 
      this.logger.debug("DELETE req: CLOSE");
      
      (callback_opt || noop)({body: body, statusCode: res.statusCode,inError: false}); // TODO probably pass res straight through, appending body data
    };
    res.on('end', function() {
      this.logger.debug("DELETE Body: " + body);
      complete();
    });
    res.on('close',complete);
    res.on("error", function() {
      this.logger.debug("DELETE error: " + res.headers.response);
      (callback_opt || noop)({statusCode: res.statusCode,error: body,inError: true});
    });
    
  }).end();
  */
  
  this.__doreq("DELETE",options,null,callback_opt);
};
m.prototype.remove = m.prototype.delete; // Convenience method for people with bad memories like me

/**
 * Returns all documents in a collection, optionally matching against the specified fields
 * No need to wrap in fast(), that is handled by the MarkLogic server
 */
m.prototype.collect = function(collection,fields_opt,callback_opt) {
 var options = {
   path: "/v1/keyvalue?collection=" + encodeURI(collection),
   method: "GET"
 };
 this.__doreq("COLLECT",options,null,callback_opt);
};

/**
 * Lists all documents in a directory, to the specified depth (default: 1), optionally matching the specified fields
 */
m.prototype.list = function(directory,callback_opt) { 
  var options = {
    path: "/v1/keyvalue?directory=" + encodeURI(directory),
    method: "GET"
  };
  this.__doreq("LIST",options,null,callback_opt);
};

/**
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
  var options = {
    path: "/v1/keyvalue?" + keytype_opt + "=" + encodeURI(key) + "&value=" + encodeURI(value),
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
m.prototype.search = function(query_opt,options_opt,callback) { 
  if (callback == undefined && typeof(options_opt) === 'function') {
    callback = options_opt;
    options_opt = undefined;
  }
  var url = "/v1/search?q=" + encodeURI(query_opt);
  if (options_opt != undefined) {
    url += "&options=" + encodeURI(options_opt);
  }

  // TODO make transaction aware
    
  var options = {
    path: url,
    method: "GET"
  };
  this.__doreq("SEARCH",options,null,callback_opt);
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
  var url = "/v1/search?structuredQuery=" + encodeURI(query_opt);
  if (options_opt != undefined) {
    url += "&options=" + encodeURI(options_opt);
  }
  
  // TODO make transaction aware
  
  var options = {
    path: url,
    method: "GET"
  };
  this.__doreq("SEARCH",options,null,callback_opt);
};

/**
 * Opens a new transaction. Optionally, specify your own name.
 * http://docs.marklogic.com/REST/POST/v1/transactions
 */
m.prototype.beginTransaction = function(name_opt,callback) {
  if (undefined == callback && typeof(name_opt)==='function') {
    callback = name_opt;
    name_opt = undefined;
  }
  
  // TODO ensure a transaction ID is not currently open
  
  // temporary workaround for not having a mechanism to retrieve the Location header
  if (undefined == name_opt) {
    name_opt = "client-txn"; // same as server default
  }
  var url = "/v1/transactions";
  if (undefined != name_opt) {
    url += "?name=" + encodeURI(name_opt);
    this.__transaction_id = name_opt;
  }
  var options = {
    path: uri,
    method: "POST"
  };
  this.__doreq("BEGINTRANS",options,null,callback_opt); // TODO handle error by removing this.__txid
};

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
  this.__doreq("COMMITTRANS",options,null,callback);
};


// DRIVER HELPER FEATURES


/**
 * Generic wrapper to wrap any mldb code you wish to execute in parallel. E.g. uploading a mahoosive CSV file. Wrap ingestcsv with this and watch it fly!
 */
m.prototype.fast = function(callback_opt) {
  
};


// UTILITY METHODS


/**
 * Takes a csv file and adds to the database.
 * fast aware method
 */
m.prototype.ingestcsv = function(csvdata,docid_opt,callback_opt) {
  
};



// REST API EXTENSIONS

/**
 * Uses Adam Fowler's (me!) REST API extension for subscribing to geospatial alerts. RESTful HTTP calls are sent with the new information to the specified nodeurl.
 */
m.prototype.subscribe = function(nodeurl,lat,lon,radiusmiles,callback_opt) {
  
};

m.prototype.unsubscribe = function(nodeurl,callback_opt) {
  
};
