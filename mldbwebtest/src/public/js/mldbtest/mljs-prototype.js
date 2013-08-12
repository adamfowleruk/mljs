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

