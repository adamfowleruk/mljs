
var m = window.mldb || {};
var b = m.bindings || {};
b.jquery = function() {
  // constructor
};

b.jquery.supportsAdmin = function() {
  return false; // can only access our own REST HTTP Server
};

b.jquery.configure = function(username,password,logger) {
  this.logger = logger;
};

b.jquery.request = function(reqname,options,content,callback) {
  
  $.ajax(options.path,{
    contentType: "application/json",
    type: options.method.toLowerCase(), 
    success: function(data,textStatus,xhr) {
      var res = {};
      res.inError = false;
      res.statusCode = xhr.status;
      res.doc = JSON.parse(data); // successes are JSON text (needs parsing)
      // TODO support XML returned too
      callback(res);
    } , error: function(xhr,textStatus,errorThrown) {
      // get failure code to determine what to do next
      var res = {};
      if (response.status == 303) {
        res.location = xhr.getResponseHeader("location"); // for newly created document / upload
      }
      res.inError = true;
      res.statusCode = xhr.status;
      res.doc = xhr.responseXML; // failures are returned in XML
      callback(res);
    }
  });
  
  
};

