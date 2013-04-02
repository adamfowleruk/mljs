
var m = window.mldb || {};
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
    data = JSON.stringify(content);
  }
  $.ajax(options.path,{
    contentType: "application/json",
    type: options.method.toLowerCase(), 
    data: data,
    dataType: 'json',
    success: function(data,textStatus,xhr) {
      var res = {};
      res.inError = false;
      res.statusCode = xhr.status;
      var wibble;
      if (undefined != data && null != data) {
        self.logger.debug("Data type: " + (typeof data));
        self.logger.debug("Data value: " + data);
        self.logger.debug("response text: " + xhr.responseText);
        try {
          self.logger.debug("parsing xhr.responseText");
          wibble = $.parseJSON(xhr.responseText); // successes are JSON text (needs parsing)
          self.logger.debug("js raw: " + wibble);
          self.logger.debug("json str: " + JSON.stringify(wibble));
          self.logger.debug("Parsed JSON successfully");
        } catch (ex) {
          // do nothing - likely a blank XML document
          self.logger.debug("Exception: " + ex);
        }
      }
      res.doc = wibble;
      self.logger.debug("json final str: " + JSON.stringify(res.doc));
      // TODO support XML returned too
      callback(res);
    } , error: function(xhr,textStatus,errorThrown) {
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
      }
      res.doc = textToXML(res.doc);
      res.details = xmlToJson(res.doc); // convert text in res.doc to XML first
      callback(res);
    }
  });
  
  
};

