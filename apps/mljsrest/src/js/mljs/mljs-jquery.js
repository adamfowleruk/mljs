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
var m = window.mljs || {};
var b = m.bindings || {};
m.bindings = b;
b.jquery = function() {
  // constructor
  $.ajaxSetup({
    contentType : 'application/json',
    processData : false
  });
};

b.jquery.prototype.supportsAdmin = function() {
  return false; // can only access our own REST HTTP Server
};

b.jquery.prototype.configure = function(username,password,logger) {
  this.logger = logger;
};

b.jquery.prototype.request = function(reqname,options,content,callback) {
  var self = this;
  
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
  }
  var ct = options.contentType;
  if (undefined == ct) {
    ct = "application/json";
  }
  
  // binary data hack XHR2
  if (null != content && undefined != content && -1 != options.path.indexOf("&format=binary")) {
    var xhr = new XMLHttpRequest();
    xhr.open(options.method, options.path, true);
    xhr.onload = function(e) {
      var res = {};
      res.inError = false;
      res.statusCode = xhr.status;
      var wibble;
      if (undefined != data && null != data) {
        self.logger.debug("Data type: " + (typeof data));
        self.logger.debug("Data value: " + data);
        var xml = xhr.responseXML;
        if (undefined != xml) {
          res.format = "xml";
          res.doc = xml;
        } else {
          self.logger.debug("response text: " + xhr.responseText);
          try {
            self.logger.debug("parsing xhr.responseText");
            wibble = $.parseJSON(xhr.responseText); // successes are JSON text (needs parsing)
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
      }
      res.doc = wibble;
      //self.logger.debug("json final str: " + JSON.stringify(res.doc));
      // now supports XML returned too
      callback(res);
    };
    xhr.send(content);
  } else {
  
  var dataType = "json";
  if ("application/xml" == ct) {
    dataType = "xml";
  } else if ("text/plan" == ct) {
    dataType = "text";
  }
  
  $.ajax(options.path,{
    contentType: ct,
    type: options.method.toLowerCase(), 
    data: data,
    processData: false,
    dataType: dataType,
    converters: {"* text": window.String, "text html": true, "text json": window.String, "text xml": jQuery.parseXML},
    success: function(data,textStatus,xhr) {
      console.log("jquery success");
      var res = {};
      res.inError = false;
      res.statusCode = xhr.status;
      var wibble;
      if (undefined != data && null != data) {
        self.logger.debug("Data type: " + (typeof data));
        self.logger.debug("Data value: " + data);
        var xml = xhr.responseXML;
        if (undefined != xml) {
          res.format = "xml";
          res.doc = xml;
        } else {
          self.logger.debug("response text: " + xhr.responseText);
          try {
            self.logger.debug("parsing xhr.responseText");
            wibble = $.parseJSON(xhr.responseText); // successes are JSON text (needs parsing)
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
      }
      res.doc = wibble;
      //self.logger.debug("json final str: " + JSON.stringify(res.doc));
      // now supports XML returned too
      callback(res);
    } , error: function(xhr,textStatus,errorThrown) {
      console.log("jquery error");
      // get failure code to determine what to do next
      var res = {};
      if (xhr.status == 303) {
        res.location = xhr.getResponseHeader("location"); // for newly created document / upload
      }
      res.inError = true;
      res.statusCode = xhr.status;
      res.doc = xhr.responseXML; // failures are returned in XML
      if (undefined == res.doc) {
        res.doc = xhr.responseText;
        res.format = "text"; // TODO handle binary content
        try {
          self.logger.debug("parsing xhr.responseText");
          var wibble = $.parseJSON(xhr.responseText); // successes are JSON text (needs parsing)
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
      callback(res);
    }
  });
 } 
  
};

