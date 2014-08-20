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
var http = require('http'),
    crypto = require('crypto'),
    _und = require('underscore'),
    noop = require("./noop"),
    winston = require('winston');

var EventEmitter = require('events').EventEmitter;

/**
 * Wraps a HTTP request to the ML server for a particular user. Not to be instantiated directly.
 *
 * @constructor
 */
var DigestWrapper = function(){
  this.configure();
};

/**
 * Configures a HTTP Digest wrapper.
 */
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
  this.ended = false;
};

/**
 * Performs a http request to the server
 */
DigestWrapper.prototype.request = function(options, callback_opt) {
  //var cnonce = Math.floor(Math.random()*100000000);
  //this.logger.debug("DigestWrapper: in request() for " + options.host + ":" + options.port);

  var digestWrapper = this;
  var reqWrapper = new RequestWrapper(this.logger);

  var doRequest = function() {
    var ncUse = padNC(digestWrapper.nc);
    digestWrapper.nc++;
    var realPath = options.path;
    //digestWrapper.logger.debug("DigestWrapper: ----------------------------------------");
    //digestWrapper.logger.debug("DigestWrapper: options.method: '" + options.method + "'");
    //digestWrapper.logger.debug("DigestWrapper: options.hostname: '" + options.host + "'");
    //digestWrapper.logger.debug("DigestWrapper: options.port: '" + options.port + "'");
    //digestWrapper.logger.debug("DigestWrapper: options.path: '" + options.path + "'");
    //digestWrapper.logger.debug("DigestWrapper: options.contentType: '" + options.contentType + "'");
    //digestWrapper.logger.debug("DigestWrapper: path: '" + realPath + "'");
    //digestWrapper.logger.debug("DigestWrapper: cnonce: '" + digestWrapper.cnonce + "'");
    //digestWrapper.logger.debug("DigestWrapper: nonce: '" + digestWrapper.nonce + "'");
    //digestWrapper.logger.debug("DigestWrapper: nc: '" + ncUse + "'");
    //digestWrapper.logger.debug("DigestWrapper: realm: '" + digestWrapper.realm + "'");
    //digestWrapper.logger.debug("DigestWrapper: qop: '" + digestWrapper.qop + "'");
    //digestWrapper.logger.debug("DigestWrapper: opaque: '" + digestWrapper.opaque + "'");
    /*var h = "Headers: ";
    if (undefined == options.headers) {
      h += "indefined";
    } else {
    }*/

    // contentType header usage
    if (undefined != options.contentType) {
      options.headers["Content-type"] = options.contentType;
    }

    // See Client Request at http://en.wikipedia.org/wiki/Digest_access_authentication
    var md5ha1 = crypto.createHash('md5');
    var ha1raw = digestWrapper.username + ":" + digestWrapper.realm + ":" + digestWrapper.password;
    //digestWrapper.logger.debug("DigestWrapper: ha1raw: " + ha1raw);
    md5ha1.update(ha1raw);
    var ha1 = md5ha1.digest('hex');

    var md5ha2 = crypto.createHash('md5');
    var ha2raw = options.method + ":" + realPath;
    //digestWrapper.logger.debug("DigestWrapper: ha2raw: " + ha2raw);
    md5ha2.update(ha2raw);

    var ha2 = md5ha2.digest('hex'); // TODO check ? params are ok for the uri

    var md5r = crypto.createHash('md5');
    var md5rraw = ha1 + ":" + digestWrapper.nonce + ":" + ncUse + ":" + digestWrapper.cnonce + ":" + digestWrapper.qop + ":" + ha2;
    //digestWrapper.logger.debug("DigestWrapper: md5rraw: " + md5rraw);
    md5r.update(md5rraw);

    var response = md5r.digest('hex');
    options.headers['Authorization']= 'Digest username="' + digestWrapper.username + '", realm="' + digestWrapper.realm + '", nonce="' + digestWrapper.nonce + '", uri="' + options.path + '",' + // TODO check if we remove query ? params from uri
      ' cnonce="' + digestWrapper.cnonce + '", nc=' + ncUse + ', qop="' + digestWrapper.qop + '", response="' + response + '", opaque="' + digestWrapper.opaque + '"';
    //digestWrapper.logger.debug("DigestWrapper: Auth header: " + options.headers["Authorization"]);

    //digestWrapper.logger.debug("DigestWrapper: request options: " + JSON.stringify(options));
    //digestWrapper.logger.debug("DigestWrapper: Calling http request...");
    var finalReq = http.request(options,(callback_opt || noop));
    //digestWrapper.logger.debug("DigestWrapper: Returned from http request.");

    // to wrap sending of content by client code after when this request is created
    finalReq.on("end", function(res) {
      reqWrapper.doEnd(res); // NEVER GETS CALLED - EVENT END DOES NOT EXIST ON CLIENTREQUEST
    });
    finalReq.on('error', function(e) {
      //digestWrapper.logger.debug('DigestWrapper: finalReq.error: problem with request: ' + JSON.stringify(e));
      // pass error up
      reqWrapper.error(e);
    });

    reqWrapper.finalReq = finalReq;
    reqWrapper.finaliseRequest();

    //digestWrapper.logger.debug("DigestWrapper: completed doRequest()");

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
    //this.logger.debug("DigestWrapper: Got a Realm");
    doRequest();
  } else {
    //this.logger.debug("DigestWrapper: Not got a Realm, wrapping request");

    // do authorization request then call doRequest
    var myopts = {
      host: options.host,
      port: options.port
    }

    var self = this;
    var get = http.get(myopts,function(res) {
      //self.logger.debug("Check: " + res.statusCode);
      res.on('end', function() {
        // check if http 401
        //self.logger.debug("DigestWrapper: Got HTTP response: " + res.statusCode);
        // if so, extract WWW-Authenticate header information for later requests
        //self.logger.debug("DigestWrapper: Header: www-authenticate: " + res.headers["www-authenticate"]);
        // E.g. from ML REST API:  Digest realm="public", qop="auth", nonce="5ffb75b7b92c8d30fe2bfce28f024a0f", opaque="b847f531f584350a"

        digestWrapper.nc = 1;

        // response may have failed - check response code prior to calling doRequest
        if (403 == res.statusCode) {
          // server does not exist - failed
          var response = new ErrorResponse({statusCode: 403});
          reqWrapper.__response = response;
          reqWrapper.__callback = callback_opt;
          reqWrapper.doEnd(response); // TODO check this works as expected for all requests
          reqWrapper.finaliseRequest();
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
      res.on('readable', function() {
        //self.logger.debug("response read");
        // do nothing with the response
        res.read();
      });
      //res.on('close', function() { this.logger.debug("DigestWrapper: CLOSE");});
      //res.on('data',  function() { this.logger.debug("DigestWrapper: DATA");});
    });

    get.on("error",function(e) {
      reqWrapper.error(e);
    });
  }
  return reqWrapper;
};


module.exports = function() {
  return new DigestWrapper();
};

var RequestWrapper = function(logger) {
  this.logger = logger;
  this.writeData = "";
  this.emitter = new EventEmitter();
  this.ended = false;
  this.finalReq = undefined;
  this.__response = undefined;
  this.__callback = undefined;
};

RequestWrapper.prototype.write = function(data,encoding) {
  this.writeData += data;
};

RequestWrapper.prototype.on = function(evt,func) {
  this.emitter.on(evt,func);
};

RequestWrapper.prototype.end = function() {
  //this.logger.debug("DigestWrapper.end called");
  this.ended = true;
  this.finaliseRequest();
};

RequestWrapper.prototype.error = function(e) {
  //this.logger.debug("DigestWrapper.error called: " + e);
  this.ended = true;
  this.emitter.emit("error",e);
  /*this.finalReq = undefined;
  this.__response = e;
  this.finaliseRequest();*/
};

RequestWrapper.prototype.finaliseRequest = function() {
  //this.logger.debug("DigestWrapper.finaliseRequest called");
  if (this.ended && this.finalReq != undefined){
    if (this.writeData != undefined && this.writeData.length > 0) {
      //this.logger.debug("DigestWrapper: Sending POST data: " + this.writeData);
      var data = this.writeData;
      this.writeData = undefined; // clear out for next request
      this.finalReq.write(data);
    }
    //this.logger.debug("DigestWrapper.calling finalReq.end ");
    this.finalReq.end();
  }
  if (this.ended && this.__response != undefined) {
    //this.logger.debug("DigestWrapper.calling callback with response: " + JSON.stringify(this.__response));
    // handle bad requests
    var response = this.__response;
    var cb = this.__callback;
    this.__response = undefined; // clear for next request
    this.__callback = undefined;
    (cb || noop)(response);
  }
};

RequestWrapper.prototype.doEnd = function(res) {
  //this.logger.debug("DigestWrapper.doEnd: end Called.");
  this.emitter.emit("end",res);
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



/**
 * A function to split a Digest auth request header in to its constituent parts.
 *
 * @param {string} header - the raw http auth header to parse
 */
function parseDigest(header) {
  return _und(header.substring(7).split(/,\s+/)).reduce(function(obj, s) {
    var parts = s.split('=')
    obj[parts[0]] = parts[1].replace(/"/g, '')
    return obj
    }, {})
  };

/**
 * Functions to pad the nc value. E.g. turns '1' in to '00000001'.
 */
  function padNC(num) {
    var pad = "";
    for (var i = 0;i < (8 - ("" + num).length);i++) {
      pad += "0";
    }
    var ret = pad + num;
    //this.logger.debug("pad: " + ret);
    return ret;
  };
