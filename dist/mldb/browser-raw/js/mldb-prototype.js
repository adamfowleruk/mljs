
var m = window.mldb || {};
var b = m.bindings || {};
b.prototypejs = function() {
  // constructor
};

b.prototypejs.supportsAdmin = function() {
  return false; // can only access our own REST HTTP Server
};

b.prototypejs.configure = function(username,password,logger) {
  this.logger = logger;
};

b.prototypejs.request = function(reqname,options,content,callback) {
  // pass on to prototypejs's Ajax.Request call
  Ajax.Request(options.path,{
    method: options.method.toLowerCase(),
    contentType: "application/json",
    postBody: content,
    onSuccess: function(response) {
      var res = {};
      res.inError = false;
      res.statusCode = response.status;
      res.doc = response.responseJSON; // successes are JSON
      // TODO support XML returned too
      callback(res);
    } , onFailure: function(response) {
      // get failure code to determine what to do next
      var res = {};
      if (response.status == 303) {
        res.location = response.getHeader("location"); // for newly created document / upload
      }
      res.inError = true;
      res.statusCode = response.status;
      res.doc = response.responseXML; // failures are returned in XML
      callback(res);
    }
  });
  
};

