var http = require('http'),
    crypto = require('crypto'),
    _und = require('underscore'),
    noop = require("./noop");

/**
* Wraps a HTTP request to the ML server for a particular user
* - Unknown bug that causes auth to fail. Using BasicWrapper instead
*/
var DigestWrapper = function(username,password) {
  var nc = 1;
  this.request=function(options, callback_opt) {
    //var cnonce = Math.floor(Math.random()*100000000);

    var cnonce = "0a4f113b";
    var nonce = undefined;
    var opaque = undefined;
    var realm = undefined;
    var qop = undefined;

    var doRequest = function() {
      nc = nc++;
      var ncUse = padNC(nc);
      console.log("options.method: '" + options.method + "'");
      console.log("options.hostname: '" + options.hostname + "'");
      console.log("options.port: '" + options.port + "'");
      console.log("options.path: '" + options.path + "'");
      console.log("cnonce: '" + cnonce + "'");
      console.log("nonce: '" + nonce + "'");
      console.log("nc: '" + ncUse + "'");
      console.log("realm: '" + realm + "'");
      console.log("qop: '" + qop + "'");
      console.log("opaque: '" + opaque + "'");

      // See Client Request at http://en.wikipedia.org/wiki/Digest_access_authentication
      var md5ha1 = crypto.createHash('md5');
      var ha1raw = username + ":" + realm + ":" + password;
      console.log("ha1raw: " + ha1raw);
      md5ha1.update(ha1raw);
      var ha1 = md5ha1.digest('hex');

      var md5ha2 = crypto.createHash('md5');
      var ha2raw = options.method + ":" + options.path;
      console.log("ha2raw: " + ha2raw);
      md5ha2.update(ha2raw);

      var ha2 = md5ha2.digest('hex'); // TODO check ? params are ok for the uri

      var md5r = crypto.createHash('md5');
      var md5rraw = ha1 + ":" + nonce + ":" + ncUse + ":" + cnonce + ":auth:" + ha2;
      console.log("md5rraw: " + md5rraw);
      md5r.update(md5rraw);

      var response = md5r.digest('hex');
      options.headers = { 'Authorization' : 'Digest username="' + username + '", realm="' + realm + '", uri="' + options.path + '",' + // TODO check if we remove query ? params from uri
      ' qop="auth", nc=' + ncUse + ', cnonce="' + cnonce + '", response="' + response + '", opaque="' + opaque + '"'};
      console.log("DigestWrapper: Auth header: " + options.headers["Authorization"]);

      if ('GET' == options.method) {
        http.get(options,(callback_opt || noop));
      } else if ('POST' == options.method) {
        //http.post(options,func);
        // TODO
      } else {
        console.log("DigestWrapper: HTTP METHOD UNSUPPORTED");
      }
    };

    // see if we have a realm and nonce
    if (undefined != realm) {
      console.log("DigestWrapper: Got a Realm");
      doRequest();
    } else {
      console.log("DigestWrapper: Not got a Realm, wrapping request");

      // do authorization request then call doRequest
      var myopts = {
        host: options.host,
        port: options.port
      }

      http.get(myopts,function(res) {
        console.log("Check: " + res.statusCode);
        res.on('end', function() {
          // check if http 401
          console.log("DigestWrapper: Got HTTP response: " + res.statusCode);
          // if so, extract WWW-Authenticate header information for later requests
          console.log("DigestWrapper: Header: www-authenticate: " + res.headers["www-authenticate"]); 
          // E.g. from ML REST API:  Digest realm="public", qop="auth", nonce="5ffb75b7b92c8d30fe2bfce28f024a0f", opaque="b847f531f584350a"

          nc = 1;

          var auth = res.headers["www-authenticate"];
          var params = parseDigest(auth);
          nonce = params.nonce;
          realm = params.realm;
          qop = params.qop;
          opaque = params.opaque;

          doRequest();
        }); 
        //res.on('close', function() { console.log("DigestWrapper: CLOSE");});
        //res.on('data',  function() { console.log("DigestWrapper: DATA");});
      });
    }
  };
};

module.exports.init = function(user,pass) {
  return new DigestWrapper(user,pass);
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