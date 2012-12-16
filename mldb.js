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
  hostname: "localhost", port: 9090, adminport: 8002, ssl: false, auth: "digest", username: "admin",password: "admin", database: "mldbtest", searchoptions: {}, fastthreads: 10, fastparts: 100
}; // TODO change auth to digest once digest wrapper is working, automatically figure out port when creating new rest server

// INSTANCE CODE

// MLDB DATABASE OBJECT

var self;
var m = function() {
  this.configure();
};

m.prototype.configure = function(dboptions) {
  self = this;
  this.dboptions = (dboptions || defaultdboptions)
  if (this.dboptions.auth == "basic") {
    this.dboptions.wrapper = new basic(); 
  } else if (this.dboptions.auth == "digest") {
    this.dboptions.wrapper = new digest();
  } else {
    // TODO handle no auth (default user)
  }  
  this.dboptions.wrapper.configure(this.dboptions.username,this.dboptions.password);
};

module.exports = function() {return new m()};

/**
 * Does this database exist?
 */
m.prototype.exists = function(callback_opt) {
  
};

m.prototype.__doreq = function(reqname,options,content,callback_opt) {
  
  var httpreq = this.dboptions.wrapper.request(options, function(res) {
    var body = "";
    logger.debug(reqname + "Got response: " + res.statusCode);
    
    res.on('data', function(data) {
      body += data;
      logger.debug(reqname + " Data: " + data);
    });
    var complete =  function() { 
      logger.debug(reqname + " req: CLOSE");
      if (res.statusCode.toString().substring(0,1) == ("4")) {
        logger.debug("GET error: " + body);
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
      logger.debug(reqname + " Body: " + body);
      complete();
    });
    res.on('close',complete);
    res.on("error", function() {
      logger.debug(reqname + " error: " + res.headers.response);
      (callback_opt || noop)({statusCode: res.statusCode,error: body,inError: true});
    });
    
    if (options.method == "PUT") {
      complete();
    }
    
  });
  if (undefined != content && null != content) {
    httpreq.write(JSON.stringify(content));
  }
  httpreq.end();
};

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
  
  var options = {
    hostname: this.dboptions.hostname,
    port: this.dboptions.adminport,
    path: '/v1/rest-apis',
    method: 'POST', headers: {}
  };
  var json = {"rest-api": {"name": this.dboptions.database + "-rest-" + this.dboptions.port, "database": this.dboptions.database, "modules-database":this.dboptions.database + "-modules", port: this.dboptions.port}};
  
  this.__doreq("CREATE",options,json,callback_opt);
  
};

/**
 * Destroys the database and rest api instance
 */
m.prototype.destroy = function(callback_opt) {
  
};

/**
 * Fetches a document with the given URI
 * TODO convert uri in to URL safe string
 */
m.prototype.get = function(docuri,callback_opt) {
  var body = "";
  
  var options = {
    hostname: this.dboptions.hostname,
    port: this.dboptions.port,
    path: '/v1/documents?uri=' + docuri + "&format=json",
    method: 'GET', headers: {}
  };
  
  /*
  var httpreq = this.dboptions.wrapper.request(options, function(res) {
    var body = "";
    logger.debug("GET Got response: " + res.statusCode);
    
    res.on('data', function(data) {
      body += data;
      logger.debug("GET Data: " + data);
    });
    var complete = function() { 
      logger.debug("GET req: complete");
      // check response code is in the 200s
      if (res.statusCode.toString().substring(0,1) == ("4")) {
        logger.debug("GET error: " + body);
        (callback_opt || noop)({statusCode: res.statusCode,error: body,inError: true});
      } else {
        (callback_opt || noop)({body: body, statusCode: res.statusCode, doc: JSON.parse(body) ,inError: false}); // TODO probably pass res straight through, appending body data
      }
    };
    res.on('end', function() {
      logger.debug("GET Body: " + body);
      complete();
    });
    res.on('close', complete);
    res.on("error", function() {
      logger.debug("GET error: " + res.headers.response);
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
  
  
  var body = "";
  
  var url = "/v1/documents?uri=" + docuri_opt + "&format=json";
  if (props_opt) {
    if (props_opt.collection) {
      url += "&collection=" + props_opt.collection;
    }
  }
  
  var options = {
    hostname: this.dboptions.hostname,
    port: this.dboptions.port,
    path: url,
    method: 'PUT', headers: {}
  };
  
  /*
  var httpreq = this.dboptions.wrapper.request(options, function(res) {
    var body = "";
    logger.debug("SAVE Got response: " + res.statusCode);
    
    res.on('data', function(data) {
      body += data;
      logger.debug("SAVE Data: " + data);
    });
    res.on('end', function() {
      logger.debug("SAVE Body: " + body);
    });
    var complete = function() { 
      logger.debug("SAVE req: complete");
      
      (callback_opt || noop)({body: body, statusCode: res.statusCode,inError: false}); // TODO probably pass res straight through, appending body data
    };
    
    res.on('close', complete);
    res.on("error", function() {
      logger.debug("SAVE error: " + res.headers.response);
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
  
};

/**
 * Deleted the specified document
 */ 
m.prototype.delete = function(docuri,callback_opt) {
  var body = "";
  
  var options = {
    hostname: this.dboptions.hostname,
    port: this.dboptions.port,
    path: '/v1/documents?uri=' + docuri,
    method: 'DELETE', headers: {}
  };
  
  /*
  var httpreq = this.dboptions.wrapper.request(options, function(res) {
    var body = "";
    logger.debug("Got response: " + res.statusCode);
    
    res.on('data', function(data) {
      body += data;
      logger.debug("DELETE Data: " + data);
    });
    var complete =  function() { 
      logger.debug("DELETE req: CLOSE");
      
      (callback_opt || noop)({body: body, statusCode: res.statusCode,inError: false}); // TODO probably pass res straight through, appending body data
    };
    res.on('end', function() {
      logger.debug("DELETE Body: " + body);
      complete();
    });
    res.on('close',complete);
    res.on("error", function() {
      logger.debug("DELETE error: " + res.headers.response);
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
  
};

/**
 * Lists all documents in a directory, to the specified depth (default: 1), optionally matching the specified fields
 */
m.prototype.list = function(directory,depth_opt,fields_opt,callback_opt) {
  
};

/**
 * Performs a search:search via REST
 */ 
m.prototype.search = function(query_opt,options_opt,callback) {
  
};

/**
 * Takes a csv file and adds to the database.
 * fast aware method
 */
m.prototype.ingestcsv = function(csvdata,docid_opt,callback_opt) {
  
};

/**
 * Generic wrapper to wrap any mldb code you wish to execute in parallel. E.g. uploading a mahoosive CSV file. Wrap ingestcsv with this and watch it fly!
 */
m.prototype.fast = function(callback_opt) {
  
};


