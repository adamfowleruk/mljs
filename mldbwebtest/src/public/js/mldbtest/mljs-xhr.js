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
b.xhr = function() {
  // constructor
};

if (typeof XMLHttpRequest === "undefined") {
  XMLHttpRequest = function () {
    try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
    catch (e) {}
    try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); }
    catch (e) {}
    try { return new ActiveXObject("Microsoft.XMLHTTP"); }
    catch (e) {}
    // Microsoft.XMLHTTP points to Msxml2.XMLHTTP and is redundant
    throw new Error("This browser does not support XMLHttpRequest.");
  };
}

b.xhr.supportsAdmin = function() {
  return false; // can only access our own REST HTTP Server
};

b.xhr.configure = function(username,password,logger) {
  this.logger = logger;
  this.username = username;
  this.password = password;
};

b.xhr.request = function(reqname,options,content,callback) {
  
  var xmlhttp = new XmlHttpRequest();
  
  xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState === 4){
      if (xmlhttp.status == 200) {
        // success
        var res = {};
        res.inError = false;
        res.statusCode = xmlhttp.status;
        res.doc = JSON.parse(xmlhttp.responseText); // successes are JSON
        // TODO support XML returned too
        callback(res);
      } else {
        // failure
        // get failure code to determine what to do next
        var res = {};
        if (xmlhttp.status == 303) {
          res.location = xmlhttp.getHeader("location"); // for newly created document / upload
        }
        res.inError = true;
        res.statusCode = xmlhttp.status;
        res.doc = xmlhttp.responseText; // failures are returned in XML
        callback(res);
      }
    }
  };
  xmlhttp.open(options.method, options.path, true,this.username,this.password);
  xmlhttp.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xmlhttp.send(content);  
};

