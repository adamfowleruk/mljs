var http = require('http'),
    crypto = require('crypto'),
    _und = require('underscore'),
    noop = require("./noop");

var EventEmitter = require('events').EventEmitter;

/**
* Wraps a HTTP request to the ML server for a particular user
* - Unknown bug that causes auth to fail. Using BasicWrapper instead
*/
var DigestWrapper = function(){
  this.emitter = new EventEmitter();
  this.configure();
};

DigestWrapper.prototype.configure = function(username,password) {
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
  
  this.writeData = "";
  this.ended = false;
  this.finalReq = undefined;
  
  var digestWrapper = this;

  var doRequest = function() {
    var ncUse = padNC(digestWrapper.nc);
    digestWrapper.nc++;
    var realPath = options.path;
    console.log("----------------------------------------","debug");
    console.log("options.method: '" + options.method + "'","debug");
    console.log("options.hostname: '" + options.hostname + "'","debug");
    console.log("options.port: '" + options.port + "'","debug");
    console.log("options.path: '" + options.path + "'","debug");
    console.log("path: '" + realPath + "'","debug");
    console.log("cnonce: '" + digestWrapper.cnonce + "'","debug");
    console.log("nonce: '" + digestWrapper.nonce + "'","debug");
    console.log("nc: '" + ncUse + "'","debug");
    console.log("realm: '" + digestWrapper.realm + "'","debug");
    console.log("qop: '" + digestWrapper.qop + "'","debug");
    console.log("opaque: '" + digestWrapper.opaque + "'","debug");

    // See Client Request at http://en.wikipedia.org/wiki/Digest_access_authentication
    var md5ha1 = crypto.createHash('md5');
    var ha1raw = digestWrapper.username + ":" + digestWrapper.realm + ":" + digestWrapper.password;
    console.log("ha1raw: " + ha1raw,"debug");
    md5ha1.update(ha1raw);
    var ha1 = md5ha1.digest('hex');

    var md5ha2 = crypto.createHash('md5');
    var ha2raw = options.method + ":" + realPath;
    console.log("ha2raw: " + ha2raw,"debug");
    md5ha2.update(ha2raw);

    var ha2 = md5ha2.digest('hex'); // TODO check ? params are ok for the uri

    var md5r = crypto.createHash('md5');
    var md5rraw = ha1 + ":" + digestWrapper.nonce + ":" + ncUse + ":" + digestWrapper.cnonce + ":" + digestWrapper.qop + ":" + ha2;
    console.log("md5rraw: " + md5rraw,"debug");
    md5r.update(md5rraw);

    var response = md5r.digest('hex');
    options.headers = { 'Authorization' : 'Digest username="' + digestWrapper.username + '", realm="' + digestWrapper.realm + '", nonce="' + digestWrapper.nonce + '", uri="' + options.path + '",' + // TODO check if we remove query ? params from uri
      ' cnonce="' + digestWrapper.cnonce + '", nc=' + ncUse + ', qop="' + digestWrapper.qop + '", response="' + response + '", opaque="' + digestWrapper.opaque + '"'};
    console.log("DigestWrapper: Auth header: " + options.headers["Authorization"],"debug");
    
    var finalReq = http.request(options,(callback_opt || noop));
    
    finalReq.on("end", function(res) {
      digestWrapper.doEnd(res);
    });
    
    digestWrapper.finalReq = finalReq;
    digestWrapper.finaliseRequest();
/*
    if ('GET' == options.method) {
      
    } else if ('POST' == options.method) {
      //http.post(options,func);
      // TODO
    } else {
      console.log("DigestWrapper: HTTP METHOD UNSUPPORTED");
    }*/
  };

  // see if we have a realm and nonce
  if (undefined != this.realm) {
    console.log("DigestWrapper: Got a Realm","debug");
    doRequest();
  } else {
    console.log("DigestWrapper: Not got a Realm, wrapping request","debug");

    // do authorization request then call doRequest
    var myopts = {
      host: options.host,
      port: options.port
    }

    http.get(myopts,function(res) {
      console.log("Check: " + res.statusCode,"debug");
      res.on('end', function() {
        // check if http 401
        console.log("DigestWrapper: Got HTTP response: " + res.statusCode,"debug");
        // if so, extract WWW-Authenticate header information for later requests
        console.log("DigestWrapper: Header: www-authenticate: " + res.headers["www-authenticate"],"debug"); 
        // E.g. from ML REST API:  Digest realm="public", qop="auth", nonce="5ffb75b7b92c8d30fe2bfce28f024a0f", opaque="b847f531f584350a"

        digestWrapper.nc = 1;

        var auth = res.headers["www-authenticate"];
        var params = parseDigest(auth);
        digestWrapper.nonce = params.nonce;
        digestWrapper.realm = params.realm;
        digestWrapper.qop = params.qop;
        digestWrapper.opaque = params.opaque;

        doRequest();
      }); 
      //res.on('close', function() { console.log("DigestWrapper: CLOSE");});
      //res.on('data',  function() { console.log("DigestWrapper: DATA");});
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
  this.ended = true;
  this.finaliseRequest();
};

// INTERNAL METHODS

DigestWrapper.prototype.finaliseRequest = function() {
  if (this.ended && this.finalReq != undefined){ 
    if (this.writeData != undefined && this.writeData.length > 0) {
      this.finalReq.write(this.writeData);
    }
    this.finalReq.end();
  }
};

DigestWrapper.prototype.doEnd = function(res) {
  this.emitter.emit("end",res);
};

module.exports = function() {
  return new DigestWrapper();
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
    //console.log("pad: " + ret);
    return ret;
  }