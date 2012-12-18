var http = require('http'),
    crypto = require('crypto'),
    _und = require('underscore'),
    noop = require("./noop"),
    winston = require('winston');

var EventEmitter = require('events').EventEmitter;

/**
* Wraps a HTTP request to the ML server for a particular user
* - Unknown bug that causes auth to fail. Using BasicWrapper instead
*/
var DigestWrapper = function(){
  this.emitter = new EventEmitter();
  this.configure();
};

DigestWrapper.prototype.configure = function(username,password,logger) {
  this.logger = logger;
  this.nc = 1;
  this.username = username;
  this.password = password;
  this.cnonce = "0a4f113b";
  this.nonce = undefined;
  this.opaque = undefined;
  this.realm = undefined;
  this.qop = undefined;
  this.writeData = "";
  this.ended = false;
};

DigestWrapper.prototype.request = function(options, callback_opt) {
  //var cnonce = Math.floor(Math.random()*100000000);
  this.logger.debug("DigestWrapper: in request() for " + options.host + ":" + options.port);
  
  this.writeData = "";
  this.__response = undefined;
  this.__callback = undefined;
  this.ended = false;
  this.finalReq = undefined;
  this.emitter.removeAllListeners();
  
  var digestWrapper = this;

  var doRequest = function() {
    var ncUse = padNC(digestWrapper.nc);
    digestWrapper.nc++;
    var realPath = options.path;
    digestWrapper.logger.debug("----------------------------------------");
    digestWrapper.logger.debug("options.method: '" + options.method + "'");
    digestWrapper.logger.debug("options.hostname: '" + options.host + "'");
    digestWrapper.logger.debug("options.port: '" + options.port + "'");
    digestWrapper.logger.debug("options.path: '" + options.path + "'");
    digestWrapper.logger.debug("path: '" + realPath + "'");
    digestWrapper.logger.debug("cnonce: '" + digestWrapper.cnonce + "'");
    digestWrapper.logger.debug("nonce: '" + digestWrapper.nonce + "'");
    digestWrapper.logger.debug("nc: '" + ncUse + "'");
    digestWrapper.logger.debug("realm: '" + digestWrapper.realm + "'");
    digestWrapper.logger.debug("qop: '" + digestWrapper.qop + "'");
    digestWrapper.logger.debug("opaque: '" + digestWrapper.opaque + "'");
    /*var h = "Headers: ";
    if (undefined == options.headers) {
      h += "indefined";
    } else {
    }*/

    // See Client Request at http://en.wikipedia.org/wiki/Digest_access_authentication
    var md5ha1 = crypto.createHash('md5');
    var ha1raw = digestWrapper.username + ":" + digestWrapper.realm + ":" + digestWrapper.password;
    digestWrapper.logger.debug("ha1raw: " + ha1raw);
    md5ha1.update(ha1raw);
    var ha1 = md5ha1.digest('hex');

    var md5ha2 = crypto.createHash('md5');
    var ha2raw = options.method + ":" + realPath;
    digestWrapper.logger.debug("ha2raw: " + ha2raw);
    md5ha2.update(ha2raw);

    var ha2 = md5ha2.digest('hex'); // TODO check ? params are ok for the uri

    var md5r = crypto.createHash('md5');
    var md5rraw = ha1 + ":" + digestWrapper.nonce + ":" + ncUse + ":" + digestWrapper.cnonce + ":" + digestWrapper.qop + ":" + ha2;
    digestWrapper.logger.debug("md5rraw: " + md5rraw);
    md5r.update(md5rraw);

    var response = md5r.digest('hex');
    options.headers['Authorization']= 'Digest username="' + digestWrapper.username + '", realm="' + digestWrapper.realm + '", nonce="' + digestWrapper.nonce + '", uri="' + options.path + '",' + // TODO check if we remove query ? params from uri
      ' cnonce="' + digestWrapper.cnonce + '", nc=' + ncUse + ', qop="' + digestWrapper.qop + '", response="' + response + '", opaque="' + digestWrapper.opaque + '"';
    digestWrapper.logger.debug("DigestWrapper: Auth header: " + options.headers["Authorization"]);
    
    digestWrapper.logger.debug("DigestWrapper: request options: " + JSON.stringify(options));
    digestWrapper.logger.debug("Calling http request...");
    var finalReq = http.request(options,(callback_opt || noop));
    digestWrapper.logger.debug("Returned from http request.");
    
    // to wrap sending of content by client code after when this request is created
    finalReq.on("end", function(res) {
      digestWrapper.doEnd(res); // NEVER GETS CALLED - EVENT END DOES NOT EXIST ON CLIENTREQUEST
    });  
    finalReq.on('error', function(e) {
      digestWrapper.logger.debug('DigestWrapper: finalReq.error: problem with request: ' + JSON.stringify(e));
      // pass error up
      digestWrapper.emitter.emit("error",e);
    });
    
    digestWrapper.finalReq = finalReq;
    digestWrapper.finaliseRequest();
    
    digestWrapper.logger.debug("DigestWrapper: completed doRequest()");
    
/*
    if ('GET' == options.method) {
      
    } else if ('POST' == options.method) {
      //http.post(options,func);
      // TODO
    } else {
      this.logger.debug("DigestWrapper: HTTP METHOD UNSUPPORTED");
    }*/
  };

  // see if we have a realm and nonce
  if (undefined != this.realm) {
    this.logger.debug("DigestWrapper: Got a Realm");
    doRequest();
  } else {
    this.logger.debug("DigestWrapper: Not got a Realm, wrapping request");

    // do authorization request then call doRequest
    var myopts = {
      host: options.host,
      port: options.port
    }
    
    this.__response = undefined;

    var self = this;
    http.get(myopts,function(res) {
      self.logger.debug("Check: " + res.statusCode);
      res.on('end', function() {
        // check if http 401
        self.logger.debug("DigestWrapper: Got HTTP response: " + res.statusCode);
        // if so, extract WWW-Authenticate header information for later requests
        self.logger.debug("DigestWrapper: Header: www-authenticate: " + res.headers["www-authenticate"]); 
        // E.g. from ML REST API:  Digest realm="public", qop="auth", nonce="5ffb75b7b92c8d30fe2bfce28f024a0f", opaque="b847f531f584350a"

        digestWrapper.nc = 1;
        
        // response may have failed - check response code prior to calling doRequest
        if (403 == res.statusCode) {
          // server does not exist - failed
          var response = new ErrorResponse({statusCode: 403});
          digestWrapper.__response = response;
          digestWrapper.__callback = callback_opt;
          digestWrapper.doEnd(response); // TODO check this works as expected for all requests
          digestWrapper.finaliseRequest();
        } else {

          var auth = res.headers["www-authenticate"];
          var params = parseDigest(auth);
          digestWrapper.nonce = params.nonce;
          digestWrapper.realm = params.realm;
          digestWrapper.qop = params.qop;
          digestWrapper.opaque = params.opaque;
  
          doRequest();
        }
      }); 
      //res.on('close', function() { this.logger.debug("DigestWrapper: CLOSE");});
      //res.on('data',  function() { this.logger.debug("DigestWrapper: DATA");});
    });
  }
  return digestWrapper;
};

