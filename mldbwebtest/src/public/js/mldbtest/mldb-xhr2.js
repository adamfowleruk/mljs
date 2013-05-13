
var m = window.mldb || {};
var b = m.bindings || {};
m.bindings = b;
b.xhr2 = function() {
  // constructor
  /*$.ajaxSetup({
    contentType : 'application/json',
    processData : false
  });*/
};

b.xhr2.prototype.supportsAdmin = function() {
  return false; // can only access our own REST HTTP Server
};

b.xhr2.prototype.configure = function(username,password,logger) {
  this.username = username;
  this.password = password;
  this.logger = logger;
};

b.xhr2.prototype.request = function(reqname,options,content,callback) {
  var self = this;
  /*
  var data = null;
  if (undefined != content && null != content) {
    console.log("content typeof: " + (typeof content));
    if ("ArrayBuffer" == typeof content) {
      data = content;
    } else if ("object" == typeof content) {
      data = JSON.stringify(content);
    } else if ("string" == typeof content) {
      data = content;
    }
  }*/
  var ct = options.contentType;
  if (undefined == ct) {
    ct = "application/json";
  }
  /*
  var dataType = "json";
  if ("application/xml" == ct) {
    dataType = "xml";
  } else if ("text/plan" == ct) {
    dataType = "text";
  }*/
  
  // binary data hack XHR2
  //if (null != content && undefined != content && -1 != options.path.indexOf("&format=binary")) {
    try {
    var xhr = new XMLHttpRequest();
    xhr.open(options.method, options.path, true); // TODO include username and password too
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    xhr.setRequestHeader('Content-Type', ct);
    
    xhr.onload = function(e) {
      var res = {};
      res.inError = false;
      res.statusCode = xhr.status;
      
      console.log("XHR responseXML: " + xhr.responseXML);
      console.log("XHR responseText: " + xhr.responseText);
      console.log("XHR response: " + xhr.response);
      console.log("XHR typeof responseXML: " + typeof xhr.responseXML);
      console.log("XHR typeof responseText: " + typeof xhr.responseText);
      console.log("XHR typeof response: " + typeof xhr.response);
      
      // TODO handle 304 etc responses (don't assume a non 200 is a 400/500)
      
     if (("" + xhr.status).indexOf("2")==0) {
        // success
      var wibble;
      //if (undefined != content && null != content) {
        self.logger.debug("Data type: " + (typeof content));
        self.logger.debug("Data value: " + content);
        var xml = xhr.responseXML;
        if (undefined != xml) {
          res.format = "xml";
          res.doc = xml;
        } else {
          self.logger.debug("response text: " + xhr.responseText);
          try {
            self.logger.debug("parsing xhr.responseText");
            wibble = JSON.parse(xhr.responseText); // successes are JSON text (needs parsing)
            res.format = "json";
            self.logger.debug("js raw: " + wibble);
            self.logger.debug("json str: " + JSON.stringify(wibble));
            self.logger.debug("Parsed JSON successfully");
          } catch (ex) {
            self.logger.debug("JSON parsing failed. Trying XML parsing.");
            // try XML conversion now
            try {
              wibble = textToXML(xhr.responseText);
              res.format = "xml";
            } catch (ex2) {
              // do nothing - likely a blank document
              self.logger.debug("Not JSON or XML. Exception: " + ex2);
            }
          }
        }
      //}
      res.doc = wibble;
      
    } else {
      //failure
      console.log("xhr2 error");
      // get failure code to determine what to do next
      //var res = {};
      if (xhr.status == 303) {
        res.location = xhr.getResponseHeader("location"); // for newly created document / upload
      }
      res.inError = true;
      res.doc = xhr.responseXML; // failures are returned in XML
      if (undefined == res.doc) {
        res.doc = xhr.responseText;
        res.format = "text"; // TODO handle binary content
        try {
          self.logger.debug("parsing xhr.responseText");
          var wibble = JSON.parse(xhr.responseText); // successes are JSON text (needs parsing)
          res.format = "json";
          self.logger.debug("js raw: " + wibble);
          self.logger.debug("json str: " + JSON.stringify(wibble));
          self.logger.debug("Parsed JSON successfully");
          res.doc = wibble;
        } catch (ex) {
          // do nothing - likely a blank XML document
          self.logger.debug("Exception: " + ex);
        }
      } else {
        res.format = "xml";
      }
      res.details = res.doc;
      if ("string" == typeof res.details) { // TODO add response content type check (document could be plain text!)
        res.details = textToXML(res.details);
      }
      if (undefined != res.details.nodeType) { // must be an XML document
        res.details = xmlToJson(res.details); // convert text in res.doc to XML first
      } 
    }
      //self.logger.debug("json final str: " + JSON.stringify(res.doc));
      // now supports XML returned too
      callback(res);
    };
    var contentText = "";
    if (typeof content == "string") {
      contentText = content;
    } else if (ct == "application/xml") {
      contentText = (new XMLSerializer()).serializeToString(content);
    } else if (ct == "application/json") {
      // json
      contentText = JSON.stringify(content);
    } else {
      // binary, file, etc.
      contextText = content;
    }
    self.logger.debug("Sending content: " + contentText);
    xhr.send(contentText);
    
  } catch (ex) {
    self.logger.debug("EXCEPTION in XHR2 send() call: " + ex);
    var res = {inError:true,details: ex};
    callback(res);
  }
  
};