DigestWrapper.prototype.write = function(data,encoding) {
  this.writeData += data;
};

DigestWrapper.prototype.on = function(evt,func) {
  this.emitter.on(evt,func);
};

DigestWrapper.prototype.end = function() {
  this.logger.debug("DigestWrapper.end called");
  this.ended = true;
  this.finaliseRequest();
};

// INTERNAL METHODS

DigestWrapper.prototype.finaliseRequest = function() {
  this.logger.debug("DigestWrapper.finaliseRequest called");
  if (this.ended && this.finalReq != undefined){ 
    if (this.writeData != undefined && this.writeData.length > 0) {
      this.logger.debug("DigestWrapper: Sending POST data: " + this.writeData);
      var data = this.writeData;
      this.writeData = undefined; // clear out for next request
      this.finalReq.write(data);
    }
    this.logger.debug("DigestWrapper.calling finalReq.end ");
    this.finalReq.end();
  }
  if (this.ended && this.__response != undefined) {
    this.logger.debug("DigestWrapper.calling callback with response: " + JSON.stringify(this.__response));
    // handle bad requests
    var response = this.__response;
    var cb = this.__callback;
    this.__response = undefined; // clear for next request
    this.__callback = undefined;
    (cb || noop)(response);
  }
};

DigestWrapper.prototype.doEnd = function(res) {
  this.logger.debug("DigestWrapper.doEnd: end Called.");
  this.emitter.emit("end",res);
};

module.exports = function() {
  return new DigestWrapper();
};



var ErrorResponse = function(response) {
  this.response = response;
  this.statusCode = response.statusCode;
  this.emitter = new EventEmitter();
};

ErrorResponse.prototype.on = function(evt,callback) {
  this.emitter.on(evt,callback);
  if (evt == "error") {
    // call it now
    this.emitter.emit(evt,this.response);
  }
};




function parseDigest(header) {  
  return _und(header.substring(7).split(/,\s+/)).reduce(function(obj, s) {
    var parts = s.split('=')
    obj[parts[0]] = parts[1].replace(/"/g, '')
    return obj
    }, {})  
  }

  function padNC(num) {
    var pad = "";
    for (var i = 0;i < (8 - ("" + num).length);i++) {
      pad += "0";
    }
    var ret = pad + num;
    //this.logger.debug("pad: " + ret);
    return ret;
  }